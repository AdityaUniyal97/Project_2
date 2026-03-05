import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import TeacherLayout from "./components/teacher/TeacherLayout";
import StudentLayout from "./components/student/StudentLayout";
import StudentDemoPage from "./pages/StudentDemoPage";
import AdminPage from "./pages/AdminPage";
import TeacherOverviewPage from "./pages/teacher/TeacherOverviewPage";
import TeacherReportsPage from "./pages/teacher/TeacherReportsPage";
import TeacherSettingsPage from "./pages/teacher/TeacherSettingsPage";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import TeacherSubmissionsPage from "./pages/teacher/TeacherSubmissionsPage";
import TeacherVivaPage from "./pages/teacher/TeacherVivaPage";
import TeacherDemoViewerPage from "./pages/teacher/TeacherDemoViewerPage";
import StudentOverviewPage from "./pages/student/StudentOverviewPage";
import StudentReviewPage from "./pages/student/StudentReviewPage";
import StudentChallengePage from "./pages/student/StudentChallengePage";
import AccountPage from "./pages/AccountPage";
import { getDashboardPathForRole } from "./lib/authClient";
import "./index.css";

const FORCE_AUTH_LANDING = import.meta.env.DEV;

function RootLanding() {
  const { user, isInitializing } = useAuth();

  if (FORCE_AUTH_LANDING) {
    return <Navigate to="/auth" replace />;
  }

  if (isInitializing) {
    return null;
  }

  if (user) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <Navigate to="/auth" replace />;
}

function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<"admin" | "student" | "teacher">;
  children: ReactNode;
}) {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootLanding />} />
          <Route path="/auth" element={<App initialMode="signin" />} />
          <Route path="/login" element={<App initialMode="signin" />} />
          <Route path="/signup" element={<App initialMode="signup" />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Navigate to="/admin/overview" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/overview"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/overview" replace />} />
            <Route path="overview" element={<StudentOverviewPage />} />
            <Route path="submit" element={<StudentDemoPage />} />
            <Route path="ai-review" element={<StudentReviewPage />} />
            <Route path="review" element={<Navigate to="/student/ai-review" replace />} />
            <Route path="analysis" element={<Navigate to="/student/ai-review" replace />} />
            <Route path="challenge" element={<StudentChallengePage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/teacher/overview" replace />} />
            <Route path="overview" element={<TeacherOverviewPage />} />
            <Route path="submissions" element={<TeacherSubmissionsPage />} />
            <Route path="reports" element={<TeacherReportsPage />} />
            <Route path="viva" element={<TeacherVivaPage />} />
            <Route path="demo/:submissionId" element={<TeacherDemoViewerPage />} />
            <Route path="students" element={<TeacherStudentsPage />} />
            <Route path="settings" element={<TeacherSettingsPage />} />
            <Route path="account" element={<AccountPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  </StrictMode>,
);
