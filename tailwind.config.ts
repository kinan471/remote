import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          400: "#FF8C42",
          500: "#FF6000",
          600: "#E55400",
          700: "#CC4A00",
        },
        dark: {
          50:  "#F5F5F5",
          100: "#E0E0E0",
          200: "#C2C2C2",
          300: "#9E9E9E",
          400: "#757575",
          500: "#424242",
          600: "#212121",
          700: "#1A1A1A",
          800: "#141414",
          900: "#0A0A0A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "pulse-orange": "pulseOrange 2s infinite",
        "bounce-subtle": "bounceSubtle 1s infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseOrange: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 96, 0, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255, 96, 0, 0)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
