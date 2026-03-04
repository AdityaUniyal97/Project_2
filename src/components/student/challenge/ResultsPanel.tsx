import { AnimatePresence, motion } from "framer-motion";
import type { ChallengeRunResult, TestCase } from "./types";

interface ResultsPanelProps {
  isRunning: boolean;
  runResult: ChallengeRunResult | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  testCases: TestCase[];
}

function getStatusColorClass(allPassed: boolean) {
  if (allPassed) {
    return "border-emerald-200/80 bg-emerald-50/70 text-emerald-700";
  }
  return "border-rose-200/80 bg-rose-50/70 text-rose-700";
}

export default function ResultsPanel({
  isRunning,
  runResult,
  isExpanded,
  onToggleExpanded,
  testCases,
}: ResultsPanelProps) {
  const testCaseMap = new Map(testCases.map((testCase) => [testCase.id, testCase]));
  const allPassed = runResult ? runResult.passed === runResult.total : false;

  return (
    <section className="rounded-2xl border border-white/60 bg-white/35">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Output
          </p>
          <h3 className="text-sm font-semibold text-slate-800">Results Panel</h3>
        </div>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="rounded-lg border border-white/65 bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-white/80"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-white/50 px-4 py-4">
              {isRunning ? (
                <div className="rounded-xl border border-blue-200/75 bg-blue-50/65 px-3 py-3">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="10" stroke="rgba(37,99,235,0.28)" strokeWidth="3" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Running...
                  </p>
                </div>
              ) : null}

              {!isRunning && runResult ? (
                <>
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 ${getStatusColorClass(allPassed)}`}
                  >
                    <p className="text-sm font-semibold">
                      {allPassed ? "\u2705 All Passed" : "\u274C Some Failed"}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span>{runResult.passed}/{runResult.total} passed</span>
                      <span className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5">
                        {runResult.runtimeMs}ms
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {runResult.details.map((result) => {
                      const testCase = testCaseMap.get(result.testCaseId);
                      if (!testCase) return null;

                      return (
                        <motion.div
                          key={result.testCaseId}
                          whileHover={{ y: -2 }}
                          className={`rounded-xl border px-3 py-3 transition ${
                            result.passed
                              ? "border-emerald-200/80 bg-emerald-50/55"
                              : "border-rose-200/80 bg-rose-50/55"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-800">{testCase.name}</p>
                            <span className="text-[11px] font-semibold text-slate-600">
                              {result.runtimeMs}ms
                            </span>
                          </div>
                          <p className="mt-1 font-mono text-[11px] text-slate-700">
                            input: {testCase.input}
                          </p>
                          <p className="font-mono text-[11px] text-slate-700">
                            expected: {testCase.expected}
                          </p>
                          <p className="font-mono text-[11px] text-slate-700">got: {result.got}</p>
                          <p className="mt-1 text-[11px] font-medium text-slate-600">{result.message}</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="rounded-xl border border-white/65 bg-white/55 px-3 py-2 text-xs font-semibold text-slate-600">
                    Hidden tests: {runResult.hiddenPassed}/{runResult.hiddenTotal} passed
                  </p>
                </>
              ) : null}

              {!isRunning && !runResult ? (
                <p className="rounded-xl border border-white/65 bg-white/45 px-3 py-3 text-sm text-slate-600">
                  Run tests to see test-by-test output and hidden test status.
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
