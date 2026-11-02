import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file (script and styles inlined), for sharing a build as a page. It has no
// server, so VITE_SOLO hides what needs one (recovery codes), and the recorded music rides inside the
// page (samplesrc.solo.ts, about 3 MB of base64) instead of being fetched from public/music.
export default defineConfig({
  root: 'src/client',
  publicDir: false,
  define: { 'import.meta.env.VITE_SOLO': JSON.stringify('1') },
  resolve: { alias: [{ find: /^\.\/samplesrc$/, replacement: fileURLToPath(new URL('./src/client/samplesrc.solo.ts', import.meta.url)) }] },
  plugins: [viteSingleFile()],
  build: { outDir: '../../dist-solo', emptyOutDir: true },
});
