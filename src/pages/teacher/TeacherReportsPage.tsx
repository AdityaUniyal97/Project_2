import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import {
  TEACHER_SUBMISSIONS,
  compareByDate,
  getRiskLevel,
} from "../../components/teacher/mockData";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../../components/ui/glass";

function ScoreRing({ value }: { value: number }) {
  const radius = 42;
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

export default function TeacherReportsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get("submission");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const sortedSubmissions = useMemo(
    () =>
      [...TEACHER_SUBMISSIONS].sort((left, right) =>
        compareByDate(right.submittedAt, left.submittedAt),
      ),
    [],
  );

  const selectedSubmission =
    sortedSubmissions.find((item) => item.id === submissionId) ?? sortedSubmissions[0];

  const avgOriginality = useMemo(
    () =>
      Math.round(
        sortedSubmissions.reduce((sum, item) => sum + item.originalityPercent, 0) /
          sortedSubmissions.length,
      ),
    [sortedSubmissions],
  );

  const highestRisk = useMemo(
    () => [...sortedSubmissions].sort((left, right) => right.plagiarismPercent - left.plagiarismPercent)[0],
    [sortedSubmissions],
  );
  const lowestRisk = useMemo(
    () => [...sortedSubmissions].sort((left, right) => left.plagiarismPercent - right.plagiarismPercent)[0],
    [sortedSubmissions],
  );

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Reports</h2>
            <p className="mt-1 text-xs text-slate-600">
              Reviewing {selectedSubmission.projectTitle} ({selectedSubmission.rollNo})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedSubmission.id}
              onChange={(event) =>
                navigate(`/teacher/reports?submission=${encodeURIComponent(event.target.value)}`)
              }
              className="rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              {sortedSubmissions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.projectTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-200/75 bg-blue-50/60 p-3">
            <p className="text-xs font-medium text-blue-700">Avg Originality</p>
            <p className="mt-1 text-2xl font-semibold text-blue-900">{avgOriginality}%</p>
          </div>
          <div className="rounded-xl border border-rose-200/75 bg-rose-50/60 p-3">
            <p className="text-xs font-medium text-rose-700">Highest Risk</p>
            <p className="mt-1 text-sm font-semibold text-rose-900">
              {highestRisk.projectTitle} ({highestRisk.plagiarismPercent}%)
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200/75 bg-emerald-50/60 p-3">
            <p className="text-xs font-medium text-emerald-700">Lowest Risk</p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              {lowestRisk.projectTitle} ({lowestRisk.plagiarismPercent}%)
            </p>
          </div>
        </div>
      </DemoGlassCard>

      <motion.section
        className="mt-5 grid gap-5 lg:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.05 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Originality Score</h3>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <ScoreRing value={selectedSubmission.originalityPercent} />
            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Plagiarism:{" "}
                <span className="font-semibold text-slate-800">
                  {selectedSubmission.plagiarismPercent}%
                </span>
              </p>
              <p>
                Risk:{" "}
                <span className="font-semibold text-slate-800">
                  {getRiskLevel(selectedSubmission.plagiarismPercent)}
                </span>
              </p>
              <p>
                Student:{" "}
                <span className="font-semibold text-slate-800">
                  {selectedSubmission.studentName} ({selectedSubmission.rollNo})
                </span>
              </p>
            </div>
          </div>
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Detected Sources</h3>
          <div className="mt-3 grid gap-2.5">
            {selectedSubmission.detectedSources.map((source) => (
              <div
                key={source.name}
                className={`rounded-xl border border-white/55 bg-white/40 px-3 py-2.5 ${LIST_ROW_INTERACTIVE_CLASS}`}
              >
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{source.name}</span>
                  <span className="font-semibold text-slate-700">{source.similarity}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/55">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-rose-500/80 to-orange-500/80"
                    style={{ width: `${source.similarity}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DemoGlassCard>
      </motion.section>

      <motion.section
        className="mt-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.08 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Viva Suggestions</h3>
          <div className="mt-3 space-y-2">
            {selectedSubmission.vivaSuggestions.map((suggestion, index) => {
              const expanded = expandedIndex === index;
              return (
                <div key={suggestion} className="overflow-hidden rounded-xl border border-white/55 bg-white/40">
                  <button
                    type="button"
                    onClick={() => setExpandedIndex((current) => (current === index ? null : index))}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    <span>{suggestion}</span>
                    <span className="text-xs text-slate-500">{expanded ? "Hide" : "Open"}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {expanded ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/45 px-3 py-2 text-xs text-slate-600"
                      >
                        Ask for implementation evidence, design trade-offs, and validation strategy.
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </DemoGlassCard>
      </motion.section>
    </motion.main>
  );
}
