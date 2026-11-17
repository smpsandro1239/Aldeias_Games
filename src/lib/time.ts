// Serviço de hora oficial — WorldTimeAPI
// Usado para bloqueio e sorteio, evitando manipulação do relógio local

const WORLD_TIME_API = "https://worldtimeapi.org/api/timezone/Europe/Lisbon";
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // re-sync a cada 5 min

let cachedOffset: number | null = null; // offset em ms (server - official)
let lastSync = 0;

async function syncTime(): Promise<void> {
  try {
    const start = Date.now();
    const res = await fetch(WORLD_TIME_API, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`WorldTimeAPI respondeu com HTTP ${res.status}`);
    }

    const data: unknown = await res.json();
    const unixtime =
      typeof data === "object" && data !== null && "unixtime" in data
        ? (data as { unixtime?: unknown }).unixtime
        : undefined;

    if (typeof unixtime !== "number" || !Number.isFinite(unixtime) || unixtime <= 0) {
      throw new Error("WorldTimeAPI devolveu um timestamp inválido");
    }

    const roundtrip = Date.now() - start;
    const serverEstimate = start + roundtrip / 2;
    const officialTime = new Date(unixtime * 1000).getTime();
    if (!Number.isFinite(officialTime)) {
      throw new Error("WorldTimeAPI devolveu uma data fora do intervalo suportado");
    }

    cachedOffset = serverEstimate - officialTime;
    lastSync = Date.now();
  } catch {
    // Uma resposta inválida/indisponível não pode contaminar o relógio com NaN.
    // Preserva o último offset válido; sem cache, usa o relógio do servidor.
    if (cachedOffset === null || !Number.isFinite(cachedOffset)) cachedOffset = 0;
    lastSync = Date.now();
  }
}

export async function getOfficialTime(): Promise<Date> {
  if (cachedOffset === null || Date.now() - lastSync > SYNC_INTERVAL_MS) {
    await syncTime();
  }
  return new Date(Date.now() - (cachedOffset ?? 0));
}

export async function getOfficialTimeISO(): Promise<string> {
  const t = await getOfficialTime();
  return t.toISOString();
}

export function getNextFriday(reference: Date): Date {
  const day = reference.getDay(); // 0=Dom, 5=Sex, 6=Sáb
  let daysUntilFriday: number;
  if (day === 5 && reference.getHours() >= 21 && reference.getMinutes() >= 30) {
    // Já passou o sorteio de hoje → próxima sexta
    daysUntilFriday = 7;
  } else if (day <= 5) {
    daysUntilFriday = 5 - day;
  } else {
    daysUntilFriday = 5 + 7 - day;
  }
  const next = new Date(reference);
  next.setDate(next.getDate() + daysUntilFriday);
  next.setHours(21, 30, 0, 0); // sorteio oficial às 21:30
  return next;
}

export function getBloqueioData(sorteioData: Date, horasAntes = 2): Date {
  return new Date(sorteioData.getTime() - horasAntes * 60 * 60 * 1000);
}
