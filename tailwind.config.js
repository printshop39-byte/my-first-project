/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        marathi: ["'Tiro Devanagari Marathi'", "serif"],
        body: ["'Hind Vadodara'", "sans-serif"],
        mono: ["'Plus Jakarta Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
