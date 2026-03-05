import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import { listSubmissions, type SubmissionRecord, type SubmissionStatus } from "../../lib/api";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  INPUT_GLOW_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../../components/ui/glass";
import type { StudentStats, StudentSubmission } from "../../components/student/types";

interface KpiCardData {
  id: string;
  label: string;
  value: number;
  trend: string;
  tone: "blue" | "amber" | "emerald";
  sparkline: number[];
}

function toReadableDate(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }
  return parsed.toLocaleString();
}

function isCompletedStatus(status: SubmissionStatus) {
  return status === "done" || status === "completed";
}

function isUnderReviewStatus(status: SubmissionStatus) {
  return ["submitted", "queued", "processing"].includes(status);
}

function toStatusLabel(status: SubmissionStatus) {
  if (status === "done" || status === "completed") return "Completed";
  if (status === "submitted") return "Submitted";
  if (status === "queued") return "Queued";
  if (status === "processing") return "Processing";
  if (status === "failed") return "Failed";
  return "Draft";
}

function buildMonthlyBars(submissions: StudentSubmission[]) {
  const now = new Date();
  const bars = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      label: monthDate.toLocaleString("en-US", { month: "short" }),
      value: 0,
    };
  });

  const monthIndexByKey = new Map(bars.map((item, index) => [item.key, index]));

  submissions.forEach((submission) => {
    const date = new Date(submission.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const targetIndex = monthIndexByKey.get(key);
    if (targetIndex === undefined) return;
    bars[targetIndex] = { ...bars[targetIndex], value: bars[targetIndex].value + 1 };
  });

  return bars;
}

function buildStats(submissions: StudentSubmission[]): StudentStats {
  const totalSubmissions = submissions.length;
  const underReview = submissions.filter((item) => isUnderReviewStatus(item.status)).length;
  const completed = submissions.filter((item) => isCompletedStatus(item.status)).length;
  const completedRate = totalSubmissions > 0 ? Math.round((completed / totalSubmissions) * 100) : 0;

  return {
    totalSubmissions,
    underReview,
    completed,
    completedRate,
  };
}

