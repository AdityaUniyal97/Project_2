import { Router } from "express";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { Submission, toSafeSubmission } from "../models/Submission";

const submissionsRouter = Router();

const GITHUB_REPO_PREFIX = "https://github.com/";

function parseCreatePayload(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description =
    typeof payload.description === "string" && payload.description.trim()
      ? payload.description.trim()
      : undefined;
  const repoUrl = typeof payload.repoUrl === "string" ? payload.repoUrl.trim() : "";
  const branch =
    typeof payload.branch === "string" && payload.branch.trim() ? payload.branch.trim() : "main";

  return {
    title,
    description,
    repoUrl,
    branch,
  };
}

function parseUpdatePayload(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;
  const updates: {
    title?: string;
    description?: string;
    repoUrl?: string;
    branch?: string;
  } = {};

  if ("title" in payload) {
    updates.title = typeof payload.title === "string" ? payload.title.trim() : "";
  }

  if ("description" in payload) {
    updates.description =
      typeof payload.description === "string" ? payload.description.trim() : undefined;
  }

  if ("repoUrl" in payload) {
    updates.repoUrl = typeof payload.repoUrl === "string" ? payload.repoUrl.trim() : "";
  }

  if ("branch" in payload) {
    updates.branch =
      typeof payload.branch === "string" && payload.branch.trim() ? payload.branch.trim() : "main";
  }

  return updates;
}

function ensureGithubUrl(repoUrl: string) {
  return repoUrl.startsWith(GITHUB_REPO_PREFIX);
}

function canAccessSubmission(userId: string, role: string, ownerId: string) {
  if (role === "admin") return true;
  return userId === ownerId;
}

submissionsRouter.post("/", requireAuth, requireRole(["student", "admin"]), async (request, response) => {
  await connectToDatabase();

  if (!request.user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const { title, description, repoUrl, branch } = parseCreatePayload(request.body);

  if (!title || title.length < 3) {
    response.status(400).json({ message: "Title must be at least 3 characters." });
    return;
  }

  if (!repoUrl || !ensureGithubUrl(repoUrl)) {
    response.status(400).json({ message: "repoUrl must start with https://github.com/" });
    return;
  }

  const createdSubmission = await Submission.create({
    ownerId: request.user.userId,
    title,
    description,
    repoUrl,
    branch,
    status: "submitted",
  });

  response.status(201).json({ submission: toSafeSubmission(createdSubmission) });
});

submissionsRouter.get("/", requireAuth, requireRole(["student", "admin"]), async (request, response) => {
  await connectToDatabase();

  if (!request.user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const filter = request.user.role === "admin" ? {} : { ownerId: request.user.userId };
  const submissions = await Submission.find(filter).sort({ createdAt: -1 }).exec();

  response.status(200).json({ submissions: submissions.map(toSafeSubmission) });
});

submissionsRouter.get("/my", requireAuth, requireRole(["student", "admin"]), async (request, response) => {
  await connectToDatabase();

  if (!request.user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const filter = request.user.role === "admin" ? {} : { ownerId: request.user.userId };
  const submissions = await Submission.find(filter).sort({ createdAt: -1 }).exec();

  response.status(200).json({
    submissions: submissions.map((submission) => ({
      id: String(submission._id),
      title: submission.title,
      repoUrl: submission.repoUrl,
      status: submission.status,
      createdAt: submission.createdAt.toISOString(),
    })),
  });
});

submissionsRouter.get("/:id", requireAuth, requireRole(["student", "admin"]), async (request, response) => {
  await connectToDatabase();

  if (!request.user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const { id } = request.params;
  if (!isValidObjectId(id)) {
    response.status(400).json({ message: "Invalid submission id." });
    return;
  }

  const submission = await Submission.findById(id).exec();
  if (!submission) {
    response.status(404).json({ message: "Submission not found." });
    return;
  }

  if (!canAccessSubmission(request.user.userId, request.user.role, String(submission.ownerId))) {
    response.status(403).json({ message: "Access denied." });
    return;
  }

  response.status(200).json({ submission: toSafeSubmission(submission) });
});

submissionsRouter.patch("/:id", requireAuth, requireRole(["student", "admin"]), async (request, response) => {
  await connectToDatabase();

  if (!request.user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const { id } = request.params;
  if (!isValidObjectId(id)) {
    response.status(400).json({ message: "Invalid submission id." });
    return;
  }

  const submission = await Submission.findById(id).exec();
  if (!submission) {
    response.status(404).json({ message: "Submission not found." });
    return;
  }

  if (!canAccessSubmission(request.user.userId, request.user.role, String(submission.ownerId))) {
    response.status(403).json({ message: "Access denied." });
    return;
  }

  const updates = parseUpdatePayload(request.body);
  const hasKnownUpdates =
    updates.title !== undefined ||
    updates.description !== undefined ||
    updates.repoUrl !== undefined ||
    updates.branch !== undefined;

  if (!hasKnownUpdates) {
    response.status(400).json({ message: "No valid fields to update." });
    return;
  }

  if (updates.title !== undefined) {
    if (!updates.title || updates.title.length < 3) {
      response.status(400).json({ message: "Title must be at least 3 characters." });
      return;
    }
    submission.title = updates.title;
  }

  if (updates.description !== undefined) {
    submission.description = updates.description;
  }

  if (updates.repoUrl !== undefined) {
    if (!updates.repoUrl || !ensureGithubUrl(updates.repoUrl)) {
      response.status(400).json({ message: "repoUrl must start with https://github.com/" });
      return;
    }
    submission.repoUrl = updates.repoUrl;
  }

  if (updates.branch !== undefined) {
    submission.branch = updates.branch;
  }

  await submission.save();

  response.status(200).json({ submission: toSafeSubmission(submission) });
});

submissionsRouter.delete("/:id", requireAuth, requireRole(["student", "admin"]), async (request, response) => {
  await connectToDatabase();

  if (!request.user) {
    response.status(401).json({ message: "Authentication required." });
    return;
  }

  const { id } = request.params;
  if (!isValidObjectId(id)) {
    response.status(400).json({ message: "Invalid submission id." });
    return;
  }

  const submission = await Submission.findById(id).exec();
  if (!submission) {
    response.status(404).json({ message: "Submission not found." });
    return;
  }

  if (!canAccessSubmission(request.user.userId, request.user.role, String(submission.ownerId))) {
    response.status(403).json({ message: "Access denied." });
    return;
  }

  await submission.deleteOne();

  response.status(200).json({ message: "Submission deleted." });
});

export default submissionsRouter;
