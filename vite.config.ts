import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const projectRoot = import.meta.dirname;

export default defineConfig(() => {
  return {
    root: path.resolve(projectRoot, 'frontend'),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, 'frontend'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:4001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: path.resolve(projectRoot, 'dist'),
      emptyOutDir: true,
    },
  };
});
