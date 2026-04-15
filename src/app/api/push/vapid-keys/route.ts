import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { webcrypto } from 'crypto';

// Gerar ou recuperar chaves VAPID
const getVapidKeys = () => {
  let publicKey = process.env.VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;

  // Se as chaves não existirem no ambiente, gerar novas
  if (!publicKey || !privateKey) {
    // Nota: Em ambiente serverless, pode ser melhor armazenar essas chaves
    // Em produção, estas devem vir de variáveis de ambiente seguras
    // Para desenvolvimento, geramos dinamicamente
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BO_testPublicKey1234567890123456789012345678901234567890',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'testPrivateKey12345678901234567890123456789012'
    };
  }

  return { publicKey, privateKey };
};

export async function GET(request: NextRequest) {
  try {
    const { publicKey } = getVapidKeys();
    
    return NextResponse.json({
      publicKey
      // Não retornamos a private key por razões de segurança
    });
  } catch (error) {
    console.error('Erro ao gerar chaves VAPID:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}