import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import AICoachWidget from "../../components/student/challenge/AICoachWidget";
import CodeEditor, { type EditorLanguage } from "../../components/student/challenge/CodeEditor";
import ResultsPanel from "../../components/student/challenge/ResultsPanel";
import TestCaseList from "../../components/student/challenge/TestCaseList";
import type { ChallengeRunResult, TestCase, TestResult } from "../../components/student/challenge/types";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS } from "../../components/ui/glass";

interface ChallengeCase extends TestCase {
  rawInput: number[];
  rawExpected: number[];
}

interface CodeSignals {
  changedPlaceholder: boolean;
  hasFilter: boolean;
  hasMap: boolean;
  hasEvenCheck: boolean;
  hasDoubleTransform: boolean;
  hasReturn: boolean;
}

const JS_TEMPLATE = `function transformNumbers(nums) {
  // Return only even numbers, each multiplied by 2
  /* your code here */
}`;

const PY_TEMPLATE = `def transform_numbers(nums):
    # Return only even numbers, each multiplied by 2
    # your code here
    return nums`;

const ORIGINAL_CODE_SNIPPET = `function transformNumbers(nums) {
  return nums;
}`;

const TEST_CASES: ChallengeCase[] = [
  {
    id: "tc-1",
    name: "Test Case 1",
    rawInput: [1, 2, 3, 4],
    rawExpected: [4, 8],
    input: "[1,2,3,4]",
    expected: "[4,8]",
  },
  {
    id: "tc-2",
    name: "Test Case 2",
    rawInput: [0, 5, 8],
    rawExpected: [0, 16],
    input: "[0,5,8]",
    expected: "[0,16]",
  },
  {
    id: "tc-3",
    name: "Test Case 3",
    rawInput: [7, 9],
    rawExpected: [],
    input: "[7,9]",
    expected: "[]",
  },
];

const HIDDEN_TEST_TOTAL = 2;

const AI_COACH_QUESTIONS = [
  "What is the time complexity of your current approach?",
  "How would you explain your even-number filter logic to a reviewer?",
  "What edge case would break a solution that doubles before filtering?",
  "How could you make this function easier to test?",
];

const HINTS = [
  "Filter even numbers before mapping to doubled values.",
  "Try chaining operations for readability: filter -> map.",
  "Keep output deterministic and avoid mutating the input array.",
];

function runExpectedTransform(values: number[]) {
  return values.filter((value) => value % 2 === 0).map((value) => value * 2);
}

