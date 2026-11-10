import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#263238",
        muted: "#65747a",
        forest: "#486958",
        mint: "#e4f5ec",
        line: "#e5eaec",
        mist: "#f7f9f8",
        sky: "#e3f2fd",
        butter: "#fff7db",
        blush: "#fce7f0",
        lilac: "#f0eafe",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
      borderRadius: {
        card: "4px",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(38, 50, 56, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
