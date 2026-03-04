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
  originalityPercent: number;
  plagiarismPercent: number;
  structuralOverlapPercent: number;
  aiConfidencePercent: number;
  commitRiskScore: number;
  projectType: ProjectType;
  liveDemoUrl?: string;
  githubUrl?: string;
  summaryNarrative: string;
  detectedSources: DetectedSource[];
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
