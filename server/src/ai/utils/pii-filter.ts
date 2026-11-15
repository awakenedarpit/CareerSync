/**
 * PII Filter Utility
 * 
 * Sensitive Data Scrubber:
 * Redacts email addresses, phone numbers (Indian & international),
 * Aadhaar/PAN/SSN numbers, postal addresses, and person names before sending
 * document text to external AI models.
 */

export type RedactionType =
  | 'email'
  | 'phone'
  | 'aadhaar'
  | 'pan'
  | 'ssn'
  | 'address'
  | 'person_name';

export interface RedactionItem {
  type: RedactionType;
  originalSnippet: string;
  replacement: string;
  position?: number;
}

export interface PIIScrubResult {
  sanitizedText: string;
  redactions: RedactionItem[];
  redactedCount: number;
}

export class PIIFilter {
  // Regex definitions
  private static readonly EMAIL_REGEX =
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

  // Indian mobile & International phone patterns
  // Matches +91 9876543210, +91-98765-43210, (91) 9876543210, 09876543210, +1 (555) 123-4567, etc.
  private static readonly PHONE_REGEX =
    /(?:\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?[6-9]\d{4}[\s.-]?\d{5}\b)|(?:\b\+?[1-9]\d{0,2}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b)/g;

  // Indian Aadhaar: 12 digits, grouped into 4-4-4, first digit 2-9
  private static readonly AADHAAR_REGEX =
    /\b[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}\b|\b[2-9]\d{11}\b/g;

  // Indian PAN: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)
  private static readonly PAN_REGEX =
    /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;

  // US SSN: 3 digits - 2 digits - 4 digits
  private static readonly SSN_REGEX =
    /\b(?!000|666|9\d{2})\d{3}[-\s](?!00)\d{2}[-\s](?!0000)\d{4}\b/g;

  // Postal addresses & Pin codes
  private static readonly PINCODE_REGEX =
    /\b(?:PIN(?:\s*CODE)?|Postal\s*Code)?[:\s-]*\b[1-9][0-9]{5}\b/gi;

  private static readonly ADDRESS_LINE_REGEX =
    /(?:(?:Address|Residential\s*Address|Permanent\s*Address|Current\s*Address|Residence)[:\s]+)([^\n\r]+(?:[\n\r][ \t]+[^\n\r]+)?)/gi;

  private static readonly STREET_ADDRESS_REGEX =
    /\b\d{1,5}\s+[A-Za-z0-9\s.,#-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Nagar|Colony|Layout|Sector|Phase|Cross|Main)\b[^\n\r]*/gi;

  // Candidate Name patterns
  private static readonly EXPLICIT_NAME_REGEX =
    /(?:(?:Name|Candidate\s*Name|Full\s*Name)[:\s]+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g;

  /**
   * Scrubs PII from input text and returns sanitized text along with redaction log.
   */
  public static scrub(text: string): PIIScrubResult {
    if (!text || typeof text !== 'string') {
      return {
        sanitizedText: '',
        redactions: [],
        redactedCount: 0,
      };
    }

    const redactions: RedactionItem[] = [];
    let sanitized = text;

    // 1. Redact Email addresses
    sanitized = sanitized.replace(this.EMAIL_REGEX, (match, offset) => {
      const replacement = '[REDACTED_EMAIL]';
      redactions.push({
        type: 'email',
        originalSnippet: match,
        replacement,
        position: offset,
      });
      return replacement;
    });

    // 2. Redact PAN numbers
    sanitized = sanitized.replace(this.PAN_REGEX, (match, offset) => {
      const replacement = '[REDACTED_PAN]';
      redactions.push({
        type: 'pan',
        originalSnippet: match,
        replacement,
        position: offset,
      });
      return replacement;
    });

    // 3. Redact SSN numbers
    sanitized = sanitized.replace(this.SSN_REGEX, (match, offset) => {
      const replacement = '[REDACTED_SSN]';
      redactions.push({
        type: 'ssn',
        originalSnippet: match,
        replacement,
        position: offset,
      });
      return replacement;
    });

    // 4. Redact Aadhaar numbers
    sanitized = sanitized.replace(this.AADHAAR_REGEX, (match, offset) => {
      // Guard against false positives like 12-digit timestamps or generic counters
      const cleanDigits = match.replace(/[\s-]/g, '');
      if (cleanDigits.length === 12 && /^[2-9]/.test(cleanDigits)) {
        const replacement = '[REDACTED_AADHAAR]';
        redactions.push({
          type: 'aadhaar',
          originalSnippet: match,
          replacement,
          position: offset,
        });
        return replacement;
      }
      return match;
    });

    // 5. Redact Phone numbers
    sanitized = sanitized.replace(this.PHONE_REGEX, (match, offset) => {
      // Filter out matches that are dates or single small numbers
      const digitCount = match.replace(/\D/g, '').length;
      if (digitCount >= 10 && digitCount <= 15) {
        const replacement = '[REDACTED_PHONE]';
        redactions.push({
          type: 'phone',
          originalSnippet: match,
          replacement,
          position: offset,
        });
        return replacement;
      }
      return match;
    });

    // 6. Redact Postal addresses and Pin codes
    sanitized = sanitized.replace(this.ADDRESS_LINE_REGEX, (match, p1, offset) => {
      const replacement = `Address: [REDACTED_ADDRESS]`;
      redactions.push({
        type: 'address',
        originalSnippet: match,
        replacement,
        position: offset,
      });
      return replacement;
    });

    sanitized = sanitized.replace(this.STREET_ADDRESS_REGEX, (match, offset) => {
      const replacement = '[REDACTED_ADDRESS]';
      redactions.push({
        type: 'address',
        originalSnippet: match,
        replacement,
        position: offset,
      });
      return replacement;
    });

    sanitized = sanitized.replace(this.PINCODE_REGEX, (match, offset) => {
      const replacement = '[REDACTED_PINCODE]';
      redactions.push({
        type: 'address',
        originalSnippet: match,
        replacement,
        position: offset,
      });
      return replacement;
    });

    // 7. Redact Explicit Candidate Names
    sanitized = sanitized.replace(this.EXPLICIT_NAME_REGEX, (match, nameGroup, offset) => {
      const replacement = `Name: [REDACTED_NAME]`;
      redactions.push({
        type: 'person_name',
        originalSnippet: match,
        replacement,
        position: offset,
      });
      return replacement;
    });

    // Also check top-of-resume standalone name if present (first non-empty line with 2-3 capitalized words)
    const lines = sanitized.split(/\r?\n/);
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const line = lines[i].trim();
      // If line is 2-4 words, starts capitalized, contains no symbols or common resume words
      if (
        line.length > 3 &&
        line.length < 50 &&
        /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line) &&
        !/^(Resume|Curriculum|Profile|Summary|Education|Experience|Skills|Projects)$/i.test(line)
      ) {
        const replacement = '[REDACTED_NAME]';
        redactions.push({
          type: 'person_name',
          originalSnippet: line,
          replacement,
        });
        lines[i] = replacement;
        sanitized = lines.join('\n');
        break;
      }
    }

    return {
      sanitizedText: sanitized,
      redactions,
      redactedCount: redactions.length,
    };
  }
}

export function scrubPII(text: string): PIIScrubResult {
  return PIIFilter.scrub(text);
}
