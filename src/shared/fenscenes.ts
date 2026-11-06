/**
 * Fenmere's scenes, each in its fixed place (shared/fen.ts SPINE), each a few seconds of story or a fight
 * that suits the ground it's on: two dragging somebody through the stile; goblins asleep among the
 * coppice's stools; webs and a nest in the carr; a shield line shutting the causeway with an archer behind
 * it and a skimmer out on its islet pouring oil on the causeway's edge; a gaffer and its brute on the far
 * side of the ford, so the hook hauls you out of the water; cages on the island; goblins lying in the reeds
 * (sim/lurk.ts); the larder on the Peat Cuts' drying ground; the named butcher among the cuts with gaffers
 * on the baulks; a chained chest out on the bog. Then the rest of the fen's goblins in knots on the dry ground.
 *
 * The new sorts bleed in here as anywhere (shared/debut.ts): a Planker on the causeway, a Pouncer in the
 * reeds, a Forker on the boards, each only once it's common on the board. Rolled on the map's own stream.
 */
import { cast } from './encounter.js';
import { claim, mark, prop, round, type Kit, type Line, type P } from './expedkit.js';
import { PACK0 } from './expedpacks.js';
import { groundAt, LAND } from './fenland.js';
import type { Job } from './jobs.js';
import { jobDay, stageOf, type Debut } from './debut.js';
import { FEN } from './fentune.js';
import { FORKER, MEATY_ON, PLANKER } from './meaty.js';
import { MEATY2_ON, POUNCER } from './meaty2.js';
import { affixPool } from './elites.js';
import type { Role } from './encounters.js';
import type { Foe } from './terrain.js';
import type { SPINE } from './fen.js';

type Spine = typeof SPINE;
let pack = PACK0;
const add = (k: Kit, f: Foe) => k.foes.push(f) - 1;
/** Ground a body can stand on (dry or shallow), with a hand's room round it. */
export const footing = (x: number, y: number, r = 0.45) => [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].every(([dx, dy]) => groundAt(x + dx, y + dy) !== 2);
/** A new sort, once it's common on the board (and switched on). */
const common = (job: Job, d: Debut, on: boolean) => on && stageOf(d, jobDay(job)) === 'common';

/** `n` goblins round `at` on good footing (`wet`: in the shallows), one pack. */
function band(k: Kit, at: P, n: number, d0: number, d1: number, more: Partial<Foe> = {}, id = pack++, wet = false): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) for (let t = 0; t < 24; t++) {
    const a = k.rng.range(0, Math.PI * 2), d = k.rng.range(d0, d1), x = at.x + Math.cos(a) * d, y = at.y + Math.sin(a) * d * 0.8;
    if ((!footing(x, y) || (wet && groundAt(x, y) !== 1)) && t < 23) continue;
    out.push(add(k, { kind: 'scrapper', x, y, pack: id, role: 'fodder', ...more }));
    break;
  }
  return out;
}
const one = (k: Kit, x: number, y: number, role: Role, id: number, more: Partial<Foe> = {}) => add(k, Object.assign(cast({ kind: 'scrapper', x, y, pack: id }, role), more));

export interface Laid { cages: P[]; butcher: number; pot: P; chest: number }

