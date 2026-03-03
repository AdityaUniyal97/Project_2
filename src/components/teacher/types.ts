export type TeacherSubmissionStatus = "Under Review" | "Completed";

export type TeacherRiskLevel = "Low" | "Medium" | "High";

export interface TeacherDetectedSource {
  name: string;
  similarity: number;
}

export interface TeacherSubmissionRecord {
  id: string;
  studentName: string;
  rollNo: string;
  branch: string;
  projectTitle: string;
  submittedAt: string;
  plagiarismPercent: number;
  originalityPercent: number;
  status: TeacherSubmissionStatus;
  detectedSources: TeacherDetectedSource[];
  vivaSuggestions: string[];
}

export interface TeacherKpiStats {
  totalSubmissions: number;
  underReview: number;
  completed: number;
  highRiskProjects: number;
}

export interface TeacherStudentProject {
  id: string;
  title: string;
  submittedAt: string;
  status: TeacherSubmissionStatus;
}

export interface TeacherStudentRecord {
  id: string;
  name: string;
  rollNo: string;
  totalSubmissions: number;
  avgOriginality: number;
  recentProjects: TeacherStudentProject[];
}
