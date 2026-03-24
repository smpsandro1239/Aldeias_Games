import { describe, expect, it } from '@jest/globals';

describe('Validações', () => {
  describe('Telefone Português', () => {
    const telefoneRegex = /^(?:(?:\+|00)351)?[2-9][0-9]{8}$/;

    it('deve validar número português válido com +351', () => {
      expect(telefoneRegex.test('+351912345678')).toBe(true);
    });

    it('deve validar número português válido sem +351', () => {
      expect(telefoneRegex.test('912345678')).toBe(true);
    });

    it('deve validar número de telemóvel', () => {
      expect(telefoneRegex.test('+351961234567')).toBe(true);
    });

    it('não deve validar número com poucos dígitos', () => {
      expect(telefoneRegex.test('91234')).toBe(false);
    });

    it('não deve validar número com prefixo inválido', () => {
      expect(telefoneRegex.test('+351112345678')).toBe(false);
    });
  });

  describe('Password', () => {
    const passwordMinLength = 8;

    it('deve aceitar password com 8 caracteres', () => {
      expect('12345678'.length >= passwordMinLength).toBe(true);
    });

    it('deve aceitar password com mais de 8 caracteres', () => {
      expect('minhasenhaforte123'.length >= passwordMinLength).toBe(true);
    });

    it('não deve aceitar password com menos de 8 caracteres', () => {
      expect('curta'.length >= passwordMinLength).toBe(false);
    });
  });

  describe('Email', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('deve validar email válido', () => {
      expect(emailRegex.test('user@example.com')).toBe(true);
    });

    it('deve validar email com subdomain', () => {
      expect(emailRegex.test('user@mail.example.com')).toBe(true);
    });

    it('não deve validar email sem @', () => {
      expect(emailRegex.test('userexample.com')).toBe(false);
    });

    it('não deve validar email sem domínio', () => {
      expect(emailRegex.test('user@')).toBe(false);
    });
  });
});
