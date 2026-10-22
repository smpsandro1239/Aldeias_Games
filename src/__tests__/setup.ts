import "@testing-library/jest-dom";

// Set JWT_SECRET for tests that import proxy.ts (validação fail-fast em auth.ts)
if (!process.env.JWT_SECRET) {
  // >=32 caracteres e sem substrings de placeholder ("secret", "changeme", ...)
  process.env.JWT_SECRET = "unit-tests-hs256-key-0123456789abcdef";
}
