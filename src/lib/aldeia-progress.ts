import { Decimal } from '@prisma/client';

/**
 * Calcula o nível atual baseado na experiência
 * Fórmula simples: nível = floor(sqrt(experiencia / 100)) + 1
 * Pode ser ajustada conforme necessário
 */
export function calculateLevelFromExperience(experiencia: number): number {
  return Math.floor(Math.sqrt(experiencia / 100)) + 1;
}

/**
 * Calcula a experiência necessária para o próximo nível
 */
export function experienceForNextLevel(level: number): number {
  return (level * level) * 100;
}

/**
 * Calcula o progresso para o próximo nível (0-1)
 */
export function progressToNextLevel(experiencia: number, level: number): number {
  const currentLevelStart = (level - 1) * (level - 1) * 100;
  const nextLevelStart = level * level * 100;
  const progress = (experiencia - currentLevelStart) / (nextLevelStart - currentLevelStart);
  return Math.min(Math.max(progress, 0), 1);
}

/**
 * Adiciona experiência à aldeia e retorna se subiu de nível
 */
export async function addExperienceToAldeia(
  aldeiaId: string,
  experienciaParaAdicionar: number
): Promise<{
  aldeia: any;
  levelUp: boolean;
  oldLevel: number;
  newLevel: number;
}> {
  const prisma = require('@/lib/prisma').prisma; // Adjust import based on your setup
  
  // Get current aldeia
  const aldeia = await prisma.aldeia.findUnique({
    where: { id: aldeiaId },
    select: { id: true, experiencia: true, nivel: true, pontos: true, moedaInterna: true }
  });

  if (!aldeia) {
    throw new Error('Aldeia não encontrada');
  }

  const oldLevel = aldeia.nivel;
  const novaExperiencia = aldeia.experiencia + experienciaParaAdicionar;
  const newLevel = calculateLevelFromExperience(novaExperiencia);
  const levelUp = newLevel > oldLevel;

  // Calculate rewards based on level up
  let pontosParaAdicionar = 0;
  let moedaParaAdicionar = 0;

  // Base reward for participation
  pontosParaAdicionar = Math.floor(experienciaParaAdicionar / 10); // 1 ponto por 10 experiencia
  moedaParaAdicionar = Math.floor(experienciaParaAdicionar / 20); // 1 moeda por 20 experiencia

  // Bonus for level up
  if (levelUp) {
    pontosParaAdicionar += 50; // Bonus por subir de nível
    moedaParaAdicionar += 20;
  }

  // Update aldeia
  const updatedAldeia = await prisma.aldeia.update({
    where: { id: aldeiaId },
    data: {
      experiencia: novaExperiencia,
      nivel: newLevel,
      pontos: aldeia.pontos + pontosParaAdicionar,
      moedaInterna: new Decimal(aldeia.moedaInterna.toNumber() + moedaParaAdicionar)
    },
    select: {
      id: true,
      nome: true,
      experiencia: true,
      nivel: true,
      pontos: true,
      moedaInterna: true
    }
  });

  // Log the progression
  await prisma.auditLog.create({
    data: {
      aldeiaId: aldeiaId,
      action: 'ALDEIA_PROGRESSION',
      resource: 'Aldeia',
      resourceId: aldeiaId,
      metadata: {
        experienciaAdicionada: experienciaParaAdicionar,
        pontosAdicionados: pontosParaAdicionar,
        moedaAdicionada: moedaParaAdicionar,
        levelUp,
        oldLevel,
        newLevel
      }
    }
  });

  return {
    aldeia: updatedAldeia,
    levelUp,
    oldLevel,
    newLevel
  };
}

/**
 * Função para ser chamada quando um membro participa de um jogo/evento
 */
export async function handleMemberParticipation(
  aldeiaId: string,
  tipoParticipacao: 'jogo' | 'evento',
  valorParticipacao: number, // Valor em dinheiro gasto pelo membro
  ganhou: boolean = false
): Promise<{ aldeia: any; levelUp: boolean }> {
  // Base experiencia por participação
  let experienciaBase = 10;

  // Ajustar por tipo
  if (tipoParticipacao === 'evento') {
    experienciaBase *= 2; // Eventos valem mais
  }

  // Bonus se ganhou
  if (ganhou) {
    experienciaBase *= 1.5;
  }

  // Bonus baseado no valor gasto (mais gasto = mais experiencia para a aldeia)
  const experienciaPorValor = Math.floor(valorParticipacao / 5); // 1 experiencia por 5 de valor gasto
  const experienciaTotal = Math.floor(experienciaBase + experienciaPorValor);

  const result = await addExperienceToAldeia(aldeiaId, experienciaTotal);
  return result;
}

export default {
  calculateLevelFromExperience,
  experienceForNextLevel,
  progressToNextLevel,
  addExperienceToAldeia,
  handleMemberParticipation
};