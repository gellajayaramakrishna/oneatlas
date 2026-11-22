import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#0b0d12", soft: "#3b4252", muted: "#6b7280" },
        accent: { DEFAULT: "#4f46e5", soft: "#eef2ff" },
      },
    },
  },
  plugins: [],
} satisfies Config;
