import { describe, it, expect } from "@jest/globals";
import {
  formatCurrency,
  formatDate,
  generateSlug,
  truncateText,
  capitalize,
  getInitials,
  calculatePercentage,
  formatNumber,
  isValidEmail,
} from "@/lib/utils";

describe("Utils", () => {
  describe("formatCurrency", () => {
    it("deve formatar valor em euros", () => {
      // Use regex to check for currency symbol and digits, ignoring specific separator characters which vary by environment
      const ten = formatCurrency(10).replace(/\u00a0/g, ' ');
      expect(ten).toMatch(/10,00\s?€/);

      const thousand = formatCurrency(1000).replace(/\u00a0/g, ' ');
      // Matches "1.000,00 €" or "1000,00 €"
      expect(thousand).toMatch(/1\.?000,00\s?€/);
    });
  });

  describe("formatDate", () => {
    it("deve formatar data corretamente", () => {
      const date = new Date("2024-03-15");
      expect(formatDate(date)).toBe("15/03/2024");
    });
  });

  describe("generateSlug", () => {
    it("deve gerar slug a partir de texto", () => {
      expect(generateSlug("Festa de Verão 2024")).toBe("festa-de-verao-2024");
      expect(generateSlug("  Espaços  Extra  ")).toBe("espacos-extra");
    });

    it("deve remover acentos", () => {
      expect(generateSlug("São João")).toBe("sao-joao");
      expect(generateSlug("Coração")).toBe("coracao");
    });
  });

  describe("truncateText", () => {
    it("deve truncar texto longo", () => {
      expect(truncateText("Este é um texto muito longo", 10)).toBe("Este é um ...");
    });

    it("deve retornar texto curto sem alterações", () => {
      expect(truncateText("Curto", 10)).toBe("Curto");
    });
  });

  describe("capitalize", () => {
    it("deve capitalizar texto", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("HELLO")).toBe("Hello");
    });
  });

  describe("getInitials", () => {
    it("deve obter iniciais de nome", () => {
      expect(getInitials("João Silva")).toBe("JS");
      expect(getInitials("Maria")).toBe("M");
      expect(getInitials("Ana Beatriz Costa")).toBe("ABC");
    });
  });

  describe("calculatePercentage", () => {
    it("deve calcular percentagem", () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
    });

    it("deve retornar 0 quando total é 0", () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe("formatNumber", () => {
    it("deve formatar número com separadores", () => {
      const formatted = formatNumber(1000);
      expect(formatted === "1.000" || formatted === "1000").toBe(true);
    });
  });

  describe("isValidEmail", () => {
    it("deve validar email correto", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.pt")).toBe(true);
    });

    it("deve rejeitar email inválido", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
    });
  });
});
