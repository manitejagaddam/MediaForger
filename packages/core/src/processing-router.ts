import { EngineTier, MediaCategory, ProcessingOptions } from '@mediaforge/shared-types';
import { FormatRegistry } from './format-registry';

export class ProcessingRouter {
  /**
   * Determines the optimal execution tier for a given conversion task
   */
  static resolveTier(
    category: MediaCategory,
    inputFormat: string,
    outputFormat: string,
    _options: ProcessingOptions
  ): EngineTier {
    if (category === 'ai') {
      return 'level3-ai';
    }

    const inputDef = FormatRegistry.get(inputFormat);
    const outputDef = FormatRegistry.get(outputFormat);

    // If either format requires Level 2 WASM (e.g. AVIF, MP3, MP4, PDF, etc.)
    if (inputDef?.requiredTier === 'level2-wasm' || outputDef?.requiredTier === 'level2-wasm') {
      return 'level2-wasm';
    }

    // Advanced options requiring WASM (e.g., video-to-gif with palettegen or complex audio filters)
    if (category === 'video' || category === 'audio') {
      // Audio WAV <-> WAV or native Web Audio conversions can run in Level 1
      if (inputFormat === 'wav' && outputFormat === 'wav') {
        return 'level1-native';
      }
      return 'level2-wasm';
    }

    if (category === 'image') {
      // Native Canvas supports JPEG, PNG, WebP, BMP natively
      const nativeImageFormats = ['jpeg', 'png', 'webp', 'bmp'];
      if (nativeImageFormats.includes(inputFormat) && nativeImageFormats.includes(outputFormat)) {
        return 'level1-native';
      }
      return 'level2-wasm';
    }

    if (category === 'document') {
      if (['csv', 'json', 'txt'].includes(inputFormat) && ['csv', 'json', 'txt'].includes(outputFormat)) {
        return 'level1-native';
      }
      return 'level2-wasm';
    }

    if (category === 'archive') {
      return 'level2-wasm';
    }

    return 'level1-native';
  }
}
