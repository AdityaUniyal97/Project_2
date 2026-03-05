import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import PipelineStep from "../../components/student/review/PipelineStep";
import LiveCodingChallenge from "../../components/student/review/LiveCodingChallenge";
import {
  deleteSubmission,
  getReviewStatus,
  listMySubmissions,
  startAiReview,
  type MySubmissionRecord,
  type SubmissionStatus,
} from "../../lib/api";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS } from "../../components/ui/glass";

const PIPELINE_STEPS = [
  { id: "submitted", label: "Submitted" },
  { id: "queued", label: "Queued" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
] as const;

type NormalizedStatus = "submitted" | "queued" | "processing" | "completed" | "failed" | "draft";

interface ReviewStatusData {
  status: NormalizedStatus;
  aiScore: number | null;
  aiSummary: string | null;
  aiFlags: string[];
  aiRiskLevel: string | null;
  aiRecommendation: string | null;
  aiConfidence: number | null;
  aiViva: string[];
  aiEvidence: Record<string, unknown> | null;
  aiChallenge: Record<string, unknown> | null;
  reviewStartedAt: string | null;
  reviewCompletedAt: string | null;
}

function normalizeStatus(status: SubmissionStatus | "done"): NormalizedStatus {
  if (status === "done") return "completed";
  return status;
}

function toStatusLabel(status: NormalizedStatus) {
  if (status === "completed") return "Completed";
  if (status === "processing") return "Processing";
  if (status === "queued") return "Queued";
  if (status === "failed") return "Failed";
  if (status === "draft") return "Draft";
  return "Submitted";
}

function toStatusBadgeClass(status: NormalizedStatus) {
  if (status === "completed") return "border-emerald-200/90 bg-emerald-50/80 text-emerald-700";
  if (status === "failed") return "border-rose-200/90 bg-rose-50/80 text-rose-700";
  if (status === "submitted" || status === "queued" || status === "processing") {
    return "border-amber-200/90 bg-amber-50/80 text-amber-700";
  }
  return "border-slate-200/90 bg-white/70 text-slate-700";
}

function getPipelineStepStatus(
  stepId: (typeof PIPELINE_STEPS)[number]["id"],
  status: NormalizedStatus,
) {
  const rankMap: Record<NormalizedStatus, number> = {
    draft: -1,
    submitted: 0,
    queued: 1,
    processing: 2,
    completed: 3,
    failed: 2,
  };
  const stepRankMap: Record<(typeof PIPELINE_STEPS)[number]["id"], number> = {
    submitted: 0,
    queued: 1,
    processing: 2,
    completed: 3,
  };

  const currentRank = rankMap[status];
  const stepRank = stepRankMap[stepId];

  if (status === "failed" && stepId === "completed") return "pending" as const;
  if (stepRank < currentRank) return "completed" as const;
  if (stepRank === currentRank) return "active" as const;
  return "pending" as const;
}

function toReadableDate(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleString();
}

export default function StudentReviewPage() {
  const [submissions, setSubmissions] = useState<MySubmissionRecord[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [statusById, setStatusById] = useState<Record<string, ReviewStatusData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [error, setError] = useState("");

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.id === selectedSubmissionId) ?? null,
    [selectedSubmissionId, submissions],
  );

  const selectedStatus = selectedSubmission
    ? statusById[selectedSubmission.id]?.status ?? normalizeStatus(selectedSubmission.status)
    : null;

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await listMySubmissions();
      setSubmissions(response.submissions);

      if (response.submissions.length === 0) {
        setSelectedSubmissionId(null);
      } else {
        setSelectedSubmissionId((current) => {
          if (current && response.submissions.some((submission) => submission.id === current)) {
            return current;
          }
          return response.submissions[0].id;
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load submissions.");
      setSubmissions([]);
      setSelectedSubmissionId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshReviewStatus = useCallback(async (submissionId: string) => {
    try {
      const response = await getReviewStatus(submissionId);
      const normalizedStatus = normalizeStatus(response.status);

      setStatusById((current) => ({
        ...current,
        [submissionId]: {
          status: normalizedStatus,
          aiScore: response.aiScore,
          aiSummary: response.aiSummary,
          aiFlags: response.aiFlags,
          aiRiskLevel: response.aiRiskLevel ?? null,
          aiRecommendation: response.aiRecommendation ?? null,
          aiConfidence: response.aiConfidence ?? null,
          aiViva: response.aiViva ?? [],
          aiEvidence: response.aiEvidence ?? null,
          aiChallenge: response.aiChallenge ?? null,
          reviewStartedAt: response.reviewStartedAt ?? null,
          reviewCompletedAt: response.reviewCompletedAt ?? null,
        },
      }));

      setSubmissions((current) =>
        current.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                status: normalizedStatus,
              }
            : item,
        ),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to fetch review status.");
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!selectedSubmissionId) return;
    void refreshReviewStatus(selectedSubmissionId);
  }, [refreshReviewStatus, selectedSubmissionId]);

  useEffect(() => {
    if (!selectedSubmissionId || !selectedStatus) return;
    if (selectedStatus !== "queued" && selectedStatus !== "processing") return;

    const intervalId = window.setInterval(() => {
      void refreshReviewStatus(selectedSubmissionId);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [refreshReviewStatus, selectedStatus, selectedSubmissionId]);

  const handleStartReview = async (submissionId: string) => {
    if (isStartingReview) return;

    setIsStartingReview(true);
    setError("");

    try {
      const response = await startAiReview(submissionId);
      const normalizedStatus = normalizeStatus(response.submission.status);

      setSubmissions((current) =>
        current.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                status: normalizedStatus,
              }
            : item,
        ),
      );

      setStatusById((current) => ({
        ...current,
        [submissionId]: {
          status: normalizedStatus,
          aiScore: response.submission.aiScore ?? null,
          aiSummary: response.submission.aiSummary ?? null,
          aiFlags: response.submission.aiFlags ?? [],
          aiRiskLevel: null,
          aiRecommendation: null,
          aiConfidence: null,
          aiViva: [],
          aiEvidence: null,
          aiChallenge: null,
          reviewStartedAt: response.submission.reviewStartedAt ?? null,
          reviewCompletedAt: null,
        },
      }));

      setSelectedSubmissionId((current) => current ?? submissionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start AI review.");
    } finally {
      setIsStartingReview(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    setError("");
    try {
      await deleteSubmission(submissionId);
      setSubmissions((current) => current.filter((s) => s.id !== submissionId));
      setStatusById((current) => {
        const next = { ...current };
        delete next[submissionId];
        return next;
      });
      if (selectedSubmissionId === submissionId) {
        setSelectedSubmissionId(null);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete submission.");
    }
  };

  const selectedReviewData = selectedSubmissionId ? statusById[selectedSubmissionId] : undefined;
  const showCompletedResults = selectedStatus === "completed";
  const isProcessing = selectedStatus === "queued" || selectedStatus === "processing";
  const canStartReview = selectedStatus === "submitted" || selectedStatus === "completed" || selectedStatus === "failed";

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">AI Review Queue</h2>
            <p className="mt-1 text-sm text-slate-600">
              Start review for submitted projects and track pipeline status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSubmissions()}
            className={`rounded-lg border border-white/65 bg-white/55 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/75 ${BUTTON_INTERACTIVE_CLASS}`}
          >
            Refresh
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No submissions found. Submit a project first.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {submissions.map((submission) => {
              const status = statusById[submission.id]?.status ?? normalizeStatus(submission.status);
              const isSelected = submission.id === selectedSubmissionId;

              return (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    isSelected
                      ? "border-blue-200/80 bg-blue-50/70"
                      : "border-white/65 bg-white/45 hover:bg-white/65"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{submission.title}</p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toStatusBadgeClass(
                        status,
                      )}`}
                    >
                      {toStatusLabel(status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{toReadableDate(submission.createdAt)}</p>
                  <p className="mt-1 truncate text-xs font-medium text-blue-700">{submission.repoUrl}</p>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDelete(submission.id);
                      }}
                      className={`rounded-lg border border-rose-200/80 bg-rose-50/70 px-2.5 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100/80 ${BUTTON_INTERACTIVE_CLASS}`}
                    >
                      Delete
                    </button>
                    {(status === "submitted" || status === "completed" || status === "failed") ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleStartReview(submission.id);
                        }}
                        disabled={isStartingReview}
                        className={`rounded-lg border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-2.5 py-1 text-[11px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
                      >
                        {isStartingReview && selectedSubmissionId === submission.id
                          ? "Starting..."
                          : status === "completed" || status === "failed" ? "Re-Review" : "Start AI Review"}
                      </button>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DemoGlassCard>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)]">
        <DemoGlassCard className={`h-fit p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Submission Review</h3>
            <button
              type="button"
              disabled={!selectedSubmission || !canStartReview || isStartingReview}
              onClick={() => {
                if (!selectedSubmission) return;
                void handleStartReview(selectedSubmission.id);
              }}
              className={`rounded-lg border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_14px_26px_rgba(37,99,235,0.24)] transition hover:shadow-[0_18px_30px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              {isStartingReview ? "Starting..." : canStartReview && selectedStatus !== "submitted" ? "Re-Review" : "Start AI Review"}
            </button>
          </div>

          {selectedSubmission ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/60 bg-white/40 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Project Title
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">{selectedSubmission.title}</p>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/40 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Repository
                </p>
                <a
                  href={selectedSubmission.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  {selectedSubmission.repoUrl}
                </a>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/40 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Current Status
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedStatus ? toStatusLabel(selectedStatus) : "Unknown"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">Select a submission to view review details.</p>
          )}
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Review Pipeline</h3>
          <p className="mt-1 text-sm text-slate-600">
            submitted &rarr; queued &rarr; processing &rarr; completed
          </p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {PIPELINE_STEPS.map((step, index) => (
              <PipelineStep
                key={step.id}
                index={index}
                label={step.label}
                status={
                  selectedStatus ? getPipelineStepStatus(step.id, selectedStatus) : "pending"
                }
              />
            ))}
          </div>

          {/* Live Progress Bar during processing */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5"
              >
                <ProcessingProgressBar
                  status={selectedStatus!}
                  reviewStartedAt={selectedReviewData?.reviewStartedAt ?? null}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Results */}
          <div className="mt-5 max-h-[520px] overflow-y-auto rounded-2xl">
            <AnimatePresence mode="wait">
              {showCompletedResults && selectedReviewData ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <AiResultsPanel data={selectedReviewData} />
                </motion.div>
              ) : selectedStatus === "failed" ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4"
                >
                  <p className="text-sm font-semibold text-rose-700">Analysis Failed</p>
                  <p className="mt-1 text-sm text-rose-600">
                    {selectedReviewData?.aiSummary || "The AI engine encountered an error. Please try again."}
                  </p>
                </motion.div>
              ) : !isProcessing ? (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-white/60 bg-white/40 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    AI Result
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Click "Start AI Review" to begin plagiarism and authenticity analysis.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </DemoGlassCard>
      </section>
    </motion.main>
  );
}

/* ──────────────────── Processing Progress Bar ──────────────────── */

const ANALYSIS_STAGES = [
  { label: "Cloning Repository", pct: 8, icon: "📦" },
  { label: "Parsing Code & AST", pct: 18, icon: "🔍" },
  { label: "Similarity Detection", pct: 32, icon: "🧬" },
  { label: "Commit Behavior Analysis", pct: 46, icon: "📊" },
  { label: "AI Code Detection", pct: 58, icon: "🤖" },
  { label: "Code Quality Scan", pct: 68, icon: "✨" },
  { label: "Generating Viva Questions", pct: 80, icon: "🎯" },
  { label: "Verdict Synthesis", pct: 92, icon: "⚖️" },
  { label: "Finalizing Report", pct: 98, icon: "📋" },
];

function ProcessingProgressBar({
  status,
  reviewStartedAt,
}: {
  status: NormalizedStatus;
  reviewStartedAt: string | null;
}) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(
    reviewStartedAt ? new Date(reviewStartedAt).getTime() : Date.now(),
  );

  useEffect(() => {
    if (reviewStartedAt) {
      startRef.current = new Date(reviewStartedAt).getTime();
    }
  }, [reviewStartedAt]);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Simulate stage progression based on elapsed time
  const stageIndex = Math.min(
    Math.floor(elapsed / 12),
    ANALYSIS_STAGES.length - 1,
  );
  const currentStage = ANALYSIS_STAGES[stageIndex];
  // Smooth progress within current stage
  const stageProgress = Math.min((elapsed % 12) / 12, 0.95);
  const nextPct = stageIndex < ANALYSIS_STAGES.length - 1 ? ANALYSIS_STAGES[stageIndex + 1].pct : 100;
  const progressPct = Math.min(
    currentStage.pct + (nextPct - currentStage.pct) * stageProgress,
    99,
  );

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 via-cyan-50/40 to-white/60 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
          </span>
          <p className="text-sm font-semibold text-blue-800">
            {status === "queued" ? "Waiting in Queue..." : "Analyzing Project"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-blue-200/80 bg-white/70 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-blue-700">
            {timeStr}
          </span>
        </div>
      </div>

      {/* 3D Progress Bar */}
      <div className="mt-4">
        <div className="relative h-5 w-full overflow-hidden rounded-full bg-slate-200/60 shadow-inner">
          {/* Background shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          {/* Progress fill */}
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_2px_8px_rgba(59,130,246,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Shine effect on the bar */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent" style={{ height: "50%" }} />
          </motion.div>
          {/* Percentage overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-bold text-slate-700 drop-shadow-sm">
              {Math.round(progressPct)}%
            </span>
          </div>
        </div>
      </div>

      {/* Current stage */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-base">{currentStage.icon}</span>
        <p className="text-xs font-medium text-blue-700">{currentStage.label}</p>
      </div>

      {/* Stage dots */}
      <div className="mt-3 flex items-center gap-1">
        {ANALYSIS_STAGES.map((stage, i) => (
          <div
            key={stage.label}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i < stageIndex
                ? "bg-emerald-400"
                : i === stageIndex
                  ? "bg-blue-400 animate-pulse"
                  : "bg-slate-200"
            }`}
            title={stage.label}
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── AI Results Panel ──────────────────── */

function riskLevelColor(risk: string | null) {
  const r = (risk ?? "").toUpperCase();
  if (r === "CLEAR" || r === "LOW") return { bg: "from-emerald-500 to-green-400", text: "text-emerald-700", border: "border-emerald-200/80", badgeBg: "bg-emerald-50/80" };
  if (r === "MONITOR") return { bg: "from-amber-400 to-yellow-400", text: "text-amber-700", border: "border-amber-200/80", badgeBg: "bg-amber-50/80" };
  if (r === "SUSPICIOUS") return { bg: "from-orange-500 to-amber-500", text: "text-orange-700", border: "border-orange-200/80", badgeBg: "bg-orange-50/80" };
  if (r === "HIGH" || r === "CRITICAL") return { bg: "from-rose-500 to-red-500", text: "text-rose-700", border: "border-rose-200/80", badgeBg: "bg-rose-50/80" };
  return { bg: "from-slate-400 to-slate-500", text: "text-slate-700", border: "border-slate-200/80", badgeBg: "bg-slate-50/80" };
}

function recommendationLabel(rec: string | null) {
  if (!rec) return "Pending";
  const labels: Record<string, string> = {
    CLEAR_TO_PASS: "Clear to Pass",
    REQUIRE_VIVA: "Viva Required",
    REQUIRE_LIVE_CODING: "Live Coding Required",
    RECOMMEND_REJECTION: "Rejection Recommended",
  };
  return labels[rec] ?? rec;
}

function AiResultsPanel({ data }: { data: ReviewStatusData }) {
  const colors = riskLevelColor(data.aiRiskLevel);
  const score = data.aiScore ?? 0;
  const confidence = data.aiConfidence ?? 0;

  // Extract sub-scores from evidence if available
  const evidence = data.aiEvidence as Record<string, unknown> | null;
  const similarityScore = typeof evidence?.similarity_score === "number" ? evidence.similarity_score : null;
  const commitRisk = typeof evidence?.commit_risk_score === "number" ? evidence.commit_risk_score : null;
  const codeQuality = typeof evidence?.code_quality_score === "number" ? evidence.code_quality_score : null;
  const aiDetection = typeof evidence?.ai_detection_probability === "number" ? evidence.ai_detection_probability : null;

  return (
    <div className="space-y-4">
      {/* Header: Score Circle + Risk Level */}
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/70 via-white/50 to-slate-50/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Analysis Results
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          {/* Authenticity Score Ring */}
          <div className="relative flex-shrink-0">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="48" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <motion.circle
                cx="55" cy="55" r="48"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                stroke="url(#scoreGrad)"
                strokeDasharray={`${(score / 100) * 301.6} 301.6`}
                transform="rotate(-90 55 55)"
                initial={{ strokeDasharray: "0 301.6" }}
                animate={{ strokeDasharray: `${(score / 100) * 301.6} 301.6` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={score >= 65 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444"} />
                  <stop offset="100%" stopColor={score >= 65 ? "#06d6a0" : score >= 40 ? "#fbbf24" : "#f87171"} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{Math.round(score)}</span>
              <span className="text-[10px] font-medium text-slate-500">/ 100</span>
            </div>
          </div>

          {/* Risk + Recommendation */}
          <div className="flex-1 space-y-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Risk Level</p>
              <span className={`mt-1 inline-block rounded-full border ${colors.border} ${colors.badgeBg} px-3 py-1 text-sm font-bold ${colors.text}`}>
                {(data.aiRiskLevel ?? "UNKNOWN").toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recommendation</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {recommendationLabel(data.aiRecommendation)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Confidence</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700">{Math.round(confidence)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Scores Grid */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          label="Plagiarism"
          value={similarityScore != null ? `${Math.round(similarityScore * 100)}%` : "--"}
          detail="Code similarity detected"
          color={similarityScore != null && similarityScore > 0.4 ? "rose" : "emerald"}
          index={0}
        />
        <ScoreCard
          label="Commit Risk"
          value={commitRisk != null ? `${Math.round(commitRisk * 100)}%` : "--"}
          detail="Git behavior anomaly"
          color={commitRisk != null && commitRisk > 0.4 ? "amber" : "emerald"}
          index={1}
        />
        <ScoreCard
          label="AI Generated"
          value={aiDetection != null ? `${Math.round(aiDetection * 100)}%` : "--"}
          detail="AI code probability"
          color={aiDetection != null && aiDetection > 0.5 ? "rose" : "emerald"}
          index={2}
        />
        <ScoreCard
          label="Code Quality"
          value={codeQuality != null ? `${Math.round(codeQuality * 100)}%` : "--"}
          detail="Quality & cleanliness"
          color={codeQuality != null && codeQuality > 0.6 ? "emerald" : "amber"}
          index={3}
        />
      </div>

      {/* AI Summary */}
      {data.aiSummary?.trim() && (
        <div className="rounded-2xl border border-white/60 bg-white/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            AI Summary
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{data.aiSummary}</p>
        </div>
      )}

      {/* Flags */}
      {data.aiFlags.length > 0 && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
            Flags Identified ({data.aiFlags.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.aiFlags.map((flag, i) => (
              <span
                key={`${flag}-${i}`}
                className="rounded-full border border-amber-200/85 bg-amber-50/90 px-2.5 py-1 text-xs font-medium text-amber-800"
              >
                ⚠ {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Viva Questions */}
      {data.aiViva.length > 0 && (
        <div className="rounded-2xl border border-blue-200/60 bg-blue-50/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
            Suggested Viva Questions ({data.aiViva.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.aiViva.map((q, i) => (
              <li key={`viva-${i}`} className="flex gap-2 text-sm text-blue-800">
                <span className="flex-shrink-0 font-semibold text-blue-500">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Live Coding Challenge */}
      {data.aiChallenge && Object.keys(data.aiChallenge).length > 0 && (
        <LiveCodingChallenge challenge={data.aiChallenge as Record<string, unknown>} />
      )}
    </div>
  );
}

/* ──────────────────── Score Card Mini ──────────────────── */

function ScoreCard({
  label,
  value,
  detail,
  color,
  index,
}: {
  label: string;
  value: string;
  detail: string;
  color: "emerald" | "amber" | "rose";
  index: number;
}) {
  const colorMap = {
    emerald: "border-emerald-200/80 bg-emerald-50/60 text-emerald-700",
    amber: "border-amber-200/80 bg-amber-50/60 text-amber-700",
    rose: "border-rose-200/80 bg-rose-50/60 text-rose-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.08 }}
      className={`rounded-2xl border p-3.5 ${colorMap[color]}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] opacity-70">{detail}</p>
    </motion.div>
  );
}
