# Architecture

## Pattern

**Next.js App Router (Server-first React)** — The codebase follows the Next.js App Router architecture introduced in Next.js 13+, where the framework owns routing through a file-system-based convention inside `src/app/`. Server Components are the default; Client Components are opt-in via `"use client"`.

---

## Layers

The codebase is intentionally shallow — a single-layer App Router project. If we draw layers by concern:

| Layer | Location | Role |
|---|---|---|
| **Routing / Pages** | `src/app/` | Route segments, layouts, pages. Next.js convention-driven. |
| **Styles** | `src/app/globals.css` + PostCSS | Global design tokens, Tailwind v4 theme, dark mode via CSS vars |
| **Static Assets** | `public/` | SVGs (next.svg, vercel.svg), favicon |
| **Framework Config** | `next.config.ts`, `tsconfig.json` | Build/runtime configuration |
| **Tooling** | `eslint.config.mjs`, `postcss.config.mjs`, `tailwindcss` v4 | Lint, CSS processing |

No custom business-logic layer exists yet. No API routes, no server actions, no database client, no state management library.

---

## Data Flow

```
Browser Request
      │
      ▼
Next.js Router (src/app/)
      │
      ├── layout.tsx        ← Root layout: font injection, metadata, HTML shell
      │       └── globals.css   ← Tailwind v4 CSS, dark mode vars, @theme inline
      │
      └── page.tsx          ← Page component (Server Component by default)
                  │
                  └── <Image> from next/image   ← Optimized asset delivery
```

**Current data flow is zero-data**: The page is fully static. No fetching, no server actions, no client state. It renders the Next.js scaffold landing page.

---

## Abstractions

| Abstraction | Details |
|---|---|
| **Path alias** | `@/*` maps to `./src/*` (tsconfig paths). Used in imports. |
| **Fonts** | `Geist` and `Geist_Mono` via `next/font/google`, exposed as CSS variables `--font-geist-sans` / `--font-geist-mono` |
| **Dark mode** | CSS custom properties (`--background`, `--foreground`) toggled via `prefers-color-scheme` media query |
| **CSS variables in Tailwind** | Tailwind v4 `@theme inline` block bridges CSS vars to design tokens |

No shared utility modules, no custom hooks, no data-access layer, no middleware — current abstractions are purely framework-provided.

---

## Entry Points

| Entry | File | Notes |
|---|---|---|
| **App entry** | `src/app/layout.tsx` | Root layout — HTML shell, font setup, metadata export |
| **Page entry** | `src/app/page.tsx` | Home route (`/`) — the scaffold landing page |
| **CSS entry** | `src/app/globals.css` | Imported by layout; Tailwind v4 processing |
| **Dev server** | `npm run dev` → `next dev` | Runs on port 3000 (default) |
| **Build** | `npm run build` → `next build` | Production build via Turbopack (?) |
| **Start** | `npm run start` → `next start` | Serves production build |

---

## Notable Observations

- **Very early stage**: The codebase is a fresh `create-next-app` scaffold. The scaffold includes a branded landing page pointing to Vercel templates and docs.
- **No `src/` subdirectories** beyond the required `app/` folder — all application code lives directly under `src/app/`.
- **Tailwind CSS v4**: Uses `@import "tailwindcss"` (v4 syntax) rather than the v3 `@tailwind base/components/utilities` directives. CSS config is in `globals.css` via `@theme inline`.
- **No API routes** (`src/app/api/`) present.
- **No `.env` variables** consumed in code (`.env.local` exists but content is not shown).
- **`@tailwindcss/postcss`** v4 is used as the PostCSS plugin, indicating Tailwind v4.
- **Strict TypeScript**: `strict: true` is enabled in tsconfig.
- **ESLint flat config**: Uses `eslint.config.mjs` (ESM/flat config format, ESLint v9).
- **Next.js 16.2.1** — bleeding-edge version.
- **React 19.2.4** — uses the latest React with new features (including the `"use server"` / `"use client"` directives on functions).
