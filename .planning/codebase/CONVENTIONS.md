# Code Conventions

## Overview

This document records the coding standards, patterns, and conventions enforced (or adopted) in this codebase. It was reverse-engineered from the actual source files and configuration.

---

## Language & Runtime

| Setting          | Value                          |
|------------------|--------------------------------|
| Language         | TypeScript (strict mode)       |
| Target           | ES2017                         |
| React version    | 19.2.4                         |
| Next.js version  | 16.2.1                         |
| Module system    | ESM (ESNext, `"bundler"` res.) |

---

## TypeScript

- **`strict: true`** — all strict type checks are on (no implicit any, etc.).
- **`noEmit: true`** — TypeScript is used for type-checking only; Next.js/Babel handles transpilation.
- **`isolatedModules: true`** — files must be valid standalone modules (no cross-file type inference that requires emit).
- **`jsx: "react-jsx"`** — uses the modern JSX transform (no `React` import required in JSX files, but still needed for `React.Something`).
- Import types explicitly: `import type { Foo } from "..."` to avoid runtime imports of purely type-level symbols.

---

## File & Directory Naming

| Kind                  | Convention            | Example                          |
|-----------------------|-----------------------|----------------------------------|
| Directories           | kebab-case            | `app/user-profile/`              |
| React components      | PascalCase (file & fn)| `UserCard.tsx`, `export default function UserCard` |
| Utility modules       | kebab-case            | `date-utils.ts`                  |
| Type/interface files  | kebab-case or match feature | `types/user.ts`           |
| CSS modules           | same name as component| `Component.module.css`           |
| Config files          | kebab-case / stdlib   | `eslint.config.mjs`, `next.config.ts` |

---

## Naming Conventions

- **Variables & functions**: `camelCase`
  ```ts
  const fetchUserData = async (id: string) => { ... };
  ```
- **React components**: `PascalCase` (function name matches file name)
  ```tsx
  // page.tsx
  export default function Page() { ... }
  ```
- **Types & interfaces**: `PascalCase`
  ```ts
  type UserProfile = { id: string; name: string; };
  interface ApiResponse<T> { data: T; error: string | null; }
  ```
- **Constants**: `SCREAMING_SNAKE_CASE` for module-level primitives; `camelCase` for object constants
  ```ts
  const MAX_RETRIES = 3;
  const defaultHeaders = { "Content-Type": "application/json" };
  ```
- **CSS classes**: Tailwind utility classes (kebab-case modifiers, e.g. `text-zinc-950`, `hover:bg-[#383838]`)

---

## Import Conventions

1. **Type imports first**, then side-effect imports, then relative imports, then aliased (`@/`) imports — or grouped and separated by blank lines.
2. Always use `import type` for purely type-level imports:
   ```ts
   import type { Metadata } from "next";
   import Image from "next/image";
   import "@/styles/globals.css";
   ```
3. Use the `@/` path alias (mapped to `./src/`) for all internal imports:
   ```ts
   import { Button } from "@/components/ui/button";
   ```

---

## React Patterns

### Server vs. Client Components

- **Default: Server Components** — no `"use client"` directive means the module runs on the server.
- Add `"use client"` at the top of a file **only** when the component or its imports use:
  - Browser-only APIs (`window`, `document`, etc.)
  - React hooks (`useState`, `useEffect`, etc.)
  - Event handlers (`onClick`, `onChange`, etc.)

### Metadata

Use Next.js 15+ `export const metadata` (or `generateMetadata`) in **layout and page files**:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Page",
  description: "...",
};
```

### Font Loading

Use `next/font` (Google Fonts bundled at build time, zero layout shift):

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

### Image Component

Always use `next/image` for local and remote images. Prefer `priority` on above-the-fold images.

```tsx
import Image from "next/image";

<Image src="/logo.svg" alt="Logo" width={100} height={20} priority />
```

---

## Error Handling

- **Expected errors** (invalid input, not-found): use `next/navigation` throw helpers (`notFound()`, `redirect()`) in Server Components, or return error states in Client Components.
- **Unexpected errors**: wrap in `try/catch` with typed error objects. Log errors server-side; never expose stack traces to the client.
- **Async operations**: always `await` with `try/catch`, or chain `.catch()` on promises.
- **Validation**: prefer Zod for runtime schema validation of API inputs and external data.
- **No silent catches**: every `catch` block must either handle the error or re-throw with context.

---

## CSS & Styling

- **Tailwind CSS v4** — utility-first; configured via `@tailwindcss/postcss` (CSS-based config, no `tailwind.config.ts` needed for basic setup).
- Global styles: `src/app/globals.css` (Tailwind directives + global resets).
- Component-scoped styles: CSS Modules (`Component.module.css`) when Tailwind alone is insufficient.
- Dark mode: use Tailwind's `dark:` variant on utility classes.
- **No inline styles** for layout/spacing — use Tailwind utilities.
- CSS custom properties (variables) via Tailwind's `var()` in `className` when needed.

---

## Module System & Exports

- Use **named exports** for utilities and hooks: `export const foo = ...`
- Use **default exports** for page/layout components: `export default function Page() { ... }`
- Avoid barrel files (`index.ts`) unless the module boundary is stable; use direct imports instead to keep tree-shaking effective.

---

## Async / Concurrency

- Prefer `async/await` over raw `.then().catch()` chains.
- Use `Promise.all()` for independent parallel operations; avoid sequential awaits when operations are independent.
- Avoid `useEffect` for data fetching; use React Server Components or a data-fetching library (e.g., TanStack Query) for client-side data.

---

## Linting & Formatting

- **ESLint** runs via `eslint-config-next` (core-web-vitals + TypeScript rulesets).
- **No Prettier config found** — adopt one if formatting drift becomes an issue.
- Run `npm run lint` before committing; CI enforces it.
- ESLint config is in `eslint.config.mjs` (flat config format for ESLint 9).
- ESLint ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.

---

## Performance

- Prefer **React Server Components** for data fetching and static content.
- Use `dynamic()` or `next/dynamic` for heavy client-only components.
- Always add `priority` to above-the-fold `<Image>` components.
- Avoid large JS bundles in Client Components — keep client boundaries small.

---

## Security

- Never use `dangerouslySetInnerHTML` without sanitizing the content first (use a library like `DOMPurify`).
- Validate all external input with Zod (or equivalent) before using it.
- Keep sensitive values (API keys, secrets) out of the codebase — use environment variables via `.env.local` and `process.env`.
- Use `rel="noopener noreferrer"` on all external links with `target="_blank"`.
