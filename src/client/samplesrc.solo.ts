/**
 * The one-file build's recorded notes: every file in public/music is inlined into the page as a data
 * URL (about 3 MB of the 16 MB cap), so the music needs no server. vite.solo.config.ts puts this
 * module in place of samplesrc.ts.
 */
const FILES = import.meta.glob('../../public/music/*.mp3', { query: '?inline', import: 'default', eager: true }) as Record<string, string>;

export function sampleBytes(file: string): Promise<ArrayBuffer> {
  const url = FILES['../../public/music/' + file];
  if (!url) return Promise.reject(new Error('no ' + file));
  const bin = atob(url.slice(url.indexOf(',') + 1)), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return Promise.resolve(out.buffer);
}
