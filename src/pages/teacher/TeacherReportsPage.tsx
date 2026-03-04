import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import TeacherReportViewer from "../../components/teacher/TeacherReportViewer";
import TeacherRiskBadge from "../../components/teacher/TeacherRiskBadge";
import { useTeacherData } from "../../components/teacher/TeacherDataContext";
import {
  buildRiskDistribution,
  buildSubmissionsTimeline,
  buildTopDetectedSources,
  sortBySubmittedDesc,
} from "../../components/teacher/mockData";
import type { Submission, TeacherRiskLevel } from "../../components/teacher/types";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS } from "../../components/ui/glass";

function toLinePoints(values: number[], width = 340, height = 140) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  return values
    .map((value, index) => {
      const x = (index * width) / Math.max(values.length - 1, 1);
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = height - normalized * (height - 10);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function TeacherReportsPage() {
  const { submissions } = useTeacherData();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const ordered = useMemo(() => sortBySubmittedDesc(submissions), [submissions]);

  const summary = useMemo(() => {
    const avgOriginality = Math.round(
      submissions.reduce((sum, item) => sum + item.originalityPercent, 0) / submissions.length,
    );
    const avgPlagiarism = Math.round(
      submissions.reduce((sum, item) => sum + item.plagiarismPercent, 0) / submissions.length,
    );

    const riskCounts = submissions.reduce<Record<TeacherRiskLevel, number>>(
      (acc, item) => ({ ...acc, [item.riskLevel]: acc[item.riskLevel] + 1 }),
      { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
    );

    const mostCommonRisk =
      Object.entries(riskCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "LOW";

    const highestRiskProject = [...submissions].sort((left, right) => {
      if (left.riskLevel === right.riskLevel) {
        return right.plagiarismPercent - left.plagiarismPercent;
      }

      const riskRank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as const;
      return riskRank[right.riskLevel] - riskRank[left.riskLevel];
    })[0];

    return {
      avgOriginality,
      avgPlagiarism,
      mostCommonRisk: mostCommonRisk as TeacherRiskLevel,
      highestRiskProject,
    };
  }, [submissions]);

  const riskDistribution = useMemo(() => buildRiskDistribution(submissions), [submissions]);
  const timeline = useMemo(() => buildSubmissionsTimeline(submissions), [submissions]);
  const topSources = useMemo(() => buildTopDetectedSources(submissions), [submissions]);

  const timelineValues = timeline.map((item) => item.y);
  const timelineLabels = timeline.map((item) => item.xLabel);

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <h2 className="text-base font-semibold text-slate-900">Analytics and Summaries</h2>
        <p className="mt-1 text-sm text-slate-600">High-level report intelligence from current submissions.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/65 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">Avg Originality</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary.avgOriginality}%</p>
          </div>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/65 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Avg Plagiarism</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary.avgPlagiarism}%</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/60 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Most Common Risk</p>
            <div className="mt-2">
              <TeacherRiskBadge level={summary.mostCommonRisk} />
            </div>
          </div>
          <div className="rounded-xl border border-rose-200/70 bg-rose-50/60 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">Highest Risk Project</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{summary.highestRiskProject.projectTitle}</p>
            <button
              type="button"
              onClick={() => {
                setSelectedSubmission(summary.highestRiskProject);
                setViewerOpen(true);
              }}
              className={`mt-2 rounded-lg border border-white/70 bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/90 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Open report
            </button>
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
          <h3 className="text-base font-semibold text-slate-900">Risk Distribution</h3>
          <div className="mt-3 space-y-3">
            {(Object.keys(riskDistribution) as TeacherRiskLevel[]).map((risk) => {
              const count = riskDistribution[risk];
              const max = Math.max(...Object.values(riskDistribution), 1);
              return (
                <div key={risk}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>{risk}</span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/70">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-slate-500/80 to-blue-500/80"
                      style={{ width: `${Math.max((count / max) * 100, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Submissions Over Time</h3>
          <svg className="mt-3 w-full" viewBox="0 0 340 160" fill="none" aria-hidden>
            <polyline
              points={toLinePoints(timelineValues)}
              stroke="rgba(37,99,235,0.85)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {timelineValues.map((value, index) => {
              const x = (index * 340) / Math.max(timelineValues.length - 1, 1);
              const min = Math.min(...timelineValues);
              const max = Math.max(...timelineValues);
              const normalized = max === min ? 0.5 : (value - min) / (max - min);
              const y = 140 - normalized * 130;
              return <circle key={`${value}-${index}`} cx={x} cy={y} r="4" fill="rgba(37,99,235,0.88)" />;
            })}
          </svg>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
            {timelineLabels.map((label) => (
              <span key={label} className="rounded-full border border-white/65 bg-white/55 px-2 py-0.5">
                {label}
              </span>
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
          <h3 className="text-base font-semibold text-slate-900">Detected Sources Overview</h3>
          <div className="mt-3 grid gap-2.5 md:grid-cols-2">
            {topSources.map((source) => (
              <div key={source.name} className="rounded-xl border border-white/60 bg-white/45 px-3 py-2.5">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{source.name}</span>
                  <span className="font-semibold text-slate-700">{source.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/70">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500/80 to-cyan-400/80"
                    style={{ width: `${source.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DemoGlassCard>
      </motion.section>

      <TeacherReportViewer
        open={viewerOpen}
        submission={selectedSubmission}
        onClose={() => setViewerOpen(false)}
      />
    </motion.main>
  );
}
