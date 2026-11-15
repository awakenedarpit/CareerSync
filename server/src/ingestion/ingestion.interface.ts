/**
 * CarrerSync Document Ingestion Engine Interfaces
 * Phase 09 — Zero-Cost Resilient Document Parser Architecture
 */

export interface ParseResult {
  text: string;
  metadata?: Record<string, any>;
  requiresManualReview?: boolean;
  warning?: string;
}

export interface IDocumentParser {
  /**
   * Evaluates if this parser can handle the provided MIME type or filename.
   */
  canParse(mimeType: string, filename: string): boolean;

  /**
   * Parses the binary document buffer into structured text and metadata.
   */
  parse(buffer: Buffer, filename?: string): Promise<ParseResult>;
}

export interface IngestionResult {
  text: string;
  metadata?: Record<string, any>;
  requiresManualReview?: boolean;
  warning?: string;
  detectedSections?: string[];
  characterCount?: number;
  wordCount?: number;
  lineCount?: number;
}

export interface IngestionOptions {
  mimeType?: string;
  filename?: string;
  skipNormalization?: boolean;
}
