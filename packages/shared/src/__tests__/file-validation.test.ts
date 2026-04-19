import { describe, it, expect } from 'vitest';
import {
  ACCEPTED_MIME_TYPES,
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE,
  validateFile,
  isImageMimeType,
} from '../file-validation.js';

/**
 * MI-IT-26: Lista de tipos MIME aceites correcta
 * Validates: Requirements REQ-01
 */
describe('MI-IT-26: ACCEPTED_MIME_TYPES contains all 9 accepted types', () => {
  it('should contain exactly 9 MIME types', () => {
    expect(ACCEPTED_MIME_TYPES).toHaveLength(9);
  });

  it.each([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ])('should include %s', (mimeType) => {
    expect(ACCEPTED_MIME_TYPES).toContain(mimeType);
  });

  it('should export ACCEPTED_EXTENSIONS with 10 extensions', () => {
    expect(ACCEPTED_EXTENSIONS).toHaveLength(10);
    expect(ACCEPTED_EXTENSIONS).toContain('.jpg');
    expect(ACCEPTED_EXTENSIONS).toContain('.jpeg');
    expect(ACCEPTED_EXTENSIONS).toContain('.xlsx');
  });
});

/**
 * MI-IT-27: Tamanho máximo = 10 MB
 * Validates: Requirements REQ-01
 */
describe('MI-IT-27: MAX_FILE_SIZE equals 10 MB', () => {
  it('should equal 10_485_760 bytes (10 MB)', () => {
    expect(MAX_FILE_SIZE).toBe(10_485_760);
  });
});

/**
 * MI-IT-28: validateFile rejeita tipo inválido
 * Validates: Requirements REQ-01
 */
describe('MI-IT-28: validateFile rejects unsupported file types', () => {
  it('should reject application/zip', () => {
    const result = validateFile({ name: 'archive.zip', type: 'application/zip', size: 1000 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe(
      'Tipo de ficheiro não suportado. Tipos aceites: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX, XLS, XLSX'
    );
  });

  it('should reject application/x-msdownload', () => {
    const result = validateFile({
      name: 'program.exe',
      type: 'application/x-msdownload',
      size: 500,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Tipo de ficheiro não suportado');
  });

  it('should accept a valid MIME type', () => {
    const result = validateFile({ name: 'photo.jpg', type: 'image/jpeg', size: 2_000_000 });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

/**
 * MI-IT-29: validateFile rejeita tamanho excessivo
 * Validates: Requirements REQ-01
 */
describe('MI-IT-29: validateFile rejects files exceeding 10 MB', () => {
  it('should reject a 15 MB file', () => {
    const result = validateFile({ name: 'large.jpg', type: 'image/jpeg', size: 15_000_000 });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('O ficheiro excede o tamanho máximo de 10 MB');
  });

  it('should accept a file at exactly 10 MB', () => {
    const result = validateFile({ name: 'exact.png', type: 'image/png', size: 10_485_760 });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept a file under 10 MB', () => {
    const result = validateFile({ name: 'small.pdf', type: 'application/pdf', size: 5_000_000 });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('isImageMimeType', () => {
  it.each(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])(
    'should return true for %s',
    (mimeType) => {
      expect(isImageMimeType(mimeType)).toBe(true);
    }
  );

  it.each([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ])('should return false for %s', (mimeType) => {
    expect(isImageMimeType(mimeType)).toBe(false);
  });
});
