// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  computeFirstRecurrenceDate,
  addRecurrence,
  computeRecurrencePreview,
} from "@/lib/recurrence";

describe("computeFirstRecurrenceDate", () => {
  it("devolve null sem horário", () => {
    expect(computeFirstRecurrenceDate("semanal", 1, "")).toBeNull();
  });

  it("calcula a primeira data no dia da semana pretendido", () => {
    const from = new Date(2026, 0, 5); // segunda-feira
    const next = computeFirstRecurrenceDate("semanal", 1, "08:00", from);
    expect(next!.getDay()).toBe(1);
    expect(next!.getHours()).toBe(8);
  });

  it("quinzenal avança 14 dias quando o dia já passou", () => {
    const from = new Date(2026, 0, 7); // terça-feira
    const next = computeFirstRecurrenceDate("quinzenal", 1, "08:00", from)!;
    expect(next.getDay()).toBe(1);
    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });

  it("semanal avança 7 dias quando o dia já passou", () => {
    const from = new Date(2026, 0, 8); // quinta-feira
    const next = computeFirstRecurrenceDate("semanal", 1, "08:00", from);
    expect(next.getDay()).toBe(1);
  });
});

describe("addRecurrence", () => {
  it("semanal soma 7 dias", () => {
    const d = new Date(2026, 0, 5);
    expect(addRecurrence(d, "semanal", 1).getDate()).toBe(12);
  });

  it("quinzenal soma 14 dias", () => {
    const d = new Date(2026, 0, 5);
    expect(addRecurrence(d, "quinzenal", 1).getDate()).toBe(19);
  });

  it("mensal termina no dia da semana pretendido (preserva lógica do cron)", () => {
    const d = new Date(2026, 0, 5); // segunda-feira
    const next = addRecurrence(d, "mensal", 1);
    expect(next.getDay()).toBe(1);
  });

  it("mensal avança para a primeira 6.ª feira do mês seguinte (sem saltar mês)", () => {
    const d = new Date(2026, 9, 30); // 6.ª feira, fim do mês
    const next = addRecurrence(d, "mensal", 5);
    expect(next.getMonth()).toBe(10); // novembro
    expect(next.getDate()).toBe(6); // primeira 6.ª feira de novembro 2026
    expect(next.getDay()).toBe(5);
  });

  it("mensal com dia cedo no mês mantém mês correto (sem overflow)", () => {
    const d = new Date(2026, 0, 5); // 2.ª feira, 5 jan
    const next = addRecurrence(d, "mensal", 5);
    expect(next.getMonth()).toBe(1); // fevereiro
    expect(next.getDate()).toBe(6); // primeira 6.ª feira de fevereiro 2026
    expect(next.getDay()).toBe(5);
  });
});

describe("computeRecurrencePreview", () => {
  const base = { frequency: "semanal" as const, dayOfWeek: 1, time: "08:00" };

  it("sem data de fim devolve hasFim false", () => {
    const preview = computeRecurrencePreview(base, undefined);
    expect(preview.hasFim).toBe(false);
  });

  it("sem horário devolve zero ocorrências com data de fim", () => {
    const preview = computeRecurrencePreview({ ...base, time: "" }, "2026-02-01");
    expect(preview.hasFim).toBe(true);
    expect(preview.countAteFim).toBe(0);
  });

  it("conta ocorrências semanais até à data de fim futura", () => {
    const preview = computeRecurrencePreview(base, "2099-12-31T00:00:00");
    expect(preview.countAteFim).toBeGreaterThan(50);
    expect(preview.effective).toBe(preview.countAteFim);
    expect(preview.limitCompleto).toBe(false);
  });

  it("aplica o limite de ocorrências", () => {
    const preview = computeRecurrencePreview({ ...base, maxOccurrences: 2 }, "2099-12-31T00:00:00");
    expect(preview.effective).toBe(2);
    expect(preview.limitCompleto).toBe(true);
  });

  it("data de fim no passado devolve zero ocorrências", () => {
    const preview = computeRecurrencePreview(base, "2020-01-01T00:00:00");
    expect(preview.countAteFim).toBe(0);
  });
});