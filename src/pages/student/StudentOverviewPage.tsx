import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import { STUDENT_SUBMISSIONS_STORAGE_KEY } from "../../components/student/constants";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  INPUT_GLOW_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../../components/ui/glass";
import type { StudentStats, StudentSubmission } from "../../components/student/types";

interface StoredSubmissionItem {
  id: string;
  projectTitle: string;
  submittedAt: string;
  status?: "Under Review" | "Completed";
}

interface KpiCardData {
  id: string;
  label: string;
  value: number;
  trend: string;
  tone: "blue" | "amber" | "emerald";
  sparkline: number[];
}

const DEMO_SUBMISSIONS: StudentSubmission[] = [
  {
    id: "OVR-001",
    title: "AI Attendance System",
    date: "2026-03-03T09:20:00",
    status: "Under Review",
    originality: 72,
    plagiarism: 28,
  },
  {
    id: "OVR-002",
    title: "Smart Library Assistant",
    date: "2026-02-25T15:42:00",
    status: "Completed",
    originality: 89,
    plagiarism: 11,
  },
  {
    id: "OVR-003",
    title: "Campus Event Tracker",
    date: "2026-02-18T13:05:00",
    status: "Completed",
    originality: 81,
    plagiarism: 19,
  },
  {
    id: "OVR-004",
    title: "Hostel Complaint Portal",
    date: "2026-02-12T11:30:00",
    status: "Under Review",
    originality: 76,
    plagiarism: 24,
  },
  {
    id: "OVR-005",
    title: "Placement Insights Dashboard",
    date: "2026-01-29T16:08:00",
    status: "Completed",
    originality: 91,
    plagiarism: 9,
  },
  {
    id: "OVR-006",
    title: "Internship Matching App",
    date: "2026-01-14T10:12:00",
    status: "Completed",
    originality: 85,
    plagiarism: 15,
  },
  {
    id: "OVR-007",
    title: "IoT Energy Monitor",
    date: "2025-12-21T14:55:00",
    status: "Under Review",
    originality: 68,
    plagiarism: 32,
  },
  {
    id: "OVR-008",
    title: "Code Similarity Checker",
    date: "2025-12-10T09:47:00",
    status: "Completed",
    originality: 79,
    plagiarism: 21,
  },
];

const DEFAULT_TREND_DATA = [68, 72, 77, 75, 83, 88];

const ACHIEVEMENTS = [
  {
    label: "First Submission",
    unlocked: true,
    hint: "Unlocked after your first successful project upload.",
  },
  {
    label: "3 Projects Submitted",
    unlocked: true,
    hint: "Maintain activity to keep your momentum score high.",
  },
  {
    label: "High Originality (90%+)",
    unlocked: true,
    hint: "Excellent originality benchmark achieved.",
  },
  {
    label: "Consistent Submitter",
    unlocked: false,
    hint: "Submit at least one project for 3 consecutive months.",
  },
  {
    label: "Quick Iteration",
    unlocked: false,
    hint: "Push two reviewed updates in one week.",
  },
  {
    label: "Zero-Flag Sprint",
    unlocked: false,
    hint: "Complete 5 submissions with low-risk plagiarism levels.",
  },
];

function numericHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) % 997;
  }
  return hash;
}

function normalizeDate(input: string) {
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return new Date().toISOString();
}

function fromStoredSubmission(item: StoredSubmissionItem): StudentSubmission {
  const hash = numericHash(`${item.id}-${item.projectTitle}`);
  const originality = 65 + (hash % 31);

  return {
    id: item.id,
    title: item.projectTitle,
    date: normalizeDate(item.submittedAt),
    status: item.status ?? "Under Review",
    originality,
    plagiarism: 100 - originality,
  };
}

function toReadableDate(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }
  return parsed.toLocaleString();
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
  const underReview = submissions.filter((item) => item.status === "Under Review").length;
  const completed = submissions.filter((item) => item.status === "Completed").length;
  const avgOriginality =
    totalSubmissions > 0
      ? Math.round(
          submissions.reduce((sum, item) => sum + item.originality, 0) / totalSubmissions,
        )
      : 0;

  return {
    totalSubmissions,
    underReview,
    completed,
    avgOriginality,
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
  if (status === "Under Review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/85 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-amber-500" />
        Under Review
      </span>
    );
  }

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
      Completed
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
        {item.id === "avg" ? "%" : ""}
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

