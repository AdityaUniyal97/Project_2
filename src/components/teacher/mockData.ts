import type {
  StudentProfile,
  Submission,
  TeacherRiskLevel,
  TeacherSettingsState,
  VivaQuestion,
  VivaSubmissionState,
} from "./types";

function createVivaQuestions(baseId: string, topic: string): VivaQuestion[] {
  return [
    {
      id: `${baseId}-v1`,
      topicTag: topic,
      difficulty: "Medium",
      question: "Walk through your core design decisions for this module.",
      expectedTalkingPoints: "Architecture choice, key tradeoffs, and why alternatives were rejected.",
    },
    {
      id: `${baseId}-v2`,
      topicTag: "Testing",
      difficulty: "Easy",
      question: "How did you validate correctness and edge cases?",
      expectedTalkingPoints: "Test strategy, critical edge cases, and production monitoring checks.",
    },
    {
      id: `${baseId}-v3`,
      topicTag: "Security",
      difficulty: "Hard",
      question: "What are the top security risks in your current implementation?",
      expectedTalkingPoints: "Threat model, attack surface, mitigation steps, and remaining risks.",
    },
  ];
}

export const TEACHER_SUBMISSIONS_SEED: Submission[] = [
  {
    id: "SUB-001",
    studentName: "Aarav Mehta",
    rollNumber: "21CSE101",
    branch: "CSE",
    projectTitle: "Campus Connect Portal",
    submittedAt: "2026-03-03T10:20:00",
    status: "Under Review",
    riskLevel: "MEDIUM",
    originalityPercent: 72,
    plagiarismPercent: 28,
    structuralOverlapPercent: 31,
    aiConfidencePercent: 79,
    commitRiskScore: 4.2,
    projectType: "web",
    liveDemoUrl: "https://example.org/campus-connect",
    githubUrl: "https://github.com/demo/campus-connect",
    summaryNarrative:
      "Submission shows reasonable originality with moderate structural reuse in routing and dashboard modules.",
    detectedSources: [
      { name: "GitHub Public Repo", percent: 22 },
      { name: "StackOverflow Snippets", percent: 14 },
      { name: "Medium Tutorial", percent: 9 },
    ],
    vivaQuestions: createVivaQuestions("SUB-001", "Architecture"),
  },
  {
    id: "SUB-002",
    studentName: "Diya Raman",
    rollNumber: "21IT119",
    branch: "IT",
    projectTitle: "Smart Internship Tracker",
    submittedAt: "2026-03-02T18:35:00",
    status: "Completed",
    riskLevel: "LOW",
    originalityPercent: 84,
    plagiarismPercent: 16,
    structuralOverlapPercent: 19,
    aiConfidencePercent: 88,
    commitRiskScore: 2.9,
    projectType: "web",
    liveDemoUrl: "https://example.org/internship-tracker",
    githubUrl: "https://github.com/demo/internship-tracker",
    summaryNarrative:
      "Strong originality and healthy commit history. Similarity appears mostly from framework boilerplate.",
    detectedSources: [
      { name: "Official Docs", percent: 8 },
      { name: "GitHub Public Repo", percent: 7 },
      { name: "Tutorial Blog", percent: 5 },
    ],
    vivaQuestions: createVivaQuestions("SUB-002", "Data Modeling"),
  },
  {
    id: "SUB-003",
    studentName: "Ishaan Patel",
    rollNumber: "21AIML077",
    branch: "AIML",
    projectTitle: "Code Similarity Inspector",
    submittedAt: "2026-03-01T16:40:00",
    status: "Under Review",
    riskLevel: "CRITICAL",
    originalityPercent: 29,
    plagiarismPercent: 71,
    structuralOverlapPercent: 76,
    aiConfidencePercent: 93,
    commitRiskScore: 9.1,
    projectType: "web",
    liveDemoUrl: "https://example.org/code-similarity",
    githubUrl: "https://github.com/demo/code-similarity",
    summaryNarrative:
      "High overlap across core scoring pipeline and nearly identical folder structure versus known public references.",
    detectedSources: [
      { name: "GitHub Public Repo", percent: 36 },
      { name: "Kaggle Notebook", percent: 23 },
      { name: "GeeksforGeeks", percent: 12 },
    ],
    vivaQuestions: createVivaQuestions("SUB-003", "ML Pipeline"),
  },
  {
    id: "SUB-004",
    studentName: "Riya Nair",
    rollNumber: "21CSE112",
    branch: "CSE",
    projectTitle: "Hostel Complaint Resolver",
    submittedAt: "2026-02-28T15:16:00",
    status: "Under Review",
    riskLevel: "MEDIUM",
    originalityPercent: 63,
    plagiarismPercent: 37,
    structuralOverlapPercent: 42,
    aiConfidencePercent: 74,
    commitRiskScore: 5.1,
    projectType: "web",
    liveDemoUrl: "https://example.org/hostel-resolver",
    githubUrl: "https://github.com/demo/hostel-resolver",
    summaryNarrative:
      "Moderate overlap in utility layer and UI sections; business workflow logic appears partially unique.",
    detectedSources: [
      { name: "GitHub Public Repo", percent: 19 },
      { name: "Community Forum", percent: 11 },
      { name: "StackOverflow Snippets", percent: 9 },
    ],
    vivaQuestions: createVivaQuestions("SUB-004", "Workflow"),
  },
  {
    id: "SUB-005",
    studentName: "Neeraj Iyer",
    rollNumber: "21ECE062",
    branch: "ECE",
    projectTitle: "IoT Attendance Beacon",
    submittedAt: "2026-02-27T12:02:00",
    status: "Completed",
    riskLevel: "LOW",
    originalityPercent: 77,
    plagiarismPercent: 23,
    structuralOverlapPercent: 24,
    aiConfidencePercent: 82,
    commitRiskScore: 3.8,
    projectType: "mobile",
    liveDemoUrl: "https://example.org/iot-attendance",
    githubUrl: "https://github.com/demo/iot-attendance",
    summaryNarrative:
      "Implementation appears original with expected reuse of SDK docs and sample BLE handling patterns.",
    detectedSources: [
      { name: "Vendor SDK Docs", percent: 11 },
      { name: "Hardware Forum", percent: 8 },
      { name: "GitHub Public Repo", percent: 6 },
    ],
    vivaQuestions: createVivaQuestions("SUB-005", "IoT"),
  },
  {
    id: "SUB-006",
    studentName: "Kritika Shah",
    rollNumber: "21IT125",
    branch: "IT",
    projectTitle: "Faculty Workload Planner",
    submittedAt: "2026-02-25T18:42:00",
    status: "Under Review",
    riskLevel: "HIGH",
    originalityPercent: 47,
    plagiarismPercent: 53,
    structuralOverlapPercent: 58,
    aiConfidencePercent: 86,
    commitRiskScore: 7.5,
    projectType: "web",
    liveDemoUrl: "https://example.org/workload-planner",
    githubUrl: "https://github.com/demo/workload-planner",
    summaryNarrative:
      "Scheduling algorithm and conflict resolution logic are close to public implementations; needs viva validation.",
    detectedSources: [
      { name: "Research Paper", percent: 18 },
      { name: "GitHub Public Repo", percent: 17 },
      { name: "StackOverflow Snippets", percent: 12 },
    ],
    vivaQuestions: createVivaQuestions("SUB-006", "Optimization"),
  },
  {
    id: "SUB-007",
    studentName: "Yash Verma",
    rollNumber: "21AIML081",
    branch: "AIML",
    projectTitle: "Resume Screening Assistant",
    submittedAt: "2026-02-24T14:28:00",
    status: "Under Review",
    riskLevel: "HIGH",
    originalityPercent: 39,
    plagiarismPercent: 61,
    structuralOverlapPercent: 66,
    aiConfidencePercent: 90,
    commitRiskScore: 8.0,
    projectType: "web",
    liveDemoUrl: "https://example.org/resume-screening",
    githubUrl: "https://github.com/demo/resume-screening",
    summaryNarrative:
      "Strong evidence of copied model-serving and ranking flow. Explainability layer appears minimally adapted.",
    detectedSources: [
      { name: "GitHub Public Repo", percent: 33 },
      { name: "Towards Data Science", percent: 16 },
      { name: "Tutorial Blog", percent: 11 },
    ],
    vivaQuestions: createVivaQuestions("SUB-007", "Fairness"),
  },
  {
    id: "SUB-008",
    studentName: "Manvi Rao",
    rollNumber: "21CSE133",
    branch: "CSE",
    projectTitle: "E-Library Recommendation Engine",
    submittedAt: "2026-02-21T11:09:00",
    status: "Completed",
    riskLevel: "LOW",
    originalityPercent: 87,
    plagiarismPercent: 13,
    structuralOverlapPercent: 15,
    aiConfidencePercent: 84,
    commitRiskScore: 2.1,
    projectType: "web",
    liveDemoUrl: "https://example.org/e-library",
    githubUrl: "https://github.com/demo/e-library",
    summaryNarrative:
      "Healthy originality profile with small external overlap mainly in API integration and UI scaffolding.",
    detectedSources: [
      { name: "Open Library Docs", percent: 7 },
      { name: "Official Docs", percent: 6 },
      { name: "GitHub Public Repo", percent: 5 },
    ],
    vivaQuestions: createVivaQuestions("SUB-008", "Recommendations"),
  },
  {
    id: "SUB-009",
    studentName: "Arjun Sethi",
    rollNumber: "21ME057",
    branch: "MECH",
    projectTitle: "Workshop Inventory Manager",
    submittedAt: "2026-02-20T17:10:00",
    status: "Under Review",
    riskLevel: "MEDIUM",
    originalityPercent: 69,
    plagiarismPercent: 31,
    structuralOverlapPercent: 35,
    aiConfidencePercent: 72,
    commitRiskScore: 4.8,
    projectType: "web",
    liveDemoUrl: "https://example.org/workshop-inventory",
    githubUrl: "https://github.com/demo/workshop-inventory",
    summaryNarrative:
      "Mostly original domain flow with medium overlap in inventory table and CRUD handlers.",
    detectedSources: [
      { name: "GitHub Public Repo", percent: 15 },
      { name: "Vendor Docs", percent: 9 },
      { name: "Forum Thread", percent: 7 },
    ],
    vivaQuestions: createVivaQuestions("SUB-009", "State Management"),
  },
  {
    id: "SUB-010",
    studentName: "Sana Qureshi",
    rollNumber: "21EEE048",
    branch: "EEE",
    projectTitle: "Energy Meter Insights",
    submittedAt: "2026-02-18T09:28:00",
    status: "Completed",
    riskLevel: "LOW",
    originalityPercent: 79,
    plagiarismPercent: 21,
    structuralOverlapPercent: 23,
    aiConfidencePercent: 81,
    commitRiskScore: 3.2,
    projectType: "mobile",
    liveDemoUrl: "https://example.org/energy-insights",
    githubUrl: "https://github.com/demo/energy-insights",
    summaryNarrative:
      "Originality remains healthy; shared snippets are mostly telemetry parsing and chart helpers.",
    detectedSources: [
      { name: "Open Source Docs", percent: 10 },
      { name: "GitHub Public Repo", percent: 7 },
      { name: "Engineering Blog", percent: 4 },
    ],
    vivaQuestions: createVivaQuestions("SUB-010", "Analytics"),
  },
  {
    id: "SUB-011",
    studentName: "Pranav Kulkarni",
    rollNumber: "21IT141",
    branch: "IT",
    projectTitle: "Placement Analytics Hub",
    submittedAt: "2026-02-16T13:47:00",
    status: "Under Review",
    riskLevel: "HIGH",
    originalityPercent: 44,
    plagiarismPercent: 56,
    structuralOverlapPercent: 61,
    aiConfidencePercent: 87,
    commitRiskScore: 7.9,
    projectType: "web",
    liveDemoUrl: "https://example.org/placement-analytics",
    githubUrl: "https://github.com/demo/placement-analytics",
    summaryNarrative:
      "Model training and scoring pipeline aligns strongly with available templates and requires viva explanation.",
    detectedSources: [
      { name: "Kaggle Notebook", percent: 21 },
      { name: "GitHub Public Repo", percent: 19 },
      { name: "StackOverflow Snippets", percent: 10 },
    ],
    vivaQuestions: createVivaQuestions("SUB-011", "Data Science"),
  },
  {
    id: "SUB-012",
    studentName: "Tanvi Chopra",
    rollNumber: "21CSE147",
    branch: "CSE",
    projectTitle: "Remote Lab Simulator",
    submittedAt: "2026-02-14T11:15:00",
    status: "Under Review",
    riskLevel: "CRITICAL",
    originalityPercent: 24,
    plagiarismPercent: 76,
    structuralOverlapPercent: 81,
    aiConfidencePercent: 95,
    commitRiskScore: 9.6,
    projectType: "cli",
    liveDemoUrl: "https://example.org/remote-lab",
    githubUrl: "https://github.com/demo/remote-lab",
    summaryNarrative:
      "Critical risk: heavy overlap in simulation engine and orchestration logic with minimal contextual adaptation.",
    detectedSources: [
      { name: "GitHub Public Repo", percent: 38 },
      { name: "Tutorial Blog", percent: 22 },
      { name: "YouTube Walkthrough", percent: 14 },
    ],
    vivaQuestions: createVivaQuestions("SUB-012", "Systems"),
  },
];

