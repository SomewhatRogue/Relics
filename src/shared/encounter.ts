/**
 * Laying a routed room's goblins out as fights (the table: shared/encounters.ts). The set piece has
 * put its small goblins down in bands; here each band becomes a pack with one template, picked by the
 * room's place in the job, the place, its ruin and what the room has (roofs, a ledge), under a cap on
 * specials for the room and its threat budget (shared/roombudget.ts, numbers shared/threat.ts). The bands
 * take the room's beats in order from the way in: a swarm to splat, a fight to think about, a closer;
 * each spends its share of the budget, its small ones filling what its specials leave. One or two rooms a
 * job keep a BIG ONE for their closer. On its own seeded stream, after everything else in the room is placed.
 */
import type { Block } from './arena.js';
import { ENCOUNTER, TEMPLATES, BACK_ROLES, type Beat, type Role, type Template } from './encounters.js';
import { BIG, BUDGET, SCREEN, THREAT } from './threat.js';
import { VARIANTS } from './tuning.js';
import { beatsFor, bigRooms, capsFor, roomBudget, threatIn, weighOf } from './roombudget.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { Foe, FoeVariant } from './terrain.js';
import { ROOF } from './raiders.js';
import { CROWS } from './prowlers.js';
import { weightIn } from './debut.js';

type P = { x: number; y: number };
export interface Compose {
  foes: Foe[]; job: Job; index: number; W: number; H: number; spawn: P; blocks: Block[];
  spot(r: number, y0?: number, y1?: number): P | null;
  free(x: number, y: number, r: number): boolean;
  claim(x: number, y: number, r: number): void;
}

const d = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const plain = (f: Foe) => f.kind === 'scrapper' && !f.bow && !f.variant && !f.name && !f.task;
const mid = (fs: Foe[]): P => ({ x: fs.reduce((s, f) => s + f.x, 0) / fs.length, y: fs.reduce((s, f) => s + f.y, 0) / fs.length });
export const isSpecial = (f: Foe) => !!f.role && f.role !== 'fodder' && f.role !== 'wolf' && f.role !== 'blind';
/** How many specials a template puts in a pack. */
export const cost = (t: Template) => (t.centre?.length ?? 0) + (t.support?.length ?? 0);
/** Houses standing with their roofs on (a roof archer's perch). */
export const roofsIn = (blocks: Block[]) => blocks.filter((b) => (b.kind === 'house' || b.kind === 'barn') && !b.ruined && b.fate !== 'wrecked' && b.fate !== 'burning' && b.w >= 2.4);

/** Make `f` into a goblin for `role` (its place kept). */
export function cast(f: Foe, role: Role): Foe {
  delete f.variant, delete f.bow;
  f.role = role;
  if (role === 'butcher') f.kind = 'butcher';
  else if (role === 'archer') f.bow = true;
  else if (role === 'roofer') (f.bow = true), (f.variant = 'roofer');
  else if (role !== 'fodder') f.variant = role as FoeVariant;
  // Wolves and the blind hunters don't sit at the dead or sleep by a fire: they're up and about.
  if (role === 'wolf' || role === 'blind' || role === 'log') delete f.feeding;
  if (role === 'fodder') delete f.z;
  return f;
}

/** Bands of small goblins: near ones joined, the nearest the way in first. */
function bands(fs: Foe[], spawn: P, most: number): Foe[][] {
  const out: Foe[][] = [];
  for (const f of fs) {
    const near = out.filter((b) => b.some((g) => d(g, f) < ENCOUNTER.band));
    const into = near[0] ?? (out.push([]), out[out.length - 1]);
    into.push(f);
    for (const o of near.slice(1)) into.push(...o.splice(0));
  }
  const live = out.filter((b) => b.length);
  // Too many, or a straggler alone: the smallest joins the nearest.
  while (live.length > 1 && (live.length > most || live.some((b) => b.length < 2))) {
    live.sort((a, b) => a.length - b.length);
    const small = live.shift()!, m = mid(small);
    live.sort((a, b) => d(mid(a), m) - d(mid(b), m))[0].push(...small);
  }
  return live.sort((a, b) => d(mid(a), spawn) - d(mid(b), spawn));
}

/** The templates a band may be, given the room, its beat, what's left of its caps and its budget. */
function fits(c: Compose, left: number, used: Set<string>, first: boolean, beat: Beat, budget: number, big: boolean, most = Infinity): Template[] {
  const kind = c.job.place.kind, ruin = c.job.place.ruin, roofs = roofsIn(c.blocks).length > 0, cap = capsFor(1, c.index);
  const base = (t: Template) => (!t.places || t.places.includes(kind)) && c.index >= (t.from ?? 0) && ruin >= (t.ruin ?? 0) && (!t.roofs || roofs) &&
    cost(t) <= left && (!used.has(t.id) || t.id === 'swarm' || t.id === 'brute' || t.id === 'cave') && (!first || ENCOUNTER.first.includes(t.id));
  // A room keeping a BIG ONE: its closer is one.
  if (big) return TEMPLATES.filter((t) => t.big && base(t));
  return TEMPLATES.filter((t) => {
    const w = weighOf(t);
    return !t.big && base(t) && t.beats.includes(beat) && w.meaty <= cap.meaty && w.heavy <= cap.heavy && w.threat <= Math.min(most, Math.max(budget, THREAT.meaty)) && weightIn(t, c.job, c.index) > 0;
  });
}

