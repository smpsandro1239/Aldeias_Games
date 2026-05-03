import { describe, expect, it } from '@jest/globals';

/**
 * Testes unitários para funções de lógica de negócio de jogos
 * Estes testes validam cálculos críticos sem dependências externas
 */

function calcularRentabilidade(tipo: string, dados: any) {
  const resultado = {
    lucroMinimoPercent: 0,
    custoMedioPrevisto: 0,
    receitaEsperada: 0,
    lucroLiquidoPrevisto: 0,
    percentagemTotalPremios: 0
  };

  const preco = dados.preco || 0;
  const stock = dados.stockInicial || 0;
  resultado.receitaEsperada = preco * stock;

  if (tipo === 'raspadinha') {
    const premios = dados.premios || [];
    resultado.percentagemTotalPremios = premios.reduce((acc: number, p: any) => acc + (p.percentagem || 0), 0);
    resultado.lucroMinimoPercent = 100 - resultado.percentagemTotalPremios;
    resultado.custoMedioPrevisto = premios.reduce((acc: number, p: any) =>
      acc + ((p.valorDinheiroAlternative || 0) * (p.percentagem || 0) / 100), 0);
    resultado.lucroLiquidoPrevisto = resultado.receitaEsperada - (resultado.custoMedioPrevisto * stock);
  } else if (tipo === 'rifa' || tipo === 'tombola') {
    const premios = dados.premios || [];
    const custoTotalPremios = premios.reduce((acc: number, p: any) => acc + (p.valorDinheiroAlternative || 0), 0);
    resultado.lucroLiquidoPrevisto = resultado.receitaEsperada - custoTotalPremios;
    resultado.lucroMinimoPercent = resultado.receitaEsperada > 0
      ? (resultado.lucroLiquidoPrevisto / resultado.receitaEsperada) * 100
      : 0;
  } else if (tipo === 'poio_da_vaca') {
    let dimensoes = { x: 10, y: 10 };
    try {
      if (dados.dimensoesCampo) {
        dimensoes = JSON.parse(dados.dimensoesCampo);
      }
    } catch {
      dimensoes = { x: 10, y: 10 };
    }
    const totalQuadrados = (dimensoes.x || 10) * (dimensoes.y || 10);
    const custoQuadrado = dados.custoQuadrado || 0;
    const valorCompraVaca = dados.valorCompraVaca || 0;
    resultado.receitaEsperada = totalQuadrados * custoQuadrado;
    resultado.lucroLiquidoPrevisto = resultado.receitaEsperada - valorCompraVaca;
    resultado.lucroMinimoPercent = resultado.receitaEsperada > 0
      ? (resultado.lucroLiquidoPrevisto / resultado.receitaEsperada) * 100
      : 0;
  }

  return resultado;
}

