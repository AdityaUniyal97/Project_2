import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import DemoBackground from "../components/demo/DemoBackground";
import DemoGlassCard from "../components/demo/DemoGlassCard";
import StatusBadge from "../components/demo/StatusBadge";
import TeacherReviewModal from "../components/demo/TeacherReviewModal";
import type { TeacherSubmission } from "../components/demo/types";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  INPUT_GLOW_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../components/ui/glass";

const SIDEBAR_ITEMS = ["Dashboard", "Submissions", "AI Reports"];

const MOCK_SUBMISSIONS: TeacherSubmission[] = [
  {
    id: "PG-001",
    studentName: "Aarav Mehta",
    rollNo: "21CSE101",
    branch: "CSE",
    projectTitle: "Campus Connect Portal",
    status: "Under Review",
    plagiarismPercent: 28,
    submittedAt: "Mar 03, 2026 - 10:20 AM",
    githubUrl: "https://github.com/example/campus-connect",
    liveDemoUrl: "https://demo.example.com/campus-connect",
    aiGeneratedProbability: 22,
    originalityPercent: 72,
    sourcesDetected: ["GitHub", "StackOverflow", "Medium"],
    vivaQuestions: [
      "Why did you choose this architecture for role-based access?",
      "How are session tokens invalidated securely?",
      "What indexing strategy supports your search feature?",
      "How do you handle failed payment/webhook retries?",
      "Which metrics would you track in production?",
    ],
    improvements: [
      "Add unit tests for auth middleware and guards.",
      "Reduce duplicate API calls in the dashboard load path.",
      "Harden input validation for profile update endpoints.",
      "Document deployment rollback strategy.",
    ],
  },
  {
    id: "PG-002",
    studentName: "Diya Raman",
    rollNo: "21IT119",
    branch: "IT",
    projectTitle: "Smart Internship Tracker",
    status: "Reviewed",
    plagiarismPercent: 18,
    submittedAt: "Mar 03, 2026 - 09:55 AM",
    githubUrl: "https://github.com/example/internship-tracker",
    liveDemoUrl: "https://demo.example.com/internship",
    aiGeneratedProbability: 15,
    originalityPercent: 82,
    sourcesDetected: ["GitHub", "Docs"],
    vivaQuestions: [
      "Explain your recommendation ranking algorithm.",
      "What tradeoffs did you make in data caching?",
      "How do you prevent duplicate student applications?",
      "Where can your current design bottleneck at scale?",
      "How is authorization enforced per institute?",
    ],
    improvements: [
      "Add a background job for stale listing cleanup.",
      "Improve pagination strategy for large datasets.",
      "Expose audit logs for admin actions.",
    ],
  },
  {
    id: "PG-003",
    studentName: "Ishaan Patel",
    rollNo: "21AIML077",
    branch: "AIML",
    projectTitle: "Code Similarity Inspector",
    status: "Flagged",
    plagiarismPercent: 67,
    submittedAt: "Mar 02, 2026 - 05:40 PM",
    githubUrl: "https://github.com/example/code-similarity",
    liveDemoUrl: "https://demo.example.com/code-similarity",
    aiGeneratedProbability: 61,
    originalityPercent: 33,
    sourcesDetected: ["GitHub", "StackOverflow", "Kaggle", "GeeksforGeeks"],
    vivaQuestions: [
      "How did you tune thresholds for semantic similarity?",
      "What are the limitations of your embedding model?",
      "How does your system handle paraphrased plagiarism?",
      "Why is your false-positive rate high on short files?",
      "How would you benchmark this against token-based methods?",
      "What bias can appear in your training corpus?",
    ],
    improvements: [
      "Calibrate thresholds separately per language family.",
      "Add explainability traces for every flagged snippet.",
      "Improve handling for very small code files.",
      "Use batched vector search for better runtime.",
      "Publish a confusion matrix on validation data.",
    ],
  },
  {
    id: "PG-004",
    studentName: "Riya Nair",
    rollNo: "21CSE112",
    branch: "CSE",
    projectTitle: "Hostel Complaint Resolver",
    status: "Under Review",
    plagiarismPercent: 35,
    submittedAt: "Mar 02, 2026 - 03:16 PM",
    githubUrl: "https://github.com/example/complaint-resolver",
    liveDemoUrl: "https://demo.example.com/hostel-help",
    aiGeneratedProbability: 31,
    originalityPercent: 65,
    sourcesDetected: ["GitHub", "StackOverflow"],
    vivaQuestions: [
      "How are complaint priorities computed?",
      "What concurrency issues can appear during ticket updates?",
      "How do you validate anonymous complaint submissions?",
      "How is escalation handled if a ticket misses SLA?",
      "What backup strategy do you use for attachments?",
    ],
    improvements: [
      "Improve SLA breach notifications with retries.",
      "Optimize timeline rendering for older tickets.",
      "Add role-level analytics for wardens and admins.",
    ],
  },
  {
    id: "PG-005",
    studentName: "Neeraj Iyer",
    rollNo: "21ECE062",
    branch: "ECE",
    projectTitle: "IoT Attendance Beacon",
    status: "Reviewed",
    plagiarismPercent: 24,
    submittedAt: "Mar 02, 2026 - 12:02 PM",
    githubUrl: "https://github.com/example/iot-attendance",
    liveDemoUrl: "https://demo.example.com/beacon",
    aiGeneratedProbability: 27,
    originalityPercent: 76,
    sourcesDetected: ["GitHub", "Docs", "Hardware Forum"],
    vivaQuestions: [
      "Why did you choose BLE over RFID?",
      "What is your fallback when signal quality drops?",
      "How do you secure device provisioning?",
      "How did you measure power efficiency?",
      "How do you prevent replay attacks?",
    ],
    improvements: [
      "Add secure key rotation for edge devices.",
      "Improve packet loss recovery on weak networks.",
      "Document device onboarding procedure.",
    ],
  },
  {
    id: "PG-006",
    studentName: "Kritika Shah",
    rollNo: "21IT125",
    branch: "IT",
    projectTitle: "Faculty Workload Planner",
    status: "Under Review",
    plagiarismPercent: 41,
    submittedAt: "Mar 01, 2026 - 06:42 PM",
    githubUrl: "https://github.com/example/workload-planner",
    liveDemoUrl: "https://demo.example.com/workload",
    aiGeneratedProbability: 38,
    originalityPercent: 59,
    sourcesDetected: ["GitHub", "StackOverflow", "Research Paper"],
    vivaQuestions: [
      "How is schedule conflict resolution implemented?",
      "Explain your fairness score for faculty distribution.",
      "How did you evaluate planner output quality?",
      "What happens when department policies change mid-semester?",
      "How do you ensure deterministic allocations?",
    ],
    improvements: [
      "Add scenario comparison UI for timetable options.",
      "Improve logging around conflict resolution paths.",
      "Introduce test fixtures for edge-case faculty data.",
    ],
  },
  {
    id: "PG-007",
    studentName: "Yash Verma",
    rollNo: "21AIML081",
    branch: "AIML",
    projectTitle: "Resume Screening Assistant",
    status: "Flagged",
    plagiarismPercent: 63,
    submittedAt: "Mar 01, 2026 - 03:28 PM",
    githubUrl: "https://github.com/example/resume-screening",
    liveDemoUrl: "https://demo.example.com/resume-ai",
    aiGeneratedProbability: 68,
    originalityPercent: 37,
    sourcesDetected: ["GitHub", "StackOverflow", "Towards Data Science"],
    vivaQuestions: [
      "How do you mitigate bias in candidate ranking?",
      "Why did you choose this NLP pipeline?",
      "How does the model treat unseen skill keywords?",
      "What data leakage risks exist in your training flow?",
      "How do you justify model predictions to recruiters?",
      "What legal constraints apply to automated screening?",
    ],
    improvements: [
      "Add fairness metrics to model evaluation reports.",
      "Improve explanation quality for low-confidence scores.",
      "Introduce role-specific calibration thresholds.",
      "Expand dataset with diverse resumes.",
    ],
  },
  {
    id: "PG-008",
    studentName: "Manvi Rao",
    rollNo: "21CSE133",
    branch: "CSE",
    projectTitle: "E-Library Recommendation Engine",
    status: "Reviewed",
    plagiarismPercent: 16,
    submittedAt: "Feb 28, 2026 - 04:09 PM",
    githubUrl: "https://github.com/example/elibrary-engine",
    liveDemoUrl: "https://demo.example.com/elibrary",
    aiGeneratedProbability: 12,
    originalityPercent: 84,
    sourcesDetected: ["GitHub", "Open Library API"],
    vivaQuestions: [
      "How do you evaluate recommendation precision?",
      "What cold-start strategy did you implement?",
      "How do you detect and avoid popularity bias?",
      "How is user feedback fed back into the model?",
      "What cache invalidation strategy do you use?",
    ],
    improvements: [
      "Add explainable recommendation tags for each suggestion.",
      "Enable hybrid scoring with collaborative filtering.",
      "Improve fallback ranking for sparse users.",
    ],
  },
  {
    id: "PG-009",
    studentName: "Arjun Sethi",
    rollNo: "21ME057",
    branch: "MECH",
    projectTitle: "Workshop Inventory Manager",
    status: "Under Review",
    plagiarismPercent: 31,
    submittedAt: "Feb 28, 2026 - 02:21 PM",
    githubUrl: "https://github.com/example/workshop-inventory",
    liveDemoUrl: "https://demo.example.com/workshop",
    aiGeneratedProbability: 29,
    originalityPercent: 69,
    sourcesDetected: ["GitHub", "Docs"],
    vivaQuestions: [
      "How do you model part dependencies and bundles?",
      "What race conditions can occur during stock updates?",
      "How did you prevent negative inventory events?",
      "Which reports are most useful for supervisors?",
      "How do you recover from failed write operations?",
    ],
    improvements: [
      "Add low-stock alert notifications for critical parts.",
      "Track procurement lead times per vendor.",
      "Improve table rendering performance for large datasets.",
    ],
  },
  {
    id: "PG-010",
    studentName: "Sana Qureshi",
    rollNo: "21EEE048",
    branch: "EEE",
    projectTitle: "Energy Meter Insights",
    status: "Reviewed",
    plagiarismPercent: 22,
    submittedAt: "Feb 28, 2026 - 11:37 AM",
    githubUrl: "https://github.com/example/energy-insights",
    liveDemoUrl: "https://demo.example.com/energy-meter",
    aiGeneratedProbability: 20,
    originalityPercent: 78,
    sourcesDetected: ["GitHub", "Open Source Docs"],
    vivaQuestions: [
      "How do you clean and smooth noisy readings?",
      "What anomaly thresholds did you pick and why?",
      "How does your dashboard scale to more meters?",
      "How is data retention and archiving handled?",
      "What backup plan exists for sensor downtime?",
    ],
    improvements: [
      "Add forecast confidence intervals in the UI.",
      "Support meter grouping by building block.",
      "Improve anomaly alert precision with adaptive thresholds.",
    ],
  },
  {
    id: "PG-011",
    studentName: "Pranav Kulkarni",
    rollNo: "21IT141",
    branch: "IT",
    projectTitle: "Placement Analytics Hub",
    status: "Under Review",
    plagiarismPercent: 44,
    submittedAt: "Feb 27, 2026 - 06:51 PM",
    githubUrl: "https://github.com/example/placement-analytics",
    liveDemoUrl: "https://demo.example.com/placements",
    aiGeneratedProbability: 42,
    originalityPercent: 56,
    sourcesDetected: ["GitHub", "StackOverflow", "Kaggle"],
    vivaQuestions: [
      "How is candidate progression tracked across rounds?",
      "What forecasting model do you use for hiring trends?",
      "How do you avoid leakage in placement prediction?",
      "What dimensions are included in your dashboard filters?",
      "How is data quality monitored over time?",
    ],
    improvements: [
      "Add quality checks for missing placement records.",
      "Improve chart readability for mobile widths.",
      "Add cohort-based comparison reports.",
    ],
  },
  {
    id: "PG-012",
    studentName: "Tanvi Chopra",
    rollNo: "21CSE147",
    branch: "CSE",
    projectTitle: "Remote Lab Simulator",
    status: "Flagged",
    plagiarismPercent: 71,
    submittedAt: "Feb 27, 2026 - 03:14 PM",
    githubUrl: "https://github.com/example/remote-lab",
    liveDemoUrl: "https://demo.example.com/remote-lab",
    aiGeneratedProbability: 74,
    originalityPercent: 29,
    sourcesDetected: ["GitHub", "StackOverflow", "YouTube", "Tutorial Blog"],
    vivaQuestions: [
      "How is simulation state synchronized between users?",
      "What strategy detects copied simulation modules?",
      "How do you sandbox user-submitted scripts?",
      "How do you validate numerical accuracy of experiments?",
      "What limits did you set for concurrent sessions?",
      "How would you prevent denial-of-service in this app?",
    ],
    improvements: [
      "Add isolation boundaries for untrusted code execution.",
      "Improve anti-plagiarism checks for simulation templates.",
      "Provide deterministic experiment replay logs.",
      "Strengthen rate-limiting for expensive endpoints.",
    ],
  },
];

