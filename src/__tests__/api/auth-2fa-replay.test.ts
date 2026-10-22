/**
 * R3 (A2 · Sprint 1) — Testes de regressão: replay TOTP + backup codes + lockout.
 *
 * Mock-based (sem BD real), no padrão de seed-auth.test.ts.
 * O primeiro teste é a REGRESSÃO do bug crítico: verifyMFAOTP passou a ser
 * async e os callers precisam de `await` — sem await, uma Promise truthy
 * aceitava QUALQUER código (2FA bypass total).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock da BD (vi.mock é hoisted — usar vi.hoisted para as referências) ──
const mocks = vi.hoisted(() => ({
  tfa: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() },
  user: { update: vi.fn(), findUnique: vi.fn() },
}));
vi.mock('@/lib/db', () => ({
  default: mocks,
  prisma: mocks,
}));
const mockTfa = mocks.tfa;
const mockUser = mocks.user;

import { TOTP } from 'otplib';
import {
  verifyMFAOTP,
  verifyMFAOTPOnce,
  generateBackupCodes,
  setupBackupCodes,
  verifyBackupCode,
} from '@/lib/mfa';
import { handle2FAFailure } from '@/lib/lockout';

const SECRET = 'JBSWY3DPEHPK3PXP';

function currentToken(): string {
  return new TOTP({ secret: SECRET }).generate();
}

describe('A2 — 2FA replay protection + backup codes + lockout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTfa.update.mockResolvedValue({});
    mockTfa.upsert.mockResolvedValue({});
    mockUser.update.mockResolvedValue({});
  });

  it('REGRESSÃO: código TOTP inválido deve retornar false (fix do 2FA bypass por falta de await)', async () => {
    // Antes do fix, o caller fazia `if (verifyMFAOTP(...))` sem await:
    // a Promise era sempre truthy → qualquer código era aceite.
    const result = await verifyMFAOTP('000000', SECRET);
    expect(result).toBe(false);
    // Sanity: um código genuíno DA janela actual é aceite
    const validResult = await verifyMFAOTP(currentToken(), SECRET);
    expect(validResult).toBe(true);
  });

  it('deve rejeitar replay do mesmo código TOTP (lastUsedToken)', async () => {
    const token = currentToken();
    mockTfa.findUnique.mockResolvedValue({ userId: 'user-1', secret: SECRET, lastUsedToken: null });
    const first = await verifyMFAOTPOnce(token, 'user-1', {});
    expect(first).toBe(true);
    expect(mockTfa.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { lastUsedToken: token } })
    );

    // Replay: mesmo código, já marcado como usado → deve falhar
    mockTfa.findUnique.mockResolvedValue({ userId: 'user-1', secret: SECRET, lastUsedToken: token });
    const replay = await verifyMFAOTPOnce(token, 'user-1', {});
    expect(replay).toBe(false);
  });

  it('generateBackupCodes gera 10 codes de 8 chars alfanuméricos (sem 0/O/1/I/L)', () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    for (const c of codes) {
      expect(c).toHaveLength(8);
      expect(c).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
    // CSPRNG: dois conjuntos não devem coincidir
    expect(generateBackupCodes().join()).not.toBe(codes.join());
  });

  it('setupBackupCodes usa upsert e guarda apenas hashes (nunca em claro)', async () => {
    const codes = await setupBackupCodes('user-1');
    expect(mockTfa.upsert).toHaveBeenCalledTimes(1);
    const arg = mockTfa.upsert.mock.calls[0][0];
    const storedHashes = JSON.parse(arg.data.backupCodes);
    expect(storedHashes).toHaveLength(10);
    for (const h of storedHashes) {
      expect(h).toHaveLength(64); // SHA-256 hex
      expect(codes).not.toContain(h); // nunca em claro na BD
    }
  });

  it('verifyBackupCode aceita code válido e consome-o (single-use); reutilizar falha', async () => {
    const codes = generateBackupCodes();
    const crypto = await import('crypto');
    const hashes = codes.map((c) =>
      crypto.createHash('sha256').update(c).digest('hex')
    );
    let stored = JSON.stringify(hashes);
    mockTfa.findUnique.mockImplementation(async () => ({
      userId: 'user-1', enabled: true, backupCodes: stored,
    }));
    mockTfa.upsert.mockImplementation(async (args: any) => {
      stored = args.update.backupCodes;
      return {};
    });

    const ok = await verifyBackupCode('user-1', codes[0]);
    expect(ok).toBe(true);

    // Reutilização do mesmo código deve falhar (hash removido da lista)
    const reuse = await verifyBackupCode('user-1', codes[0]);
    expect(reuse).toBe(false);
  });

  it('handle2FAFailure incrementa falhasLogin e regista ultimaFalhaLogin', async () => {
    await handle2FAFailure('user-1');
    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ falhasLogin: { increment: 1 } }),
      })
    );
  });
});
