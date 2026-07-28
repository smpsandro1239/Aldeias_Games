// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock prisma
vi.mock("@/lib/db", () => ({
  default: {
    user: { findUnique: vi.fn() },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  prisma: {
    user: { findUnique: vi.fn() },
    participacao: { count: vi.fn().mockResolvedValue(0) },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Set JWT_SECRET before importing auth
process.env.JWT_SECRET = "test-secret-key-for-auth-tests-12345";

import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  hasRole,
} from "@/lib/auth";

describe("Auth - Password Hashing", () => {
  it("should hash password correctly", async () => {
    const password = "SecurePass123!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it("should verify correct password", async () => {
    const password = "SecurePass123!";
    const hash = await hashPassword(password);

    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "SecurePass123!";
    const hash = await hashPassword(password);

    const valid = await verifyPassword("WrongPassword!", hash);
    expect(valid).toBe(false);
  });

  it("should generate different hashes for same password (salt)", async () => {
    const password = "SamePassword!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});

describe("Auth - JWT Tokens", () => {
  it("should generate a valid JWT token", async () => {
    const payload = {
      userId: "user-123",
      email: "test@example.com",
      role: "user",
    };

    const token = await generateToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
  });

  it("should verify a valid token", async () => {
    const payload = {
      userId: "user-456",
      email: "admin@example.com",
      role: "super_admin",
    };

    const token = await generateToken(payload);
    const verified = await verifyToken(token);

    expect(verified).toBeDefined();
    expect(verified!.userId).toBe("user-456");
    expect(verified!.email).toBe("admin@example.com");
    expect(verified!.role).toBe("super_admin");
  });

  it("should reject invalid token", async () => {
    const result = await verifyToken("invalid.token.here");
    expect(result).toBeNull();
  });

  it("should reject tampered token", async () => {
    const token = await generateToken({
      userId: "user-789",
      email: "test@example.com",
      role: "user",
    });

    // Tamper with the token
    const parts = token.split(".");
    parts[2] = "tampered";
    const tampered = parts.join(".");

    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it("should include correct claims in token", async () => {
    const payload = {
      userId: "user-999",
      email: "claims@test.com",
      role: "vendedor",
      aldeiaId: "aldeia-1",
    };

    const token = await generateToken(payload);
    const verified = await verifyToken(token);

    expect(verified!.userId).toBe("user-999");
    expect(verified!.role).toBe("vendedor");
    expect(verified!.aldeiaId).toBe("aldeia-1");
  });
});

describe("Auth - Role Checking (hasRole)", () => {
  it("should match single role", () => {
    expect(hasRole("super_admin", ["super_admin"])).toBe(true);
  });

  it("should match one of multiple roles", () => {
    expect(hasRole("vendedor", ["aldeia_admin", "vendedor"])).toBe(true);
  });

  it("should reject non-matching role", () => {
    expect(hasRole("user", ["super_admin", "aldeia_admin"])).toBe(false);
  });

  it("should reject empty roles array", () => {
    expect(hasRole("super_admin", [])).toBe(false);
  });

  it("should handle all role types", () => {
    const allRoles = ["super_admin", "aldeia_admin", "vendedor", "user"];
    for (const role of allRoles) {
      expect(hasRole(role, [role])).toBe(true);
    }
  });
});
