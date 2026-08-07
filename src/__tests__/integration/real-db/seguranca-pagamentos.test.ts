// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

// Utilizador controlado pelo teste — substitui getFullUserFromRequest/verifyToken
const mocks = vi.hoisted(() => ({ user: null as any }));

vi.mock("@/lib/auth", () => ({
  getFullUserFromRequest: async () => mocks.user,
  verifyToken: async () =>
    mocks.user
      ? {
          userId: mocks.user.id,
          role: mocks.user.role,
          aldeiaId: mocks.user.aldeiaId ?? null,
        }
      : null,
}));

describe("Real DB: Segurança de pagamentos (apostas + participações)", () => {
  let prisma: any;
  let apostaPOST: any;
  let participacaoPOST: any;
  let vendedor: any;
  let jogador: any;
  let jogoId: string;

  const req = (body: unknown) =>
    ({ json: async () => body, headers: new Headers(), url: "http://test" }) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const apostas = await import("@/app/api/apostas/route");
    const participacoes = await import("@/app/api/participacoes/route");
    apostaPOST = apostas.POST;
    participacaoPOST = participacoes.POST;

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Seg",
        slug: "aldeia-seg",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "seg@aldeia.pt",
        morada: "Rua Seg, 1",
      },
    });

    // RBAC: role VENDEDOR com EXECUTE_VENDA
    const permVenda = await prisma.permission.create({
      data: { key: "EXECUTE_VENDA", description: "Executar venda" },
    });
    const roleVendedor = await prisma.role.create({
      data: { name: "COLABORADOR", description: "Colaborador (venda)" },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleVendedor.id, permissionId: permVenda.id },
    });

    vendedor = await prisma.user.create({
      data: {
        nome: "Vendedor Seg",
        email: "vseg@teste.pt",
        password: "$2b$10$fakehash",
        role: "vendedor",
        aldeiaId: aldeia.id,
        saldo: 0,
      },
    });
    await prisma.userGlobalRole.create({
      data: { userId: vendedor.id, roleId: roleVendedor.id },
    });

    jogador = await prisma.user.create({
      data: {
        nome: "Jogador Seg",
        email: "jseg@teste.pt",
        password: "$2b$10$fakehash",
        role: "user",
        aldeiaId: aldeia.id,
        saldo: 50,
      },
    });

    const evento = await prisma.evento.create({
      data: {
        nome: "Evento Seg",
        slug: "evento-seg",
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });

    const jogo = await prisma.jogo.create({
      data: {
        nome: "Poio Seg",
        tipo: "poio_da_vaca",
        preco: 5,
        custoQuadrado: 5,
        stockInicial: 100,
        stockAtual: 100,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: "{}",
      },
    });
    jogoId = jogo.id;
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  const apostaBody = (overrides: Record<string, unknown> = {}) => ({
    jogoId,
    numeros: [1, 2],
    jogador: { nome: "Cliente Teste", telefone: "912345678" },
    pago: false,
    usarSaldo: false,
    ...overrides,
  });

  describe("POST /api/apostas — regras de autenticação e vendedor", () => {
    it("deve recusar aposta sem sessão (401)", async () => {
      mocks.user = null;
      const res = await apostaPOST(req(apostaBody({ pago: true })));
      expect(res.status).toBe(401);
    });

    it("deve recusar pagamento em dinheiro para utilizador normal (403)", async () => {
      mocks.user = jogador;
      const res = await apostaPOST(req(apostaBody({ pago: true })));
      expect(res.status).toBe(403);
    });

    it("deve recusar venda em dinheiro com vendedorId falsificado do body (403)", async () => {
      mocks.user = jogador;
      const res = await apostaPOST(req(apostaBody({ pago: true, vendedorId: vendedor.id })));
      expect(res.status).toBe(403);
    });

    it("deve aceitar venda em dinheiro de vendedor e associar vendedorId do user (201)", async () => {
      mocks.user = vendedor;
      const res = await apostaPOST(req(apostaBody({ pago: true, vendedorId: "spoofed-id" })));
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.vendedorId).toBe(vendedor.id);
      expect(data.data.pago).toBe(true);
    });

    it("deve debitar saldo dentro da transação para pagamento com saldo (201)", async () => {
      mocks.user = jogador;
      const saldoAntes = jogador.saldo;
      const res = await apostaPOST(req(apostaBody({ numeros: [3, 6], usarSaldo: true })));
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.pago).toBe(true);
      expect(data.data.vendedorId).toBe(jogador.id);

      const atualizado = await prisma.user.findUnique({ where: { id: jogador.id } });
      // 2 números × 5€ + cashback 5% (0.5€) — saldo nunca negativo
      expect(atualizado.saldo).toBe(saldoAntes - 10 + 0.5);
    });

    it("deve devolver 400 sem saldo e não ir a negativo", async () => {
      await prisma.user.update({ where: { id: jogador.id }, data: { saldo: 3 } });
      mocks.user = jogador;
      const res = await apostaPOST(req(apostaBody({ numeros: [4, 5], usarSaldo: true })));
      expect(res.status).toBe(400);

      const atualizado = await prisma.user.findUnique({ where: { id: jogador.id } });
      expect(atualizado.saldo).toBe(3);
    });

    it("deve recusar números ocupados (409) sem cobrar saldo", async () => {
      await prisma.user.update({ where: { id: jogador.id }, data: { saldo: 50 } });
      mocks.user = jogador;
      const primeiro = await apostaPOST(req(apostaBody({ numeros: [7, 8], usarSaldo: true })));
      expect(primeiro.status).toBe(201);

      const saldoAposPrimeiro = (await prisma.user.findUnique({ where: { id: jogador.id } })).saldo;
      const segundo = await apostaPOST(req(apostaBody({ numeros: [7, 8], usarSaldo: true })));
      expect(segundo.status).toBe(409);

      const saldoFinal = (await prisma.user.findUnique({ where: { id: jogador.id } })).saldo;
      expect(saldoFinal).toBe(saldoAposPrimeiro); // sem débito extra
    });
  });

  describe("POST /api/participacoes — regras de pagamento", () => {
    const participacaoBody = (overrides: Record<string, unknown> = {}) => ({
      jogoId,
      quantidade: 1,
      dadosParticipacao: { coordenadas: [{ x: 0, y: 0 }] },
      metodoPagamento: "dinheiro",
      dadosCliente: { nome: "Cliente Teste", telefone: "912345678" },
      ...overrides,
    });

    it("deve recusar pagamento em dinheiro para convidado (403)", async () => {
      mocks.user = null;
      const res = await participacaoPOST(req(participacaoBody()));
      expect(res.status).toBe(403);
    });

    it("deve recusar pagamento em dinheiro para utilizador normal (403)", async () => {
      mocks.user = jogador;
      const res = await participacaoPOST(req(participacaoBody()));
      expect(res.status).toBe(403);
    });

    it("deve aceitar pagamento em dinheiro para vendedor e creditar a caixa (201)", async () => {
      mocks.user = vendedor;
      const res = await participacaoPOST(
        req(participacaoBody({ dadosParticipacao: { coordenadas: [{ x: 1, y: 1 }] } }))
      );
      expect(res.status).toBe(201);

      const cashbox = await prisma.vendedorCashbox.findUnique({
        where: { userId: vendedor.id },
      });
      expect(cashbox.saldo).toBe(5);
    });

    it("deve aceitar pagamento com saldo para utilizador autenticado (201)", async () => {
      mocks.user = jogador;
      const saldoAntes = (await prisma.user.findUnique({ where: { id: jogador.id } })).saldo;
      const res = await participacaoPOST(
        req(
          participacaoBody({
            metodoPagamento: "saldo",
            dadosParticipacao: { coordenadas: [{ x: 2, y: 2 }] },
          })
        )
      );
      expect(res.status).toBe(201);

      const atualizado = await prisma.user.findUnique({ where: { id: jogador.id } });
      // Venda externa (com dadosCliente): sem cashback
      expect(atualizado.saldo).toBe(saldoAntes - 5);
    });

    it("deve devolver 400 sem saldo suficiente e manter saldo intocado", async () => {
      await prisma.user.update({ where: { id: jogador.id }, data: { saldo: 2 } });
      mocks.user = jogador;
      const res = await participacaoPOST(
        req(
          participacaoBody({
            metodoPagamento: "saldo",
            dadosParticipacao: { coordenadas: [{ x: 3, y: 3 }] },
          })
        )
      );
      expect(res.status).toBe(400);

      const atualizado = await prisma.user.findUnique({ where: { id: jogador.id } });
      expect(atualizado.saldo).toBe(2);
    });
  });
});
