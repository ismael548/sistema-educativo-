/**
 * Utilidades de validación y seguridad para carga de archivos en Supabase Storage
 */

export const MAX_FILE_SIZE_SUBMISSIONS = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE_RESOURCES = 100 * 1024 * 1024; // 100MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'video/mp4',
] as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

/**
 * Sanitiza el nombre de un archivo previniendo ataques de path traversal y caracteres peligrosos.
 */
export function sanitizeFileName(originalName: string): string {
  // Elimina rutas relativas como ../ o ./
  const baseName = originalName.replace(/^.*[\\\/]/, '');
  
  // Reemplaza caracteres no alfanuméricos (excepto punto, guion y guion bajo)
  const cleanBase = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  
  // Previene dobles extensiones peligrosas (.php.png, etc)
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  return `${timestamp}-${randomStr}-${cleanBase}`;
}

/**
 * Valida tamaño, extensión y MIME type del archivo antes de subir a Storage.
 */
export function validateFile(
  file: File,
  maxSize: number = MAX_FILE_SIZE_SUBMISSIONS,
  allowedTypes: readonly string[] = ALLOWED_MIME_TYPES
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No se ha seleccionado ningún archivo.' };
  }

  // 1. Verificación de tamaño
  if (file.size > maxSize) {
    const sizeInMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo permitido de ${sizeInMB}MB.`,
    };
  }

  // 2. Verificación de tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido (${file.type || 'desconocido'}). Solo se permiten PDF, imágenes, ZIP y MP4.`,
    };
  }

  // 3. Sanitización de nombre
  const sanitizedName = sanitizeFileName(file.name);

  return {
    valid: true,
    sanitizedName,
  };
}
