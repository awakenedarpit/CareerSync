/**
 * CarrerSync Zero-Cost PDF Document Parser
 * Phase 09 — Zero-Cost Resilient Document Parser Architecture
 *
 * Implements a clean, zero-cost PDF parser using built-in Node.js zlib.
 * Handles:
 * - PDF structure parsing (objects, streams, dictionaries)
 * - FlateDecode decompression (inflateSync / inflateRawSync)
 * - Text block extraction (BT ... ET, Tj, TJ, ', ")
 * - Literal string unescaping, octal escape sequences, and hex string decoding (including UTF-16BE)
 * - Detection of scanned image-only PDFs (marking requiresManualReview: true)
 * - Encrypted / password-protected PDF detection
 * - Safe error handling for corrupted PDF files
 */

import * as zlib from 'zlib';
import { IDocumentParser, ParseResult } from '../ingestion.interface';

export class PdfParser implements IDocumentParser {
  private static readonly SUPPORTED_MIME_TYPES = new Set([
    'application/pdf',
    'application/x-pdf',
    'application/acrobat',
    'applications/vnd.pdf',
    'text/pdf',
    'text/x-pdf'
  ]);

  public canParse(mimeType: string, filename: string): boolean {
    const normalizedMime = (mimeType || '').trim().toLowerCase();
    if (PdfParser.SUPPORTED_MIME_TYPES.has(normalizedMime)) {
      return true;
    }

    const lowerFilename = (filename || '').trim().toLowerCase();
    return lowerFilename.endsWith('.pdf');
  }

  public async parse(buffer: Buffer, filename?: string): Promise<ParseResult> {
    if (!buffer || buffer.length < 10) {
      return {
        text: '',
        requiresManualReview: true,
        warning: 'Invalid PDF document: file is empty or too small to be a valid PDF.',
        metadata: { filename, sizeBytes: buffer ? buffer.length : 0 }
      };
    }

    // Verify PDF header %PDF- (within first 1024 bytes)
    const headerSlice = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1');
    const pdfHeaderIndex = headerSlice.indexOf('%PDF-');
    if (pdfHeaderIndex === -1) {
      return {
        text: '',
        requiresManualReview: true,
        warning: 'Corrupted or unreadable PDF document format: missing %PDF header.',
        metadata: { filename, sizeBytes: buffer.length }
      };
    }

    try {
      // Check for encryption / password-protection
      const latin1Content = buffer.toString('latin1');
      if (this.isEncrypted(latin1Content)) {
        return {
          text: '',
          requiresManualReview: true,
          warning: 'PDF document is encrypted or password-protected. Cannot extract text without decryption key.',
          metadata: { filename, sizeBytes: buffer.length, encrypted: true }
        };
      }

      // Extract text from content streams
      const extractedStreams = this.extractStreams(buffer, latin1Content);
      const textPieces: string[] = [];

      for (const streamContent of extractedStreams) {
        const textFromStream = this.extractTextFromContentStream(streamContent);
        if (textFromStream.trim()) {
          textPieces.push(textFromStream.trim());
        }
      }

      // Also scan uncompressed raw objects for text blocks if stream extraction was sparse
      if (textPieces.length === 0) {
        const fallbackText = this.extractTextFromContentStream(latin1Content);
        if (fallbackText.trim()) {
          textPieces.push(fallbackText.trim());
        }
      }

      const combinedText = textPieces.join('\n\n').trim();

      // Check if document contains images but no extractable text (Scanned PDF)
      const hasImages = /\/Subtype\s*\/Image\b/i.test(latin1Content) || /\/XObject\b/i.test(latin1Content);
      const pageCount = this.estimatePageCount(latin1Content);

      if (!combinedText) {
        const warning = hasImages
          ? 'Scanned document or image format detected. Optical character recognition requires manual human review.'
          : 'PDF document contains no extractable text layer. Optical character recognition or manual review is required.';

        return {
          text: '',
          requiresManualReview: true,
          warning,
          metadata: {
            filename,
            sizeBytes: buffer.length,
            pageCount,
            hasImages,
            streamCount: extractedStreams.length
          }
        };
      }

      return {
        text: combinedText,
        requiresManualReview: false,
        metadata: {
          filename,
          sizeBytes: buffer.length,
          pageCount,
          hasImages,
          streamCount: extractedStreams.length
        }
      };
    } catch (err: any) {
      return {
        text: '',
        requiresManualReview: true,
        warning: `Corrupted or unreadable PDF document: ${err.message || 'parsing error'}`,
        metadata: { filename, sizeBytes: buffer.length }
      };
    }
  }

