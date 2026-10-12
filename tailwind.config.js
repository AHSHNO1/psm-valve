/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        silver: {
          50: "#F8F9FA", 100: "#F1F3F5", 200: "#E5E7EB", 300: "#D1D5DB",
          400: "#9CA3AF", 500: "#C0C0C0", 600: "#8B8F94", 700: "#5F6368",
          800: "#3A3D42", 900: "#1F2124", 950: "#0F1114"
        },
        gold: {
          50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D",
          400: "#FBBF24", 500: "#FFD700", 600: "#F5C518", 700: "#D4A017",
          800: "#A87B0F", 900: "#785608"
        }
      },
      fontFamily: {
        sans: ["Vazirmatn", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "silver-gradient": "linear-gradient(135deg, #E5E7EB 0%, #C0C0C0 45%, #9CA3AF 100%)",
        "gold-gradient": "linear-gradient(135deg, #FFD700 0%, #F5C518 50%, #D4A017 100%)",
        "dark-metal": "linear-gradient(160deg, #0F1114 0%, #1F2124 50%, #3A3D42 100%)"
      },
      animation: {
        shine: "shine 3s linear infinite",
        float: "float 6s ease-in-out infinite"
      },
      keyframes: {
        shine: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      }
    }
  },
  plugins: []
};
