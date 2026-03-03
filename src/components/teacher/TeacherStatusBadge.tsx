import type { TeacherSubmissionStatus } from "./types";

interface TeacherStatusBadgeProps {
  status: TeacherSubmissionStatus;
}

export default function TeacherStatusBadge({ status }: TeacherStatusBadgeProps) {
  if (status === "Under Review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/85 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-amber-500" />
        Under Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/85 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M12.8 4.6L6.7 10.7L3.2 7.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Completed
    </span>
  );
}