function toSparklinePoints(values: number[]) {
  const width = 88;
  const height = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return values
    .map((value, index) => {
      const x = (index * width) / Math.max(values.length - 1, 1);
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = height - normalized * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");
}

function toTrend(current: number, previous: number) {
  if (current === previous) return "0%";
  if (previous === 0) return current > 0 ? "+100%" : "0%";

  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}%`;
}

function CountUpValue({ value }: { value: number }) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    let frameId = 0;
    const duration = 560;
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
  }, [prefersReducedMotion, value]);

  return <>{displayValue}</>;
}

function StatusIndicator({ status }: { status: StudentSubmission["status"] }) {
  if (isCompletedStatus(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/85 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <path
            d="M12.8 4.6L6.7 10.7L3.2 7.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {toStatusLabel(status)}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50/85 px-2.5 py-1 text-xs font-semibold text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        {toStatusLabel(status)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/85 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-amber-500" />
      {toStatusLabel(status)}
    </span>
  );
}

function KpiCard({ item, index }: { item: KpiCardData; index: number }) {
  const toneMap = {
    blue: "text-blue-700 border-blue-200/75 bg-blue-50/55",
    amber: "text-amber-700 border-amber-200/75 bg-amber-50/55",
    emerald: "text-emerald-700 border-emerald-200/75 bg-emerald-50/55",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className={`glass-interactive glass-edge rounded-2xl border border-white/60 bg-white/45 p-4 ${GLASS_INTERACTIVE_CLASS}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{item.label}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneMap[item.tone]}`}>
          {item.trend}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        <CountUpValue value={item.value} />
        {item.id === "rate" ? "%" : ""}
      </p>
      <svg className="mt-2 h-7 w-24" viewBox="0 0 88 26" fill="none" aria-hidden>
        <polyline
          points={toSparklinePoints(item.sparkline)}
          stroke="rgba(59,130,246,0.9)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

function toViewSubmission(item: SubmissionRecord): StudentSubmission {
  return {
    id: item.id,
    title: item.title,
    date: item.createdAt,
    status: item.status,
    repoUrl: item.repoUrl,
    branch: item.branch,
    description: item.description,
  };
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

export default function StudentOverviewPage() {
  const [showAll, setShowAll] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSubmissions = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await listSubmissions();
        if (!mounted) return;

        const mapped = response.submissions
          .map(toViewSubmission)
          .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

        setAllSubmissions(mapped);
      } catch (requestError) {
        if (!mounted) return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load submissions.");
        setAllSubmissions([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSubmissions();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => buildStats(allSubmissions), [allSubmissions]);
  const visibleSubmissions = showAll ? allSubmissions : allSubmissions.slice(0, 6);

  const monthlyBars = useMemo(() => buildMonthlyBars(allSubmissions), [allSubmissions]);
  const maxBarValue = Math.max(...monthlyBars.map((item) => item.value), 1);
  const trendValues = useMemo(() => monthlyBars.map((bar) => bar.value), [monthlyBars]);

  const thisMonthCount = monthlyBars[monthlyBars.length - 1]?.value ?? 0;
  const previousMonthCount = monthlyBars[monthlyBars.length - 2]?.value ?? 0;
  const completedCurrentMonth = allSubmissions.filter((submission) => {
    const date = new Date(submission.date);
    const now = new Date();

    return (
      isCompletedStatus(submission.status) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }).length;

  const completedPreviousMonth = allSubmissions.filter((submission) => {
    const date = new Date(submission.date);
    const previous = new Date();
    previous.setMonth(previous.getMonth() - 1);

    return (
      isCompletedStatus(submission.status) &&
      date.getFullYear() === previous.getFullYear() &&
      date.getMonth() === previous.getMonth()
    );
  }).length;

  const kpiCards = useMemo<KpiCardData[]>(
    () => [
      {
        id: "total",
        label: "Total Submissions",
        value: stats.totalSubmissions,
        trend: toTrend(thisMonthCount, previousMonthCount),
        tone: "blue",
        sparkline: trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0],
      },
      {
        id: "review",
        label: "Under Review",
        value: stats.underReview,
        trend: toTrend(stats.underReview, Math.max(stats.totalSubmissions - stats.underReview, 0)),
        tone: "amber",
        sparkline: trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0],
      },
      {
        id: "completed",
        label: "Completed",
        value: stats.completed,
        trend: toTrend(completedCurrentMonth, completedPreviousMonth),
        tone: "emerald",
        sparkline: trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0],
      },
      {
        id: "rate",
        label: "Completed Rate",
        value: stats.completedRate,
        trend: stats.totalSubmissions > 0 ? "Live" : "0%",
        tone: "blue",
        sparkline: trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0],
      },
    ],
    [
      completedCurrentMonth,
      completedPreviousMonth,
      previousMonthCount,
      stats.completed,
      stats.completedRate,
      stats.totalSubmissions,
      stats.underReview,
      thisMonthCount,
      trendValues,
    ],
  );

  const svgWidth = 360;
  const svgHeight = 160;
  const graphPadding = 22;
  const graphMin = 0;
  const graphMax = Math.max(...trendValues, 1);

  const trendPoints = trendValues
    .map((value, index) => {
      const x =
        graphPadding +
        (index * (svgWidth - graphPadding * 2)) / Math.max(trendValues.length - 1, 1);
      const normalized = graphMax === 0 ? 0 : (value - graphMin) / Math.max(graphMax - graphMin, 1);
      const y = svgHeight - graphPadding - normalized * (svgHeight - graphPadding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <motion.main
      className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <DemoGlassCard className={`p-6 sm:p-8 ${GLASS_INTERACTIVE_CLASS}`}>
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Overview</h2>
        <p className="mt-2 text-sm text-slate-600">Your submissions, progress, and activity.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((item, index) => (
            <KpiCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </DemoGlassCard>

      <motion.section
        className="mt-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.05 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Submission History</h3>
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className={`rounded-lg border border-white/65 bg-white/55 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/75 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              {showAll ? "Show less" : "View all"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-2 py-2 font-semibold">Project Title</th>
                  <th className="px-2 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Repository</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-sm text-slate-600">
                      Loading submissions...
                    </td>
                  </tr>
                ) : visibleSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-sm text-slate-600">
                      No submissions yet. Create one from the Submit Project page.
                    </td>
                  </tr>
                ) : (
                  visibleSubmissions.map((submission) => {
                    const expanded = expandedRowId === submission.id;
                    return (
                      <Fragment key={submission.id}>
                        <tr
                          className={`group cursor-pointer border-t border-white/40 text-slate-700 ${LIST_ROW_INTERACTIVE_CLASS}`}
                          onClick={() =>
                            setExpandedRowId((current) =>
                              current === submission.id ? null : submission.id,
                            )
                          }
                        >
                          <td className="px-2 py-2.5 font-medium text-slate-900">{submission.title}</td>
                          <td className="px-2 py-2.5 text-xs text-slate-600">
                            {toReadableDate(submission.date)}
                          </td>
                          <td className="px-2 py-2.5">
                            <StatusIndicator status={submission.status} />
                          </td>
                          <td className="px-2 py-2.5 text-sm font-medium text-blue-700">
                            {truncateText(submission.repoUrl, 34)}
                          </td>
                        </tr>
                        <AnimatePresence initial={false}>
                          {expanded ? (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.22 }}
                            >
                              <td colSpan={4} className="border-t border-white/35 px-3 py-3">
                                <div className="rounded-xl border border-white/55 bg-white/45 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Submission Details
                                  </p>
                                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                    <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-2 text-xs font-medium text-emerald-700">
                                      Branch: {submission.branch || "main"}
                                    </div>
                                    <div className="rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-2 text-xs font-medium text-blue-700">
                                      Status: {toStatusLabel(submission.status)}
                                    </div>
                                    <div className="rounded-lg border border-white/65 bg-white/65 px-2.5 py-2 text-xs font-medium text-slate-700">
                                      Updated: {toReadableDate(submission.date)}
                                    </div>
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    <a
                                      href={submission.repoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`rounded-lg border border-white/70 bg-white/65 px-2.5 py-1.5 font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      Open Repository
                                    </a>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          ) : null}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </DemoGlassCard>
      </motion.section>

      <motion.section
        className="mt-5 grid gap-5 lg:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.09 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Submission Distribution</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/65 p-3">
              <p className="text-xs font-semibold text-emerald-700">Completed</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{stats.completed} submissions</p>
            </div>
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/65 p-3">
              <p className="text-xs font-semibold text-amber-700">Under Review</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{stats.underReview} submissions</p>
            </div>
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/65 p-3">
              <p className="text-xs font-semibold text-rose-700">Failed</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {allSubmissions.filter((item) => item.status === "failed").length} submissions
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/55 p-3">
              <p className="text-xs font-semibold text-slate-700">Draft</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {allSubmissions.filter((item) => item.status === "draft").length} submissions
              </p>
            </div>
          </div>
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Submission Trend</h3>
          <p className="mt-1 text-xs text-slate-600">Last 6 months</p>
          <svg className="mt-3 w-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <polyline
              fill="none"
              stroke="rgba(37,99,235,0.85)"
              strokeWidth="3"
              points={trendPoints}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {trendValues.map((value, index) => {
              const x =
                graphPadding +
                (index * (svgWidth - graphPadding * 2)) / Math.max(trendValues.length - 1, 1);
              const normalized = graphMax === 0 ? 0 : (value - graphMin) / Math.max(graphMax - graphMin, 1);
              const y = svgHeight - graphPadding - normalized * (svgHeight - graphPadding * 2);

              return (
                <circle
                  key={`${value}-${index}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="rgba(255,255,255,0.95)"
                  stroke="rgba(37,99,235,0.85)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </DemoGlassCard>
      </motion.section>

      <motion.section
        className="mt-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Submissions Per Month</h3>
            <input
              readOnly
              value="Last 6 months"
              className={`w-32 rounded-lg border border-white/65 bg-white/50 px-2 py-1 text-xs text-slate-600 ${INPUT_GLOW_CLASS}`}
            />
          </div>
          <div className="mt-4 grid grid-cols-6 items-end gap-3">
            {monthlyBars.map((bar) => (
              <div key={bar.key} className="flex flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end rounded-xl bg-white/40 p-1">
                  <motion.div
                    className="w-full rounded-lg bg-gradient-to-t from-blue-500/80 to-cyan-500/75"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max((bar.value / maxBarValue) * 100, bar.value > 0 ? 14 : 0)}%`,
                    }}
                    transition={{ duration: 0.28, delay: 0.05 }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-600">{bar.label}</p>
                <p className="text-[11px] text-slate-500">{bar.value}</p>
              </div>
            ))}
          </div>
        </DemoGlassCard>
      </motion.section>
    </motion.main>
  );
}
