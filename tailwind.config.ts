import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#6C63FF", dark: "#4B44CC", light: "#8B83FF" },
        accent: { DEFAULT: "#00F5D4", dark: "#00C4AA", light: "#33FFE0" },
        neon: { blue: "#00D4FF", purple: "#B24BF3", pink: "#FF006E", green: "#39FF14" },
        surface: { DEFAULT: "#0F1021", light: "#1A1B3A", dark: "#080912", card: "#141528" },
        xp: "#FFD700",
        danger: "#FF4757",
        success: "#2ED573",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Orbitron", "sans-serif"],
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "neon-flicker": "neon-flicker 1.5s ease-in-out infinite alternate",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "gradient-x": "gradient-x 3s ease infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px #6C63FF, 0 0 20px #6C63FF40" },
          "50%": { boxShadow: "0 0 20px #6C63FF, 0 0 60px #6C63FF60" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "neon-flicker": {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": { textShadow: "0 0 7px #00F5D4, 0 0 10px #00F5D4, 0 0 21px #00F5D4" },
          "20%, 24%, 55%": { textShadow: "none" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(rgba(108,99,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "cyber-grid": "50px 50px",
      },
    },
  },
  plugins: [],
};

export default config;
