import { describe, expect, it } from 'vitest';
import { getFileExtension, validateNarrativeUpload } from '../src/lib/fileUploadGuard.js';

const makeFile = (name, type = '') => ({ name, type });

describe('fileUploadGuard', () => {
  it('extracts lowercase file extensions', () => {
    expect(getFileExtension('Narrative.TXT')).toBe('txt');
  });

  it('allows plain text uploads', () => {
    const result = validateNarrativeUpload(makeFile('narrative.txt', 'text/plain'));
    expect(result.ok).toBe(true);
  });

  it('blocks PDF uploads until extraction is implemented', () => {
    const result = validateNarrativeUpload(makeFile('narrative.pdf', 'application/pdf'));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unsupported_binary_document');
  });

  it('blocks DOCX uploads until extraction is implemented', () => {
    const result = validateNarrativeUpload(makeFile('narrative.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unsupported_binary_document');
  });
});
