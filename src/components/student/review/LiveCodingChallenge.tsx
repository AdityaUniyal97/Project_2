import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { executeChallenge, type ChallengeExecutionResult } from "../../../lib/api";
import { BUTTON_INTERACTIVE_CLASS } from "../../ui/glass";

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

interface LiveCodingChallengeProps {
  challenge: ChallengeData;
}

export default function LiveCodingChallenge({ challenge }: LiveCodingChallengeProps) {
  const [code, setCode] = useState(challenge.starter_code ?? "");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ChallengeExecutionResult | null>(null);
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);

  const language = challenge.language ?? "python";
  const testCases = (challenge.test_cases ?? []).map((tc) => ({
    input: typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input),
    expected_output: typeof tc.expected_output === "string" ? tc.expected_output : JSON.stringify(tc.expected_output),
  }));

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
    <div className="space-y-4">
      {/* Challenge Header */}
      <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-purple-50/40 to-white/60 p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">💻</span>
            <p className="text-sm font-semibold text-violet-800">Live Coding Challenge</p>
          </div>
          {challenge.time_limit_minutes && (
            <span className="rounded-full border border-violet-200/80 bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              ⏱ {challenge.time_limit_minutes} min
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {challenge.challenge_description ?? "Complete the coding challenge below."}
        </p>

        {challenge.requirements && challenge.requirements.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">Requirements</p>
            <ul className="mt-1.5 space-y-1">
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
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowHints((v) => !v)}
              className="text-xs font-semibold text-violet-600 hover:text-violet-800"
            >
              {showHints ? "Hide Hints ▲" : `Show Hints (${challenge.hints.length}) ▼`}
            </button>
            <AnimatePresence>
              {showHints && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-1.5 space-y-1 overflow-hidden"
                >
                  {challenge.hints.map((hint, i) => (
                    <li key={i} className="text-xs text-slate-600">💡 {hint}</li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Test Cases Preview */}
      {testCases.length > 0 && (
        <div className="rounded-2xl border border-white/60 bg-white/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Test Cases ({testCases.length})
          </p>
          <div className="mt-2 space-y-2">
            {testCases.map((tc, i) => (
              <div key={i} className="rounded-lg border border-white/65 bg-slate-50/60 px-3 py-2">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-slate-500">#{i + 1}</span>
                  <span className="text-slate-600">
                    Input: <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-slate-800">{tc.input}</code>
                  </span>
                  <span className="text-slate-600">
                    Expected: <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-emerald-700">{tc.expected_output}</code>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="rounded-2xl border border-white/60 bg-white/50 p-4">
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
              className={`rounded-lg border border-emerald-200/80 bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.25)] transition hover:shadow-[0_12px_24px_rgba(16,185,129,0.3)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              {isRunning ? "Running..." : "▶ Run Code"}
            </button>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="mt-3 h-56 w-full resize-y rounded-xl border border-slate-200/80 bg-slate-900 px-4 py-3 font-mono text-sm leading-relaxed text-emerald-300 outline-none focus:border-violet-300/80 focus:ring-1 focus:ring-violet-300/40"
          placeholder={`Write your ${language} solution here...`}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4">
          <p className="text-sm font-semibold text-rose-700">Error</p>
          <p className="mt-1 text-sm text-rose-600">{error}</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Summary */}
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

            {/* Per-test results */}
            {result.test_results && result.test_results.length > 0 && (
              <div className="rounded-2xl border border-white/60 bg-white/50 p-4">
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
                          <span>
                            Got:{" "}
                            <code className={`font-mono ${tr.passed ? "text-emerald-700" : "text-rose-600"}`}>
                              {tr.actual}
                            </code>
                          </span>
                        )}
                      </div>
                      {tr.error && (
                        <p className="mt-1 text-xs text-rose-600">{tr.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
