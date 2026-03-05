import { Router } from "express";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { Submission, toSafeSubmission } from "../models/Submission";
import { processReview } from "../services/reviewWorker.service";

const reviewRouter = Router();

function canAccessSubmission(userId: string, role: string, ownerId: string) {
  if (role === "admin") return true;
  return userId === ownerId;
}

reviewRouter.post(
  "/start/:submissionId",
  requireAuth,
  requireRole(["student", "admin"]),
  async (request, response) => {
    await connectToDatabase();

    if (!request.user) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    const { submissionId } = request.params;
    if (!isValidObjectId(submissionId)) {
      response.status(400).json({ message: "Invalid submission id." });
      return;
    }

    const submission = await Submission.findById(submissionId).exec();
    if (!submission) {
      response.status(404).json({ message: "Submission not found." });
      return;
    }

    if (!canAccessSubmission(request.user.userId, request.user.role, String(submission.ownerId))) {
      response.status(403).json({ message: "Access denied." });
      return;
    }

    const allowedForReview = ["submitted", "completed", "failed"];
    if (!allowedForReview.includes(submission.status)) {
      response.status(409).json({ message: "Review can only be started for submitted, completed, or failed submissions." });
      return;
    }

    submission.status = "queued";
    submission.reviewStartedAt = new Date();
    submission.reviewCompletedAt = null;
    submission.aiScore = null;
    submission.aiSummary = null;
    submission.aiFlags = [];
    submission.set("aiRiskLevel", null);
    submission.set("aiRecommendation", null);
    submission.set("aiConfidence", null);
    submission.set("aiViva", []);
    submission.set("aiChallenge", null);
    submission.set("aiEvidence", null);
    await submission.save();

    // Fire-and-forget: start AI processing in background
    processReview(String(submission._id)).catch((err) =>
      console.error("[review] background processing error:", err),
    );

    response.status(200).json({ submission: toSafeSubmission(submission) });
  },
);

reviewRouter.get(
  "/status/:submissionId",
  requireAuth,
  requireRole(["student", "admin"]),
  async (request, response) => {
    await connectToDatabase();

    if (!request.user) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    const { submissionId } = request.params;
    if (!isValidObjectId(submissionId)) {
      response.status(400).json({ message: "Invalid submission id." });
      return;
    }

    const submission = await Submission.findById(submissionId).exec();
    if (!submission) {
      response.status(404).json({ message: "Submission not found." });
      return;
    }

    if (!canAccessSubmission(request.user.userId, request.user.role, String(submission.ownerId))) {
      response.status(403).json({ message: "Access denied." });
      return;
    }

    response.status(200).json({
      status: submission.status,
      aiScore: submission.aiScore ?? null,
      aiSummary: submission.aiSummary ?? null,
      aiFlags: submission.aiFlags ?? [],
      aiRiskLevel: submission.get("aiRiskLevel") ?? null,
      aiRecommendation: submission.get("aiRecommendation") ?? null,
      aiConfidence: submission.get("aiConfidence") ?? null,
      aiViva: submission.get("aiViva") ?? [],
      aiChallenge: submission.get("aiChallenge") ?? null,
      aiEvidence: submission.get("aiEvidence") ?? null,
      reviewStartedAt: submission.reviewStartedAt ? submission.reviewStartedAt.toISOString() : null,
      reviewCompletedAt: submission.reviewCompletedAt ? submission.reviewCompletedAt.toISOString() : null,
    });
  },
);

/* ──── Live Coding Challenge Execution ──── */

const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? "http://localhost:8100";

reviewRouter.post(
  "/challenge/execute",
  requireAuth,
  requireRole(["student", "admin"]),
  async (request, response) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const studentCode = typeof body.student_code === "string" ? body.student_code : "";
    const language = typeof body.language === "string" ? body.language : "";
    const challengeId = typeof body.challenge_id === "string" ? body.challenge_id : "";
    const testCases = Array.isArray(body.test_cases) ? body.test_cases : [];

    if (!studentCode.trim()) {
      response.status(400).json({ success: false, errors: "No code submitted." });
      return;
    }
    if (!language.trim()) {
      response.status(400).json({ success: false, errors: "Language is required." });
      return;
    }

    try {
      const engineResponse = await fetch(`${AI_ENGINE_URL}/execute-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challengeId,
          student_code: studentCode,
          language,
          test_cases: testCases,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      const data = await engineResponse.json();
      response.status(engineResponse.status).json(data);
    } catch (err) {
      console.error("[challenge] execution error:", err);
      response.status(500).json({
        success: false,
        errors: "Challenge execution service unavailable.",
        verdict: "ERROR",
      });
    }
  },
);

export default reviewRouter;
