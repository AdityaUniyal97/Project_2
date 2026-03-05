/**
 * AI Engine Service
 *
 * HTTP client that calls the Python AI engine's /analyze endpoint
 * and maps the response to Submission-compatible fields.
 */

const AI_ENGINE_URL = process.env.AI_ENGINE_URL ?? "http://localhost:8100";

export interface AiEngineRequest {
  project_id: string;
  github_url: string;
  project_name?: string;
  analysis_mode: "Fast Mode" | "Deep Mode";
  student_name?: string;
  roll_number?: string;
}

export interface AiEngineResult {
  /** 0-100 authenticity score (Bayesian posterior) */
  aiScore: number | null;
  /** Primary finding / summary from the verdict agent */
  aiSummary: string | null;
  /** Top-level suspicious flags */
  aiFlags: string[];
  /** CLEAR | LOW | MONITOR | SUSPICIOUS | HIGH | CRITICAL | ERROR */
  aiRiskLevel: string | null;
  /** CLEAR_TO_PASS | REQUIRE_VIVA | REQUIRE_LIVE_CODING | RECOMMEND_REJECTION */
  aiRecommendation: string | null;
  /** Overall confidence in the verdict (0-100) */
  aiConfidence: number | null;
  /** Suggested viva / interrogation questions */
  aiViva: string[];
  /** Generated live coding challenge (if high risk) */
  aiChallenge: Record<string, unknown> | null;
  /** Full evidence breakdown from all layers */
  aiEvidence: Record<string, unknown> | null;
}

/**
 * Calls the Python AI engine /analyze endpoint and returns mapped results.
 * Throws on network errors or non-200 responses.
 */
export async function analyzeWithAiEngine(
  request: AiEngineRequest,
): Promise<AiEngineResult> {
  const url = `${AI_ENGINE_URL}/analyze`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(300_000), // 5 min timeout for deep analysis
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI engine returned ${response.status}: ${text}`);
  }

  const data = await response.json();

  return mapEngineResponse(data);
}

/** Maps the raw AnalysisResult dict from the Python engine to our DB fields. */
function mapEngineResponse(raw: Record<string, unknown>): AiEngineResult {
  const flags: string[] = [];

  // primary_flags from the verdict agent
  if (Array.isArray(raw.primary_flags)) {
    for (const f of raw.primary_flags) {
      if (typeof f === "string") flags.push(f);
    }
  }

  // Also pull from detected_issues if present
  if (Array.isArray(raw.detected_issues)) {
    for (const issue of raw.detected_issues) {
      if (issue && typeof issue === "object" && typeof (issue as Record<string, unknown>).description === "string") {
        flags.push((issue as Record<string, unknown>).description as string);
      }
    }
  }

  return {
    aiScore: typeof raw.authenticity_score === "number" ? raw.authenticity_score : null,
    aiSummary: (typeof raw.primary_finding === "string" && raw.primary_finding.trim()) ? raw.primary_finding : (typeof raw.summary === "string" ? raw.summary : null),
    aiFlags: flags,
    aiRiskLevel: typeof raw.overall_risk_level === "string" ? raw.overall_risk_level : null,
    aiRecommendation: typeof raw.recommendation === "string" ? raw.recommendation : null,
    aiConfidence: typeof raw.confidence_score === "number" ? raw.confidence_score : null,
    aiViva: Array.isArray(raw.suggested_viva_questions)
      ? raw.suggested_viva_questions
          .map((q: unknown) => {
            if (typeof q === "string") return q;
            if (q && typeof q === "object" && typeof (q as Record<string, unknown>).question === "string") {
              return (q as Record<string, unknown>).question as string;
            }
            return null;
          })
          .filter((q): q is string => q !== null)
      : [],
    aiChallenge: raw.live_challenge != null && typeof raw.live_challenge === "object" ? raw.live_challenge as Record<string, unknown> : null,
    aiEvidence: buildEvidence(raw),
  };
}

/** Merge evidence_breakdown with ai_detection and code_quality into a single flat object. */
function buildEvidence(raw: Record<string, unknown>): Record<string, unknown> | null {
  const eb = raw.evidence_breakdown != null && typeof raw.evidence_breakdown === "object"
    ? { ...(raw.evidence_breakdown as Record<string, unknown>) }
    : {} as Record<string, unknown>;

  // Pull ai_detection probability
  const aiDet = raw.ai_detection;
  if (aiDet && typeof aiDet === "object") {
    const det = aiDet as Record<string, unknown>;
    if (typeof det.ai_generation_probability === "number") {
      eb.ai_detection_probability = det.ai_generation_probability;
    }
  }

  // Map field names for frontend compatibility
  if (typeof eb.syntactic_similarity === "number" && eb.similarity_score === undefined) {
    eb.similarity_score = eb.syntactic_similarity;
  }
  if (typeof eb.commit_risk === "number" && eb.commit_risk_score === undefined) {
    eb.commit_risk_score = eb.commit_risk;
  }
  if (typeof eb.code_cleanliness === "number" && eb.code_quality_score === undefined) {
    eb.code_quality_score = eb.code_cleanliness / 100;
  }
  if (typeof eb.ai_generation_probability === "number" && eb.ai_detection_probability === undefined) {
    eb.ai_detection_probability = eb.ai_generation_probability;
  }

  return Object.keys(eb).length > 0 ? eb : null;
}
