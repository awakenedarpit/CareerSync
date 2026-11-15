/**
 * CarrerSync Document Ingestion Service
 * Phase 09 — Zero-Cost Resilient Document Parser Architecture
 *
 * Orchestrates multi-format document parsing, storage retrieval,
 * and text normalization with zero paid external APIs.
 */

import { Readable } from 'stream';
import { StorageFactory } from '../storage/storage.factory';
import {
  IDocumentParser,
  IngestionOptions,
  IngestionResult,
  ParseResult
} from './ingestion.interface';
import { PdfParser, DocxParser, ImageParser, PlainTextParser } from './parsers';
import { normalizeDocument } from './normalizer';

export class IngestionService {
  private parsers: IDocumentParser[];

  constructor(customParsers?: IDocumentParser[]) {
    this.parsers = customParsers || [
      new PdfParser(),
      new DocxParser(),
      new ImageParser(),
      new PlainTextParser()
    ];
  }

  /**
   * Registers a custom parser with priority control.
   */
  public registerParser(parser: IDocumentParser, prepend: boolean = false): void {
    if (prepend) {
      this.parsers.unshift(parser);
    } else {
      this.parsers.push(parser);
    }
  }

  /**
   * Finds the first registered parser that claims compatibility with the MIME type or filename.
   */
  public getParser(mimeType?: string, filename?: string): IDocumentParser | null {
    const safeMime = (mimeType || '').trim().toLowerCase();
    const safeFilename = (filename || '').trim().toLowerCase();

    for (const parser of this.parsers) {
      if (parser.canParse(safeMime, safeFilename)) {
        return parser;
      }
    }

    return null;
  }

  /**
   * Ingests and processes a document buffer directly.
   */
  public async ingestBuffer(
    buffer: Buffer,
    options: IngestionOptions = {}
  ): Promise<IngestionResult> {
    const mimeType = options.mimeType || '';
    const filename = options.filename || 'document';

    const parser = this.getParser(mimeType, filename);
    if (!parser) {
      return {
        text: '',
        requiresManualReview: true,
        warning: `Unsupported document format for "${filename}" (MIME: ${mimeType || 'unknown'}). Document requires manual review.`,
        metadata: { filename, mimeType, sizeBytes: buffer.length },
        detectedSections: [],
        characterCount: 0,
        wordCount: 0,
        lineCount: 0
      };
    }

    const parseResult: ParseResult = await parser.parse(buffer, filename);

    // If parser signaled manual review or extracted no content
    if (parseResult.requiresManualReview || !parseResult.text || parseResult.text.trim().length === 0) {
      return {
        text: parseResult.text ? parseResult.text.trim() : '',
        requiresManualReview: true,
        warning:
          parseResult.warning ||
          'Document contains no readable text layer and requires manual human review.',
        metadata: {
          ...parseResult.metadata,
          filename,
          mimeType
        },
        detectedSections: [],
        characterCount: parseResult.text ? parseResult.text.trim().length : 0,
        wordCount: 0,
        lineCount: 0
      };
    }

    // Apply text normalization unless explicitly skipped
    if (!options.skipNormalization) {
      const normalized = normalizeDocument(parseResult.text);

      return {
        text: normalized.normalizedText,
        requiresManualReview: false,
        warning: parseResult.warning,
        metadata: {
          ...parseResult.metadata,
          filename,
          mimeType
        },
        detectedSections: normalized.detectedSections,
        characterCount: normalized.characterCount,
        wordCount: normalized.wordCount,
        lineCount: normalized.lineCount
      };
    }

    return {
      text: parseResult.text,
      requiresManualReview: false,
      warning: parseResult.warning,
      metadata: {
        ...parseResult.metadata,
        filename,
        mimeType
      },
      detectedSections: [],
      characterCount: parseResult.text.length,
      wordCount: (parseResult.text.match(/\S+/g) || []).length,
      lineCount: parseResult.text.split('\n').length
    };
  }

  /**
   * Retrieves a document from the storage provider and executes the full ingestion pipeline.
   */
  public async ingestFromStorage(
    storageKey: string,
    options: IngestionOptions = {}
  ): Promise<IngestionResult> {
    const storage = StorageFactory.getStorage();
    const downloadResult = await storage.download(storageKey);

    let buffer: Buffer;
    if (Buffer.isBuffer(downloadResult.stream)) {
      buffer = downloadResult.stream;
    } else if (downloadResult.stream instanceof Readable) {
      buffer = await this.streamToBuffer(downloadResult.stream);
    } else {
      throw new Error(`Unexpected stream format returned from storage for key: ${storageKey}`);
    }

    const mimeType = options.mimeType || downloadResult.mimeType || '';
    const filename =
      options.filename ||
      downloadResult.originalFilename ||
      storageKey.split('/').pop() ||
      'document';

    return this.ingestBuffer(buffer, {
      mimeType,
      filename,
      skipNormalization: options.skipNormalization
    });
  }

  /**
   * Converts a Node.js Readable stream into a unified Buffer.
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}

export const ingestionService = new IngestionService();
