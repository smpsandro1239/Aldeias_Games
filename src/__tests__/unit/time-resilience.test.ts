import { afterEach, describe, expect, it, vi } from "vitest";

describe("getOfficialTime — respostas externas inválidas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("usa a hora local quando a API responde sem unixtime", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ datetime: "not-a-timestamp" }),
    } as Response);
    vi.resetModules();

    const { getOfficialTime } = await import("@/lib/time");
    const first = await getOfficialTime();
    const second = await getOfficialTime();

    expect(Number.isNaN(first.getTime())).toBe(false);
    expect(Math.abs(first.getTime() - Date.now())).toBeLessThan(10_000);
    expect(second.getTime()).toBeGreaterThanOrEqual(first.getTime());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("usa a hora local quando a API responde com HTTP de erro", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response);
    vi.resetModules();

    const { getOfficialTime } = await import("@/lib/time");
    const result = await getOfficialTime();

    expect(Number.isNaN(result.getTime())).toBe(false);
    expect(Math.abs(result.getTime() - Date.now())).toBeLessThan(10_000);
  });
});
