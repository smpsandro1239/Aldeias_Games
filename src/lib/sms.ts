// Constants
const MAX_SMS_MESSAGE_LENGTH = 160;
const SMS_PROVIDERS = ['twilio', 'aws-sns'] as const;
const ALDEIAS_GAMES_SIGNATURE = ' - Aldeias Games';

interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  // Validate inputs
  if (!options.to || typeof options.to !== 'string') {
    console.error('[SMS] Invalid phone number');
    return false;
  }
  if (!options.message || typeof options.message !== 'string' || options.message.length > MAX_SMS_MESSAGE_LENGTH) {
    console.error('[SMS] Invalid message');
    return false;
  }

  const provider = process.env.SMS_PROVIDER;

  if (!provider) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('SMS provider não configurado - SMS não serão enviados');
    }
    return false;
  }

  if (!SMS_PROVIDERS.includes(provider as any)) {
    console.error('SMS provider desconhecido:', provider);
    return false;
  }

  try {
    switch (provider) {
      case 'twilio':
        return await sendTwilioSMS(options);
      case 'aws-sns':
        return await sendAWSSNS(options);
      default:
        return false;
    }
  } catch (error) {
    console.error('[SMS] Erro ao enviar:', error);
    return false;
  }
}

async function sendTwilioSMS(options: SMSOptions): Promise<boolean> {
  // @ts-ignore - twilio is an optional peer dependency
  const twilio = await import('twilio');
  const client = twilio.default(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: options.message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: options.to,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('[SMS] Enviado via Twilio');
  }
  return true;
}

async function sendAWSSNS(options: SNSOptions): Promise<boolean> {
  // @ts-ignore - @aws-sdk/client-sns is an optional peer dependency
  const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
  const client = new SNSClient({ region: process.env.AWS_REGION });

  await client.send(new PublishCommand({
    TopicArn: process.env.AWS_SNS_TOPIC_ARN,
    Message: options.message,
    PhoneNumber: options.to,
  }));

  if (process.env.NODE_ENV !== 'production') {
    console.log('[SMS] Enviado via AWS SNS');
  }
  return true;
}

interface SNSOptions {
  to: string;
  message: string;
}

export async function sendWinnerSMS(
  telefone: string,
  nome: string,
  jogoNome: string,
  premio: string,
  hash?: string
): Promise<boolean> {
  if (!telefone || !nome || !jogoNome || !premio) {
    console.error('[SMS] Missing required fields for winner SMS');
    return false;
  }

  let message = `Parabéns ${nome}! Você ganhou o sorteio ${jogoNome} - Prémio: ${premio}.`;
  if (hash) {
    message += ` Código de verificação: ${hash}`;
  }
  message += ` Contacte a organização para receber.${ALDEIAS_GAMES_SIGNATURE}`;
  return sendSMS({ to: telefone, message });
}

export async function sendTicketSMS(
  telefone: string,
  nome: string,
  jogoNome: string,
  numeros: string[],
  hash?: string
): Promise<boolean> {
  if (!telefone || !nome || !jogoNome || !numeros || !Array.isArray(numeros)) {
    console.error('[SMS] Missing required fields for ticket SMS');
    return false;
  }

  let message = `Olá ${nome}! O seu bilhete para ${jogoNome}: ${numeros.join(', ')}.`;
  if (hash) {
    message += ` Hash: ${hash}`;
  }
  message += ` Boa sorte!${ALDEIAS_GAMES_SIGNATURE}`;
  return sendSMS({ to: telefone, message });
}

export async function sendRaspadinhaSMS(
  telefone: string,
  nome: string,
  jogoNome: string,
  resultado: string,
  hash?: string
): Promise<boolean> {
  if (!telefone || !nome || !jogoNome || !resultado) {
    console.error('[SMS] Missing required fields for raspadinha SMS');
    return false;
  }

  let message = `Ola ${nome}! Resultado da Raspadinha ${jogoNome}: ${resultado}.`;
  if (hash) {
    message += ` Codigo de verificacao: ${hash}`;
  }
  message += ALDEIAS_GAMES_SIGNATURE;
  return sendSMS({ to: telefone, message });
}

export async function sendPoioDaVacaSMS(
  telefone: string,
  nome: string,
  jogoNome: string,
  coordenadas: { letra: string; numero: number }[],
  hash?: string
): Promise<boolean> {
  if (!telefone || !nome || !jogoNome || !coordenadas || !Array.isArray(coordenadas)) {
    console.error('[SMS] Missing required fields for poio da vaca SMS');
    return false;
  }

  const coordsStr = coordenadas.map(c => `${c.letra}${c.numero}`).join(', ');
  let message = `Ola ${nome}! Os seus numeros no ${jogoNome}: ${coordsStr}.`;
  if (hash) {
    message += ` Codigo de verificacao: ${hash}`;
  }
  message += ` Boa sorte!${ALDEIAS_GAMES_SIGNATURE}`;
  return sendSMS({ to: telefone, message });
}