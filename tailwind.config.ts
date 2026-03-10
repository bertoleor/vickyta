import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===========================================
        // iOS SYSTEM COLORS (Inspired)
        // ===========================================
        
        // Primary Blue (iOS SystemBlue) - Uses CSS variable for accent color
        primary: {
          DEFAULT: "var(--accent-color, #8B5CF6)",
          50: "#EBF5FF",
          100: "#D1E9FF",
          200: "#A3D3FF",
          300: "#75BDFF",
          400: "#47A7FF",
          500: "var(--accent-color, #8B5CF6)",
          600: "#0062CC",
          700: "#004B99",
          800: "#003366",
          900: "#001B33",
        },

        // Secondary / System Indigo
        secondary: {
          DEFAULT: "#5856D6",
          500: "#5856D6",
        },

        // Backgrounds
        background: {
          DEFAULT: "#FFFFFF",
          secondary: "#F2F2F7", // iOS SystemGroupedBackground
          tertiary: "#E5E5EA",
        },

        // Neutral Grays
        text: {
          primary: "#000000",
          secondary: "#3C3C43", // iOS Label (with opacity normally, but #3C3C43 is a solid equivalent)
          tertiary: "#8E8E93",
          muted: "#AEAEB2",
        },

        // Surface / Borders
        border: {
          DEFAULT: "#C6C6C8",
          light: "#E5E5EA",
        },

        // Status colors
        success: "#34C759", // iOS SystemGreen
        warning: "#FF9500", // iOS SystemOrange
        danger: "#FF3B30",  // iOS SystemRed
        info: "#5AC8FA",    // iOS SystemTeal
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.04)",
        "soft-lg": "0 10px 25px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        blink: "blink 1s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
