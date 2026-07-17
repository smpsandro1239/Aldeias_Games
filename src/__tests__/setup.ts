import "@testing-library/jest-dom";

// Set JWT_SECRET for tests that import proxy.ts (validates at module scope)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-for-unit-tests";
}
