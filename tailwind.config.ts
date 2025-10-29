import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: "#3B82F6",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        // Glass surfaces
        glass: {
          light: "rgba(255, 255, 255, 0.55)",
          "light-hover": "rgba(255, 255, 255, 0.65)",
          "light-border": "rgba(255, 255, 255, 0.25)",
          "light-input": "rgba(255, 255, 255, 0.8)",
          dark: "rgba(17, 25, 40, 0.65)",
          "dark-hover": "rgba(17, 25, 40, 0.75)",
          "dark-border": "rgba(255, 255, 255, 0.08)",
          "dark-input": "rgba(255, 255, 255, 0.08)",
        },
        // Background colors
        background: {
          light: "#F4F6FB",
          dark: "#0E1117",
        },
        // Text colors
        text: {
          primary: {
            light: "#0A0F1F",
            dark: "#F9FAFB",
          },
          secondary: {
            light: "#4B5563",
            dark: "#9CA3AF",
          },
          muted: {
            light: "#6B7280",
            dark: "#6B7280",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backdropBlur: {
        glass: "16px",
        "glass-dark": "18px",
      },
      boxShadow: {
        "glass-light": "0 4px 12px rgba(0, 0, 0, 0.08)",
        "glass-dark": "0 6px 20px rgba(0, 0, 0, 0.4)",
        "glow-primary": "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-secondary": "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-success": "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-error": "0 0 20px rgba(239, 68, 68, 0.3)",
      },
      borderRadius: {
        glass: "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glass-reveal": "glassReveal 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glassReveal: {
          "0%": { backdropFilter: "blur(0px)", opacity: "0" },
          "100%": { backdropFilter: "blur(16px)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
