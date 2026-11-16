/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        archivo: ["Archivo", "sans-serif"],
        display: ["Manrope", "Inter", "sans-serif"],
      },
      // paleta da landing page
      colors: {
        brand: { DEFAULT: "#3B5BDB", 2: "#5C7CFA", accent: "#74C0FC" },
        ink: "#0F172A",
        muted: { DEFAULT: "#F0F4F9", foreground: "#535F6F" },
        border: "#DFE5ED",
        background: "#F8FAFD",
        success: "#22C55E",
      },
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
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) rotate(0)" },
          "50%": { transform: "translateY(-14px) rotate(0.3deg)" },
        },
        floatSlower: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-22px)" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(59,91,219,0.45)" },
          "100%": { boxShadow: "0 0 0 18px rgba(59,91,219,0)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.08)" },
          "66%": { transform: "translate(-25px, 25px) scale(0.95)" },
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
        float: "floatSlow 7s ease-in-out infinite",
        "float-slow": "floatSlower 9s ease-in-out infinite",
        "fade-up": "fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
        gradient: "gradientShift 8s ease infinite",
        "pulse-ring": "pulseRing 2.2s cubic-bezier(0.66,0,0,1) infinite",
        blob: "blob 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