export default function StudentOverviewPage() {
  const [showAll, setShowAll] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const allSubmissions = useMemo(() => {
    let storedSubmissions: StudentSubmission[] = [];

    try {
      const rawValue = localStorage.getItem(STUDENT_SUBMISSIONS_STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue) as StoredSubmissionItem[];
        if (Array.isArray(parsed)) {
          storedSubmissions = parsed.map(fromStoredSubmission);
        }
      }
    } catch {
      storedSubmissions = [];
    }

    const mergedMap = new Map<string, StudentSubmission>();

    [...storedSubmissions, ...DEMO_SUBMISSIONS].forEach((submission) => {
      if (!mergedMap.has(submission.id)) {
        mergedMap.set(submission.id, submission);
      }
    });

    return Array.from(mergedMap.values()).sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  }, []);

  const stats = useMemo(() => buildStats(allSubmissions), [allSubmissions]);
  const visibleSubmissions = showAll ? allSubmissions : allSubmissions.slice(0, 6);

  const trendValues = useMemo(() => {
    const sampled = allSubmissions
      .slice(0, 6)
      .map((item) => item.originality)
      .reverse();

    if (sampled.length >= 4) return sampled;
    return DEFAULT_TREND_DATA;
  }, [allSubmissions]);

  const kpiCards = useMemo<KpiCardData[]>(
    () => [
      {
        id: "total",
        label: "Total Submissions",
        value: stats.totalSubmissions,
        trend: "+9%",
        tone: "blue",
        sparkline: [2, 3, 3, 4, 5, 6],
      },
      {
        id: "review",
        label: "Under Review",
        value: stats.underReview,
        trend: "+2%",
        tone: "amber",
        sparkline: [1, 2, 2, 2, 3, 3],
      },
      {
        id: "completed",
        label: "Completed",
        value: stats.completed,
        trend: "+14%",
        tone: "emerald",
        sparkline: [1, 1, 2, 3, 4, 4],
      },
      {
        id: "avg",
        label: "Avg Originality",
        value: stats.avgOriginality,
        trend: "+5%",
        tone: "blue",
        sparkline: [70, 72, 77, 79, 83, stats.avgOriginality],
      },
    ],
    [stats],
  );

  const monthlyBars = useMemo(() => buildMonthlyBars(allSubmissions), [allSubmissions]);
  const maxBarValue = Math.max(...monthlyBars.map((item) => item.value), 1);

  const svgWidth = 360;
  const svgHeight = 160;
  const graphPadding = 22;
  const graphMin = 55;
  const graphMax = 100;

  const trendPoints = trendValues
    .map((value, index) => {
      const x =
        graphPadding +
        (index * (svgWidth - graphPadding * 2)) / Math.max(trendValues.length - 1, 1);
      const normalized = (value - graphMin) / (graphMax - graphMin);
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

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-2 py-2 font-semibold">Project Title</th>
                  <th className="px-2 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Originality</th>
                </tr>
              </thead>
              <tbody>
                {visibleSubmissions.map((submission) => {
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
                        <td className="px-2 py-2.5 text-sm font-semibold text-slate-800">
                          {submission.originality}% originality
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
                                  Status Timeline
                                </p>
                                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                  <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-2 text-xs font-medium text-emerald-700">
                                    Submitted
                                  </div>
                                  <div className="rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-2 text-xs font-medium text-blue-700">
                                    AI Analysis
                                  </div>
                                  <div className="rounded-lg border border-white/65 bg-white/65 px-2.5 py-2 text-xs font-medium text-slate-700">
                                    {submission.status === "Completed"
                                      ? "Completed"
                                      : "Teacher Review"}
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                  <button
                                    type="button"
                                    className={`rounded-lg border border-white/70 bg-white/65 px-2.5 py-1.5 font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
                                  >
                                    Open Report
                                  </button>
                                  <button
                                    type="button"
                                    className={`rounded-lg border border-white/70 bg-white/65 px-2.5 py-1.5 font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
                                  >
                                    View Sources
                                  </button>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        ) : null}
                      </AnimatePresence>
                    </Fragment>
                  );
                })}
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
          <h3 className="text-base font-semibold text-slate-900">Achievements</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((achievement) => (
              <div
                key={achievement.label}
                className={`group relative rounded-2xl border p-3 transition ${
                  achievement.unlocked
                    ? "border-emerald-200/80 bg-emerald-50/65"
                    : "border-white/55 bg-white/35 opacity-80"
                }`}
              >
                <p
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    achievement.unlocked ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  {!achievement.unlocked ? (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
                      <rect x="3.4" y="7" width="9.2" height="6" rx="1.3" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M5.4 7V5.8a2.6 2.6 0 015.2 0V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  ) : null}
                  {achievement.unlocked ? "Unlocked" : "Locked"}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">{achievement.label}</p>
                <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-2 z-10 w-44 rounded-lg border border-white/60 bg-slate-900/85 px-2 py-1.5 text-[11px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100">
                  {achievement.hint}
                </div>
              </div>
            ))}
          </div>
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h3 className="text-base font-semibold text-slate-900">Originality Trend</h3>
          <p className="mt-1 text-xs text-slate-600">Latest submissions</p>
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
              const normalized = (value - graphMin) / (graphMax - graphMin);
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
