import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Garantir que o diretório de uploads existe
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
 * Salvar imagem base64 como arquivo
 */
export async function saveImage(
  base64String: string,
  folder: string = 'general'
): Promise<{ url: string; filename: string }> {
  await ensureUploadDir();

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

  // Criar pasta específica se não existir
  const folderPath = path.join(UPLOAD_DIR, folder);
  if (!existsSync(folderPath)) {
    await mkdir(folderPath, { recursive: true });
  }

  // Gerar nome único
  const filename = `${uuidv4()}.${ext}`;
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
    // Extrair caminho relativo da URL
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

/**
 * Comprimir imagem base64 (reduzir qualidade)
 * Nota: Em produção, usar Sharp para compressão real
 */
export function compressBase64Image(
  base64String: string,
  quality: number = 0.8
): string {
  // Por enquanto, apenas retorna a string original
  // Em produção, implementar compressão real com Sharp
  console.log(`Compressão simulada (qualidade: ${quality})`);
  return base64String;
}
