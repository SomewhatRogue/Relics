import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/client',
  // The recorded music (public/music) is served from our own site next to the page.
  publicDir: '../../public',
  build: { outDir: '../../dist', emptyOutDir: true },
});
