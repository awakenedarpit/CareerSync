/**
 * CarrerSync File Validation & Security Utilities
 * Phase 08 — File Integrity, Magic Byte Verification & Safety
 */

import path from 'path';
import { DocumentType } from '../storage/storage.types';
import { InvalidFileTypeError, FileTooLargeError } from '../storage/storage.errors';

export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_DOCUMENT_TYPES: DocumentType[] = [
  'resume',
  'academic_certificate',
  'technical_certificate',
  'project_evidence',
  'portfolio_attachment',
  'placement_document'
];

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

/**
 * File Signature (Magic Bytes) Definitions
 */
const MAGIC_SIGNATURES: Array<{
  mime: string;
  bytes: number[];
  offset?: number;
}> = [
  // PDF: %PDF-
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  // PNG: ‰PNG\r\n\x1a\n
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // JPEG: ÿØÿ
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  // DOCX / ZIP: PK\x03\x04
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    bytes: [0x50, 0x4b, 0x03, 0x04]
  }
];

/**
 * Validates that file buffer starts with expected magic signature bytes.
 */
export function verifyMagicSignature(buffer: Buffer, expectedMime: string): boolean {
  if (!buffer || buffer.length < 8) {
    return false;
  }

  const matches = MAGIC_SIGNATURES.filter((sig) => sig.mime === expectedMime);
  if (matches.length === 0) {
    return false;
  }

  return matches.some((sig) => {
    const offset = sig.offset || 0;
    if (buffer.length < offset + sig.bytes.length) {
      return false;
    }
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[offset + i] !== sig.bytes[i]) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Sanitizes original filenames to prevent path traversal, control character injection,
 * and malicious header manipulation.
 */
export function sanitizeFilename(rawFilename: string): string {
  if (!rawFilename) return 'document.pdf';

  // Extract base filename without directories
  const baseName = path.basename(rawFilename);

  // Replace null bytes, control characters, and risky shell characters
  let clean = baseName
    .replace(/[\0\x00-\x1f\x7f]/g, '')
    .replace(/[\\/:*?"<>|;&$!`]/g, '_')
    .trim();

  // Strip multiple periods to prevent extension spoofing
  clean = clean.replace(/\.{2,}/g, '.');

  // Limit filename length to 100 characters while preserving extension
  const ext = path.extname(clean);
  const nameWithoutExt = path.basename(clean, ext);

  if (nameWithoutExt.length > 80) {
    clean = `${nameWithoutExt.substring(0, 80)}${ext}`;
  }

  return clean || 'document.pdf';
}

/**
 * Comprehensive file integrity and policy validation.
 */
export function validateUploadFile(
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  },
  documentType: DocumentType,
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE
): void {
  // 1. Validate Document Category
  if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
    throw new InvalidFileTypeError(
      `Unsupported document category '${documentType}'. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
    );
  }

  // 2. Validate File Size
  if (file.size > maxSizeBytes) {
    throw new FileTooLargeError(maxSizeBytes, file.size);
  }

  if (file.size === 0) {
    throw new InvalidFileTypeError('Uploaded file is completely empty (0 bytes)');
  }

  // 3. Validate MIME type
  const normalizedMime = file.mimetype.toLowerCase();
  const allowedExtensions = ALLOWED_MIME_TYPES[normalizedMime];

  if (!allowedExtensions) {
    throw new InvalidFileTypeError(
      `MIME type '${file.mimetype}' is not permitted. Allowed types: PDF, PNG, JPEG, DOCX`
    );
  }

  // 4. Validate File Extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new InvalidFileTypeError(
      `File extension '${ext}' does not match declared MIME type '${file.mimetype}'`
    );
  }

  // 5. Inspect Magic Bytes / Signature
  const isValidSignature = verifyMagicSignature(file.buffer, normalizedMime);
  if (!isValidSignature) {
    throw new InvalidFileTypeError(
      `File binary signature (magic bytes) does not match expected format for '${file.mimetype}'. File content may be corrupted or disguised.`
    );
  }
}
