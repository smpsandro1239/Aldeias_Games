// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real SAF-T: exportação fiscal", () => {
  let prisma: any;
  let buildSafeTXml: any;
  let buildSafTFromDb: any;

  const empresa = {
    companyName: "Aldeia Teste",
    fiscalNumber: "512345678",
    address: "Rua X",
    postalCode: "4700-000",
    city: "Braga",
  };

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const safT = await import("@/lib/saf-t");
    buildSafeTXml = safT.buildSafeTXml;
    buildSafTFromDb = safT.buildSafTFromDb;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function seedAldeiaComVendas() {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: `Aldeia SAFT ${Date.now()}`,
        slug: `aldeia-saft-${Date.now()}`,
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: `saft-${Date.now()}@aldeia.pt`,
        morada: "Rua SAFT, 1",
        codigoPostal: "4700-000",
        localidade: "Braga",
      },
    });
    const evento = await prisma.evento.create({
      data: {
        nome: `Evento SAFT ${Date.now()}`,
        slug: `evento-saft-${Date.now()}`,
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });
    const jogo = await prisma.jogo.create({
      data: {
        nome: `Rifa SAFT ${Date.now()}`,
        tipo: "rifa",
        preco: 1,
        stockInicial: 100,
        stockAtual: 100,
        aldeiaId: aldeia.id,
        eventoId: evento.id,
        configuracao: "{}",
      },
    });
    const user = await prisma.user.create({
      data: { nome: "Comprador SAFT", email: `saft-u-${Date.now()}@teste.pt`, password: "$2a$10$fakehash", role: "user", saldo: 0 },
    });

    const noPeriodo = await prisma.participacao.create({
      data: {
        jogoId: jogo.id,
        userId: user.id,
        valorPago: 2.5,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
        dataPagamento: new Date("2026-01-15T10:00:00Z"),
        dadosParticipacao: "{}",
        hashParticipacao: "abc123",
      },
    });

    // Fora do período — não deve entrar no XML
    await prisma.participacao.create({
      data: {
        jogoId: jogo.id,
        userId: user.id,
        valorPago: 50,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
        dataPagamento: new Date("2025-12-31T10:00:00Z"),
        dadosParticipacao: "{}",
      },
    });

    // Não paga — não deve entrar no XML
    await prisma.participacao.create({
      data: {
        jogoId: jogo.id,
        userId: user.id,
        valorPago: 100,
        metodoPagamento: "saldo",
        estadoPagamento: "pendente",
        dataPagamento: new Date("2026-01-20T10:00:00Z"),
        dadosParticipacao: "{}",
      },
    });

    return { aldeia, jogo, noPeriodo };
  }

  it("gera XML SAF-T válido com cabeçalho, master files e vendas", () => {
    const xml = buildSafeTXml(empresa, {
      dataInicio: new Date("2026-01-01"),
      dataFim: new Date("2026-01-31"),
    }, [
      {
        id: "inv1",
        numero: "INV0001",
        hash: "abc123",
        data: new Date("2026-01-15"),
        cliente: "Joao",
        valor: 2.5,
        descricao: "Rifa",
        metodoPagamento: "saldo",
      },
    ]);

    expect(xml).toContain(`<?xml version="1.0" encoding="UTF-8"?>`);
    expect(xml).toContain(`<AuditFileVersion>1.04_01</AuditFileVersion>`);
    expect(xml).toContain(`<TaxRegistrationNumber>512345678</TaxRegistrationNumber>`);
    expect(xml).toContain(`<NumberOfEntries>1</NumberOfEntries>`);
    expect(xml).toContain(`<InvoiceType>FT</InvoiceType>`);
    expect(xml).toContain(`<TotalCredit>2.50</TotalCredit>`);
    expect(xml).toContain(`<StartDate>2026-01-01</StartDate>`);
    expect(xml).toContain(`<EndDate>2026-01-31</EndDate>`);
  });

  it("recolhe apenas vendas concluídas do período", async () => {
    const { aldeia } = await seedAldeiaComVendas();

    const result = await buildSafTFromDb(prisma, aldeia.id, empresa, {
      dataInicio: new Date("2026-01-01T00:00:00Z"),
      dataFim: new Date("2026-01-31T23:59:59Z"),
    });

    expect(result.count).toBe(1);
    expect(result.total).toBe(2.5);
    expect(result.xml).toContain("<Invoice>");
    expect(result.xml).toContain("2.50");
    expect(result.xml).not.toContain("100.00");
    expect(result.xml).not.toContain("50.00");
  });

  it("escapa caracteres XML especiais no nome do produto", async () => {
    const { aldeia, jogo, noPeriodo } = await seedAldeiaComVendas();
    await prisma.jogo.update({ where: { id: jogo.id }, data: { nome: "Rifa & Mega <Sorteio>" } });
    void noPeriodo;

    const result = await buildSafTFromDb(prisma, aldeia.id, empresa, {
      dataInicio: new Date("2026-01-01T00:00:00Z"),
      dataFim: new Date("2026-01-31T23:59:59Z"),
    });

    expect(result.xml).toContain("Rifa &amp; Mega &lt;Sorteio&gt;");
    expect(result.xml).not.toContain("Rifa & Mega <Sorteio>");
  });
});