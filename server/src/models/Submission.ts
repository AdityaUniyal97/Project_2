import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "done";

export interface SubmissionSchemaType {
  ownerId: Types.ObjectId;
  title: string;
  description?: string;
  repoUrl: string;
  branch: string;
  techTags: string[];
  rollNumber?: string;
  liveDemoUrl?: string;
  status: SubmissionStatus;
  aiScore?: number | null;
  aiSummary?: string | null;
  aiFlags: string[];
  reviewStartedAt?: Date | null;
  reviewCompletedAt?: Date | null;
  assignedTeacherId?: Types.ObjectId;
  teacherReview?: {
    rating?: number;
    remarks?: string;
    reviewedAt?: Date;
    reviewedBy?: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeSubmission {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  repoUrl: string;
  branch: string;
  techTags: string[];
  rollNumber?: string;
  liveDemoUrl?: string;
  status: SubmissionStatus;
  aiScore?: number | null;
  aiSummary?: string | null;
  aiFlags: string[];
  reviewStartedAt?: string | null;
  reviewCompletedAt?: string | null;
  assignedTeacherId?: string | null;
  teacherReview?: {
    rating?: number | null;
    remarks?: string | null;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionDocument = HydratedDocument<SubmissionSchemaType>;

const submissionSchema = new Schema<SubmissionSchemaType>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    repoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      default: "main",
      trim: true,
    },
    techTags: {
      type: [String],
      default: [],
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    liveDemoUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "queued", "processing", "completed", "failed", "done"],
      default: "submitted",
      required: true,
    },
    aiScore: {
      type: Number,
      default: null,
    },
    aiSummary: {
      type: String,
      default: null,
      trim: true,
    },
    aiFlags: {
      type: [String],
      default: [],
    },
    reviewStartedAt: {
      type: Date,
      default: null,
    },
    reviewCompletedAt: {
      type: Date,
      default: null,
    },
    assignedTeacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    teacherReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      remarks: {
        type: String,
        trim: true,
      },
      reviewedAt: {
        type: Date,
      },
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  },
  {
    timestamps: true,
  },
);

submissionSchema.index({ ownerId: 1, createdAt: -1 });
submissionSchema.index({ assignedTeacherId: 1, createdAt: -1 });

export const Submission =
  (models.Submission as Model<SubmissionSchemaType>) ||
  model<SubmissionSchemaType>("Submission", submissionSchema);

export function toSafeSubmission(
  submission: Pick<
    SubmissionDocument,
    "_id" | "ownerId" | "title" | "description" | "repoUrl" | "branch" | "techTags" | "rollNumber" | "liveDemoUrl" | "status" | "aiScore" | "aiSummary" | "aiFlags" | "reviewStartedAt" | "reviewCompletedAt" | "assignedTeacherId" | "teacherReview" | "createdAt" | "updatedAt"
  >,
): SafeSubmission {
  return {
    id: String(submission._id),
    ownerId: String(submission.ownerId),
    title: submission.title,
    description: submission.description,
    repoUrl: submission.repoUrl,
    branch: submission.branch,
    techTags: submission.techTags ?? [],
    rollNumber: submission.rollNumber,
    liveDemoUrl: submission.liveDemoUrl,
    status: submission.status,
    aiScore: submission.aiScore ?? null,
    aiSummary: submission.aiSummary ?? null,
    aiFlags: submission.aiFlags ?? [],
    reviewStartedAt: submission.reviewStartedAt ? submission.reviewStartedAt.toISOString() : null,
    reviewCompletedAt: submission.reviewCompletedAt ? submission.reviewCompletedAt.toISOString() : null,
    assignedTeacherId: submission.assignedTeacherId ? String(submission.assignedTeacherId) : null,
    teacherReview: submission.teacherReview
      ? {
          rating: submission.teacherReview.rating ?? null,
          remarks: submission.teacherReview.remarks ?? null,
          reviewedAt: submission.teacherReview.reviewedAt
            ? submission.teacherReview.reviewedAt.toISOString()
            : null,
          reviewedBy: submission.teacherReview.reviewedBy
            ? String(submission.teacherReview.reviewedBy)
            : null,
        }
      : null,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
  };
}
