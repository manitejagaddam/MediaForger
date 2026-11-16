import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  AIEngine,
  REGISTERED_AI_MODELS,
  BackgroundRemovalOptions,
} from '@mediaforge/ai-engine';
import { db } from '@mediaforge/database';

describe('AIEngine Model Management & Capabilities', () => {
  beforeEach(async () => {
    await db.modelCache.clear();
  });

  it('contains valid registered models for all 3 AI tasks', () => {
    expect(REGISTERED_AI_MODELS.length).toBeGreaterThanOrEqual(3);

    const tasks = REGISTERED_AI_MODELS.map((m) => m.task);
    expect(tasks).toContain('upscale');
    expect(tasks).toContain('background-removal');
    expect(tasks).toContain('enhancement');

    for (const model of REGISTERED_AI_MODELS) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.sizeBytes).toBeGreaterThan(0);
      expect(['fp16', 'fp32']).toContain(model.precision);
    }
  });

  it('installs and retrieves neural models from local cache', async () => {
    const model = REGISTERED_AI_MODELS[0];
    const initialCached = await AIEngine.isModelCached(model.id);
    expect(initialCached).toBe(false);

    // Install model
    const cachedEntry = await AIEngine.installModel(model);
    expect(cachedEntry.modelId).toBe(model.id);
    expect(cachedEntry.modelBuffer).toBeDefined();

    const isCachedAfter = await AIEngine.isModelCached(model.id);
    expect(isCachedAfter).toBe(true);

    const retrieved = await AIEngine.getCachedModel(model.id);
    expect(retrieved?.name).toBe(model.name);
    expect(retrieved?.task).toBe(model.task);

    // Clean up
    await AIEngine.deleteModel(model.id);
    const isCachedDeleted = await AIEngine.isModelCached(model.id);
    expect(isCachedDeleted).toBe(false);
  });

  it('rejects invalid non-onnx files for custom model import', async () => {
    const invalidFile = new File([new Uint8Array([1, 2, 3])], 'model.pt', {
      type: 'application/octet-stream',
    });

    await expect(AIEngine.importCustomModel(invalidFile)).rejects.toThrow(
      'Only .onnx models are supported'
    );
  });

  it('imports valid custom .onnx model into local cache', async () => {
    const validFile = new File([new Uint8Array([0x08, 0x01, 0x12, 0x04])], 'my_model.onnx', {
      type: 'application/octet-stream',
    });

    const entry = await AIEngine.importCustomModel(validFile);
    expect(entry.isCustom).toBe(true);
    expect(entry.task).toBe('custom');
    expect(entry.modelBuffer).toBeDefined();

    const isCached = await AIEngine.isModelCached(entry.modelId);
    expect(isCached).toBe(true);
  });

  it('resolves valid execution provider', async () => {
    const provider = await AIEngine.resolveExecutionProvider();
    expect(['webgpu', 'wasm']).toContain(provider);
  });

  it('validates multi-mode background removal configurations', () => {
    const solidBgConfig: BackgroundRemovalOptions = {
      mode: 'color',
      backgroundColor: '#ffffff',
      threshold: 50,
      featherRadius: 3,
      edgeShift: -2,
      shadow: {
        enabled: true,
        blur: 15,
        opacity: 0.3,
      },
    };
    expect(solidBgConfig.mode).toBe('color');
    expect(solidBgConfig.backgroundColor).toBe('#ffffff');
    expect(solidBgConfig.edgeShift).toBe(-2);

    const gradientBgConfig: BackgroundRemovalOptions = {
      mode: 'gradient',
      gradient: {
        colors: ['#0f172a', '#1e293b'],
        angle: 45,
      },
      sampleKeyColor: [255, 255, 255],
    };
    expect(gradientBgConfig.mode).toBe('gradient');
    expect(gradientBgConfig.gradient?.colors.length).toBe(2);
    expect(gradientBgConfig.sampleKeyColor).toEqual([255, 255, 255]);

    const bokehConfig: BackgroundRemovalOptions = {
      mode: 'blur',
      blurRadius: 30,
    };
    expect(bokehConfig.mode).toBe('blur');
    expect(bokehConfig.blurRadius).toBe(30);
  });
});
