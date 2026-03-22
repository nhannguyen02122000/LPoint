@AGENTS.md

<!-- GSD:project-start source:PROJECT.md -->
## Project

**LPoint — Chương trình tích điểm đổi quà**

App tích điểm cho quán ăn/café — khách hàng tích điểm sau mỗi lần mua hàng và đổi quà theo 6 mốc. USER hệ thống (STAFF/ADMIN) đăng nhập qua Clerk để thao tác. Khách hàng (CUSTOMER) chỉ có record trong InstantDB, không đăng nhập app.

Tên: **LPoint** | Target: quán ăn/café nhỏ | Year: 2026

---

**Core Value:** Khách hàng tích điểm dễ dàng mỗi lần mua, và luôn biết mình cần bao nhiêu điểm để đổi quà tiếp theo — tạo động lực quay lại.

---

### Constraints

- **Auth**: Clerk-only, no third-party SSO, no customer self-signup
- **Database**: InstantDB — phone is primary key for CUSTOMER
- **Point expiry**: Vercel cron job (API route) runs daily to zero expired points + log
- **Redemption rule**: 1 redemption = 1 tier only (cannot redeem 2 tiers at once)
- **Variable names**: English throughout
- **UI/UX**: Use /ui-ux-pro-max skill for frontend phases
- **DB sync**: Clerk + InstantDB via webhooks (setup steps required for user)

