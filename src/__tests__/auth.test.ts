// @vitest-environment node
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  hasRole,
} from "@/lib/auth";

describe("Auth Utilities", () => {
  describe("hashPassword", () => {
    it("deve gerar um hash válido", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it("deve gerar hashes diferentes para a mesma password", async () => {
      const password = "testpassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("deve verificar password correta", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("deve rejeitar password incorreta", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe("generateToken", () => {
    it("deve gerar um token JWT válido", async () => {
      const payload = {
        userId: "user123",
        email: "test@example.com",
        role: "user",
      };

      const token = await generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3); // JWT tem 3 partes
    });
  });

  describe("verifyToken", () => {
    it("deve verificar um token válido", async () => {
      const payload = {
        userId: "user123",
        email: "test@example.com",
        role: "user",
      };

      const token = await generateToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe(payload.role);
    });

    it("deve retornar null para token inválido", async () => {
      const verified = await verifyToken("invalid-token");
      expect(verified).toBeNull();
    });
  });

  describe("hasRole", () => {
    it("deve retornar true quando role está na lista", () => {
      expect(hasRole("admin", ["admin", "user"])).toBe(true);
      expect(hasRole("user", ["admin", "user"])).toBe(true);
    });

    it("deve retornar false quando role não está na lista", () => {
      expect(hasRole("guest", ["admin", "user"])).toBe(false);
    });
  });
});