function statusTone(status: TeacherSubmission["status"]) {
  if (status === "Flagged") return "danger" as const;
  if (status === "Under Review") return "warning" as const;
  return "good" as const;
}

function riskFromPercent(percent: number) {
  if (percent >= 60) return "High";
  if (percent >= 30) return "Medium";
  return "Low";
}

type StatusFilter = "All" | "Under Review" | "Completed";
type SortOrder = "Newest" | "Oldest";

function statusLabel(status: TeacherSubmission["status"]) {
  if (status === "Reviewed") return "Completed";
  return status;
}

function riskPillClass(risk: ReturnType<typeof riskFromPercent>) {
  if (risk === "High") return "border-rose-200/90 bg-rose-50/80 text-rose-700";
  if (risk === "Medium") return "border-amber-200/90 bg-amber-50/80 text-amber-700";
  return "border-emerald-200/90 bg-emerald-50/80 text-emerald-700";
}

export default function TeacherDashboardPage() {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>("Newest");
  const [statusOverrides, setStatusOverrides] = useState<
    Partial<Record<string, TeacherSubmission["status"]>>
  >({});
  const [selectedSubmission, setSelectedSubmission] = useState<TeacherSubmission | null>(
    null,
  );

  const getEffectiveStatus = (submission: TeacherSubmission) =>
    statusOverrides[submission.id] ?? submission.status;

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    let current = MOCK_SUBMISSIONS.filter((submission) => {
      const effectiveStatus = getEffectiveStatus(submission);

      const statusMatches =
        statusFilter === "All"
          ? true
          : statusFilter === "Completed"
            ? effectiveStatus === "Reviewed"
            : effectiveStatus === "Under Review";

      if (!statusMatches) return false;
      if (!query) return true;

      return (
        submission.studentName.toLowerCase().includes(query) ||
        submission.projectTitle.toLowerCase().includes(query) ||
        submission.rollNo.toLowerCase().includes(query) ||
        submission.branch.toLowerCase().includes(query)
      );
    });

    if (sortOrder === "Oldest") {
      current = [...current].reverse();
    }

    return current;
  }, [search, sortOrder, statusFilter, statusOverrides]);

  const totalSubmissions = MOCK_SUBMISSIONS.length;
  const flaggedCount = MOCK_SUBMISSIONS.filter(
    (item) => getEffectiveStatus(item) === "Flagged",
  ).length;
  const avgPlagiarism = Math.round(
    MOCK_SUBMISSIONS.reduce((sum, item) => sum + item.plagiarismPercent, 0) /
      totalSubmissions,
  );
  const recentSubmission = filteredSubmissions[0] ?? MOCK_SUBMISSIONS[0];

  const markCompleted = (submissionId: string) => {
    setStatusOverrides((current) => ({
      ...current,
      [submissionId]: "Reviewed",
    }));
  };

  return (
    <DemoBackground>
      <div className="mx-auto flex min-h-screen w-full max-w-[1380px] gap-4 px-4 py-6 sm:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <DemoGlassCard className={`sticky top-6 p-4 ${GLASS_INTERACTIVE_CLASS}`}>
            <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Teacher Panel
            </p>
            <nav className="space-y-2">
              {SIDEBAR_ITEMS.map((item) => {
                const active = activeItem === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                      active
                        ? "border border-white/65 bg-white/70 text-slate-900 shadow-[0_10px_20px_rgba(30,64,175,0.1)]"
                        : "border border-transparent bg-white/20 text-slate-600 hover:bg-white/45 hover:text-slate-800"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </nav>
          </DemoGlassCard>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <DemoGlassCard className={`p-4 ${GLASS_INTERACTIVE_CLASS}`}>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Teacher Dashboard</h1>
              <p className="text-sm text-slate-600">
                Review submissions, plagiarism reports, and viva recommendations.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, roll no, project..."
                className={`w-[250px] max-w-full rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white/75 ${INPUT_GLOW_CLASS}`}
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className={`rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
              >
                <option>All</option>
                <option>Under Review</option>
                <option>Completed</option>
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
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 text-sm font-semibold text-slate-700 transition hover:bg-white/80 ${BUTTON_INTERACTIVE_CLASS}`}
                aria-label="Profile"
              >
                TS
              </button>
            </div>
          </DemoGlassCard>

          <motion.section
            className="grid gap-4 xl:grid-cols-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <DemoGlassCard className={`p-5 ${GLASS_INTERACTIVE_CLASS}`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Recent Submission
                </h2>
                <StatusBadge
                  label={statusLabel(getEffectiveStatus(recentSubmission))}
                  tone={statusTone(getEffectiveStatus(recentSubmission))}
                />
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {recentSubmission.projectTitle}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {recentSubmission.studentName} ({recentSubmission.rollNo}) - {recentSubmission.branch}
              </p>
              <p className="mt-2 text-xs text-slate-500">{recentSubmission.submittedAt}</p>
            </DemoGlassCard>

            <DemoGlassCard className={`p-5 ${GLASS_INTERACTIVE_CLASS}`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Plagiarism Report Summary
              </h2>
              <div className="mt-3 flex items-center gap-6">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{avgPlagiarism}%</p>
                  <p className="text-xs text-slate-500">Average Plagiarism Score</p>
                </div>
                <StatusBadge label={`${riskFromPercent(avgPlagiarism)} Risk`} tone="warning" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/60 bg-white/40 p-3">
                  <p className="text-xs text-slate-500">Total Submissions</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{totalSubmissions}</p>
                </div>
                <div className="rounded-xl border border-white/60 bg-white/40 p-3">
                  <p className="text-xs text-slate-500">Flagged Cases</p>
                  <p className="mt-1 text-lg font-semibold text-rose-700">{flaggedCount}</p>
                </div>
              </div>
            </DemoGlassCard>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
          >
            <DemoGlassCard className={`overflow-hidden ${GLASS_INTERACTIVE_CLASS}`}>
              <div className="border-b border-white/45 px-5 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                  Submissions
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/35 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student Name</th>
                      <th className="px-4 py-3 font-semibold">Roll No</th>
                      <th className="px-4 py-3 font-semibold">Branch</th>
                      <th className="px-4 py-3 font-semibold">Project Title</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Risk</th>
                      <th className="px-4 py-3 font-semibold">Plagiarism %</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => {
                      const effectiveStatus = getEffectiveStatus(submission);
                      const risk = riskFromPercent(submission.plagiarismPercent);
                      const canMarkCompleted = effectiveStatus !== "Reviewed";

                      return (
                        <tr
                          key={submission.id}
                          className={`group border-t border-white/35 text-slate-700 ${LIST_ROW_INTERACTIVE_CLASS}`}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium">
                            {submission.studentName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{submission.rollNo}</td>
                          <td className="whitespace-nowrap px-4 py-3">{submission.branch}</td>
                          <td className="min-w-[220px] px-4 py-3">{submission.projectTitle}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <StatusBadge
                              label={statusLabel(effectiveStatus)}
                              tone={statusTone(effectiveStatus)}
                            />
                            {effectiveStatus === "Under Review" ? (
                              <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-blue-100/70">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500/85 to-cyan-500/85"
                                  initial={{ x: "-90%" }}
                                  animate={{ x: "100%" }}
                                  transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                                />
                              </div>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${riskPillClass(
                                risk,
                              )}`}
                            >
                              {risk}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold">
                            {submission.plagiarismPercent}%
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-2 opacity-75 transition group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => setSelectedSubmission(submission)}
                                className={`rounded-lg border border-blue-200/75 bg-blue-50/75 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100/85 ${BUTTON_INTERACTIVE_CLASS}`}
                              >
                                View
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </DemoGlassCard>
          </motion.div>
        </div>
      </div>

      <TeacherReviewModal
        open={Boolean(selectedSubmission)}
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </DemoBackground>
  );
}
