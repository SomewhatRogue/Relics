/**
 * Sounds synthesized live (nothing to download): meaty and a little grim. Audio unlocks on the
 * first tap, click or key; iPhones need a sound started inside that very tap (Come Bye's lesson).
 */
let ac: AudioContext | null = null;
let master: GainNode | null = null;

export function unlockAudio(): void {
  if (!ac) {
    ac = new AudioContext();
    master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(ac.destination);
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource();
    s.buffer = b;
    s.connect(ac.destination);
    s.start();
    try {
      (navigator as unknown as { audioSession?: { type: string } }).audioSession!.type = 'playback';
    } catch { /* not supported */ }
  }
  if (ac.state !== 'running') void ac.resume();
}

export function setMuted(m: boolean): void {
  if (master) master.gain.value = m ? 0 : 0.5;
}

function noise(dur: number): AudioBufferSourceNode {
  const n = Math.floor(ac!.sampleRate * dur), b = ac!.createBuffer(1, n, ac!.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac!.createBufferSource();
  s.buffer = b;
  return s;
}

function env(peak: number, at: number, dur: number): GainNode {
  const g = ac!.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  g.connect(master!);
  return g;
}

function burst(type: BiquadFilterType, f0: number, f1: number, q: number, peak: number, dur: number): void {
  const t = ac!.currentTime, s = noise(dur), f = ac!.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  s.connect(f).connect(env(peak, t, dur));
  s.start(t);
}

function tone(type: OscillatorType, f0: number, f1: number, peak: number, dur: number, delay = 0): void {
  const t = ac!.currentTime + delay, o = ac!.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  o.connect(env(peak, t, dur));
  o.start(t);
  o.stop(t + dur + 0.05);
}

const ready = () => ac && ac.state === 'running' && master;

export const sfx = {
  swing() {
    if (ready()) burst('bandpass', 900, 2600, 1.2, 0.35, 0.14);
  },
  hit(heavy: boolean) {
    if (!ready()) return;
    tone('sine', heavy ? 110 : 150, 45, heavy ? 0.9 : 0.6, heavy ? 0.22 : 0.14);
    burst('lowpass', 2400, 300, 0.7, heavy ? 0.7 : 0.45, 0.12);
  },
  hurt() {
    if (!ready()) return;
    tone('sawtooth', 220, 90, 0.25, 0.18);
    burst('lowpass', 1600, 200, 0.7, 0.5, 0.15);
  },
  block() {
    if (!ready()) return;
    tone('triangle', 180, 120, 0.5, 0.12);
    burst('bandpass', 1400, 700, 3, 0.4, 0.1);
  },
  parry() {
    if (!ready()) return;
    for (const [f, p, d] of [[1320, 0.3, 0.6], [1980, 0.22, 0.45], [2640, 0.14, 0.35], [3520, 0.08, 0.25]]) tone('sine', f, f * 0.98, p, d);
    burst('highpass', 3000, 6000, 0.7, 0.5, 0.06);
    tone('sine', 140, 60, 0.6, 0.18);
  },
  guardbreak() {
    if (!ready()) return;
    burst('lowpass', 3000, 150, 0.8, 0.9, 0.3);
    tone('square', 160, 50, 0.25, 0.3);
  },
  roll() {
    if (ready()) burst('lowpass', 900, 200, 0.7, 0.3, 0.22);
  },
  growl(slam: boolean) {
    if (!ready()) return;
    tone('sawtooth', slam ? 70 : 95, slam ? 55 : 80, 0.3, slam ? 1.1 : 0.8);
    tone('sawtooth', slam ? 72 : 98, slam ? 50 : 76, 0.2, slam ? 1.1 : 0.8);
  },
  dodge() {
    if (ready()) tone('sine', 900, 1500, 0.15, 0.12);
  },
  backstab() {
    if (!ready()) return;
    burst('highpass', 3000, 1200, 1, 0.5, 0.08);
    tone('sine', 180, 50, 0.8, 0.2);
    burst('lowpass', 1800, 200, 0.7, 0.6, 0.15);
  },
  boom() {
    if (!ready()) return;
    tone('sine', 70, 30, 1, 0.5);
    burst('lowpass', 900, 80, 0.7, 1, 0.45);
  },
  stunned() {
    if (!ready()) return;
    for (const [f, d] of [[1760, 0], [2093, 0.08], [2637, 0.16]]) tone('sine', f, f, 0.12, 0.25, d);
  },
  wallhit() {
    if (!ready()) return;
    burst('bandpass', 700, 300, 2, 0.8, 0.18);
    tone('sine', 120, 50, 0.5, 0.15);
  },
  charged() {
    if (ready()) tone('triangle', 1320, 1760, 0.2, 0.2);
  },
  heavy() {
    if (!ready()) return;
    burst('bandpass', 400, 1600, 1, 0.55, 0.22);
  },
  throw() {
    if (ready()) burst('bandpass', 600, 2400, 1.5, 0.45, 0.25);
  },
  pinned() {
    if (!ready()) return;
    tone('square', 220, 70, 0.3, 0.12);
    burst('bandpass', 900, 300, 2, 0.9, 0.25);
    tone('sine', 1500, 1400, 0.12, 0.4, 0.02);
  },
  javwall() {
    if (!ready()) return;
    burst('bandpass', 1100, 400, 2, 0.7, 0.18);
    tone('sine', 1500, 1400, 0.1, 0.35);
  },
  javstick() {
    if (!ready()) return;
    tone('sine', 140, 60, 0.6, 0.15);
    burst('lowpass', 1200, 200, 0.7, 0.5, 0.12);
  },
  hookfire() {
    if (!ready()) return;
    burst('highpass', 2500, 4000, 1, 0.25, 0.2);
    for (let i = 0; i < 5; i++) tone('square', 2400 + i * 90, 2300, 0.03, 0.03, i * 0.035);
  },
  latch() {
    if (ready()) tone('square', 1800, 1200, 0.15, 0.08);
  },
  yank() {
    if (!ready()) return;
    for (let i = 0; i < 6; i++) tone('square', 2000 - i * 120, 1800, 0.03, 0.03, i * 0.03);
  },
  land() {
    if (ready()) burst('lowpass', 800, 150, 0.7, 0.4, 0.12);
  },
  weapon() {
    if (ready()) tone('triangle', 520, 380, 0.25, 0.12), tone('triangle', 700, 500, 0.15, 0.1, 0.06);
  },
  relic() {
    if (ready()) tone('sine', 880, 1320, 0.15, 0.25);
  },
  death(how = 'fall') {
    if (!ready()) return;
    tone('sawtooth', 120, 35, 0.4, 0.7);
    burst('lowpass', 1200, 100, 0.7, 0.8, 0.5);
    // A blade through the neck; a wet burst.
    if (how === 'behead') burst('highpass', 4000, 1500, 1, 0.6, 0.1), burst('bandpass', 400, 150, 1, 0.7, 0.4);
    if (how === 'burst') burst('lowpass', 600, 60, 0.6, 1, 0.5), tone('sine', 70, 30, 0.8, 0.3);
  },
  grab() {
    if (ready()) tone('sawtooth', 180, 120, 0.2, 0.15), burst('lowpass', 900, 300, 0.7, 0.3, 0.1);
  },
  hurl() {
    if (ready()) burst('bandpass', 400, 1600, 1, 0.5, 0.3);
  },
  slam() {
    if (!ready()) return;
    tone('sine', 80, 30, 1, 0.4);
    burst('lowpass', 1500, 80, 0.7, 1, 0.35);
  },
  bodyhit() {
    if (!ready()) return;
    tone('sine', 110, 45, 0.8, 0.2);
    burst('bandpass', 900, 250, 1.5, 0.8, 0.18);
  },
  wriggle() {},
  arrow() {
    if (!ready()) return;
    tone('triangle', 220, 120, 0.3, 0.08);
    burst('highpass', 2500, 5000, 1, 0.25, 0.12);
  },
  spark() {
    if (ready()) tone('sine', 1200, 600, 0.18, 0.15), burst('bandpass', 3000, 1500, 2, 0.2, 0.1);
  },
  orb() {
    if (ready()) tone('sine', 300, 600, 0.3, 0.35), tone('triangle', 450, 900, 0.15, 0.35);
  },
  bolt() {
    if (!ready()) return;
    tone('square', 160, 70, 0.4, 0.1);
    burst('bandpass', 1500, 600, 2, 0.6, 0.12);
  },
  lance() {
    if (ready()) tone('sawtooth', 400, 1600, 0.2, 0.2), burst('highpass', 2000, 5000, 1, 0.3, 0.15);
  },
  smite() {
    if (!ready()) return;
    for (const [f, d] of [[523, 0], [784, 0.03], [1046, 0.06]]) tone('sine', f, f, 0.2, 0.6, d);
    tone('sine', 90, 35, 0.9, 0.4);
    burst('lowpass', 3000, 200, 0.7, 0.8, 0.35);
  },
  net() {
    if (ready()) burst('bandpass', 500, 1200, 1, 0.4, 0.25);
  },
  snared() {},
  drop() {
    if (ready()) for (const [f, d] of [[1320, 0], [1760, 0.06]]) tone('triangle', f, f, 0.12, 0.3, d);
  },
  loot() {
    if (!ready()) return;
    tone('triangle', 520, 520, 0.2, 0.12);
    tone('triangle', 780, 780, 0.18, 0.2, 0.08);
  },
  perfect() {
    if (ready()) tone('sine', 2093, 2093, 0.2, 0.25), tone('sine', 3136, 3136, 0.1, 0.2, 0.02);
  },
  tempo() {
    if (ready()) tone('sine', 880, 1760, 0.15, 0.15);
  },
  well() {
    if (ready()) tone('sine', 60, 110, 0.6, 1.2), tone('triangle', 220, 330, 0.1, 1.2);
  },
  shadow() {
    if (ready()) burst('lowpass', 2000, 300, 0.8, 0.4, 0.2), tone('sine', 300, 120, 0.2, 0.2);
  },
  rally() {
    if (!ready()) return;
    tone('sawtooth', 196, 196, 0.35, 0.9);
    tone('sawtooth', 294, 294, 0.2, 0.9, 0.05);
    tone('triangle', 392, 392, 0.15, 0.7, 0.1);
  },
  blessed() {
    if (!ready()) return;
    for (const [f, d] of [[880, 0], [1175, 0.08], [1760, 0.16]]) tone('sine', f, f, 0.12, 0.5, d);
  },
  burst() {
    if (!ready()) return;
    tone('sine', 90, 35, 0.9, 0.4);
    burst('lowpass', 2400, 120, 0.7, 0.9, 0.4);
  },
  ignite() {
    if (ready()) burst('bandpass', 800, 2400, 0.8, 0.45, 0.35);
  },
  chill() {
    if (ready()) tone('sine', 2400, 1800, 0.1, 0.25), burst('highpass', 4000, 6000, 1, 0.15, 0.2);
  },
  freeze() {
    if (!ready()) return;
    for (const [f, d] of [[2093, 0], [2637, 0.05], [3136, 0.1]]) tone('triangle', f, f * 0.97, 0.12, 0.3, d);
    burst('highpass', 3000, 5000, 1, 0.3, 0.25);
  },
  shatter() {
    if (!ready()) return;
    burst('highpass', 6000, 2000, 1, 0.9, 0.3);
    for (let i = 0; i < 6; i++) tone('triangle', 2600 + i * 300, 2000, 0.06, 0.12, i * 0.03);
  },
  steam() {
    if (ready()) burst('highpass', 1500, 4000, 0.5, 0.7, 0.7);
  },
  flare() {
    if (!ready()) return;
    tone('sine', 120, 40, 0.8, 0.35);
    burst('bandpass', 600, 2400, 0.8, 0.9, 0.35);
  },
  shock() {
    if (!ready()) return;
    for (let i = 0; i < 4; i++) tone('square', 1800 - i * 300, 900, 0.08, 0.05, i * 0.02);
    burst('highpass', 3000, 6000, 1, 0.3, 0.1);
  },
  bless() {
    if (!ready()) return;
    for (const [f, d] of [[660, 0], [880, 0.07], [1320, 0.14]]) tone('sine', f, f, 0.15, 0.5, d);
  },
  heal() {
    if (ready()) tone('sine', 990, 1320, 0.1, 0.2);
  },
  blink() {
    if (ready()) tone('sine', 600, 2400, 0.15, 0.12), tone('sine', 2400, 900, 0.1, 0.12, 0.1);
  },
};
