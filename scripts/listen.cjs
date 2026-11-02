// Listening files: renders stretches of a few pieces offline in Chromium (the game's own music code,
// recorded instruments loaded from the preview server) and writes them as MP3s for Kyle's ears.
//   npm run build && npx vite preview --port 4178 &
//   node scripts/listen.cjs [out dir] [url]
// Prints each one's loudness and peak so a quiet or clipping piece shows up without listening.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const out = process.argv[2] || 'shots/music';
const url = process.argv[3] || 'http://localhost:4178/';
const CASES = [
  // [file, area, version, danger, seconds, options]
  ['town-lantern-square', 'town', 0, 0, 30, {}],
  ['town-market-morning', 'town', 1, 0, 30, {}],
  ['forest-hangmans-wood', 'forest', 0, 0, 30, {}],
  ['forest-fight', 'forest', 1, 1, 25, {}],
  ['church-last-lantern', 'church', 0, 0, 30, {}],
  ['village-empty-doorways', 'village', 0, 0, 30, {}],
  ['mine-copperdeep', 'mine', 0, 0, 25, {}],
  ['boss-butcher-danger1', 'boss', 0, 1, 30, { sting: true }],
  ['boss-no-mercy-danger1', 'boss', 2, 1, 25, { sting: true }],
  ['town-lantern-square-synth', 'town', 0, 0, 20, { synth: true }],
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => window.__renderMusic);
  // The synthesized one first, before any recorded note has loaded.
  for (const [name, area, version, danger, seconds, opts] of [...CASES.filter((c) => c[5].synth), ...CASES.filter((c) => !c[5].synth)]) {
    const res = await page.evaluate(async ([a, v, d, s, o]) => {
      const buf = await window.__renderMusic(a, v, d, s, o);
      const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
      let peak = 0, sum = 0;
      const wav = new DataView(new ArrayBuffer(44 + n * 4));
      const str = (o, t) => [...t].forEach((ch, i) => wav.setUint8(o + i, ch.charCodeAt(0)));
      str(0, 'RIFF'); wav.setUint32(4, 36 + n * 4, true); str(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 2, true);
      wav.setUint32(24, 44100, true); wav.setUint32(28, 44100 * 4, true); wav.setUint16(32, 4, true); wav.setUint16(34, 16, true); str(36, 'data'); wav.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) for (const [k, ch] of [[0, L], [1, R]]) {
        const x = ch[i];
        peak = Math.max(peak, Math.abs(x));
        sum += x * x;
        wav.setInt16(44 + i * 4 + k * 2, Math.max(-1, Math.min(1, x)) * 32767, true);
      }
      let bin = '';
      const bytes = new Uint8Array(wav.buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { b64: btoa(bin), peak, rms: Math.sqrt(sum / (2 * n)) };
    }, [area, version, danger, seconds, opts]);
    const wav = path.join(out, name + '.wav'), mp3 = path.join(out, name + '.mp3');
    fs.writeFileSync(wav, Buffer.from(res.b64, 'base64'));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-q:a', '2', mp3]);
    fs.unlinkSync(wav);
    const db = (x) => (20 * Math.log10(x)).toFixed(1);
    console.log(name.padEnd(28), `rms ${db(res.rms)} dB  peak ${db(res.peak)} dB`);
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
