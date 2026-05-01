/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090d",
          900: "#0b0f16",
          850: "#101620",
          800: "#151d2a",
          700: "#223044",
        },
        signal: {
          cyan: "#4dd0e1",
          green: "#7ed957",
          amber: "#f6c350",
          red: "#ff6b6b",
        },
      },
      boxShadow: {
        panel: "0 20px 60px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};
