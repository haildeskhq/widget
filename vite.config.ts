import { defineConfig } from 'vite';
import path from 'path';
import pkg from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget.ts'),
      name: 'HaildeskWidget',
      fileName: () => `widget-${pkg.version}.iife.js`,
      formats: ['iife'],
    },
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      // socket.io-client is bundled (no external deps for embeddable widget)
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 5174,
  },
});
