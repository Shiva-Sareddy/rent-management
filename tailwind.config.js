/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      spacing: {
        4: "4px",
        8: "8px",
        16: "16px",
        24: "24px",
        32: "32px",
      },
      fontFamily: {
        sans: ['"Open Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