export const DEFAULT_TEACHER_SETTINGS: TeacherSettingsState = {
  autoAnalysis: true,
  strictMode: false,
  vivaRequiredForHighRisk: true,
  similarityThreshold: 62,
  confidenceThreshold: 74,
};

export function sortBySubmittedDesc(submissions: Submission[]) {
  return [...submissions].sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
  );
}

export function sortBySubmittedAsc(submissions: Submission[]) {
  return [...submissions].sort(
    (left, right) => new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime(),
  );
}

export function toReadableDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export function riskWeight(level: TeacherRiskLevel) {
  if (level === "CRITICAL") return 4;
  if (level === "HIGH") return 3;
  if (level === "MEDIUM") return 2;
  return 1;
}

export function deriveStudentProfiles(submissions: Submission[]): StudentProfile[] {
  const grouped = new Map<string, Submission[]>();

  submissions.forEach((submission) => {
    const current = grouped.get(submission.rollNumber) ?? [];
    grouped.set(submission.rollNumber, [...current, submission]);
  });

  return Array.from(grouped.entries())
    .map(([rollNumber, items]) => {
      const sorted = sortBySubmittedAsc(items);
      const avgOriginality = Math.round(
        sorted.reduce((sum, item) => sum + item.originalityPercent, 0) / sorted.length,
      );

      return {
        id: `STU-${rollNumber}`,
        studentName: sorted[0].studentName,
        rollNumber,
        branch: sorted[0].branch,
        totalSubmissions: sorted.length,
        avgOriginality,
        riskTrendSeries: sorted.map((item) => riskWeight(item.riskLevel) * 22 + 6),
      };
    })
    .sort((left, right) => left.studentName.localeCompare(right.studentName));
}

