# Directory Structure

## Top-Level Layout

```
lpoint/                        # Project root
├── .cursor/                   # Cursor IDE agents (GSd "Get Shit Done" workflow)
│   ├── agents/                # Agent definitions (gsd-*.md)
│   ├── gsd-file-manifest.json # Manifest of generated files
│   └── get-shit-done/          # GSD versioning / workflow config
├── .env.local                 # Local env vars (gitignored)
├── .planning/                 # Planning output (this doc lives here)
│   └── codebase/
├── node_modules/              # Installed packages
├── public/                    # Static assets served at / (root)
├── src/                       # Source code
│   └── app/                   # Next.js App Router
│       ├── favicon.ico
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── eslint.config.mjs          # ESLint flat config
├── next.config.ts             # Next.js configuration
├── package-lock.json          # Locked dependency tree
├── package.json               # Project manifest & scripts
├── postcss.config.mjs         # PostCSS (Tailwind v4) config
├── program.docx               # (Unknown — likely a brief or spec doc)
├── README.md                  # Project readme
├── skills-lock.json           # Locked agent skills
└── tsconfig.json              # TypeScript configuration
```

---

## Key Locations

| Path | Purpose |
|---|---|
| `src/app/layout.tsx` | Root layout — HTML shell, fonts, metadata |
| `src/app/page.tsx` | Home page (`/`) |
| `src/app/globals.css` | Global styles + Tailwind v4 theme |
| `public/` | Static assets (SVGs, images served as-is) |
| `.env.local` | Environment variables (not committed) |
| `.planning/` | Generated planning / architecture docs |

---

## Naming Conventions

| Convention | Pattern | Example |
|---|---|---|
| **Pages / Layouts** | `camelCase.tsx` | `page.tsx`, `layout.tsx` |
| **CSS** | `kebab-case.css` | `globals.css` |
| **Config files** | `kebab-case.ext` or `camelCase.ext` | `eslint.config.mjs`, `next.config.ts` |
| **Package name** | `lowercase` | `lpoint` |
| **Path alias** | `@/*` | `@/app/layout` → `./src/app/layout.tsx` |
| **CSS variables** | `kebab-case` with prefix | `--background`, `--foreground` |
| **Tailwind theme tokens** | CSS variable names | `text-foreground`, `bg-background` |
| **TypeScript** | `PascalCase` for types/interfaces | (none defined yet) |
| **Cursor agents** | `kebab-case.md` | `gsd-codebase-mapper.md` |

---

## Conventions Observed

### Next.js App Router

- `src/app/` is the routing root. File names are convention-driven:
  - `page.tsx` — route segment
  - `layout.tsx` — shared layout wrapper
  - `loading.tsx`, `error.tsx`, `not-found.tsx` — optional loading/error boundaries
- Default component type is **Server Component** (no `"use client"` directive).
- `"use client"` is added at the **top of the file** (not per-function) to mark Client Components.

### CSS / Styling

- **Tailwind v4** with `@import "tailwindcss"` — no `tailwind.config.js` yet.
- Design tokens defined as CSS custom properties in `:root` / `@theme inline`.
- Dark mode via `prefers-color-scheme` media query (no class-based toggle).
- `Geist` and `Geist_Mono` fonts loaded via `next/font/google` and exposed as CSS variables.

### TypeScript

- Strict mode enabled.
- JSX via `react-jsx` transform (React 17+ new JSX transform).
- Path alias `@/*` → `./src/*` configured in both `tsconfig.json` and recognized by Next.js.

### Tooling

- **ESLint**: Flat config (`eslint.config.mjs`, ESLint v9).
- **PostCSS**: Single plugin — `@tailwindcss/postcss` (Tailwind v4).
- **Build**: `next build` (uses Turbopack in dev, Rspack in production as of Next.js 16).