  /**
   * Checks if the PDF dictionary indicates password encryption.
   */
  private isEncrypted(content: string): boolean {
    return /\/Encrypt\s+\d+\s+\d+\s+R\b/i.test(content) || /\/Encrypt\s*<<[\s\S]*?>>/i.test(content);
  }

  /**
   * Estimates page count by searching for /Type /Page (excluding /Pages).
   */
  private estimatePageCount(content: string): number {
    const pageMatches = content.match(/\/Type\s*\/Page\b(?!\s*s)/g);
    return pageMatches ? pageMatches.length : 1;
  }

  /**
   * Locates and decompresses all stream objects in the PDF buffer.
   */
  private extractStreams(buffer: Buffer, latin1Content: string): string[] {
    const streams: string[] = [];
    const streamRegex = /stream(?:\r\n|\n|\r)/g;
    const endstreamKeyword = 'endstream';

    let match: RegExpExecArray | null;

    while ((match = streamRegex.exec(latin1Content)) !== null) {
      const streamStart = match.index + match[0].length;
      const streamEnd = latin1Content.indexOf(endstreamKeyword, streamStart);
      if (streamEnd === -1) break;

      // Extract dictionary preceding the stream
      const dictSearchSlice = latin1Content.substring(Math.max(0, match.index - 800), match.index);
      const isFlate =
        /\/Filter\s*\/FlateDecode\b/i.test(dictSearchSlice) ||
        /\/Filter\s*\[[^\]]*\/FlateDecode[^\]]*\]/i.test(dictSearchSlice) ||
        /\/Filter\s*\/Fl\b/i.test(dictSearchSlice);

      // Clean trailing CR/LF before endstream
      let actualEnd = streamEnd;
      if (actualEnd > streamStart && buffer[actualEnd - 1] === 0x0a) {
        actualEnd--;
        if (actualEnd > streamStart && buffer[actualEnd - 1] === 0x0d) {
          actualEnd--;
        }
      }

      if (actualEnd > streamStart) {
        const streamBytes = buffer.subarray(streamStart, actualEnd);

        if (isFlate) {
          try {
            const decompressed = zlib.inflateSync(streamBytes);
            streams.push(decompressed.toString('latin1'));
          } catch {
            try {
              const decompressed = zlib.inflateRawSync(streamBytes);
              streams.push(decompressed.toString('latin1'));
            } catch {
              // Decompression failed; try reading raw bytes if valid text
              const rawStr = streamBytes.toString('latin1');
              if (rawStr.includes('BT') && rawStr.includes('ET')) {
                streams.push(rawStr);
              }
            }
          }
        } else {
          // Uncompressed stream
          streams.push(streamBytes.toString('latin1'));
        }
      }

