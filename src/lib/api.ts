export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "done";

export interface SubmissionRecord {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  repoUrl: string;
  branch: string;
  status: SubmissionStatus;
  aiScore?: number | null;
  aiSummary?: string | null;
  aiFlags?: string[];
  reviewStartedAt?: string | null;
  reviewCompletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MySubmissionRecord {
  id: string;
  title: string;
  repoUrl: string;
  status: SubmissionStatus | "done";
  createdAt: string;
}

interface ApiErrorResponse {
  message?: string;
}

export interface TeacherOwnerRecord {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
}

export interface TeacherReviewRecord {
  rating?: number | null;
  remarks?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface TeacherSubmissionRecord {
  id?: string;
  _id?: string;
  ownerId: string | TeacherOwnerRecord;
  title: string;
  description?: string;
  repoUrl: string;
  branch: string;
  techTags?: string[];
  rollNumber?: string;
  liveDemoUrl?: string;
  status: SubmissionStatus;
  aiScore?: number | null;
  aiSummary?: string | null;
  aiFlags?: string[];
  reviewStartedAt?: string | null;
  reviewCompletedAt?: string | null;
  assignedTeacherId?: string | null;
  teacherReview?: TeacherReviewRecord | null;
  createdAt: string;
  updatedAt: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_PI_URL ?? "http://localhost:8000";

export async function apiRequest<TResponse>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const rawText = await response.text();
  let data: unknown = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText) as unknown;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorData = (data ?? {}) as ApiErrorResponse;
    const message =
      typeof errorData.message === "string" && errorData.message.trim().length > 0
        ? errorData.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as TResponse;
}

export function createSubmission(payload: {
  title: string;
  description?: string;
  repoUrl: string;
  branch?: string;
}) {
  return apiRequest<{ submission: SubmissionRecord }>("/api/submissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listSubmissions() {
  return apiRequest<{ submissions: SubmissionRecord[] }>("/api/submissions", {
    method: "GET",
  });
}

export function listMySubmissions() {
  return apiRequest<{ submissions: MySubmissionRecord[] }>("/api/submissions/my", {
    method: "GET",
  });
}

export function getSubmission(id: string) {
  return apiRequest<{ submission: SubmissionRecord }>(`/api/submissions/${id}`, {
    method: "GET",
  });
}

export function updateSubmission(
  id: string,
  payload: {
    title?: string;
    description?: string;
    repoUrl?: string;
    branch?: string;
  },
) {
  return apiRequest<{ submission: SubmissionRecord }>(`/api/submissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSubmission(id: string) {
  return apiRequest<{ message: string }>(`/api/submissions/${id}`, {
    method: "DELETE",
  });
}

export function startAiReview(submissionId: string) {
  return apiRequest<{ submission: SubmissionRecord }>(`/api/review/start/${submissionId}`, {
    method: "POST",
  });
}

export function getReviewStatus(submissionId: string) {
  return apiRequest<{
    status: SubmissionStatus | "done";
    aiScore: number | null;
    aiSummary: string | null;
    aiFlags: string[];
  }>(`/api/review/status/${submissionId}`, {
    method: "GET",
  });
}

export function listTeacherSubmissions(params?: {
  status?: SubmissionStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();

  return apiRequest<{ items: TeacherSubmissionRecord[]; page: number; limit: number; total: number }>(
    `/api/teacher/submissions${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );
}

export function getTeacherSubmission(submissionId: string) {
  return apiRequest<{ submission: TeacherSubmissionRecord }>(`/api/teacher/submissions/${submissionId}`, {
    method: "GET",
  });
}

export function updateTeacherSubmissionReview(
  submissionId: string,
  payload: {
    rating?: number;
    remarks?: string;
  },
) {
  return apiRequest<{ submission: TeacherSubmissionRecord }>(
    `/api/teacher/submissions/${submissionId}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function updateTeacherSubmissionStatus(submissionId: string, status: SubmissionStatus) {
  return apiRequest<{ submission: TeacherSubmissionRecord }>(
    `/api/teacher/submissions/${submissionId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export function assignTeacherToSubmission(submissionId: string, teacherId: string) {
  return apiRequest<{ submission: TeacherSubmissionRecord }>(
    `/api/teacher/submissions/${submissionId}/assign`,
    {
      method: "PATCH",
      body: JSON.stringify({ teacherId }),
    },
  );
}
