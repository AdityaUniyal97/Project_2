import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import TeacherStatusBadge from "../../components/teacher/TeacherStatusBadge";
import { TEACHER_SUBMISSIONS, buildTeacherStudents, toReadableDate } from "../../components/teacher/mockData";
import { GLASS_INTERACTIVE_CLASS, LIST_ROW_INTERACTIVE_CLASS } from "../../components/ui/glass";

export default function TeacherStudentsPage() {
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const students = useMemo(() => buildTeacherStudents(TEACHER_SUBMISSIONS), []);

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Students</h2>
          <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {students.length} Students
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-2 py-2 font-semibold">Name</th>
                <th className="px-2 py-2 font-semibold">Roll Number</th>
                <th className="px-2 py-2 font-semibold">Total Submissions</th>
                <th className="px-2 py-2 font-semibold">Avg Originality</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const expanded = expandedStudentId === student.id;
                const completed = student.recentProjects.filter(
                  (item) => item.status === "Completed",
                ).length;
                const underReview = student.recentProjects.length - completed;

                return (
                  <Fragment key={student.id}>
                    <tr
                      className={`group cursor-pointer border-t border-white/40 text-slate-700 ${LIST_ROW_INTERACTIVE_CLASS}`}
                      onClick={() =>
                        setExpandedStudentId((current) =>
                          current === student.id ? null : student.id,
                        )
                      }
                    >
                      <td className="px-2 py-2.5 font-medium text-slate-900">{student.name}</td>
                      <td className="px-2 py-2.5 text-xs text-slate-600">{student.rollNo}</td>
                      <td className="px-2 py-2.5">{student.totalSubmissions}</td>
                      <td className="px-2 py-2.5 font-semibold text-slate-800">
                        {student.avgOriginality}%
                      </td>
                    </tr>
                    <AnimatePresence initial={false}>
                      {expanded ? (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td colSpan={4} className="border-t border-white/35 px-3 py-3">
                            <div className="rounded-xl border border-white/55 bg-white/45 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Recent Projects
                              </p>
                              <div className="mt-2 grid gap-2">
                                {student.recentProjects.slice(0, 4).map((project) => (
                                  <div
                                    key={project.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/55 bg-white/55 px-3 py-2"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-slate-800">
                                        {project.title}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {toReadableDate(project.submittedAt)}
                                      </p>
                                    </div>
                                    <TeacherStatusBadge status={project.status} />
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full border border-blue-200/75 bg-blue-50/70 px-2.5 py-1 font-semibold text-blue-700">
                                  Total: {student.totalSubmissions}
                                </span>
                                <span className="rounded-full border border-emerald-200/75 bg-emerald-50/70 px-2.5 py-1 font-semibold text-emerald-700">
                                  Completed: {completed}
                                </span>
                                <span className="rounded-full border border-amber-200/75 bg-amber-50/70 px-2.5 py-1 font-semibold text-amber-700">
                                  Under Review: {underReview}
                                </span>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ) : null}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </DemoGlassCard>
    </motion.main>
  );
}
