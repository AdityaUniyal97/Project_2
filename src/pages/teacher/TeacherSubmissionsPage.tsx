import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import TeacherStatusBadge from "../../components/teacher/TeacherStatusBadge";
import {
  TEACHER_SUBMISSIONS,
  compareByDate,
  getRiskLevel,
  toReadableDate,
} from "../../components/teacher/mockData";
import type { TeacherSubmissionRecord, TeacherSubmissionStatus } from "../../components/teacher/types";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  INPUT_GLOW_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../../components/ui/glass";

type StatusFilter = "All" | TeacherSubmissionStatus;
type SortOrder = "Newest" | "Oldest";

function riskPillClass(risk: ReturnType<typeof getRiskLevel>) {
  if (risk === "High") return "border-rose-200/90 bg-rose-50/80 text-rose-700";
  if (risk === "Medium") return "border-amber-200/90 bg-amber-50/80 text-amber-700";
  return "border-emerald-200/90 bg-emerald-50/80 text-emerald-700";
}

export default function TeacherSubmissionsPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<TeacherSubmissionRecord[]>(TEACHER_SUBMISSIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>("Newest");

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    let current = submissions.filter((submission) => {
      const statusMatches = statusFilter === "All" ? true : submission.status === statusFilter;
      if (!statusMatches) return false;
      if (!query) return true;

      return (
        submission.studentName.toLowerCase().includes(query) ||
        submission.rollNo.toLowerCase().includes(query) ||
        submission.projectTitle.toLowerCase().includes(query) ||
        submission.branch.toLowerCase().includes(query)
      );
    });

    current = [...current].sort((left, right) =>
      compareByDate(left.submittedAt, right.submittedAt),
    );
    if (sortOrder === "Newest") current.reverse();

    return current;
  }, [search, sortOrder, statusFilter, submissions]);

  const markCompleted = (submissionId: string) => {
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submissionId ? { ...item, status: "Completed" as const } : item,
      ),
    );
  };

  const onViewReport = (submissionId: string) => {
    navigate(`/teacher/reports?submission=${encodeURIComponent(submissionId)}`);
  };

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-4 sm:p-5 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student, roll, project..."
            className={`w-[280px] max-w-full rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white/75 ${INPUT_GLOW_CLASS}`}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className={`rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
          >
            <option value="All">All</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
          </select>
          <button
            type="button"
            onClick={() =>
              setSortOrder((current) => (current === "Newest" ? "Oldest" : "Newest"))
            }
            className={`rounded-xl border border-white/70 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/80 ${BUTTON_INTERACTIVE_CLASS}`}
          >
            {sortOrder}
          </button>
        </div>
      </DemoGlassCard>

      <motion.section
        className="mt-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.05 }}
      >
        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Submissions</h2>
            <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {filteredSubmissions.length} Results
            </span>
          </div>

          <div className="grid gap-3">
            {filteredSubmissions.map((submission) => {
              const risk = getRiskLevel(submission.plagiarismPercent);
              const canMarkCompleted = submission.status !== "Completed";
              return (
                <div
                  key={submission.id}
                  className={`group rounded-2xl border border-white/60 bg-white/40 px-4 py-3 ${LIST_ROW_INTERACTIVE_CLASS}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{submission.projectTitle}</p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {submission.studentName} ({submission.rollNo}) • {submission.branch}
                      </p>
                    </div>
                    <TeacherStatusBadge status={submission.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span>{toReadableDate(submission.submittedAt)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">
                      Plagiarism {submission.plagiarismPercent}%
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 font-semibold ${riskPillClass(risk)}`}
                    >
                      {risk} Risk
                    </span>
                  </div>

                  {submission.status === "Under Review" ? (
                    <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-blue-100/70">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500/85 to-cyan-500/85"
                        initial={{ x: "-90%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                      />
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2 opacity-70 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onViewReport(submission.id)}
                      className={`rounded-lg border border-blue-200/75 bg-blue-50/75 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/85 ${BUTTON_INTERACTIVE_CLASS}`}
                    >
                      View Report
                    </button>
                    <button
                      type="button"
                      disabled={!canMarkCompleted}
                      onClick={() => markCompleted(submission.id)}
                      className={`rounded-lg border border-emerald-200/75 bg-emerald-50/75 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100/85 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </DemoGlassCard>
      </motion.section>
    </motion.main>
  );
}
