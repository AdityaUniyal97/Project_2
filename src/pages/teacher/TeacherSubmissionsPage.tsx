import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import TeacherReportViewer from "../../components/teacher/TeacherReportViewer";
import TeacherRiskBadge from "../../components/teacher/TeacherRiskBadge";
import TeacherStatusBadge from "../../components/teacher/TeacherStatusBadge";
import { useTeacherData } from "../../components/teacher/TeacherDataContext";
import { riskWeight, toReadableDate } from "../../components/teacher/mockData";
import type { Submission, TeacherRiskLevel, TeacherSubmissionStatus } from "../../components/teacher/types";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  INPUT_GLOW_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../../components/ui/glass";

type StatusFilter = "All" | TeacherSubmissionStatus;
type RiskFilter = "All" | TeacherRiskLevel;
type SortFilter = "Newest" | "Oldest" | "Risk first";

export default function TeacherSubmissionsPage() {
  const navigate = useNavigate();
  const { submissions, updateSubmissionStatus } = useTeacherData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [sortFilter, setSortFilter] = useState<SortFilter>("Newest");
  const [reviewedMap, setReviewedMap] = useState<Record<string, boolean>>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [initialTab, setInitialTab] = useState<"summary" | "live-demo">("summary");

  const branches = useMemo(
    () => ["All", ...Array.from(new Set(submissions.map((item) => item.branch))).sort()],
    [submissions],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const next = submissions.filter((submission) => {
      const statusMatch = statusFilter === "All" ? true : submission.status === statusFilter;
      const riskMatch = riskFilter === "All" ? true : submission.riskLevel === riskFilter;
      const branchMatch = branchFilter === "All" ? true : submission.branch === branchFilter;
      const queryMatch =
        !query ||
        submission.studentName.toLowerCase().includes(query) ||
        submission.rollNumber.toLowerCase().includes(query) ||
        submission.projectTitle.toLowerCase().includes(query);

      return statusMatch && riskMatch && branchMatch && queryMatch;
    });

    return [...next].sort((left, right) => {
      if (sortFilter === "Newest") {
        return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      }

      if (sortFilter === "Oldest") {
        return new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime();
      }

      const riskDelta = riskWeight(right.riskLevel) - riskWeight(left.riskLevel);
      if (riskDelta !== 0) return riskDelta;
      return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
    });
  }, [branchFilter, riskFilter, search, sortFilter, statusFilter, submissions]);

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
      <DemoGlassCard className={`p-4 sm:p-5 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student, roll, project"
            className={`w-[280px] max-w-full rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${INPUT_GLOW_CLASS}`}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className={`rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
          >
            <option value="All">All Status</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
            className={`rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
          >
            <option value="All">All Risk</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
            className={`rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
          >
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <select
            value={sortFilter}
            onChange={(event) => setSortFilter(event.target.value as SortFilter)}
            className={`rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
          >
            <option>Newest</option>
            <option>Oldest</option>
            <option>Risk first</option>
          </select>
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
            <h2 className="text-base font-semibold text-slate-900">Submission Worklist</h2>
            <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {filtered.length} results
            </span>
          </div>

          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {filtered.map((submission) => (
                <motion.div
                  layout
                  key={submission.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className={`group rounded-2xl border border-white/60 bg-white/40 px-4 py-3 ${LIST_ROW_INTERACTIVE_CLASS}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{submission.projectTitle}</p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {submission.studentName} ({submission.rollNumber}) - {submission.branch}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TeacherRiskBadge level={submission.riskLevel} />
                      <TeacherStatusBadge status={submission.status} />
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>{toReadableDate(submission.submittedAt)}</span>
                    <span>Authenticity: {submission.originalityPercent}%</span>
                    <span>Confidence: {Math.round(submission.aiConfidence)}%</span>
                    {reviewedMap[submission.id] ? (
                      <span className="rounded-full border border-blue-200/80 bg-blue-50/80 px-2 py-0.5 font-semibold text-blue-700">
                        Reviewed
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 opacity-70 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openReport(submission, "summary")}
                      className={`rounded-lg border border-blue-200/75 bg-blue-50/75 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/85 ${BUTTON_INTERACTIVE_CLASS}`}
                    >
                      View Report
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setReviewedMap((current) => ({
                          ...current,
                          [submission.id]: !current[submission.id],
                        }))
                      }
                      className={`rounded-lg border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/85 ${BUTTON_INTERACTIVE_CLASS}`}
                    >
                      Mark Reviewed
                    </button>
                    <button
                      type="button"
                      disabled={submission.status === "Completed"}
                      onClick={() => updateSubmissionStatus(submission.id, "Completed")}
                      className={`rounded-lg border border-emerald-200/75 px-3 py-1.5 text-xs font-semibold transition ${
                        submission.status === "Completed"
                          ? "bg-emerald-100/90 text-emerald-500 cursor-default opacity-70"
                          : `bg-emerald-50/75 text-emerald-700 hover:bg-emerald-100/85 ${BUTTON_INTERACTIVE_CLASS}`
                      }`}
                    >
                      {submission.status === "Completed" ? "✓ Completed" : "Mark Completed"}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/teacher/demo/${submission.id}`)}
                      className={`rounded-lg border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/85 ${BUTTON_INTERACTIVE_CLASS}`}
                    >
                      Live Demo
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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
