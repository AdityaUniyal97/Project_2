import { motion } from "framer-motion";
import type { PipelineStepStatus } from "./types";

interface PipelineStepProps {
  index: number;
  label: string;
  status: PipelineStepStatus;
}

function statusCopy(status: PipelineStepStatus) {
  if (status === "completed") return "Completed";
  if (status === "active") return "Running";
  return "Queued";
}

function statusClass(status: PipelineStepStatus) {
  if (status === "completed") {
    return "border-emerald-200/85 bg-emerald-50/80 text-emerald-700";
  }
  if (status === "active") {
    return "border-blue-200/85 bg-blue-50/80 text-blue-700";
  }
  return "border-white/65 bg-white/45 text-slate-500";
}

export default function PipelineStep({ index, label, status }: PipelineStepProps) {
  const isActive = status === "active";
  const isCompleted = status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isActive ? 1.01 : 1,
      }}
      transition={{ duration: 0.22 }}
      className={`rounded-2xl border p-3.5 transition ${statusClass(status)}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
            isCompleted
              ? "border-emerald-300 bg-emerald-100/85 text-emerald-700"
              : isActive
                ? "border-blue-300 bg-blue-100/85 text-blue-700"
                : "border-slate-200 bg-white/70 text-slate-500"
          }`}
        >
          {isCompleted ? (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path
                d="M12.6 4.7L6.7 10.5L3.4 7.3"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            index + 1
          )}
          {isActive ? (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-[-4px] rounded-full border border-blue-300/75"
              animate={{ opacity: [0.25, 0.75, 0.25], scale: [0.95, 1.06, 0.95] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
        </span>

        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]">
            {statusCopy(status)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
