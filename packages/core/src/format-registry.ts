import { FormatDefinition, MediaCategory } from '@mediaforge/shared-types';

export class FormatRegistry {
  private static formats: Map<string, FormatDefinition> = new Map();

  static initialize(): void {
    if (this.formats.size > 0) return;

    const definitions: FormatDefinition[] = [
      // Images
      {
        id: 'jpeg',
        name: 'JPEG Image',
        category: 'image',
        extensions: ['jpg', 'jpeg'],
        mimeTypes: ['image/jpeg'],
        supportsEncoding: true,
        supportsDecoding: true,
        supportsAlpha: false,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'png',
        name: 'PNG Image',
        category: 'image',
        extensions: ['png'],
        mimeTypes: ['image/png'],
        supportsEncoding: true,
        supportsDecoding: true,
        supportsAlpha: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'webp',
        name: 'WebP Image',
        category: 'image',
        extensions: ['webp'],
        mimeTypes: ['image/webp'],
        supportsEncoding: true,
        supportsDecoding: true,
        supportsAlpha: true,
        supportsAnimation: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'gif',
        name: 'GIF Image / Animation',
        category: 'image',
        extensions: ['gif'],
        mimeTypes: ['image/gif'],
        supportsEncoding: true,
        supportsDecoding: true,
        supportsAlpha: true,
        supportsAnimation: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'avif',
        name: 'AVIF Image',
        category: 'image',
        extensions: ['avif'],
        mimeTypes: ['image/avif'],
        supportsEncoding: true,
        supportsDecoding: true,
        supportsAlpha: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'modern-only',
      },
      {
        id: 'bmp',
        name: 'BMP Image',
        category: 'image',
        extensions: ['bmp'],
        mimeTypes: ['image/bmp', 'image/x-windows-bmp'],
        supportsEncoding: true,
        supportsDecoding: true,
        supportsAlpha: false,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'svg',
        name: 'SVG Vector Image',
        category: 'image',
        extensions: ['svg'],
        mimeTypes: ['image/svg+xml'],
        supportsEncoding: false,
        supportsDecoding: true,
        supportsAlpha: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'ico',
        name: 'ICO Icon',
        category: 'image',
        extensions: ['ico'],
        mimeTypes: ['image/x-icon', 'image/vnd.microsoft.icon'],
        supportsEncoding: true,
        supportsDecoding: true,
        supportsAlpha: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'tiff',
        name: 'TIFF Image',
        category: 'image',
        extensions: ['tif', 'tiff'],
        mimeTypes: ['image/tiff'],
        supportsEncoding: false,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'heic',
        name: 'HEIC / HEIF',
        category: 'image',
        extensions: ['heic', 'heif'],
        mimeTypes: ['image/heic', 'image/heif'],
        supportsEncoding: false,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'modern-only',
      },

      // Audio
      {
        id: 'wav',
        name: 'WAV Audio',
        category: 'audio',
        extensions: ['wav'],
        mimeTypes: ['audio/wav', 'audio/x-wav'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'mp3',
        name: 'MP3 Audio',
        category: 'audio',
        extensions: ['mp3'],
        mimeTypes: ['audio/mpeg', 'audio/mp3'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'flac',
        name: 'FLAC Lossless Audio',
        category: 'audio',
        extensions: ['flac'],
        mimeTypes: ['audio/flac'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'ogg',
        name: 'OGG Vorbis Audio',
        category: 'audio',
        extensions: ['ogg', 'oga'],
        mimeTypes: ['audio/ogg'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'opus',
        name: 'Opus Audio',
        category: 'audio',
        extensions: ['opus'],
        mimeTypes: ['audio/opus'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'aac',
        name: 'AAC Audio',
        category: 'audio',
        extensions: ['aac', 'm4a'],
        mimeTypes: ['audio/aac', 'audio/mp4'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },

      // Video
      {
        id: 'mp4',
        name: 'MP4 Video',
        category: 'video',
        extensions: ['mp4', 'm4v'],
        mimeTypes: ['video/mp4'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'webm',
        name: 'WebM Video',
        category: 'video',
        extensions: ['webm'],
        mimeTypes: ['video/webm'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'mkv',
        name: 'Matroska Video (MKV)',
        category: 'video',
        extensions: ['mkv'],
        mimeTypes: ['video/x-matroska'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'mov',
        name: 'QuickTime Movie (MOV)',
        category: 'video',
        extensions: ['mov'],
        mimeTypes: ['video/quicktime'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },

      // Documents
      {
        id: 'pdf',
        name: 'PDF Document',
        category: 'document',
        extensions: ['pdf'],
        mimeTypes: ['application/pdf'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
      {
        id: 'csv',
        name: 'CSV Spreadsheet Data',
        category: 'document',
        extensions: ['csv'],
        mimeTypes: ['text/csv'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'json',
        name: 'JSON Data',
        category: 'document',
        extensions: ['json'],
        mimeTypes: ['application/json'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },
      {
        id: 'txt',
        name: 'Plain Text',
        category: 'document',
        extensions: ['txt'],
        mimeTypes: ['text/plain'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level1-native',
        browserCompatibility: 'universal',
      },

      // Archives
      {
        id: 'zip',
        name: 'ZIP Archive',
        category: 'archive',
        extensions: ['zip'],
        mimeTypes: ['application/zip', 'application/x-zip-compressed'],
        supportsEncoding: true,
        supportsDecoding: true,
        requiredTier: 'level2-wasm',
        browserCompatibility: 'universal',
      },
    ];

    for (const def of definitions) {
      this.formats.set(def.id, def);
    }
  }

  static get(formatId: string): FormatDefinition | undefined {
    this.initialize();
    return this.formats.get(formatId.toLowerCase());
  }

  static findByExtension(ext: string): FormatDefinition | undefined {
    this.initialize();
    const cleanExt = ext.replace(/^\./, '').toLowerCase();
    for (const format of this.formats.values()) {
      if (format.extensions.includes(cleanExt)) {
        return format;
      }
    }
    return undefined;
  }

  static findByMimeType(mime: string): FormatDefinition | undefined {
    this.initialize();
    const cleanMime = mime.toLowerCase();
    for (const format of this.formats.values()) {
      if (format.mimeTypes.includes(cleanMime)) {
        return format;
      }
    }
    return undefined;
  }

  static getByCategory(category: MediaCategory): FormatDefinition[] {
    this.initialize();
    return Array.from(this.formats.values()).filter((f) => f.category === category);
  }

  static getAll(): FormatDefinition[] {
    this.initialize();
    return Array.from(this.formats.values());
  }
}