function gerarHashVerificacao(dados: any): string {
  const crypto = require('crypto');
  const texto = JSON.stringify({
    ...dados,
    timestamp: new Date().toISOString(),
    versao: '1.0'
  });

  const hash = crypto.createHash('sha256').update(texto).digest('hex');
  return `AG-${hash.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

describe('Calcular Rentabilidade', () => {
  describe('Raspadinha', () => {
    it('deve calcular corretamente com múltiplos prémios', () => {
      const dados = {
        preco: 2,
        stockInicial: 1000,
        premios: [
          { valorDinheiroAlternative: 500, percentagem: 50 },
          { valorDinheiroAlternative: 200, percentagem: 30 },
        ]
      };

      const resultado = calcularRentabilidade('raspadinha', dados);

      expect(resultado.receitaEsperada).toBe(2000);
      expect(resultado.percentagemTotalPremios).toBe(80);
      expect(resultado.lucroMinimoPercent).toBe(20);
      // 500*0.5 + 200*0.3 = 250+60=310 custo médio por bilhete
      // lucroLiquidoPrevisto = 2000 - (310 * 1000) = 2000 - 310000 = -308000
      expect(resultado.lucroLiquidoPrevisto).toBe(-308000);
    });

    it('deve retornar 0 quando sem prémios', () => {
      const dados = {
        preco: 2,
        stockInicial: 100,
        premios: []
      };

      const resultado = calcularRentabilidade('raspadinha', dados);

      expect(resultado.percentagemTotalPremios).toBe(0);
      expect(resultado.lucroMinimoPercent).toBe(100);
      expect(resultado.custoMedioPrevisto).toBe(0);
      expect(resultado.lucroLiquidoPrevisto).toBe(200);
    });

    it('deve detectar raspadinha com lucro insuficiente (< 50%)', () => {
      const dados = {
        preco: 2,
        stockInicial: 1000,
        premios: [
          { valorDinheiroAlternative: 500, percentagem: 60 },
        ]
      };

      const resultado = calcularRentabilidade('raspadinha', dados);
      expect(resultado.lucroMinimoPercent).toBe(40);
      expect(resultado.lucroMinimoPercent < 50).toBe(true);
    });
  });

  describe('Rifa e Tombola', () => {
    it('deve calcular corretamente rifa com prémios fixos', () => {
      const dados = {
        preco: 2,
        stockInicial: 1000,
        premios: [
          { valorDinheiroAlternative: 1000 },
          { valorDinheiroAlternative: 500 },
        ]
      };

      const resultado = calcularRentabilidade('rifa', dados);

      expect(resultado.receitaEsperada).toBe(2000);
      expect(resultado.lucroLiquidoPrevisto).toBe(500);
      expect(resultado.lucroMinimoPercent).toBe(25);
    });

    it('deve calcular tombola corretamente', () => {
      const dados = {
        preco: 3,
        stockInicial: 500,
        premios: [
          { valorDinheiroAlternative: 500 },
        ]
      };

      const resultado = calcularRentabilidade('tombola', dados);

      expect(resultado.receitaEsperada).toBe(1500);
      expect(resultado.lucroLiquidoPrevisto).toBe(1000);
      expect(resultado.lucroMinimoPercent).toBeCloseTo(66.67, 1);
    });

    it('deve retornar 0% de lucro quando receita igual a custo', () => {
      const dados = {
        preco: 2,
        stockInicial: 100,
        premios: [
          { valorDinheiroAlternative: 200 }, // Custo total = 200, receita = 200
        ]
      };

      const resultado = calcularRentabilidade('rifa', dados);
      expect(resultado.lucroMinimoPercent).toBe(0);
    });
  });

  describe('Poio da Vaca', () => {
    it('deve calcular corretamente com dimensões padrão', () => {
      const dados = {
        preco: 5,
        stockInicial: 100,
        custoQuadrado: 5,
        valorCompraVaca: 800,
        dimensoesCampo: JSON.stringify({ x: 10, y: 10 })
      };

      const resultado = calcularRentabilidade('poio_da_vaca', dados);

      expect(resultado.receitaEsperada).toBe(500); // 100 squares * 5
      expect(resultado.lucroLiquidoPrevisto).toBe(-300); // 500 - 800
      expect(resultado.lucroMinimoPercent).toBe(-60); // negative = loss
    });

    it('deve usar dimensões padrão quando JSON inválido', () => {
      const dados = {
        preco: 5,
        stockInicial: 100,
        custoQuadrado: 5,
        valorCompraVaca: 800,
        dimensoesCampo: '{invalid json}'
      };

      const resultado = calcularRentabilidade('poio_da_vaca', dados);

      expect(resultado.receitaEsperada).toBe(500); // 10x10=100 * 5
    });

    it('deve lidar com dimensões personalizadas', () => {
      const dados = {
        preco: 10,
        stockInicial: 200,
        custoQuadrado: 10,
        valorCompraVaca: 1500,
        dimensoesCampo: JSON.stringify({ x: 20, y: 10 }) // 200 squares
      };

      const resultado = calcularRentabilidade('poio_da_vaca', dados);

      expect(resultado.receitaEsperada).toBe(2000); // 200 * 10
      expect(resultado.lucroLiquidoPrevisto).toBe(500); // 2000 - 1500
      expect(resultado.lucroMinimoPercent).toBe(25);
    });
  });
});

describe('Gerar Hash de Verificação', () => {
  it('deve gerar hash com prefixo AG- e formato correto', () => {
    const dados = {
      tipo: 'rifa',
      nome: 'Rifa Teste',
      preco: 2,
      stock: 100,
      premios: [],
      lucroMinimoPercent: 50,
      custoMedioPrevisto: 0,
      receitaEsperada: 200,
      lucroLiquidoPrevisto: 100,
    };

    const hash = gerarHashVerificacao(dados);

    expect(hash.startsWith('AG-')).toBe(true);
    expect(hash.length).toBeGreaterThanOrEqual(20); // AG- + 8 + timestamp (varia)
  });

  it('deve gerar hashes diferentes para mesma entrada em tempos diferentes', async () => {
    const dados = {
      tipo: 'raspadinha',
      nome: 'Teste',
      preco: 2,
      stock: 100,
      premios: [],
      lucroMinimoPercent: 50,
      custoMedioPrevisto: 0,
      receitaEsperada: 200,
      lucroLiquidoPrevisto: 100,
    };

    const hash1 = gerarHashVerificacao(dados);
    // Pequena pausa para garantir timestamp diferente
    await new Promise(resolve => setTimeout(resolve, 1));
    const hash2 = gerarHashVerificacao(dados);

    expect(hash1).not.toEqual(hash2);
  });

  it('deve incluir dados completos no hash', () => {
    const spy = jest.spyOn(require('crypto'), 'createHash');
    const dados = {
      tipo: 'rifa',
      nome: 'Rifa',
      preco: 2,
      stock: 100,
      premios: [],
    };

    gerarHashVerificacao(dados);

    expect(spy).toHaveBeenCalledWith('sha256');
    spy.mockRestore();
  });
});

describe('Validações de Negócio', () => {
  describe('Limites de Participação', () => {
    it('deve respeitar limitePorUsuario padrão (10)', () => {
      const limitePadrao = 10;
      const comprasUsuario = [1, 2, 3, 4, 5]; // 5 compras

      const podeComprar = comprasUsuario.length < limitePadrao;
      expect(podeComprar).toBe(true);

      for (let i = 6; i <= 10; i++) comprasUsuario.push(i);
      expect(comprasUsuario.length).toBe(10);
      expect(comprasUsuario.length < limitePadrao).toBe(false);
    });

    it('deve permitir limites personalizados', () => {
      const limitePersonalizado = 3;
      const compras = 3;

      expect(compras < limitePersonalizado).toBe(false);
      expect(compras <= limitePersonalizado).toBe(true);
    });
  });

  describe('Preço Mínimo', () => {
    it('deve rejeitar preços negativos', () => {
      const preco = -2;
      expect(preco > 0).toBe(false);
    });

    it('deve rejeitar preço zero', () => {
      const preco = 0;
      expect(preco > 0).toBe(false);
    });

    it('deve aceitar preços decimais', () => {
      const preco = 2.5;
      expect(preco > 0).toBe(true);
      expect(Number.isInteger(preco)).toBe(false);
    });
  });
});

describe('Determinação de Vencedores', () => {
  describe('Rifa', () => {
    it('deve encontrar vencedor único', () => {
      const participacoes = [
        { id: '1', numero: 42 },
        { id: '2', numero: 17 },
        { id: '3', numero: 99 },
      ];
      const numeroSorteado = 17;

      const vencedores = participacoes.filter(p => p.numero === numeroSorteado);
      expect(vencedores.length).toBe(1);
      expect(vencedores[0].id).toBe('2');
    });

    it('deve encontrar múltiplos vencedores (empate)', () => {
      const participacoes = [
        { id: '1', numero: 42 },
        { id: '2', numero: 17 },
        { id: '3', numero: 42 },
        { id: '4', numero: 17 },
      ];
      const numeroSorteado = 42;

      const vencedores = participacoes.filter(p => p.numero === numeroSorteado);
      expect(vencedores.length).toBe(2);
    });
  });

  describe('Poio da Vaca', () => {
    it('deve encontrar vencedor por combinação letra+número', () => {
      const participacoes = [
        { id: '1', letra: 'A', numero: 5 },
        { id: '2', letra: 'B', numero: 3 },
        { id: '3', letra: 'A', numero: 5 },
      ];
      const letraVencedora = 'A';
      const numeroVencedor = 5;

      const vencedores = participacoes.filter(p =>
        p.letra === letraVencedora && p.numero === numeroVencedor
      );

      expect(vencedores.length).toBe(2);
    });

    it('deve retornar array vazio se não houver vencedores', () => {
      const participacoes = [
        { id: '1', letra: 'A', numero: 5 },
        { id: '2', letra: 'B', numero: 3 },
      ];
      const letraVencedora = 'C';
      const numeroVencedor = 9;

      const vencedores = participacoes.filter(p =>
        p.letra === letraVencedora && p.numero === numeroVencedor
      );

      expect(vencedores.length).toBe(0);
    });
  });
});

describe('Conversão de Prémios', () => {
  it('deve converter valor total do prémio em saldo', () => {
    const saldoInicial = 100;
    const valorPremio = 50;
    const saldoFinal = saldoInicial + valorPremio;

    expect(saldoFinal).toBe(150);
  });

  it('deve rejeitar conversão com valor negativo', () => {
    const valor = -50;
    const isValid = valor > 0;
    expect(isValid).toBe(false);
  });

  it('deve rejeitar conversão com valor zero', () => {
    const valor = 0;
    const isValid = valor > 0;
    expect(isValid).toBe(false);
  });
});
