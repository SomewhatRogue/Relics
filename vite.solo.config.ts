import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file (script and styles inlined), for sharing a build as a page. It has no
// server, so VITE_SOLO hides what needs one (recovery codes).
export default defineConfig({
  root: 'src/client',
  define: { 'import.meta.env.VITE_SOLO': JSON.stringify('1') },
  plugins: [viteSingleFile()],
  build: { outDir: '../../dist-solo', emptyOutDir: true },
});
