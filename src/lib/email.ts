import nodemailer from 'nodemailer';
import { escapeHtml } from './utils';

// Constants
const DEFAULT_SMTP_PORT = 587;
const DEFAULT_FROM_EMAIL = 'noreply@aldeias.pt';
const EMAIL_SIGNATURE = '\n\nCom os melhores cumprimentos,\nA equipa Aldeias Games';

const createTransporter = () => {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST não configurado - emails não serão enviados');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || DEFAULT_SMTP_PORT.toString(), 10),
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
  // Validate inputs
  if (!options.to || !options.subject || !options.html) {
    console.error('[Email] Missing required fields');
    return false;
  }

  const transporter = createTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Email] SMTP não configurado');
    }
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || DEFAULT_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Email] Enviado');
    }
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
  // Sanitize user-provided nome to prevent XSS in HTML emails
  const safeNome = escapeHtml(nome);
  // jogoNome and premio are from internal system, but sanitize defensively
  const safeJogoNome = escapeHtml(jogoNome);
  const safePremio = escapeHtml(premio);

  return sendEmail({
    to: email,
    subject: 'Parabéns! Você ganhou! 🎉',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Parabéns, ${safeNome}!</h1>
        <p>Você foi o vencedor do sorteio <strong>${safeJogoNome}</strong>!</p>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;"><strong>Prémio: ${safePremio}</strong></p>
        </div>
        <p>Por favor, contacte a organização para receber o seu prémio.</p>
        <p style="color: #666; font-size: 14px;">
          Com os melhores cumprimentos,<br/>
          A equipa Aldeias Games
        </p>
      </div>
    `,
    text: `Parabéns, ${safeNome}! Você ganhou o sorteio ${safeJogoNome} com o prémio: ${safePremio}. Contacte a organização para receber o seu prémio.${EMAIL_SIGNATURE}`,
  });
}

export async function sendTicketEmail(
  email: string,
  nome: string,
  jogoNome: string,
  numeros: string[],
  eventoNome: string
): Promise<boolean> {
  // Sanitize inputs
  const safeNome = escapeHtml(nome);
  const safeJogoNome = escapeHtml(jogoNome);
  const safeEventoNome = escapeHtml(eventoNome);
  const safeNumeros = numeros.map(n => escapeHtml(n));

  return sendEmail({
    to: email,
    subject: `O seu bilhete para ${safeJogoNome} 🎫`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">O seu bilhete</h1>
        <p>Olá, ${safeNome}!</p>
        <p>Aqui está o seu bilhete para <strong>${safeJogoNome}</strong> do evento <strong>${safeEventoNome}</strong>.</p>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">
            ${safeNumeros.join(' - ')}
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
    text: `Olá, ${safeNome}! O seu bilhete para ${safeJogoNome}: ${safeNumeros.join(', ')}. Boa sorte!${EMAIL_SIGNATURE}`,
  });
}