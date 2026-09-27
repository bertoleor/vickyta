# Branding e identidad visual — VICKY

> Verificado en `public/manifest.json`, `app/layout.tsx`, `app/globals.css`, `tailwind.config.ts`, `AccentColorSelector.tsx`, `ThemeProvider.tsx`, `lib/constants.ts`.
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[producto]], [[pwa]]

## Marca

- **Nombre producto:** VICKY. **Nombre PWA:** "Vickyta Finanzas" (`short_name`: "Finanzas").
- **Descripción pública:** "Aplicación personal de finanzas para control de gastos".
- **Idioma:** `es-AR`, dirección `ltr`; categorías `finance` + `productivity`.
- **Tono:** voseo, frases cortas y amables; usuaria primaria mayor, poca fricción. Ejemplo en app: "¡Hola, {nombre}!".

## Paleta

- **Acento por defecto:** `#8B5CF6` (violeta, variable `--accent-color`; también `theme_color` del manifest).
- **Colores elegibles** (Apariencia → selector, se guardan en `user_preferences.accent_color`):
  | Nombre | Valor | Hex |
  | ------ | ----- | --- |
  | Azul Sistema | `azul` | `#8B5CF6` |
  | Rojo | `rojo` | `#EF4444` |
  | Índigo | `indigo` | `#6366F1` |
  | Verde | `verde` | `#10B981` |
  | Naranja | `naranja` | `#F97316` |
- **Sistema iOS-inspired** (`tailwind.config.ts`): `primary` (usa `--accent-color`), `secondary #5856D6`, fondos `#FFFFFF / #F2F2F7 / #E5E5EA`, texto `#000000 / #3C3C43 / #8E8E93 / #AEAEB2`, bordes `#C6C6C8 / #E5E5EA`, estados `success #34C759, warning #FF9500, danger #FF9F0A, info #5AC8FA`.
- **Modo oscuro:** clase `.dark` (`--background #000000`, texto invertido); tema `light/dark/system` (system sigue `prefers-color-scheme`).

## Tipografía

- **Primaria:** Inter (Google Fonts + `next/font`, variable `--font-inter`, `font-sans`).
- **Secundaria/decorativa:** Garet (`public/fonts/garet/Garet-Book.otf`, `Garet-Heavy.otf`).
- Estilo iOS: tracking tight en titulares, `fade-in`/`slide-up` sutiles, scrollbar fina, focus visible en acento.

## Iconografía y componentes

- **Iconos:** `lucide-react` en toda la app; `lib/constants.ts` mapea `icon_slug` de cada categoría a su icono (padres: shopping-cart, briefcase, home, coffee, credit-card + hijas específicas).
- **Cuentas por color:** banco azul, billetera violeta, efectivo verde, tarjeta naranja, deuda rojo.
- **Semáforo de gastos:** inevitable rojo, optimizable amarillo, evitable verde.
- **Componentes:** `Button`, `Card`/`GlassCard`, formularios grandes, modales (`AccountDetailsModal`, `TransactionDetailsModal`, `CategorizationModal`), charts (`CategoryPieChart`, `WeeklyBarChart` con `recharts`), toasts (`sonner`), tour de bienvenida (`WelcomeScreen`, `WelcomeTour`, `DashboardWithTour`).
- **Principio:** botones grandes, poco texto, un paso por vez.

## PWA visual

- `background_color #faf9fc`, `display standalone`, `orientation portrait-primary`.
- Iconos `icon-192.png` / `icon-512.png` (`any maskable round`); atajos "Agregar Gasto" → `/gastos` y "Ver Historial" → `/historial`.
