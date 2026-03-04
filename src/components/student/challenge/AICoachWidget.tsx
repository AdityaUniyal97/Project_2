import { useMemo, useState } from "react";
import { BUTTON_INTERACTIVE_CLASS, INPUT_GLOW_CLASS } from "../../ui/glass";

interface AICoachWidgetProps {
  questions: string[];
}

export default function AICoachWidget({ questions }: AICoachWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const hasQuestions = questions.length > 0;

  const currentQuestion = useMemo(
    () =>
      questions[currentIndex] ??
      "No prompts loaded yet. Describe your approach for solving the challenge.",
    [currentIndex, questions],
  );
  const currentAnswer = answers[currentIndex] ?? "";

  const onNextQuestion = () => {
    if (!hasQuestions) return;
    setCurrentIndex((index) => (index + 1) % questions.length);
  };

  return (
    <section className="rounded-2xl border border-white/60 bg-white/35 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">AI Coach</p>
      <h3 className="mt-1 text-sm font-semibold text-slate-800">Live Prompt</h3>

      <p className="mt-3 rounded-xl border border-blue-200/70 bg-blue-50/60 px-3 py-2 text-sm text-blue-800">
        {currentQuestion}
      </p>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-slate-600">Your response</span>
        <textarea
          value={currentAnswer}
          onChange={(event) =>
            setAnswers((current) => ({
              ...current,
              [currentIndex]: event.target.value,
            }))
          }
          placeholder="Type a short answer..."
          className={`mt-1 h-24 w-full resize-none rounded-xl border border-white/65 bg-white/60 px-3 py-2 text-sm text-slate-700 outline-none ${INPUT_GLOW_CLASS}`}
        />
      </label>

      <button
        type="button"
        onClick={onNextQuestion}
        disabled={!hasQuestions}
        className={`mt-3 rounded-xl border border-white/70 bg-white/65 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/85 ${BUTTON_INTERACTIVE_CLASS}`}
      >
        Next Question
      </button>
    </section>
  );
}
