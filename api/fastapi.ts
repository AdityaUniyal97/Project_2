export interface FastApiScanPayload {
  submissionId: string;
  repoUrl: string;
  sourceCode?: string;
}

export interface FastApiScanResponse {
  similarity_score: number;
  originality_score: number;
  plagiarism_flags: string[];
  duplicate_snippets?: Array<{
    file_path?: string;
    source_url?: string;
    similarity?: number;
    start_line?: number;
    end_line?: number;
  }>;
}

export async function requestFastApiScan(payload: FastApiScanPayload): Promise<FastApiScanResponse> {
  const baseUrl = process.env.FASTAPI_URL;
  if (!baseUrl) {
    throw new Error("Missing FASTAPI_URL in environment variables.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.FASTAPI_API_KEY ?? ""
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`FastAPI scan failed (${response.status}): ${message}`);
  }

  return (await response.json()) as FastApiScanResponse;
}