/**
 * How many small ones each band gets: what the budget leaves after the specials, shared by beat (a swarm
 * the most), each within what its template allows (a swarm may run one over); then, if still over
 * budget, the biggest crowds lose one at a time down to one small one each.
 */
function fill(ts: Template[], beats: Beat[], budget: number): number[] {
  const spare = Math.max(0, budget - ts.reduce((s, t) => s + weighOf(t).threat, 0)), sum = beats.reduce((s, b) => s + BUDGET.share[b] * (b === 'splat' ? 2 : 1), 0) || 1;
  const want = ts.map((t, i) => {
    // (No pack alone more than a lone hero's screen: shared/threat.ts SCREEN.)
    const b = beats[i], lo = b === 'splat' ? t.fodder[0] : Math.max(1, t.fodder[0] - 1), hi = Math.min(t.fodder[1] + (b === 'splat' ? 1 : 0), Math.floor((SCREEN.threat[0] - weighOf(t).threat) / THREAT.chaff));
    return Math.max(Math.min(lo, hi), Math.min(hi, Math.round((spare * BUDGET.share[b] * (b === 'splat' ? 2 : 1)) / sum / THREAT.chaff)));
  });
  while (want.reduce((s, n) => s + n, 0) * THREAT.chaff > spare + 1e-9 && want.some((n) => n > 1)) want[want.indexOf(Math.max(...want))]--;
  return want;
}

/** One of `ts` by weight (a new sort's by where it is in its debut: shared/debut.ts). */
function pick(rng: Rng, ts: Template[], c: Compose): Template {
  const w = (t: Template) => weightIn(t, c.job, c.index);
  let r = rng.next() * ts.reduce((s, t) => s + w(t), 0);
  for (const t of ts) if ((r -= w(t)) < 0) return t;
  return ts[ts.length - 1];
}

/** A new goblin by a band, `back` of it (away from the way in) or about it; null if there's no room. */
function addNear(c: Compose, at: P, back: boolean, rng: Rng): Foe | null {
  const ax = at.x - c.spawn.x, ay = at.y - c.spawn.y, l = Math.hypot(ax, ay) || 1;
  for (let t = 0; t < 16; t++) {
    const a = rng.range(0, Math.PI * 2), r = rng.range(1, 2.6), x = at.x + (back ? (ax / l) * 1.8 : 0) + Math.cos(a) * r, y = at.y + (back ? (ay / l) * 1.8 : 0) + Math.sin(a) * r;
    if (x > 1.2 && x < c.W - 1.2 && y > 1.6 && y < c.H - 3 && c.free(x, y, 0.45)) return c.claim(x, y, 0.45), { kind: 'scrapper', x, y };
  }
  const s = c.spot(0.45, 2, c.H - 4);
  return s && { kind: 'scrapper', ...s };
}

/** A roof archer up on a house: the middle of its roof, raised. */
function perch(f: Foe, b: Block): void {
  Object.assign(f, { x: b.x + b.w / 2, y: b.y + b.h * 0.4, z: ROOF.z, awake: false });
  delete f.feeding;
}

/** One band as template `t`: pack `id`. Returns the pack. (An expedition lays its packs with it too: shared/expedpacks.ts.) */
export function lay(c: Compose, band: Foe[], t: Template, id: number, rng: Rng, roofs: Block[], fodder?: number): Foe[] {
  const m = mid(band), out: Foe[] = [], pool = [...band].sort((a, b) => d(a, m) - d(b, m));
  const take = (back: boolean) => {
    if (!pool.length) return addNear(c, m, back, rng);
    // The back of the pack: furthest from the way in; the front: nearest its middle.
    const i = back ? pool.reduce((bi, f, k) => (d(f, c.spawn) > d(pool[bi], c.spawn) ? k : bi), 0) : 0;
    return pool.splice(i, 1)[0];
  };
  for (const role of [...(t.centre ?? []), ...(t.support ?? [])]) {
    const f = take(BACK_ROLES.includes(role));
    if (!f) continue;
    cast(f, role);
    if (role === 'roofer') {
      const b = roofs.shift();
      if (!b) continue;
      perch(f, b);
    }
    out.push(f);
  }
  const roll = t.fodder[0] + rng.int(t.fodder[1] - t.fodder[0] + 1), want = fodder ?? roll;
  // Too many: the ones furthest out go.
  if (pool.length > want) pool.length = want;
  while (pool.length < want) {
    const f = addNear(c, m, false, rng);
    if (!f) break;
    pool.push(f);
  }
  // No room for a single small one (water all round): the backer stands in as one.
  const lone = !pool.length && out.length ? out.pop()! : null;
  for (const f of pool) {
    cast(f, t.fodderKind ?? 'fodder');
    if (t.bunch) f.hp = ENCOUNTER.bunchHp;
    out.push(f);
  }
  if (lone) out.push(cast(lone, 'fodder'));
  const centre = out[0];
  if (centre && t.more) centre.more = t.more;
  // A BIG ONE: its own sort's health BIG.hp times over, and harder blows (shared/threat.ts).
  if (centre && t.big && centre.role === t.centre?.[0]) Object.assign(centre, { big: true, hp: Math.round(VARIANTS[centre.role as 'heavy' | 'ironhide'].hp * BIG.hp), harm: BIG.harm });
  for (const f of out) f.pack = id;
  return out;
}

