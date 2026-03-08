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
        background: "#f0f0f2",
        foreground: "#1a1a1a",
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
          DEFAULT: "#ffffff",
          light: "#f8f8fa",
          lighter: "#f0f0f2",
        },
        border: {
          DEFAULT: "rgba(0, 0, 0, 0.06)",
          light: "rgba(0, 0, 0, 0.08)",
        },
        muted: "#6b7280",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        title: ["var(--font-dm-sans)", "sans-serif"],
      },
      fontWeight: {
        "title-zen": "500",
      },
      boxShadow: {
        glow: "0 0 24px #6366f1, 0 0 48px #6366f180",
        "glow-sm": "0 0 12px #6366f180",
        "glow-green": "0 0 24px #10b981, 0 0 48px #10b98180",
        "glow-cyan": "0 0 12px #22d3ee80",
        "glass": "0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
        "glass-float": "0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
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
