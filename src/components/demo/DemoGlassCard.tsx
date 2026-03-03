import type { HTMLAttributes } from "react";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DemoGlassCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={joinClasses(
        "rounded-3xl border border-white/40 bg-white/30 shadow-[0_25px_70px_rgba(29,78,216,0.09)] backdrop-blur-2xl",
        className,
      )}
    />
  );
}
