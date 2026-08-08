import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { put, list, get } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const BLOB_PREFIX = 'backups/';

// Sanitizar filename para prevenir path traversal
function sanitizeFilename(filename: string): string {
  // Remover qualquer caractere que não seja alfanumérico, hífen, underscore ou ponto
  const sanitized = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  // Prevenir path traversal explícito
  if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
    throw new Error('Nome de ficheiro inválido');
  }
  return sanitized;
}

function hasBlobToken(): boolean {
  return typeof process.env.BLOB_READ_WRITE_TOKEN === 'string' && process.env.BLOB_READ_WRITE_TOKEN.length > 0;
}

function localBackupsDir(): string {
  return path.join(process.cwd(), 'backups');
}

async function storeBackup(filename: string, dados: unknown): Promise<{ location: string; storage: 'blob' | 'local' }> {
  const payload = JSON.stringify(dados, null, 2);
  if (hasBlobToken()) {
    const blob = await put(BLOB_PREFIX + filename, payload, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return { location: blob.url, storage: 'blob' };
  }
  const backupsDir = localBackupsDir();
  fs.mkdirSync(backupsDir, { recursive: true });
  fs.writeFileSync(path.join(backupsDir, filename), payload);
  return { location: `/backups/${filename}`, storage: 'local' };
}

async function readBackup(filename: string): Promise<string | null> {
  if (hasBlobToken()) {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    const item = blobs.find((b) => b.pathname === BLOB_PREFIX + filename);
    if (!item) return null;
    const res = await get(item.url, { access: 'private' });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return await new Response(res.stream).text();
  }
  // fallback local — com verificação de path traversal
  const backupsDir = localBackupsDir();
  const resolved = path.resolve(backupsDir, filename);
  if (!resolved.startsWith(path.resolve(backupsDir) + path.sep) && resolved !== path.resolve(backupsDir)) {
    return null;
  }
  if (!fs.existsSync(resolved)) return null;
  return fs.readFileSync(resolved, 'utf-8');
}

async function listBackups(): Promise<Array<{ filename: string; size: number; createdAt: string }>> {
  if (hasBlobToken()) {
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    return blobs
      .filter((b) => b.pathname.startsWith(BLOB_PREFIX) && b.pathname.endsWith('.json'))
      .map((b) => ({
        filename: b.pathname.slice(BLOB_PREFIX.length),
        size: b.size,
        createdAt: b.uploadedAt.toISOString(),
      }))
      .sort((a, b) => b.filename.localeCompare(a.filename));
  }
  const backupsDir = localBackupsDir();
  if (!fs.existsSync(backupsDir)) return [];
  return fs
    .readdirSync(backupsDir)
    .filter((f) => f.endsWith('.json'))
    .map((filename) => {
      const stats = fs.statSync(path.join(backupsDir, filename));
      return { filename, size: stats.size, createdAt: stats.birthtime.toISOString() };
    })
    .sort((a, b) => b.filename.localeCompare(a.filename));
}

interface BackupPayload {
  aldeias?: unknown[];
  users?: unknown[];
  eventos?: unknown[];
  jogos?: unknown[];
  premios?: unknown[];
  participacoes?: unknown[];
  transacoes?: unknown[];
  logs?: unknown[];
}

const PRISMA_MODELS: Record<keyof BackupPayload, string> = {
  aldeias: 'aldeia',
  users: 'user',
  eventos: 'evento',
  jogos: 'jogo',
  premios: 'premio',
  participacoes: 'participacao',
  transacoes: 'transacao',
  logs: 'logAcesso',
};

async function performRestore(dados: BackupPayload) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Eliminar na ordem inversa das dependências (FK)
    const tables: Array<keyof BackupPayload> = [
      'logs',
      'transacoes',
      'participacoes',
      'premios',
      'jogos',
      'eventos',
      'aldeias',
      'users',
    ];
    for (const table of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tx as any)[PRISMA_MODELS[table]].deleteMany({});
    }
    // Recriar na ordem direta das dependências
    for (const table of [...tables].reverse()) {
      const rows = dados[table];
      if (Array.isArray(rows) && rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tx as any)[PRISMA_MODELS[table]].createMany({ data: rows, skipDuplicates: true });
      }
    }
  });
  return {
    aldeias: dados.aldeias?.length || 0,
    users: dados.users?.length || 0,
    eventos: dados.eventos?.length || 0,
    jogos: dados.jogos?.length || 0,
    premios: dados.premios?.length || 0,
    participacoes: dados.participacoes?.length || 0,
    transacoes: dados.transacoes?.length || 0,
    logs: dados.logs?.length || 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // RBAC: backup requires MANAGE_ALDEIA (super_admin role)
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { acao } = body;

    if (acao === 'backup') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;

      const dados = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const aldeias = await tx.aldeia.findMany({ include: { users: { select: { id: true } } } });
        // Sem passwords dos utilizadores no backup
        const users = await tx.user.findMany({
          select: { id: true, nome: true, email: true, telefone: true, role: true },
        });
        const eventos = await tx.evento.findMany();
        const jogos = await tx.jogo.findMany();
        const participacoes = await tx.participacao.findMany();
        const premios = await tx.premio.findMany();
        const transacoes = await tx.transacao.findMany();
        const logs = await tx.logAcesso.findMany({ take: 1000 });

        return { aldeias, users, eventos, jogos, participacoes, premios, transacoes, logs, exportadoEm: new Date().toISOString() };
      });

      const { location, storage } = await storeBackup(filename, dados);

      return NextResponse.json({
        success: true,
        message: 'Backup criado com sucesso',
        filename,
        filepath: location,
        storage,
      });
    }

    if (acao === 'restore') {
      const { filename } = body;

      if (!filename) {
        return NextResponse.json({ error: 'Nome do ficheiro é obrigatório' }, { status: 400 });
      }

      // Sanitizar filename para prevenir path traversal
      let safeFilename: string;
      try {
        safeFilename = sanitizeFilename(filename);
      } catch {
        return NextResponse.json({ error: 'Nome de ficheiro inválido' }, { status: 400 });
      }

      if (safeFilename !== filename) {
        return NextResponse.json({ error: 'Nome de ficheiro inválido' }, { status: 400 });
      }

      const content = await readBackup(safeFilename);
      if (content === null) {
        return NextResponse.json({ error: 'Ficheiro de backup não encontrado' }, { status: 404 });
      }

      const dados = JSON.parse(content) as BackupPayload;

      const restaurado = await performRestore(dados);

      return NextResponse.json({
        success: true,
        message: 'Backup restaurado com sucesso',
        restaurado,
        aviso: 'Restauro substitui os dados atuais. Passwords não são restauradas (removidas no backup por segurança).',
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro ao processar backup:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const denied = await requirePermission(user.id, 'MANAGE_USERS');
    if (denied) return denied;

    const backups = await listBackups();

    return NextResponse.json({ success: true, backups, storage: hasBlobToken() ? 'blob' : 'local' });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}