/**
 * The room's goblins as fights. Changes `c.foes` in place: its plain small goblins become packs (some
 * of them specials, a few added or taken away), archers on a ledge their own pack, kept to the cap.
 */
export function composeRoom(c: Compose): Template[] {
  const rng = new Rng(c.job.seed * 97 + c.index * 29 + 11), job = c.job, deep = job.deep || job.place.ruin >= 3;
  const at = Math.min(c.index, ENCOUNTER.specials.length - 1);
  let left = ENCOUNTER.specials[at] + (deep ? ENCOUNTER.deep : 0);
  // Archers up on a ledge: a pack of their own, two of them (three on the high road), counted.
  const ledge = c.foes.filter((f) => f.bow && (f.z ?? 0) > 0);
  const keep = Math.min(left, ledge.length >= 3 ? ENCOUNTER.high : ENCOUNTER.ledge);
  for (const f of ledge.slice(keep)) c.foes.splice(c.foes.indexOf(f), 1);
  for (const f of ledge.slice(0, keep)) (f.pack = 90), (f.role = 'archer');
  left -= Math.min(keep, ledge.length);
  // The budget: less the ledge's archers and anyone the room already has at something (a scene's, a debut's).
  const busy = c.foes.filter((f) => (f.kind === 'scrapper' || f.kind === 'butcher') && !f.name && !plain(f));
  const budget = roomBudget(job, c.index) - threatIn(busy);
  const bandsOf = bands(c.foes.filter(plain), c.spawn, ENCOUNTER.fights[at]);
  // The beats from the way in (on a stream of their own: shared/roombudget.ts).
  // A room keeping a BIG ONE sets its price aside first (and keeps none if it can't afford one).
  const reserve = THREAT.meaty * THREAT.big + THREAT.chaff, big = bigRooms(job).includes(c.index) && budget >= reserve + THREAT.chaff * (bandsOf.length - 1);
  const beats = beatsFor(bandsOf.length, c.index, new Rng(job.seed * 53 + c.index * 7 + 5), big);
  const roofs = rng.shuffle(roofsIn(c.blocks).sort((a, b) => a.x - b.x || a.y - b.y)), used = new Set<string>(), chose: Template[] = [];
  // First each band's template, by its beat and its share of what's left; then the small ones to the budget.
  let spend = budget - (big ? reserve : 0);
  bandsOf.forEach((_, i) => {
    const beat = beats[i], wantBig = big && beat === 'closer' && i === beats.length - 1;
    const rest = beats.slice(i).reduce((s, b, k) => s + (big && i + k === beats.length - 1 ? 0 : BUDGET.share[b]), 0) || 1;
    const share = wantBig ? Math.max(0, spend) + reserve : Math.max(0, spend) * (BUDGET.share[beat] / rest);
    // (Leaving room for a small one in each band still to come, this one's too.)
    let ts = fits(c, Math.max(0, left), used, c.index === 0 && i === 0, beat, share, wantBig, spend - THREAT.chaff * (beats.length - i));
    if (wantBig && !ts.length) ts = fits(c, Math.max(0, left), used, false, beat, share, false, spend + reserve);
    if (!roofs.length) ts = ts.filter((t) => !t.roofs);
    const t = ts.length ? pick(rng, ts, c) : TEMPLATES[0];
    used.add(t.id), chose.push(t);
    left -= cost(t);
    spend -= weighOf(t).threat - (wantBig && t.big ? reserve : 0);
  });
  const counts = fill(chose, beats, budget);
  bandsOf.forEach((band, i) => {
    const keepers = new Set(lay(c, band, chose[i], i + 1, rng, roofs, counts[i]));
    for (const f of band) if (!keepers.has(f)) c.foes.splice(c.foes.indexOf(f), 1);
    for (const f of keepers) if (!c.foes.includes(f)) c.foes.push(f);
    for (const f of keepers) f.beat = beats[i];
  });
  return chose;
}

/** Carrion crows on the dead out in the open (never down a mine): a flock on a room's dead, now and then. */
export function crowsOn(job: Job, index: number, dead: P[]): P[] {
  if (job.place.kind === 'mine' || !dead.length) return [];
  const rng = new Rng(job.seed * 61 + index * 17 + 3);
  return rng.next() < CROWS.chance ? [{ x: dead[0].x, y: dead[0].y - 0.2 }] : [];
}
