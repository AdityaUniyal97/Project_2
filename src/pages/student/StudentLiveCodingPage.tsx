import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import { executeChallenge, type ChallengeExecutionResult } from "../../lib/api";
import { BUTTON_INTERACTIVE_CLASS } from "../../components/ui/glass";

const SESSION_KEY = "pg_live_challenge";

interface ChallengeData {
  challenge_description?: string;
  requirements?: string[];
  test_cases?: Array<{ input: unknown; expected_output: unknown; description?: string }>;
  starter_code?: string;
  hints?: string[];
  language?: string;
  time_limit_minutes?: number;
  function_name?: string;
  filename?: string;
}

function loadChallengeFromSession(): ChallengeData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ChallengeData) : null;
  } catch {
    return null;
  }
}

export default function StudentLiveCodingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Try route state first, then sessionStorage as fallback for page refresh
  const challenge = useMemo<ChallengeData | null>(() => {
    const fromState = (location.state as { challenge?: ChallengeData } | null)?.challenge;
    if (fromState) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(fromState));
      return fromState;
    }
    return loadChallengeFromSession();
  }, [location.state]);

  // Timer — stops when finished
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  // If no challenge data, redirect back
  if (!challenge) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-500">No challenge data found.</p>
        <button
          type="button"
          onClick={() => navigate("/student/ai-review")}
          className={`rounded-xl border border-violet-300/80 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white ${BUTTON_INTERACTIVE_CLASS}`}
        >
          ← Back to AI Review
        </button>
      </div>
    );
  }

  const language = challenge.language ?? "python";
  const timeLimit = challenge.time_limit_minutes ?? 10;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isOverTime = elapsed >= timeLimit * 60;

  return (
    <div className="w-full space-y-6">
      {/* Top header */}
      <DemoGlassCard className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_4px_14px_rgba(139,92,246,0.3)]">
              <span className="text-lg text-white">💻</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Live Coding Challenge</h1>
              <p className="text-xs text-slate-500">Phase 2 — Prove your authorship</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className={`rounded-full border px-3 py-1.5 font-mono text-sm font-bold tabular-nums ${
              isOverTime
                ? "border-rose-300/80 bg-rose-50/80 text-rose-700"
                : "border-violet-200/80 bg-white/70 text-violet-700"
            }`}>
              ⏱ {timeStr} / {timeLimit}:00
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/ai-review")}
              className={`rounded-lg border border-white/65 bg-white/65 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white/85 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              ← Back to Review
            </button>
          </div>
        </div>
      </DemoGlassCard>

      {/* Project Context bar */}
      {(challenge.filename || challenge.function_name) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-200/60 bg-gradient-to-r from-violet-50/80 via-purple-50/40 to-indigo-50/60 px-4 py-2.5">
          <span className="rounded-full border border-violet-200/80 bg-violet-100/70 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
            📂 From Your Project
          </span>
          {challenge.filename && (
            <span className="rounded-full border border-slate-200/80 bg-white/70 px-2 py-0.5 font-mono text-[11px] text-slate-700">
              {challenge.filename}
            </span>
          )}
          {challenge.function_name && (
            <span className="rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2 py-0.5 font-mono text-[11px] text-indigo-700">
              {challenge.function_name}()
            </span>
          )}
        </div>
      )}

      {/* Two-column layout: Left = Problem, Right = Editor */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Problem Description */}
        <div className="space-y-6">
          <ProblemPanel challenge={challenge} />
          <TestCasesPanel challenge={challenge} language={language} />
        </div>

        {/* Right: Code Editor + Results */}
        <div className="space-y-6">
          <EditorPanel challenge={challenge} language={language} onFinish={() => setFinished(true)} finished={finished} />
        </div>
      </div>
    </div>
  );
}

/* ─────── Problem Description ─────── */
function ProblemPanel({ challenge }: { challenge: ChallengeData }) {
  const [showHints, setShowHints] = useState(false);

  return (
    <DemoGlassCard className="p-0">
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-600">Problem</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-800">
          {challenge.challenge_description ?? "Complete the coding challenge below."}
        </p>

        {challenge.requirements && challenge.requirements.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">Requirements</p>
            <ul className="mt-2 space-y-1.5">
              {challenge.requirements.map((req, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="flex-shrink-0 font-semibold text-violet-500">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {challenge.hints && challenge.hints.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowHints((v) => !v)}
              className="text-xs font-semibold text-violet-600 hover:text-violet-800"
            >
              {showHints ? "Hide Hints ▲" : `💡 Show Hints (${challenge.hints.length}) ▼`}
            </button>
            <AnimatePresence>
              {showHints && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {challenge.hints.map((hint, i) => (
                    <li key={i} className="rounded-lg bg-amber-50/60 px-3 py-1.5 text-xs text-slate-700">
                      💡 {hint}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DemoGlassCard>
  );
}

/* ─────── Test Cases ─────── */
function TestCasesPanel({ challenge, language }: { challenge: ChallengeData; language: string }) {
  const testCases = (challenge.test_cases ?? []).map((tc) => ({
    input: typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input),
    expected_output: typeof tc.expected_output === "string" ? tc.expected_output : JSON.stringify(tc.expected_output),
    description: tc.description,
  }));

  if (testCases.length === 0) return null;

  return (
    <DemoGlassCard className="p-0">
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Test Cases ({testCases.length})
        </p>
        <div className="mt-3 space-y-2.5">
          {testCases.map((tc, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <span>#{i + 1}</span>
                {tc.description && <span className="text-slate-400">— {tc.description}</span>}
              </div>
              <div className="mt-1.5 flex flex-col gap-1 text-xs">
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-500">Input:</span>
                  <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-slate-800">{tc.input}</code>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-500">Expected:</span>
                  <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-emerald-700">{tc.expected_output}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DemoGlassCard>
  );
}

/* ─────── Code Editor + Run + Results ─────── */
function EditorPanel({ challenge, language, onFinish, finished }: { challenge: ChallengeData; language: string; onFinish: () => void; finished: boolean }) {
  const [code, setCode] = useState(challenge.starter_code ?? "");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ChallengeExecutionResult | null>(null);
  const [error, setError] = useState("");

  const testCases = useMemo(
    () =>
      (challenge.test_cases ?? []).map((tc) => ({
        input: typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input),
        expected_output: typeof tc.expected_output === "string" ? tc.expected_output : JSON.stringify(tc.expected_output),
      })),
    [challenge.test_cases],
  );

  const handleRun = useCallback(async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setError("");
    setResult(null);

    try {
      const res = await executeChallenge({
        student_code: code,
        language,
        test_cases: testCases,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed.");
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, language, testCases]);

  return (
    <>
      {/* Editor */}
      <DemoGlassCard className="p-0">
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Your Solution ({language})
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCode(challenge.starter_code ?? "")}
                className={`rounded-lg border border-white/65 bg-white/65 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-white/85 ${BUTTON_INTERACTIVE_CLASS}`}
              >
                Reset
              </button>
              <button
                type="button"
                disabled={isRunning || !code.trim()}
                onClick={() => void handleRun()}
                className={`rounded-lg border border-emerald-200/80 bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.25)] transition hover:shadow-[0_12px_24px_rgba(16,185,129,0.3)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
              >
                {isRunning ? "Running..." : "▶ Run Code"}
              </button>
            </div>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="mt-3 h-72 w-full resize-y rounded-xl border border-slate-200/80 bg-slate-900 px-4 py-3 font-mono text-sm leading-relaxed text-emerald-300 outline-none focus:border-violet-300/80 focus:ring-1 focus:ring-violet-300/40"
            placeholder={`Write your ${language} solution here...`}
          />
        </div>
      </DemoGlassCard>

      {/* Error */}
      {error && (
        <DemoGlassCard className="border-rose-200/80 bg-rose-50/60 p-4">
          <p className="text-sm font-semibold text-rose-700">Error</p>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
        </DemoGlassCard>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <DemoGlassCard className="p-0">
              <div className={`rounded-2xl border p-5 ${
                result.success
                  ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-green-50/40"
                  : "border-rose-200/80 bg-gradient-to-br from-rose-50/80 to-orange-50/40"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{result.success ? "✅" : "❌"}</span>
                    <p className={`text-sm font-bold ${result.success ? "text-emerald-700" : "text-rose-700"}`}>
                      {result.verdict === "ALL_PASSED"
                        ? "All Tests Passed!"
                        : result.verdict === "PARTIAL"
                          ? "Partial Pass"
                          : result.verdict === "ALL_FAILED"
                            ? "All Tests Failed"
                            : result.verdict}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    result.success
                      ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-700"
                      : "border-rose-200/80 bg-rose-50/80 text-rose-700"
                  }`}>
                    {result.passed_tests}/{result.total_tests} passed
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/60">
                  <motion.div
                    className={`h-full rounded-full ${result.success ? "bg-gradient-to-r from-emerald-400 to-green-400" : "bg-gradient-to-r from-rose-400 to-orange-400"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.total_tests > 0 ? (result.passed_tests / result.total_tests) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>

                {result.errors && (
                  <p className="mt-2 text-xs text-rose-600">{result.errors}</p>
                )}
              </div>
            </DemoGlassCard>

            {/* Per-test results */}
            {result.test_results && result.test_results.length > 0 && (
              <DemoGlassCard className="p-0">
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Test Results
                  </p>
                  <div className="mt-2 space-y-2">
                    {result.test_results.map((tr, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border px-3 py-2 ${
                          tr.passed
                            ? "border-emerald-200/80 bg-emerald-50/50"
                            : "border-rose-200/80 bg-rose-50/50"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">
                            {tr.passed ? "✓" : "✗"} Test #{(tr.test_case ?? i) + 1}
                          </span>
                          <span className={`font-bold ${tr.passed ? "text-emerald-600" : "text-rose-600"}`}>
                            {tr.passed ? "PASS" : "FAIL"}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                          {tr.input && <span>Input: <code className="font-mono">{tr.input}</code></span>}
                          {tr.expected && <span>Expected: <code className="font-mono text-emerald-700">{tr.expected}</code></span>}
                          {tr.actual !== undefined && (
                            <span>Got: <code className={`font-mono ${tr.passed ? "text-emerald-600" : "text-rose-600"}`}>{tr.actual}</code></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DemoGlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Final Answer */}
      {result && !finished && (
        <DemoGlassCard className="p-0">
          <div className="flex items-center justify-between gap-3 p-4">
            <p className="text-xs text-slate-600">
              {result.success
                ? "All tests passed! Submit your final answer."
                : "You can keep trying or submit your current solution."}
            </p>
            <button
              type="button"
              onClick={() => {
                onFinish();
                sessionStorage.removeItem(SESSION_KEY);
              }}
              className={`rounded-xl border border-violet-300/80 bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,0.35)] transition-all hover:shadow-[0_12px_32px_rgba(139,92,246,0.45)] hover:scale-[1.02] active:scale-[0.98] ${BUTTON_INTERACTIVE_CLASS}`}
            >
              ✓ Submit Final Answer
            </button>
          </div>
        </DemoGlassCard>
      )}

      {/* Finished state */}
      {finished && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DemoGlassCard className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-green-50/40 p-5 text-center">
            <p className="text-lg font-bold text-emerald-700">✅ Challenge Submitted!</p>
            <p className="mt-1 text-sm text-slate-600">Your solution has been recorded. You can return to the review page.</p>
          </DemoGlassCard>
        </motion.div>
      )}
    </>
  );
}
