import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===========================================
        // AURORA PASTEL COLOR PALETTE
        // ===========================================
        
        // Principal - Lavanda (#D9C2EA)
        // Usar para: acentos principales, estados activos/hover, bordes de tarjetas seleccionadas,
        // iconos destacados en navegación, elementos interactivos primarios
        primary: {
          DEFAULT: "#D9C2EA",
          50: "#FBF9FD",
          100: "#F7F3FB",
          200: "#EFE7F6",
          300: "#E5D8F1",
          400: "#D9C2EA",     // Base
          500: "#C9ACE0",     // Hover
          600: "#B896D6",     // Active
          700: "#9A72C4",     // Darker
          800: "#7B4EA8",     // Deep
          900: "#5E3A8C",     // Darkest
        },

        // Secundario - Cian Pastel (#C2E3EA)
        // Usar para: frescura y profundidad aurora boreal en glassmorphism,
        // badges de categorías secundarias, acentos en gráficos
        secondary: {
          DEFAULT: "#C2E3EA",
          50: "#F7FCFD",
          100: "#EFF9FB",
          200: "#DFF4F7",
          300: "#C2E3EA",     // Base
          400: "#A5D5DE",     // Hover
          500: "#88C7D2",     // Active
          600: "#6BB9C6",     // Darker
          700: "#4A9FB0",     // Deep
          800: "#3A859A",     // Deeper
          900: "#2A6B84",     // Darkest
        },

        // Acento - Rosa Viejo (#EAC2D2)
        // Usar para: calidez sin romper estética pastel, alertas suaves,
        // notificaciones, indicadores de gastos importantes, hover secundario
        accent: {
          DEFAULT: "#EAC2D2",
          50: "#FDF9FB",
          100: "#FBF3F6",
          200: "#F7E7ED",
          300: "#F2D8E2",
          400: "#EAC2D2",     // Base
          500: "#E0AAC0",     // Hover
          600: "#D692AE",     // Active
          700: "#C67294",     // Darker
          800: "#B2527A",     // Deep
          900: "#9E3260",     // Darkest
        },

        // Fondo UI - Blanco Hueso (#F9F7FD)
        // Usar para: fondo principal de la aplicación, modales, áreas de contenido
        background: {
          DEFAULT: "#F9F7FD",
          secondary: "#FFFFFF",
          tertiary: "#F5F2FA",
        },

        // Texto Bold - Ciruela Oscuro (#4A3B5A)
        // Usar para: texto principal, títulos, labels de formularios, alta legibilidad
        text: {
          primary: "#4A3B5A",
          secondary: "#6B5B7A",
          tertiary: "#9B8BA8",
          muted: "#B8A8C4",
        },

        // Border colors
        border: {
          DEFAULT: "#E5D8F1",
          dark: "#D9C2EA",
          light: "#F7F3FB",
        },

        // Status colors - Soft pastel versions
        success: "#B8D8C0",
        warning: "#E8D4A8",
        danger: "#E8B8B8",
        info: "#B8C8E8",

        // Glass effect colors - Aurora pastel
        glass: {
          light: "rgba(255, 255, 255, 0.80)",
          lavender: "rgba(217, 194, 234, 0.20)",
          cyan: "rgba(194, 227, 234, 0.20)",
          rose: "rgba(234, 194, 210, 0.20)",
          border: "rgba(217, 194, 234, 0.35)",
        },
      },
      fontFamily: {
        sans: ["var(--font-garet)", "Inter", "system-ui", "sans-serif"],
        script: ["Dancing Script", "Noteworthy", "cursive"],
        display: ["Poppins", "var(--font-garet)", "system-ui", "sans-serif"],
        delicate: ["Quicksand", "var(--font-garet)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(74, 59, 90, 0.08)",
        "glass-lg": "0 12px 48px rgba(74, 59, 90, 0.12)",
        soft: "0 2px 16px rgba(74, 59, 90, 0.04)",
        "soft-lg": "0 4px 24px rgba(74, 59, 90, 0.06)",
        aurora: "0 8px 32px rgba(217, 194, 234, 0.15)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-out-left": "slideOutLeft 0.3s ease-out",
        blink: "blink 1s infinite",
        "typewriter": "typewriter 0.1s steps(1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideOutLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
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
