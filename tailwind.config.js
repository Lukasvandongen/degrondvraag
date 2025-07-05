/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',          // ← voeg deze regel toe
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
