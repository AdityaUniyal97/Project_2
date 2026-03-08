import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import PipelineStep from "../../components/student/review/PipelineStep";
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

  // When submission is fully completed, all steps are done
  if (status === "completed") return "completed" as const;
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

const REVIEW_SELECTED_KEY = "pg_review_selected";

export default function StudentReviewPage() {
  const [submissions, setSubmissions] = useState<MySubmissionRecord[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    () => sessionStorage.getItem(REVIEW_SELECTED_KEY),
  );
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

  // Persist selected submission so it survives tab switching
  useEffect(() => {
    if (selectedSubmissionId) {
      sessionStorage.setItem(REVIEW_SELECTED_KEY, selectedSubmissionId);
    } else {
      sessionStorage.removeItem(REVIEW_SELECTED_KEY);
    }
  }, [selectedSubmissionId]);

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
    if (!window.confirm("Are you sure you want to delete this submission? This cannot be undone.")) return;
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
      className="w-full space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ── Top Row: Analysis Results (wide) + Submission Details (narrow) ── */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        {/* Analysis Results — spans 2 of 3 cols */}
        <DemoGlassCard className={`p-6 xl:col-span-2 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Analysis Results</h3>
            {selectedStatus === "completed" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Analysis Complete
              </span>
            )}
          </div>

          {/* Pipeline steps row */}
          <div className="mt-6 grid gap-2.5 grid-cols-2 sm:grid-cols-4">
            {PIPELINE_STEPS.map((step, index) => (
              <PipelineStep
                key={`inline-pipeline-${step.id}`}
                index={index}
                label={step.label}
                status={
                  selectedStatus ? getPipelineStepStatus(step.id, selectedStatus) : "pending"
                }
              />
            ))}
          </div>

          {/* Progress bar (processing only) */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                key="inline-processing-visual"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <ProcessingProgressBar
                  status={selectedStatus!}
                  reviewStartedAt={selectedReviewData?.reviewStartedAt ?? null}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Results — scrollable content area */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {showCompletedResults && selectedReviewData ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="max-h-[50vh] overflow-y-auto rounded-2xl pr-1"
                >
                  <AiResultsPanel data={selectedReviewData} />
                </motion.div>
              ) : selectedStatus === "failed" ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-6"
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
                  className="rounded-2xl border border-white/60 bg-white/40 p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    AI Result
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Click &ldquo;Start AI Review&rdquo; to begin plagiarism and authenticity analysis.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </DemoGlassCard>

        {/* Submission Details — spans 1 of 3 cols */}
        <DemoGlassCard className={`p-6 xl:col-span-1 xl:sticky xl:top-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Submission Details</h3>

          {selectedSubmission ? (
            <div className="mt-6 space-y-3">
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
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toStatusBadgeClass(selectedStatus ?? "submitted")}`}>
                    {selectedStatus ? toStatusLabel(selectedStatus) : "Unknown"}
                  </span>
                </div>
              </div>
              {canStartReview && (
                <button
                  type="button"
                  disabled={isStartingReview}
                  onClick={() => void handleStartReview(selectedSubmission.id)}
                  className={`w-full rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition hover:shadow-[0_12px_26px_rgba(37,99,235,0.30)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
                >
                  {isStartingReview ? "Starting..." : selectedStatus === "completed" || selectedStatus === "failed" ? "🔄 Re-Run Analysis" : "🚀 Start AI Review"}
                </button>
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-600">Select a submission to view review details.</p>
          )}
        </DemoGlassCard>
      </div>

      {/* ── Bottom: AI Review Queue (full width) ── */}
      <DemoGlassCard className={`p-6 ${GLASS_INTERACTIVE_CLASS}`}>
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
          <p className="mt-6 text-sm text-slate-600">Loading submissions...</p>
        ) : submissions.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">
            No submissions found.{" "}
            <Link to="/student/submit" className="font-semibold text-blue-600 hover:underline">
              Submit your first project &rarr;
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {submissions.map((submission) => {
              const status = statusById[submission.id]?.status ?? normalizeStatus(submission.status);
              const isSelected = submission.id === selectedSubmissionId;

              return (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  className={`flex h-full flex-col rounded-2xl border px-4 py-3 text-left transition ${isSelected
                      ? "border-blue-200/80 bg-blue-50/70"
                      : "border-white/65 bg-white/45 hover:bg-white/65"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{submission.title}</p>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toStatusBadgeClass(
                        status,
                      )}`}
                    >
                      {toStatusLabel(status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{toReadableDate(submission.createdAt)}</p>
                  <p className="mt-1 truncate text-xs font-medium text-blue-700">{submission.repoUrl}</p>
                  <div className="mt-auto flex items-center justify-end gap-2 pt-3">
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
  const simulatedPct = Math.min(
    currentStage.pct + (nextPct - currentStage.pct) * stageProgress,
    99,
  );
  const progressPct =
    status === "completed"
      ? 100
      : status === "processing"
        ? Math.max(simulatedPct, 54)
        : status === "queued"
          ? Math.max(Math.min(simulatedPct, 55), 22)
          : status === "submitted"
            ? 18
            : status === "failed"
              ? 72
              : 8;
  const stepStates = PIPELINE_STEPS.map((step) => getPipelineStepStatus(step.id, status));
  const activeStepIndex = Math.max(stepStates.findIndex((stepStatus) => stepStatus === "active"), 0);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 via-cyan-50/40 to-white/60 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
          </span>
          <p className="text-sm font-semibold text-blue-800">
            {status === "queued" ? "Waiting in Queue..." : "AI Scan in Progress"}
          </p>
        </div>
        <span className="rounded-full border border-blue-200/80 bg-white/70 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-blue-700">
          {timeStr}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/55 bg-white/45">
        <div className="pointer-events-none relative h-32">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:18px_18px]" />
          <motion.div
            className="absolute inset-y-0 w-14 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent"
            animate={{ x: ["-20%", "115%"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
          />

          <div className="absolute left-[10%] right-[10%] top-[40%] h-0.5 rounded-full bg-blue-200/70" />
          <motion.div
            className="absolute left-[10%] top-[40%] h-0.5 rounded-full bg-gradient-to-r from-blue-400/65 via-cyan-400/90 to-emerald-400/70"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct * 0.8}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          {[0, 1, 2].map((particle) => (
            <motion.span
              key={`flow-dot-${particle}`}
              className="absolute top-[38%] h-1.5 w-1.5 rounded-full bg-cyan-300/85 shadow-[0_0_10px_rgba(56,189,248,0.65)]"
              animate={{ x: ["10%", `${8 + progressPct * 0.8}%`], opacity: [0, 1, 0] }}
              transition={{
                duration: 1.7,
                delay: particle * 0.45,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          <div className="absolute left-[10%] right-[10%] top-[40%] flex -translate-y-1/2 justify-between">
            {PIPELINE_STEPS.map((step, index) => {
              const stepStatus = stepStates[index];
              const isActiveStep = stepStatus === "active";
              const isCompletedStep = stepStatus === "completed";

              return (
                <div key={step.id} className="relative">
                  <span
                    className={`inline-flex h-3.5 w-3.5 rounded-full border ${isCompletedStep
                        ? "border-emerald-300/90 bg-emerald-300/85"
                        : isActiveStep
                          ? "border-cyan-300/90 bg-cyan-300/90"
                          : "border-slate-300/80 bg-white/80"
                      }`}
                  />
                  {isActiveStep ? (
                    <motion.span
                      className="pointer-events-none absolute inset-[-6px] rounded-full border border-cyan-300/75"
                      animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.25, 0.75, 0.25] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-[10%] right-[10%] grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PIPELINE_STEPS.map((step, index) => {
              const stepStatus = stepStates[index];
              const isActiveStep = stepStatus === "active";
              const isCompletedStep = stepStatus === "completed";

              return (
                <div key={`scan-step-${step.id}`} className="rounded-lg border border-white/55 bg-white/55 px-2.5 py-1.5">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    {step.label}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-semibold ${isCompletedStep
                        ? "text-emerald-700"
                        : isActiveStep
                          ? "text-blue-700"
                          : "text-slate-500"
                      }`}
                  >
                    {isCompletedStep ? "Completed" : isActiveStep ? "Running" : "Pending"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="absolute right-3 top-3 rounded-full border border-blue-200/80 bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
            {Math.round(progressPct)}%
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-blue-700">{currentStage.label}</p>
        <span className="text-[11px] font-semibold text-slate-500">Stage {stageIndex + 1} of {ANALYSIS_STAGES.length}</span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span>Finalizing Report</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="mt-1.5 relative h-2.5 overflow-hidden rounded-full border border-white/60 bg-slate-200/65">
          <motion.div
            className="relative h-full rounded-full bg-gradient-to-r from-blue-500/90 via-cyan-400/90 to-emerald-400/80"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span
              className="pointer-events-none absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
              animate={{ x: ["-40%", "180%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
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
  const navigate = useNavigate();
  const colors = riskLevelColor(data.aiRiskLevel);
  const score = data.aiScore ?? 0;
  const confidence = data.aiConfidence ?? 0;

  // Extract sub-scores from evidence if available
  const evidence = data.aiEvidence as Record<string, unknown> | null;
  const similarityScore = typeof evidence?.similarity_score === "number" ? evidence.similarity_score : null;
  const commitRisk = typeof evidence?.commit_risk_score === "number" ? evidence.commit_risk_score : null;
  const codeQuality = typeof evidence?.code_quality_score === "number" ? evidence.code_quality_score : null;
  const aiDetection = typeof evidence?.ai_detection_probability === "number" ? evidence.ai_detection_probability : null;

  const showLiveCodingAlert = (similarityScore !== null && similarityScore > 0.6) || (aiDetection !== null && aiDetection > 0.7);

  return (
    <div className="space-y-6">
      {/* Verification Alert */}
      {showLiveCodingAlert && (
        <div className="rounded-2xl border-2 border-amber-400/80 bg-amber-50/90 p-6 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
          <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
            <span className="text-xl">⚠️</span> Authorship Verification Required
          </h3>
          <p className="mt-2 text-sm text-amber-800">
            Our analysis detected patterns requiring additional verification.
            Complete live coding challenges to confirm authorship.
          </p>
          <button
            onClick={() => navigate('/student/live-coding')}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2 hover:scale-105"
          >
            Start Verification Challenges
          </button>
        </div>
      )}

      {/* Header: Score Circle + Risk Level */}
      <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white/70 via-white/50 to-slate-50/40 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Analysis Results
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
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
          <div className="space-y-2.5">
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
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
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
        <div className="rounded-2xl border border-white/60 bg-white/50 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            AI Summary
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{data.aiSummary}</p>
        </div>
      )}

      {/* Flags */}
      {data.aiFlags.length > 0 && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-6">
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
        <div className="rounded-2xl border border-blue-200/60 bg-blue-50/40 p-6">
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

      {/* Next Phase: Live Coding Challenge */}
      {data.aiChallenge && Object.keys(data.aiChallenge).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-purple-50/40 to-indigo-50/60 p-6"
        >
          <div className="flex flex-col items-start gap-3 text-left sm:items-center sm:text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_8px_20px_rgba(139,92,246,0.3)]">
              <span className="text-xl text-white">💻</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-violet-900">Phase 2: Live Coding Challenge</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Prove your authorship by modifying code from <span className="font-semibold text-violet-700">your own project</span>.
                {typeof (data.aiChallenge as Record<string, unknown>).filename === "string" && (
                  <> Based on <code className="rounded bg-violet-100/80 px-1 py-0.5 font-mono text-[11px] text-violet-800">{(data.aiChallenge as Record<string, unknown>).filename as string}</code></>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/student/live-coding", { state: { challenge: data.aiChallenge } })}
              className={`mt-1 shrink-0 rounded-xl border border-violet-300/80 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition-all hover:shadow-[0_12px_32px_rgba(139,92,246,0.45)] hover:scale-[1.02] active:scale-[0.98] ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Start Live Coding →
            </button>
          </div>
        </motion.div>
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
