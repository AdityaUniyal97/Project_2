import type { Variants } from "framer-motion";

export const panelVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97, filter: "blur(4px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1.2,
      delay,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};
