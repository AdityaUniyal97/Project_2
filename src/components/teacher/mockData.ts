import type {
  TeacherKpiStats,
  TeacherRiskLevel,
  TeacherStudentRecord,
  TeacherSubmissionRecord,
} from "./types";

export const TEACHER_SUBMISSIONS: TeacherSubmissionRecord[] = [
  {
    id: "T-001",
    studentName: "Aarav Mehta",
    rollNo: "21CSE101",
    branch: "CSE",
    projectTitle: "Campus Connect Portal",
    submittedAt: "2026-03-03T10:20:00",
    plagiarismPercent: 28,
    originalityPercent: 72,
    status: "Under Review",
    detectedSources: [
      { name: "GitHub Public Repo", similarity: 22 },
      { name: "StackOverflow Snippets", similarity: 17 },
      { name: "Medium Article", similarity: 11 },
    ],
    vivaSuggestions: [
      "Explain your role-based authorization model and why it is safe.",
      "What trade-offs did you make while designing API pagination?",
      "How does your system recover from failed webhook events?",
    ],
  },
  {
    id: "T-002",
    studentName: "Diya Raman",
    rollNo: "21IT119",
    branch: "IT",
    projectTitle: "Smart Internship Tracker",
    submittedAt: "2026-03-02T18:35:00",
    plagiarismPercent: 18,
    originalityPercent: 82,
    status: "Completed",
    detectedSources: [
      { name: "GitHub Public Repo", similarity: 13 },
      { name: "Official Docs", similarity: 8 },
      { name: "Tutorial Blog", similarity: 6 },
    ],
    vivaSuggestions: [
      "How is recommendation ranking tuned for fairness?",
      "What metrics did you use to evaluate tracker quality?",
      "How does your cache invalidation strategy work?",
    ],
  },
  {
    id: "T-003",
    studentName: "Ishaan Patel",
    rollNo: "21AIML077",
    branch: "AIML",
    projectTitle: "Code Similarity Inspector",
    submittedAt: "2026-03-01T16:40:00",
    plagiarismPercent: 67,
    originalityPercent: 33,
    status: "Under Review",
    detectedSources: [
      { name: "GitHub Public Repo", similarity: 34 },
      { name: "Kaggle Notebook", similarity: 21 },
      { name: "GeeksforGeeks", similarity: 12 },
    ],
    vivaSuggestions: [
      "Why did you choose semantic vectors over token-only matching?",
      "How do you reduce false positives for short code files?",
      "What benchmark did you use to validate your threshold values?",
    ],
  },
  {
    id: "T-004",
    studentName: "Riya Nair",
    rollNo: "21CSE112",
    branch: "CSE",
    projectTitle: "Hostel Complaint Resolver",
    submittedAt: "2026-02-28T15:16:00",
    plagiarismPercent: 35,
    originalityPercent: 65,
    status: "Under Review",
    detectedSources: [
      { name: "GitHub Public Repo", similarity: 19 },
      { name: "StackOverflow Snippets", similarity: 10 },
      { name: "Community Forum", similarity: 9 },
    ],
    vivaSuggestions: [
      "How are complaint priorities assigned in your workflow?",
      "What SLA handling logic do you use for missed deadlines?",
      "How do you keep audit logs tamper-resistant?",
    ],
  },
  {
    id: "T-005",
    studentName: "Neeraj Iyer",
    rollNo: "21ECE062",
    branch: "ECE",
    projectTitle: "IoT Attendance Beacon",
    submittedAt: "2026-02-27T12:02:00",
    plagiarismPercent: 24,
    originalityPercent: 76,
    status: "Completed",
    detectedSources: [
      { name: "Hardware Forum", similarity: 14 },
      { name: "Vendor SDK Docs", similarity: 9 },
      { name: "GitHub Public Repo", similarity: 7 },
    ],
    vivaSuggestions: [
      "How do you secure IoT device provisioning and key exchange?",
      "What fallback path handles weak BLE signal quality?",
      "How did you test battery life assumptions?",
    ],
  },
  {
    id: "T-006",
    studentName: "Kritika Shah",
    rollNo: "21IT125",
    branch: "IT",
    projectTitle: "Faculty Workload Planner",
    submittedAt: "2026-02-25T18:42:00",
    plagiarismPercent: 41,
    originalityPercent: 59,
    status: "Under Review",
    detectedSources: [
      { name: "Research Paper", similarity: 16 },
      { name: "GitHub Public Repo", similarity: 14 },
      { name: "StackOverflow Snippets", similarity: 11 },
    ],
    vivaSuggestions: [
      "How does your planner resolve timetable conflicts deterministically?",
      "Which fairness metric balances faculty load distribution?",
      "What edge cases break your current allocation algorithm?",
    ],
  },
  {
    id: "T-007",
    studentName: "Yash Verma",
    rollNo: "21AIML081",
    branch: "AIML",
    projectTitle: "Resume Screening Assistant",
    submittedAt: "2026-02-24T14:28:00",
    plagiarismPercent: 63,
    originalityPercent: 37,
    status: "Under Review",
    detectedSources: [
      { name: "GitHub Public Repo", similarity: 31 },
      { name: "Towards Data Science", similarity: 18 },
      { name: "Tutorial Blog", similarity: 12 },
    ],
    vivaSuggestions: [
      "How do you audit fairness across candidate profiles?",
      "What leakage risks exist between train and test sets?",
      "How do you explain low-confidence ranking outcomes?",
    ],
  },
  {
    id: "T-008",
    studentName: "Manvi Rao",
    rollNo: "21CSE133",
    branch: "CSE",
    projectTitle: "E-Library Recommendation Engine",
    submittedAt: "2026-02-21T11:09:00",
    plagiarismPercent: 16,
    originalityPercent: 84,
    status: "Completed",
    detectedSources: [
      { name: "Open Library API Docs", similarity: 10 },
      { name: "GitHub Public Repo", similarity: 9 },
      { name: "Official Docs", similarity: 7 },
    ],
    vivaSuggestions: [
      "How do you handle cold-start recommendation challenges?",
      "What feedback signals are weighted in your ranking pipeline?",
      "How do you monitor model drift over time?",
    ],
  },
];

