import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import TeacherLayout from "./components/teacher/TeacherLayout";
import StudentLayout from "./components/student/StudentLayout";
import StudentDemoPage from "./pages/StudentDemoPage";
import TeacherOverviewPage from "./pages/teacher/TeacherOverviewPage";
import TeacherReportsPage from "./pages/teacher/TeacherReportsPage";
import TeacherSettingsPage from "./pages/teacher/TeacherSettingsPage";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import TeacherSubmissionsPage from "./pages/teacher/TeacherSubmissionsPage";
import StudentOverviewPage from "./pages/student/StudentOverviewPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/overview" replace />} />
          <Route path="overview" element={<StudentOverviewPage />} />
          <Route path="submit" element={<StudentDemoPage />} />
        </Route>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="/teacher/overview" replace />} />
          <Route path="overview" element={<TeacherOverviewPage />} />
          <Route path="submissions" element={<TeacherSubmissionsPage />} />
          <Route path="reports" element={<TeacherReportsPage />} />
          <Route path="students" element={<TeacherStudentsPage />} />
          <Route path="settings" element={<TeacherSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
