import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DemoGlassCard from "../components/demo/DemoGlassCard";
import StatusBadge from "../components/demo/StatusBadge";
import {
  createSubmission,
  deleteSubmission,
  listSubmissions,
  updateSubmission,
  type SubmissionRecord,
} from "../lib/api";
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

interface SubmitFormState {
  projectTitle: string;
  branch: string;
  rollNumber: string;
  techInput: string;
  techStack: string[];
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

type FieldKey = "projectTitle" | "branch" | "rollNumber" | "githubLink" | "liveDemoUrl";
type TouchedState = Partial<Record<FieldKey, boolean>>;

function createInitialFormState(): SubmitFormState {
  return {
    projectTitle: "",
    branch: "",
    rollNumber: "",
    techInput: "",
    techStack: [],
    githubLink: "",
    liveDemoUrl: "",
  };
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
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

function toReadableStatus(status: SubmissionRecord["status"]) {
  if (status === "done" || status === "completed") return "Completed";
  if (status === "submitted") return "Submitted";
  if (status === "queued") return "Queued";
  if (status === "processing") return "Processing";
  if (status === "failed") return "Failed";
  return "Draft";
}

function toStatusBadgeTone(status: SubmissionRecord["status"]) {
  if (status === "done" || status === "completed") return "good" as const;
  if (status === "failed") return "danger" as const;
  if (status === "draft") return "neutral" as const;
  return "warning" as const;
}

function buildSubmissionDescription(formState: SubmitFormState) {
  const parts: string[] = [];

  if (formState.rollNumber.trim()) {
    parts.push(`Roll: ${formState.rollNumber.trim()}`);
  }

  if (formState.techStack.length > 0) {
    parts.push(`Tech: ${formState.techStack.join(", ")}`);
  }

  if (formState.liveDemoUrl.trim()) {
    parts.push(`Live: ${formState.liveDemoUrl.trim()}`);
  }

  return parts.length > 0 ? parts.join(" | ") : undefined;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [submissionError, setSubmissionError] = useState("");
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);

  const projectTitleRef = useRef<HTMLInputElement | null>(null);
  const branchRef = useRef<HTMLSelectElement | null>(null);
  const rollNumberRef = useRef<HTMLInputElement | null>(null);
  const githubLinkRef = useRef<HTMLInputElement | null>(null);
  const liveDemoRef = useRef<HTMLInputElement | null>(null);

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
    if (formState.liveDemoUrl.trim() && !validation.liveDemoError) score += 15;
    return Math.min(score, 100);
  }, [
    branchLooksGood,
    formState.githubLink,
    formState.liveDemoUrl,
    projectLooksGood,
    rollLooksGood,
    showGithubValid,
    validation.liveDemoError,
  ]);

  const hasRequiredFieldsValid =
    !validation.projectTitleError &&
    !validation.branchError &&
    !validation.rollNumberError &&
    !validation.githubError;
  const previewStatusLabel = hasRequiredFieldsValid ? "Ready to submit" : "Missing required fields";
  const recentSubmissions = useMemo(() => submissions.slice(0, 5), [submissions]);

  const loadSubmissions = async () => {
    setIsLoadingSubmissions(true);
    setSubmissionError("");

    try {
      const response = await listSubmissions();
      setSubmissions(response.submissions);
    } catch (requestError) {
      setSubmissionError(
        requestError instanceof Error ? requestError.message : "Unable to load submissions.",
      );
      setSubmissions([]);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    void loadSubmissions();
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

  const resetForm = () => {
    setFormState(createInitialFormState());
    setDidAttemptSubmit(false);
    setTouched({});
    setTechFeedback("");
    setEditingSubmissionId(null);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

    setIsSubmitting(true);
    setShowSuccessState(false);
    setSubmissionError("");

    try {
      const payload = {
        title: formState.projectTitle.trim(),
        repoUrl: formState.githubLink.trim(),
        branch: formState.branch.trim() || "main",
        description: buildSubmissionDescription(formState),
      };

      if (editingSubmissionId) {
        await updateSubmission(editingSubmissionId, payload);
      } else {
        await createSubmission(payload);
      }

      await loadSubmissions();
      setShowSuccessState(true);
      resetForm();
    } catch (requestError) {
      setSubmissionError(
        requestError instanceof Error ? requestError.message : "Unable to save submission.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmission = (submission: SubmissionRecord) => {
    const nextBranch = BRANCH_OPTIONS.includes(submission.branch) ? submission.branch : "";

    setEditingSubmissionId(submission.id);
    setShowSuccessState(false);
    setSubmissionError("");
    setFormState((current) => ({
      ...current,
      projectTitle: submission.title,
      branch: nextBranch,
      githubLink: submission.repoUrl,
      liveDemoUrl: "",
      techInput: "",
      techStack: [],
    }));

    projectTitleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    projectTitleRef.current?.focus();
  };

  const onDeleteSubmission = async (id: string) => {
    if (isSubmitting) return;

    setSubmissionError("");

    try {
      await deleteSubmission(id);
      setSubmissions((current) => current.filter((item) => item.id !== id));

      if (editingSubmissionId === id) {
        resetForm();
      }
    } catch (requestError) {
      setSubmissionError(
        requestError instanceof Error ? requestError.message : "Unable to delete submission.",
      );
    }
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
              Submit your project repository for tracking and future AI review.
            </p>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <SectionHint
              title="Project Basics"
              hint="Add project identity and technical details for accurate processing."
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

            <SectionHint
              title="Links & Validation"
              hint="Repository link is required for submission records."
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

            {submissionError ? (
              <p className="sm:col-span-2 text-sm font-medium text-rose-600">{submissionError}</p>
            ) : null}

            <div className="pt-1 sm:col-span-2 flex items-center gap-2">
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
                    {editingSubmissionId ? "Updating..." : "Submitting..."}
                  </>
                ) : editingSubmissionId ? (
                  "Update Submission"
                ) : (
                  "Submit Project"
                )}
              </button>

              {editingSubmissionId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white/80 ${BUTTON_INTERACTIVE_CLASS}`}
                >
                  Cancel Edit
                </button>
              ) : null}
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
                  Submission Saved
                </h2>
                <p className="mt-1 text-sm text-emerald-700">
                  Your submission record has been saved successfully.
                </p>
                <div className="mt-3 grid gap-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200/70 bg-white/55 px-3 py-2">
                    <span>Submission Saved</span>
                    <StatusBadge label="Done" tone="good" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-blue-200/70 bg-white/55 px-3 py-2">
                    <span>Status</span>
                    <StatusBadge label="submitted" tone="warning" />
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

        {submissionError ? <p className="mt-3 text-sm text-rose-600">{submissionError}</p> : null}

        {isLoadingSubmissions ? (
          <p className="mt-3 text-sm text-slate-600">Loading submissions...</p>
        ) : recentSubmissions.length ? (
          <div className="mt-3 grid gap-3">
            {recentSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={`group rounded-2xl border border-white/65 bg-white/45 px-4 py-3 ${LIST_ROW_INTERACTIVE_CLASS}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{submission.title}</p>
                  <StatusBadge
                    label={toReadableStatus(submission.status)}
                    tone={toStatusBadgeTone(submission.status)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-600">{new Date(submission.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-600">Branch: {submission.branch || "main"}</p>
                <p className="mt-1 text-xs text-slate-600">
                  GitHub:{" "}
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-700 hover:text-blue-800"
                  >
                    {truncateText(submission.repoUrl, 48)}
                  </a>
                </p>

                {submission.description ? (
                  <p className="mt-1 text-xs text-slate-600">{truncateText(submission.description, 84)}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => onEditSubmission(submission)}
                    className={`rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-1.5 font-semibold text-blue-700 ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteSubmission(submission.id)}
                    className={`rounded-lg border border-rose-200/80 bg-rose-50/80 px-2.5 py-1.5 font-semibold text-rose-700 ${BUTTON_INTERACTIVE_CLASS}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No submissions yet. Your latest submissions will appear here.
          </p>
        )}
      </DemoGlassCard>
    </motion.main>
  );
}


