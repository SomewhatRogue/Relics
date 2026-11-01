import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file (script and styles inlined), for sharing a build as a page.
export default defineConfig({
  root: 'src/client',
  plugins: [viteSingleFile()],
  build: { outDir: '../../dist-solo', emptyOutDir: true },
});
