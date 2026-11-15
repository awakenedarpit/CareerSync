/**
 * CarrerSync DOCX Document Parser
 * Phase 09 — Zero-Cost Resilient Document Parser Architecture
 *
 * Implements a clean, zero-cost DOCX parser using built-in Node.js zlib.
 * DOCX documents are OpenXML ZIP archives (PK\x03\x04).
 * Extracts word/document.xml, headers, and footers, and extracts structured text.
 */

import * as zlib from 'zlib';
import { IDocumentParser, ParseResult } from '../ingestion.interface';
import { unescapeXmlEntities } from '../normalizer';

interface ZipEntry {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  dataOffset?: number;
}

export class DocxParser implements IDocumentParser {
  private static readonly SUPPORTED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]);

  public canParse(mimeType: string, filename: string): boolean {
    const normalizedMime = (mimeType || '').trim().toLowerCase();
    if (DocxParser.SUPPORTED_MIME_TYPES.has(normalizedMime)) {
      return true;
    }

    const lowerFilename = (filename || '').trim().toLowerCase();
    return lowerFilename.endsWith('.docx');
  }

  public async parse(buffer: Buffer, filename?: string): Promise<ParseResult> {
    if (!buffer || buffer.length < 30) {
      return {
        text: '',
        requiresManualReview: true,
        warning: 'Invalid DOCX document: file is empty or corrupted (too short to be a valid ZIP archive).',
        metadata: { filename, sizeBytes: buffer ? buffer.length : 0 }
      };
    }

    // Verify ZIP magic bytes PK\x03\x04 or PK\x05\x06 (0x50 0x4B)
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return {
        text: '',
        requiresManualReview: true,
        warning: 'Invalid DOCX document: missing ZIP archive magic signature.',
        metadata: { filename, sizeBytes: buffer.length }
      };
    }

    try {
      const zipEntries = this.readZipEntries(buffer);
      if (zipEntries.length === 0) {
        return {
          text: '',
          requiresManualReview: true,
          warning: 'Invalid DOCX document: no files found in ZIP archive.',
          metadata: { filename, sizeBytes: buffer.length }
        };
      }

      // Find main document file word/document.xml
      const documentEntry = zipEntries.find(
        (e) => e.fileName === 'word/document.xml' || e.fileName.toLowerCase() === 'word/document.xml'
      );

      if (!documentEntry) {
        return {
          text: '',
          requiresManualReview: true,
          warning: 'Corrupted DOCX document: word/document.xml not found in archive.',
          metadata: { filename, sizeBytes: buffer.length }
        };
      }

      // Decompress word/document.xml
      const documentXml = this.extractEntryContent(buffer, documentEntry);
      if (!documentXml) {
        return {
          text: '',
          requiresManualReview: true,
          warning: 'Failed to decompress word/document.xml from DOCX archive.',
          metadata: { filename, sizeBytes: buffer.length }
        };
      }

      // Also optionally extract headers and footers for completeness
      const headerFooterEntries = zipEntries.filter((e) =>
        /^word\/(header\d+|footer\d+)\.xml$/i.test(e.fileName)
      );
      const additionalTexts: string[] = [];
      for (const entry of headerFooterEntries) {
        try {
          const xml = this.extractEntryContent(buffer, entry);
          if (xml) {
            const extracted = this.extractTextFromXml(xml);
            if (extracted.trim()) {
              additionalTexts.push(extracted.trim());
            }
          }
        } catch {
          // Non-critical; ignore optional header/footer errors
        }
      }

      const mainText = this.extractTextFromXml(documentXml);
      const combinedText = [mainText, ...additionalTexts].filter(Boolean).join('\n\n').trim();

      if (!combinedText) {
        return {
          text: '',
          requiresManualReview: true,
          warning: 'DOCX document contains no extractable text.',
          metadata: {
            filename,
            sizeBytes: buffer.length,
            entriesCount: zipEntries.length
          }
        };
      }

      return {
        text: combinedText,
        requiresManualReview: false,
        metadata: {
          filename,
          sizeBytes: buffer.length,
          hasHeadersFooters: additionalTexts.length > 0,
          entriesCount: zipEntries.length
        }
      };
    } catch (err: any) {
      return {
        text: '',
        requiresManualReview: true,
        warning: `Corrupted DOCX document processing failure: ${err.message || 'unknown error'}`,
        metadata: { filename, sizeBytes: buffer.length }
      };
    }
  }

  /**
   * Reads ZIP archive entries using the Central Directory (with local header fallback).
   */
  private readZipEntries(buffer: Buffer): ZipEntry[] {
    const entries: ZipEntry[] = [];

    // Attempt Central Directory parsing first
    const eocdOffset = this.findEndOfCentralDirectory(buffer);
    if (eocdOffset !== -1) {
      try {
        const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
        const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);

        let currOffset = centralDirOffset;
        for (let i = 0; i < totalEntries && currOffset + 46 <= buffer.length; i++) {
          const sig = buffer.readUInt32LE(currOffset);
          if (sig !== 0x02014b50) break;

          const compressionMethod = buffer.readUInt16LE(currOffset + 10);
          const compressedSize = buffer.readUInt32LE(currOffset + 20);
          const uncompressedSize = buffer.readUInt32LE(currOffset + 24);
          const fileNameLength = buffer.readUInt16LE(currOffset + 28);
          const extraLength = buffer.readUInt16LE(currOffset + 30);
          const commentLength = buffer.readUInt16LE(currOffset + 32);
          const localHeaderOffset = buffer.readUInt32LE(currOffset + 42);

          const fileName = buffer.toString(
            'utf8',
            currOffset + 46,
            currOffset + 46 + fileNameLength
          );

          entries.push({
            fileName,
            compressionMethod,
            compressedSize,
            uncompressedSize,
            localHeaderOffset
          });

          currOffset += 46 + fileNameLength + extraLength + commentLength;
        }

        if (entries.length > 0) {
          return entries;
        }
      } catch {
        // Fallback to local headers scan below
      }
    }

    // Fallback: Scan sequential Local File Headers (PK\x03\x04 = 0x04034b50)
    let offset = 0;
    while (offset + 30 <= buffer.length) {
      const sig = buffer.readUInt32LE(offset);
      if (sig === 0x04034b50) {
        const compressionMethod = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const uncompressedSize = buffer.readUInt32LE(offset + 22);
        const fileNameLength = buffer.readUInt16LE(offset + 26);
        const extraLength = buffer.readUInt16LE(offset + 28);

        const fileNameStart = offset + 30;
        const fileNameEnd = fileNameStart + fileNameLength;
        if (fileNameEnd <= buffer.length) {
          const fileName = buffer.toString('utf8', fileNameStart, fileNameEnd);
          const dataOffset = fileNameEnd + extraLength;

          entries.push({
            fileName,
            compressionMethod,
            compressedSize,
            uncompressedSize,
            localHeaderOffset: offset,
            dataOffset
          });

          if (compressedSize > 0) {
            offset = dataOffset + compressedSize;
            continue;
          }
        }
      }
      offset++;
    }

    return entries;
  }

  /**
   * Locates the End of Central Directory (EOCD) signature in the last 65KB of the file.
   */
  private findEndOfCentralDirectory(buffer: Buffer): number {
    const minEocdLength = 22;
    const maxSearchLength = Math.min(buffer.length, 65535 + minEocdLength);
    const searchStart = buffer.length - minEocdLength;
    const searchEnd = buffer.length - maxSearchLength;

    for (let i = searchStart; i >= searchEnd; i--) {
      if (
        buffer[i] === 0x50 &&
        buffer[i + 1] === 0x4b &&
        buffer[i + 2] === 0x05 &&
        buffer[i + 3] === 0x06
      ) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Decompresses an individual ZIP entry using zlib.
   */
  private extractEntryContent(buffer: Buffer, entry: ZipEntry): string | null {
    let dataOffset = entry.dataOffset;
    let compressedSize = entry.compressedSize;

    // If data offset was not precalculated from local header scan, read local header
    if (dataOffset === undefined) {
      const localOffset = entry.localHeaderOffset;
      if (localOffset + 30 > buffer.length) return null;
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) return null;

      const localFileNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      dataOffset = localOffset + 30 + localFileNameLength + localExtraLength;

      // In case local header had compressed size 0 (streaming data descriptor), use Central Dir size
      const localCompressedSize = buffer.readUInt32LE(localOffset + 18);
      if (localCompressedSize > 0) {
        compressedSize = localCompressedSize;
      }
    }

    if (dataOffset + compressedSize > buffer.length && compressedSize > 0) {
      return null;
    }

    const compressedSlice =
      compressedSize > 0
        ? buffer.subarray(dataOffset, dataOffset + compressedSize)
        : buffer.subarray(dataOffset);

    let decompressed: Buffer;
    if (entry.compressionMethod === 0) {
      // Stored (no compression)
      decompressed = compressedSlice;
    } else if (entry.compressionMethod === 8) {
      // Deflated
      try {
        decompressed = zlib.inflateRawSync(compressedSlice);
      } catch {
        try {
          decompressed = zlib.inflateSync(compressedSlice);
        } catch {
          return null;
        }
      }
    } else {
      // Unsupported compression method
      return null;
    }

    return decompressed.toString('utf8');
  }

  /**
   * Extracts clean text and paragraphs from OpenXML document.xml.
   */
  private extractTextFromXml(xml: string): string {
    if (!xml) return '';

    const paragraphs: string[] = [];

    // Match paragraphs: <w:p ...> ... </w:p>
    const paragraphRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
    let match: RegExpExecArray | null;

    while ((match = paragraphRegex.exec(xml)) !== null) {
      const pBody = match[1];

      // Handle breaks and tabs within paragraph
      const withTabsAndBreaks = pBody
        .replace(/<w:tab\s*\/?>/g, '\t')
        .replace(/<w:br(?:\s+[^>]*)?\/?>/g, '\n')
        .replace(/<w:cr\s*\/?>/g, '\n');

      // Extract text from <w:t ...>text</w:t>
      const textMatches = withTabsAndBreaks.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g);
      if (textMatches && textMatches.length > 0) {
        const paragraphText = textMatches
          .map((tTag) => {
            const inner = tTag.replace(/^<w:t(?:\s+[^>]*)?>/, '').replace(/<\/w:t>$/, '');
            return unescapeXmlEntities(inner);
          })
          .join('');

        if (paragraphText.trim()) {
          paragraphs.push(paragraphText.trim());
        }
      }
    }

    // If no <w:p> matched (e.g. malformed or simplified XML), fallback to extracting all <w:t>
    if (paragraphs.length === 0) {
      const allTextMatches = xml.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g);
      if (allTextMatches && allTextMatches.length > 0) {
        const fallbackText = allTextMatches
          .map((tTag) => {
            const inner = tTag.replace(/^<w:t(?:\s+[^>]*)?>/, '').replace(/<\/w:t>$/, '');
            return unescapeXmlEntities(inner);
          })
          .join(' ')
          .trim();

        if (fallbackText) {
          paragraphs.push(fallbackText);
        }
      }
    }

    return paragraphs.join('\n');
  }
}
