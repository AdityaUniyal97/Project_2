import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ReportDecision } from "./TeacherDataContext";
import { useTeacherData } from "./TeacherDataContext";
import TeacherRiskBadge from "./TeacherRiskBadge";
import TeacherStatusBadge from "./TeacherStatusBadge";
import type { Submission } from "./types";
import { BUTTON_INTERACTIVE_CLASS, INPUT_GLOW_CLASS } from "../ui/glass";

type ReportViewerTab = "summary" | "evidence" | "viva" | "evaluation" | "live-demo" | "consciousness" | "live-coding";
type DemoViewport = "desktop" | "tablet" | "mobile";

interface TeacherReportViewerProps {
  open: boolean;
  submission: Submission | null;
  onClose: () => void;
  initialTab?: ReportViewerTab;
}

const TABS: Array<{ id: ReportViewerTab; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "evidence", label: "Evidence" },
  { id: "viva", label: "Viva Pack" },
  { id: "evaluation", label: "Evaluation" },
  { id: "live-demo", label: "Live Demo" },
  { id: "consciousness", label: "Consciousness Timeline" },
  { id: "live-coding", label: "Live Coding Arena" },
];

const DECISION_BUTTONS: ReportDecision[] = ["Accept", "Needs Viva", "Flag"];

const CHECKLIST_ITEMS = [
  { id: "architecture", label: "Architecture explanation is coherent" },
  { id: "explanation", label: "Student can defend implementation choices" },
  { id: "testing", label: "Testing evidence is credible" },
  { id: "originality", label: "Originality concerns addressed in viva" },
  { id: "deployment", label: "Deployment and rollback strategy explained" },
];

function groupByTopic(submission: Submission) {
  const grouped = new Map<string, Submission["vivaQuestions"]>();

  submission.vivaQuestions.forEach((question) => {
    const current = grouped.get(question.topicTag) ?? [];
    grouped.set(question.topicTag, [...current, question]);
  });

  return Array.from(grouped.entries());
}

