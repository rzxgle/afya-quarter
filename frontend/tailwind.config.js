/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#CE0058", deep: "#A80048", tint: "#FCEBF2" },
        afyablue: "#0057B8",
        ink: { DEFAULT: "#333333", 2: "#5B5B60", 3: "#8A8A90" },
      },
      fontFamily: {
        sans: ['"Afya Sans Pro"', '"Afya Sans"', "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
