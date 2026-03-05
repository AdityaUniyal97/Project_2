import { Router } from "express";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { Submission, toSafeSubmission } from "../models/Submission";

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

    if (submission.status !== "submitted") {
      response.status(409).json({ message: "Only submitted submissions can start review." });
      return;
    }

    submission.status = "queued";
    submission.reviewStartedAt = new Date();
    submission.reviewCompletedAt = null;
    submission.aiScore = null;
    submission.aiSummary = null;
    submission.aiFlags = [];
    await submission.save();

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
    });
  },
);

export default reviewRouter;
