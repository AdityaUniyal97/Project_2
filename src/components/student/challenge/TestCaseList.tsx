import { motion } from "framer-motion";
import type { TestCase } from "./types";

interface TestCaseListProps {
  testCases: TestCase[];
  hiddenCount: number;
}

export default function TestCaseList({ testCases, hiddenCount }: TestCaseListProps) {
  const hasCases = testCases.length > 0;

  return (
    <div className="space-y-2">
      {hasCases ? (
        testCases.map((testCase, index) => (
          <motion.div
            key={testCase.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-white/65 bg-white/45 px-3 py-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ transitionDelay: `${index * 40}ms` }}
          >
            <p className="text-xs font-semibold text-slate-700">{testCase.name}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-600">Input: {testCase.input}</p>
            <p className="font-mono text-[11px] text-slate-600">Expected: {testCase.expected}</p>
          </motion.div>
        ))
      ) : (
        <div className="rounded-xl border border-white/65 bg-white/45 px-3 py-3 text-xs text-slate-600">
          Loading visible test cases...
        </div>
      )}
      <p className="rounded-xl border border-blue-200/70 bg-blue-50/60 px-3 py-1.5 text-[11px] font-semibold text-blue-700">
        + hidden tests ({hiddenCount})
      </p>
    </div>
  );
}
