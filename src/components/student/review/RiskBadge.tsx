import { motion } from "framer-motion";
import type { RiskLevel } from "./types";

interface RiskBadgeProps {
  level: RiskLevel;
}

const RISK_STYLES: Record<RiskLevel, string> = {
  LOW: "border-emerald-200/85 bg-emerald-50/80 text-emerald-700 shadow-[0_12px_28px_rgba(16,185,129,0.16)]",
  MEDIUM:
    "border-amber-200/85 bg-amber-50/80 text-amber-700 shadow-[0_12px_28px_rgba(245,158,11,0.14)]",
  HIGH: "border-orange-200/85 bg-orange-50/80 text-orange-700 shadow-[0_12px_28px_rgba(249,115,22,0.15)]",
  CRITICAL:
    "border-rose-200/90 bg-rose-50/80 text-rose-700 shadow-[0_12px_28px_rgba(244,63,94,0.16)]",
};

export default function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24 }}
      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide ${RISK_STYLES[level]}`}
    >
      {level} RISK
    </motion.span>
  );
}
