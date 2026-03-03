import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import DemoBackground from "../components/demo/DemoBackground";
import DemoGlassCard from "../components/demo/DemoGlassCard";
import DemoTopNav from "../components/demo/DemoTopNav";
import StatusBadge from "../components/demo/StatusBadge";

const BRANCH_OPTIONS = ["CSE", "IT", "AIML", "ECE", "EEE", "MECH"];

interface RecentSubmission {
  projectTitle: string;
  submittedAt: string;
}

function currentTimestamp() {
  return new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function StudentDemoPage() {
  const [projectTitle, setProjectTitle] = useState("");
  const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
  const [rollNumber, setRollNumber] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [zipFile, setZipFile] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [recentSubmission, setRecentSubmission] = useState<RecentSubmission | null>(
    null,
  );
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const addTech = () => {
    const cleaned = techInput.trim();
    if (!cleaned) return;
    if (techStack.includes(cleaned)) {
      setTechInput("");
      return;
    }
    setTechStack((current) => [...current, cleaned]);
    setTechInput("");
  };

  const onTechKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTech();
    }
  };

  const removeTech = (value: string) => {
    setTechStack((current) => current.filter((item) => item !== value));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const finalTitle = projectTitle.trim() || "Untitled Project";
    setRecentSubmission({
      projectTitle: finalTitle,
      submittedAt: currentTimestamp(),
    });
    setToastMessage("Submission created");
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setToastMessage("");
      timeoutRef.current = null;
    }, 3200);
  };

  return (
    <DemoBackground>
      <DemoTopNav />
      <main className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-8">
        {toastMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200/75 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-700 shadow-[0_10px_25px_rgba(16,185,129,0.18)]">
            {toastMessage}
          </div>
        ) : null}

        <DemoGlassCard className="p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Student Project Submission
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Submit your project package for plagiarism screening and AI review.
            </p>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Project Title</span>
              <input
                value={projectTitle}
                onChange={(event) => setProjectTitle(event.target.value)}
                placeholder="AI Attendance System"
                className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white/75"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Branch</span>
              <select
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-200 focus:bg-white/75"
              >
                {BRANCH_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Roll Number</span>
              <input
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
                placeholder="21CSE109"
                className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white/75"
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Tech Stack</span>
              <div className="flex gap-2">
                <input
                  value={techInput}
                  onChange={(event) => setTechInput(event.target.value)}
                  onKeyDown={onTechKeyDown}
                  placeholder="React, Node.js, MongoDB"
                  className="flex-1 rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white/75"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="rounded-2xl border border-blue-200/75 bg-blue-50/75 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100/80"
                >
                  Add
                </button>
              </div>
              {techStack.length ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {techStack.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => removeTech(item)}
                      className="rounded-full border border-white/70 bg-white/55 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/80"
                    >
                      {item} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Upload Project ZIP
              </span>
              <input
                type="file"
                accept=".zip"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setZipFile(file?.name ?? "");
                }}
                className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-100/90 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700"
              />
              {zipFile ? (
                <p className="text-xs font-medium text-slate-500">Selected: {zipFile}</p>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                GitHub Repository Link
              </span>
              <input
                value={githubLink}
                onChange={(event) => setGithubLink(event.target.value)}
                placeholder="https://github.com/user/project"
                className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white/75"
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Live Demo URL</span>
              <input
                value={liveDemoUrl}
                onChange={(event) => setLiveDemoUrl(event.target.value)}
                placeholder="https://yourproject.vercel.app"
                className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white/75"
              />
            </label>

            <div className="pt-1 sm:col-span-2">
              <button
                type="submit"
                className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_15px_28px_rgba(14,116,220,0.24)] transition hover:translate-y-[-1px] hover:shadow-[0_18px_30px_rgba(14,116,220,0.27)]"
              >
                Submit Project
              </button>
            </div>
          </form>
        </DemoGlassCard>

        {recentSubmission ? (
          <DemoGlassCard className="mt-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Recent Submission</h2>
              <StatusBadge label="Under Review" tone="warning" />
            </div>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Project:</span>{" "}
              {recentSubmission.projectTitle}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Submitted on {recentSubmission.submittedAt}
            </p>
          </DemoGlassCard>
        ) : null}
      </main>
    </DemoBackground>
  );
}
