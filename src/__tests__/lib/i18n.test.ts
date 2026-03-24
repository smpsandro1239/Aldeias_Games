import { describe, expect, it } from '@jest/globals';
import { translations, getTranslation, Language } from '@/lib/i18n/translations';

describe('Traduções i18n', () => {
  describe('Estrutura', () => {
    it('deve ter traduções para PT', () => {
      expect(translations.pt).toBeDefined();
      expect(translations.pt.common.save).toBe('Guardar');
    });

    it('deve ter traduções para EN', () => {
      expect(translations.en).toBeDefined();
      expect(translations.en.common.save).toBe('Save');
    });

    it('deve ter traduções para ES', () => {
      expect(translations.es).toBeDefined();
      expect(translations.es.common.save).toBe('Guardar');
    });
  });

  describe('getTranslation', () => {
    it('deve retornar tradução em PT', () => {
      expect(getTranslation('pt', 'common.save')).toBe('Guardar');
    });

    it('deve retornar tradução em EN', () => {
      expect(getTranslation('en', 'common.save')).toBe('Save');
    });

    it('deve retornar tradução em ES', () => {
      expect(getTranslation('es', 'common.save')).toBe('Guardar');
    });

    it('deve retornar a chave se não encontrar tradução', () => {
      expect(getTranslation('pt', 'inexistente')).toBe('inexistente');
    });

    it('deve retornar a chave para tradução aninhada não encontrada', () => {
      expect(getTranslation('pt', 'common.inexistente')).toBe('inexistente');
    });

    it('deve retornar tradução de dashboard', () => {
      expect(getTranslation('pt', 'dashboard.eventos')).toBe('Eventos');
      expect(getTranslation('en', 'dashboard.eventos')).toBe('Events');
    });
  });
});
