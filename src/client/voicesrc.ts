/**
 * Where the recorded voices come from: our own site, next to the page (public/sfx/voice). The one-file
 * build swaps this module for voicesrc.solo.ts, which carries them inside the page.
 */
export function voiceBytes(file: string): Promise<ArrayBuffer> {
  return fetch(import.meta.env.BASE_URL + 'sfx/voice/' + file).then((r) => {
    if (!r.ok) throw new Error(`sfx/voice/${file}: ${r.status}`);
    return r.arrayBuffer();
  });
}
