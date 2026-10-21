import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const projectRoot = import.meta.dirname;
const frontendRoot = path.resolve(projectRoot, 'frontend');

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, frontendRoot, '');
  return {
    root: frontendRoot,
    envDir: frontendRoot,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, 'frontend'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: env.DISABLE_HMR === 'true' ? null : {},
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
