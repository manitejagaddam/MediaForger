import { describe, it, expect } from 'vitest';
import { FileInspector } from '@mediaforge/core';

describe('FileInspector', () => {
  it('detects PNG from file magic bytes', async () => {
    // Standard PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);
    const blob = new Blob([pngBytes], { type: 'application/octet-stream' });
    const result = await FileInspector.inspect(blob, 'untrusted_name.bin');

    expect(result.detectedFormat).toBe('png');
    expect(result.magicBytesVerified).toBe(true);
    expect(result.category).toBe('image');
  });

  it('detects JPEG from file magic bytes', async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const blob = new Blob([jpegBytes]);
    const result = await FileInspector.inspect(blob, 'photo.dat');

    expect(result.detectedFormat).toBe('jpeg');
    expect(result.magicBytesVerified).toBe(true);
    expect(result.category).toBe('image');
  });

  it('detects PDF from file magic bytes', async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
    const blob = new Blob([pdfBytes]);
    const result = await FileInspector.inspect(blob, 'report.xyz');

    expect(result.detectedFormat).toBe('pdf');
    expect(result.magicBytesVerified).toBe(true);
    expect(result.category).toBe('document');
  });
});