---
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Overview
## Language & Runtime
| Setting          | Value                          |
|------------------|--------------------------------|
| Language         | TypeScript (strict mode)       |
| Target           | ES2017                         |
| React version    | 19.2.4                         |
| Next.js version  | 16.2.1                         |
| Module system    | ESM (ESNext, `"bundler"` res.) |
## TypeScript
- **`strict: true`** — all strict type checks are on (no implicit any, etc.).
- **`noEmit: true`** — TypeScript is used for type-checking only; Next.js/Babel handles transpilation.
- **`isolatedModules: true`** — files must be valid standalone modules (no cross-file type inference that requires emit).
- **`jsx: "react-jsx"`** — uses the modern JSX transform (no `React` import required in JSX files, but still needed for `React.Something`).
- Import types explicitly: `import type { Foo } from "..."` to avoid runtime imports of purely type-level symbols.
## File & Directory Naming
| Kind                  | Convention            | Example                          |
|-----------------------|-----------------------|----------------------------------|
| Directories           | kebab-case            | `app/user-profile/`              |
| React components      | PascalCase (file & fn)| `UserCard.tsx`, `export default function UserCard` |
| Utility modules       | kebab-case            | `date-utils.ts`                  |
| Type/interface files  | kebab-case or match feature | `types/user.ts`           |
| CSS modules           | same name as component| `Component.module.css`           |
| Config files          | kebab-case / stdlib   | `eslint.config.mjs`, `next.config.ts` |
## Naming Conventions
- **Variables & functions**: `camelCase`
- **React components**: `PascalCase` (function name matches file name)
- **Types & interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE` for module-level primitives; `camelCase` for object constants
- **CSS classes**: Tailwind utility classes (kebab-case modifiers, e.g. `text-zinc-950`, `hover:bg-[#383838]`)
## Import Conventions
## React Patterns
### Server vs. Client Components
- **Default: Server Components** — no `"use client"` directive means the module runs on the server.
- Add `"use client"` at the top of a file **only** when the component or its imports use:
### Metadata
### Font Loading
### Image Component
## Error Handling
- **Expected errors** (invalid input, not-found): use `next/navigation` throw helpers (`notFound()`, `redirect()`) in Server Components, or return error states in Client Components.
- **Unexpected errors**: wrap in `try/catch` with typed error objects. Log errors server-side; never expose stack traces to the client.
- **Async operations**: always `await` with `try/catch`, or chain `.catch()` on promises.
- **Validation**: prefer Zod for runtime schema validation of API inputs and external data.
- **No silent catches**: every `catch` block must either handle the error or re-throw with context.
## CSS & Styling
- **Tailwind CSS v4** — utility-first; configured via `@tailwindcss/postcss` (CSS-based config, no `tailwind.config.ts` needed for basic setup).
- Global styles: `src/app/globals.css` (Tailwind directives + global resets).
- Component-scoped styles: CSS Modules (`Component.module.css`) when Tailwind alone is insufficient.
- Dark mode: use Tailwind's `dark:` variant on utility classes.
- **No inline styles** for layout/spacing — use Tailwind utilities.
- CSS custom properties (variables) via Tailwind's `var()` in `className` when needed.
## Module System & Exports
- Use **named exports** for utilities and hooks: `export const foo = ...`
- Use **default exports** for page/layout components: `export default function Page() { ... }`
- Avoid barrel files (`index.ts`) unless the module boundary is stable; use direct imports instead to keep tree-shaking effective.
## Async / Concurrency
- Prefer `async/await` over raw `.then().catch()` chains.
- Use `Promise.all()` for independent parallel operations; avoid sequential awaits when operations are independent.
- Avoid `useEffect` for data fetching; use React Server Components or a data-fetching library (e.g., TanStack Query) for client-side data.
## Linting & Formatting
- **ESLint** runs via `eslint-config-next` (core-web-vitals + TypeScript rulesets).
- **No Prettier config found** — adopt one if formatting drift becomes an issue.
- Run `npm run lint` before committing; CI enforces it.
- ESLint config is in `eslint.config.mjs` (flat config format for ESLint 9).
- ESLint ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
## Performance
- Prefer **React Server Components** for data fetching and static content.
- Use `dynamic()` or `next/dynamic` for heavy client-only components.
- Always add `priority` to above-the-fold `<Image>` components.
- Avoid large JS bundles in Client Components — keep client boundaries small.
## Security
- Never use `dangerouslySetInnerHTML` without sanitizing the content first (use a library like `DOMPurify`).
- Validate all external input with Zod (or equivalent) before using it.
- Keep sensitive values (API keys, secrets) out of the codebase — use environment variables via `.env.local` and `process.env`.
- Use `rel="noopener noreferrer"` on all external links with `target="_blank"`.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
## Layers
| Layer | Location | Role |
|---|---|---|
| **Routing / Pages** | `src/app/` | Route segments, layouts, pages. Next.js convention-driven. |
| **Styles** | `src/app/globals.css` + PostCSS | Global design tokens, Tailwind v4 theme, dark mode via CSS vars |
| **Static Assets** | `public/` | SVGs (next.svg, vercel.svg), favicon |
| **Framework Config** | `next.config.ts`, `tsconfig.json` | Build/runtime configuration |
| **Tooling** | `eslint.config.mjs`, `postcss.config.mjs`, `tailwindcss` v4 | Lint, CSS processing |
## Data Flow
```
```
## Abstractions
| Abstraction | Details |
|---|---|
| **Path alias** | `@/*` maps to `./src/*` (tsconfig paths). Used in imports. |
| **Fonts** | `Geist` and `Geist_Mono` via `next/font/google`, exposed as CSS variables `--font-geist-sans` / `--font-geist-mono` |
| **Dark mode** | CSS custom properties (`--background`, `--foreground`) toggled via `prefers-color-scheme` media query |
| **CSS variables in Tailwind** | Tailwind v4 `@theme inline` block bridges CSS vars to design tokens |
## Entry Points
| Entry | File | Notes |
|---|---|---|
| **App entry** | `src/app/layout.tsx` | Root layout — HTML shell, font setup, metadata export |
| **Page entry** | `src/app/page.tsx` | Home route (`/`) — the scaffold landing page |
| **CSS entry** | `src/app/globals.css` | Imported by layout; Tailwind v4 processing |
| **Dev server** | `npm run dev` → `next dev` | Runs on port 3000 (default) |
| **Build** | `npm run build` → `next build` | Production build via Turbopack (?) |
| **Start** | `npm run start` → `next start` | Serves production build |
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
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
