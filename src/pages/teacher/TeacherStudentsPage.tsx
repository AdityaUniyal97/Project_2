import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import TeacherRiskBadge from "../../components/teacher/TeacherRiskBadge";
import TeacherStatusBadge from "../../components/teacher/TeacherStatusBadge";
import { useTeacherData } from "../../components/teacher/TeacherDataContext";
import { deriveStudentProfiles, riskWeight, toReadableDate } from "../../components/teacher/mockData";
import type { StudentProfile, TeacherRiskLevel } from "../../components/teacher/types";
import { GLASS_INTERACTIVE_CLASS, LIST_ROW_INTERACTIVE_CLASS } from "../../components/ui/glass";

function highestRiskLevel(levels: TeacherRiskLevel[]): TeacherRiskLevel {
  if (levels.includes("CRITICAL")) return "CRITICAL";
  if (levels.includes("HIGH")) return "HIGH";
  if (levels.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

function miniTrendPoints(values: number[]) {
  const width = 190;
  const height = 58;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return values
    .map((value, index) => {
      const x = (index * width) / Math.max(values.length - 1, 1);
      const normalized = max === min ? 0.5 : (value - min) / (max - min);
      const y = height - normalized * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function TeacherStudentsPage() {
  const { submissions } = useTeacherData();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const profiles = useMemo(() => deriveStudentProfiles(submissions), [submissions]);

  const profileMeta = useMemo(() => {
    const grouped = new Map<string, { highestRisk: TeacherRiskLevel; flags: number }>();

    profiles.forEach((profile) => {
      const studentSubmissions = submissions.filter(
        (item) => item.rollNumber === profile.rollNumber,
      );

      const levels = studentSubmissions.map((item) => item.riskLevel);
      const flags = studentSubmissions.filter(
        (item) => item.riskLevel === "HIGH" || item.riskLevel === "CRITICAL",
      ).length;

      grouped.set(profile.rollNumber, {
        highestRisk: highestRiskLevel(levels),
        flags,
      });
    });

    return grouped;
  }, [profiles, submissions]);

  const submissionsByStudent = useMemo(() => {
    return Object.fromEntries(
      profiles.map((profile) => [
        profile.rollNumber,
        submissions
          .filter((item) => item.rollNumber === profile.rollNumber)
          .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()),
      ]),
    ) as Record<string, typeof submissions>;
  }, [profiles, submissions]);

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Student Profiles</h2>
          <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {profiles.length}
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-slate-600">
              <tr>
                <th className="px-2 py-2 font-semibold">Student</th>
                <th className="px-2 py-2 font-semibold">Roll Number</th>
                <th className="px-2 py-2 font-semibold">Branch</th>
                <th className="px-2 py-2 font-semibold">Total Submissions</th>
                <th className="px-2 py-2 font-semibold">Avg Originality</th>
                <th className="px-2 py-2 font-semibold">Highest Risk</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const expanded = expandedId === profile.id;
                const meta = profileMeta.get(profile.rollNumber);
                const history = submissionsByStudent[profile.rollNumber] ?? [];
                const trendData = profile.riskTrendSeries.map((value) => Math.max(100 - value, 12));

                return (
                  <Fragment key={profile.id}>
                    <tr
                      className={`cursor-pointer border-t border-white/40 text-slate-700 ${LIST_ROW_INTERACTIVE_CLASS}`}
                      onClick={() => setExpandedId((current) => (current === profile.id ? null : profile.id))}
                    >
                      <td className="px-2 py-2.5 font-medium text-slate-900">{profile.studentName}</td>
                      <td className="px-2 py-2.5 text-xs text-slate-600">{profile.rollNumber}</td>
                      <td className="px-2 py-2.5 text-xs text-slate-600">{profile.branch}</td>
                      <td className="px-2 py-2.5">{profile.totalSubmissions}</td>
                      <td className="px-2 py-2.5 font-semibold text-slate-800">{profile.avgOriginality}%</td>
                      <td className="px-2 py-2.5">
                        <TeacherRiskBadge level={meta?.highestRisk ?? "LOW"} />
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
                          <td colSpan={6} className="border-t border-white/35 px-3 py-3">
                            <div className="grid gap-3 rounded-xl border border-white/60 bg-white/45 p-3 lg:grid-cols-[minmax(0,1fr)_240px]">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Submission History
                                </p>
                                <div className="mt-2 space-y-2">
                                  {history.map((entry) => (
                                    <div
                                      key={entry.id}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/65 bg-white/60 px-3 py-2"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-slate-800">{entry.projectTitle}</p>
                                        <p className="text-[11px] text-slate-500">{toReadableDate(entry.submittedAt)}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <TeacherStatusBadge status={entry.status} />
                                        <TeacherRiskBadge level={entry.riskLevel} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Originality Trend
                                </p>
                                <svg className="mt-2 w-full" viewBox="0 0 190 58" fill="none" aria-hidden>
                                  <polyline
                                    points={miniTrendPoints(trendData)}
                                    stroke="rgba(37,99,235,0.88)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>

                                <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                                  <div className="rounded-lg border border-white/65 bg-white/65 px-2.5 py-1.5">
                                    Highest risk seen: <span className="font-semibold">{meta?.highestRisk ?? "LOW"}</span>
                                  </div>
                                  <div className="rounded-lg border border-white/65 bg-white/65 px-2.5 py-1.5">
                                    Flags (HIGH/CRITICAL): <span className="font-semibold">{meta?.flags ?? 0}</span>
                                  </div>
                                  <div className="rounded-lg border border-white/65 bg-white/65 px-2.5 py-1.5">
                                    Risk severity score: <span className="font-semibold">{riskWeight(meta?.highestRisk ?? "LOW")}/4</span>
                                  </div>
                                </div>
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
    </motion.main>
  );
}
