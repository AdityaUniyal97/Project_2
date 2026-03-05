import type { SubmissionStatus } from "../../lib/api";

export type StudentSubmissionStatus = SubmissionStatus;

export interface StudentSubmission {
  id: string;
  title: string;
  date: string;
  status: StudentSubmissionStatus;
  repoUrl: string;
  branch: string;
  description?: string;
}

export interface StudentStats {
  totalSubmissions: number;
  underReview: number;
  completed: number;
  completedRate: number;
}
