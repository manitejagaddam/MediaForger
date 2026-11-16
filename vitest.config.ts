import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@mediaforge/shared-types': path.resolve(__dirname, './packages/shared-types/src'),
      '@mediaforge/validators': path.resolve(__dirname, './packages/validators/src'),
      '@mediaforge/database': path.resolve(__dirname, './packages/database/src'),
      '@mediaforge/storage': path.resolve(__dirname, './packages/storage/src'),
      '@mediaforge/wasm-runtime': path.resolve(__dirname, './packages/wasm-runtime/src'),
      '@mediaforge/worker-runtime': path.resolve(__dirname, './packages/worker-runtime/src'),
      '@mediaforge/presets': path.resolve(__dirname, './packages/presets/src'),
      '@mediaforge/core': path.resolve(__dirname, './packages/core/src'),
      '@mediaforge/image-engine': path.resolve(__dirname, './packages/image-engine/src'),
      '@mediaforge/audio-engine': path.resolve(__dirname, './packages/audio-engine/src'),
      '@mediaforge/video-engine': path.resolve(__dirname, './packages/video-engine/src'),
      '@mediaforge/document-engine': path.resolve(__dirname, './packages/document-engine/src'),
      '@mediaforge/archive-engine': path.resolve(__dirname, './packages/archive-engine/src'),
      '@mediaforge/ai-engine': path.resolve(__dirname, './packages/ai-engine/src'),
      '@mediaforge/ui': path.resolve(__dirname, './packages/ui/src'),
    },
  },
});
