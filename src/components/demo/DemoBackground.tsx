import type { PropsWithChildren } from "react";

export default function DemoBackground({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e6effd] via-[#edf4ff] to-[#f2f7ff] text-slate-800">
      <div
        className="pointer-events-none absolute -left-[18%] -top-[14%] h-[58vh] w-[58vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(168,206,255,0.44) 0%, rgba(214,231,255,0.2) 56%, transparent 82%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-[-12%] top-[16%] h-[52vh] w-[52vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(178,216,255,0.34) 0%, rgba(222,238,255,0.16) 58%, transparent 84%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-18%] left-[26%] h-[50vh] w-[50vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(186,220,255,0.36) 0%, rgba(229,241,255,0.16) 54%, transparent 82%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(128deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 45%, rgba(255,255,255,0.28) 100%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
