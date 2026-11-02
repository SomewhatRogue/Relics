/**
 * One piece playing: writes it a bar at a time a little ahead of the clock. Each pass through the
 * chords is a section (the form says which); every part plays its role in the sections it belongs to.
 * Chance (seeded) varies the form, ornaments the theme and makes up the answering tunes, so it never
 * loops exactly. Under it all, on its own fader, the fight layer: timpani, a bass drum and a driving
 * string figure on the chord.
 */
import { play, type Ins } from './orchestra';
import { parseTune, step, type Note, type Part, type Score, type Section } from './score';

const FADE = 2.5;
const DEFAULT_IN: Record<Part['role'], string> = { bass: 'iAaBQ', chord: 'iAaBQ', arp: 'iAaB', perc: 'iAaB', bells: 'AaBQ', theme: 'A', answer: 'B', line: 'B' };

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `m` moved by octaves to sit in [lo, lo + 12). */
const place = (m: number, lo: number) => lo + ((((m - lo) % 12) + 12) % 12);

export class Track {
  readonly out: GainNode;
  private next: number;
  private bar = 0;
  private rand: () => number;
  private last = 9;
  private sec: Section = 'i';
  private voicing = new Map<Part, number[]>();
  private theme: Note[][];
  private answer: Note[][] | null;

  constructor(private c: BaseAudioContext, readonly score: Score, readonly key: string, bus: AudioNode, reverb: AudioNode, private fight: AudioNode, private danger: () => number, fade = FADE) {
    this.out = c.createGain();
    this.out.gain.setValueAtTime(0.0001, c.currentTime);
    this.out.gain.exponentialRampToValueAtTime(score.level ?? 1, c.currentTime + fade);
    this.out.connect(bus);
    const send = c.createGain();
    send.gain.value = score.wet;
    this.out.connect(send).connect(reverb);
    this.next = c.currentTime + 0.1;
    this.rand = rng(score.seed + Math.floor(Math.random() * 1000));
    this.theme = parseTune(score.theme);
    this.answer = score.answer ? parseTune(score.answer) : null;
    // An opening is only the back half of the chords, so the theme comes in soon.
    if (score.form.startsWith('i')) this.bar = Math.floor(score.prog.length / 2);
  }

  /** How loud the fight layer comes in: less over a piece that has its own timpani already. */
  get fightLevel(): number {
    return this.score.parts.some((p) => p.ins === 'timp' && (p.in ?? '').includes('A')) ? 0.35 : 0.8;
  }

  fadeOut(fade = FADE): void {
    const t = this.c.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(Math.max(0.0001, this.out.gain.value), t);
    this.out.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    setTimeout(() => this.out.disconnect(), (fade + 2) * 1000);
  }

  /** Write bars until `until`. */
  fill(until: number): void {
    while (this.next < until) this.playBar(this.next), (this.next += (60 / this.score.bpm) * this.score.beats), this.bar++;
  }

  /** The section starting at this bar: the form once through, then its body again with a little chance. */
  private pickSection(n: number): Section {
    const f = this.score.form, body = f.replace('i', '') || 'A';
    let s = (n < f.length ? f[n] : body[(n - f.length) % body.length]) as Section;
    if (n >= f.length && s === 'B' && this.rand() < 0.3) s = 'Q';
    else if (n >= f.length && s === 'A' && f.includes('a') && this.rand() < 0.3) s = 'a';
    return s;
  }

  private note(ins: Ins, t: number, m: number, dur: number, vel: number, out: AudioNode = this.out): void {
    play(this.c, out, ins, t, m, dur, Math.max(0.05, Math.min(1, vel)));
  }

  private playBar(t: number): void {
    const s = this.score, beat = 60 / s.bpm, e8 = beat / 2, n = s.beats * 2, barLen = beat * s.beats;
    const len = s.prog.length, i = this.bar % len;
    if (i === 0) this.sec = this.pickSection(Math.floor(this.bar / len));
    const deg = s.prog[i], fresh = i === 0 || s.prog[i - 1] !== deg;
    let span = 1;
    while (i + span < len && s.prog[i + span] === deg) span++;
    const triad = [0, 2, 4].map((k) => step(s, deg + k));
    const jit = () => (this.rand() - 0.5) * 0.016, hum = () => (this.rand() - 0.5) * 0.1;
    for (const p of s.parts) {
      if (!(p.in ?? DEFAULT_IN[p.role]).includes(this.sec)) continue;
      const v = p.vel ?? 0.6, o = p.oct ?? 0;
      if (p.role === 'bass' && fresh) this.note(p.ins, t, place(triad[0], s.root - 30 + o), span * barLen, v);
      else if (p.role === 'chord' && fresh) for (const m of this.voice(p, triad, s.root - 7 + o)) this.note(p.ins, t + jit(), m, span * barLen, v + hum());
      else if (p.role === 'arp') {
        const lo = place(triad[0], s.root - 12 + o), tones = [lo, lo + ((triad[1] - lo + 120) % 12), lo + ((triad[2] - lo + 120) % 12), lo + 12];
        for (let j = 0, pat = p.pattern!; j < n; j++) {
          const x = pat[j % pat.length];
          if (x >= 0) this.note(p.ins, t + j * e8 + (j % 2 ? e8 * 0.05 : 0), tones[x], e8 * 1.6, v * (j === 0 ? 1.1 : 0.85) + hum());
        }
      } else if (p.role === 'theme' || (p.role === 'answer' && this.answer)) {
        const tune = p.role === 'theme' ? this.theme : this.answer!;
        this.melody(p.ins, tune[i % tune.length], t, e8, o, v);
      } else if (p.role === 'line' || p.role === 'answer') this.line(p, t, e8, n, deg, i);
      else if (p.role === 'perc') this.perc(p, t, e8, n, triad[0], i === len - 1);
      else if (p.role === 'bells' && this.rand() < (p.busy ?? 0.25)) {
        const m = triad[Math.floor(this.rand() * 3)] + 12 + o;
        this.note(p.ins, t + Math.floor(this.rand() * s.beats) * beat, m, barLen, v + hum());
      }
    }
    if (this.danger() > 0.02) this.fightBar(t, e8, n, triad[0]);
  }

