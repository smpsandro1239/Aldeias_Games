// Serviço de resultados oficiais do Euromilhões
// Usa API pública gratuita para obter o primeiro número do sorteio

type Resultado = {
  numeros: number[];
  data: string;
};

const APIs = [
  "https://euromillions-api.vercel.app/api/euromillions/latest",
  "https://api.fugete.com/euromillions/latest",
];

async function fetchResultado(apiUrl: string): Promise<Resultado | null> {
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();

    // Adapta diferentes formatos de resposta
    const numbers: number[] =
      data.numeros ??
      data.numbers ??
      data.numerosSorteados ??
      data.results?.numbers ??
      data.draw?.numbers ??
      [];

    const drawDate: string =
      data.dataSorteio ??
      data.drawDate ??
      data.date ??
      data.data ??
      "";

    if (!Array.isArray(numbers) || numbers.length === 0) return null;
    return { numeros: numbers.map(Number), data: drawDate };
  } catch {
    return null;
  }
}

export async function getLatestFirstNumber(): Promise<{
  numero: number | null;
  fonte: "api" | "manual";
}> {
  for (const url of APIs) {
    const result = await fetchResultado(url);
    if (result && result.numeros.length > 0) {
      return { numero: result.numeros[0], fonte: "api" };
    }
  }
  return { numero: null, fonte: "manual" };
}
