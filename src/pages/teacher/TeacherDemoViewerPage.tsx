import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import { useTeacherData } from "../../components/teacher/TeacherDataContext";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS, INPUT_GLOW_CLASS } from "../../components/ui/glass";

type DemoViewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTH: Record<DemoViewport, string> = {
  desktop: "100%",
  tablet: "820px",
  mobile: "390px",
};

function projectTypeLabel(projectType: "web" | "mobile" | "cli") {
  if (projectType === "web") return "Web";
  if (projectType === "mobile") return "Mobile";
  return "CLI";
}

export default function TeacherDemoViewerPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const { submissions } = useTeacherData();

  const submission = useMemo(
    () => submissions.find((item) => item.id === submissionId) ?? null,
    [submissionId, submissions],
  );

  const [viewport, setViewport] = useState<DemoViewport>("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [isFrameLoading, setIsFrameLoading] = useState(false);
  const [frameBlocked, setFrameBlocked] = useState(false);
  const blockTimerRef = useRef<number | null>(null);

  const canEmbed = Boolean(submission?.liveDemoUrl && submission.projectType === "web");

  useEffect(() => {
    if (blockTimerRef.current) {
      window.clearTimeout(blockTimerRef.current);
      blockTimerRef.current = null;
    }

    if (!canEmbed) {
      setIsFrameLoading(false);
      setFrameBlocked(false);
      return;
    }

    setIsFrameLoading(true);
    setFrameBlocked(false);

    blockTimerRef.current = window.setTimeout(() => {
      setIsFrameLoading(false);
      setFrameBlocked(true);
    }, 3200);

    return () => {
      if (blockTimerRef.current) {
        window.clearTimeout(blockTimerRef.current);
        blockTimerRef.current = null;
      }
    };
  }, [canEmbed, frameKey, submission?.liveDemoUrl]);

  const onOpenNewTab = () => {
    if (!submission?.liveDemoUrl) return;
    window.open(submission.liveDemoUrl, "_blank", "noopener,noreferrer");
  };

  if (!submission) {
    return (
      <motion.main
        className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <DemoGlassCard className={`p-6 ${GLASS_INTERACTIVE_CLASS}`}>
          <h2 className="text-lg font-semibold text-slate-900">Demo not found</h2>
          <p className="mt-2 text-sm text-slate-600">
            The selected submission could not be loaded.
          </p>
          <button
            type="button"
            onClick={() => navigate("/teacher/submissions")}
            className={`mt-4 rounded-xl border border-white/70 bg-white/65 px-3 py-2 text-xs font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
          >
            Back to Submissions
          </button>
        </DemoGlassCard>
      </motion.main>
    );
  }

  return (
    <motion.main
      className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <DemoGlassCard className={`p-4 sm:p-5 ${GLASS_INTERACTIVE_CLASS}`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/teacher/submissions")}
            className={`rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
          >
            Back
          </button>

          <input
            readOnly
            value={submission.liveDemoUrl ?? "No URL provided"}
            className={`min-w-[220px] flex-1 rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-700 ${INPUT_GLOW_CLASS}`}
          />

          <button
            type="button"
            onClick={() => setFrameKey((current) => current + 1)}
            className={`rounded-lg border border-white/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 ${BUTTON_INTERACTIVE_CLASS}`}
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={onOpenNewTab}
            disabled={!submission.liveDemoUrl}
            className={`rounded-lg border border-blue-200/80 bg-blue-50/75 px-3 py-2 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_INTERACTIVE_CLASS}`}
          >
            Open in New Tab
          </button>

          <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
            {projectTypeLabel(submission.projectType)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Live Demo Viewer
            </p>
            <p className="text-sm font-medium text-slate-800">{submission.projectTitle}</p>
          </div>

          <div className="inline-flex items-center rounded-lg border border-white/70 bg-white/70 p-1">
            {(["desktop", "tablet", "mobile"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewport(mode)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  viewport === mode ? "bg-white text-slate-800 shadow" : "text-slate-500"
                }`}
              >
                {mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </DemoGlassCard>

      <motion.section
        className="mt-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.04 }}
      >
        <DemoGlassCard className={`p-4 sm:p-5 ${GLASS_INTERACTIVE_CLASS}`}>
          <div className="rounded-2xl border border-white/60 bg-white/35 p-3 sm:p-4">
            {submission.projectType === "web" && submission.liveDemoUrl ? (
              <div className="overflow-x-auto">
                <div className="flex min-w-[360px] justify-center">
                  <motion.div
                    animate={{ width: VIEWPORT_WIDTH[viewport] }}
                    transition={{ duration: 0.26 }}
                    className="relative h-[520px] max-w-full overflow-hidden rounded-xl border border-slate-300/65 bg-slate-100"
                  >
                    {isFrameLoading ? (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/65 text-sm font-medium text-slate-600">
                        Loading preview...
                      </div>
                    ) : null}

                    {frameBlocked ? (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/92 px-5 text-center">
                        <p className="text-sm font-medium text-slate-700">
                          This project cannot be previewed inside the platform.
                        </p>
                        <button
                          type="button"
                          onClick={onOpenNewTab}
                          className={`rounded-xl border border-blue-200/80 bg-blue-50/85 px-4 py-2 text-sm font-semibold text-blue-700 ${BUTTON_INTERACTIVE_CLASS}`}
                        >
                          Open Demo in New Tab
                        </button>
                      </div>
                    ) : null}

                    <iframe
                      key={`${submission.id}-${frameKey}`}
                      src={submission.liveDemoUrl}
                      title={`${submission.projectTitle} preview`}
                      className="h-full w-full bg-white"
                      onLoad={() => {
                        if (blockTimerRef.current) {
                          window.clearTimeout(blockTimerRef.current);
                          blockTimerRef.current = null;
                        }
                        setIsFrameLoading(false);
                        setFrameBlocked(false);
                      }}
                      onError={() => {
                        if (blockTimerRef.current) {
                          window.clearTimeout(blockTimerRef.current);
                          blockTimerRef.current = null;
                        }
                        setIsFrameLoading(false);
                        setFrameBlocked(true);
                      }}
                    />
                  </motion.div>
                </div>
              </div>
            ) : submission.projectType === "web" ? (
              <div className="flex h-[420px] items-center justify-center rounded-xl border border-white/60 bg-white/45 px-4 text-sm text-slate-600">
                No Live Demo URL provided.
              </div>
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center rounded-xl border border-white/60 bg-white/45 px-4 text-center">
                <svg className="h-12 w-12 text-slate-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="4" y="3" width="16" height="18" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <h3 className="mt-3 text-lg font-semibold text-slate-800">Preview Coming Soon</h3>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  Live preview for mobile and CLI projects will be supported in a future release.
                </p>
              </div>
            )}
          </div>
        </DemoGlassCard>
      </motion.section>
    </motion.main>
  );
}
