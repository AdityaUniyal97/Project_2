import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import DemoGlassCard from "../../components/demo/DemoGlassCard";
import { useTeacherData } from "../../components/teacher/TeacherDataContext";
import { BUTTON_INTERACTIVE_CLASS, GLASS_INTERACTIVE_CLASS, INPUT_GLOW_CLASS } from "../../components/ui/glass";

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/55 bg-white/40 px-3.5 py-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
          value ? "border-blue-300/80 bg-blue-500/85" : "border-white/70 bg-slate-200/70"
        } ${BUTTON_INTERACTIVE_CLASS}`}
        aria-pressed={value}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            value ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function TeacherSettingsPage() {
  const { settings, updateSettings } = useTeacherData();
  const [showSavedToast, setShowSavedToast] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onSave = () => {
    setShowSavedToast(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setShowSavedToast(false);
      timeoutRef.current = null;
    }, 1800);
  };

  return (
    <motion.main
      className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <AnimatePresence>
        {showSavedToast ? (
          <motion.div
            className="mb-3 rounded-xl border border-emerald-200/75 bg-emerald-50/80 px-3 py-2 text-sm font-semibold text-emerald-700"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            Settings saved successfully.
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DemoGlassCard className={`p-5 sm:p-6 ${GLASS_INTERACTIVE_CLASS}`}>
        <h2 className="text-base font-semibold text-slate-900">Teacher Controls</h2>
        <p className="mt-1 text-xs text-slate-600">UI-only runtime controls for demo behavior.</p>

        <div className="mt-4 grid gap-3">
          <ToggleRow
            label="Auto analysis"
            value={settings.autoAnalysis}
            onToggle={() => updateSettings({ autoAnalysis: !settings.autoAnalysis })}
          />
          <ToggleRow
            label="Strict mode"
            value={settings.strictMode}
            onToggle={() => updateSettings({ strictMode: !settings.strictMode })}
          />
          <ToggleRow
            label="Viva required for high risk"
            value={settings.vivaRequiredForHighRisk}
            onToggle={() => updateSettings({ vivaRequiredForHighRisk: !settings.vivaRequiredForHighRisk })}
          />

          <div className="rounded-xl border border-white/55 bg-white/40 px-3.5 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">Similarity threshold</p>
              <span className="rounded-full border border-blue-200/75 bg-blue-50/70 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {settings.similarityThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={95}
              value={settings.similarityThreshold}
              onChange={(event) => updateSettings({ similarityThreshold: Number(event.target.value) })}
              className={`w-full accent-blue-500 ${INPUT_GLOW_CLASS}`}
            />
          </div>

          <div className="rounded-xl border border-white/55 bg-white/40 px-3.5 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">Confidence threshold</p>
              <span className="rounded-full border border-indigo-200/75 bg-indigo-50/70 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {settings.confidenceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min={30}
              max={99}
              value={settings.confidenceThreshold}
              onChange={(event) => updateSettings({ confidenceThreshold: Number(event.target.value) })}
              className={`w-full accent-indigo-500 ${INPUT_GLOW_CLASS}`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onSave}
          className={`mt-4 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(14,116,220,0.22)] transition hover:translate-y-[-1px] ${BUTTON_INTERACTIVE_CLASS}`}
        >
          Save Settings
        </button>
      </DemoGlassCard>
    </motion.main>
  );
}
