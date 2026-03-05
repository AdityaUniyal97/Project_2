/**
 * Review Worker Service
 *
 * Async background processor that picks up "queued" submissions,
 * calls the AI engine, and updates the submission with results.
 *
 * Uses fire-and-forget pattern — no job queue dependency needed.
 */

import { connectToDatabase } from "../lib/db";
import { Submission } from "../models/Submission";
import { analyzeWithAiEngine, type AiEngineRequest } from "./aiEngine.service";

/**
 * Process a single submission through the AI pipeline.
 * Called after the review route sets status to "queued" and responds to the client.
 *
 * This function is intentionally fire-and-forget: the caller does NOT await it,
 * so the HTTP response returns immediately while processing continues.
 */
export async function processReview(submissionId: string): Promise<void> {
  try {
    await connectToDatabase();

    // Transition to "processing"
    const submission = await Submission.findById(submissionId).exec();
    if (!submission) {
      console.error(`[reviewWorker] Submission ${submissionId} not found.`);
      return;
    }

    if (submission.status !== "queued") {
      console.warn(`[reviewWorker] Submission ${submissionId} is "${submission.status}", expected "queued". Skipping.`);
      return;
    }

    submission.status = "processing";
    await submission.save();
    console.log(`[reviewWorker] Processing submission ${submissionId}...`);

    // Build the AI engine request
    const request: AiEngineRequest = {
      project_id: String(submission._id),
      github_url: submission.repoUrl,
      project_name: submission.title,
      analysis_mode: "Fast Mode",
      roll_number: submission.rollNumber ?? undefined,
    };

    // Call the AI engine
    const result = await analyzeWithAiEngine(request);

    // Check if the engine returned an error state
    if (result.aiRiskLevel === "ERROR") {
      submission.status = "failed";
      submission.aiSummary = result.aiSummary || "AI engine returned an error during analysis.";
      submission.reviewCompletedAt = new Date();
      await submission.save();
      console.error(`[reviewWorker] Submission ${submissionId} failed: engine returned ERROR state`);
      return;
    }

    // Update submission with results
    submission.aiScore = result.aiScore;
    submission.aiSummary = result.aiSummary;
    submission.aiFlags = result.aiFlags;
    submission.set("aiRiskLevel", result.aiRiskLevel);
    submission.set("aiRecommendation", result.aiRecommendation);
    submission.set("aiConfidence", result.aiConfidence);
    submission.set("aiViva", result.aiViva);
    submission.set("aiChallenge", result.aiChallenge);
    submission.set("aiEvidence", result.aiEvidence);
    submission.status = "completed";
    submission.reviewCompletedAt = new Date();
    await submission.save();

    console.log(`[reviewWorker] Submission ${submissionId} completed. Score: ${result.aiScore}, Risk: ${result.aiRiskLevel}`);
  } catch (error) {
    // On failure, mark the submission as "failed" with an error summary
    console.error(`[reviewWorker] Failed to process submission ${submissionId}:`, error);

    try {
      await connectToDatabase();
      await Submission.findByIdAndUpdate(submissionId, {
        status: "failed",
        aiSummary: `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        reviewCompletedAt: new Date(),
      }).exec();
    } catch (updateError) {
      console.error(`[reviewWorker] Failed to update submission ${submissionId} to "failed":`, updateError);
    }
  }
}
