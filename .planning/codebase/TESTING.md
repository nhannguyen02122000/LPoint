# Testing Conventions

## Overview

This document records the testing framework, structure, mocking approach, and coverage expectations for this codebase. It was reverse-engineered from the actual project configuration and source files.

> ⚠️ **Status**: No testing framework is currently installed. This document defines the conventions to adopt when testing is set up.

---

## Current State

| Item              | Status                              |
|-------------------|-------------------------------------|
| Test framework    | **Not installed**                   |
| Test files        | None in `src/`                      |
| Coverage tool     | Not configured                      |
| E2E framework     | Not installed                       |
| `package.json`    | No test script                       |

To enable testing, install a framework (recommended: **Vitest** for unit/integration, **Playwright** for E2E):

```bash
npm install --save-dev vitest @vitest/coverage-v8 @testing-library/react @testing-library/dom
npm install --save-dev @playwright/test && npx playwright install
```

---

## Recommended Framework: Vitest

Chosen over Jest because:
- Native ESM support (matches the project's `module: "esnext"` tsconfig).
- Vite-based (matches Next.js 16's build tooling).
- Faster冷启动 than Jest.
- Compatible with `@testing-library/react`.

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

Create `vitest.config.ts` at the project root:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",       // or "jsdom" for React component tests
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## Test File Structure

### File Naming

| Kind              | Pattern                       | Example                          |
|-------------------|-------------------------------|----------------------------------|
| Unit tests        | `*.test.ts` or `*.spec.ts`    | `date-utils.test.ts`             |
| Component tests   | `*.test.tsx` or `*.spec.tsx`  | `UserCard.test.tsx`              |
| E2E tests         | `*.e2e.ts`                    | `auth.flow.e2e.ts`               |
| Setup files       | `test/setup.ts`               | `src/test/setup.ts`               |
| Test utilities    | `test/utils.ts`               | `src/test/utils.ts`              |

### Directory Layout

```
src/
├── app/                    # App Router pages/layouts
│   ├── page.tsx
│   └── layout.tsx
├── components/             # Reusable components
│   ├── ui/
│   │   └── Button.tsx
│   └── UserCard.tsx
├── lib/                    # Utilities, helpers
│   ├── api.ts
│   └── date-utils.ts
├── test/                   # Shared test infrastructure
│   ├── setup.ts            # Global test setup (jest-dom, cleanup, etc.)
│   └── utils.ts            # Shared test helpers
│   ├── mocks/              # Module-level mocks
│   │   └── next-image.ts   # Mock for next/image
│   └── factories/           # Test data factories
│       └── user.ts
└── (feature folders)
    ├── components/
    └── hooks/
```

### Test Colocation

Place test files **next to the unit under test** (not in a separate `__tests__` folder) unless the folder would become too crowded. For feature-specific test directories, use a `__tests__` folder.

```
src/lib/
├── date-utils.ts
├── date-utils.test.ts      # ← co-located
└── __fixtures__/           # shared fixtures for this module
    └── dates.ts
```

---

## Writing Tests

### Unit Tests (Vitest)

```ts
// src/lib/date-utils.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, parseDate, isValidDate } from "@/lib/date-utils";

describe("date-utils", () => {
  describe("formatDate", () => {
    it("formats a date in ISO format", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      expect(formatDate(date)).toBe("2025-06-15");
    });

    it("returns empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });
  });

  describe("isValidDate", () => {
    it("returns true for valid date strings", () => {
      expect(isValidDate("2025-01-01")).toBe(true);
    });

    it("returns false for invalid date strings", () => {
      expect(isValidDate("not-a-date")).toBe(false);
    });
  });
});
```

### React Component Tests (Testing Library)

```tsx
// src/components/UserCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { UserCard } from "./UserCard";

// Clean up after each test to avoid state leaking between tests
afterEach(cleanup);

describe("UserCard", () => {
  it("renders the user's name", () => {
    render(<UserCard name="Alice" email="alice@example.com" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders the user's email as a mailto link", () => {
    render(<UserCard name="Alice" email="alice@example.com" />);
    const link = screen.getByRole("link", { name: /alice@example\.com/i });
    expect(link).toHaveAttribute("href", "mailto:alice@example.com");
  });

  it("applies the dark class when dark prop is true", () => {
    const { container } = render(
      <UserCard name="Alice" email="alice@example.com" dark />
    );
    expect(container.firstChild).toHaveClass("dark");
  });
});
```

### Snapshot Tests

Use sparingly — only for stable UI components with low churn:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MyBadge } from "./MyBadge";

it("matches snapshot", () => {
  const { container } = render(<MyBadge label="NEW" />);
  expect(container.firstChild).toMatchSnapshot();
});
```

---

## Mocking

### Module-level Mocking (vi.mock)

Mock entire modules with `vi.mock()` (Vitest). Mocks are hoisted to the top of the file.

```ts
import { vi, describe, it, expect } from "vitest";

// next/image is mocked so it doesn't try to load real images in tests
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

// Mock a library module
vi.mock("zod", () => ({
  z: {
    string: () => ({
      email: () => ({ parse: (v: string) => v }),
    }),
  },
}));
```

### Mocking Fetch / API Calls

Use `global.fetch` with `vi.spyOn` or `vi.mock()`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("fetchUser", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("calls the correct endpoint", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "1", name: "Bob" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { fetchUser } = await import("@/lib/api");
    const user = await fetchUser("1");

    expect(fetch).toHaveBeenCalledWith("/api/users/1", expect.any(Object));
    expect(user.name).toBe("Bob");
  });
});
```

### Mocking Next.js Navigation

```ts
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/some-path",
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
```

### Mocking React Hooks

```ts
import { vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("increments the count", () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });
});
```

---

## Setup Files

### Global Setup (`src/test/setup.ts`)

```ts
import "@testing-library/jest-dom";  // extends expect with DOM matchers
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Runs after every test — cleans up any rendered components
afterEach(() => {
  cleanup();
});
```

---

## Test Data & Factories

### Inline Fixtures

For simple, stable data:

```ts
const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  createdAt: "2025-01-01T00:00:00Z",
};
```

### Factory Functions

For complex or varied data, use factory helpers:

```ts
// src/test/factories/user.ts
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: "user-default",
  name: "Default Name",
  email: "default@example.com",
  createdAt: new Date().toISOString(),
  ...overrides,
});

it("handles a user with a custom name", () => {
  const user = createUser({ name: "Alice" });
  expect(user.name).toBe("Alice");
});
```

---

## Coverage Expectations

| Category         | Target  | Notes                                          |
|------------------|---------|------------------------------------------------|
| Functions/utilities | ≥80% | Critical for business logic in `src/lib/`    |
| Components        | ≥60%   | Focus on interaction and conditional rendering |
| Hooks             | ≥80%   | Every branch of custom hooks                  |
| API handlers      | 100%    | All status codes must be exercised             |
| Overall           | ≥70%    | Starting target; raise as project matures      |

Run coverage:

```bash
npm run test:coverage
```

---

## E2E Testing (Playwright)

Install and configure Playwright for end-to-end tests:

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Config (`playwright.config.ts`):

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

Example E2E test (`e2e/home.spec.ts`):

```ts
import { test, expect } from "@playwright/test";

test("homepage loads and shows heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
```

---

## CI Integration

Ensure tests and linting run on every pull request:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run test:coverage
```

---

## Test Naming

Follow the pattern: **`describe` → `it` / `test`** with full sentences:

```ts
describe("calculateTotal", () => {
  it("returns 0 for an empty cart", () => { ... });
  it("sums all item prices including tax", () => { ... });
  it("applies the discount code when valid", () => { ... });
  it("throws an error when the cart is null", () => { ... });
});
```

---

## What to Test

| Do test                              | Avoid testing                           |
|--------------------------------------|-----------------------------------------|
| Pure utility functions               | Internal implementation details         |
| React components (via Testing Lib.)  | Framework internals (Next.js, React)    |
| Custom hooks                          | Third-party library internals           |
| API route handlers (all status codes)| Config files                            |
| Error/edge cases                     | Snapshot tests for unstable UIs         |
| Integration between modules          | Very slow integration tests without mocks|

---

## Running Tests

```bash
npm test           # Watch mode (re-runs on file change)
npm run test:run   # Single run (for CI)
npm run test:coverage  # Coverage report
npx playwright test    # E2E tests
```
