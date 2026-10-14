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
        cricket: {
          dark: "#050914",
          navy: "#0a1128",
          card: "#111c38",
          cardHover: "#162347",
          border: "#1e2e5c",
          teal: "#00f5d4",
          emerald: "#10b981",
          gold: "#ff9f1c",
          crimson: "#ef4444",
          muted: "#8899b7",
        },
      },
      fontFamily: {
        sans: ["Nunito Sans", "system-ui", "sans-serif"],
        display: ["Barlow Condensed", "Arial Narrow", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
