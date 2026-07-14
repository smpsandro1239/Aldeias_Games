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
  normalizeAldeiasList,
} from "@/lib/utils";

describe("Utils", () => {
  describe("formatCurrency", () => {
    it("deve formatar valor em euros", () => {
      expect(formatCurrency(10)).toBe("10,00 €");
      expect(formatCurrency(10.5)).toBe("10,50 €");
      expect(formatCurrency(10000)).toBe("10 000,00 €");
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
      expect(formatNumber(1000000)).toBe("1\u00a0000\u00a0000");
      expect(formatNumber(100)).toBe("100");
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

  describe("normalizeAldeiasList", () => {
    it("deve devolver um array quando recebe uma lista já válida", () => {
      expect(normalizeAldeiasList([{ id: "1", nome: "Aldeia 1" }])).toEqual([{ id: "1", nome: "Aldeia 1" }]);
    });

    it("deve extrair aldeias de um objeto com a propriedade aldeias", () => {
      expect(normalizeAldeiasList({ aldeias: [{ id: "2", nome: "Aldeia 2" }] })).toEqual([{ id: "2", nome: "Aldeia 2" }]);
    });

    it("deve devolver array vazio para entradas inválidas", () => {
      expect(normalizeAldeiasList(undefined)).toEqual([]);
      expect(normalizeAldeiasList(null)).toEqual([]);
      expect(normalizeAldeiasList({})).toEqual([]);
    });
  });
});
