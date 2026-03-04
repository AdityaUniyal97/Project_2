import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import {
  STUDENT_REVIEW_DRAFT_STORAGE_KEY,
  STUDENT_SUBMISSIONS_STORAGE_KEY,
} from "../../components/student/constants";
import Accordion, { type AccordionItem } from "../../components/student/review/Accordion";
import MetricCard from "../../components/student/review/MetricCard";
import PipelineStep from "../../components/student/review/PipelineStep";
import RiskBadge from "../../components/student/review/RiskBadge";
import type {
  AnalysisOutput,
  PipelineStepDefinition,
  PipelineStepStatus,
  RiskLevel,
  SubmissionDetails,
  VivaQuestion,
  VivaTopic,
} from "../../components/student/review/types";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS } from "../../components/ui/glass";

const PIPELINE_STEPS: PipelineStepDefinition[] = [
  { id: "fetch-metadata", label: "Fetching repository metadata" },
  { id: "scan-structure", label: "Scanning file structure" },
  { id: "compare-signatures", label: "Comparing similarity signatures" },
  { id: "review-commits", label: "Reviewing commit patterns" },
  { id: "generate-viva", label: "Generating viva questions" },
  { id: "finalize", label: "Finalizing verdict" },
];

const TOPIC_HINTS: Record<VivaTopic, string> = {
  Git: "Focus on commit ownership, branching strategy, and rollback confidence.",
  "Core Logic": "Probe implementation details behind central modules and execution flow.",
  Complexity: "Ask for runtime and scaling tradeoffs with concrete constraints.",
  Architecture: "Validate service boundaries, dependency management, and extension strategy.",
  Debugging: "Check reproducibility of failure cases and root-cause analysis approach.",
};

const VIVA_QUESTION_POOL: Array<Omit<VivaQuestion, "id">> = [
  {
    topic: "Git",
    question: "Walk through the commit where you introduced your core algorithm and explain each diff chunk.",
  },
  {
    topic: "Git",
    question: "Why did you choose your branching strategy, and how did you handle merge conflicts?",
  },
  {
    topic: "Core Logic",
    question: "Which module is the single source of truth for business rules, and why?",
  },
  {
    topic: "Core Logic",
    question: "How does your request flow enforce validation before data persistence?",
  },
  {
    topic: "Complexity",
    question: "What is the worst-case complexity of your most expensive operation and where does it appear?",
  },
  {
    topic: "Complexity",
    question: "How would your current design behave with 20x more records and concurrent users?",
  },
  {
    topic: "Architecture",
    question: "What boundaries did you define between UI, domain logic, and infrastructure code?",
  },
  {
    topic: "Architecture",
    question: "If one dependency fails at runtime, what fallback behavior does your app provide?",
  },
  {
    topic: "Debugging",
    question: "Describe a production-like bug you encountered and how you isolated the root cause.",
  },
  {
    topic: "Debugging",
    question: "What logs or tracing signals do you rely on for non-deterministic failures?",
  },
  {
    topic: "Core Logic",
    question: "How do you prevent duplicate writes or race conditions in your critical path?",
  },
  {
    topic: "Architecture",
    question: "Which part of your architecture would you refactor first and what is the migration path?",
  },
  {
    topic: "Complexity",
    question: "Which query or loop has the highest cost today, and how would you optimize it?",
  },
  {
    topic: "Git",
    question: "Show one revert-worthy commit and explain why it was risky when reviewed later.",
  },
  {
    topic: "Debugging",
    question: "How do you verify that a bug fix did not introduce regressions in adjacent modules?",
  },
];

const FALLBACK_SUBMISSION: SubmissionDetails = {
  studentName: "",
  rollNumber: "21CSE109",
  branch: "CSE",
  projectTitle: "AI Attendance System",
  githubRepo: "https://github.com/student/ai-attendance-system",
  liveLink: "https://ai-attendance-demo.vercel.app",
  description:
    "Face-recognition-assisted attendance workflow with dashboard analytics for faculty and weekly trend reporting.",
};

