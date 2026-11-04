/**
 * A layout-3 job's route (docs/terrain-nodes.md slices 2 to 4): rooms that turn, a fork whose two
 * roads are different rooms and come back into the same room by different sides, side ways to dead
 * ends, and the countries crossed in the valley's order with a transition room at every change. Rolled
 * once from `new Rng(job.seed * 7919 + 101)` with both roads up front, so every screen agrees and the
 * road taken only picks a branch. The rules each path keeps (tests/routeports.test.ts):
 *
 * 1. no node twice running, no sub-layout twice; one landmark and one set piece a room, never repeated;
 * 2. a palette step every room (two of floor, back wall, ground, light);
 * 3. ports the room can take (built-up rooms bottom to top, fords and causeways straight across);
 * 4. no more than two rooms running leave by the same side; a medium or longer job turns at least once.
 */
import { countriesFor, nodesFor, stepsFor, type Step } from './countries.js';
import type { Job } from './jobs.js';
import { HEART_SOIL, HEART_VARIANTS, LANDMARKS, LAYOUTS, PALETTES, PIECES, PIECES_IN, signatureOf, type Palette, type Piece, type Skin } from './nodes.js';
import { FORKS, LAYOUTS3, MORE_SOIL, POOL3, PORTS, SKIN_OF, VILLAGE_PALETTE, portsOk, type Country, type RouteNode } from './nodeports.js';
import { OPP, TALL, portRange, sizeFor, type Port, type Side } from './ports.js';
import { Rng } from './rng.js';
import { HEART_LOOK, type RoomSpec } from './route.js';
import { sideWays } from './routeside.js';
import { siteOf } from './sites.js';

type Out = Port & { road?: 'high' | 'low' };
const layoutsOf = (n: RouteNode): string[] => (LAYOUTS as Record<string, string[]>)[n] ?? (LAYOUTS3 as Record<string, string[]>)[n];
const steps = (a: Palette, b: Palette) => (['floor', 'back', 'soil', 'light'] as const).filter((k) => a[k] !== b[k]).length;

/** Three places along a side for a way out, by its length. */
function slots(s: Side, w: number, h: number): number[] {
  const [a, b] = portRange(s, w, h);
  return [a, (a + b) / 2, b].map((v) => Math.round(v * 10) / 10);
}

interface Used { layouts: Set<string>; marks: Set<string>; pieces: Set<Piece> }
interface Want { next?: Step; step: Step; ins: Port[]; prev: RoomSpec[]; outs: 1 | 2; okOuts(o: Side[]): boolean; tall?: boolean; nextPal?: Palette; notNodes?: string[] }

/** Where you come in, from the way out of the room before (scaled to this room's size). */
function inFrom(o: Port, from: { w: number; h: number }, w: number, h: number): Port {
  const side = OPP[o.side], [lo, hi] = side === 'N' || side === 'S' ? [4, w - 4] : [5, h - 3.5];
  const scale = side === 'N' || side === 'S' ? w / from.w : h / from.h;
  return { side, at: Math.round(Math.max(lo, Math.min(hi, o.at * scale)) * 10) / 10 };
}

/** A palette two steps from every room it follows or leads into (null if there's none: the route rolls again). */
function paletteFor(rng: Rng, c: Country, back: Palette['back'] | null, after: Palette[]): Palette | null {
  const o = c === 'village' ? VILLAGE_PALETTE : PALETTES[SKIN_OF[c]], all: Palette[] = [];
  for (const floor of o.floor) for (const bk of back ? [back] : o.back) for (const soil of [...o.soil, ...(MORE_SOIL[c] ?? [])]) for (const light of o.light) all.push({ floor, back: bk, soil, light });
  const ok = all.filter((p) => after.every((a) => steps(a, p) >= 2));
  return ok.length ? rng.pick(ok) : null;
}

