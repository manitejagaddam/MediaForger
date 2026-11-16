import { db } from '@mediaforge/database';

export interface AIModelMeta {
  id: string;
  name: string;
  task: 'upscale' | 'background-removal' | 'enhancement';
  sizeBytes: number;
  downloadUrl: string;
  precision: 'fp16' | 'fp32';
  description: string;
}

export const REGISTERED_AI_MODELS: AIModelMeta[] = [
  {
    id: 'real-esrgan-x2',
    name: 'Real-ESRGAN 2x',
    task: 'upscale',
    sizeBytes: 16700000,
    downloadUrl: 'https://models.mediaforge.local/upscale/real-esrgan-x2.onnx',
    precision: 'fp16',
    description: '2x Super-Resolution neural network with edge refinement',
  },
  {
    id: 'rmbg-1.4',
    name: 'RMBG 1.4 Background Remover',
    task: 'background-removal',
    sizeBytes: 42000000,
    downloadUrl: 'https://models.mediaforge.local/bg/rmbg-1.4.onnx',
    precision: 'fp32',
    description: 'High-accuracy alpha matte segmentation model for background removal',
  },
];

export class AIEngine {
  /**
   * Checks if an ONNX model is already cached locally in IndexedDB / CacheStorage
   */
  static async isModelCached(modelId: string): Promise<boolean> {
    const entry = await db.modelCache.get(modelId);
    return Boolean(entry);
  }

  /**
   * Resolves execution provider: WebGPU if available, fallback to WebAssembly
   */
  static async resolveExecutionProvider(): Promise<'webgpu' | 'wasm'> {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) return 'webgpu';
      } catch {
        // Fallback
      }
    }
    return 'wasm';
  }
}

