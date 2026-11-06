/**
 * The one-file build's recorded sound effects: every file in public/sfx is inlined into the page as a
 * data URL (about 1.6 MB of the 16 MB cap), so they need no server. vite.solo.config.ts puts this
 * module in place of sfxsrc.ts.
 */
const FILES = import.meta.glob('../../public/sfx/*.mp3', { query: '?inline', import: 'default', eager: true }) as Record<string, string>;

export function sfxBytes(file: string): Promise<ArrayBuffer> {
  const url = FILES['../../public/sfx/' + file];
  if (!url) return Promise.reject(new Error('no ' + file));
  const bin = atob(url.slice(url.indexOf(',') + 1)), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return Promise.resolve(out.buffer);
}