interface StoredSubmissionItem {
  projectTitle?: string;
  githubLink?: string;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function nextSeed(seed: number) {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function nextInRange(seed: number, min: number, max: number) {
  const stepped = nextSeed(seed);
  const span = max - min + 1;
  return {
    seed: stepped,
    value: min + (stepped % span),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 79) return "CRITICAL";
  if (score >= 62) return "HIGH";
  if (score >= 43) return "MEDIUM";
  return "LOW";
}

function readStoredSubmissionDetails(): SubmissionDetails {
  const details: SubmissionDetails = { ...FALLBACK_SUBMISSION };

  try {
    const rawDraft = localStorage.getItem(STUDENT_REVIEW_DRAFT_STORAGE_KEY);

    if (rawDraft) {
      const parsed = JSON.parse(rawDraft) as Record<string, unknown>;

      if (typeof parsed.studentName === "string") {
        details.studentName = parsed.studentName.trim();
      }

      if (typeof parsed.rollNumber === "string" && parsed.rollNumber.trim()) {
        details.rollNumber = parsed.rollNumber.trim();
      }

      if (typeof parsed.branch === "string" && parsed.branch.trim()) {
        details.branch = parsed.branch.trim();
      }

      if (typeof parsed.projectTitle === "string" && parsed.projectTitle.trim()) {
        details.projectTitle = parsed.projectTitle.trim();
      }

      const repoCandidate =
        typeof parsed.githubRepo === "string"
          ? parsed.githubRepo
          : typeof parsed.githubLink === "string"
            ? parsed.githubLink
            : "";

      if (repoCandidate.trim()) {
        details.githubRepo = repoCandidate.trim();
      }

      const liveCandidate =
        typeof parsed.liveLink === "string"
          ? parsed.liveLink
          : typeof parsed.liveDemoUrl === "string"
            ? parsed.liveDemoUrl
            : "";

      if (liveCandidate.trim()) {
        details.liveLink = liveCandidate.trim();
      }

      if (typeof parsed.description === "string") {
        details.description = parsed.description.trim();
      }
    }
  } catch {
    localStorage.removeItem(STUDENT_REVIEW_DRAFT_STORAGE_KEY);
  }

  try {
    if (!details.projectTitle.trim()) {
      const rawSubmissions = localStorage.getItem(STUDENT_SUBMISSIONS_STORAGE_KEY);
      if (rawSubmissions) {
        const parsedSubmissions = JSON.parse(rawSubmissions) as StoredSubmissionItem[];
        const latestSubmission = Array.isArray(parsedSubmissions) ? parsedSubmissions[0] : null;

        if (latestSubmission?.projectTitle?.trim()) {
          details.projectTitle = latestSubmission.projectTitle.trim();
        }

        if (latestSubmission?.githubLink?.trim() && !details.githubRepo.trim()) {
          details.githubRepo = latestSubmission.githubLink.trim();
        }
      }
    }
  } catch {
    localStorage.removeItem(STUDENT_SUBMISSIONS_STORAGE_KEY);
  }

  return details;
}

function pickQuestions(seed: number, count: number) {
  let currentSeed = seed;
  const remainingPool = [...VIVA_QUESTION_POOL];
  const selected: VivaQuestion[] = [];

  for (let index = 0; index < count && remainingPool.length > 0; index += 1) {
    const picked = nextInRange(currentSeed, 0, remainingPool.length - 1);
    currentSeed = picked.seed;

    const [question] = remainingPool.splice(picked.value, 1);
    selected.push({
      id: `viva-${index + 1}`,
      topic: question.topic,
      question: question.question,
    });
  }

  return {
    seed: currentSeed,
    questions: selected,
  };
}

function buildAnalysisOutput(details: SubmissionDetails): AnalysisOutput {
  let seed = hashString(details.projectTitle.trim().toLowerCase() || "untitled-project");

  const fileOverlap = nextInRange(seed, 18, 88);
  seed = fileOverlap.seed;

  const structuralOverlap = nextInRange(seed, 14, 84);
  seed = structuralOverlap.seed;

  const commitRisk = nextInRange(seed, 2, 10);
  seed = commitRisk.seed;

  const riskScore =
    fileOverlap.value * 0.42 + structuralOverlap.value * 0.34 + commitRisk.value * 5.4;
  const riskLevel = toRiskLevel(riskScore);

  const confidenceNoise = nextInRange(seed, 0, 8);
  seed = confidenceNoise.seed;

  const confidenceBase =
    79 + (10 - commitRisk.value) * 1.2 - Math.abs(fileOverlap.value - structuralOverlap.value) * 0.13;
  const confidencePct = clamp(Math.round(confidenceBase + confidenceNoise.value), 66, 97);

  const fileCount = nextInRange(seed, 56, 320);
  seed = fileCount.seed;

  const moduleCount = nextInRange(seed, 7, 24);
  seed = moduleCount.seed;

  const signatureMatches = nextInRange(seed, 6, 72);
  seed = signatureMatches.seed;

  const commitCount = nextInRange(seed, 12, 120);
  seed = commitCount.seed;

  const activeDays = nextInRange(seed, 4, 30);
  seed = activeDays.seed;

  const microCommitPct = nextInRange(seed, 8, 52);
  seed = microCommitPct.seed;

  const ownershipSignals =
    riskLevel === "LOW"
      ? "strong original ownership signals"
      : riskLevel === "MEDIUM"
        ? "mixed ownership signals"
        : riskLevel === "HIGH"
          ? "limited ownership signals"
          : "weak ownership signals";

  const riskLineByLevel: Record<RiskLevel, string> = {
    LOW: "Verdict remained low because overlap is mostly isolated to boilerplate setup and standard framework glue code.",
    MEDIUM:
      "Verdict is medium due to repeated overlap in structural signatures that should be defended clearly during viva.",
    HIGH: "Verdict is high because overlap and commit patterns together suggest substantial reuse in core implementation zones.",
    CRITICAL:
      "Verdict is critical since high overlap signatures align with risky commit behavior across core architecture boundaries.",
  };

  const narrativeLines = [
    `Repository scan processed ${fileCount.value} files grouped into ${moduleCount.value} implementation modules.`,
    `Similarity engine matched ${signatureMatches.value} signature blocks, with strongest overlap inside service and utility layers.`,
    `Commit audit observed ${commitCount.value} commits over ${activeDays.value} active days, including ${microCommitPct.value}% micro-commits.`,
    `Architecture consistency checks detected ${ownershipSignals} for the claimed project workflow.`,
    riskLineByLevel[riskLevel],
    `AI confidence settled at ${confidencePct}% after combining metadata depth, structure evidence, and commit trace quality.`,
  ];

  const questionCount = nextInRange(seed, 8, 12);
  const selectedQuestions = pickQuestions(questionCount.seed, questionCount.value);

  return {
    riskLevel,
    confidencePct,
    metrics: {
      fileOverlapPct: fileOverlap.value,
      structuralOverlapPct: structuralOverlap.value,
      commitRisk: commitRisk.value,
      aiConfidencePct: confidencePct,
    },
    narrativeLines,
    vivaQuestions: selectedQuestions.questions,
  };
}

function buildPipelineDurations(projectTitle: string) {
  const durations: number[] = [];
  let seed = hashString(`${projectTitle.trim().toLowerCase()}-pipeline`);

  PIPELINE_STEPS.forEach(() => {
    const nextValue = nextInRange(seed, 800, 1200);
    durations.push(nextValue.value);
    seed = nextValue.seed;
  });

  return durations;
}

function toStepStatus(
  index: number,
  completedSteps: number,
  activeStepIndex: number,
): PipelineStepStatus {
  if (index < completedSteps) return "completed";
  if (index === activeStepIndex && completedSteps < PIPELINE_STEPS.length) return "active";
  return "pending";
}

function SkeletonLine({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-white/55 bg-gradient-to-r from-white/35 via-white/55 to-white/35 ${className}`}
    />
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/40 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || "-"}</p>
    </div>
  );
}

export default function StudentReviewPage() {
  const navigate = useNavigate();
  const submissionDetails = useMemo<SubmissionDetails>(() => readStoredSubmissionDetails(), []);
  const analysisOutput = useMemo<AnalysisOutput>(
    () => buildAnalysisOutput(submissionDetails),
    [submissionDetails],
  );

  const pipelineDurations = useMemo(
    () => buildPipelineDurations(submissionDetails.projectTitle),
    [submissionDetails.projectTitle],
  );

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [analysisReady, setAnalysisReady] = useState(false);

  const progressPercent = Math.round((completedSteps / PIPELINE_STEPS.length) * 100);

  useEffect(() => {
    setActiveStepIndex(0);
    setCompletedSteps(0);
    setAnalysisReady(false);

    let cancelled = false;
    let timeoutId: number | null = null;
    let stepIndex = 0;

    const runNextStep = () => {
      if (cancelled) return;

      setActiveStepIndex(stepIndex);
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        setCompletedSteps(stepIndex + 1);
        stepIndex += 1;

        if (stepIndex < PIPELINE_STEPS.length) {
          runNextStep();
          return;
        }

        setAnalysisReady(true);
      }, pipelineDurations[stepIndex]);
    };

    runNextStep();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pipelineDurations]);

  useEffect(() => {
    if (analysisReady) return;
    window.dispatchEvent(
      new CustomEvent("pg:review-step", {
        detail: { stepIndex: activeStepIndex },
      }),
    );
  }, [activeStepIndex, analysisReady]);

  const accordionItems = useMemo<AccordionItem[]>(
    () =>
      analysisOutput.vivaQuestions.map((item) => ({
        id: item.id,
        topic: item.topic,
        title: item.question,
        detail: TOPIC_HINTS[item.topic],
      })),
    [analysisOutput.vivaQuestions],
  );

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">Analysis Pipeline</h2>
            <p className="mt-1 text-sm text-slate-600">
              Running AI checks across repository structure, commits, and ownership signals.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
              analysisReady
                ? "border-emerald-200/85 bg-emerald-50/80 text-emerald-700"
                : "border-blue-200/80 bg-blue-50/80 text-blue-700"
            }`}
          >
            {analysisReady ? "Completed" : `${progressPercent}%`}
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/65 bg-white/45">
          <motion.div
            className="h-2 bg-gradient-to-r from-blue-500/85 via-cyan-500/85 to-sky-400/90"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.32 }}
          />
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {PIPELINE_STEPS.map((step, index) => (
            <PipelineStep
              key={step.id}
              index={index}
              label={step.label}
              status={toStepStatus(index, completedSteps, activeStepIndex)}
            />
          ))}
        </div>
      </DemoGlassCard>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)]">
        <DemoGlassCard className={`h-fit p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Submission Details</h3>
            <button
              type="button"
              className={`rounded-lg border border-white/65 bg-white/55 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white/75 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Edit submission
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <DetailRow
              label="Student Name"
              value={submissionDetails.studentName?.trim() ? submissionDetails.studentName : "Optional"}
            />
            <DetailRow label="Roll Number" value={submissionDetails.rollNumber} />
            <DetailRow label="Branch" value={submissionDetails.branch} />
            <DetailRow label="Project Title" value={submissionDetails.projectTitle} />

            <div className="rounded-xl border border-white/60 bg-white/40 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                GitHub Repo
              </p>
              <a
                href={submissionDetails.githubRepo}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                {submissionDetails.githubRepo}
              </a>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/40 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Live Link
              </p>
              <a
                href={submissionDetails.liveLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block truncate text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                {submissionDetails.liveLink}
              </a>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/40 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Description
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {submissionDetails.description?.trim()
                  ? submissionDetails.description
                  : "No short description provided for this submission."}
              </p>
            </div>
          </div>
        </DemoGlassCard>

        <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">Intelligence Verdict</h3>
            <AnimatePresence mode="wait" initial={false}>
              {analysisReady ? (
                <motion.div
                  key="risk-ready"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <RiskBadge level={analysisOutput.riskLevel} />
                </motion.div>
              ) : (
                <motion.div key="risk-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <SkeletonLine className="h-9 w-36" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Confidence: {analysisReady ? `${analysisOutput.confidencePct}%` : "Running..."}
          </p>

          <AnimatePresence mode="wait">
            {analysisReady ? (
              <motion.div
                key="analysis-ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24 }}
              >
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    index={0}
                    label="File Overlap"
                    value={`${analysisOutput.metrics.fileOverlapPct}%`}
                    helper="Token and pattern level overlap"
                  />
                  <MetricCard
                    index={1}
                    label="Structural Overlap"
                    value={`${analysisOutput.metrics.structuralOverlapPct}%`}
                    helper="Architecture and module similarity"
                  />
                  <MetricCard
                    index={2}
                    label="Commit Risk"
                    value={`${analysisOutput.metrics.commitRisk}/10`}
                    helper="Temporal and ownership commit signals"
                  />
                  <MetricCard
                    index={3}
                    label="AI Confidence"
                    value={`${analysisOutput.metrics.aiConfidencePct}%`}
                    helper="Model certainty for current verdict"
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-white/60 bg-white/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Narrative Summary
                  </p>
                  <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
                    {analysisOutput.narrativeLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/60 bg-white/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Suggested Viva Questions
                  </p>
                  <div className="mt-3">
                    <Accordion items={accordionItems} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="analysis-running"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`metric-skeleton-${index}`}
                      className="rounded-2xl border border-white/60 bg-white/40 p-4"
                    >
                      <SkeletonLine className="h-3 w-24" />
                      <SkeletonLine className="mt-2 h-7 w-20" />
                      <SkeletonLine className="mt-2 h-3 w-40" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-white/60 bg-white/40 p-4">
                  <SkeletonLine className="h-3 w-32" />
                  <div className="mt-3 space-y-2">
                    <SkeletonLine className="h-3 w-full" />
                    <SkeletonLine className="h-3 w-[94%]" />
                    <SkeletonLine className="h-3 w-[90%]" />
                    <SkeletonLine className="h-3 w-[92%]" />
                    <SkeletonLine className="h-3 w-[88%]" />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/60 bg-white/40 p-4">
                  <SkeletonLine className="h-3 w-40" />
                  <div className="mt-3 space-y-2.5">
                    <SkeletonLine className="h-10 w-full" />
                    <SkeletonLine className="h-10 w-full" />
                    <SkeletonLine className="h-10 w-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!analysisReady}
              className={`rounded-xl border border-white/65 bg-white/55 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white/78 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Download Report
            </button>
            <button
              type="button"
              disabled={!analysisReady}
              onClick={() => navigate("/student/challenge")}
              className={`rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_14px_26px_rgba(37,99,235,0.24)] transition hover:shadow-[0_18px_30px_rgba(37,99,235,0.28)] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
            >
              Proceed to Live Coding Check
            </button>
          </div>
        </DemoGlassCard>
      </section>
    </motion.main>
  );
}
