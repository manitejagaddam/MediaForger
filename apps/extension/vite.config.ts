import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mediaforge/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@mediaforge/validators': path.resolve(__dirname, '../../packages/validators/src'),
      '@mediaforge/database': path.resolve(__dirname, '../../packages/database/src'),
      '@mediaforge/storage': path.resolve(__dirname, '../../packages/storage/src'),
      '@mediaforge/presets': path.resolve(__dirname, '../../packages/presets/src'),
      '@mediaforge/core': path.resolve(__dirname, '../../packages/core/src'),
      '@mediaforge/image-engine': path.resolve(__dirname, '../../packages/image-engine/src'),
      '@mediaforge/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'popup.html'),
        sidepanel: path.resolve(__dirname, 'sidepanel.html'),
        options: path.resolve(__dirname, 'options.html'),
        offscreen: path.resolve(__dirname, 'offscreen.html'),
        background: path.resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
