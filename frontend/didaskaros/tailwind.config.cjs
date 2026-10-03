/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { archivo: ["Archivo", "sans-serif"] },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pageIn: {
          "0%": { opacity: 0, transform: "translateY(6px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: 1 },
          "50%": { transform: "scale(1.08)", opacity: 0.85 },
        },
        sparkle: {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(14deg) scale(1.15)" },
        },
        formIn: {
          "0%": { opacity: 0, transform: "translateX(12px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-5px)" },
          "40%, 80%": { transform: "translateX(5px)" },
        },
        popIn: {
          "0%": { opacity: 0, transform: "scale(0.5)" },
          "60%": { transform: "scale(1.15)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.35s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        "pop-in": "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        "page-in": "pageIn 0.4s cubic-bezier(0.22,1,0.36,1)",
        "form-in": "formIn 0.35s cubic-bezier(0.22,1,0.36,1)",
        shake: "shake 0.4s ease-in-out",
        breathe: "breathe 2.4s ease-in-out infinite",
        sparkle: "sparkle 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
