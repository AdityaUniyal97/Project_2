import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import MetricCard from "../../components/student/review/MetricCard";
import PipelineStep from "../../components/student/review/PipelineStep";
import {
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
        },
      }));

      setSelectedSubmissionId((current) => current ?? submissionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start AI review.");
    } finally {
      setIsStartingReview(false);
    }
  };

  const selectedReviewData = selectedSubmissionId ? statusById[selectedSubmissionId] : undefined;
  const showCompletedResults = selectedStatus === "completed";

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
                  {status === "submitted" ? (
                    <div className="mt-3 flex justify-end">
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
                          : "Start AI Review"}
                      </button>
                    </div>
                  ) : null}
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
              disabled={!selectedSubmission || selectedStatus !== "submitted" || isStartingReview}
              onClick={() => {
                if (!selectedSubmission) return;
                void handleStartReview(selectedSubmission.id);
              }}
              className={`rounded-lg border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_14px_26px_rgba(37,99,235,0.24)] transition hover:shadow-[0_18px_30px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              {isStartingReview ? "Starting..." : "Start AI Review"}
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
            submitted -&gt; queued -&gt; processing -&gt; completed
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

          <div className="mt-5 rounded-2xl border border-white/60 bg-white/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              AI Result
            </p>

            {showCompletedResults ? (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    index={0}
                    label="AI Score"
                    value={
                      typeof selectedReviewData?.aiScore === "number"
                        ? `${selectedReviewData.aiScore}`
                        : "--"
                    }
                    helper="Score available after AI processing"
                  />
                  <MetricCard
                    index={1}
                    label="Flags"
                    value={`${selectedReviewData?.aiFlags?.length ?? 0}`}
                    helper="Potential flags identified"
                  />
                  <MetricCard
                    index={2}
                    label="Status"
                    value="Completed"
                    helper="Review pipeline state"
                  />
                </div>
                <p className="mt-4 text-sm text-slate-700">
                  {selectedReviewData?.aiSummary?.trim()
                    ? selectedReviewData.aiSummary
                    : "AI analysis will appear here once processing is complete."}
                </p>
                {(selectedReviewData?.aiFlags?.length ?? 0) > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedReviewData!.aiFlags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full border border-amber-200/85 bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-700"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-700">
                AI analysis will appear here once processing is complete.
              </p>
            )}
          </div>
        </DemoGlassCard>
      </section>
    </motion.main>
  );
}
