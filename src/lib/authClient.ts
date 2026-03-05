import { apiRequest } from "./api";

export type UserRole = "admin" | "student" | "teacher";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  photoUrl?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: AuthUser;
}

export function getPathForRole(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/student";
}

export function getDashboardPathForRole(role: UserRole) {
  if (role === "admin") return "/admin/overview";
  return `${getPathForRole(role)}/overview`;
}

export function register(payload: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function devLogin(payload: { role: "student" | "teacher" }) {
  return apiRequest<AuthResponse>("/api/auth/dev-login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getCurrentUser() {
  return apiRequest<AuthResponse>("/api/auth/me", {
    method: "GET",
  });
}

export function pingStudentRoute() {
  return apiRequest<{ message: string }>("/api/student/ping", {
    method: "GET",
  });
}

export function pingTeacherRoute() {
  return apiRequest<{ message: string }>("/api/teacher/ping", {
    method: "GET",
  });
}

export function pingAdminRoute() {
  return apiRequest<{ message: string }>("/api/admin/ping", {
    method: "GET",
  });
}
