// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { determineRaspadinhaOutcome, buildGridFromOutcome, buildRaspadinhaPool, drawFromPool } from "@/app/api/participacoes/_lib/raspadinha";

describe("Raspadinha Game Logic - Critical", () => {
  describe("determineRaspadinhaOutcome", () => {
    const configWithPrizes = {
      premios: [
        { nome: "Euro", valorDinheiroAlternative: 100, percentagem: 30 },
        { nome: "Bebida", valorDinheiroAlternative: 10, percentagem: 50 },
        { nome: "Nada", valorDinheiroAlternative: 0, percentagem: 20 },
      ],
    };

    it("should return valid outcome structure", () => {
      const outcome = determineRaspadinhaOutcome(configWithPrizes);

      expect(outcome).toHaveProperty("hasWin");
      expect(outcome).toHaveProperty("winningPrize");
      expect(outcome).toHaveProperty("roll");
      expect(typeof outcome.hasWin).toBe("boolean");
      expect(typeof outcome.roll).toBe("number");
      expect(outcome.roll).toBeGreaterThanOrEqual(0);
      expect(outcome.roll).toBeLessThan(1);
    });

    it("should always lose when forceLoss=true", () => {
      // Run 100 times - all should lose
      for (let i = 0; i < 100; i++) {
        const outcome = determineRaspadinhaOutcome(configWithPrizes, true);
        expect(outcome.hasWin).toBe(false);
        expect(outcome.winningPrize).toBeNull();
      }
    });

    it("should sometimes win when forceLoss=false with prizes", () => {
      // 60% total probability (Euro 30% + Bebida 30%)
      let winCount = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const outcome = determineRaspadinhaOutcome(configWithPrizes);
        if (outcome.hasWin) winCount++;
      }

      // With 100% total probability, every roll wins
      expect(winCount).toBe(iterations);
    });

    it("should never win with 0% probability", () => {
      const zeroConfig = {
        premios: [{ nome: "Never", valorDinheiroAlternative: 100, percentagem: 0 }],
      };

      let winCount = 0;
      for (let i = 0; i < 100; i++) {
        const outcome = determineRaspadinhaOutcome(zeroConfig);
        if (outcome.hasWin) winCount++;
      }
      expect(winCount).toBe(0);
    });

    it("should return a winning prize when hasWin=true", () => {
      let foundWin = false;
      for (let i = 0; i < 500; i++) {
        const outcome = determineRaspadinhaOutcome(configWithPrizes);
        if (outcome.hasWin) {
          expect(outcome.winningPrize).not.toBeNull();
          expect(outcome.winningPrize!.nome).toBeDefined();
          foundWin = true;
          break;
        }
      }
      expect(foundWin).toBe(true);
    });

    it("should handle empty prizes array", () => {
      const emptyConfig = { premios: [] };
      const outcome = determineRaspadinhaOutcome(emptyConfig);
      expect(outcome.hasWin).toBe(false);
    });

    it("should handle 100% probability config", () => {
      const fullConfig = {
        premios: [{ nome: "Always", valorDinheiroAlternative: 1, percentagem: 100 }],
      };
      const outcome = determineRaspadinhaOutcome(fullConfig);
      expect(outcome.hasWin).toBe(true);
    });

    it("should handle 0% probability config", () => {
      const zeroConfig = {
        premios: [{ nome: "Never", valorDinheiroAlternative: 100, percentagem: 0 }],
      };
      const outcome = determineRaspadinhaOutcome(zeroConfig);
      expect(outcome.hasWin).toBe(false);
    });
  });

  describe("buildGridFromOutcome", () => {
    it("should build a grid with 9 items", () => {
      const config = {
        premios: [
          { nome: "Euro", valorDinheiroAlternative: 100, percentagem: 30 },
          { nome: "Nada", valorDinheiroAlternative: 0, percentagem: 70 },
        ],
      };

      const outcome = determineRaspadinhaOutcome(config);
      const grid = buildGridFromOutcome(outcome, config);

      expect(grid).toHaveLength(9);
      grid.forEach((item) => {
        expect(item).toHaveProperty("nome");
      });
    });

    it("should place winning prize at least once in grid when hasWin=true", () => {
      const config = {
        premios: [
          { nome: "Euro", valorDinheiroAlternative: 100, percentagem: 50 },
          { nome: "Nada", valorDinheiroAlternative: 0, percentagem: 50 },
        ],
      };

      let foundWinWithPrizeInGrid = false;
      for (let i = 0; i < 200; i++) {
        const outcome = determineRaspadinhaOutcome(config);
        if (outcome.hasWin && outcome.winningPrize) {
          const grid = buildGridFromOutcome(outcome, config);
          const hasPrizeInGrid = grid.some(
            (item) => item.nome === outcome.winningPrize!.nome
          );
          if (hasPrizeInGrid) {
            foundWinWithPrizeInGrid = true;
            break;
          }
        }
      }
      expect(foundWinWithPrizeInGrid).toBe(true);
    });

    it("should not place winning prize when hasWin=false", () => {
      const config = {
        premios: [
          { nome: "Special", valorDinheiroAlternative: 50, percentagem: 30 },
          { nome: "Nada", valorDinheiroAlternative: 0, percentagem: 70 },
        ],
      };

      const outcome = { hasWin: false, winningPrize: null, roll: 0.5 };
      const grid = buildGridFromOutcome(outcome, config);

      // Grid should not contain "Special" as a 3-match
      const specialCount = grid.filter((item) => item.nome === "Special").length;
      expect(specialCount).toBeLessThan(3);
    });

    it("never creates 3+ symbols of a prize with value on losing grids", () => {
      const config = {
        premios: [
          { nome: "Presunto", valorDinheiroAlternative: 50, percentagem: 2 },
          { nome: "Queijos", valorDinheiroAlternative: 25, percentagem: 5 },
          { nome: "Valor da Raspadinha", valorDinheiroAlternative: 2, percentagem: 10 },
        ],
      };

      for (let i = 0; i < 500; i++) {
        const outcome = { hasWin: false, winningPrize: null, roll: 0.99 };
        const grid = buildGridFromOutcome(outcome, config);
        expect(grid).toHaveLength(9);

        const counts = new Map<string, number>();
        grid.forEach((p) => counts.set(p.nome, (counts.get(p.nome) || 0) + 1));
        for (const [nome, count] of counts) {
          if (count >= 3) {
            const premio = config.premios.find((p) => p.nome === nome);
            expect(premio?.valorDinheiroAlternative ?? 0).toBe(0);
          }
        }
      }
    });
  });

  describe("buildRaspadinhaPool", () => {
    const premios = [
      { nome: "2 Euro", valorDinheiroAlternative: 2, percentagem: 30 },
      { nome: "5 Euro", valorDinheiroAlternative: 5, percentagem: 10 },
    ];

    it("contém exatamente round(stock × %/100) cópias de cada prémio e completa com Sem prémio", () => {
      const pool = buildRaspadinhaPool(premios, 10);
      expect(pool).toHaveLength(10);
      expect(pool.filter((n) => n === "2 Euro")).toHaveLength(3);
      expect(pool.filter((n) => n === "5 Euro")).toHaveLength(1);
      expect(pool.filter((n) => n === "Sem prémio")).toHaveLength(6);
    });

    it("não excede o stock quando o arredondamento soma mais que 100%", () => {
      const over = [
        { nome: "A", valorDinheiroAlternative: 1, percentagem: 50 },
        { nome: "B", valorDinheiroAlternative: 1, percentagem: 50 },
      ];
      const pool = buildRaspadinhaPool(over, 5);
      expect(pool).toHaveLength(5);
      expect(pool.every((n) => n === "A" || n === "B")).toBe(true);
    });

    it("é baralhado (não fica tudo no início)", () => {
      const pool = buildRaspadinhaPool([{ nome: "Prize", valorDinheiroAlternative: 1, percentagem: 20 }], 100);
      const prizeIdx = pool.map((n, i) => (n === "Prize" ? i : -1)).filter((i) => i >= 0);
      const spread = Math.max(...prizeIdx) - Math.min(...prizeIdx);
      expect(spread).toBeGreaterThan(10);
    });
  });

  describe("drawFromPool", () => {
    it("consome um item (sem reposição) e devolve o prémio correspondente", () => {
      const pool = ["Sem prémio", "Sem prémio", "Sem prémio", "2 Euro", "5 Euro"];
      const premios = [
        { nome: "2 Euro", valorDinheiroAlternative: 2 },
        { nome: "5 Euro", valorDinheiroAlternative: 5 },
      ];
      const before = pool.length;
      const outcome = drawFromPool(pool, premios);
      expect(pool).toHaveLength(before - 1);
      expect(typeof outcome.hasWin).toBe("boolean");
      if (outcome.hasWin) {
        expect(outcome.winningPrize).not.toBeNull();
        expect(pool.includes(outcome.winningPrize!.nome)).toBe(false);
      }
    });

    it("devolve perda quando o pool está vazio", () => {
      const outcome = drawFromPool([], []);
      expect(outcome.hasWin).toBe(false);
      expect(outcome.winningPrize).toBeNull();
    });

    it("após stock sorteios o pool fica vazio e o número de ganhadores é exato", () => {
      const premios = [
        { nome: "2 Euro", valorDinheiroAlternative: 2, percentagem: 30 },
        { nome: "5 Euro", valorDinheiroAlternative: 5, percentagem: 10 },
      ];
      const pool = buildRaspadinhaPool(premios, 10);
      let wins2 = 0;
      let wins5 = 0;
      for (let i = 0; i < 10; i++) {
        const outcome = drawFromPool(pool, premios);
        if (outcome.hasWin && outcome.winningPrize) {
          if (outcome.winningPrize.nome === "2 Euro") wins2++;
          if (outcome.winningPrize.nome === "5 Euro") wins5++;
        }
      }
      expect(pool).toHaveLength(0);
      expect(wins2).toBe(3);
      expect(wins5).toBe(1);
    });
  });
});