function scoreTile(label: string, value: string, tone: "slate" | "blue" | "amber" | "rose") {
  const toneClass = {
    slate: "border-white/60 bg-white/45 text-slate-800",
    blue: "border-blue-200/80 bg-blue-50/70 text-blue-800",
    amber: "border-amber-200/80 bg-amber-50/70 text-amber-800",
    rose: "border-rose-200/80 bg-rose-50/70 text-rose-800",
  } as const;

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

import ConsciousnessTimeline from "../../components/ConsciousnessTimeline";
import AdversarialTribunal from "../../components/teacher/AdversarialTribunal";
import LiveCodingArena from "../../components/teacher/LiveCodingArena";

export default function TeacherReportViewer({
  open,
  submission,
  onClose,
  initialTab = "summary",
}: TeacherReportViewerProps) {
  const {
    notesBySubmission,
    setTeacherNotes,
    decisionsBySubmission,
    setDecision,
    evaluationBySubmission,
    setEvaluationRating,
    toggleEvaluationCheck,
    updateSubmissionStatus,
    vivaState,
    updateVivaStatus,
    setVivaOutcome,
    toggleQuestionAsked,
    setQuestionNotes,
  } = useTeacherData();

  const [activeTab, setActiveTab] = useState<ReportViewerTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [viewport, setViewport] = useState<DemoViewport>("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [frameBlocked, setFrameBlocked] = useState(false);

  const [consciousnessData, setConsciousnessData] = useState<any>(null);
  const [isConsciousnessLoading, setIsConsciousnessLoading] = useState(false);
  const [consciousnessError, setConsciousnessError] = useState<string | null>(null);

  const activeId = submission?.id ?? "";

  useEffect(() => {
    if (!open || !submission) return;

    setActiveTab(initialTab);
    setIsLoading(true);
    const delay = 500 + (submission.projectTitle.length % 401);
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [open, submission, initialTab]);

  useEffect(() => {
    if (!open || !submission || !submission.liveDemoUrl || activeTab !== "live-demo") return;

    setIsFrameLoading(true);
    setFrameBlocked(false);
    const timeout = window.setTimeout(() => {
      setIsFrameLoading(false);
      setFrameBlocked(true);
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [activeTab, frameKey, open, submission]);

  useEffect(() => {
    if (activeTab === "consciousness" && open && submission && !consciousnessData && !isConsciousnessLoading && !consciousnessError) {
      setIsConsciousnessLoading(true);
      fetch("http://localhost:8100/api/consciousness/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Use the github repo url, if empty fallback
        body: JSON.stringify({ github_url: submission.githubUrl || "https://github.com/AdityaUniyal97/Bus-Tracking-app" }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setConsciousnessData(data);
          setIsConsciousnessLoading(false);
        })
        .catch((err) => {
          setConsciousnessError(err.message);
          setIsConsciousnessLoading(false);
          console.error("Consciousness failed: ", err);
        });
    }
  }, [activeTab, open, submission, consciousnessData, isConsciousnessLoading, consciousnessError]);

  useEffect(() => {
    if (!open) {
      setExpandedTopic(null);
    }
  }, [open]);

  const groupedViva = useMemo(() => (submission ? groupByTopic(submission) : []), [submission]);

  if (!submission) return null;

  const notes = notesBySubmission[activeId] ?? "";
  const selectedDecision = decisionsBySubmission[activeId] ?? null;
  const evaluation =
    evaluationBySubmission[activeId] ??
    ({
      rating: 6,
      checklist: {
        architecture: true,
        explanation: false,
        testing: false,
        originality: false,
        deployment: false,
      },
    } as const);
  const vivaEntry = vivaState[activeId];

  const viewportWidth =
    viewport === "desktop" ? "100%" : viewport === "tablet" ? "820px" : "390px";

  const onCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // no-op
    }
  };

  const onCopyVivaPack = async () => {
    const payload = submission.aiViva.length > 0
      ? submission.aiViva.map((q, i) => `${i + 1}. ${q}`).join("\n")
      : submission.vivaQuestions.map((q, i) => `${i + 1}. [${q.topicTag}] ${q.question}`).join("\n");

    await onCopy(payload);
  };

  const renderSummaryTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <TeacherRiskBadge level={submission.riskLevel} />
        <TeacherStatusBadge status={submission.status} />
        {submission.aiRiskLevel ? (
          <span className="rounded-full border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {submission.aiRiskLevel}
          </span>
        ) : null}
        {submission.aiRecommendation ? (
          <span className="rounded-full border border-blue-200/80 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            {submission.aiRecommendation.replace(/_/g, " ")}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {scoreTile("Authenticity", `${submission.originalityPercent}%`, "blue")}
        {scoreTile("Similarity", `${Math.round(submission.similarityScore * 100)}%`, "amber")}
        {scoreTile("Commit Risk", `${Math.round(submission.commitRiskScore * 100)}%`, "rose")}
        {scoreTile("AI Confidence", `${Math.round(submission.aiConfidence)}%`, "slate")}
      </div>

      <div className="rounded-xl border border-white/60 bg-white/45 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          AI Summary
        </p>
        <p className="mt-1 text-sm text-slate-700">{submission.summaryNarrative}</p>
      </div>

      {submission.aiFlags.length > 0 && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
            Flags ({submission.aiFlags.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {submission.aiFlags.map((flag, i) => (
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

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Teacher Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setTeacherNotes(activeId, event.target.value)}
          placeholder="Write your review notes..."
          className={`mt-1 h-24 w-full resize-none rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {DECISION_BUTTONS.map((decision) => {
          const active = selectedDecision === decision;
          return (
            <button
              key={decision}
              type="button"
              onClick={() => {
                setDecision(activeId, decision);
                if (decision === "Accept") {
                  updateSubmissionStatus(activeId, "Completed");
                }
                if (decision === "Needs Viva") {
                  updateVivaStatus(activeId, "Pending");
                }
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${active
                ? "border-blue-300/90 bg-blue-100/85 text-blue-800"
                : "border-white/65 bg-white/65 text-slate-700 hover:bg-white/85"
                } ${BUTTON_INTERACTIVE_CLASS}`}
            >
              {decision}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderEvidenceTab = () => (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/60 bg-white/45 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Score Breakdown</p>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Similarity: <span className="font-semibold">{Math.round(submission.similarityScore * 100)}%</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Commit risk: <span className="font-semibold">{Math.round(submission.commitRiskScore * 100)}%</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              AI detection: <span className="font-semibold">{Math.round(submission.aiDetectionProbability * 100)}%</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Code quality: <span className="font-semibold">{Math.round(submission.codeQualityScore * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/60 bg-white/45 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Verdict Details</p>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Authenticity score: <span className="font-semibold">{Math.round(submission.aiScore)}/100</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Confidence: <span className="font-semibold">{Math.round(submission.aiConfidence)}%</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Risk level: <span className="font-semibold">{submission.aiRiskLevel || "N/A"}</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Recommendation: <span className="font-semibold">{(submission.aiRecommendation || "N/A").replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVivaTab = () => (
    <div className="space-y-3">
      <AdversarialTribunal submissionId={activeId} consciousnessData={consciousnessData} />
    </div>
  );

  const renderEvaluationTab = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/60 bg-white/45 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Rubric Checklist</p>
        <div className="mt-2 space-y-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(evaluation.checklist[item.id])}
                onChange={() => toggleEvaluationCheck(activeId, item.id)}
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/60 bg-white/45 p-3">
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
          <span>Final Rating</span>
          <span>{evaluation.rating}/10</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={evaluation.rating}
          onChange={(event) => setEvaluationRating(activeId, Number(event.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      <button
        type="button"
        onClick={() => updateSubmissionStatus(activeId, "Completed")}
        className={`rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100/85 ${BUTTON_INTERACTIVE_CLASS}`}
      >
        Mark Completed
      </button>
    </div>
  );

  const renderLiveDemoTab = () => {
    if (!submission.liveDemoUrl) {
      return (
        <div className="rounded-xl border border-white/60 bg-white/45 px-4 py-5 text-center text-sm text-slate-600">
          No Live Demo URL provided.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-white/60 bg-white/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={submission.liveDemoUrl}
              className="min-w-0 flex-1 rounded-lg border border-white/70 bg-white/70 px-2.5 py-1.5 text-xs text-slate-700"
            />
            <button
              type="button"
              onClick={() => onCopy(submission.liveDemoUrl ?? "")}
              className={`rounded-lg border border-white/70 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setFrameKey((current) => current + 1)}
              className={`rounded-lg border border-white/70 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => window.open(submission.liveDemoUrl, "_blank", "noopener,noreferrer")}
              className={`rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-1.5 text-xs font-semibold text-blue-700 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Open in new tab
            </button>
          </div>

          <div className="mt-3 inline-flex items-center rounded-lg border border-white/70 bg-white/70 p-1">
            {(["desktop", "tablet", "mobile"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewport(mode)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${viewport === mode ? "bg-white text-slate-800 shadow" : "text-slate-500"
                  }`}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/60 bg-white/45 p-3">
          <div className="flex min-w-[360px] justify-center">
            <motion.div
              animate={{ width: viewportWidth }}
              transition={{ duration: 0.26 }}
              className="relative h-[460px] max-w-full overflow-hidden rounded-xl border border-slate-300/60 bg-slate-100"
            >
              {isFrameLoading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm font-medium text-slate-600">
                  Loading preview...
                </div>
              ) : null}

              {frameBlocked ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/90 px-5 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Preview not available here. Open in new tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.open(submission.liveDemoUrl, "_blank", "noopener,noreferrer")}
                    className={`rounded-lg border border-blue-200/80 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    Open in new tab
                  </button>
                </div>
              ) : null}

              <iframe
                key={`${submission.liveDemoUrl}-${frameKey}`}
                src={submission.liveDemoUrl}
                title={`${submission.projectTitle} live demo`}
                className="h-full w-full bg-white"
                onLoad={() => {
                  setIsFrameLoading(false);
                  setFrameBlocked(false);
                }}
                onError={() => {
                  setIsFrameLoading(false);
                  setFrameBlocked(true);
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    );
  };

  const renderConsciousnessTab = () => {
    if (isConsciousnessLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 rounded-xl border border-white/60 bg-[#0B0F19] h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-sm font-semibold text-cyan-400 animate-pulse">Running Quantum Commit Archaeology...</p>
          <p className="text-xs text-slate-500 mt-2 text-center max-w-sm">This performs a 1M context pull out of the developer's entire git history. This may take up to 60-120 seconds for deep architectures...</p>
        </div>
      );
    }
    if (consciousnessError) {
      return (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-5 text-center text-sm text-red-500">
          <p className="font-bold mb-2">Consciousness Engine Failure</p>
          {consciousnessError}
        </div>
      );
    }
    if (consciousnessData?.timeline_data) {
      return <ConsciousnessTimeline data={consciousnessData.timeline_data} studentName={submission.studentName} />;
    }
    return (
      <div className="rounded-xl border border-white/60 bg-white/45 px-4 py-5 text-center text-sm text-slate-600">
        Click to initiate Consciousness Scan
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <div className="h-4 w-48 animate-pulse rounded bg-white/60" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-white/60" />
            ))}
          </div>
          <div className="h-24 animate-pulse rounded-xl bg-white/60" />
          <div className="h-20 animate-pulse rounded-xl bg-white/60" />
        </div>
      );
    }

    if (activeTab === "summary") return renderSummaryTab();
    if (activeTab === "evidence") return renderEvidenceTab();
    if (activeTab === "viva") return renderVivaTab();
    if (activeTab === "evaluation") return renderEvaluationTab();
    if (activeTab === "consciousness") return renderConsciousnessTab();
    if (activeTab === "live-coding") return (
      <div className="space-y-3">
        <LiveCodingArena submissionId={activeId} riskScores={submission} />
      </div>
    );
    return renderLiveDemoTab();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-3 sm:items-center sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel glass-edge max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/50 bg-white/40 shadow-[0_30px_80px_rgba(15,23,42,0.24)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/45 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Report Viewer
                  </p>
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                    {submission.projectTitle}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {submission.studentName} ({submission.rollNumber})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-lg border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/90 ${BUTTON_INTERACTIVE_CLASS}`}
                >
                  Close
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${activeTab === tab.id
                      ? "border-blue-200/90 bg-blue-50/80 text-blue-700"
                      : "border-white/65 bg-white/65 text-slate-600 hover:bg-white/85"
                      } ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(92vh-148px)] overflow-y-auto px-4 py-4 sm:px-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${submission.id}-${activeTab}-${isLoading ? "loading" : "ready"}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
