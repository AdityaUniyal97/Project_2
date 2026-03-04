import { motion } from "framer-motion";
import { GLASS_INTERACTIVE_CLASS } from "../../ui/glass";

interface MetricCardProps {
  index: number;
  label: string;
  value: string;
  helper: string;
}

export default function MetricCard({ index, label, value, helper }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.05 }}
      className={`glass-edge rounded-2xl border border-white/65 bg-white/45 p-4 ${GLASS_INTERACTIVE_CLASS}`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </motion.div>
  );
}
