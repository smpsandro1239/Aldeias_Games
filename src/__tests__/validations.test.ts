import { describe, it, expect } from "@jest/globals";
import {
  loginSchema,
  registerSchema,
  createEventoSchema,
  createJogoSchema,
  mbwayPaymentSchema,
  passwordSchema,
} from "@/lib/validations";

describe("Validations", () => {
  describe("loginSchema", () => {
    it("deve validar credenciais corretas", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar email inválido", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("deve aceitar código 2FA opcional", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        totpCode: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar código 2FA com tamanho errado", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        totpCode: "123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordSchema", () => {
    it("deve aceitar password forte (12+ chars, maiúscula, minúscula, número, especial)", () => {
      const result = passwordSchema.safeParse("MinhaPass123!");
      expect(result.success).toBe(true);
    });

    it("deve rejeitar password sem maiúscula", () => {
      const result = passwordSchema.safeParse("minhapass123!");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password sem minúscula", () => {
      const result = passwordSchema.safeParse("MINHAPASS123!");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password sem número", () => {
      const result = passwordSchema.safeParse("MinhaPassWord!");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password sem carácter especial", () => {
      const result = passwordSchema.safeParse("MinhaPass1234");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password com menos de 12 caracteres", () => {
      const result = passwordSchema.safeParse("Min1!");
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("deve validar dados de registo corretos com password forte", () => {
      const result = registerSchema.safeParse({
        nome: "João Silva",
        email: "joao@example.com",
        password: "MinhaPass123!",
        telefone: "+351912345678",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar nome curto", () => {
      const result = registerSchema.safeParse({
        nome: "J",
        email: "joao@example.com",
        password: "MinhaPass123!",
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password fraca no registo", () => {
      const result = registerSchema.safeParse({
        nome: "João Silva",
        email: "joao@example.com",
        password: "weakpass",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createEventoSchema", () => {
    it("deve validar dados de evento corretos", () => {
      const result = createEventoSchema.safeParse({
        nome: "Festa de Verão",
        dataInicio: "2024-06-01T10:00",
        dataFim: "2024-06-30T22:00",
        aldeiaId: "aldeia123",
        publico: true,
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar evento sem nome", () => {
      const result = createEventoSchema.safeParse({
        dataInicio: "2024-06-01T10:00",
        dataFim: "2024-06-30T22:00",
        aldeiaId: "aldeia123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createJogoSchema", () => {
    it("deve validar dados de jogo corretos", () => {
      const result = createJogoSchema.safeParse({
        nome: "Rifa da Festa",
        tipo: "rifa",
        preco: 2,
        stockInicial: 1000,
        eventoId: "evento123",
        configuracao: { numeroInicial: 1, numeroFinal: 1000 },
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar preço negativo", () => {
      const result = createJogoSchema.safeParse({
        nome: "Rifa",
        tipo: "rifa",
        preco: -1,
        stockInicial: 100,
        eventoId: "evento123",
        configuracao: {},
      });
      expect(result.success).toBe(false);
    });
  });

  describe("mbwayPaymentSchema", () => {
    it("deve validar número de telefone MBWay", () => {
      const result = mbwayPaymentSchema.safeParse({
        telefone: "+351912345678",
        valor: 10,
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar número inválido", () => {
      const result = mbwayPaymentSchema.safeParse({
        telefone: "12345",
        valor: 10,
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar valor negativo", () => {
      const result = mbwayPaymentSchema.safeParse({
        telefone: "+351912345678",
        valor: -5,
      });
      expect(result.success).toBe(false);
    });
  });
});
