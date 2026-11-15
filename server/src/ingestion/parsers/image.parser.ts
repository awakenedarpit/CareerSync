/**
 * CarrerSync Image / Scanned Document Parser
 * Phase 09 — Zero-Cost Resilient Document Parser Architecture
 *
 * Implements strict handling for image formats and scanned documents.
 * Per specification: "If OCR is unavailable, mark the document as requiring manual review.
 * Do not pretend that scanned documents were successfully analyzed when no text was extracted."
 */

import { IDocumentParser, ParseResult } from '../ingestion.interface';

export class ImageParser implements IDocumentParser {
  private static readonly SUPPORTED_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]);

  private static readonly SUPPORTED_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.tiff',
    '.tif',
    '.bmp',
    '.gif',
    '.heic',
    '.heif'
  ];

  public canParse(mimeType: string, filename: string): boolean {
    const normalizedMime = (mimeType || '').trim().toLowerCase();
    if (ImageParser.SUPPORTED_MIME_TYPES.has(normalizedMime)) {
      return true;
    }

    const lowerFilename = (filename || '').trim().toLowerCase();
    return ImageParser.SUPPORTED_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
  }

  public async parse(buffer: Buffer, filename?: string): Promise<ParseResult> {
    if (!buffer || buffer.length === 0) {
      return {
        text: '',
        requiresManualReview: true,
        warning: 'Empty image file detected.',
        metadata: {
          sizeBytes: 0,
          filename: filename || 'unknown',
          ocrAvailable: false
        }
      };
    }

    const format = this.detectImageFormat(buffer);

    return {
      text: '',
      requiresManualReview: true,
      warning:
        'Scanned document or image format detected. Optical character recognition requires manual human review.',
      metadata: {
        format,
        sizeBytes: buffer.length,
        filename: filename || 'unknown',
        ocrAvailable: false
      }
    };
  }

  private detectImageFormat(buffer: Buffer): string {
    if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'png';
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'jpeg';
    }
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'webp';
    }
    if (
      buffer.length >= 4 &&
      ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
        (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
    ) {
      return 'tiff';
    }
    if (buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return 'bmp';
    }
    return 'image';
  }
}
