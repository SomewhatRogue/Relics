/**
 * Where the recorded notes come from: our own site, next to the page (public/music). The one-file
 * build swaps this module for samplesrc.solo.ts, which carries them inside the page.
 */
export function sampleBytes(file: string): Promise<ArrayBuffer> {
  return fetch(import.meta.env.BASE_URL + 'music/' + file).then((r) => {
    if (!r.ok) throw new Error(`music/${file}: ${r.status}`);
    return r.arrayBuffer();
  });
}