function arrayEquals(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function collectSignals(code: string): CodeSignals {
  const normalized = code.toLowerCase();
  return {
    changedPlaceholder:
      !normalized.includes("your code here") && !normalized.includes("/* your code here */"),
    hasFilter: normalized.includes("filter"),
    hasMap: normalized.includes("map"),
    hasEvenCheck:
      /%\s*2\s*===\s*0/.test(normalized) ||
      /%\s*2\s*==\s*0/.test(normalized) ||
      normalized.includes("is_even"),
    hasDoubleTransform:
      /\*\s*2/.test(normalized) || /2\s*\*/.test(normalized) || normalized.includes("<< 1"),
    hasReturn: normalized.includes("return"),
  };
}

function getSimulatedOutput(input: number[], signals: CodeSignals, score: number) {
  if (score >= 5) return runExpectedTransform(input);
  if (signals.hasFilter && signals.hasMap && !signals.hasDoubleTransform) {
    return input.filter((value) => value % 2 === 0);
  }
  if (signals.hasMap && signals.hasDoubleTransform && !signals.hasFilter) {
    return input.map((value) => value * 2);
  }
  if (signals.hasEvenCheck) {
    return input.filter((value) => value % 2 === 0);
  }
  if (score >= 2) {
    return input.slice(0, Math.ceil(input.length / 2));
  }
  return input;
}

function simulateRun(code: string, cases: ChallengeCase[]): ChallengeRunResult {
  const signals = collectSignals(code);
  const score = Object.values(signals).filter(Boolean).length + (code.trim().length > 90 ? 1 : 0);

  const details: TestResult[] = cases.map((testCase, index) => {
    const simulated = getSimulatedOutput(testCase.rawInput, signals, score);
    const passed = arrayEquals(simulated, testCase.rawExpected);

    return {
      testCaseId: testCase.id,
      passed,
      got: JSON.stringify(simulated),
      message: passed
        ? "Matched expected output."
        : signals.changedPlaceholder
          ? "Logic is close. Verify filtering and doubling."
          : "Replace the placeholder with implementation logic.",
      runtimeMs: 21 + ((code.length + index * 23) % 43),
    };
  });

  const passedCount = details.filter((result) => result.passed).length;
  const hiddenPassed = score >= 5 ? 2 : score >= 3 ? 1 : 0;
  const totalRuntime = details.reduce((sum, result) => sum + result.runtimeMs, 0) + (code.length % 18);

  return {
    total: details.length,
    passed: passedCount,
    runtimeMs: totalRuntime,
    hiddenPassed,
    hiddenTotal: HIDDEN_TEST_TOTAL,
    details,
  };
}

export default function StudentChallengePage() {
  const [language, setLanguage] = useState<EditorLanguage>("javascript");
  const [code, setCode] = useState(JS_TEMPLATE);
  const [showOriginalCode, setShowOriginalCode] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [expandedHint, setExpandedHint] = useState<number | null>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<ChallengeRunResult | null>(null);
  const [isResultsExpanded, setIsResultsExpanded] = useState(true);
  const runTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (runTimeoutRef.current) {
        window.clearTimeout(runTimeoutRef.current);
      }
    };
  }, []);

  const visibleTestCases = useMemo<TestCase[]>(
    () =>
      TEST_CASES.map((item) => ({
        id: item.id,
        name: item.name,
        input: item.input,
        expected: item.expected,
      })),
    [],
  );
  const safeVisibleTestCases = useMemo<TestCase[]>(
    () =>
      visibleTestCases.length
        ? visibleTestCases
        : [
            {
              id: "loading-case",
              name: "Loading Test Case",
              input: "[]",
              expected: "[]",
            },
          ],
    [visibleTestCases],
  );

  const onLanguageChange = (nextLanguage: EditorLanguage) => {
    setLanguage(nextLanguage);
    setCode(nextLanguage === "javascript" ? JS_TEMPLATE : PY_TEMPLATE);
    setRunResult(null);
  };

  const onRunTests = () => {
    if (isRunning) return;

    if (runTimeoutRef.current) {
      window.clearTimeout(runTimeoutRef.current);
    }

    setIsRunning(true);
    setIsResultsExpanded(true);
    const codeSnapshot = code;
    const delayMs = 600 + (codeSnapshot.length % 601);

    runTimeoutRef.current = window.setTimeout(() => {
      setRunResult(simulateRun(codeSnapshot, TEST_CASES));
      setIsRunning(false);
      runTimeoutRef.current = null;
    }, delayMs);
  };

  return (
    <motion.main
      className="mx-auto w-full max-w-[1360px] px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <DemoGlassCard className={`h-fit min-h-[560px] p-4 sm:p-5 ${GLASS_INTERACTIVE_CLASS}`}>
          <h2 className="text-xl font-semibold text-slate-900">Challenge</h2>
          <p className="mt-2 text-sm text-slate-600">
            Build `transformNumbers(nums)` that returns only even numbers, each multiplied by `2`.
          </p>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Requirements
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Keep function deterministic and pure.</li>
              <li>Filter even values only.</li>
              <li>Double each selected value.</li>
              <li>Return an array in original order.</li>
              <li>Do not mutate the input array.</li>
            </ul>
          </div>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setShowOriginalCode((current) => !current)}
              className={`rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-white/80 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Show Original Code (challenge.js)
            </button>
            <button
              type="button"
              onClick={() => setShowHints((current) => !current)}
              className={`rounded-xl border border-white/70 bg-white/55 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-white/80 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Show Hints
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showOriginalCode ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-3 overflow-hidden rounded-xl border border-white/60 bg-slate-900/90"
              >
                <p className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  challenge.js
                </p>
                <pre className="overflow-x-auto px-3 py-2 font-mono text-[12px] text-slate-100">
                  {ORIGINAL_CODE_SNIPPET}
                </pre>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {showHints ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-3 space-y-2"
              >
                {HINTS.map((hint, index) => {
                  const isOpen = expandedHint === index;

                  return (
                    <div key={hint} className="rounded-xl border border-white/65 bg-white/45">
                      <button
                        type="button"
                        onClick={() => setExpandedHint((current) => (current === index ? null : index))}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700"
                      >
                        <span>Hint {index + 1}</span>
                        <span className="text-[10px] text-slate-500">{isOpen ? "Hide" : "Show"}</span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen ? (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/45 px-3 py-2 text-xs text-slate-600"
                          >
                            {hint}
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Test Cases</p>
            <div className="mt-2">
              <TestCaseList testCases={safeVisibleTestCases} hiddenCount={HIDDEN_TEST_TOTAL} />
            </div>
          </div>
        </DemoGlassCard>

        <div className="flex min-w-0 flex-col gap-4">
          <DemoGlassCard className={`min-h-[560px] p-4 sm:p-5 ${GLASS_INTERACTIVE_CLASS}`}>
            <div className="mb-3">
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Live Coding Check</h2>
              <p className="mt-1 text-sm text-slate-600">
                Implement the function, run tests, and inspect output just like a coding interview round.
              </p>
            </div>
            <CodeEditor
              code={code}
              language={language}
              onCodeChange={setCode}
              onLanguageChange={onLanguageChange}
              onRunTests={onRunTests}
              isRunning={isRunning}
            />
          </DemoGlassCard>

          <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
            <DemoGlassCard className={`p-0 ${GLASS_INTERACTIVE_CLASS}`}>
              <ResultsPanel
                isRunning={isRunning}
                runResult={runResult}
                isExpanded={isResultsExpanded}
                onToggleExpanded={() => setIsResultsExpanded((current) => !current)}
                testCases={safeVisibleTestCases}
              />
            </DemoGlassCard>

            <DemoGlassCard className={`p-0 ${GLASS_INTERACTIVE_CLASS}`}>
              <AICoachWidget questions={AI_COACH_QUESTIONS} />
            </DemoGlassCard>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
