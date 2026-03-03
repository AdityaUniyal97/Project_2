import type { HTMLAttributes } from "react";
import { GLASS_EDGE_CLASS, GLASS_PANEL_CLASS } from "../ui/glass";

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
        GLASS_PANEL_CLASS,
        GLASS_EDGE_CLASS,
        className,
      )}
    />
  );
}
