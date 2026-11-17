import { describe, it, expect } from 'vitest';
import { ImageEngine } from '@mediaforge/image-engine';
import { verifyMagicBytes } from '@mediaforge/validators';

describe('ImageEngine', () => {
  it('encodes genuine BMP buffer with verified BM magic bytes', async () => {
    // 2x2 mock RGBA test pixels
    const width = 2;
    const height = 2;
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,     // Red
      0, 255, 0, 255,     // Green
      0, 0, 255, 255,     // Blue
      255, 255, 255, 255, // White
    ]);
    const mockImageData = {
      width,
      height,
      data,
      colorSpace: 'srgb',
    } as ImageData;

    const bmpBlob = ImageEngine.encodeBmp(mockImageData);
    expect(bmpBlob.type).toBe('image/bmp');

    const buffer = await bmpBlob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Verify BM magic bytes
    expect(bytes[0]).toBe(0x42); // 'B'
    expect(bytes[1]).toBe(0x4d); // 'M'
    expect(verifyMagicBytes(bytes, 'bmp')).toBe(true);

    // Verify row padding: width 2 -> 6 bytes + 2 pad = 8 bytes per row * 2 rows = 16 bytes + 54 header = 70 bytes
    expect(buffer.byteLength).toBe(70);
  });

  it('correctly decodes Base64 to Blob and re-encodes back to Base64', async () => {
    const rawData = 'Hello MediaForge Test';
    const base64Str = `data:text/plain;base64,${btoa(rawData)}`;

    const blob = ImageEngine.base64ToBlob(base64Str);
    expect(blob.type).toBe('text/plain');

    const text = await blob.text();
    expect(text).toBe(rawData);

    const reEncoded = await ImageEngine.blobToBase64(blob);
    expect(reEncoded).toContain('data:text/plain;base64,');
  });
});
