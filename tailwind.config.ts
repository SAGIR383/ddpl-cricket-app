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
        // Style D — Premium League Design System Tokens
        league: {
          midnight: "#08111F",
          navy: "#0D1B2A",
          surface: "#111D2D",
          surfaceHover: "#18273D",
          border: "rgba(216, 173, 85, 0.2)",
          borderSubtle: "rgba(255, 255, 255, 0.08)",
          gold: "#D8AD55",
          goldChampagne: "#F2D69A",
          goldDark: "#9A7528",
          warmWhite: "#F7F5F0",
          mutedSlate: "#8793A5",
          cyan: "#00F5D4",
          emerald: "#10B981",
          crimson: "#EF4444",
        },
        // Backward compatibility tokens
        cricket: {
          dark: "#08111F",
          navy: "#0D1B2A",
          card: "#111D2D",
          cardHover: "#18273D",
          border: "#1E2E5C",
          teal: "#00F5D4",
          emerald: "#10B981",
          gold: "#D8AD55",
          crimson: "#EF4444",
          muted: "#8793A5",
        },
      },
      fontFamily: {
        sans: ["Nunito Sans", "system-ui", "-apple-system", "sans-serif"],
        display: ["Barlow Condensed", "Arial Narrow", "sans-serif"],
        editorial: ["Playfair Display", "Merriweather", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
