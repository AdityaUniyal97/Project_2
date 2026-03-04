import type { TeacherRiskLevel } from "./types";

interface TeacherRiskBadgeProps {
  level: TeacherRiskLevel;
}

export default function TeacherRiskBadge({ level }: TeacherRiskBadgeProps) {
  if (level === "CRITICAL") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/85 bg-rose-100/80 px-2.5 py-1 text-xs font-semibold text-rose-800">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
        CRITICAL
      </span>
    );
  }

  if (level === "HIGH") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/85 bg-orange-50/85 px-2.5 py-1 text-xs font-semibold text-orange-700">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        HIGH
      </span>
    );
  }

  if (level === "MEDIUM") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/85 bg-amber-50/85 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        MEDIUM
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/85 bg-emerald-50/85 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      LOW
    </span>
  );
}
