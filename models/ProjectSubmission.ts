import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const projectSubmissionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    repoUrl: { type: String, required: true, trim: true },
    branch: { type: String, default: "main" },
    commitHash: { type: String },
    sourceSnapshot: { type: String },
    similarityScore: { type: Number, min: 0, max: 100, default: 0 },
    plagiarismFlags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "queued", "scanning", "completed", "failed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export type ProjectSubmissionDocument = InferSchemaType<typeof projectSubmissionSchema>;

const ProjectSubmission =
  (mongoose.models.ProjectSubmission as Model<ProjectSubmissionDocument>) ||
  mongoose.model<ProjectSubmissionDocument>("ProjectSubmission", projectSubmissionSchema);

export default ProjectSubmission;
