import { NextResponse } from "next/server";
import { requestFastApiScan } from "@/api/fastapi";
import { connectToDatabase } from "@/lib/mongodb";
import ProjectSubmission from "@/models/ProjectSubmission";
import ScanResult from "@/models/ScanResult";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      submissionId: string;
      repoUrl: string;
      sourceCode?: string;
    };

    if (!body.submissionId || !body.repoUrl) {
      return NextResponse.json(
        { error: "submissionId and repoUrl are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Keep the submission state in sync with the external scanner lifecycle.
    await ProjectSubmission.findByIdAndUpdate(body.submissionId, {
      status: "scanning"
    });

    const aiResult = await requestFastApiScan({
      submissionId: body.submissionId,
      repoUrl: body.repoUrl,
      sourceCode: body.sourceCode
    });

    const storedResult = await ScanResult.create({
      submissionId: body.submissionId,
      similarityScore: aiResult.similarity_score,
      originalityScore: aiResult.originality_score,
      plagiarismFlags: aiResult.plagiarism_flags,
      duplicateSnippets: (aiResult.duplicate_snippets ?? []).map((snippet) => ({
        filePath: snippet.file_path,
        sourceUrl: snippet.source_url,
        similarity: snippet.similarity,
        startLine: snippet.start_line,
        endLine: snippet.end_line
      })),
      repoUrl: body.repoUrl,
      rawResponse: aiResult
    });

    await ProjectSubmission.findByIdAndUpdate(body.submissionId, {
      status: "completed",
      similarityScore: aiResult.similarity_score,
      plagiarismFlags: aiResult.plagiarism_flags
    });

    return NextResponse.json({
      ok: true,
      scanResultId: storedResult._id,
      similarityScore: aiResult.similarity_score,
      originalityScore: aiResult.originality_score,
      plagiarismFlags: aiResult.plagiarism_flags
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
