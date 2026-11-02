import { defineConfig } from 'vitest/config';
// The map tests walk every place, seed and room: give them time when the whole suite runs at once.
export default defineConfig({ root: '.', test: { include: ['tests/**/*.test.ts'], testTimeout: 60000 } });
