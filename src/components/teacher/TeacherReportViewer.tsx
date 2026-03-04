import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ReportDecision } from "./TeacherDataContext";
import { useTeacherData } from "./TeacherDataContext";
import TeacherRiskBadge from "./TeacherRiskBadge";
import TeacherStatusBadge from "./TeacherStatusBadge";
import type { Submission } from "./types";
import { BUTTON_INTERACTIVE_CLASS, INPUT_GLOW_CLASS } from "../ui/glass";

type ReportViewerTab = "summary" | "evidence" | "viva" | "evaluation" | "live-demo";
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
    const payload = submission.vivaQuestions
      .map((question, index) => `${index + 1}. [${question.topicTag}] ${question.question}`)
      .join("\n");

    await onCopy(payload);
  };

  const renderSummaryTab = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <TeacherRiskBadge level={submission.riskLevel} />
        <TeacherStatusBadge status={submission.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {scoreTile("Originality", `${submission.originalityPercent}%`, "blue")}
        {scoreTile("Structure Overlap", `${submission.structuralOverlapPercent}%`, "amber")}
        {scoreTile("Commit Risk", `${submission.commitRiskScore.toFixed(1)}/10`, "rose")}
        {scoreTile("AI Confidence", `${submission.aiConfidencePercent}%`, "slate")}
      </div>

      <div className="rounded-xl border border-white/60 bg-white/45 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Narrative Summary
        </p>
        <p className="mt-1 text-sm text-slate-700">{submission.summaryNarrative}</p>
      </div>

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
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                active
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
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Detected Sources</p>
          <div className="mt-2 space-y-2">
            {submission.detectedSources.map((source) => (
              <div key={source.name}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{source.name}</span>
                  <span className="font-semibold text-slate-700">{source.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/70">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-slate-500/85 to-blue-500/80"
                    style={{ width: `${source.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/60 bg-white/45 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Overlap Breakdown</p>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Structural overlap: <span className="font-semibold">{submission.structuralOverlapPercent}%</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Text similarity: <span className="font-semibold">{submission.plagiarismPercent}%</span>
            </div>
            <div className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
              Commit risk score: <span className="font-semibold">{submission.commitRiskScore.toFixed(1)}/10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/60 bg-white/45 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Commit Pattern Timeline</p>
        <div className="mt-2 grid grid-cols-8 gap-2">
          {Array.from({ length: 8 }, (_, index) => {
            const value = Math.max(
              18,
              Math.round((submission.commitRiskScore * 9 + index * 11 + submission.originalityPercent) % 100),
            );
            return (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="flex h-20 w-full items-end rounded-lg bg-white/70 p-1">
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-slate-500/80 to-cyan-400/80"
                    style={{ height: `${value}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">W{index + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderVivaTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Viva Questions</p>
        <button
          type="button"
          onClick={onCopyVivaPack}
          className={`rounded-lg border border-white/65 bg-white/65 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/85 ${BUTTON_INTERACTIVE_CLASS}`}
        >
          Copy pack
        </button>
      </div>

      {groupedViva.map(([topic, questions]) => {
        const expanded = expandedTopic === topic;
        return (
          <div key={topic} className="overflow-hidden rounded-xl border border-white/60 bg-white/45">
            <button
              type="button"
              onClick={() => setExpandedTopic((current) => (current === topic ? null : topic))}
              className="flex w-full items-center justify-between px-3 py-2 text-left"
            >
              <span className="text-sm font-semibold text-slate-800">{topic}</span>
              <span className="text-xs text-slate-500">{expanded ? "Hide" : "Open"}</span>
            </button>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/50 px-3 py-3"
                >
                  <div className="space-y-3">
                    {questions.map((question) => {
                      const state = vivaEntry?.questions[question.id];
                      return (
                        <div key={question.id} className="rounded-lg border border-white/65 bg-white/60 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800">{question.question}</p>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {question.difficulty}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{question.expectedTalkingPoints}</p>

                          <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(state?.asked)}
                              onChange={() => toggleQuestionAsked(activeId, question.id)}
                            />
                            Asked
                          </label>

                          <textarea
                            value={state?.notes ?? ""}
                            onChange={(event) =>
                              setQuestionNotes(activeId, question.id, event.target.value)
                            }
                            placeholder="Notes for this question"
                            className={`mt-2 h-16 w-full resize-none rounded-lg border border-white/65 bg-white/70 px-2.5 py-2 text-xs text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
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
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewport === mode ? "bg-white text-slate-800 shadow" : "text-slate-500"
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
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      activeTab === tab.id
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
