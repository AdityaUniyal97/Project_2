import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const scanResultSchema = new Schema(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectSubmission",
      required: true,
      index: true
    },
    similarityScore: { type: Number, required: true, min: 0, max: 100 },
    originalityScore: { type: Number, required: true, min: 0, max: 100 },
    plagiarismFlags: { type: [String], default: [] },
    duplicateSnippets: {
      type: [
        {
          filePath: String,
          sourceUrl: String,
          similarity: Number,
          startLine: Number,
          endLine: Number
        }
      ],
      default: []
    },
    repoUrl: { type: String, required: true },
    engineVersion: { type: String, default: "fastapi-v1" },
    rawResponse: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export type ScanResultDocument = InferSchemaType<typeof scanResultSchema>;

const ScanResult =
  (mongoose.models.ScanResult as Model<ScanResultDocument>) ||
  mongoose.model<ScanResultDocument>("ScanResult", scanResultSchema);

export default ScanResult;
