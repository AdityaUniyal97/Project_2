import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DemoGlassCard from "../components/demo/DemoGlassCard";
import StatusBadge from "../components/demo/StatusBadge";
import { STUDENT_SUBMISSIONS_STORAGE_KEY } from "../components/student/constants";
import {
  BUTTON_INTERACTIVE_CLASS,
  GLASS_INTERACTIVE_CLASS,
  INPUT_GLOW_CLASS,
  LIST_ROW_INTERACTIVE_CLASS,
} from "../components/ui/glass";

const BRANCH_OPTIONS = ["CSE", "IT", "AIML", "ECE", "EEE", "MECH"];
const TECH_SUGGESTIONS = [
  "React",
  "Node.js",
  "MongoDB",
  "Express",
  "TypeScript",
  "Python",
  "Java",
  "Firebase",
  "Next.js",
];

const MAX_TECH_TAGS = 8;
const MAX_ZIP_BYTES = 20 * 1024 * 1024;

interface SubmitFormState {
  projectTitle: string;
  branch: string;
  rollNumber: string;
  techInput: string;
  techStack: string[];
  zipFile: File | null;
  githubLink: string;
  liveDemoUrl: string;
}

interface SubmitValidationState {
  projectTitleError: string;
  branchError: string;
  rollNumberError: string;
  githubError: string;
  liveDemoError: string;
}

interface LocalSubmissionRecord {
  id: string;
  projectTitle: string;
  submittedAt: string;
  status: "Under Review";
  githubLink: string;
  originality: number;
  plagiarism: number;
}

type FieldKey = "projectTitle" | "branch" | "rollNumber" | "githubLink" | "liveDemoUrl";
type TouchedState = Partial<Record<FieldKey, boolean>>;

