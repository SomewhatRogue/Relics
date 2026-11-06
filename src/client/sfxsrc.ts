/**
 * Where the recorded sound effects come from: our own site, next to the page (public/sfx). The
 * one-file build swaps this module for sfxsrc.solo.ts, which carries them inside the page.
 */
export function sfxBytes(file: string): Promise<ArrayBuffer> {
  return fetch(import.meta.env.BASE_URL + 'sfx/' + file).then((r) => {
    if (!r.ok) throw new Error(`sfx/${file}: ${r.status}`);
    return r.arrayBuffer();
  });
}
