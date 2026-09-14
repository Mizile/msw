const { config } = require("dotenv");
config(); // loads frontend/.env

// Required for React 19 + RNTL — tells React this is a test environment
// that supports act(). Without this, screen never binds and state updates
// trigger warnings.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { server } from "./mocks/server.node";

// Start MSW before all tests in the suite
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers after each test (so one test's overrides don't bleed into the next)
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());
