// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { createJogoSchema, createParticipacaoSchema } from "@/lib/validations";
import { getNextFriday, getOfficialTime, getOfficialTimeISO } from "@/lib/time";
import { buildSafTFromDb } from "@/lib/saf-t";

describe("Cobertura — createJogoSchema (rifa)", () => {
  const base = {
    nome: "Rifa Teste",
    tipo: "rifa" as const,
    configuracao: { dataSorteio: "2026-09-01", horaSorteio: "15:00", localSorteio: "Centro" },
    preco: 1,
    stockInicial: 100,
    eventoId: "ev1",
  };

  it("rejeita numeroFinal <= numeroInicial", () => {
    const res = createJogoSchema.safeParse({
      ...base,
      configuracao: { ...base.configuracao, numeroInicial: 200, numeroFinal: 150 },
    });
    expect(res.success).toBe(false);
  });

  it("rejeita intervalo menor que o stock", () => {
    const res = createJogoSchema.safeParse({
      ...base,
      configuracao: { ...base.configuracao, numeroInicial: 1, numeroFinal: 50 },
      stockInicial: 100,
    });
    expect(res.success).toBe(false);
  });

  it("aceita rifa válida quando intervalo >= stock", () => {
    const res = createJogoSchema.safeParse({
      ...base,
      configuracao: { ...base.configuracao, numeroInicial: 1, numeroFinal: 500 },
    });
    expect(res.success).toBe(true);
  });

  it("raspadinha sem config extra é válida", () => {
    const res = createJogoSchema.safeParse({
      ...base,
      tipo: "raspadinha",
      premios: [{ nome: "1€", percentagem: 50, ordem: 1 }],
    });
    expect(res.success).toBe(true);
  });
});

describe("complemento — dadosParticipacaoSchema", () => {
  const base = { jogoId: "j1", quantidade: 1, metodoPagamento: "saldo" as const };

  it("rejeita mais de 50 números no euromilhões", () => {
    const res = createParticipacaoSchema.safeParse({
      ...base,
      dadosParticipacao: { numeros: Array.from({ length: 51 }, (_, i) => i + 1) },
    });
    expect(res.success).toBe(false);
  });

  it("rejeita mais de 100 coordenadas no poio da vaca", () => {
    const res = createParticipacaoSchema.safeParse({
      ...base,
      dadosParticipacao: { coordenadas: Array.from({ length: 101 }, (_, i) => ({ letra: "A", numero: i + 1 })) },
    });
    expect(res.success).toBe(false);
  });

  it("aceita dados razoáveis", () => {
    expect(
      createParticipacaoSchema.safeParse({ ...base, dadosParticipacao: { numeros: [1, 2, 3] } }).success
    ).toBe(true);
    expect(createParticipacaoSchema.safeParse({ ...base, dadosParticipacao: {} }).success).toBe(true);
  });
});

describe("complemento — time.ts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getNextFriday: quarta-feira → sexta da mesma semana", () => {
    const next = getNextFriday(new Date(2026, 7, 5, 10, 0));
    expect(next.getDay()).toBe(5);
    expect(next.getDate()).toBe(7);
  });

  it("getNextFriday: sexta depois do sorteio das 21:30 → sexta seguinte", () => {
    const next = getNextFriday(new Date(2026, 7, 7, 22, 0));
    const nextLate = getNextFriday(new Date(2026, 7, 7, 21, 35));
    expect(next.getDay()).toBe(5);
    expect(next.getDate()).toBe(7);
    expect(nextLate.getDay()).toBe(5);
    expect(nextLate.getDate()).toBe(14);
  });

  it("getNextFriday: sábado → sexta seguinte", () => {
    const next = getNextFriday(new Date(2026, 7, 8, 10, 0));
    expect(next.getDay()).toBe(5);
    expect(next.getDate()).toBe(14);
  });

  it("getOfficialTime usa cache e não refaz fetch na segunda chamada", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unixtime: Math.floor(Date.now() / 1000) }),
    } as unknown as Response);

    const t1 = await getOfficialTime();
    const t2 = await getOfficialTime();

    expect(Math.abs(t1.getTime() - Date.now())).toBeLessThan(10000);
    expect(t2.getTime()).toBeGreaterThanOrEqual(t1.getTime());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("getOfficialTime não rebenta quando o serviço falha", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const t = await getOfficialTime();
    expect(t instanceof Date).toBe(true);
    expect(Math.abs(t.getTime() - Date.now())).toBeLessThan(10000);
  });

  it("getOfficialTimeISO devolve ISO válido", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ unixtime: Math.floor(Date.now() / 1000) }),
    } as unknown as Response);
    const iso = await getOfficialTimeISO();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("complemento — saf-t fallbacks defensivos", () => {
  it("usa 'Particular' e 'Venda' quando não há cliente nem jogo", async () => {
    const fakePrisma = {
      participacao: {
        findMany: async () => [
          {
            id: "inv-x",
            valorPago: 1,
            dataPagamento: new Date("2026-01-15T10:00:00Z"),
            createdAt: new Date("2026-01-15T10:00:00Z"),
            nomeCliente: null,
            hashParticipacao: null,
            hashRaspe: null,
            metodoPagamento: "saldo",
            jogo: null,
            user: null,
          },
        ],
      },
    };
    const result = await buildSafTFromDb(fakePrisma as never, "aldeia-x", {
      companyName: "C",
      fiscalNumber: "999999999",
      address: "A",
      postalCode: "4700-000",
      city: "B",
    }, {
      dataInicio: new Date("2026-01-01T00:00:00Z"),
      dataFim: new Date("2026-01-31T23:59:59Z"),
    });
    expect(result.xml).toContain(">Particular<");
    expect(result.xml).toContain(">Venda<");
    expect(result.xml).toContain(">inv-x<");
  });
});