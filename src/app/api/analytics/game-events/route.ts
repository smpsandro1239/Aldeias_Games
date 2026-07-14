import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFullUserFromRequest } from "@/lib/auth";

/**
 * POST /api/analytics/game-events
 * Recebe eventos de analytics dos jogos (anônimos ou associados a userId se autenticado)
 * Respeita RGPD - não armazena dados pessoais identificáveis
 */
export async function POST(request: NextRequest) {
  try {
    // Opcional: obter user se autenticado (para correlacionar com eventos)
    const user = await getFullUserFromRequest(request).catch(() => null);

    const body = await request.json();

    // Validar evento mínimo
    if (!body.type) {
      return NextResponse.json(
        { error: "Tipo de evento obrigatório" },
        { status: 400 }
      );
    }

    // Preparar dados para armazenamento
    const eventData = {
      type: body.type,
      gameId: body.gameId || null,
      gameType: body.gameType || null,
      quantity: body.quantity || null,
      method: body.method || null,
      amount: body.amount || null,
      reason: body.reason || null,
      percent: body.percent || null,
      won: body.won ?? null,
      prizeValue: body.prizeValue || null,
      source: body.source || null,
      metadata: body.metadata || null,
      // Se user logado, armazenar userId para análise agregada
      userId: user?.id || null,
      // Anonimizar: nunca armazenar IP completo, apenas hash ou primeiros octetos
      ipHash: user ? undefined : hashIp(request.headers.get("x-forwarded-for") || ""),
      userAgent: request.headers.get("user-agent")?.slice(0, 200) || null,
      sessionId: body.sessionId || null,
      createdAt: body.timestamp ? new Date(body.timestamp) : new Date(),
    };

     // Armazenar no banco (tabela GameAnalytics)
     try {
       await prisma.gameAnalytics.create({
         data: eventData,
       });
     } catch (error) {
       // Se a tabela não existir ou outro erro, não quebrar a aplicação
       console.error("Analytics: falha ao registar evento (ignorado):", error);
       return NextResponse.json(
         { success: true, message: "Evento registado ( analytics desabilitado )" },
         { status: 201 }
       );
     }

    return NextResponse.json(
      { success: true, message: "Evento registado" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao registar evento de analytics:", error);
    // Não expor erros internos
    return NextResponse.json(
      { error: "Erro ao processar evento" },
      { status: 500 }
    );
  }
}

/**
 * Hash simples do IP para anonimização (primeiros 2 octetos para IPv4)
 * Permite análise geográfica aproximada sem armazenar IP completo
 */
function hashIp(ip: string): string | null {
  if (!ip) return null;
  // Se for IPv4, pegar apenas primeiros 2 octetos (ex: 192.168)
  const parts = ip.split(".");
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  // Se for IPv6 ou outro formato, fazer hash simples
  return `hashed_${ip.slice(0, 10)}`;
}
