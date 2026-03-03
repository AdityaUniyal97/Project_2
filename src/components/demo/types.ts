export interface TeacherSubmission {
  id: string;
  studentName: string;
  rollNo: string;
  branch: string;
  projectTitle: string;
  status: "Under Review" | "Flagged" | "Reviewed";
  plagiarismPercent: number;
  submittedAt: string;
  githubUrl: string;
  liveDemoUrl?: string;
  aiGeneratedProbability: number;
  originalityPercent: number;
  sourcesDetected: string[];
  vivaQuestions: string[];
  improvements: string[];
}
