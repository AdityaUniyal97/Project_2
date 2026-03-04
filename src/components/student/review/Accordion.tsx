import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export interface AccordionItem {
  id: string;
  topic: string;
  title: string;
  detail: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openItemId, setOpenItemId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const open = openItemId === item.id;

        return (
          <div key={item.id} className="overflow-hidden rounded-2xl border border-white/60 bg-white/35">
            <button
              type="button"
              onClick={() => setOpenItemId((current) => (current === item.id ? null : item.id))}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
            >
              <span className="inline-flex shrink-0 rounded-full border border-blue-200/80 bg-blue-50/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700">
                {item.topic}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800">{item.title}</span>
              <motion.svg
                viewBox="0 0 16 16"
                className="h-4 w-4 text-slate-500"
                aria-hidden
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  d="M3.6 6.2L8 10.4L12.4 6.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </button>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/60"
                >
                  <p className="px-3.5 py-3 text-sm text-slate-600">{item.detail}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
