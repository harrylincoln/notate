import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  appType: 'mpa',
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
  preview: { host: '127.0.0.1', port: 3000, strictPort: true },
  build: {
    // Preserve the directory consumed by the existing hosting/deploy tooling.
    outDir: 'build',
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        guide: fileURLToPath(new URL('./sheet-music-to-guitar-tabs/index.html', import.meta.url)),
      },
    },
  },
});