function createInitialFormState(): SubmitFormState {
  return {
    projectTitle: "",
    branch: "",
    rollNumber: "",
    techInput: "",
    techStack: [],
    zipFile: null,
    githubLink: "",
    liveDemoUrl: "",
  };
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function formatFileSizeInMb(file: File) {
  return `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
}

function getValidationState(formState: SubmitFormState): SubmitValidationState {
  const title = formState.projectTitle.trim();
  const branch = formState.branch.trim();
  const rollNumber = formState.rollNumber.trim();
  const githubLink = formState.githubLink.trim();
  const liveDemoUrl = formState.liveDemoUrl.trim();

  let projectTitleError = "";
  if (!title) {
    projectTitleError = "Project title is required.";
  } else if (title.length < 3) {
    projectTitleError = "Project title must be at least 3 characters.";
  }

  let branchError = "";
  if (!branch) {
    branchError = "Please select your branch.";
  }

  let rollNumberError = "";
  if (!rollNumber) {
    rollNumberError = "Roll number is required.";
  } else if (rollNumber.length < 5) {
    rollNumberError = "Roll number must be at least 5 characters.";
  }

  let githubError = "";
  if (!githubLink) {
    githubError = "GitHub repository link is required.";
  } else if (!githubLink.startsWith("https://github.com/")) {
    githubError = "GitHub link must start with https://github.com/";
  }

  let liveDemoError = "";
  if (liveDemoUrl && !liveDemoUrl.startsWith("https://")) {
    liveDemoError = "Live demo URL must start with https://";
  }

  return {
    projectTitleError,
    branchError,
    rollNumberError,
    githubError,
    liveDemoError,
  };
}

function createDeterministicScores(title: string) {
  const cleanedTitle = title.trim().toLowerCase();
  let hash = 0;

  for (let i = 0; i < cleanedTitle.length; i += 1) {
    hash = (hash * 31 + cleanedTitle.charCodeAt(i)) >>> 0;
  }

  const originality = 62 + (hash % 34);
  return {
    originality,
    plagiarism: 100 - originality,
  };
}

function SectionHint({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-white/50 bg-white/30 px-3 py-2">
      <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
        i
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

export default function StudentDemoPage() {
  const [formState, setFormState] = useState<SubmitFormState>(createInitialFormState);
  const [touched, setTouched] = useState<TouchedState>({});
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const [techFeedback, setTechFeedback] = useState("");
  const [zipError, setZipError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [submissions, setSubmissions] = useState<LocalSubmissionRecord[]>([]);
  const [hasLoadedSubmissions, setHasLoadedSubmissions] = useState(false);

  const submitTimeoutRef = useRef<number | null>(null);
  const projectTitleRef = useRef<HTMLInputElement | null>(null);
  const branchRef = useRef<HTMLSelectElement | null>(null);
  const rollNumberRef = useRef<HTMLInputElement | null>(null);
  const githubLinkRef = useRef<HTMLInputElement | null>(null);
  const liveDemoRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  const validation = useMemo(() => getValidationState(formState), [formState]);
  const isFormValid =
    !validation.projectTitleError &&
    !validation.branchError &&
    !validation.rollNumberError &&
    !validation.githubError &&
    !validation.liveDemoError;
  const isSubmitDisabled = isSubmitting || !isFormValid;

  const showProjectTitleError =
    (touched.projectTitle || didAttemptSubmit) && validation.projectTitleError;
  const showBranchError = (touched.branch || didAttemptSubmit) && validation.branchError;
  const showRollNumberError =
    (touched.rollNumber || didAttemptSubmit) && validation.rollNumberError;
  const showGithubError = (touched.githubLink || didAttemptSubmit) && validation.githubError;
  const showLiveDemoError = formState.liveDemoUrl.trim() && validation.liveDemoError;
  const showGithubValid = formState.githubLink.trim() && !validation.githubError;

  const projectLooksGood = formState.projectTitle.trim().length >= 3;
  const rollLooksGood = formState.rollNumber.trim().length >= 5;
  const branchLooksGood = Boolean(formState.branch.trim());

  const completionScore = useMemo(() => {
    let score = 0;
    if (projectLooksGood) score += 25;
    if (rollLooksGood) score += 25;
    if (branchLooksGood) score += 20;
    if (showGithubValid) score += 15;
    if (!validation.liveDemoError) score += 15;
    return Math.min(score, 100);
  }, [branchLooksGood, formState.githubLink, projectLooksGood, rollLooksGood, showGithubValid, validation.liveDemoError]);

  const hasRequiredFieldsValid =
    !validation.projectTitleError &&
    !validation.branchError &&
    !validation.rollNumberError &&
    !validation.githubError;
  const previewStatusLabel = hasRequiredFieldsValid ? "Ready to submit" : "Missing required fields";
  const recentSubmissions = useMemo(() => submissions.slice(0, 5), [submissions]);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(STUDENT_SUBMISSIONS_STORAGE_KEY);
      if (!storedValue) return;

      const parsed = JSON.parse(storedValue) as unknown;
      if (Array.isArray(parsed)) {
        const normalized: LocalSubmissionRecord[] = parsed
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
          .map((item, index) => {
            const projectTitle =
              typeof item.projectTitle === "string" && item.projectTitle.trim()
                ? item.projectTitle
                : "Untitled Project";
            const fallbackScores = createDeterministicScores(projectTitle);
            const originality =
              typeof item.originality === "number" &&
              Number.isFinite(item.originality) &&
              item.originality >= 0 &&
              item.originality <= 100
                ? Math.round(item.originality)
                : fallbackScores.originality;
            const plagiarism =
              typeof item.plagiarism === "number" &&
              Number.isFinite(item.plagiarism) &&
              item.plagiarism >= 0 &&
              item.plagiarism <= 100
                ? Math.round(item.plagiarism)
                : 100 - originality;

            return {
              id:
                typeof item.id === "string" && item.id.trim()
                  ? item.id
                  : `local-${index}-${projectTitle.length}`,
              projectTitle,
              submittedAt:
                typeof item.submittedAt === "string" && item.submittedAt.trim()
                  ? item.submittedAt
                  : new Date().toLocaleString(),
              status: "Under Review",
              githubLink: typeof item.githubLink === "string" ? item.githubLink : "",
              originality,
              plagiarism,
            };
          });
        setSubmissions(normalized);
      }
    } catch {
      localStorage.removeItem(STUDENT_SUBMISSIONS_STORAGE_KEY);
    } finally {
      setHasLoadedSubmissions(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSubmissions) return;
    localStorage.setItem(STUDENT_SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  }, [hasLoadedSubmissions, submissions]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const markFieldTouched = (field: FieldKey) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const updateField = <K extends keyof SubmitFormState>(field: K, value: SubmitFormState[K]) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const addTechTag = (rawValue: string) => {
    const cleaned = rawValue.trim();
    if (!cleaned) return;

    if (formState.techStack.length >= MAX_TECH_TAGS) {
      setTechFeedback("Maximum 8 tags allowed.");
      setFormState((current) => ({ ...current, techInput: "" }));
      return;
    }

    if (formState.techStack.some((item) => item.toLowerCase() === cleaned.toLowerCase())) {
      setTechFeedback("Tag already added.");
      setFormState((current) => ({ ...current, techInput: "" }));
      return;
    }

    setTechFeedback("");
    setFormState((current) => ({
      ...current,
      techInput: "",
      techStack: [...current.techStack, cleaned],
    }));
  };

  const onTechKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTechTag(formState.techInput);
    }
  };

  const removeTechTag = (value: string) => {
    setTechFeedback("");
    setFormState((current) => ({
      ...current,
      techStack: current.techStack.filter((item) => item !== value),
    }));
  };

  const handleZipChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setZipError("");
      setFormState((current) => ({ ...current, zipFile: null }));
      return;
    }

    const hasZipExtension = file.name.toLowerCase().endsWith(".zip");
    if (!hasZipExtension) {
      setZipError("Only .zip files are allowed.");
      setFormState((current) => ({ ...current, zipFile: null }));
      event.target.value = "";
      return;
    }

    if (file.size > MAX_ZIP_BYTES) {
      setZipError("ZIP file must be 20MB or smaller.");
      setFormState((current) => ({ ...current, zipFile: null }));
      event.target.value = "";
      return;
    }

    setZipError("");
    setFormState((current) => ({ ...current, zipFile: file }));
  };

  const clearZipFile = () => {
    setZipError("");
    setFormState((current) => ({ ...current, zipFile: null }));
    if (zipInputRef.current) {
      zipInputRef.current.value = "";
    }
  };

  const focusInvalidField = (field: FieldKey) => {
    const refs: Record<FieldKey, HTMLInputElement | HTMLSelectElement | null> = {
      projectTitle: projectTitleRef.current,
      branch: branchRef.current,
      rollNumber: rollNumberRef.current,
      githubLink: githubLinkRef.current,
      liveDemoUrl: liveDemoRef.current,
    };

    const currentRef = refs[field];
    currentRef?.focus();
    currentRef?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const getFirstInvalidField = (): FieldKey | null => {
    if (validation.projectTitleError) return "projectTitle";
    if (validation.branchError) return "branch";
    if (validation.rollNumberError) return "rollNumber";
    if (validation.githubError) return "githubLink";
    if (validation.liveDemoError) return "liveDemoUrl";
    return null;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDidAttemptSubmit(true);
    setTouched({
      projectTitle: true,
      branch: true,
      rollNumber: true,
      githubLink: true,
      liveDemoUrl: true,
    });

    if (!isFormValid) {
      const firstInvalidField = getFirstInvalidField();
      if (firstInvalidField) {
        focusInvalidField(firstInvalidField);
      }
      return;
    }

    if (submitTimeoutRef.current) {
      window.clearTimeout(submitTimeoutRef.current);
    }

    setIsSubmitting(true);
    setShowSuccessState(false);

    const delay = 800 + Math.floor(Math.random() * 401);
    submitTimeoutRef.current = window.setTimeout(() => {
      const normalizedTitle = formState.projectTitle.trim();
      const scores = createDeterministicScores(normalizedTitle);
      const submissionItem: LocalSubmissionRecord = {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        projectTitle: normalizedTitle,
        submittedAt: new Date().toLocaleString(),
        status: "Under Review",
        githubLink: formState.githubLink.trim(),
        originality: scores.originality,
        plagiarism: scores.plagiarism,
      };

      setSubmissions((current) => [submissionItem, ...current]);
      setIsSubmitting(false);
      setShowSuccessState(true);
      setDidAttemptSubmit(false);
      setTouched({});
      setZipError("");
      setTechFeedback("");
      setFormState(createInitialFormState());

      if (zipInputRef.current) {
        zipInputRef.current.value = "";
      }

      submitTimeoutRef.current = null;
    }, delay);
  };

  const getInputClass = (hasError: boolean, shouldGlow = true) =>
    `rounded-2xl border px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${
      shouldGlow ? INPUT_GLOW_CLASS : ""
    } ${
      hasError
        ? "border-rose-200/80 bg-rose-50/30"
        : "border-white/60 bg-white/55 focus:border-blue-200 focus:bg-white/75"
    }`;

  return (
    <motion.main
      className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <DemoGlassCard className={`p-6 sm:p-8 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Student Project Submission
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Submit your project package for plagiarism screening and AI review.
            </p>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <SectionHint
              title="Project Basics"
              hint="Add project identity and technical details for accurate AI checks."
            />

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">Project Title</span>
                {projectLooksGood ? (
                  <span className="text-[11px] font-semibold text-emerald-700">Looks good</span>
                ) : null}
              </div>
              <input
                ref={projectTitleRef}
                value={formState.projectTitle}
                onChange={(event) => updateField("projectTitle", event.target.value)}
                onBlur={() => markFieldTouched("projectTitle")}
                aria-invalid={Boolean(showProjectTitleError)}
                placeholder="AI Attendance System"
                className={getInputClass(Boolean(showProjectTitleError))}
                disabled={isSubmitting}
              />
              {showProjectTitleError ? (
                <p className="text-xs font-medium text-rose-600">{validation.projectTitleError}</p>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">Branch</span>
                {branchLooksGood ? (
                  <span className="text-[11px] font-semibold text-emerald-700">Selected</span>
                ) : null}
              </div>
              <select
                ref={branchRef}
                value={formState.branch}
                onChange={(event) => updateField("branch", event.target.value)}
                onBlur={() => markFieldTouched("branch")}
                aria-invalid={Boolean(showBranchError)}
                className={getInputClass(Boolean(showBranchError))}
                disabled={isSubmitting}
              >
                <option value="">Select Branch</option>
                {BRANCH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {showBranchError ? (
                <p className="text-xs font-medium text-rose-600">{validation.branchError}</p>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">Roll Number</span>
                {rollLooksGood ? (
                  <span className="text-[11px] font-semibold text-emerald-700">Looks good</span>
                ) : null}
              </div>
              <input
                ref={rollNumberRef}
                value={formState.rollNumber}
                onChange={(event) => updateField("rollNumber", event.target.value)}
                onBlur={() => markFieldTouched("rollNumber")}
                aria-invalid={Boolean(showRollNumberError)}
                placeholder="21CSE109"
                className={getInputClass(Boolean(showRollNumberError))}
                disabled={isSubmitting}
              />
              {showRollNumberError ? (
                <p className="text-xs font-medium text-rose-600">{validation.rollNumberError}</p>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Tech Stack</span>
              <div className="flex gap-2">
                <input
                  value={formState.techInput}
                  onChange={(event) => updateField("techInput", event.target.value)}
                  onKeyDown={onTechKeyDown}
                  placeholder="React, Node.js, MongoDB"
                  className={`flex-1 ${getInputClass(false)}`}
                  disabled={isSubmitting || formState.techStack.length >= MAX_TECH_TAGS}
                />
                <button
                  type="button"
                  onClick={() => addTechTag(formState.techInput)}
                  className={`rounded-2xl border border-blue-200/75 bg-blue-50/75 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100/80 ${BUTTON_INTERACTIVE_CLASS}`}
                  disabled={isSubmitting || formState.techStack.length >= MAX_TECH_TAGS}
                >
                  Add
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Press Enter to add ({formState.techStack.length}/{MAX_TECH_TAGS})
              </p>
              {techFeedback ? (
                <p className="text-xs font-medium text-amber-700">{techFeedback}</p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {TECH_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addTechTag(suggestion)}
                    disabled={isSubmitting || formState.techStack.length >= MAX_TECH_TAGS}
                    className={`rounded-full border border-white/65 bg-white/45 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {formState.techStack.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formState.techStack.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => removeTechTag(item)}
                      className={`rounded-full border border-white/70 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/80 ${BUTTON_INTERACTIVE_CLASS}`}
                      disabled={isSubmitting}
                    >
                      {item} x
                    </button>
                  ))}
                </div>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Upload Project ZIP</span>
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                onChange={handleZipChange}
                className={`rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-100/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 ${INPUT_GLOW_CLASS}`}
                disabled={isSubmitting}
              />
              {zipError ? <p className="text-xs font-medium text-rose-600">{zipError}</p> : null}
              {formState.zipFile ? (
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-200/80 bg-blue-50/70 px-3 py-1 text-xs font-medium text-blue-700">
                  <span>
                    {formState.zipFile.name} ({formatFileSizeInMb(formState.zipFile)})
                  </span>
                  <span className="rounded-full border border-emerald-200/75 bg-emerald-50/75 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Ready
                  </span>
                  <button
                    type="button"
                    onClick={clearZipFile}
                    className={`rounded-full border border-blue-200/80 bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ${BUTTON_INTERACTIVE_CLASS}`}
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </label>

            <SectionHint
              title="Links & Validation"
              hint="Repository and demo links improve automated report confidence."
            />

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">GitHub Repository Link</span>
                {showGithubValid ? (
                  <span className="text-[11px] font-semibold text-emerald-700">Valid URL</span>
                ) : null}
              </div>
              <input
                ref={githubLinkRef}
                value={formState.githubLink}
                onChange={(event) => updateField("githubLink", event.target.value)}
                onBlur={() => markFieldTouched("githubLink")}
                aria-invalid={Boolean(showGithubError)}
                placeholder="https://github.com/user/project"
                className={getInputClass(Boolean(showGithubError))}
                disabled={isSubmitting}
              />
              {showGithubError ? (
                <p className="text-xs font-medium text-rose-600">{validation.githubError}</p>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Live Demo URL</span>
              <input
                ref={liveDemoRef}
                value={formState.liveDemoUrl}
                onChange={(event) => updateField("liveDemoUrl", event.target.value)}
                onBlur={() => markFieldTouched("liveDemoUrl")}
                aria-invalid={Boolean(showLiveDemoError)}
                placeholder="https://yourproject.vercel.app"
                className={getInputClass(Boolean(showLiveDemoError))}
                disabled={isSubmitting}
              />
              {showLiveDemoError ? (
                <p className="text-xs font-medium text-rose-600">{validation.liveDemoError}</p>
              ) : null}
            </label>

            <div className="pt-1 sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`inline-flex items-center gap-2 rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_15px_28px_rgba(14,116,220,0.24)] transition ${
                  isSubmitDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "hover:translate-y-[-1px] hover:shadow-[0_18px_30px_rgba(14,116,220,0.27)]"
                } ${BUTTON_INTERACTIVE_CLASS}`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Project"
                )}
              </button>
            </div>
          </form>

          <AnimatePresence>
            {showSuccessState ? (
              <motion.div
                className="mt-5 rounded-2xl border border-emerald-200/75 bg-emerald-50/70 px-4 py-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.22 }}
              >
                <h2 className="text-sm font-semibold text-emerald-800">
                  Submission Received {"\u2705"}
                </h2>
                <p className="mt-1 text-sm text-emerald-700">
                  AI analysis will start soon. Estimated time: 2-5 minutes.
                </p>
                <div className="mt-3 grid gap-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-white/55 px-3 py-2">
                    <span>Submission Received</span>
                    <StatusBadge label="Done" tone="good" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-blue-200/70 bg-white/55 px-3 py-2">
                    <span>AI Analysis Running</span>
                    <StatusBadge label="Active" tone="neutral" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-amber-200/70 bg-white/55 px-3 py-2">
                    <span>Teacher Review</span>
                    <StatusBadge label="Pending" tone="warning" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/55 px-3 py-2">
                    <span>Completed</span>
                    <StatusBadge label="Pending" tone="neutral" />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DemoGlassCard>

        <DemoGlassCard className={`h-fit p-4 ${GLASS_INTERACTIVE_CLASS}`}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Preview Summary
          </h2>
          <p className="mt-1 text-xs text-slate-500">Live snapshot of your current draft.</p>

          <div className="mt-3 overflow-hidden rounded-xl border border-white/60 bg-white/40">
            <div
              className="h-1.5 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 transition-all"
              style={{ width: `${completionScore}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Completeness: {completionScore}%</p>

          <dl className="mt-4 space-y-3 text-xs">
            <div>
              <dt className="font-semibold text-slate-500">Title</dt>
              <dd className="mt-1 text-slate-800">{formState.projectTitle || "Not set"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Branch</dt>
              <dd className="mt-1 text-slate-800">{formState.branch || "Not selected"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Tech Tags</dt>
              <dd className="mt-1 text-slate-800">{formState.techStack.length} selected</dd>
              {formState.techStack.length ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {formState.techStack.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/65 bg-white/55 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                  {formState.techStack.length > 4 ? (
                    <span className="rounded-full border border-white/65 bg-white/55 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      +{formState.techStack.length - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div>
              <dt className="font-semibold text-slate-500">GitHub Link</dt>
              <dd className="mt-1 text-slate-800">
                {!formState.githubLink.trim()
                  ? "Required"
                  : showGithubValid
                    ? "Valid"
                    : "Needs correction"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Live Demo URL</dt>
              <dd className="mt-1 text-slate-800">
                {!formState.liveDemoUrl.trim()
                  ? "Optional"
                  : !validation.liveDemoError
                    ? "Valid"
                    : "Needs correction"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">ZIP</dt>
              <dd className="mt-1 text-slate-800">
                {formState.zipFile ? formState.zipFile.name : "Not attached"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Status</dt>
              <dd className="mt-1">
                <StatusBadge label={previewStatusLabel} tone={hasRequiredFieldsValid ? "good" : "warning"} />
              </dd>
            </div>
          </dl>
        </DemoGlassCard>
      </div>

      <DemoGlassCard className={`mt-5 p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Recent Submissions</h2>
          <StatusBadge label={`${recentSubmissions.length} Showing`} tone="neutral" />
        </div>

        {recentSubmissions.length ? (
          <div className="mt-3 grid gap-3">
            {recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`group rounded-2xl border border-white/65 bg-white/45 px-4 py-3 ${LIST_ROW_INTERACTIVE_CLASS}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{submission.projectTitle}</p>
                  <StatusBadge label={submission.status} tone="warning" />
                </div>
                <p className="mt-1 text-xs text-slate-600">{submission.submittedAt}</p>
                <p className="mt-1 text-xs text-slate-600">
                  GitHub:{" "}
                  {submission.githubLink ? (
                    <a
                      href={submission.githubLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-blue-700 hover:text-blue-800"
                    >
                      {truncateText(submission.githubLink, 48)}
                    </a>
                  ) : (
                    <span className="font-medium text-slate-500">Not provided</span>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <StatusBadge label={`Originality ${submission.originality}%`} tone="good" />
                  <StatusBadge label={`Plagiarism ${submission.plagiarism}%`} tone="warning" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No submissions yet. Your latest 5 successful submissions will appear here.
          </p>
        )}
      </DemoGlassCard>
    </motion.main>
  );
}