      // Move regex pointer past endstream
      streamRegex.lastIndex = streamEnd + endstreamKeyword.length;
    }

    return streams;
  }

  /**
   * Extracts text strings from PDF content streams by parsing BT ... ET blocks and operators.
   */
  private extractTextFromContentStream(streamContent: string): string {
    if (!streamContent) return '';

    const lines: string[] = [];

    // Extract blocks between BT (Begin Text) and ET (End Text)
    const btRegex = /BT([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;
    let foundBt = false;

    while ((btMatch = btRegex.exec(streamContent)) !== null) {
      foundBt = true;
      const blockContent = btMatch[1];
      const blockText = this.parseTextBlock(blockContent);
      if (blockText.trim()) {
        lines.push(blockText.trim());
      }
    }

    // If no BT...ET blocks were found, attempt loose operator matching
    if (!foundBt) {
      const looseText = this.parseTextBlock(streamContent);
      if (looseText.trim()) {
        lines.push(looseText.trim());
      }
    }

    return lines.join('\n');
  }

  /**
   * Parses PDF text operators inside a text block:
   * - (text) Tj
   * - [(t1) 10 (t2)] TJ
   * - (text) '
   * - aw ac (text) "
   * - <hex> Tj
   * - [ <hex> ... ] TJ
   * - T*, Td, TD line breaks
   */
  private parseTextBlock(block: string): string {
    const textPieces: string[] = [];
    const tokens = block.split(/(?:\r\n|\n|\r)/);

    for (const rawLine of tokens) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check for line positioning operators that mean a line break
      if (line === 'T*' || /^-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+T[dD]$/.test(line)) {
        if (textPieces.length > 0 && textPieces[textPieces.length - 1] !== '\n') {
          textPieces.push('\n');
        }
        continue;
      }

      // 1. Array TJ operator: [ ... ] TJ
      const tjRegex = /\[([\s\S]*?)\]\s*TJ\b/g;
      let tjMatch: RegExpExecArray | null;
      let handledByTj = false;

      while ((tjMatch = tjRegex.exec(line)) !== null) {
        handledByTj = true;
        const arrayBody = tjMatch[1];
        const extracted = this.parseTjArray(arrayBody);
        if (extracted) {
          textPieces.push(extracted);
        }
      }

      if (handledByTj) continue;

      // 2. Simple Tj operator: (string) Tj or <hex> Tj
      const tjSimpleRegex = /(?:\(([\s\S]*?)\)|<([0-9a-fA-F\s]+)>)\s*(?:Tj|['"])/g;
      let tjSimpleMatch: RegExpExecArray | null;
      let handledBySimple = false;

      while ((tjSimpleMatch = tjSimpleRegex.exec(line)) !== null) {
        handledBySimple = true;
        if (tjSimpleMatch[1] !== undefined) {
          textPieces.push(this.decodeLiteralString(tjSimpleMatch[1]));
        } else if (tjSimpleMatch[2] !== undefined) {
          textPieces.push(this.decodeHexString(tjSimpleMatch[2]));
        }
      }

      if (handledBySimple) {
        textPieces.push(' ');
        continue;
      }
    }

    return textPieces.join('').replace(/[ \t]+/g, ' ').trim();
  }

  /**
   * Parses an array argument for the TJ operator: e.g. [(Hello) -20 (World)]
   */
  private parseTjArray(arrayContent: string): string {
    const parts: string[] = [];
    // Match literal strings (...), hex strings <...>, or numbers
    const itemRegex = /\(([\s\S]*?)\)|<([0-9a-fA-F\s]+)>|(-?\d+(?:\.\d+)?)/g;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
      if (itemMatch[1] !== undefined) {
        // Literal string
        parts.push(this.decodeLiteralString(itemMatch[1]));
      } else if (itemMatch[2] !== undefined) {
        // Hex string
        parts.push(this.decodeHexString(itemMatch[2]));
      } else if (itemMatch[3] !== undefined) {
        // Spacing number: negative spacing < -120 usually represents a word break space
        const spacing = parseFloat(itemMatch[3]);
        if (spacing < -120) {
          parts.push(' ');
        }
      }
    }

    return parts.join('');
  }

  /**
   * Decodes a PDF literal string (handling balanced parentheses and escape sequences).
   */
  private decodeLiteralString(str: string): string {
    if (!str) return '';

    let result = '';
    let i = 0;
    while (i < str.length) {
      if (str[i] === '\\' && i + 1 < str.length) {
        i++;
        const nextChar = str[i];
        switch (nextChar) {
          case 'n':
            result += '\n';
            break;
          case 'r':
            result += '\r';
            break;
          case 't':
            result += '\t';
            break;
          case 'b':
            result += '\b';
            break;
          case 'f':
            result += '\f';
            break;
          case '(':
          case ')':
          case '\\':
            result += nextChar;
            break;
          default:
            // Check for octal escape \ddd (1-3 octal digits)
            if (/[0-7]/.test(nextChar)) {
              let octal = nextChar;
              if (i + 1 < str.length && /[0-7]/.test(str[i + 1])) {
                i++;
                octal += str[i];
                if (i + 1 < str.length && /[0-7]/.test(str[i + 1])) {
                  i++;
                  octal += str[i];
                }
              }
              result += String.fromCharCode(parseInt(octal, 8));
            } else {
              result += nextChar;
            }
        }
      } else {
        result += str[i];
      }
      i++;
    }

    return result;
  }

  /**
   * Decodes a PDF hexadecimal string e.g. <48656C6C6F> or UTF-16BE <FEFF...>.
   */
  private decodeHexString(hexStr: string): string {
    const cleanHex = hexStr.replace(/\s+/g, '');
    if (!cleanHex) return '';

    // If odd length, append 0 per PDF spec
    const normalized = cleanHex.length % 2 !== 0 ? cleanHex + '0' : cleanHex;

    // Check for UTF-16BE BOM (FEFF)
    if (normalized.toUpperCase().startsWith('FEFF')) {
      let result = '';
      for (let i = 4; i < normalized.length; i += 4) {
        if (i + 4 <= normalized.length) {
          const charCode = parseInt(normalized.substring(i, i + 4), 16);
          if (!isNaN(charCode)) {
            result += String.fromCharCode(charCode);
          }
        }
      }
      return result;
    }

    // Standard 1-byte ASCII / Latin1
    let result = '';
    for (let i = 0; i < normalized.length; i += 2) {
      const code = parseInt(normalized.substring(i, i + 2), 16);
      if (!isNaN(code)) {
        result += String.fromCharCode(code);
      }
    }
    return result;
  }
}
