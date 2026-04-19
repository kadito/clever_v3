/**
 * File validation types, constants, and utilities.
 * Shared between frontend and backend for consistent validation.
 */

/** Reference to a file stored in R2 */
export interface FileReference {
  /** R2 full key, e.g. `files/work-sheets/{uuid}/{fileId}.jpg` */
  key: string;
  /** Original filename */
  name: string;
  /** MIME type, e.g. "image/jpeg", "application/pdf" */
  mimeType: string;
  /** Size in bytes */
  size: number;
}

/** Accepted MIME types for file uploads */
export const ACCEPTED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

/** Accepted file extensions for file uploads */
export const ACCEPTED_EXTENSIONS: readonly string[] = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
] as const;

/** Maximum file size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10_485_760;

/** Image MIME types subset */
const IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/** Result of file validation */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/** Validates a file's type and size */
export function validateFile(file: {
  name: string;
  type: string;
  size: number;
}): FileValidationResult {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        'Tipo de ficheiro não suportado. Tipos aceites: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'O ficheiro excede o tamanho máximo de 10 MB',
    };
  }

  return { valid: true };
}

/** Checks whether a MIME type is an image type */
export function isImageMimeType(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.has(mimeType);
}
