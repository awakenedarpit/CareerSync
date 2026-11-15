import { describe, it, expect } from 'vitest';
import * as zlib from 'zlib';
import {
  PdfParser,
  DocxParser,
  ImageParser,
  PlainTextParser,
  normalizeText,
  normalizeDocument,
  unescapeXmlEntities,
  stripControlCharacters,
  standardizePunctuation,
  IngestionService
} from '../src/ingestion';

/**
 * Creates a synthetic minimal PDF buffer for testing.
 */
function createSyntheticPdf(contentStream: string, compress = false, isImageOnly = false): Buffer {
  let streamBytes = Buffer.from(contentStream, 'latin1');
  let filterStr = '';
  if (compress) {
    streamBytes = zlib.deflateSync(streamBytes);
    filterStr = '/Filter /FlateDecode\n';
  }

  const imageDict = isImageOnly ? '/Resources << /XObject << /Im1 << /Type /XObject /Subtype /Image >> >> >>\n' : '';

  const pdfHeader = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  ${imageDict}  /Contents 4 0 R
>>
endobj
4 0 obj
<<
  ${filterStr}  /Length ${streamBytes.length}
>>
stream
`;

  const headerBuf = Buffer.from(pdfHeader, 'latin1');
  const footerBuf = Buffer.from(
    '\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n500\n%%EOF',
    'latin1'
  );

  return Buffer.concat([headerBuf, streamBytes, footerBuf]);
}

/**
 * Creates a synthetic minimal DOCX ZIP buffer containing word/document.xml.
 */
function createSyntheticDocx(xmlContent: string): Buffer {
  const fileName = 'word/document.xml';
  const fileNameBuf = Buffer.from(fileName, 'utf8');
  const dataBuf = Buffer.from(xmlContent, 'utf8');
  const compressedData = zlib.deflateRawSync(dataBuf);

  // Local File Header
  const localHeader = Buffer.alloc(30 + fileNameBuf.length);
  localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(8, 8); // Deflate
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(0, 14);
  localHeader.writeUInt32LE(compressedData.length, 18);
  localHeader.writeUInt32LE(dataBuf.length, 22);
  localHeader.writeUInt16LE(fileNameBuf.length, 26);
  localHeader.writeUInt16LE(0, 28);
  fileNameBuf.copy(localHeader, 30);

  const centralDirOffset = localHeader.length + compressedData.length;

  // Central Directory Entry
  const cdEntry = Buffer.alloc(46 + fileNameBuf.length);
  cdEntry.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
  cdEntry.writeUInt16LE(20, 4);
  cdEntry.writeUInt16LE(20, 6);
  cdEntry.writeUInt16LE(0, 8);
  cdEntry.writeUInt16LE(8, 10);
  cdEntry.writeUInt16LE(0, 12);
  cdEntry.writeUInt16LE(0, 14);
  cdEntry.writeUInt32LE(0, 16);
  cdEntry.writeUInt32LE(compressedData.length, 20);
  cdEntry.writeUInt32LE(dataBuf.length, 24);
  cdEntry.writeUInt16LE(fileNameBuf.length, 28);
  cdEntry.writeUInt16LE(0, 30);
  cdEntry.writeUInt16LE(0, 32);
  cdEntry.writeUInt16LE(0, 34);
  cdEntry.writeUInt16LE(0, 36);
  cdEntry.writeUInt32LE(0, 38);
  cdEntry.writeUInt32LE(0, 42); // Offset of local header
  fileNameBuf.copy(cdEntry, 46);

  // End of Central Directory Record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // PK\x05\x06
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdEntry.length, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localHeader, compressedData, cdEntry, eocd]);
}

describe('Document Ingestion Engine', () => {
  describe('PDF Parser', () => {
    const pdfParser = new PdfParser();

    it('identifies PDF MIME types and file extensions', () => {
      expect(pdfParser.canParse('application/pdf', 'resume.pdf')).toBe(true);
      expect(pdfParser.canParse('', 'sample.PDF')).toBe(true);
      expect(pdfParser.canParse('application/octet-stream', 'doc.pdf')).toBe(true);
      expect(pdfParser.canParse('application/msword', 'document.docx')).toBe(false);
    });

    it('extracts text from uncompressed text stream', async () => {
      const stream = `
BT
/F1 12 Tf
72 712 Td
(John Doe - Software Engineer) Tj
0 -14 Td
(Skills: TypeScript, Node.js, PostgreSQL) Tj
ET
`;
      const pdfBuffer = createSyntheticPdf(stream, false);
      const result = await pdfParser.parse(pdfBuffer, 'resume.pdf');

      expect(result.requiresManualReview).toBe(false);
      expect(result.text).toContain('John Doe - Software Engineer');
      expect(result.text).toContain('Skills: TypeScript, Node.js, PostgreSQL');
    });

    it('extracts text from FlateDecode compressed stream', async () => {
      const stream = `
BT
/F1 14 Tf
100 700 Td
[(Jane) -20 (Smith) -150 (Lead) -20 (Architect)] TJ
0 -20 Td
(EDUCATION) Tj
0 -15 Td
(B.Tech in Computer Science, IIT Bombay) Tj
ET
`;
      const pdfBuffer = createSyntheticPdf(stream, true);
      const result = await pdfParser.parse(pdfBuffer, 'jane_resume.pdf');

      expect(result.requiresManualReview).toBe(false);
      expect(result.text).toContain('Jane');
      expect(result.text).toContain('Smith');
      expect(result.text).toContain('EDUCATION');
      expect(result.text).toContain('B.Tech in Computer Science');
    });

    it('handles hex encoded strings including UTF-16BE in PDF', async () => {
      // 48656c6c6f = Hello, 576f726c64 = World
      const stream = `
BT
<48656c6c6f20576f726c64> Tj
ET
`;
      const pdfBuffer = createSyntheticPdf(stream, false);
      const result = await pdfParser.parse(pdfBuffer);

      expect(result.requiresManualReview).toBe(false);
      expect(result.text).toContain('Hello World');
    });

    it('flags image-only or scanned PDF as requiring manual review', async () => {
      const stream = `
% Empty content stream with image resource
`;
      const pdfBuffer = createSyntheticPdf(stream, false, true);
      const result = await pdfParser.parse(pdfBuffer, 'scanned_cert.pdf');

      expect(result.requiresManualReview).toBe(true);
      expect(result.text).toBe('');
      expect(result.warning).toMatch(/scanned|optical character recognition|manual/i);
    });

    it('safely handles corrupted PDF buffers without crashing', async () => {
      const corruptedBuffer = Buffer.from('NOT_A_PDF_DOCUMENT_GARBAGE_BYTES_12345');
      const result = await pdfParser.parse(corruptedBuffer, 'corrupted.pdf');

      expect(result.requiresManualReview).toBe(true);
      expect(result.text).toBe('');
      expect(result.warning).toContain('Corrupted or unreadable PDF document');
    });

    it('detects encrypted PDFs and flags for manual review', async () => {
      const encryptedPdf = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Encrypt 2 0 R /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
      );
      const result = await pdfParser.parse(encryptedPdf, 'encrypted.pdf');

      expect(result.requiresManualReview).toBe(true);
      expect(result.warning).toMatch(/encrypted|password/i);
    });
  });

  describe('DOCX Parser', () => {
    const docxParser = new DocxParser();

    it('identifies DOCX MIME types and file extensions', () => {
      expect(
        docxParser.canParse(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'resume.docx'
        )
      ).toBe(true);
      expect(docxParser.canParse('', 'my_cv.DOCX')).toBe(true);
      expect(docxParser.canParse('application/pdf', 'file.pdf')).toBe(false);
    });

    it('extracts text from valid DOCX ZIP archive', async () => {
      const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Alex Morgan</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>PROFESSIONAL SUMMARY</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Senior Full-Stack Developer with 6 years experience in React &amp; Node.js.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>PROJECTS</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>• CareerSync Placement Platform - Real-time job portal</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

      const docxBuffer = createSyntheticDocx(docXml);
      const result = await docxParser.parse(docxBuffer, 'alex_resume.docx');

      expect(result.requiresManualReview).toBe(false);
      expect(result.text).toContain('Alex Morgan');
      expect(result.text).toContain('PROFESSIONAL SUMMARY');
      expect(result.text).toContain('React & Node.js');
      expect(result.text).toContain('CareerSync Placement Platform');
    });

    it('safely handles empty or corrupted DOCX without crashing', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const result = await docxParser.parse(emptyBuffer, 'empty.docx');

      expect(result.requiresManualReview).toBe(true);
      expect(result.warning).toContain('corrupted');

      const corruptedZip = Buffer.from('PK\x03\x04NOT_A_VALID_ZIP_ARCHIVE_DATA_123456');
      const corruptResult = await docxParser.parse(corruptedZip, 'corrupted.docx');

      expect(corruptResult.requiresManualReview).toBe(true);
    });

    it('handles DOCX with no readable text', async () => {
      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body></w:body></w:document>`;
      const docxBuffer = createSyntheticDocx(emptyXml);
      const result = await docxParser.parse(docxBuffer, 'blank.docx');

      expect(result.requiresManualReview).toBe(true);
      expect(result.warning).toMatch(/no extractable text/i);
    });
  });

  describe('Image Parser', () => {
    const imageParser = new ImageParser();

    it('identifies image MIME types and extensions', () => {
      expect(imageParser.canParse('image/png', 'cert.png')).toBe(true);
      expect(imageParser.canParse('image/jpeg', 'scan.jpg')).toBe(true);
      expect(imageParser.canParse('', 'certificate.PNG')).toBe(true);
      expect(imageParser.canParse('application/pdf', 'file.pdf')).toBe(false);
    });

    it('flags image/png for manual review with strict prompt warning', async () => {
      // PNG header: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52
      ]);

      const result = await imageParser.parse(pngBuffer, 'scanned_certificate.png');

      expect(result.text).toBe('');
      expect(result.requiresManualReview).toBe(true);
      expect(result.warning).toBe(
        'Scanned document or image format detected. Optical character recognition requires manual human review.'
      );
      expect(result.metadata?.format).toBe('png');
      expect(result.metadata?.ocrAvailable).toBe(false);
    });

    it('flags image/jpeg for manual review without hallucinating text', async () => {
      // JPEG header: FF D8 FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

      const result = await imageParser.parse(jpegBuffer, 'marksheet.jpg');

      expect(result.text).toBe('');
      expect(result.requiresManualReview).toBe(true);
      expect(result.warning).toBe(
        'Scanned document or image format detected. Optical character recognition requires manual human review.'
      );
      expect(result.metadata?.format).toBe('jpeg');
    });
  });

  describe('Text Normalizer', () => {
    it('unescapes XML/HTML entities', () => {
      const raw = 'React &amp; Next.js &lt;script&gt; &quot;quote&quot; &#39;apostrophe&#39; &#65;';
      const unescaped = unescapeXmlEntities(raw);
      expect(unescaped).toBe('React & Next.js <script> "quote" \'apostrophe\' A');
    });

    it('strips non-printable control characters preserving tabs and newlines', () => {
      const dirty = 'Hello\x00\x08World\t\x0B\x0CNext\nLine\x7F!';
      const cleaned = stripControlCharacters(dirty);
      expect(cleaned).toBe('HelloWorld\tNext\nLine!');
    });

    it('standardizes unicode smart punctuation', () => {
      const fancy = '“Smart quotes” and ‘single’ with em—dash and • bullet';
      const normalized = standardizePunctuation(fancy);
      expect(normalized).toBe('"Smart quotes" and \'single\' with em-dash and • bullet');
    });

    it('collapses multiple spaces and excessive newlines', () => {
      const input = 'First   Name:     John\n\n\n\n\nLast   Name:   Doe\n\n\n';
      const normalized = normalizeText(input);
      expect(normalized).toBe('First Name: John\n\nLast Name: Doe');
    });

    it('detects resume document sections', () => {
      const resume = `
JOHN DOE
john@example.com

PROFESSIONAL SUMMARY
Experienced software engineer passionate about distributed systems.

EDUCATION
B.Tech in Computer Science
XYZ University, 2020-2024

WORK EXPERIENCE
Senior Frontend Developer at Tech Corp
- Built scalable web applications

KEY PROJECTS
CareerSync AI Placement Portal
- Architected multi-tenant system

TECHNICAL SKILLS
TypeScript, React, Node.js, PostgreSQL, Docker

CERTIFICATIONS
AWS Certified Solutions Architect
`;
      const doc = normalizeDocument(resume);

      expect(doc.detectedSections).toContain('Summary');
      expect(doc.detectedSections).toContain('Education');
      expect(doc.detectedSections).toContain('Experience');
      expect(doc.detectedSections).toContain('Projects');
      expect(doc.detectedSections).toContain('Skills');
      expect(doc.detectedSections).toContain('Certifications');
      expect(doc.wordCount).toBeGreaterThan(40);
      expect(doc.characterCount).toBeGreaterThan(200);
    });
  });

  describe('Ingestion Service', () => {
    const service = new IngestionService();

    it('routes PDF buffers to PdfParser and normalizes text', async () => {
      const pdfStream = `
BT
/F1 12 Tf
(TECHNICAL SKILLS) Tj
0 -15 Td
(Node.js, TypeScript, PostgreSQL) Tj
ET
`;
      const pdfBuffer = createSyntheticPdf(pdfStream, true);
      const result = await service.ingestBuffer(pdfBuffer, {
        mimeType: 'application/pdf',
        filename: 'skills.pdf'
      });

      expect(result.requiresManualReview).toBe(false);
      expect(result.text).toContain('TECHNICAL SKILLS');
      expect(result.text).toContain('Node.js, TypeScript, PostgreSQL');
      expect(result.detectedSections).toContain('Skills');
    });

    it('routes DOCX buffers to DocxParser and normalizes text', async () => {
      const docXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>EDUCATION</w:t></w:r></w:p>
    <w:p><w:r><w:t>Master of Science in Artificial Intelligence</w:t></w:r></w:p>
  </w:body>
</w:document>`;
      const docxBuffer = createSyntheticDocx(docXml);
      const result = await service.ingestBuffer(docxBuffer, {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: 'education.docx'
      });

      expect(result.requiresManualReview).toBe(false);
      expect(result.text).toContain('EDUCATION');
      expect(result.text).toContain('Master of Science in Artificial Intelligence');
      expect(result.detectedSections).toContain('Education');
    });

    it('routes images to ImageParser and flags for manual review', async () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const result = await service.ingestBuffer(pngBuffer, {
        mimeType: 'image/png',
        filename: 'cert.png'
      });

      expect(result.requiresManualReview).toBe(true);
      expect(result.text).toBe('');
      expect(result.warning).toContain('Optical character recognition requires manual human review');
    });

    it('handles unsupported formats by marking manual review required', async () => {
      const binBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const result = await service.ingestBuffer(binBuffer, {
        mimeType: 'application/octet-stream',
        filename: 'unknown.bin'
      });

      expect(result.requiresManualReview).toBe(true);
      expect(result.warning).toContain('Unsupported document format');
    });
  });
});
