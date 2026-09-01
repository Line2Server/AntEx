import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f0",
          100: "#faefd8",
          200: "#f4dab0",
          300: "#ecc07f",
          400: "#e09f4d",
          500: "#d4832b",
          600: "#b86820",
          700: "#96501c",
          800: "#7a401d",
          900: "#64361a",
          950: "#371a0b",
        },
        coffee: {
          dark: "#1a0f08",
          medium: "#3d1f0f",
          light: "#6b3a1f",
          cream: "#f5e6d3",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "coffee-grain": "url('/grain.svg')",
      },
      boxShadow: {
        glow: "0 0 20px rgba(212, 131, 43, 0.3)",
        "glow-lg": "0 0 40px rgba(212, 131, 43, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
