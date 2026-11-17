import { describe, it, expect } from 'vitest';
import {
  sanitizeFilename,
  isSafeArchivePath,
  verifyMagicBytes,
} from '@mediaforge/validators';

describe('Validators & Security', () => {
  describe('sanitizeFilename', () => {
    it('removes directory traversal path segments', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32.dll')).toBe('system32.dll');
    });

    it('strips illegal filename characters', () => {
      expect(sanitizeFilename('my<awesome>:file*name?.jpg')).toBe('my_awesome__file_name_.jpg');
    });

    it('falls back to safe default if name is empty', () => {
      expect(sanitizeFilename('')).toBe('mediaforge_output');
      expect(sanitizeFilename('...')).toBe('mediaforge_output');
    });
  });

  describe('isSafeArchivePath (Zip-Slip guard)', () => {
    it('approves safe nested paths', () => {
      expect(isSafeArchivePath('images/vacation/photo.jpg')).toBe(true);
      expect(isSafeArchivePath('document.pdf')).toBe(true);
      expect(isSafeArchivePath('sub/folder/file.txt')).toBe(true);
    });

    it('rejects path traversal zip-slip attempts', () => {
      expect(isSafeArchivePath('../secret.txt')).toBe(false);
      expect(isSafeArchivePath('foo/../../bar.txt')).toBe(false);
      expect(isSafeArchivePath('/root/file.txt')).toBe(false);
      expect(isSafeArchivePath('C:\\windows\\system32')).toBe(false);
    });
  });

  describe('verifyMagicBytes', () => {
    it('validates PNG signature', () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(verifyMagicBytes(pngHeader, 'png')).toBe(true);
      expect(verifyMagicBytes(pngHeader, 'jpeg')).toBe(false);
    });

    it('validates JPEG signature', () => {
      const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(verifyMagicBytes(jpegHeader, 'jpeg')).toBe(true);
      expect(verifyMagicBytes(jpegHeader, 'png')).toBe(false);
    });

    it('validates PDF signature', () => {
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]); // %PDF-1
      expect(verifyMagicBytes(pdfHeader, 'pdf')).toBe(true);
    });

    it('validates ZIP signature', () => {
      const zipHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
      expect(verifyMagicBytes(zipHeader, 'zip')).toBe(true);
    });

    it('validates MP3 ID3 and raw MPEG audio frame sync signatures', () => {
      const id3Header = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00]);
      const mpegSyncHeader = new Uint8Array([0xff, 0xfb, 0x90, 0x64]);
      expect(verifyMagicBytes(id3Header, 'mp3')).toBe(true);
      expect(verifyMagicBytes(mpegSyncHeader, 'mp3')).toBe(true);
    });

    it('validates WebM and MKV EBML signatures', () => {
      const ebmlHeader = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);
      expect(verifyMagicBytes(ebmlHeader, 'webm')).toBe(true);
      expect(verifyMagicBytes(ebmlHeader, 'mkv')).toBe(true);
    });

    it('validates TIFF endian signatures', () => {
      const leHeader = new Uint8Array([0x49, 0x49, 0x2a, 0x00]);
      const beHeader = new Uint8Array([0x4d, 0x4d, 0x00, 0x2a]);
      expect(verifyMagicBytes(leHeader, 'tiff')).toBe(true);
      expect(verifyMagicBytes(beHeader, 'tiff')).toBe(true);
    });
  });
});

