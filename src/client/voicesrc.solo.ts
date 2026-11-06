/**
 * The one-file build's recorded voices: every file in public/sfx/voice inlined into the page as a data
 * URL (about 3.6 MB of the 16 MB cap), so they need no server. vite.solo.config.ts puts this module in
 * place of voicesrc.ts. If the page ever grows too big for them, this can answer "no" to every file
 * and the speech blip carries the townsfolk again.
 */
const FILES = import.meta.glob('../../public/sfx/voice/*.mp3', { query: '?inline', import: 'default', eager: true }) as Record<string, string>;

export function voiceBytes(file: string): Promise<ArrayBuffer> {
  const url = FILES['../../public/sfx/voice/' + file];
  if (!url) return Promise.reject(new Error('no ' + file));
  const bin = atob(url.slice(url.indexOf(',') + 1)), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return Promise.resolve(out.buffer);
}
