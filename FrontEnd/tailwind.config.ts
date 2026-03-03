import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
    },
    extend: {
      colors: {
        background: "#0f0f0f",
        "background-alt": "#151515",
        "background-row-alt": "#1f1f1f",
        "background-row": "#262626",
        accent: "#fdc71c",
        "accent-green": "#00a900",
        "text-primary": "#ffffff",
        "text-secondary": "#707070",
        border: "#323232",
        "border-divider": "#707070",
        "draft-blue": "#3ca1ff",
      },
      fontFamily: {
        sans: ["var(--font-open-sans)", "sans-serif"],
        "noto": ["var(--font-noto-sans)", "sans-serif"],
        mono: ["Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
