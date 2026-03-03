type BadgeTone = "neutral" | "good" | "warning" | "danger";

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

const toneClassMap: Record<BadgeTone, string> = {
  neutral: "border-blue-200/70 bg-blue-50/70 text-blue-800",
  good: "border-emerald-200/80 bg-emerald-50/75 text-emerald-700",
  warning: "border-amber-200/80 bg-amber-50/80 text-amber-700",
  danger: "border-rose-200/80 bg-rose-50/80 text-rose-700",
};

export default function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
}
