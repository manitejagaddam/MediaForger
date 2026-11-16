/**
 * @mediaforge/shared-types
 * Core domain types, contracts, enums, and schemas for MediaForge
 */

export type MediaCategory = 'image' | 'audio' | 'video' | 'document' | 'archive' | 'ai';

export type EngineTier = 'level1-native' | 'level2-wasm' | 'level3-ai';

export type JobStatus =
  | 'created'
  | 'queued'
  | 'initializing'
  | 'processing'
  | 'validating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface FormatDefinition {
  id: string;
  name: string;
  category: MediaCategory;
  extensions: string[];
  mimeTypes: string[];
  magicBytes?: number[][];
  supportsEncoding: boolean;
  supportsDecoding: boolean;
  supportsAnimation?: boolean;
  supportsAlpha?: boolean;
  requiredTier: EngineTier;
  browserCompatibility: 'universal' | 'modern-only' | 'experimental';
  notes?: string;
}

export interface InspectionResult {
  detectedFormat: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  magicBytesVerified: boolean;
  category: MediaCategory;
  width?: number;
  height?: number;
  durationSeconds?: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  fps?: number;
  hasAlpha?: boolean;
  isAnimated?: boolean;
  pageCount?: number;
  itemCount?: number;
  metadata?: Record<string, unknown>;
}

export interface ImageProcessingOptions {
  outputFormat: string;
  quality?: number; // 1-100
  lossless?: boolean;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  crop?: { x: number; y: number; width: number; height: number };
  rotate?: 0 | 90 | 180 | 270 | number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  grayscale?: boolean;
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  stripMetadata?: boolean;
  watermark?: {
    text?: string;
    opacity?: number;
    fontSize?: number;
    color?: string;
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

export interface AudioProcessingOptions {
  outputFormat: string;
  bitrate?: number; // e.g. 128, 192, 320 kbps
  sampleRate?: number; // e.g. 44100, 48000 Hz
  channels?: 1 | 2; // Mono / Stereo
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  normalizeVolume?: boolean;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}

export interface VideoProcessingOptions {
  outputFormat: string;
  codec?: string; // h264, vp8, vp9, aac, etc.
  crf?: number; // Constant Rate Factor (18-28)
  bitrate?: number;
  width?: number;
  height?: number;
  fps?: number;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  muteAudio?: boolean;
  extractAudioOnly?: boolean;
  extractThumbnailAtSeconds?: number;
  convertToGif?: boolean;
}

export interface DocumentProcessingOptions {
  outputFormat: string;
  pages?: number[]; // Specific pages or 1-based ranges
  dpi?: number; // Rendering DPI for PDF to image
  quality?: number;
  rotateDegrees?: 0 | 90 | 180 | 270;
  csvDelimiter?: string;
  prettyPrintJson?: boolean;
}

export interface ArchiveProcessingOptions {
  outputFormat: 'zip';
  compressionLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  password?: string;
  stripRootPath?: boolean;
}

export interface AIProcessingOptions {
  modelId: string;
  scale?: 2 | 4;
  tileProcessing?: boolean;
  tileSize?: number;
  executionProvider?: 'webgpu' | 'wasm';
}

export type ProcessingOptions =
  | ImageProcessingOptions
  | AudioProcessingOptions
  | VideoProcessingOptions
  | DocumentProcessingOptions
  | ArchiveProcessingOptions
  | AIProcessingOptions;

export interface ConversionJob {
  id: string;
  fileId: string;
  fileName: string;
  inputFormat: string;
  outputFormat: string;
  category: MediaCategory;
  tier: EngineTier;
  options: ProcessingOptions;
  status: JobStatus;
  progress: number; // 0.0 - 1.0
  currentStage?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  inputSizeBytes: number;
  outputSizeBytes?: number;
  outputBlob?: Blob;
  outputBuffer?: ArrayBuffer;
  outputUrl?: string;
}

export interface SystemCapabilities {
  webCodecs: boolean;
  sharedArrayBuffer: boolean;
  webGPU: boolean;
  opfs: boolean;
  hardwareConcurrency: number;
  estimatedMemoryBytes?: number;
  storageQuotaBytes?: number;
  storageUsageBytes?: number;
}

export interface Preset {
  id: string;
  name: string;
  category: MediaCategory;
  description: string;
  options: ProcessingOptions;
  isBuiltIn: boolean;
  createdAt: number;
}