export const OVERVIEW_SPARKLINES = {
  total: [2, 3, 4, 4, 5, 6],
  underReview: [1, 2, 2, 3, 3, 4],
  completed: [1, 1, 2, 2, 3, 3],
  highRisk: [0, 1, 1, 2, 2, 2],
} as const;

export function toSparklinePoints(values: number[], width = 90, height = 28) {
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

export function toReadableDate(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return input;
  return parsed.toLocaleString();
}

export function getRiskLevel(plagiarismPercent: number): TeacherRiskLevel {
  if (plagiarismPercent >= 60) return "High";
  if (plagiarismPercent >= 35) return "Medium";
  return "Low";
}

export function buildTeacherStats(submissions: TeacherSubmissionRecord[]): TeacherKpiStats {
  const totalSubmissions = submissions.length;
  const underReview = submissions.filter((item) => item.status === "Under Review").length;
  const completed = submissions.filter((item) => item.status === "Completed").length;
  const highRiskProjects = submissions.filter(
    (item) => getRiskLevel(item.plagiarismPercent) === "High",
  ).length;

  return {
    totalSubmissions,
    underReview,
    completed,
    highRiskProjects,
  };
}

export function compareByDate(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

export function buildTeacherStudents(
  submissions: TeacherSubmissionRecord[],
): TeacherStudentRecord[] {
  const grouped = new Map<string, TeacherStudentRecord>();

  submissions.forEach((submission) => {
    const key = submission.rollNo;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        id: `ST-${key}`,
        name: submission.studentName,
        rollNo: submission.rollNo,
        totalSubmissions: 1,
        avgOriginality: submission.originalityPercent,
        recentProjects: [
          {
            id: submission.id,
            title: submission.projectTitle,
            submittedAt: submission.submittedAt,
            status: submission.status,
          },
        ],
      });
      return;
    }

    const nextTotal = existing.totalSubmissions + 1;
    const nextAverage = Math.round(
      (existing.avgOriginality * existing.totalSubmissions + submission.originalityPercent) /
        nextTotal,
    );

    grouped.set(key, {
      ...existing,
      totalSubmissions: nextTotal,
      avgOriginality: nextAverage,
      recentProjects: [
        ...existing.recentProjects,
        {
          id: submission.id,
          title: submission.projectTitle,
          submittedAt: submission.submittedAt,
          status: submission.status,
        },
      ].sort((left, right) => compareByDate(right.submittedAt, left.submittedAt)),
    });
  });

  return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name));
}
