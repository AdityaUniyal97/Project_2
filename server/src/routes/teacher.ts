import { Router } from "express";
import { isValidObjectId, Types } from "mongoose";

import { connectToDatabase } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { Submission, type SubmissionStatus } from "../models/Submission";
import { User } from "../models/User";

const teacherRouter = Router();

const STATUS_FILTER_VALUES: SubmissionStatus[] = [
  "draft",
  "submitted",
  "queued",
  "processing",
  "completed",
  "failed",
  "done",
];

const STATUS_UPDATE_VALUES: SubmissionStatus[] = [
  "submitted",
  "queued",
  "processing",
  "completed",
  "failed",
];

function getQueryParamValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return typeof value === "string" ? value : "";
}

function parsePositiveInt(value: unknown, fallback: number) {
  const raw = getQueryParamValue(value).trim();
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function shouldRestrictTeacherToAssignedSubmissions() {
  const assignedSubmissionExists = await Submission.exists({
    assignedTeacherId: { $exists: true, $ne: null },
  });
  return Boolean(assignedSubmissionExists);
}

teacherRouter.get(
  "/submissions",
  requireAuth,
  requireRole(["teacher", "admin"]),
  async (request, response) => {
    await connectToDatabase();

    if (!request.user) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    const page = parsePositiveInt(request.query.page, 1);
    const limit = parsePositiveInt(request.query.limit, 10);

    if (!page || !limit) {
      response.status(400).json({ message: "page and limit must be positive integers." });
      return;
    }

    const normalizedLimit = Math.min(limit, 100);
    const skip = (page - 1) * normalizedLimit;

    const filterParts: Array<Record<string, unknown>> = [];

    if (request.user.role === "teacher") {
      const restrictToAssigned = await shouldRestrictTeacherToAssignedSubmissions();
      if (restrictToAssigned) {
        filterParts.push({ assignedTeacherId: request.user.userId });
      }
    }

    const status = getQueryParamValue(request.query.status).trim();
    if (status) {
      if (!STATUS_FILTER_VALUES.includes(status as SubmissionStatus)) {
        response.status(400).json({ message: "Invalid status filter." });
        return;
      }
      filterParts.push({ status: status as SubmissionStatus });
    }

    const search = getQueryParamValue(request.query.search).trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const matchedUsers = await User.find({
        $or: [{ name: regex }, { email: regex }],
      })
        .select("_id")
        .limit(200)
        .lean()
        .exec();

      const ownerIds = matchedUsers.map((user) => user._id);
      const searchConditions: Array<Record<string, unknown>> = [
        { title: regex },
        { repoUrl: regex },
      ];

      if (ownerIds.length > 0) {
        searchConditions.push({ ownerId: { $in: ownerIds } });
      }

      filterParts.push({ $or: searchConditions });
    }

    const filter: Record<string, unknown> =
      filterParts.length > 0 ? { $and: filterParts } : {};

    const [items, total] = await Promise.all([
      Submission.find(filter)
        .populate({ path: "ownerId", select: "name email" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .exec(),
      Submission.countDocuments(filter).exec(),
    ]);

    response.status(200).json({
      items,
      page,
      limit: normalizedLimit,
      total,
    });
  },
);

teacherRouter.get(
  "/submissions/:id",
  requireAuth,
  requireRole(["teacher", "admin"]),
  async (request, response) => {
    await connectToDatabase();

    const { id } = request.params;
    if (!isValidObjectId(id)) {
      response.status(400).json({ message: "Invalid submission id." });
      return;
    }

    const submission = await Submission.findById(id)
      .populate({ path: "ownerId", select: "name email" })
      .exec();

    if (!submission) {
      response.status(404).json({ message: "Submission not found." });
      return;
    }

    response.status(200).json({ submission });
  },
);

teacherRouter.patch(
  "/submissions/:id/review",
  requireAuth,
  requireRole(["teacher", "admin"]),
  async (request, response) => {
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

    const payload = (request.body ?? {}) as Record<string, unknown>;
    const hasRating = Object.prototype.hasOwnProperty.call(payload, "rating");
    const hasRemarks = Object.prototype.hasOwnProperty.call(payload, "remarks");

    if (!hasRating && !hasRemarks) {
      response.status(400).json({ message: "rating or remarks is required." });
      return;
    }

    let normalizedRating: number | undefined;
    if (hasRating) {
      const ratingValue =
        typeof payload.rating === "number" ? payload.rating : Number(payload.rating);
      if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        response.status(400).json({ message: "rating must be between 1 and 5." });
        return;
      }
      normalizedRating = ratingValue;
    }

    let normalizedRemarks: string | undefined;
    if (hasRemarks) {
      if (typeof payload.remarks !== "string") {
        response.status(400).json({ message: "remarks must be a string." });
        return;
      }
      normalizedRemarks = payload.remarks.trim();
    }

    const submission = await Submission.findById(id).exec();
    if (!submission) {
      response.status(404).json({ message: "Submission not found." });
      return;
    }

    const teacherReview = submission.teacherReview ?? {};
    if (hasRating) {
      teacherReview.rating = normalizedRating;
    }
    if (hasRemarks) {
      teacherReview.remarks = normalizedRemarks;
    }
    teacherReview.reviewedAt = new Date();
    teacherReview.reviewedBy = new Types.ObjectId(request.user.userId);
    submission.teacherReview = teacherReview;

    await submission.save();
    await submission.populate({ path: "ownerId", select: "name email" });

    response.status(200).json({ submission });
  },
);

teacherRouter.patch(
  "/submissions/:id/assign",
  requireAuth,
  requireRole(["admin"]),
  async (request, response) => {
    await connectToDatabase();

    const { id } = request.params;
    if (!isValidObjectId(id)) {
      response.status(400).json({ message: "Invalid submission id." });
      return;
    }

    const payload = (request.body ?? {}) as Record<string, unknown>;
    const teacherId = typeof payload.teacherId === "string" ? payload.teacherId.trim() : "";

    if (!teacherId || !isValidObjectId(teacherId)) {
      response.status(400).json({ message: "teacherId is invalid." });
      return;
    }

    const teacherUser = await User.findOne({ _id: teacherId, role: "teacher" })
      .select("_id")
      .lean()
      .exec();
    if (!teacherUser) {
      response.status(400).json({ message: "teacherId must belong to a teacher." });
      return;
    }

    const submission = await Submission.findById(id).exec();
    if (!submission) {
      response.status(404).json({ message: "Submission not found." });
      return;
    }

    submission.assignedTeacherId = new Types.ObjectId(teacherId);
    await submission.save();
    await submission.populate({ path: "ownerId", select: "name email" });

    response.status(200).json({ submission });
  },
);

teacherRouter.patch(
  "/submissions/:id/status",
  requireAuth,
  requireRole(["teacher", "admin"]),
  async (request, response) => {
    await connectToDatabase();

    const { id } = request.params;
    if (!isValidObjectId(id)) {
      response.status(400).json({ message: "Invalid submission id." });
      return;
    }

    const payload = (request.body ?? {}) as Record<string, unknown>;
    const status = typeof payload.status === "string" ? payload.status.trim() : "";

    if (!STATUS_UPDATE_VALUES.includes(status as SubmissionStatus)) {
      response.status(400).json({ message: "Invalid status value." });
      return;
    }

    const submission = await Submission.findById(id).exec();
    if (!submission) {
      response.status(404).json({ message: "Submission not found." });
      return;
    }

    submission.status = status as SubmissionStatus;
    await submission.save();
    await submission.populate({ path: "ownerId", select: "name email" });

    response.status(200).json({ submission });
  },
);

export default teacherRouter;