/** One approach room: a node that fits the step, the ports and the rules, then its look. */
function room(rng: Rng, used: Used, sign: string[], index: number, w: Want): RoomSpec | null {
  const { step } = w, inSides = w.ins.map((p) => p.side);
  const free = (n: RouteNode) => layoutsOf(n).filter((l) => !used.layouts.has(`${n}/${l}`) && !(n === 'ford' && l === 'broken' && (sign.includes('bridge') || inSides[0] !== 'S')));
  const nodes = rng.shuffle(nodesFor(step, POOL3).filter((n) => !w.prev.some((p) => p.node === n) && !w.notNodes?.includes(n) && free(n).length && (w.outs === 1 || FORKS.includes(n))));
  const sides = (['N', 'E', 'W'] as Side[]).filter((s) => !inSides.includes(s));
  const combos: Side[][] = w.outs === 1 ? rng.shuffle([...sides, ...sides.filter((s) => s === 'N')]).map((s) => [s]) : rng.shuffle(sides.flatMap((a, i) => sides.slice(i + 1).map((b) => [a, b])));
  for (const node of nodes) for (const outSides of combos) {
    if (!inSides.every((s) => portsOk(node, s, outSides)) || !w.okOuts(outSides)) continue;
    // Look one room ahead: the next room must be able to take this way in (a built-up one only from the bottom).
    if (w.next && outSides.length === 1 && !nodesFor(w.next, POOL3).some((n) => PORTS[n] !== 'north' || outSides[0] === 'N')) continue;
    const size = w.tall || w.ins.length > 1 ? TALL : sizeFor(inSides[0], outSides);
    const layout = rng.pick(free(node));
    used.layouts.add(`${node}/${layout}`);
    const ins = w.ins.map((p) => ({ ...p, at: Math.max(...[4, Math.min(p.at, (p.side === 'N' || p.side === 'S' ? size.w : size.h) - 3.5)]) }));
    const outs: Out[] = outSides.map((s) => ({ side: s, at: rng.pick(slots(s, size.w, size.h).filter((a) => !ins.some((p) => p.side === OPP[s] && Math.abs(p.at - a) < 2))) }));
    const skin = SKIN_OF[step.from && step.country === 'under' ? step.from : step.country], into = step.country === 'under' && step.from;
    const bridge = node === 'ford' && layout === 'broken';
    const pieces = PIECES_IN[skin].filter((p) => !used.pieces.has(p));
    const piece: Piece = bridge ? 'bridge' : pieces.length ? rng.pick(pieces) : 'fire';
    used.pieces.add(piece);
    const marks = LANDMARKS[skin].filter((m) => !used.marks.has(m));
    const landmark = marks.length ? rng.pick(marks) : null;
    if (landmark) used.marks.add(landmark);
    const back = node === 'minehead' || node === 'hamletmine' ? 'rockface' : node === 'outfall' ? 'stone' : null;
    const palette = paletteFor(rng, into ? step.from! : step.country, back, [...w.prev.map((p) => p.palette), ...(w.nextPal ? [w.nextPal] : [])]);
    if (!palette) return null;
    return {
      index, heart: false, node, layout, skin, inX: ins[0].at, outX: outs[0].at, landmark, piece, palette, w: size.w, h: size.h, in: ins[0], outs,
      country: step.country, ...(step.from ? { from: SKIN_OF[step.from], fromCountry: step.from } : {}),
    };
  }
  return null;
}

/** The last out's side, and how many rooms running have left by it. */
const runOf = (path: RoomSpec[]) => {
  const s = path.map((r) => r.outs?.[0].side);
  let n = 0;
  while (n < s.length && s[s.length - 1 - n] === s[s.length - 1]) n++;
  return { side: s[s.length - 1], n };
};
const notThird = (path: RoomSpec[]) => (o: Side[]) => { const r = runOf(path); return !(o.length === 1 && r.n >= 2 && o[0] === r.side); };

