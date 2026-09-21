import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ← voeg deze regel toe
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#0b0b0b",
        surface: "#111111",
        ink: "#e7e7e5",
        muted: "#969694",
        line: "#2a2a2a",
        accent: "#dededb",
        wash: "#1b1b1b",
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [typography],
};
