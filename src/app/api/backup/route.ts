import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { acao } = body;

    if (acao === 'backup') {
      const backupsDir = path.join(process.cwd(), 'backups');
      
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;
      const filepath = path.join(backupsDir, filename);

      const dados = await prisma.$transaction(async (tx) => {
        const aldeias = await tx.aldeia.findMany({ include: { users: true } });
        const users = await tx.user.findMany();
        const eventos = await tx.evento.findMany();
        const jogos = await tx.jogo.findMany();
        const participacoes = await tx.participacao.findMany();
        const premios = await tx.premio.findMany();
        const transacoes = await tx.transacao.findMany();
        const logs = await tx.logAcesso.findMany({ take: 1000 });

        return {
          aldeias,
          users,
          eventos,
          jogos,
          participacoes,
          premios,
          transacoes,
          logs,
          exportadoEm: new Date().toISOString(),
        };
      });

      fs.writeFileSync(filepath, JSON.stringify(dados, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Backup criado com sucesso',
        filename,
        filepath: `/backups/${filename}`,
      });
    }

    if (acao === 'restore') {
      const { filename } = body;

      if (!filename) {
        return NextResponse.json({ error: 'Nome do ficheiro é obrigatório' }, { status: 400 });
      }

      const filepath = path.join(process.cwd(), 'backups', filename);

      if (!fs.existsSync(filepath)) {
        return NextResponse.json({ error: 'Ficheiro de backup não encontrado' }, { status: 404 });
      }

      const content = fs.readFileSync(filepath, 'utf-8');
      const dados = JSON.parse(content);

      return NextResponse.json({
        success: true,
        message: 'Backup carregado - confirme os dados antes de restaurar',
        dadosPreview: {
          aldeias: dados.aldeias?.length || 0,
          users: dados.users?.length || 0,
          eventos: dados.eventos?.length || 0,
          jogos: dados.jogos?.length || 0,
          participacoes: dados.participacoes?.length || 0,
        },
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar backup:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getFullUserFromRequest({} as NextRequest);

    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const backupsDir = path.join(process.cwd(), 'backups');
    
    let files: string[] = [];
    
    if (fs.existsSync(backupsDir)) {
      files = fs.readdirSync(backupsDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();
    }

    const backups = files.map(filename => {
      const filepath = path.join(backupsDir, filename);
      const stats = fs.statSync(filepath);
      return {
        filename,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    });

    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
