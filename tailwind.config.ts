import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./animations/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"]
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb"
        }
      },
      boxShadow: {
        soft: "0 20px 55px rgba(37, 99, 235, 0.16)",
        glass:
          "0 8px 32px rgba(30, 64, 175, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(140deg, #ffffff 0%, #edf4ff 100%)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
