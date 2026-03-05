export type TeacherSubmissionStatus = "Under Review" | "Completed";

export type TeacherRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProjectType = "web" | "mobile" | "cli";

export type VivaDifficulty = "Easy" | "Medium" | "Hard";

export type VivaOutcome = "Pass" | "Needs Review" | "Fail";

export type VivaQueueStatus = "Pending" | "Completed";

export interface DetectedSource {
  name: string;
  percent: number;
}

export interface VivaQuestion {
  id: string;
  topicTag: string;
  difficulty: VivaDifficulty;
  question: string;
  expectedTalkingPoints: string;
}

export interface Submission {
  id: string;
  studentName: string;
  rollNumber: string;
  branch: string;
  projectTitle: string;
  submittedAt: string;
  status: TeacherSubmissionStatus;
  riskLevel: TeacherRiskLevel;
  projectType: ProjectType;
  liveDemoUrl?: string;
  githubUrl?: string;
  /** 0-100 authenticity score from AI engine */
  aiScore: number;
  /** AI summary / primary finding */
  aiSummary: string;
  /** Flags from AI engine */
  aiFlags: string[];
  /** CLEAR | LOW | MONITOR | SUSPICIOUS | HIGH | CRITICAL */
  aiRiskLevel: string;
  /** CLEAR_TO_PASS | REQUIRE_VIVA | REQUIRE_LIVE_CODING | RECOMMEND_REJECTION */
  aiRecommendation: string;
  /** 0-100 confidence from AI engine */
  aiConfidence: number;
  /** Viva questions from AI engine */
  aiViva: string[];
  /** Live coding challenge from AI engine */
  aiChallenge: Record<string, unknown> | null;
  /** Full evidence breakdown */
  aiEvidence: Record<string, unknown> | null;

  /* Derived convenience fields (computed from real data) */
  originalityPercent: number;
  plagiarismPercent: number;
  similarityScore: number;
  commitRiskScore: number;
  aiDetectionProbability: number;
  codeQualityScore: number;
  summaryNarrative: string;
  vivaQuestions: VivaQuestion[];
}

export interface StudentProfile {
  id: string;
  studentName: string;
  rollNumber: string;
  branch: string;
  totalSubmissions: number;
  avgOriginality: number;
  riskTrendSeries: number[];
}

export interface VivaQuestionState {
  asked: boolean;
  notes: string;
}

export interface VivaSubmissionState {
  status: VivaQueueStatus;
  outcome: VivaOutcome | null;
  questions: Record<string, VivaQuestionState>;
}

export interface TeacherSettingsState {
  autoAnalysis: boolean;
  strictMode: boolean;
  vivaRequiredForHighRisk: boolean;
  similarityThreshold: number;
  confidenceThreshold: number;
}
