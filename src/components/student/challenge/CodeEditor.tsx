import { useMemo, useRef, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { BUTTON_INTERACTIVE_CLASS, INPUT_GLOW_CLASS } from "../../ui/glass";

export type EditorLanguage = "javascript" | "python";

interface CodeEditorProps {
  code: string;
  language: EditorLanguage;
  onCodeChange: (nextCode: string) => void;
  onLanguageChange: (language: EditorLanguage) => void;
  onRunTests: () => void;
  isRunning: boolean;
}

const LANGUAGE_OPTIONS: Array<{ label: string; value: EditorLanguage }> = [
  { label: "JS", value: "javascript" },
  { label: "Python", value: "python" },
];

export default function CodeEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onRunTests,
  isRunning,
}: CodeEditorProps) {
  const lineNumberRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const lineNumbers = useMemo(() => {
    const lineCount = Math.max(code.split("\n").length, 12);
    return Array.from({ length: lineCount }, (_, index) => index + 1);
  }, [code]);

  const onTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") return;

    event.preventDefault();
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${code.slice(0, start)}  ${code.slice(end)}`;
    onCodeChange(nextValue);

    window.requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/35 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-xl border border-white/65 bg-white/50 p-1">
          {LANGUAGE_OPTIONS.map((option) => {
            const isActive = option.value === language;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onLanguageChange(option.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-white/85 text-slate-800 shadow-[0_6px_16px_rgba(30,64,175,0.14)]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                aria-pressed={isActive}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onRunTests}
          disabled={isRunning}
          className={`inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(14,116,220,0.25)] transition ${
            isRunning
              ? "cursor-not-allowed opacity-65"
              : "hover:translate-y-[-1px] hover:shadow-[0_18px_36px_rgba(14,116,220,0.29)]"
          } ${BUTTON_INTERACTIVE_CLASS}`}
        >
          {isRunning ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
                <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Running...
            </>
          ) : (
            "Run Tests"
          )}
        </motion.button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-900/85 text-slate-100">
        <div className="flex h-[420px]">
          <div
            ref={lineNumberRef}
            className="w-12 shrink-0 overflow-hidden border-r border-white/10 bg-slate-900/90 px-2 py-3 text-right font-mono text-[12px] leading-6 text-slate-500"
            aria-hidden
          >
            {lineNumbers.map((lineNumber) => (
              <div key={lineNumber}>{lineNumber}</div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            onKeyDown={onTextareaKeyDown}
            onScroll={(event) => {
              if (lineNumberRef.current) {
                lineNumberRef.current.scrollTop = event.currentTarget.scrollTop;
              }
            }}
            spellCheck={false}
            className={`h-full w-full resize-none border-0 bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-slate-100 outline-none ${INPUT_GLOW_CLASS}`}
            aria-label="Coding editor"
          />
        </div>
      </div>
    </div>
  );
}
