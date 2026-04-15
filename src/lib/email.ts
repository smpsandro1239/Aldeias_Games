import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST não configurado - emails não serão enviados');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('[Email] SMTP não configurado, email não enviado:', options);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@aldeias.pt',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log('[Email] Enviado para:', options.to);
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar:', error);
    return false;
  }
}

export async function sendWinnerEmail(
  email: string,
  nome: string,
  jogoNome: string,
  premio: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Parabéns! Você ganhou! 🎉',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Parabéns, ${nome}!</h1>
        <p>Você foi o vencedor do sorteio <strong>${jogoNome}</strong>!</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;"><strong>Prémio: ${premio}</strong></p>
        </div>
        <p>Por favor, contacte a organização para receber o seu prémio.</p>
        <p style="color: #666; font-size: 14px;">
          Com os melhores cumprimentos,<br/>
          A equipa Aldeias Games
        </p>
      </div>
    `,
    text: `Parabéns, ${nome}! Você ganhou o sorteio ${jogoNome} com o prémio: ${premio}. Contacte a organização para receber o seu prémio.`,
  });
}

export async function sendTicketEmail(
  email: string,
  nome: string,
  jogoNome: string,
  numeros: string[],
  eventoNome: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `O seu bilhete para ${jogoNome} 🎫`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">O seu bilhete</h1>
        <p>Olá, ${nome}!</p>
        <p>Aqui está o seu bilhete para <strong>${jogoNome}</strong> do evento <strong>${eventoNome}</strong>.</p>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">
            ${numeros.join(' - ')}
          </p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Guarde este email como comprovativo da sua participação.<br/>
          Boa sorte!<br/><br/>
          Com os melhores cumprimentos,<br/>
          A equipa Aldeias Games
        </p>
      </div>
    `,
    text: `Olá, ${nome}! O seu bilhete para ${jogoNome}: ${numeros.join(', ')}. Boa sorte!`,
  });
}