import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget.ts'),
      name: 'HaildeskWidget',
      fileName: () => 'widget.iife.js',
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
