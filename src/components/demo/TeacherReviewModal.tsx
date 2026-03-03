import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import DemoGlassCard from "./DemoGlassCard";
import StatusBadge from "./StatusBadge";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../ui/glass";
import type { TeacherSubmission } from "./types";

interface TeacherReviewModalProps {
  open: boolean;
  submission: TeacherSubmission | null;
  onClose: () => void;
}

type Risk = "High" | "Medium" | "Low";
type ReportTab = "summary" | "similarity" | "viva" | "suggestions";

const REPORT_TABS: Array<{ id: ReportTab; label: string }> = [
  { id: "summary", label: "Summary" },
  { id: "similarity", label: "Similarity" },
  { id: "viva", label: "Viva" },
  { id: "suggestions", label: "Suggestions" },
];

function getRisk(score: number): Risk {
  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

function riskTone(risk: Risk): "danger" | "warning" | "good" {
  if (risk === "High") return "danger";
  if (risk === "Medium") return "warning";
  return "good";
}

function sourcePercent(source: string, index: number) {
  let hash = 0;
  for (let cursor = 0; cursor < source.length; cursor += 1) {
    hash = (hash * 33 + source.charCodeAt(cursor)) % 97;
  }
  return 15 + ((hash + index * 11) % 76);
}

function SkeletonBlock() {
  return <div className="h-4 animate-pulse rounded-md bg-white/50" />;
}

function ScoreRing({ value }: { value: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);

  return (
    <div className="relative inline-flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={radius} stroke="rgba(148,163,184,0.22)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="rgba(16,185,129,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-semibold text-slate-900">{value}%</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Originality</p>
      </div>
    </div>
  );
}

export default function TeacherReviewModal({
  open,
  submission,
  onClose,
}: TeacherReviewModalProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedVivaIndex, setExpandedVivaIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !submission) return;

    setActiveTab("summary");
    setExpandedVivaIndex(null);
    setIsLoading(true);

    const delay = 500 + Math.floor(Math.random() * 401);
    const timeoutId = window.setTimeout(() => {
      setIsLoading(false);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [open, submission]);

  const sourceBreakdown = useMemo(() => {
    if (!submission) return [];
    return submission.sourcesDetected.map((source, index) => ({
      source,
      percent: sourcePercent(source, index),
    }));
  }, [submission]);

  return (
    <AnimatePresence>
      {open && submission ? (
        <motion.div
          key="review-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-6xl overflow-hidden"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <DemoGlassCard className="h-full max-h-[90vh] overflow-y-auto p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Plagiarism Review</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Detailed AI report for {submission.projectTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-xl border border-white/60 bg-white/55 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white/80 ${BUTTON_INTERACTIVE_CLASS}`}
                >
                  Close
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {REPORT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      activeTab === tab.id
                        ? "border border-white/65 bg-white/75 text-slate-800 shadow-[0_8px_18px_rgba(30,64,175,0.12)]"
                        : "border border-transparent bg-white/30 text-slate-600 hover:border-white/45 hover:bg-white/50"
                    } ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <DemoGlassCard className="grid gap-3 p-5 sm:grid-cols-2">
                  <SkeletonBlock />
                  <SkeletonBlock />
                  <SkeletonBlock />
                  <SkeletonBlock />
                  <div className="sm:col-span-2">
                    <SkeletonBlock />
                  </div>
                </DemoGlassCard>
              ) : null}

              {!isLoading && activeTab === "summary" ? (
                <motion.div
                  className="grid gap-4 lg:grid-cols-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <DemoGlassCard className={`p-5 ${GLASS_INTERACTIVE_CLASS}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Project Details</h3>
                    <dl className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <dt className="font-medium text-slate-500">Project</dt>
                        <dd>{submission.projectTitle}</dd>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <dt className="font-medium text-slate-500">Student</dt>
                        <dd>{submission.studentName}</dd>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <dt className="font-medium text-slate-500">Roll No</dt>
                        <dd>{submission.rollNo}</dd>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-2">
                        <dt className="font-medium text-slate-500">Branch</dt>
                        <dd>{submission.branch}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={submission.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/70 ${BUTTON_INTERACTIVE_CLASS}`}
                      >
                        GitHub Repo
                      </a>
                      {submission.liveDemoUrl ? (
                        <a
                          href={submission.liveDemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`rounded-xl border border-cyan-200/70 bg-cyan-50/70 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100/75 ${BUTTON_INTERACTIVE_CLASS}`}
                        >
                          Live Demo
                        </a>
                      ) : null}
                    </div>
                  </DemoGlassCard>

                  <DemoGlassCard className={`p-5 ${GLASS_INTERACTIVE_CLASS}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Score Summary</h3>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                      <ScoreRing value={submission.originalityPercent} />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                          <span>Plagiarism Risk</span>
                          <StatusBadge
                            label={getRisk(submission.plagiarismPercent)}
                            tone={riskTone(getRisk(submission.plagiarismPercent))}
                          />
                        </div>
                        <div className="text-xs text-slate-600">AI Generated: {submission.aiGeneratedProbability}%</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                          <span>Structure Similarity</span>
                          <span>{Math.min(submission.plagiarismPercent + 8, 96)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/50">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500/85 to-cyan-500/85"
                            style={{ width: `${Math.min(submission.plagiarismPercent + 8, 96)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                          <span>Semantic Similarity</span>
                          <span>{Math.min(submission.plagiarismPercent + 15, 98)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/50">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-amber-500/85 to-orange-500/85"
                            style={{ width: `${Math.min(submission.plagiarismPercent + 15, 98)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </DemoGlassCard>
                </motion.div>
              ) : null}

              {!isLoading && activeTab === "similarity" ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <DemoGlassCard className={`p-5 ${GLASS_INTERACTIVE_CLASS}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Detected Sources</h3>
                    <div className="mt-3 space-y-3">
                      {sourceBreakdown.map((item) => (
                        <div key={item.source} className={`rounded-xl border border-white/55 bg-white/40 p-3 ${LIST_ROW_INTERACTIVE_CLASS}`}>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                            <span>{item.source}</span>
                            <span>{item.percent}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/50">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-rose-500/80 to-orange-500/80"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </DemoGlassCard>
                </motion.div>
              ) : null}

              {!isLoading && activeTab === "viva" ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <DemoGlassCard className={`p-5 ${GLASS_INTERACTIVE_CLASS}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Viva Questions</h3>
                    <div className="mt-3 space-y-2">
                      {submission.vivaQuestions.map((question, index) => {
                        const expanded = expandedVivaIndex === index;
                        return (
                          <div key={question} className="overflow-hidden rounded-xl border border-white/55 bg-white/40">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedVivaIndex((current) => (current === index ? null : index))
                              }
                              className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
                            >
                              <span>{question}</span>
                              <span className="text-xs text-slate-500">{expanded ? "Hide" : "Expand"}</span>
                            </button>
                            <AnimatePresence>
                              {expanded ? (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-white/45 px-3 py-2 text-xs text-slate-600"
                                >
                                  Discuss implementation decisions, trade-offs, and evidence in your repo.
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </DemoGlassCard>
                </motion.div>
              ) : null}

              {!isLoading && activeTab === "suggestions" ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <DemoGlassCard className={`p-5 ${GLASS_INTERACTIVE_CLASS}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Improvement Checklist</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {submission.improvements.map((item) => (
                        <li key={item} className={`flex items-start gap-2 rounded-xl border border-white/55 bg-white/40 px-3 py-2 ${LIST_ROW_INTERACTIVE_CLASS}`}>
                          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" readOnly />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </DemoGlassCard>
                </motion.div>
              ) : null}
            </DemoGlassCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
