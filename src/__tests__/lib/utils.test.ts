import { describe, expect, it } from '@jest/globals';

describe('Funções Utilitárias', () => {
  describe('formatCurrency', () => {
    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

    it('deve formatar número para euros', () => {
      expect(formatCurrency(10)).toBe('10,00 €');
    });

    it('deve formatar número com decimais', () => {
      expect(formatCurrency(10.5)).toBe('10,50 €');
    });

    it('deve formatar número grande', () => {
      expect(formatCurrency(1000)).toBe('1.000,00 €');
    });

    it('deve formatar zero', () => {
      expect(formatCurrency(0)).toBe('0,00 €');
    });
  });

  describe('formatDate', () => {
    const formatDate = (date: string | Date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    it('deve formatar data em português', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('deve formatar string de data', () => {
      expect(formatDate('2024-12-25')).toBe('25/12/2024');
    });
  });

  describe('generateSlug', () => {
    const generateSlug = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
    };

    it('deve converter texto para slug', () => {
      expect(generateSlug('Festa de Verão')).toBe('festa-de-verao');
    });

    it('deve remover caracteres especiais', () => {
      expect(generateSlug('Evento #1!')).toBe('evento-1');
    });

    it('deve converter espaços para hífens', () => {
      expect(generateSlug('Festa  de  Natal')).toBe('festa-de-natal');
    });
  });
});
