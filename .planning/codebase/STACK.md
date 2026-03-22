# Technology Stack

## Languages & Runtime

| Language | Version | Role |
|----------|---------|------|
| JavaScript / JSX | ES2017+ | Primary UI language |
| TypeScript | ^5 | Type-safe superset of JS, used throughout |
| CSS | PostCSS + Tailwind v4 | Styling |

## Frontend Framework

- **Next.js** `16.2.1` — Full-stack React framework (App Router)
- **React** `19.2.4` — UI library
- **React DOM** `19.2.4` — DOM rendering

## Styling

- **Tailwind CSS** `^4` — Utility-first CSS framework
- **@tailwindcss/postcss** `^4` — Tailwind v4 PostCSS integration
- **PostCSS** — CSS transformation pipeline (via `@tailwindcss/postcss`)

## TypeScript Support

- **@types/node** `^20`
- **@types/react** `^19`
- **@types/react-dom** `^19`

## Code Quality & Linting

- **ESLint** `^9` — Linter with flat config
- **eslint-config-next** `16.2.1` — Next.js ESLint preset (core-web-vitals + TypeScript rules)
- **TypeScript** `^5` — Compiled with strict mode enabled

## Fonts

- **Geist** (via `next/font/google`) — Variable font family (sans + mono), self-hosted by Next.js

## Build & Tooling

- **Next.js bundler** (Rust-based, SWC) — Builds and dev server
- **TypeScript compiler** — Strict mode, `moduleResolution: bundler`, path alias `@/*` → `./src/*`
- **PostCSS** — Configured for Tailwind v4 via `@tailwindcss/postcss`

## Path Aliases

- `@/*` maps to `./src/*` (configured in `tsconfig.json`)

## Environment Variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Client-exposed Clerk publishable key (test)
- `CLERK_SECRET_KEY` — Server-only Clerk secret key (test)

## Package Manager

- npm (inferred from `package-lock.json`)
