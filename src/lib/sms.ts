interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const provider = process.env.SMS_PROVIDER;
  
  if (!provider) {
    console.warn('SMS provider não configurado - SMS não serão enviados');
    console.log('[SMS] Não enviado:', options);
    return false;
  }

  try {
    switch (provider) {
      case 'twilio':
        return await sendTwilioSMS(options);
      case 'aws-sns':
        return await sendAWSSNS(options);
      default:
        console.error('SMS provider desconhecido:', provider);
        return false;
    }
  } catch (error) {
    console.error('[SMS] Erro ao enviar:', error);
    return false;
  }
}

async function sendTwilioSMS(options: SMSOptions): Promise<boolean> {
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

  console.log('[SMS] Enviado via Twilio para:', options.to);
  return true;
}

async function sendAWSSNS(options: SNSOptions): Promise<boolean> {
  const { SNSClient, PublishCommand } = await import('@aws-sdk/client-sns');
  const client = new SNSClient({ region: process.env.AWS_REGION });

  await client.send(new PublishCommand({
    TopicArn: process.env.AWS_SNS_TOPIC_ARN,
    Message: options.message,
    PhoneNumber: options.to,
  }));

  console.log('[SMS] Enviado via AWS SNS para:', options.to);
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
  premio: string
): Promise<boolean> {
  const message = `Parabens ${nome}! Voce ganhou o sorteio ${jogoNome} - Premio: ${premio}. Contacte a organizacao para receber. - Aldeias Games`;
  return sendSMS({ to: telefone, message: message });
}

export async function sendTicketSMS(
  telefone: string,
  nome: string,
  jogoNome: string,
  numeros: string[]
): Promise<boolean> {
  const message = `Ola ${nome}! O seu bilhete para ${jogoNome}: ${numeros.join(', ')}. Boa sorte! - Aldeias Games`;
  return sendSMS({ to: telefone, message: message });
}