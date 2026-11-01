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
  death() {
    if (!ready()) return;
    tone('sawtooth', 120, 35, 0.4, 0.7);
    burst('lowpass', 1200, 100, 0.7, 0.8, 0.5);
  },
};
