# VICKY — App financiera PWA + bot de Telegram

Aplicación web progresiva para la gestión de finanzas personales con registro de gastos
por Telegram y un espejo completo en la app.

- **Documentación**: todo vive en [`docs/`](./docs/README.md) — producto, spec y planes.
- **Doc de producto**: [`docs/producto.md`](./docs/producto.md)

## Requisitos

- Node.js 18+
- Cuenta de Supabase (proyecto `vicky`)

## Instalación local

1. Instalá las dependencias:
   ```bash
   npm install
   ```
2. Configurá las variables de entorno en un archivo `.env.local` (ver `.env.example`).
3. Corré el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Scripts

| Comando         | Descripción                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Servidor de desarrollo       |
| `npm run build` | Build de producción          |
| `npm run start` | Servidor de producción       |
| `npm run lint`  | Lint                         |

## Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS 4 · Supabase (RLS) · Telegram Bot API