export type StudentSubmissionStatus = "Under Review" | "Completed";

export interface StudentSubmission {
  id: string;
  title: string;
  date: string;
  status: StudentSubmissionStatus;
  originality: number;
  plagiarism: number;
}

export interface StudentStats {
  totalSubmissions: number;
  underReview: number;
  completed: number;
  avgOriginality: number;
}
