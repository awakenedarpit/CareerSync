/**
 * CarrerSync Document Text Normalizer
 * Phase 09 — Zero-Cost Resilient Document Parser Architecture
 */

export interface NormalizedDocument {
  normalizedText: string;
  detectedSections: string[];
  characterCount: number;
  wordCount: number;
  lineCount: number;
}

/**
 * Standard section heading patterns commonly found in resumes and academic documents.
 */
const SECTION_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Summary', pattern: /^(?:professional\s+)?(?:summary|profile|objective|career\s+objective|about\s+me)\b/i },
  { name: 'Education', pattern: /^(?:education|academic\s+(?:background|qualifications|credentials|profile)|academics)\b/i },
  { name: 'Experience', pattern: /^(?:(?:work|professional|relevant)\s+)?(?:experience|employment(?:\s+history)?|internships?|work\s+history)\b/i },
  { name: 'Projects', pattern: /^(?:key\s+|technical\s+|academic\s+|personal\s+)?projects?\b/i },
  { name: 'Skills', pattern: /^(?:technical\s+|core\s+)?(?:skills|competencies|technologies|proficiencies|areas\s+of\s+expertise|programming\s+languages)\b/i },
  { name: 'Certifications', pattern: /^(?:certifications?|certificates?|licenses?(?:\s+and\s+certifications)?|courses?)\b/i },
  { name: 'Publications', pattern: /^(?:publications?|research(?:\s+papers)?|patents?)\b/i },
  { name: 'Achievements', pattern: /^(?:achievements?|honors?(?:\s+and\s+awards)?|awards?|accomplishments?)\b/i },
  { name: 'Extracurricular', pattern: /^(?:extracurricular(?:\s+activities)?|leadership|volunteer(?:ing)?(?:\s+experience)?)\b/i },
  { name: 'Languages', pattern: /^(?:languages?|known\s+languages)\b/i },
  { name: 'References', pattern: /^(?:references?|referees?)\b/i }
];

/**
 * Unescapes standard HTML and XML entities including decimal and hexadecimal character references.
 */
export function unescapeXmlEntities(text: string): string {
  if (!text) return '';

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return !isNaN(code) && code > 0 && code < 0x110000 ? String.fromCharCode(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return !isNaN(code) && code > 0 && code < 0x110000 ? String.fromCharCode(code) : '';
    });
}

/**
 * Cleans non-printable control characters, preserving tab and newline.
 */
export function stripControlCharacters(text: string): string {
  if (!text) return '';
  // Keep \t (0x09) and \n (0x0A). Remove NULL, BEL, BS, VT, FF, and control chars 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Also remove zero-width spaces and soft hyphens
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
}

/**
 * Standardizes unicode punctuation, smart quotes, dashes, and bullet marks.
 */
export function standardizePunctuation(text: string): string {
  if (!text) return '';

  return text
    // Smart quotes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Dashes (em-dash, en-dash, figure dash)
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-')
    // Standardize bullet points to standard bullet •
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF]\s*/g, '• ')
    // Unicode spaces to standard space
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ');
}

/**
 * Cleans and normalizes raw text extracted from documents.
 */
export function normalizeText(rawText: string): string {
  if (!rawText) return '';

  // 1. Unescape XML/HTML entities
  let text = unescapeXmlEntities(rawText);

  // 2. Strip harmful control characters
  text = stripControlCharacters(text);

  // 3. Standardize punctuation & smart characters
  text = standardizePunctuation(text);

  // 4. Standardize newlines (convert CRLF and CR to LF)
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 5. Clean up each line:
  // - collapse multiple spaces/tabs into single space (except leading indents)
  // - trim trailing whitespace
  const lines = text.split('\n').map((line) => {
    // Preserve single leading tab or up to 2 leading spaces if intentional, collapse rest
    const trimmedRight = line.replace(/[^\S\r\n]+$/, '');
    // Collapse consecutive horizontal whitespace inside line
    return trimmedRight.replace(/[^\S\r\n]{2,}/g, ' ');
  });

  text = lines.join('\n');

  // 6. Collapse excessive consecutive blank lines (limit to max 2 newlines = 1 blank line between blocks)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Normalizes document text and detects structural sections (Education, Skills, Experience, etc.).
 */
export function normalizeDocument(rawText: string): NormalizedDocument {
  const normalizedText = normalizeText(rawText);

  if (!normalizedText) {
    return {
      normalizedText: '',
      detectedSections: [],
      characterCount: 0,
      wordCount: 0,
      lineCount: 0
    };
  }

  const lines = normalizedText.split('\n');
  const detectedSections = new Set<string>();

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Headers are typically short lines (less than 60 chars) without ending periods
    if (trimmedLine.length > 0 && trimmedLine.length <= 60 && !trimmedLine.endsWith('.')) {
      // Strip common decor like leading numbers, bullets, colons or surrounding brackets
      const cleanHeaderCandidate = trimmedLine
        .replace(/^[\d\.\-\*•\s]+/, '')
        .replace(/[:\-_\s]+$/, '')
        .trim();

      for (const { name, pattern } of SECTION_PATTERNS) {
        if (pattern.test(cleanHeaderCandidate)) {
          detectedSections.add(name);
          break;
        }
      }
    }
  }

  const words = normalizedText.match(/\S+/g) || [];

  return {
    normalizedText,
    detectedSections: Array.from(detectedSections),
    characterCount: normalizedText.length,
    wordCount: words.length,
    lineCount: lines.length
  };
}