/** Both paths of the job (high road first): every room an object shared where the paths share it. */
function build(job: Job, rng: Rng, plain = false): { high: RoomSpec[]; low: RoomSpec[] } | null {
  const N = job.rooms, A = N - 1, fork = N >= 3 && !plain ? (N >= 5 ? 1 + rng.int(2) : 0) : -1, sign = signatureOf(job.place), site = siteOf(job.place);
  const forks = (x: Step) => nodesFor(x, POOL3).some((n) => FORKS.includes(n)), two = (x: Step) => !x.from || nodesFor(x, POOL3).length > 1;
  const meets = (x?: Step) => !x || nodesFor(x, POOL3).some((n) => PORTS[n] === 'any' || PORTS[n] === 'outnorth');
  const st = stepsFor(countriesFor(job.place, N, rng), A, rng, (s) => fork < 0 || (forks(s[fork]) && two(s[fork + 1]) && meets(s[fork + 2])));
  const used: Used = { layouts: new Set(), marks: new Set(sign), pieces: new Set() };
  const [hf, hb] = HEART_LOOK[site], heartPal: Palette = { floor: hf, back: hb, soil: HEART_SOIL[site] ?? 'earth', light: job.place.kind };
  const nextPal = (i: number) => (i === A - 1 ? heartPal : undefined);
  const first: Port = { side: 'S', at: rng.pick(slots('S', TALL.w, TALL.h)) };
  const pre: RoomSpec[] = [];
  const add = (path: RoomSpec[], i: number, ins: Port[], prev: RoomSpec[], extra: Partial<Want> = {}) => room(rng, used, sign, i, { step: st[i], next: st[i + 1], ins, prev, outs: 1, okOuts: notThird(path), nextPal: nextPal(i), ...extra });
  const enter = (r: RoomSpec, o = r.outs![0]) => inFrom(o, { w: r.w!, h: r.h! }, TALL.w, TALL.h);
  for (let i = 0; i < (fork >= 0 ? fork : A); i++) {
    const r = add(pre, i, [i ? enter(pre[i - 1]) : first], i ? [pre[i - 1]] : []);
    if (!r) return null;
    pre.push(r);
  }
  if (fork < 0) return { high: pre, low: pre };
  // The fork: two ways on, on different sides; then each road its own room; then where they meet again.
  const before = pre[fork - 1], f = room(rng, used, sign, fork, { step: st[fork], ins: [before ? enter(before) : first], prev: before ? [before] : [], outs: 2, okOuts: () => true });
  if (!f) return null;
  const [hi, lo] = rng.shuffle([0, 1]);
  f.outs![hi].road = 'high', (f.outs![lo].road = 'low');
  const rejoinHeart = fork + 2 >= N - 1;
  // The rejoin is come into by a different side from each road (the heart by the bottom or low down a side).
  const hr = add([...pre, f], fork + 1, [enter(f, f.outs![hi])], [f]);
  if (!hr) return null;
  const lr = add([...pre, f], fork + 1, [enter(f, f.outs![lo])], [f], { okOuts: (o) => (o[0] !== hr.outs![0].side || PORTS[hr.node as RouteNode] === 'outnorth') && notThird([...pre, f])(o), notNodes: [hr.node] });
  if (!lr) return null;
  let rest: RoomSpec[] = [], restLow: RoomSpec[] = [];
  if (!rejoinHeart) {
    const j = room(rng, used, sign, fork + 2, { step: st[fork + 2], next: st[fork + 3], ins: [enter(hr), enter(lr)], prev: [hr, lr], outs: 1, okOuts: () => true, tall: true, nextPal: nextPal(fork + 2) });
    if (!j) return null;
    const jl: RoomSpec = { ...j, in: enter(lr), inX: enter(lr).at };
    rest = [j], restLow = [jl];
    for (let i = fork + 3; i < A; i++) {
      const r = add([...pre, f, hr, ...rest], i, [enter(rest[rest.length - 1])], [rest[rest.length - 1]], { okOuts: (o) => notThird([...pre, f, hr, ...rest])(o) && notThird([...pre, f, lr, ...restLow])(o) });
      if (!r) return null;
      rest.push(r), restLow.push(r);
    }
  }
  const high = [...pre, f, hr, ...rest], low = [...pre, f, lr, ...restLow];
  // A medium or longer job turns at least once (a fork always has a way on to a side, so it does).
  return { high, low };
}

/** The heart, come into from the last room's way on: by the bottom, or low down a side. */
function heartAfter(job: Job, last: RoomSpec | undefined, variant: number, piece: Piece, palette: Palette): RoomSpec {
  const o = last?.outs?.[0], side: Side = o ? OPP[o.side] : 'S';
  const at = !o ? TALL.w / 2 : side === 'S' ? Math.max(4, Math.min(TALL.w - 4, o.at * (TALL.w / (last!.w ?? TALL.w)))) : TALL.h - 3;
  return {
    index: job.rooms - 1, heart: true, node: siteOf(job.place), layout: `heart-${variant}`, skin: null, inX: side === 'S' ? at : 14, outX: 14, landmark: null, piece, palette,
    w: TALL.w, h: TALL.h, in: { side, at: Math.round(at * 10) / 10 }, outs: [{ side: 'N', at: 14 }],
  };
}

const memo = new Map<string, { high: RoomSpec[]; low: RoomSpec[] }>();

export function route3(job: Job, took: string): RoomSpec[] {
  const key = `${job.seed}|${job.place.name}|${job.place.kind}|${job.place.region}|${job.rooms}|${job.objective}`;
  let t = memo.get(key);
  if (!t) {
    const rng = new Rng(job.seed * 7919 + 101), variant = rng.int(HEART_VARIANTS);
    let b: { high: RoomSpec[]; low: RoomSpec[] } | null = null;
    for (let k = 0; k < 40 && !b; k++) b = build(job, rng);
    // (Never seen to fail over thousands of jobs; a route without a fork if it ever did.)
    for (let k = 0; k < 40 && !b; k++) b = build(job, rng, true);
    b ??= { high: [], low: [] };
    sideWays(job, rng, [b.high, b.low]);
    const seen = new Set([...b.high, ...b.low].map((r) => r.piece)), left = PIECES.filter((p) => !seen.has(p) && !(job.place.kind === 'mine' && p === 'wreck'));
    const site = siteOf(job.place), [hf, hb] = HEART_LOOK[site], pal: Palette = { floor: hf, back: hb, soil: HEART_SOIL[site] ?? 'earth', light: job.place.kind };
    const piece = left.length ? rng.pick(left) : 'fire';
    t = { high: [...b.high, heartAfter(job, b.high[b.high.length - 1], variant, piece, pal)], low: [...b.low, heartAfter(job, b.low[b.low.length - 1], variant, piece, pal)] };
    if (memo.size > 64) memo.clear();
    memo.set(key, t);
  }
  return took.includes('l') ? t.low : t.high;
}

export type { Skin };
