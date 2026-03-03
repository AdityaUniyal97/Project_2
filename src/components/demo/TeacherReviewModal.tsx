import { AnimatePresence, motion } from "framer-motion";
import DemoGlassCard from "./DemoGlassCard";
import StatusBadge from "./StatusBadge";
import type { TeacherSubmission } from "./types";

interface TeacherReviewModalProps {
  open: boolean;
  submission: TeacherSubmission | null;
  onClose: () => void;
}

type Risk = "High" | "Medium" | "Low";

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

export default function TeacherReviewModal({
  open,
  submission,
  onClose,
}: TeacherReviewModalProps) {
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
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <DemoGlassCard className="h-full max-h-[90vh] overflow-y-auto p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                    Plagiarism Review
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Detailed AI report for {submission.projectTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/60 bg-white/55 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-white/80"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <DemoGlassCard className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Project Details
                  </h3>
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
                      className="rounded-xl border border-blue-200/70 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/70"
                    >
                      GitHub Repo
                    </a>
                    <a
                      href={submission.liveDemoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-cyan-200/70 bg-cyan-50/70 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100/75"
                    >
                      Live Demo
                    </a>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200/75 bg-slate-50/75 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100/80"
                    >
                      Download ZIP
                    </button>
                  </div>
                </DemoGlassCard>

                <DemoGlassCard className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    AI Analysis
                  </h3>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between rounded-xl border border-white/50 bg-white/35 px-3 py-2">
                      <span>Plagiarism Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {submission.plagiarismPercent}%
                        </span>
                        <StatusBadge
                          label={getRisk(submission.plagiarismPercent)}
                          tone={riskTone(getRisk(submission.plagiarismPercent))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/50 bg-white/35 px-3 py-2">
                      <span>AI Generated Probability</span>
                      <span className="font-semibold">
                        {submission.aiGeneratedProbability}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/50 bg-white/35 px-3 py-2">
                      <span>Originality</span>
                      <span className="font-semibold">
                        {submission.originalityPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sources Detected
                    </h4>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {submission.sourcesDetected.map((source) => (
                        <li
                          key={source}
                          className="rounded-full border border-white/60 bg-white/45 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                </DemoGlassCard>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <DemoGlassCard className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Suggested Viva Questions
                  </h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                    {submission.vivaQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ol>
                </DemoGlassCard>
                <DemoGlassCard className="p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Suggested Improvements
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                    {submission.improvements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </DemoGlassCard>
              </div>

              <DemoGlassCard className="mt-4 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Project Preview
                </h3>
                <div className="mt-3 rounded-2xl border border-dashed border-blue-200/80 bg-gradient-to-br from-white/60 via-blue-50/45 to-cyan-50/45 p-6 text-center text-sm text-slate-600">
                  Interactive preview placeholder
                </div>
                {submission.liveDemoUrl ? (
                  <a
                    href={submission.liveDemoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-xl border border-cyan-200/70 bg-cyan-50/70 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100/80"
                  >
                    Open Preview
                  </a>
                ) : null}
              </DemoGlassCard>
            </DemoGlassCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
