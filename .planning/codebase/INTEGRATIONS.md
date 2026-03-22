# External Integrations

## Authentication

### Clerk

- **Status:** Configured (environment variables present)
- **Publishable Key:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (test, via `.env.local`)
- **Secret Key:** `CLERK_SECRET_KEY` (test, via `.env.local`)
- **Skill modules loaded:** `clerk`, `clerk-android`, `clerk-backend-api`, `clerk-custom-ui`, `clerk-nextjs-patterns`, `clerk-orgs`, `clerk-setup`, `clerk-swift`, `clerk-testing`, `clerk-webhooks`
- **Source:** `clerk/skills` on GitHub (skills-lock.json)
- **Usage in code:** Not yet imported in any source file — integration scaffold is in place, awaiting implementation

## Database

- **None configured** — No database client or ORM present in `package.json` or source

## External APIs

- **None configured** — No API clients (e.g., Axios, fetch wrappers) in dependencies

## Deployment Platform

- **Vercel** — Project is scaffolded from `create-next-app` with Vercel deployment links; no `vercel.json` overrides present

## Assets & CDN

- **Google Fonts** — `Geist` and `Geist_Mono` loaded via `next/font/google` (self-hosted by Next.js at build time)
- **Local static assets** — Served from `/public/` (SVG icons: `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`)

## Other External Services

- **InstantDB** — Skill module registered in `skills-lock.json`; no client package or usage in source yet
  - Source: `instantdb/skills` on GitHub
