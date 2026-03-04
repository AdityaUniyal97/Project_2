import AmbientScene, { type AmbientVariant } from "./AmbientScene";

interface AmbientInnerBackgroundProps {
  variant: AmbientVariant;
  className?: string;
  debug?: boolean;
}

export default function AmbientInnerBackground({
  variant,
  className,
  debug = false,
}: AmbientInnerBackgroundProps) {
  return <AmbientScene variant={variant} className={className} debug={debug} />;
}

export type { AmbientVariant };
