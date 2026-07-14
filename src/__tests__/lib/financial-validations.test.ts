import {
  criarDepositoSchema,
  criarLevantamentoSchema,
  processarLevantamentoSchema,
  passwordSchema,
} from "@/lib/validations";

describe("Financial Validations", () => {
  describe("criarDepositoSchema", () => {
    it("deve validar depósito com dados corretos", () => {
      const result = criarDepositoSchema.safeParse({
        valor: 100,
        descricao: "Depósito de teste",
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar depósito sem descrição (opcional)", () => {
      const result = criarDepositoSchema.safeParse({ valor: 50 });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar valor zero", () => {
      const result = criarDepositoSchema.safeParse({ valor: 0 });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar valor negativo", () => {
      const result = criarDepositoSchema.safeParse({ valor: -10 });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar valor acima do limite (100000)", () => {
      const result = criarDepositoSchema.safeParse({ valor: 100001 });
      expect(result.success).toBe(false);
    });

    it("deve aceitar valor no limite (100000)", () => {
      const result = criarDepositoSchema.safeParse({ valor: 100000 });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar descrição com mais de 500 caracteres", () => {
      const result = criarDepositoSchema.safeParse({
        valor: 100,
        descricao: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("deve aceitar referências opcionais", () => {
      const result = criarDepositoSchema.safeParse({
        valor: 100,
        referencias: { ref1: "abc", ref2: "def" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("criarLevantamentoSchema", () => {
    it("deve validar levantamento com dados corretos", () => {
      const result = criarLevantamentoSchema.safeParse({
        valor: 200,
        descricao: "Pagamento de fornecedor",
        destino: "Fornecedor ABC",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar descrição com menos de 5 caracteres", () => {
      const result = criarLevantamentoSchema.safeParse({
        valor: 200,
        descricao: "abc",
        destino: "Fornecedor",
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar destino com menos de 3 caracteres", () => {
      const result = criarLevantamentoSchema.safeParse({
        valor: 200,
        descricao: "Descrição válida",
        destino: "AB",
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar valor zero ou negativo", () => {
      const result = criarLevantamentoSchema.safeParse({
        valor: -50,
        descricao: "Descrição válida",
        destino: "Fornecedor",
      });
      expect(result.success).toBe(false);
    });

    it("deve aceitar observações opcionais", () => {
      const result = criarLevantamentoSchema.safeParse({
        valor: 100,
        descricao: "Descrição válida",
        destino: "Fornecedor",
        observacoes: "Notas adicionais",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar observações com mais de 1000 caracteres", () => {
      const result = criarLevantamentoSchema.safeParse({
        valor: 100,
        descricao: "Descrição válida",
        destino: "Fornecedor",
        observacoes: "a".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    it("deve aceitar aldeiaId opcional", () => {
      const result = criarLevantamentoSchema.safeParse({
        valor: 100,
        descricao: "Descrição válida",
        destino: "Fornecedor",
        aldeiaId: "aldeia-vale-azenha",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("processarLevantamentoSchema", () => {
    it("deve aceitar ação confirmar", () => {
      const result = processarLevantamentoSchema.safeParse({
        acao: "confirmar",
      });
      expect(result.success).toBe(true);
    });

    it("deve aceitar ação rejeitar", () => {
      const result = processarLevantamentoSchema.safeParse({
        acao: "rejeitar",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar ação inválida", () => {
      const result = processarLevantamentoSchema.safeParse({
        acao: "invalidar",
      });
      expect(result.success).toBe(false);
    });

    it("deve aceitar observações opcionais", () => {
      const result = processarLevantamentoSchema.safeParse({
        acao: "confirmar",
        observacoes: "Aprovado pelo administrador",
      });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar observações com mais de 500 caracteres", () => {
      const result = processarLevantamentoSchema.safeParse({
        acao: "confirmar",
        observacoes: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordSchema (consistência com change-password)", () => {
    it("deve rejeitar password com menos de 12 caracteres", () => {
      const result = passwordSchema.safeParse("Ab1!");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password sem maiúscula", () => {
      const result = passwordSchema.safeParse("minhapassword123!");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password sem minúscula", () => {
      const result = passwordSchema.safeParse("MINHAPASSWORD123!");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password sem número", () => {
      const result = passwordSchema.safeParse("MinhaPassword!");
      expect(result.success).toBe(false);
    });

    it("deve rejeitar password sem carácter especial", () => {
      const result = passwordSchema.safeParse("MinhaPassword123");
      expect(result.success).toBe(false);
    });

    it("deve aceitar password forte com 12+ caracteres", () => {
      const result = passwordSchema.safeParse("MinhaPass123!");
      expect(result.success).toBe(true);
    });

    it("deve aceitar password com caracteres especiais variados", () => {
      const result = passwordSchema.safeParse("Teste@#$%^&*1234");
      expect(result.success).toBe(true);
    });
  });
});
