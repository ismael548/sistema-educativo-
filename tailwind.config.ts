import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0d0f12",
          surface: "#13161c",
          elevated: "#1a1f26",
          border: "#232a35",
          highlight: "#2d3644",
        },
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: {
          cyan: "#00d2ff",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
        text: {
          primary: "#f3f4f6",
          secondary: "#9ca3af",
          muted: "#6b7280",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.25)",
        surface: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      }
    },
  },
  plugins: [],
};
export default config;