export function layScenes(k: Kit, S: Spine, job: Job): Laid {
  pack = PACK0;
  const rng = k.rng;
  // 1. The stile: two dragging somebody through it to their fire in the coppice, the drag mark behind them.
  const e = S.edge, fire = { x: S.coppice.x - 1.4, y: S.coppice.y + 1.4 }, hp = pack++;
  for (const s of [0, 1]) add(k, { kind: 'scrapper', x: e.x + 0.6 + s * 0.8, y: e.y - 0.2 + s * 0.3, pack: hp, role: 'fodder', task: { k: 'haul', to: [fire.x + 1, fire.y] }, ...(s === 0 ? { haul: { x: e.x + 1.5, y: e.y + 0.1 } } : {}) });
  mark(k, 'drag', e.x + 1.4, e.y - 0.2, 4, 0.5);
  // 2. The coppice: asleep round their fire among the cut stools.
  k.braziers.push({ x: fire.x, y: fire.y, r: 0.35, wild: true }), claim(k, fire.x, fire.y, 0.8);
  for (const i of band(k, fire, 3 + rng.int(2), 1.1, 2, { feeding: true })) k.sleepers.push({ x: k.foes[i].x, y: k.foes[i].y });
  // 3. The carr: a nest among the willows, its spiders out.
  const c = S.carr, nest = { x: c.x - 8.6, y: c.y + 1 };
  add(k, { kind: 'nest', x: nest.x, y: nest.y, wave: 3 }), claim(k, nest.x, nest.y, 1.2);
  for (const s of [-1, 1]) add(k, { kind: 'spider', x: nest.x + s * 1.3, y: nest.y - 0.8 });
  mark(k, 'debris', nest.x - 1.2, nest.y + 0.4, 2.4, 0.8);
  // 4. The causeway shut with shields, an archer behind them; a Planker in the line once it's common.
  const cw = S.causeway, wp = pack++, cy = (LAND.causeway[1] + LAND.causeway[3]) / 2;
  if (common(job, PLANKER.debut, MEATY_ON.on)) one(k, cw.x + 2.2, cy, 'planker', wp);
  else for (const s of [-0.6, 0.6]) one(k, cw.x + 2.2, cy + s, 'shield', wp);
  one(k, cw.x + 5, cy - 0.3, 'archer', wp), band(k, { x: cw.x + 3.6, y: cy }, 2, 0.3, 0.8, {}, wp);
  // The skimmer out on its islet, pouring on the causeway's north edge (the short boards reach it).
  const il = LAND.islet, post = { x: (il[0] + il[2]) / 2 + 0.6, y: (il[1] + il[3]) / 2 - 0.3 };
  add(k, { kind: 'scrapper', variant: 'skimmer', x: post.x, y: post.y, pack: wp + 0, task: { k: 'pour', x: cw.x - 3.2, y: LAND.causeway[1] - 0.2 } });
  prop(k, 'oil', post.x - 1.4, post.y + 0.4);
  // 5. The ford: a gaffer and its brute on the far side, in the reeds at the water.
  const fd = S.ford, fp = pack++;
  one(k, fd.x - 0.8, fd.y - 4.6, 'heavy', fp, rng.next() < 0.5 ? { elite: [rng.pick(affixPool('heavy'))] } : {});
  add(k, { kind: 'scrapper', variant: 'gaffer', x: fd.x + 0.6, y: fd.y - 4.2, pack: fp });
  band(k, { x: fd.x - 1, y: fd.y - 5.6 }, 2, 0.4, 1.2, {}, fp);
  // 6. The island: three cages in a row, the guards round them, a netter.
  const is = S.island, cages: P[] = [], ip = pack++;
  for (let i = 0; i < 3; i++) {
    const x = is.x - 1.8 + i * 1.8, y = is.y - 0.6;
    prop(k, 'cage', x, y), cages.push({ x, y });
  }
  mark(k, 'blood', is.x - 0.6, is.y + 0.2, 1.4, 0.6);
  one(k, is.x + 2.4, is.y + 0.6, 'netter', ip), band(k, { x: is.x, y: is.y + 0.8 }, 2, 0.8, 1.6, {}, ip);
  // 7. The reeds: three knots lying in the water either side of both ways through, risen as one.
  for (const at of [{ x: 44.6, y: 28.8 }, { x: 35.4, y: 27 }, { x: 41.4, y: 23 }, { x: 25, y: 27.8 }]) {
    const lp = pack++, lurk = { task: { k: 'lurk' as const } }, n = 2 + rng.int(2);
    const ids = band(k, at, n, 0.4, 1.6, lurk, lp, true);
    const f = k.foes[ids[0]], r = rng.next();
    if (common(job, POUNCER.debut, MEATY2_ON.on) && r < 0.3) Object.assign(cast(f, 'pouncer'), lurk);
    else if (r < 0.55) Object.assign(cast(f, 'lunger'), lurk);
    else if (r < 0.75) Object.assign(cast(f, 'netter'), lurk);
  }
  round(k, 'post', 31.6, 29.2, 0.16);
  // 8. The Peat Cuts: the larder on the drying ground, racks hung with what they keep, the pot on its fire.
  const ct = S.cuts, pot = { x: ct.x + 1, y: ct.y + 0.4 };
  k.braziers.push({ x: pot.x, y: pot.y - 0.2, r: 0.35, wild: true }), k.grim.push({ kind: 'pot', x: pot.x, y: pot.y - 0.1, k: rng.int(4) });
  for (let i = 0; i < 3; i++) prop(k, 'larder', pot.x - 3 + i * 1.8, pot.y - 2.2);
  k.grim.push({ kind: 'hung', x: pot.x + 2.6, y: pot.y - 2, k: rng.int(4) });
  claim(k, pot.x, pot.y, 2.4);
  const lp = pack++;
  band(k, { x: pot.x + 1.5, y: pot.y + 1.2 }, 3, 0.8, 2, { feeding: true }, lp);
  // A Forker on the boards over the first cut, once it's common.
  if (common(job, FORKER.debut, MEATY_ON.on)) one(k, LAND.cutsDeep[0][0] + 1.5, 9.1, 'forker', pack++);
  // 9. The butcher's ground: the named one on the north strip, a brute by it, gaffers out on two baulks, its band.
  const bt = S.butcher, bp = pack++;
  const butcher = add(k, { kind: 'butcher', x: bt.x, y: bt.y, hp: FEN.butcher, name: job.boss, zoned: true, pack: bp });
  one(k, bt.x + 2.2, bt.y + 0.2, 'heavy', bp);
  for (const x of [61.1, 67.1]) add(k, { kind: 'scrapper', variant: 'gaffer', x, y: 5.4, pack: bp });
  band(k, { x: bt.x - 1.6, y: bt.y }, 3, 0.6, 1.6, {}, bp);
  // 10. The chest out on the bog: a dead man by it, three dozing over it.
  const cs = S.chest;
  k.chests.push({ x: cs.x, y: cs.y, chained: true });
  k.dead.push({ x: cs.x + 1.1, y: cs.y + 0.6, name: '', talk: 'dead', look: 'villager', pose: 'corpse' });
  claim(k, cs.x, cs.y, 1.4);
  for (const i of band(k, { x: cs.x - 0.6, y: cs.y - 1.4 }, 3, 0.6, 1.4, { feeding: true })) k.sleepers.push({ x: k.foes[i].x, y: k.foes[i].y });
  return { cages, butcher, pot, chest: k.chests.length - 1 };
}

