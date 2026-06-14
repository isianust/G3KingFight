import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

const isSingleFile = process.env.BUILD_SINGLE === 'true';

export default defineConfig({
  root: '.',
  base: './',
  plugins: isSingleFile ? [viteSingleFile()] : [],
  build: {
    outDir: isSingleFile ? 'dist-single' : 'dist',
    sourcemap: !isSingleFile,
    target: 'es2020',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
  },
});
