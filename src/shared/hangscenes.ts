/**
 * Hangman's Wood's scenes, each in its fixed place on the spine (shared/hangwood.ts), each a few seconds
 * of story or a small fight, mid-way as you come up to it: the snarer kneeling at the last of its snare
 * line; a body by the waymark with the crows at it and a dropper in the branches over him; at the gibbet
 * crossroads two of them at the winch, winding someone up into the iron cage, the rest at their fire; a
 * pair dragging a sack of charcoal up the path; the brood mother in the Gospel Oak's hollow; a dropper over
 * the path by Hew's marks; and Hempen's ground, its hanging tree with the stock under it, Hempen with two
 * snarers and its band. Then the rest of the wood's goblins in knots along the trails.
 */
import { claim, free, mark, offLine, prop, round, type Kit, type Line, type P } from './expedkit.js';
import { PACK0 } from './expedpacks.js';
import type { Job } from './jobs.js';
import { HANGWOOD, HEMPEN, OAK } from './tuning.js';
import type { Foe } from './terrain.js';
import type { SPINE } from './hangwood.js';

type Spine = typeof SPINE;
let pack = PACK0;
const add = (k: Kit, f: Foe) => k.foes.push(f) - 1;
/** A small fight: `n` goblins round `at`, one pack (a party scales it: sim/packs.ts). */
function band(k: Kit, at: P, n: number, d0: number, d1: number, more: Partial<Foe> = {}): number[] {
  const out: number[] = [], id = pack++;
  for (let i = 0; i < n; i++) for (let t = 0; t < 20; t++) {
    const a = k.rng.range(0, Math.PI * 2), d = k.rng.range(d0, d1), x = at.x + Math.cos(a) * d, y = at.y + Math.sin(a) * d * 0.85;
    if (!free(k, x, y, 0.35, 0) && t < 19) continue;
    out.push(add(k, { kind: 'scrapper', x, y, pack: id, role: 'fodder', ...more }));
    break;
  }
  return out;
}

export interface Laid { winch: P; cage: P; oak: number; hempen: number; brood: number; snares: P[]; flocks: P[] }

