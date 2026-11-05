/**
 * Laying a routed room's goblins out as fights (the table: shared/encounters.ts). The set piece has
 * put its small goblins down in bands; here each band becomes a pack with one template, picked by the
 * room's place in the job, the place, its ruin and what the room has (roofs, a ledge), under a cap on
 * specials for the room. On its own seeded stream, after everything else in the room is placed.
 */
import type { Block } from './arena.js';
import { ENCOUNTER, TEMPLATES, BACK_ROLES, type Role, type Template } from './encounters.js';
import type { Job } from './jobs.js';
import { Rng } from './rng.js';
import type { Foe, FoeVariant } from './terrain.js';
import { ROOF } from './raiders.js';
import { CROWS } from './prowlers.js';

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

/** The templates a band may be, given the room and what's left of its cap. */
function fits(c: Compose, left: number, used: Set<string>, first: boolean): Template[] {
  const kind = c.job.place.kind, ruin = c.job.place.ruin, roofs = roofsIn(c.blocks).length > 0;
  return TEMPLATES.filter((t) => (!t.places || t.places.includes(kind)) && c.index >= (t.from ?? 0) && ruin >= (t.ruin ?? 0) && (!t.roofs || roofs) &&
    cost(t) <= left && (!used.has(t.id) || t.id === 'swarm' || t.id === 'brute' || t.id === 'cave') && (!first || ENCOUNTER.first.includes(t.id)));
}

function pick(rng: Rng, ts: Template[]): Template {
  let r = rng.next() * ts.reduce((s, t) => s + t.weight, 0);
  for (const t of ts) if ((r -= t.weight) < 0) return t;
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
export function lay(c: Compose, band: Foe[], t: Template, id: number, rng: Rng, roofs: Block[]): Foe[] {
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
  const want = t.fodder[0] + rng.int(t.fodder[1] - t.fodder[0] + 1);
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
  const bandsOf = bands(c.foes.filter(plain), c.spawn, ENCOUNTER.fights[at]);
  const roofs = rng.shuffle(roofsIn(c.blocks).sort((a, b) => a.x - b.x || a.y - b.y)), used = new Set<string>(), chose: Template[] = [];
  bandsOf.forEach((band, i) => {
    let ts = fits(c, Math.max(0, left), used, c.index === 0 && i === 0);
    if (!roofs.length) ts = ts.filter((t) => !t.roofs);
    const t = ts.length ? pick(rng, ts) : TEMPLATES[0];
    used.add(t.id), chose.push(t);
    const keepers = new Set(lay(c, band, t, i + 1, rng, roofs));
    for (const f of band) if (!keepers.has(f)) c.foes.splice(c.foes.indexOf(f), 1);
    for (const f of keepers) if (!c.foes.includes(f)) c.foes.push(f);
    left -= cost(t);
  });
  return chose;
}

/** Carrion crows on the dead out in the open (never down a mine): a flock on a room's dead, now and then. */
export function crowsOn(job: Job, index: number, dead: P[]): P[] {
  if (job.place.kind === 'mine' || !dead.length) return [];
  const rng = new Rng(job.seed * 61 + index * 17 + 3);
  return rng.next() < CROWS.chance ? [{ x: dead[0].x, y: dead[0].y - 0.2 }] : [];
}
