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

function seedEntry(
  id: string,
  studentName: string,
  rollNumber: string,
  branch: string,
  projectTitle: string,
  submittedAt: string,
  status: Submission["status"],
  riskLevel: Submission["riskLevel"],
  aiScore: number,
  similarityScore: number,
  commitRiskScore: number,
  aiDetectionProbability: number,
  codeQualityScore: number,
  aiConfidence: number,
  aiRiskLevel: string,
  aiRecommendation: string,
  projectType: Submission["projectType"],
  summaryNarrative: string,
  flags: string[],
  topic: string,
  liveDemoUrl?: string,
  githubUrl?: string,
): Submission {
  return {
    id,
    studentName,
    rollNumber,
    branch,
    projectTitle,
    submittedAt,
    status,
    riskLevel,
    projectType,
    liveDemoUrl,
    githubUrl,
    aiScore,
    aiSummary: summaryNarrative,
    aiFlags: flags,
    aiRiskLevel,
    aiRecommendation,
    aiConfidence,
    aiViva: [],
    aiChallenge: null,
    aiEvidence: { similarity_score: similarityScore, commit_risk_score: commitRiskScore, ai_detection_probability: aiDetectionProbability, code_quality_score: codeQualityScore },
    originalityPercent: Math.round(aiScore),
    plagiarismPercent: Math.round(similarityScore * 100),
    similarityScore,
    commitRiskScore,
    aiDetectionProbability,
    codeQualityScore,
    summaryNarrative,
    vivaQuestions: createVivaQuestions(id, topic),
  };
}

export const TEACHER_SUBMISSIONS_SEED: Submission[] = [
  seedEntry("SUB-001", "Aarav Mehta", "21CSE101", "CSE", "Campus Connect Portal", "2026-03-03T10:20:00", "Under Review", "MEDIUM", 72, 0.28, 0.31, 0.12, 0.74, 79, "MONITOR", "REQUIRE_VIVA", "web", "Submission shows reasonable originality with moderate structural reuse in routing and dashboard modules.", ["GitHub Public Repo overlap", "StackOverflow Snippets"], "Architecture", "https://example.org/campus-connect", "https://github.com/demo/campus-connect"),
  seedEntry("SUB-002", "Diya Raman", "21IT119", "IT", "Smart Internship Tracker", "2026-03-02T18:35:00", "Completed", "LOW", 84, 0.16, 0.19, 0.05, 0.88, 88, "LOW", "CLEAR_TO_PASS", "web", "Strong originality and healthy commit history.", ["Framework boilerplate"], "Data Modeling", "https://example.org/internship-tracker", "https://github.com/demo/internship-tracker"),
  seedEntry("SUB-003", "Ishaan Patel", "21AIML077", "AIML", "Code Similarity Inspector", "2026-03-01T16:40:00", "Under Review", "HIGH", 29, 0.71, 0.76, 0.35, 0.45, 93, "HIGH", "RECOMMEND_REJECTION", "web", "High overlap across core scoring pipeline and nearly identical folder structure.", ["GitHub Public Repo", "Kaggle Notebook", "GeeksforGeeks"], "ML Pipeline", "https://example.org/code-similarity", "https://github.com/demo/code-similarity"),
  seedEntry("SUB-004", "Riya Nair", "21CSE112", "CSE", "Hostel Complaint Resolver", "2026-02-28T15:16:00", "Under Review", "MEDIUM", 63, 0.37, 0.42, 0.18, 0.65, 74, "MONITOR", "REQUIRE_VIVA", "web", "Moderate overlap in utility layer and UI sections.", ["GitHub Public Repo", "Community Forum"], "Workflow", "https://example.org/hostel-resolver", "https://github.com/demo/hostel-resolver"),
  seedEntry("SUB-005", "Neeraj Iyer", "21ECE062", "ECE", "IoT Attendance Beacon", "2026-02-27T12:02:00", "Completed", "LOW", 77, 0.23, 0.24, 0.08, 0.82, 82, "LOW", "CLEAR_TO_PASS", "mobile", "Implementation appears original with expected reuse of SDK docs.", ["Vendor SDK Docs"], "IoT", "https://example.org/iot-attendance", "https://github.com/demo/iot-attendance"),
  seedEntry("SUB-006", "Kritika Shah", "21IT125", "IT", "Faculty Workload Planner", "2026-02-25T18:42:00", "Under Review", "HIGH", 47, 0.53, 0.58, 0.28, 0.55, 86, "SUSPICIOUS", "REQUIRE_LIVE_CODING", "web", "Scheduling algorithm and conflict resolution logic are close to public implementations.", ["Research Paper", "GitHub Public Repo", "StackOverflow Snippets"], "Optimization", "https://example.org/workload-planner", "https://github.com/demo/workload-planner"),
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
    submission.aiFlags.forEach((flag) => {
      totals.set(flag, (totals.get(flag) ?? 0) + 1);
    });
  });

  const total = submissions.length || 1;
  return Array.from(totals.entries())
    .map(([name, count]) => ({ name, percent: Math.round((count / total) * 100) }))
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