export function layScenes(k: Kit, S: Spine, job: Job): Laid {
  pack = PACK0;
  const rng = k.rng, flocks: P[] = [];
  // 1. The snare line: the snarer kneeling at the last of it, two more resting by; three snares laid across the path behind it.
  const sn = S.snares, snares = [{ x: sn.x - 2.6, y: sn.y + 1.5 }, { x: sn.x - 1.2, y: sn.y + 0.6 }, { x: sn.x + 0.2, y: sn.y - 0.2 }];
  const sp = pack;
  add(k, { kind: 'scrapper', variant: 'snarer', role: 'snarer', pack: sp, x: sn.x + 1.6, y: sn.y - 0.9, task: { k: 'busy', x: sn.x + 2.4, y: sn.y - 1.3, what: 'snare' } });
  band(k, { x: sn.x + 2.2, y: sn.y - 2.4 }, 2, 0.6, 1.4, { feeding: true });
  // 2. The body by the waymark: a stone with its arrow cut, a man the crows have had, and a dropper in the branches over him.
  const cr = S.crows;
  round(k, 'waymark', cr.x - 1.6, cr.y - 1.2, 0.3);
  k.dead.push({ x: cr.x - 0.6, y: cr.y - 0.3, name: '', talk: 'dead', look: 'villager', pose: 'corpse' });
  mark(k, 'blood', cr.x - 1.2, cr.y - 0.4, 1.4, 0.6);
  flocks.push({ x: cr.x - 0.5, y: cr.y });
  add(k, { kind: 'scrapper', x: cr.x + 0.5, y: cr.y - 1.4, z: 1, pack: pack++, role: 'fodder', task: { k: 'perch' } });
  // 3. The gibbet crossroads: the post and its arm, the cage hanging under it with someone alive in it; two at the
  //    winch winding it up, the rest at their fire; blood under the cage.
  const gb = S.gibbet, cage = { x: gb.x + 1.2, y: gb.y - 1.4 }, winch = { x: gb.x - 0.9, y: gb.y - 0.2 };
  round(k, 'gibbet', gb.x, gb.y - 1.4, 0.32);
  mark(k, 'blood', cage.x - 0.6, cage.y + 0.2, 1.2, 0.6);
  const gp = pack++;
  for (const s of [-1, 1]) add(k, { kind: 'scrapper', x: winch.x + s * 0.7, y: winch.y + 0.5, pack: gp, role: 'fodder', task: { k: 'busy', x: winch.x, y: winch.y, what: 'winch' } });
  const fire = { x: gb.x + 3.4, y: gb.y + 2.2 };
  k.braziers.push({ x: fire.x, y: fire.y, r: 0.35, wild: true });
  claim(k, fire.x, fire.y, 0.6);
  band(k, fire, 3 + rng.int(2), 1, 1.8, { feeding: true });
  // 4. The pair dragging a sack of charcoal up the path to the fork.
  const sk = S.sack, to: [number, number] = [S.fork.x, S.fork.y];
  const hp = pack++;
  for (const s of [0, 1]) add(k, { kind: 'scrapper', x: sk.x + s * 0.8, y: sk.y - 0.2 - s * 0.3, pack: hp, role: 'fodder', task: { k: 'haul', to }, ...(s === 0 ? { haul: { x: sk.x - 0.9, y: sk.y + 0.1, sack: true } } : {}) });
  mark(k, 'drag', sk.x - 3, sk.y, 2.4, 0.4);
  // 5. The Gospel Oak: the old boundary oak, hollow, ribbons on it from the last time the valley walked its bounds;
  //    the brood mother in the hollow and her nest beside it.
  const ok = S.oak, oak = k.blocks.push({ kind: 'oak', x: ok.x - 1.2, y: ok.y - 0.9, w: 2.4, h: 1.6, hp: OAK.hp, maxHp: OAK.hp, burning: -1 }) - 1;
  const brood = add(k, { kind: 'brood', x: ok.x, y: ok.y + 1.25, feeding: true });
  add(k, { kind: 'nest', x: ok.x + 2.6, y: ok.y + 1.8, wave: 3 });
  // The hungry's lamp oil by the path up to it: anyone can put fire into the hollow (smash it there, or throw it).
  prop(k, 'oil', ok.x - 2.2, ok.y + 3.4);
  // 6. A dropper over the path by Hew's marks.
  add(k, { kind: 'scrapper', x: S.blaze.x - 1.2, y: S.blaze.y + 1.6, z: 1, pack: pack++, role: 'fodder', task: { k: 'perch' } });
  // 7. Hempen's ground: the hanging tree and its stock, Hempen, two snarers and a band; a dropper over the way in to it.
  const hm = S.hempen, tree = { x: hm.x - 3.4, y: hm.y - 2.6 };
  round(k, 'hangtree', tree.x, tree.y, 0.45);
  k.grim.push({ kind: 'hung', x: tree.x + 0.75, y: tree.y + 0.05, k: rng.int(4) }, { kind: 'hung', x: tree.x + 1.35, y: tree.y + 0.1, k: 1 + rng.int(4) });
  mark(k, 'blood', tree.x + 0.3, tree.y + 0.15, 1.6, 0.7);
  flocks.push({ x: tree.x + 1.1, y: tree.y + 0.8 });
  const bp = pack++;
  const hempen = add(k, { kind: 'butcher', x: hm.x + 0.6, y: hm.y - 0.4, hp: HEMPEN.hp, name: 'HEMPEN', noose: true, sure: true, pack: bp });
  for (const s of [-1, 1]) add(k, { kind: 'scrapper', variant: 'snarer', role: 'snarer', pack: bp, x: hm.x + s * 3, y: hm.y - 2.2 });
  band(k, hm, 3 + rng.int(2), 1.6, 3.2).forEach((i) => (k.foes[i].pack = bp));
  add(k, { kind: 'scrapper', x: hm.x - 4.5, y: hm.y + 3.6, z: 1, pack: pack++, role: 'fodder', task: { k: 'perch' } });
  // A chest or two off the path for whoever goes looking (which, by the seed).
  for (const at of rng.shuffle([{ x: cr.x + 1.8, y: cr.y + 1.6 }, { x: ok.x - 2.6, y: ok.y + 2.4 }, { x: S.check.x + 2, y: S.check.y - 2 }, { x: gb.x - 4.2, y: gb.y + 2.6 }]).slice(0, 1 + rng.int(2))) k.chests.push(at);
  prop(k, 'oil', gb.x + 4.6, gb.y + 1.2);
  return { winch, cage, oak, hempen, brood, snares, flocks };
}

/** The rest in knots along the trails: never near the way in, the scenes' own ground or each other. */
export function layKnots(k: Kit, main: Line, side: Line, S: Spine): void {
  const rng = k.rng, scenes = Object.values(S);
  for (let t = 0; t < 900 && k.foes.length < HANGWOOD.goblins; t++) {
    const l = rng.next() < 0.8 ? main : side, seg = 1 + rng.int(l.length - 1), a = l[seg - 1], b = l[seg], u = rng.next();
    const at = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    if (Math.hypot(at.x - S.in.x, at.y - S.in.y) < 12 || scenes.some((s) => Math.hypot(s.x - at.x, s.y - at.y) < 3) || offLine(l, at.x, at.y) > 1) continue;
    if (k.foes.some((f) => Math.hypot(f.x - at.x, f.y - at.y) < 3.4)) continue;
    const ids = band(k, at, 2 + rng.int(3), 0.3, 1.2, rng.next() < 0.3 ? { feeding: true } : {});
    // One in three knots has something more than small ones in it.
    const f = k.foes[ids[0]], r = rng.next();
    if (r < 0.12) Object.assign(f, { variant: 'lunger', role: 'lunger' });
    else if (r < 0.24) Object.assign(f, { variant: 'shield', role: 'shield' });
    else if (r < 0.33) Object.assign(f, { variant: 'heavy', role: 'heavy' });
    for (const i of ids) if (k.foes[i].feeding) k.sleepers.push({ x: k.foes[i].x, y: k.foes[i].y });
  }
}
