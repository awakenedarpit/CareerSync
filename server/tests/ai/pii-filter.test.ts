import { describe, it, expect } from 'vitest';
import { scrubPII, PIIFilter } from '../../src/ai/utils/pii-filter';

describe('PIIFilter Utility', () => {
  it('should redact email addresses', () => {
    const text = 'Contact me at student.test@university.edu or candidate123@gmail.com for details.';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('student.test@university.edu');
    expect(result.sanitizedText).not.toContain('candidate123@gmail.com');
    expect(result.sanitizedText).toContain('[REDACTED_EMAIL]');
    expect(result.redactedCount).toBeGreaterThanOrEqual(2);
    expect(result.redactions.some((r) => r.type === 'email')).toBe(true);
  });

  it('should redact Indian phone numbers with country codes or prefixes', () => {
    const text = 'Reach me at +91 9876543210 or +91-91234-56789 or 09876543210.';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('9876543210');
    expect(result.sanitizedText).not.toContain('91234-56789');
    expect(result.sanitizedText).toContain('[REDACTED_PHONE]');
    expect(result.redactions.some((r) => r.type === 'phone')).toBe(true);
  });

  it('should redact International phone numbers', () => {
    const text = 'Call office at +1 (555) 123-4567 or +44 20 7946 0958.';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('555) 123-4567');
    expect(result.sanitizedText).toContain('[REDACTED_PHONE]');
  });

  it('should redact Indian Aadhaar numbers', () => {
    const text = 'UIDAI Aadhaar: 4532 8901 2345 attached for verification.';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('4532 8901 2345');
    expect(result.sanitizedText).toContain('[REDACTED_AADHAAR]');
    expect(result.redactions.some((r) => r.type === 'aadhaar')).toBe(true);
  });

  it('should redact Indian PAN card numbers', () => {
    const text = 'PAN Card Number: ABCDE1234F is registered.';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('ABCDE1234F');
    expect(result.sanitizedText).toContain('[REDACTED_PAN]');
    expect(result.redactions.some((r) => r.type === 'pan')).toBe(true);
  });

  it('should redact US SSN numbers', () => {
    const text = 'SSN is 123-45-6789.';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('123-45-6789');
    expect(result.sanitizedText).toContain('[REDACTED_SSN]');
    expect(result.redactions.some((r) => r.type === 'ssn')).toBe(true);
  });

  it('should redact postal addresses and Indian PIN codes', () => {
    const text = 'Address: 124 MG Road, Indiranagar, Bangalore - 560038.';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('MG Road');
    expect(result.sanitizedText).toContain('[REDACTED_ADDRESS]');
  });

  it('should redact explicit candidate names', () => {
    const text = 'Candidate Name: Rahul Sharma\nTechnical Skills: React, Node.js';
    const result = scrubPII(text);

    expect(result.sanitizedText).not.toContain('Rahul Sharma');
    expect(result.sanitizedText).toContain('[REDACTED_NAME]');
    expect(result.sanitizedText).toContain('React, Node.js');
  });

  it('should handle empty or undefined input gracefully', () => {
    const result = scrubPII('');
    expect(result.sanitizedText).toBe('');
    expect(result.redactions).toEqual([]);
    expect(result.redactedCount).toBe(0);
  });
});
