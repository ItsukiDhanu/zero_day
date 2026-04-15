import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        phosphor: "#00FF41",
        "terminal-amber": "#FFCC33",
      },
      fontFamily: {
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,255,65,0.2), 0 0 24px rgba(0,255,65,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