  /** The chord, close, moved as little as it can from where this part last was. */
  private voice(p: Part, triad: number[], centre: number): number[] {
    const prev = this.voicing.get(p), options = [0, 1, 2].map((inv) => {
      const lo = place(triad[inv], centre - 4);
      return [lo, ...[1, 2].map((k) => lo + ((triad[(inv + k) % 3] - lo + 120) % 12))].sort((a, b) => a - b);
    });
    const cost = (v: number[]) => (prev ? v.reduce((sum, m, k) => sum + Math.abs(m - prev[k]), 0) : Math.abs(v[0] - centre));
    const best = options.reduce((a, b) => (cost(b) < cost(a) ? b : a));
    this.voicing.set(p, best);
    return best;
  }

  private melody(ins: Ins, bar: Note[] | undefined, t: number, e8: number, oct: number, vel: number): void {
    for (const [j, nt] of (bar ?? []).entries()) {
      if (nt.k === null) continue;
      const m = step(this.score, nt.k) + oct, at = t + nt.at * e8 + (this.rand() - 0.5) * 0.02, v = vel * (j === 0 ? 1.05 : 0.95) + (this.rand() - 0.5) * 0.08;
      // Now and then a long note is turned with the step above it first.
      if (nt.len >= 3 && this.rand() < 0.12) {
        this.note(ins, at, step(this.score, nt.k + 1) + oct, e8 * 0.9, v * 0.85);
        this.note(ins, at + e8, m, (nt.len - 1) * e8 * 1.02, v);
      } else this.note(ins, at, m, nt.len * e8 * 1.02, v);
    }
  }

  /** A tune made up as it goes: a walk through the mode, landing on the chord on strong beats; it rests every fourth bar. */
  private line(p: Part, t: number, e8: number, n: number, deg: number, i: number): void {
    if (i % 4 === 3) return;
    const busy = p.busy ?? 0.35, starts: number[] = [];
    for (let j = 0; j < n; j++) if (j === 0 ? this.rand() < 0.75 : j % 2 === 0 && this.rand() < busy) starts.push(j);
    starts.forEach((j, k) => {
      this.last = Math.max(2, Math.min(9, this.last + Math.round((this.rand() - 0.5) * 3)));
      let st = this.last;
      if (this.rand() < 0.6) st = deg + [0, 2, 4][Math.floor(this.rand() * 3)] + 7 * Math.round((this.last - deg) / 7);
      this.note(p.ins, t + j * e8, step(this.score, st) + (p.oct ?? 0), ((starts[k + 1] ?? n) - j) * e8 * 1.02, (p.vel ?? 0.55) + (this.rand() - 0.5) * 0.1);
    });
  }

  private perc(p: Part, t: number, e8: number, n: number, root: number, last: boolean): void {
    const pat = p.pattern!, m = place(root, (p.ins === 'timp' ? 40 : 60) + (p.oct ?? 0)), v = p.vel ?? 0.7;
    for (let j = 0; j < n; j++) {
      let x = pat[j % pat.length];
      if (!x && last && j >= n - 3 && this.rand() < 0.5) x = 1;
      if (!x) continue;
      const pitch = p.ins === 'frame' ? (x === 2 ? 40 : 60) : m;
      this.note(p.ins, t + j * e8, pitch, e8, v * (x === 2 ? 1 : 0.55) + (this.rand() - 0.5) * 0.08);
    }
  }

  /** The fight: timpani on the strong beats, a bass drum on the one, the low strings driving eighths. */
  private fightBar(t: number, e8: number, n: number, root: number): void {
    const f = this.fight, lowRoot = place(root, 38), str = place(root, 40);
    this.note('bassdrum', t, 36, e8, 0.9, f);
    for (let j = 0; j < n; j++) {
      if (j % 4 === 0) this.note('timp', t + j * e8, lowRoot, e8, j === 0 ? 0.95 : 0.75, f);
      else if (j % 4 === 3 && this.rand() < 0.45) this.note('timp', t + j * e8, lowRoot, e8, 0.45, f);
      this.note('spic', t + j * e8, j % 8 === 6 ? str + 7 : str, e8, j % 2 ? 0.55 : 0.85, f);
    }
  }
}
