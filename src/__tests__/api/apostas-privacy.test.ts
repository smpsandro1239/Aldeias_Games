import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getFullUserFromRequest: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { aposta: { findMany: mocks.findMany } },
}));
vi.mock("@/lib/auth", () => ({
  getFullUserFromRequest: mocks.getFullUserFromRequest,
}));
vi.mock("@/lib/rbac/resolvePermissions", () => ({
  resolvePermissions: vi.fn(),
}));
vi.mock("@/lib/transaction-retry", () => ({
  executeWithRetry: vi.fn((callback: () => unknown) => callback()),
}));

import { GET } from "@/app/api/apostas/route";

describe("GET /api/apostas — privacidade e isolamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getFullUserFromRequest.mockResolvedValue(null);
    mocks.findMany.mockResolvedValue([
      {
        id: "aposta-1",
        numeros: "[3,7]",
        pago: true,
        jogoId: "jogo-1",
        createdAt: new Date("2026-11-17T12:00:00.000Z"),
        jogadorNome: "Nome Privado",
        jogadorTelefone: "+351912345678",
        jogadorEmail: "privado@example.com",
        vendedorId: "user-1",
      },
    ]);
  });

  it("permite consultar ocupação publicamente sem expor dados pessoais", async () => {
    const response = await GET(new NextRequest("http://localhost/api/apostas?jogoId=jogo-1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data[0]).toMatchObject({
      id: "aposta-1",
      numeros: [3, 7],
      pago: true,
      jogoId: "jogo-1",
    });
    expect(json.data[0]).not.toHaveProperty("jogadorNome");
    expect(json.data[0]).not.toHaveProperty("jogadorTelefone");
    expect(json.data[0]).not.toHaveProperty("jogadorEmail");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { AND: [{ jogoId: "jogo-1" }] },
    }));
  });

  it("limita um utilizador normal às próprias apostas", async () => {
    mocks.getFullUserFromRequest.mockResolvedValue({
      id: "user-1",
      role: "user",
      aldeiaId: null,
    });

    const response = await GET(new NextRequest("http://localhost/api/apostas"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { AND: [{ vendedorId: "user-1" }] },
    }));
    expect(json.data[0].jogadorEmail).toBe("privado@example.com");
  });

  it("isola administradores de aldeia à respetiva organização", async () => {
    mocks.getFullUserFromRequest.mockResolvedValue({
      id: "admin-1",
      role: "aldeia_admin",
      aldeiaId: "aldeia-1",
    });

    await GET(new NextRequest("http://localhost/api/apostas?tipo=poio_da_vaca"));

    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        AND: [
          { jogo: { tipo: "poio_da_vaca" } },
          { jogo: { evento: { aldeiaId: "aldeia-1" } } },
        ],
      },
    }));
  });
});
