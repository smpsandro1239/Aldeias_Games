import { fromZonedTime } from 'date-fns-tz';

// Singleton service for official time synchronization
class LotteryTimeService {
  private static instance: LotteryTimeService;
  private officialTimeOffsetMs: number = 0; // Diferença entre horário oficial e servidor
  private lastSync: number = 0;
  private readonly SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes max age before forced resync

  private constructor() {
    // Inicializar com tentativa de sincronização
    this.syncOfficialTime().catch(console.error);
  }

  public static getInstance(): LotteryTimeService {
    if (!LotteryTimeService.instance) {
      LotteryTimeService.instance = new LotteryTimeService();
    }
    return LotteryTimeService.instance;
  }

  // Sincroniza com fonte oficial (WorldTimeAPI)
  public async syncOfficialTime(force: boolean = false): Promise<void> {
    const now = Date.now();

    // Evitar sincronização muito frequente
    if (!force && (now - this.lastSync) < this.SYNC_INTERVAL_MS) {
      return;
    }

    try {
      // Usar WorldTimeAPI para obter horário oficial em Paris (CET/CEST para EuroMillions)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('http://worldtimeapi.org/api/timezone/Europe/Paris', {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`WorldTimeAPI returned ${response.status}`);
        }

        const data = await response.json();

        // Extrair timestamp UNIX em milissegundos
        const officialUnixtime = data.unixtime * 1000;
        const serverTime = Date.now();

        // Calcular offset (diferença entre horário oficial e servidor)
        this.officialTimeOffsetMs = officialUnixtime - serverTime;
        this.lastSync = now;

        console.log(`[LotteryTime] Sincronizado com WorldTimeAPI. Offset: ${this.officialTimeOffsetMs}ms`);
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('[LotteryTime] Falha na sincronização com WorldTimeAPI:', error);
      // Manter offset anterior (pode ser zero na primeira tentativa)
      // Em produção, poderia tentar múltiplas fontes ou usar NTP como fallback
    }
  }

  // Obter horário oficial atual (com correção aplicada)
  public getOfficialNow(): Date {
    // Forçar resync se muito tempo passou
    const now = Date.now();
    if ((now - this.lastSync) > this.MAX_AGE_MS) {
      // Não aguardar o sync aqui para não bloquear, mas marcar para próxima chamada
      this.syncOfficialTime(true).catch(() => {}); // Ignorar erro em background
    }

    return new Date(now + this.officialTimeOffsetMs);
  }

  // Verificar se estamos antes do cutoff para apostas
  // Ex: sorteio às 21:00 CET, cutoff 5 minutos antes = 20:55 CET
  public isBeforeCutoff(
    drawTimeCET: string = process.env.LOTTERY_DRAW_TIME_CET || '21:00',
    cutoffMinutes: number = Number(process.env.LOTTERY_CUTOFF_MINUTES) || 5
  ): boolean {
    const now = this.getOfficialNow();

    // Converter horário de sorteio CET para data oficial de hoje
    const [hours, minutes] = drawTimeCET.split(':').map(Number);
    const drawToday = fromZonedTime(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes),
      'Europe/Paris' // EuroMillions usa fuso de Paris (CET/CEST)
    );

    const cutoffTime = new Date(drawToday.getTime() - cutoffMinutes * 60 * 1000);

    return now < cutoffTime;
  }

  // Obter timestamp oficial para logging/auditoria
  public getOfficialTimestampForAudit(): number {
    return this.getOfficialNow().getTime();
  }

  // Forçar nova sincronização (útil para testes ou recuperação de erro)
  public async forceSync(): Promise<void> {
    return this.syncOfficialTime(true);
  }

  // Obter estatísticas de sincronização para monitoramento
  public getSyncInfo(): {
    offsetMs: number;
    lastSync: Date | null;
    ageMs: number;
    isStale: boolean;
  } {
    const now = Date.now();
    return {
      offsetMs: this.officialTimeOffsetMs,
      lastSync: this.lastSync > 0 ? new Date(this.lastSync) : null,
      ageMs: this.lastSync > 0 ? now - this.lastSync : Infinity,
      isStale: (now - this.lastSync) > this.MAX_AGE_MS
    };
  }
}

// Exportar instância singleton
export const lotteryTimeService = LotteryTimeService.getInstance();

// Função utilitária para middleware de proteção de rota
export async function enforceLotteryCutoff(
  request: Request,
  drawTimeCET: string = process.env.LOTTERY_DRAW_TIME_CET || '21:00',
  cutoffMinutes: number = Number(process.env.LOTTERY_CUTOFF_MINUTES) || 5
): Promise<Response | null> {
  const isBefore = lotteryTimeService.isBeforeCutoff(drawTimeCET, cutoffMinutes);

  if (!isBefore) {
    const cutoffTime = lotteryTimeService.getOfficialNow();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - cutoffMinutes);

    return new Response(
      JSON.stringify({
        error: 'Apostas encerradas',
        message: `O cutoff para apostas foi às ${cutoffTime.toLocaleTimeString('pt-PT', { timeZone: 'Europe/Lisbon' })} CET.`,
        cutoffTime: cutoffTime.toISOString(),
        officialTime: lotteryTimeService.getOfficialNow().toISOString()
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60' // Sugerir tentar novamente em 1 minuto
        }
      }
    );
  }

  return null; // Permitir continuar
}
