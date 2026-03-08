import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        foreground: "#e2e8f0",
        primary: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          dark: "#4f46e5",
        },
        secondary: {
          DEFAULT: "#22d3ee",
          light: "#67e8f9",
          dark: "#06b6d4",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#34d399",
        },
        surface: {
          DEFAULT: "#111118",
          light: "#1a1a24",
          lighter: "#24243a",
        },
        border: {
          DEFAULT: "#2a2a3e",
          light: "#3a3a52",
        },
        muted: "#64748b",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px #6366f1, 0 0 48px #6366f180",
        "glow-sm": "0 0 12px #6366f180",
        "glow-green": "0 0 24px #10b981, 0 0 48px #10b98180",
        "glow-cyan": "0 0 12px #22d3ee80",
      },
      keyframes: {
        pulse_border: {
          "0%, 100%": { borderColor: "#6366f1" },
          "50%": { borderColor: "#818cf8" },
        },
        fade_in: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slide_in_right: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulse_border: "pulse_border 2s ease-in-out infinite",
        fade_in: "fade_in 0.3s ease-out",
        slide_in_right: "slide_in_right 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
