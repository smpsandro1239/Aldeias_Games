import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Configuração S3/R2 (opcional - usar se configurado)
const S3_BUCKET = process.env.S3_BUCKET || process.env.R2_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || process.env.R2_SECRET_KEY;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.R2_PUBLIC_URL;

const useObjectStorage = !!(S3_BUCKET && S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY);

/**
 * Garantir que o diretório de uploads existe (apenas para storage local)
 */
async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validar arquivo de imagem
 */
export function validateImageFile(
  base64String: string,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // Verificar se é uma string base64 válida
  if (!base64String.startsWith('data:image/')) {
    return { valid: false, error: 'Formato de imagem inválido' };
  }

  // Extrair tamanho aproximado
  const base64Data = base64String.split(',')[1];
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB > maxSizeMB) {
    return {
      valid: false,
      error: `Imagem muito grande (${sizeInMB.toFixed(2)}MB). Máximo: ${maxSizeMB}MB`,
    };
  }

  // Verificar tipo MIME
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const mimeType = base64String.split(';')[0].split(':')[1];

  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Tipo de imagem não suportado: ${mimeType}. Use: JPG, PNG, WebP ou GIF`,
    };
  }

  return { valid: true };
}

/**
 * Fazer upload para S3/R2
 */
async function uploadToS3(
  buffer: Buffer,
  filename: string,
  folder: string,
  mimeType: string
): Promise<string> {
  // Implementação simplificada - em produção usar AWS SDK ou @aws-sdk/client-s3
  // Para R2 da Cloudflare, usar endpoint específico
  const key = `${folder}/${filename}`;
  
  // TODO: Implementar upload real para S3/R2
  // Por agora, fallback para storage local
  console.log(`[S3/R2] Upload para ${S3_BUCKET}/${key} (não implementado - usando storage local)`);
  throw new Error('S3/R2 upload não implementado - usando fallback local');
}

/**
 * Salvar imagem base64 como arquivo
 */
export async function saveImage(
  base64String: string,
  folder: string = 'general'
): Promise<{ url: string; filename: string }> {
  const validation = validateImageFile(base64String);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Extrair dados base64 e extensão
  const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Formato base64 inválido');
  }

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `${uuidv4()}.${ext}`;
  const mimeType = `image/${ext}`;

  // Tentar S3/R2 primeiro se configurado
  if (useObjectStorage) {
    try {
      const url = await uploadToS3(buffer, filename, folder, mimeType);
      return { url, filename };
    } catch (error) {
      console.warn('S3/R2 upload falhou, usando storage local:', error);
    }
  }

  // Fallback para storage local
  await ensureUploadDir();

  // Criar pasta específica se não existir
  const folderPath = path.join(UPLOAD_DIR, folder);
  if (!existsSync(folderPath)) {
    await mkdir(folderPath, { recursive: true });
  }

  const filepath = path.join(folderPath, filename);

  // Salvar arquivo
  await writeFile(filepath, buffer);

  // Retornar URL pública
  const url = `/uploads/${folder}/${filename}`;

  return { url, filename };
}

/**
 * Apagar imagem
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Se for URL S3/R2, usar API correspondente
    if (useObjectStorage && S3_PUBLIC_URL && url.startsWith(S3_PUBLIC_URL)) {
      // TODO: Implementar delete S3/R2
      console.log(`[S3/R2] Delete ${url} (não implementado)`);
      return true;
    }

    // Storage local
    const relativePath = url.replace(/^\/uploads\//, '');
    const filepath = path.join(UPLOAD_DIR, relativePath);

    if (existsSync(filepath)) {
      await unlink(filepath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao apagar imagem:', error);
    return false;
  }
}

/**
 * Obter extensão de arquivo a partir do MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  return map[mimeType] || 'bin';
}
