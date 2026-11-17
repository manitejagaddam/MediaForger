import { z } from 'zod';

export const ImageProcessingOptionsSchema = z.object({
  outputFormat: z.string().min(1),
  quality: z.number().min(1).max(100).optional(),
  lossless: z.boolean().optional(),
  width: z.number().positive().max(16384).optional(),
  height: z.number().positive().max(16384).optional(),
  maintainAspectRatio: z.boolean().optional(),
  fit: z.enum(['contain', 'cover', 'fill', 'inside', 'outside']).optional(),
  crop: z
    .object({
      x: z.number().nonnegative(),
      y: z.number().nonnegative(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  rotate: z.number().optional(),
  flipHorizontal: z.boolean().optional(),
  flipVertical: z.boolean().optional(),
  grayscale: z.boolean().optional(),
  brightness: z.number().min(-100).max(100).optional(),
  contrast: z.number().min(-100).max(100).optional(),
  stripMetadata: z.boolean().optional(),
  watermark: z
    .object({
      text: z.string().optional(),
      opacity: z.number().min(0).max(1).optional(),
      fontSize: z.number().positive().optional(),
      color: z.string().optional(),
      position: z.enum(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
    })
    .optional(),
});

export const AudioProcessingOptionsSchema = z.object({
  outputFormat: z.string().min(1),
  bitrate: z.number().positive().optional(),
  sampleRate: z.number().positive().optional(),
  channels: z.union([z.literal(1), z.literal(2)]).optional(),
  trimStartSeconds: z.number().nonnegative().optional(),
  trimEndSeconds: z.number().positive().optional(),
  normalizeVolume: z.boolean().optional(),
  fadeInSeconds: z.number().nonnegative().optional(),
  fadeOutSeconds: z.number().nonnegative().optional(),
});

export const VideoProcessingOptionsSchema = z.object({
  outputFormat: z.string().min(1),
  codec: z.string().optional(),
  crf: z.number().min(0).max(51).optional(),
  bitrate: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fps: z.number().positive().max(120).optional(),
  trimStartSeconds: z.number().nonnegative().optional(),
  trimEndSeconds: z.number().positive().optional(),
  muteAudio: z.boolean().optional(),
  extractAudioOnly: z.boolean().optional(),
  extractThumbnailAtSeconds: z.number().nonnegative().optional(),
  convertToGif: z.boolean().optional(),
});

export const DocumentProcessingOptionsSchema = z.object({
  outputFormat: z.string().min(1),
  pages: z.array(z.number().positive()).optional(),
  dpi: z.number().min(72).max(600).optional(),
  quality: z.number().min(1).max(100).optional(),
  rotateDegrees: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]).optional(),
  csvDelimiter: z.string().max(3).optional(),
  prettyPrintJson: z.boolean().optional(),
});

export const ArchiveProcessingOptionsSchema = z.object({
  outputFormat: z.literal('zip'),
  compressionLevel: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
  ]).optional(),
  password: z.string().optional(),
  stripRootPath: z.boolean().optional(),
});

/**
 * Sanitizes input filenames against path traversal, control chars, and reserved names
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'mediaforge_output';
  // Remove directory traversal characters
  let clean = filename.replace(/^.*[\\/]/, '');
  // Remove non-printable or null characters
  clean = clean.replace(/[\x00-\x1f\x80-\x9f]/g, '');
  // Remove Windows/Unix reserved filename characters: <>:"/\|?*
  clean = clean.replace(/[<>:"/\\|?*]/g, '_');
  // Trim spaces and dots
  clean = clean.trim().replace(/^\.+/, '');
  return clean || 'mediaforge_output';
}

/**
 * Checks whether an archive path entry is malicious (zip-slip attempt)
 */
export function isSafeArchivePath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  // Normalized path should not contain '..' or start with '/' or drive letter
  const normalized = path.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) return false;
  const segments = normalized.split('/');
  return !segments.includes('..');
}

/**
 * Known file signatures (magic bytes)
 */
export const MAGIC_BYTE_SIGNATURES: Record<string, { bytes: number[]; offset?: number; mask?: number[] }[]> = {
  jpeg: [{ bytes: [0xff, 0xd8, 0xff] }],
  jpg: [{ bytes: [0xff, 0xd8, 0xff] }],
  png: [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  gif: [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  webp: [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF at 0
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // WEBP at 8
  ],
  bmp: [{ bytes: [0x42, 0x4d] }],
  tiff: [
    { bytes: [0x49, 0x49, 0x2a, 0x00] }, // Little-endian
    { bytes: [0x4d, 0x4d, 0x00, 0x2a] }, // Big-endian
  ],
  tiff_le: [{ bytes: [0x49, 0x49, 0x2a, 0x00] }],
  tiff_be: [{ bytes: [0x4d, 0x4d, 0x00, 0x2a] }],
  pdf: [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  zip: [{ bytes: [0x50, 0x4b, 0x03, 0x04] }], // PK..
  mp3: [
    { bytes: [0x49, 0x44, 0x33] }, // ID3v2 tag
    { bytes: [0xff, 0xfb] }, // MPEG-1 Layer 3
    { bytes: [0xff, 0xf3] }, // MPEG-2 Layer 3
    { bytes: [0xff, 0xf2] }, // MPEG-2.5 Layer 3
  ],
  mp3_id3: [{ bytes: [0x49, 0x44, 0x33] }],
  wav: [
    { bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
    { bytes: [0x57, 0x41, 0x56, 0x45], offset: 8 }, // WAVE
  ],
  flac: [{ bytes: [0x66, 0x4c, 0x61, 0x43] }], // fLaC
  ogg: [{ bytes: [0x4f, 0x67, 0x67, 0x53] }], // OggS
  mp4: [
    { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at 4
  ],
  webm: [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }], // EBML
  mkv: [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }], // EBML
  webm_mkv: [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
  avif: [
    { bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], offset: 4 }, // ftypavif
  ],
};

/**
 * Validates a header byte buffer against known magic bytes
 */
export function verifyMagicBytes(header: Uint8Array, format: string): boolean {
  const signatures = MAGIC_BYTE_SIGNATURES[format.toLowerCase()];
  if (!signatures) return false;

  for (const sig of signatures) {
    const offset = sig.offset || 0;
    if (header.length < offset + sig.bytes.length) continue;

    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (header[offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