/** The rest in knots on the trail's dry ground: never near the way in, the scenes or each other. */
export function layKnots(k: Kit, trail: Line, S: Spine): void {
  const rng = k.rng, scenes = Object.values(S);
  for (let t = 0; t < 900 && k.foes.length < FEN.goblins; t++) {
    const seg = 1 + rng.int(trail.length - 1), a = trail[seg - 1], b = trail[seg], u = rng.next();
    const at = { x: a.x + (b.x - a.x) * u + rng.range(-0.6, 0.6), y: a.y + (b.y - a.y) * u + rng.range(-0.6, 0.6) };
    if (Math.hypot(at.x - S.in.x, at.y - S.in.y) < 13 || scenes.some((s) => Math.hypot(s.x - at.x, s.y - at.y) < 3.5) || groundAt(at.x, at.y) !== 0) continue;
    if (k.foes.some((f) => Math.hypot(f.x - at.x, f.y - at.y) < 4)) continue;
    const ids = band(k, at, 2 + rng.int(3), 0.3, 1.2, rng.next() < 0.3 ? { feeding: true } : {});
    const f = k.foes[ids[0]], r = rng.next();
    if (r < 0.14) cast(f, 'lunger');
    else if (r < 0.26) cast(f, 'shield');
    else if (r < 0.34) cast(f, 'heavy');
    else if (r < 0.42) cast(f, 'archer');
    for (const i of ids) if (k.foes[i].feeding) k.sleepers.push({ x: k.foes[i].x, y: k.foes[i].y });
  }
}
