import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,js}', 'test/**/*.test.{ts,js}'],
    setupFiles: ['./test/setup.ts'],
    coverage: { provider: 'v8', include: ['src/**/*.{ts,vue}'], exclude: ['src/**/*.test.*', 'src/main.ts', 'src/guide.ts', 'src/types.ts'] },
  },
});
