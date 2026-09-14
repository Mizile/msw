# MSW + Expo + Jest — Project Playbook

An architectural and implementation guide for setting up **Mock Service Worker (MSW 2.x)** within an **Expo (React Native)** application testing suite powered by **Jest** and **React Native Testing Library (RNTL)**.

---

## 1. Project Overview

This repository demonstrates a full-stack learning setup for API mocking in React Native.

* **Backend**: Express + TypeScript (`GET /users`, `GET /users/:id`, `POST /users`)
* **Frontend**: Expo (React Native) + TypeScript + MSW + Jest

---

## 2. Directory Structure

```
msw-practice/
├── backend/
│   ├── src/
│   │   ├── data.ts          # In-memory user database
│   │   └── index.ts         # Express server entry point
│   ├── .env                 # SERVER_IP, SERVER_PORT
│   └── package.json
└── frontend/
    ├── src/
    │   ├── mocks/
    │   │   ├── handlers.ts      # Shared MSW handlers (GET + POST)
    │   │   ├── server.ts        # msw/native runtime server (App/Dev only)
    │   │   ├── server.node.ts   # msw/node runtime server (Jest only)
    │   │   └── polyfills.ts     # Hermes Web API polyfills (App runtime only)
    │   ├── setupTests.ts        # Jest lifecycle setup & global configuration
    │   └── __tests__/
    │       ├── App.test.tsx     # Integration tests: GET, loading, error states
    │       └── UserForm.test.tsx # Integration tests: POST, payloads, 401, network failure
    ├── app.config.ts            # Expo configuration with environment injection
    ├── config.ts                # Dynamic server URL helper
    ├── App.tsx                  # Root Application Component
    ├── babel.config.js
    ├── .env                     # EXPO_PUBLIC_SERVER_IP, EXPO_PUBLIC_SERVER_PORT
    └── package.json
```

---

## 3. Dependency Alignment

Target these core package versions for compatibility across React 19, Hermes, and Jest:

```json
{
  "dependencies": {
    "expo": "~56.0.11",
    "react": "19.2.3",
    "react-native": "0.85.3"
  },
  "devDependencies": {
    "@testing-library/react-native": "^14.0.1",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "jest-expo": "^56.0.5",
    "msw": "^2.3.5",
    "react-test-renderer": "^19.2.3",
    "text-encoding": "^0.7.0",
    "typescript": "~6.0.3",
    "web-streams-polyfill": "^3.3.3"
  }
}
```

> **Note**: `jest-expo` **must** align with your Expo SDK major version. SDK 56 requires `jest-expo@56`.

---

## 4. Core Implementation

### 4.1. MSW Request Handlers (`src/mocks/handlers.ts`)

> **Critical Rule**: Always instantiate responses using `new Response(JSON.stringify(...))` instead of `HttpResponse.json()`. The latter uses `ReadableStream` internally, which causes streams to freeze or fail in Hermes and specific Node/Jest environments.

```typescript
import { http } from "msw";

const mockUsers = [
  { id: 1, name: "MSW Alice", email: "msw-alice@mock.com", role: "admin" },
  { id: 2, name: "MSW Bob",   email: "msw-bob@mock.com",   role: "member" },
  { id: 3, name: "MSW Carol", email: "msw-carol@mock.com", role: "member" },
];

export const handlers = [
  http.get("http://*/users", () => {
    console.log("[MSW] Intercepted GET /users");
    return new Response(JSON.stringify(mockUsers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),

  http.post("http://*/users", async ({ request }) => {
    console.log("[MSW] Intercepted POST /users");
    const body = (await request.json()) as { name: string; email: string; role: string };
    const newUser = { id: mockUsers.length + 1, ...body };
    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }),
];
```

---

### 4.2. Runtime Mock Servers

Separate the MSW entrypoints according to the active environment to avoid loading Node built-ins into Hermes.

#### App Runtime (`src/mocks/server.ts`)
```typescript
import { setupServer } from "msw/native";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

#### Jest Environment (`src/mocks/server.node.ts`)
```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

---

### 4.3. Test Setup (`src/setupTests.ts`)

```typescript
const { config } = require("dotenv");
config();

// Explicitly inform React 19 of the test execution context
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { server } from "./mocks/server.node";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### 4.4. Application Bootstrap (`App.tsx`)

Guard native MSW initialization so it runs strictly during runtime development and **never** during Jest test execution:

```typescript
if (__DEV__ && process.env.NODE_ENV !== "test") {
  require("./src/mocks/polyfills");
  const { server } = require("./src/mocks/server");
  
  server.listen({
    onUnhandledRequest(request: Request) {
      // Ignore Expo internal bundler requests
      if (request.url.includes(":8081")) return;
      console.warn(`[MSW] Unhandled: ${request.method} ${request.url}`);
    },
  });
  console.log("[MSW] Mock server running");
}
```

---

### 4.5. Jest Configuration (`package.json`)

```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["./src/setupTests.ts"],
    "testEnvironmentOptions": {
      "customExportConditions": ["node", "require", "default"]
    },
    "moduleNameMapper": {
      "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js"
    },
    "transformIgnorePatterns": [
      "node_modules/(?!(jest-)?react-native|@react-native(-community)?/.*|@react-native/.*|expo.*|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|msw|@mswjs/.*|web-streams-polyfill|text-encoding)"
    ]
  }
}
```

---

## 5. Testing Patterns

### 5.1. The Golden Rule of Async Rendering

```typescript
// 1. Always await render to flush initial async effects
await render(<App />);

// 2. Assert directly after render without wrapping in waitFor
expect(screen.getByText("MSW Alice")).toBeTruthy();

