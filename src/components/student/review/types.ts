export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type VivaTopic =
  | "Git"
  | "Core Logic"
  | "Complexity"
  | "Architecture"
  | "Debugging";

export type PipelineStepStatus = "pending" | "active" | "completed";

export interface SubmissionDetails {
  studentName?: string;
  rollNumber: string;
  branch: string;
  projectTitle: string;
  githubRepo: string;
  liveLink: string;
  description?: string;
}

export interface ReviewMetrics {
  fileOverlapPct: number;
  structuralOverlapPct: number;
  commitRisk: number;
  aiConfidencePct: number;
}

export interface VivaQuestion {
  id: string;
  topic: VivaTopic;
  question: string;
}

export interface AnalysisOutput {
  riskLevel: RiskLevel;
  confidencePct: number;
  metrics: ReviewMetrics;
  narrativeLines: string[];
  vivaQuestions: VivaQuestion[];
}

export interface PipelineStepDefinition {
  id: string;
  label: string;
}
