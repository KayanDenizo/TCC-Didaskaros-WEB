/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" },
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
      },
    },
  },
  plugins: [],
};
