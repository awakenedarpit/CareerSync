/**
 * CarrerSync Plain Text / Markdown Document Parser
 * Phase 09 — Zero-Cost Resilient Document Parser Architecture
 */

import { IDocumentParser, ParseResult } from '../ingestion.interface';

export class PlainTextParser implements IDocumentParser {
  private static readonly SUPPORTED_MIME_TYPES = new Set([
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'text/csv',
    'application/json',
    'text/html'
  ]);

  private static readonly SUPPORTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm'];

  public canParse(mimeType: string, filename: string): boolean {
    const normalizedMime = (mimeType || '').trim().toLowerCase();
    if (PlainTextParser.SUPPORTED_MIME_TYPES.has(normalizedMime)) {
      return true;
    }

    const lowerFilename = (filename || '').trim().toLowerCase();
    return PlainTextParser.SUPPORTED_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
  }

  public async parse(buffer: Buffer, filename?: string): Promise<ParseResult> {
    if (!buffer || buffer.length === 0) {
      return {
        text: '',
        requiresManualReview: true,
        warning: 'Empty text document detected.',
        metadata: { filename, sizeBytes: 0 }
      };
    }

    try {
      const text = buffer.toString('utf8');
      return {
        text,
        requiresManualReview: false,
        metadata: {
          filename,
          sizeBytes: buffer.length
        }
      };
    } catch (err: any) {
      return {
        text: '',
        requiresManualReview: true,
        warning: `Failed to read text document: ${err.message}`,
        metadata: { filename, sizeBytes: buffer.length }
      };
    }
  }
}