export function buildRiskDistribution(submissions: Submission[]) {
  return {
    LOW: submissions.filter((item) => item.riskLevel === "LOW").length,
    MEDIUM: submissions.filter((item) => item.riskLevel === "MEDIUM").length,
    HIGH: submissions.filter((item) => item.riskLevel === "HIGH").length,
    CRITICAL: submissions.filter((item) => item.riskLevel === "CRITICAL").length,
  };
}

export function buildSubmissionsTimeline(submissions: Submission[]) {
  const sorted = sortBySubmittedAsc(submissions);
  const points = sorted.map((item, index) => ({
    xLabel: new Date(item.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    y: index + 1,
  }));

  return points.slice(Math.max(points.length - 8, 0));
}

export function buildTopDetectedSources(submissions: Submission[]) {
  const totals = new Map<string, number>();

  submissions.forEach((submission) => {
    submission.detectedSources.forEach((source) => {
      totals.set(source.name, (totals.get(source.name) ?? 0) + source.percent);
    });
  });

  return Array.from(totals.entries())
    .map(([name, percent]) => ({ name, percent: Math.round(percent / submissions.length) }))
    .sort((left, right) => right.percent - left.percent)
    .slice(0, 6);
}

export function buildInitialVivaState(submissions: Submission[]): Record<string, VivaSubmissionState> {
  return Object.fromEntries(
    submissions.map((submission) => [
      submission.id,
      {
        status: submission.riskLevel === "HIGH" || submission.riskLevel === "CRITICAL" ? "Pending" : "Completed",
        outcome: null,
        questions: Object.fromEntries(
          submission.vivaQuestions.map((question) => [
            question.id,
            {
              asked: false,
              notes: "",
            },
          ]),
        ),
      },
    ]),
  );
}

export function toSparklinePoints(values: number[], width = 92, height = 28) {
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