// 3. Use waitFor strictly for user interactions triggering NEW async updates
await user.press(screen.getByTestId("btn-add"));
await waitFor(() => expect(screen.getByText("Dave New")).toBeTruthy());
```

---

### 5.2. Interaction Paradigm: `userEvent` vs `fireEvent`

Prefer `userEvent` in React 19 to properly wait for concurrent state updates to settle.

```typescript
const user = userEvent.setup();

// CORRECT: Async and integrates with React 19 concurrent mode
await user.type(screen.getByTestId("input-name"), "Dave New");
await user.press(screen.getByTestId("btn-add"));

// INCORRECT: Synchronous; misses state transitions in React 19
fireEvent.changeText(screen.getByTestId("input-name"), "Dave New");
```

---

### 5.3. Test Reference Examples

```typescript
// Success State
test("renders mock users", async () => {
  await render(<App />);
  expect(screen.getByText("MSW Alice")).toBeTruthy();
});

// Loading State (Never-resolving Promise)
test("shows loading state", async () => {
  server.use(http.get("http://*/users", () => new Promise(() => {})));
  await render(<App />);
  expect(screen.getByTestId("loading-indicator")).toBeTruthy();
});

// HTTP Error State
test("handles 500 error", async () => {
  server.use(http.get("http://*/users", () => new Response(null, { status: 500 })));
  await render(<App />);
  expect(screen.getByText("Failed to fetch users")).toBeTruthy();
});

// Network Failure State
test("handles network drop", async () => {
  server.use(
    http.get("http://*/users", () => {
      throw new TypeError("Network request failed");
    })
  );
  await render(<App />);
  expect(screen.getByText("Failed to fetch users")).toBeTruthy();
});

// Request Body Capture
test("submits form payload", async () => {
  let capturedBody: any = null;

  server.use(
    http.post("http://*/users", async ({ request }) => {
      capturedBody = await request.json();
      return new Response(JSON.stringify({ id: 99, ...capturedBody }), { status: 201 });
    })
  );

  await render(<App />);
  await user.type(screen.getByTestId("input-name"), "Eve Test");
  await user.press(screen.getByTestId("btn-add"));

  expect(capturedBody).toEqual({ name: "Eve Test", email: "eve@example.com", role: "member" });
});
```

---

## 6. Troubleshooting & Edge Cases

| Issue / Error | Root Cause | Solution |
| :--- | :--- | :--- |
| **1. Device cannot reach host** | Physical devices resolve `localhost` locally. | Set host machine LAN IP in `frontend/.env` (`EXPO_PUBLIC_SERVER_IP=192.168.x.x`). |
| **2. MSW `async_hooks` error** | `msw/node` imports Node built-in modules unsupported by Hermes. | Use `msw/native` for dev runtime and restrict `msw/node` strictly to Jest setup. |
| **3. Missing `MessageEvent` / Web API errors** | Hermes lacks standard Web APIs required by MSW v2. | Polyfill `EventTarget`, `BroadcastChannel`, `TextEncoder`, etc., in `src/mocks/polyfills.ts`. |
| **4. `Unexpected end of input` JSON error** | `HttpResponse.json()` fails inside Hermes streams. | Construct responses via `new Response(JSON.stringify(...))` with explicit headers. |
| **5. `Cannot use import statement outside a module`** | ESM packages inside `node_modules` remain untransformed by default in Jest. | Add `msw` and `@mswjs` to `transformIgnorePatterns` and configure `moduleNameMapper`. |
| **6. `rettime` ESM-only module failure** | MSW 2.7+ introduced `rettime` which lacks CommonJS support. | Lock MSW to version `2.3.5`. |
| **7. `jest-expo` version mismatch** | `jest-expo` major version out of sync with Expo SDK. | Align `jest-expo` major release version with Expo SDK version (`jest-expo@56` for Expo 56). |
| **8. Deprecated `@testing-library/jest-native`** | Matchers were merged directly into `@testing-library/react-native` v12+. | Remove `@testing-library/jest-native` dependency entirely. |
| **9. `react-test-renderer` mismatch** | Version drift relative to installed `react` core package. | Pin `react-test-renderer` to match React version (`19.2.3`). |
| **10. Incorrect Jest setup key** | Using `setupFilesAfterFramework` instead of standard key. | Rename configuration key to `setupFilesAfterEnv`. |
| **11. Missing Jest types** | TypeScript compiler lacks type definitions for global assertions. | Install `@types/jest` and add `"types": ["jest"]` inside `tsconfig.json`. |
| **12. Dual server interference in Jest** | `msw/native` starting concurrently alongside `msw/node` during tests. | Add `process.env.NODE_ENV !== "test"` check prior to starting `msw/native`. |
| **13. Unbound `screen` / render errors** | React 19 testing harness requires explicit environment flag. | Declare `(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;` inside `setupTests.ts`. |
| **14. Overlapping `act(...)` warnings** | `fireEvent` updates run synchronously without awaiting state updates. | Migrate test user interactions to `userEvent.setup()`. |

---

## 7. Quick Reference

### 7.1. MSW Entrypoint Matrix

| Environment | Import Path | Primary File |
| :--- | :--- | :--- |
| **Expo Go / Hermes** | `msw/native` | `src/mocks/server.ts` |
| **Jest / Node.js** | `msw/node` | `src/mocks/server.node.ts` |
| **Web Browser** | `msw/browser` | Web integration setups |

### 7.2. Jest Setup Hook Types

* **`setupFiles`**: Runs **before** Jest globals and testing framework are initialized. Use for early global patches, polyfills, and environment variables.
* **`setupFilesAfterEnv`**: Runs **after** the testing framework is initialized. Use for `beforeAll`, `afterEach`, MSW lifecycle hooks, and global custom matchers.
