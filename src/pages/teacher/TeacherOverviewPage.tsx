import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import {
  OVERVIEW_SPARKLINES,
  TEACHER_SUBMISSIONS,
  buildTeacherStats,
  compareByDate,
  getRiskLevel,
  toReadableDate,
  toSparklinePoints,
} from "../../components/teacher/mockData";
import TeacherStatusBadge from "../../components/teacher/TeacherStatusBadge";
import { GLASS_INTERACTIVE_CLASS, LIST_ROW_INTERACTIVE_CLASS } from "../../components/ui/glass";

interface KpiCardItem {
  id: "total" | "review" | "completed" | "risk";
  label: string;
  value: number;
  trend: string;
  sparkline: number[];
}

function CountUpValue({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const duration = 520;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [reduceMotion, value]);

  return <>{displayValue}</>;
}

function KpiCard({ item, index }: { item: KpiCardItem; index: number }) {
  return (
    <motion.div
      className={`rounded-2xl border border-white/60 bg-white/45 p-4 ${GLASS_INTERACTIVE_CLASS}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.04 }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{item.label}</p>
        <span className="rounded-full border border-blue-200/80 bg-blue-50/70 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
          {item.trend}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        <CountUpValue value={item.value} />
      </p>
      <svg className="mt-2 h-7 w-24" viewBox="0 0 90 28" fill="none" aria-hidden>
        <polyline
          points={toSparklinePoints(item.sparkline, 90, 28)}
          stroke="rgba(59,130,246,0.9)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

export default function TeacherOverviewPage() {
  const stats = useMemo(() => buildTeacherStats(TEACHER_SUBMISSIONS), []);

  const kpiCards = useMemo<KpiCardItem[]>(
    () => [
      {
        id: "total",
        label: "Total Submissions",
        value: stats.totalSubmissions,
        trend: "+8%",
        sparkline: [...OVERVIEW_SPARKLINES.total],
      },
      {
        id: "review",
        label: "Under Review",
        value: stats.underReview,
        trend: "+3%",
        sparkline: [...OVERVIEW_SPARKLINES.underReview],
      },
      {
        id: "completed",
        label: "Completed",
        value: stats.completed,
        trend: "+11%",
        sparkline: [...OVERVIEW_SPARKLINES.completed],
      },
      {
        id: "risk",
        label: "High Risk Projects",
        value: stats.highRiskProjects,
        trend: "+1%",
        sparkline: [...OVERVIEW_SPARKLINES.highRisk],
      },
    ],
    [stats],
  );

  const recentActivity = useMemo(
    () =>
      [...TEACHER_SUBMISSIONS]
        .sort((left, right) => compareByDate(right.submittedAt, left.submittedAt))
        .slice(0, 6),
    [],
  );

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-6 sm:p-8 ${GLASS_INTERACTIVE_CLASS}`}>
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Teacher Overview</h2>
        <p className="mt-2 text-sm text-slate-600">
          Track submissions, review load, and current plagiarism risk.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((item, index) => (
            <KpiCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </DemoGlassCard>

      <motion.section
        className="mt-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.05 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
            <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {recentActivity.length} Items
            </span>
          </div>

          <div className="mt-3 grid gap-2.5">
            {recentActivity.map((submission) => (
              <div
                key={submission.id}
                className={`rounded-xl border border-white/55 bg-white/40 px-3.5 py-3 ${LIST_ROW_INTERACTIVE_CLASS}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{submission.projectTitle}</p>
                  <TeacherStatusBadge status={submission.status} />
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {submission.studentName} ({submission.rollNo}) • {toReadableDate(submission.submittedAt)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Plagiarism: {submission.plagiarismPercent}% • Risk: {getRiskLevel(submission.plagiarismPercent)}
                </p>
              </div>
            ))}
          </div>
        </DemoGlassCard>
      </motion.section>
    </motion.main>
  );
}
