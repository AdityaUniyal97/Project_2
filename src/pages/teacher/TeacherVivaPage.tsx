import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import TeacherRiskBadge from "../../components/teacher/TeacherRiskBadge";
import { useTeacherData } from "../../components/teacher/TeacherDataContext";
import { sortBySubmittedDesc, toReadableDate } from "../../components/teacher/mockData";
import type { Submission, VivaOutcome } from "../../components/teacher/types";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS, INPUT_GLOW_CLASS } from "../../components/ui/glass";

function groupByTopic(submission: Submission) {
  const grouped = new Map<string, Submission["vivaQuestions"]>();
  submission.vivaQuestions.forEach((question) => {
    const current = grouped.get(question.topicTag) ?? [];
    grouped.set(question.topicTag, [...current, question]);
  });
  return Array.from(grouped.entries());
}

const OUTCOME_OPTIONS: VivaOutcome[] = ["Pass", "Needs Review", "Fail"];

export default function TeacherVivaPage() {
  const {
    submissions,
    vivaState,
    updateVivaStatus,
    setVivaOutcome,
    toggleQuestionAsked,
    setQuestionNotes,
    updateSubmissionStatus,
  } = useTeacherData();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const queue = useMemo(() => {
    const sorted = sortBySubmittedDesc(submissions);
    return sorted.filter((submission) => {
      const vivaEntry = vivaState[submission.id];
      const needsVivaByRisk = submission.riskLevel === "HIGH" || submission.riskLevel === "CRITICAL";
      return needsVivaByRisk || vivaEntry?.status === "Pending" || vivaEntry?.status === "Completed";
    });
  }, [submissions, vivaState]);

  const selectedSubmission =
    queue.find((submission) => submission.id === selectedId) ?? queue[0] ?? null;

  const selectedVivaState = selectedSubmission ? vivaState[selectedSubmission.id] : null;
  const groupedTopics = useMemo(
    () => (selectedSubmission ? groupByTopic(selectedSubmission) : []),
    [selectedSubmission],
  );

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <DemoGlassCard className={`h-fit p-5 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Viva Queue</h2>
            <span className="rounded-full border border-white/65 bg-white/55 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {queue.length}
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {queue.map((submission) => {
              const isActive = selectedSubmission?.id === submission.id;
              const queueState = vivaState[submission.id]?.status ?? "Pending";

              return (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => setSelectedId(submission.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    isActive
                      ? "border-blue-200/80 bg-blue-50/75"
                      : "border-white/60 bg-white/45 hover:bg-white/70"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{submission.studentName}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{submission.projectTitle}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <TeacherRiskBadge level={submission.riskLevel} />
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        queueState === "Completed"
                          ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-700"
                          : "border-amber-200/80 bg-amber-50/80 text-amber-700"
                      }`}
                    >
                      {queueState}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          {selectedSubmission ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedSubmission.projectTitle}</h3>
                  <p className="text-xs text-slate-600">
                    {selectedSubmission.studentName} ({selectedSubmission.rollNumber}) - {toReadableDate(selectedSubmission.submittedAt)}
                  </p>
                </div>
                <TeacherRiskBadge level={selectedSubmission.riskLevel} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateVivaStatus(selectedSubmission.id, "Pending")}
                  className={`rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-700 ${BUTTON_INTERACTIVE_CLASS}`}
                >
                  Set Pending
                </button>
                <button
                  type="button"
                  onClick={() => updateVivaStatus(selectedSubmission.id, "Completed")}
                  className={`rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 ${BUTTON_INTERACTIVE_CLASS}`}
                >
                  Set Completed
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {groupedTopics.map(([topic, questions]) => {
                  const expanded = expandedTopic === topic;

                  return (
                    <div key={topic} className="overflow-hidden rounded-xl border border-white/60 bg-white/45">
                      <button
                        type="button"
                        onClick={() => setExpandedTopic((current) => (current === topic ? null : topic))}
                        className="flex w-full items-center justify-between px-3 py-2 text-left"
                      >
                        <span className="text-sm font-semibold text-slate-800">{topic}</span>
                        <span className="text-xs text-slate-500">{expanded ? "Hide" : "Open"}</span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expanded ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/50 px-3 py-3"
                          >
                            <div className="space-y-3">
                              {questions.map((question) => {
                                const questionState = selectedVivaState?.questions[question.id];
                                return (
                                  <div
                                    key={question.id}
                                    className="rounded-lg border border-white/65 bg-white/65 px-3 py-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-medium text-slate-800">{question.question}</p>
                                      <span className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                        {question.difficulty}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-600">{question.expectedTalkingPoints}</p>

                                    <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(questionState?.asked)}
                                        onChange={() => toggleQuestionAsked(selectedSubmission.id, question.id)}
                                      />
                                      Asked
                                    </label>

                                    <textarea
                                      value={questionState?.notes ?? ""}
                                      onChange={(event) =>
                                        setQuestionNotes(selectedSubmission.id, question.id, event.target.value)
                                      }
                                      placeholder="Teacher notes for this question"
                                      className={`mt-2 h-16 w-full resize-none rounded-lg border border-white/65 bg-white/75 px-2.5 py-2 text-xs text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-white/60 bg-white/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Final Viva Outcome</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {OUTCOME_OPTIONS.map((option) => {
                    const isActive = selectedVivaState?.outcome === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setVivaOutcome(selectedSubmission.id, option);
                          if (option === "Pass") {
                            updateVivaStatus(selectedSubmission.id, "Completed");
                            updateSubmissionStatus(selectedSubmission.id, "Completed");
                          }
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "border-blue-300/85 bg-blue-100/80 text-blue-800"
                            : "border-white/70 bg-white/70 text-slate-700 hover:bg-white/90"
                        } ${BUTTON_INTERACTIVE_CLASS}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/60 bg-white/45 px-4 py-6 text-center text-sm text-slate-600">
              No viva items in queue.
            </div>
          )}
        </DemoGlassCard>
      </div>
    </motion.main>
  );
}
