import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import TeacherReportViewer from "../../components/teacher/TeacherReportViewer";
import TeacherRiskBadge from "../../components/teacher/TeacherRiskBadge";
import TeacherStatusBadge from "../../components/teacher/TeacherStatusBadge";
import { useTeacherData } from "../../components/teacher/TeacherDataContext";
import { riskWeight, sortBySubmittedDesc, toReadableDate, toSparklinePoints } from "../../components/teacher/mockData";
import type { Submission } from "../../components/teacher/types";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS, LIST_ROW_INTERACTIVE_CLASS } from "../../components/ui/glass";

interface KpiCard {
  id: string;
  label: string;
  value: number;
  tone: "blue" | "amber" | "emerald" | "rose";
  sparkline: number[];
}

function CountUp({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const start = performance.now();
    const duration = 540;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [reduceMotion, value]);

  return <>{displayValue}</>;
}

function buildSparkline(base: number) {
  return [
    Math.max(base - 3, 0),
    Math.max(base - 2, 0),
    Math.max(base - 1, 0),
    base,
    base + 1,
    base + 2,
  ];
}

function KpiTile({ card, index }: { card: KpiCard; index: number }) {
  const toneClass = {
    blue: "border-blue-200/70 bg-blue-50/55 text-blue-800",
    amber: "border-amber-200/70 bg-amber-50/55 text-amber-800",
    emerald: "border-emerald-200/70 bg-emerald-50/55 text-emerald-800",
    rose: "border-rose-200/70 bg-rose-50/55 text-rose-800",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.04 }}
      className={`rounded-2xl border p-4 ${toneClass[card.tone]} ${GLASS_INTERACTIVE_CLASS}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em]">{card.label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        <CountUp value={card.value} />
      </p>
      <svg className="mt-2 h-7 w-24" viewBox="0 0 92 28" fill="none" aria-hidden>
        <polyline
          points={toSparklinePoints(card.sparkline, 92, 28)}
          stroke="rgba(59,130,246,0.85)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

export default function TeacherOverviewPage() {
  const { submissions } = useTeacherData();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [initialTab, setInitialTab] = useState<"summary" | "live-demo">("summary");

  const ordered = useMemo(() => sortBySubmittedDesc(submissions), [submissions]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const underReview = submissions.filter((item) => item.status === "Under Review").length;
    const completed = submissions.filter((item) => item.status === "Completed").length;
    const highRisk = submissions.filter(
      (item) => item.riskLevel === "HIGH" || item.riskLevel === "CRITICAL",
    ).length;

    return { total, underReview, completed, highRisk };
  }, [submissions]);

  const cards = useMemo<KpiCard[]>(
    () => [
      {
        id: "total",
        label: "Total Submissions",
        value: stats.total,
        tone: "blue",
        sparkline: buildSparkline(stats.total),
      },
      {
        id: "review",
        label: "Under Review",
        value: stats.underReview,
        tone: "amber",
        sparkline: buildSparkline(stats.underReview),
      },
      {
        id: "completed",
        label: "Completed",
        value: stats.completed,
        tone: "emerald",
        sparkline: buildSparkline(stats.completed),
      },
      {
        id: "risk",
        label: "High Risk",
        value: stats.highRisk,
        tone: "rose",
        sparkline: buildSparkline(stats.highRisk),
      },
    ],
    [stats],
  );

  const priorityQueue = useMemo(
    () =>
      submissions
        .filter(
          (item) =>
            item.status === "Under Review" &&
            (item.riskLevel === "HIGH" || item.riskLevel === "CRITICAL"),
        )
        .sort((left, right) => {
          const riskDelta = riskWeight(right.riskLevel) - riskWeight(left.riskLevel);
          if (riskDelta !== 0) return riskDelta;
          return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
        })
        .slice(0, 5),
    [submissions],
  );

  const recentActivity = useMemo(() => ordered.slice(0, 7), [ordered]);

  const openReport = (submission: Submission, tab: "summary" | "live-demo") => {
    setInitialTab(tab);
    setSelectedSubmission(submission);
    setViewerOpen(true);
  };

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-6 sm:p-8 ${GLASS_INTERACTIVE_CLASS}`}>
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Teacher Command Center</h2>
        <p className="mt-2 text-sm text-slate-600">
          Prioritize risk, track throughput, and open detailed reports in one flow.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => (
            <KpiTile key={card.id} card={card} index={index} />
          ))}
        </div>
      </DemoGlassCard>

      <motion.section
        className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.05 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Priority Queue</h3>
            <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {priorityQueue.length} high-priority
            </span>
          </div>

          <div className="mt-3 grid gap-2.5">
            {priorityQueue.map((submission) => (
              <motion.div
                layout
                key={submission.id}
                whileHover={{ y: -2 }}
                className={`rounded-xl border border-white/60 bg-white/45 px-3.5 py-3 ${LIST_ROW_INTERACTIVE_CLASS}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{submission.projectTitle}</p>
                  <TeacherRiskBadge level={submission.riskLevel} />
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {submission.studentName} ({submission.rollNumber})
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openReport(submission, "summary")}
                    className={`rounded-lg border border-blue-200/80 bg-blue-50/75 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/85 ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    Open Report
                  </button>
                  {submission.liveDemoUrl ? (
                    <button
                      type="button"
                      onClick={() => openReport(submission, "live-demo")}
                      className={`rounded-lg border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/85 ${BUTTON_INTERACTIVE_CLASS}`}
                    >
                      Preview Demo
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
            <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {recentActivity.length}
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {recentActivity.map((submission) => (
              <div
                key={submission.id}
                className="rounded-xl border border-white/55 bg-white/45 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{submission.studentName}</p>
                  <TeacherStatusBadge status={submission.status} />
                </div>
                <p className="mt-1 text-xs text-slate-600">{submission.projectTitle}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{toReadableDate(submission.submittedAt)}</span>
                  <TeacherRiskBadge level={submission.riskLevel} />
                </div>
              </div>
            ))}
          </div>
        </DemoGlassCard>
      </motion.section>

      <TeacherReportViewer
        open={viewerOpen}
        submission={selectedSubmission}
        initialTab={initialTab}
        onClose={() => setViewerOpen(false)}
      />
    </motion.main>
  );
}
