/**
 * Who stands in the 2.5D view as a flat figure (figs3d.ts), each drawn by the very code the flat view
 * draws them with (scene.ts): heroes and their hounds, a Mage's blink image, other players in town,
 * goblins of every kind and the butcher and the Stoker (with what's on them, status.ts), spiders and
 * nests, someone caged waving through the bars and calling out, the freed, the map's people (Wickhold's folk, Hew, the dead), and the scenes past the wood's trees. Positions eased between
 * the room's ticks as everywhere else. Only draws.
 */
import { lurking } from '../../sim/lurk';
import { lurkFrame } from '../fenlurk';
import { pulledAt } from '../wave2ground';
import { ROOF_UP3 } from '../foedraw';
import type { ArenaRoom } from '../../sim/room';
import type { Hero, Hound } from '../../sim/types';
import { GRAB } from '../../shared/tuning';
import { npcAt } from '../../shared/arena';
import { SPOT_REACH } from '../../shared/town';
import { drawHero } from '../actors';
import { asleep, drawHeld } from '../foes';
import { drawFoe } from '../strawman';
import { drawWaiting, drawWatch, rackMen } from '../rackdraw';
import { HUNG3 } from './rack3d';
import { ARENA } from '../../shared/arena';
import { RACK } from '../../shared/practice';
import { waiting } from '../../sim/practice';
import { drawHound } from '../hound';
import { companion, houndAt, lodgeHoundAt } from '../idlehound';
import { LODGE_HOUND, MAEVE_HOUND, isLodgeMap } from '../petting';
import { runnerHound } from '../runner';
import { houndTag } from '../houndname';
import { seedOf } from '../houndidle';
import { drawNpc } from '../npcs';
import { vignetteFigs } from '../vignettes';
import { drawCaged, drawSurvivor } from '../captives';
import { drawHauled } from '../scenedraw';
import { propShake } from '../propshake';
import { drawStatus } from '../status';
import { blastShape } from '../../sim/blastshape';
import { drawBlastBits } from '../blastdraw';
import type { Lerp } from './actors3d';
import type { Figs } from './figs3d';
import { LEDGE_H } from './ground';
import { drawTally } from '../chalkdraw';
import { woodFigs } from '../wooddraw';
import { noteKneels } from '../kneel';
import { putStatue } from './statue3d';

const lift = (z?: number) => (z ?? 0) * LEDGE_H;

/** A hero's hound, where it plays if it's playing (idlehound.ts). */
function hound(f: Figs, h: Hero, d: Hound, ax: number, ay: number, hx: number, hy: number, me?: Hero): void {
  const a = houndAt(h, ax, ay, hx, hy, f.now), x = a ? a.x : ax, y = a ? a.y : ay;
  const o = { ...(a ? { mood: a.mood, fx: a.fx, down: a.down } : {}), look: h.houndLook, name: houndTag(h, d, x, y, me, !!a), seed: seedOf(h.id) };
  f.put('d' + h.id, x, 0, y, (c, px, py) => drawHound(c, d, px, py, o), { pool: d.state === 'fled' && d.t > 2 ? 0 : 0.28 });
}

/** Every figure this frame, onto its card. */
export function putCards(f: Figs, room: ArenaRoom, meId: string, others: Hero[], lerp: Lerp): void {
  const t = room.time, map = room.map, me = room.heroes.find((h) => h.id === meId);
  lurkFrame(room.heroes);
  // A Cleric raising a friend kneels by them (../kneel.ts).
  noteKneels(room.heroes, t);
  for (const h of room.heroes) {
    const [x, y] = lerp('h:' + h.id, h.x, h.y);
    f.put('h' + h.id, x, lift(h.z), y, (c, px, py) => drawHero(c, h, px, py, h.id === meId, t), { xray: true, pool: h.act === 'roll' || h.act === 'down' ? 0.22 : 0.3 });
    if (h.hound) {
      const d = h.hound, [dx, dy] = lerp('d:' + h.id, d.x, d.y);
      hound(f, h, d, dx, dy, x, y, me);
    }
    // A Mage's blink image, flickering where they stood until it goes.
    if (h.decoyUntil > t) f.put('v' + h.id, h.decoyX, 0, h.decoyY, (c, px, py) => {
      const a = (0.35 + Math.sin(t * 18) * 0.12) * Math.min(1, (h.decoyUntil - t) / 0.5);
      c.lit.globalAlpha = c.glow.globalAlpha = a;
      drawHero(c, { ...h, act: 'idle', actT: 0 }, px, py, false, t);
    });
  }
  for (const h of others) {
    f.put('o' + h.id, h.x, 0, h.y, (c, px, py) => drawHero(c, h, px, py, false, t), { pool: 0.3 });
    // Another player's Ranger: their hound at heel, as this screen walks it (idlehound.ts).
    const d = companion(h, f.now);
    if (d) hound(f, h, d, d.x, d.y, h.x, h.y, me);
  }
  // Maeve's hound running in with her note for a new Ranger (../runner.ts, the town quests chat).
  const rh = runnerHound();
  if (rh) f.put('runhound', rh.x, 0, rh.y, (c, px, py) => drawHound(c, rh.d, px, py, { mood: rh.moving ? { moving: true, gait: 'run' } : { sit: true, wag: true }, look: MAEVE_HOUND }), { pool: 0.28 });
  // Maeve's hound by the lodge's fire.
  if (isLodgeMap(map)) {
    const a = lodgeHoundAt(others.length ? [...room.heroes, ...others] : room.heroes, f.now);
    f.put('lodgehound', a.x, 0, a.y, (c, px, py) => drawHound(c, LODGE_HOUND, px, py, { mood: a.mood, fx: a.fx, down: a.down, look: MAEVE_HOUND }), { pool: 0.28 });
  }
  for (const e of room.enemies) {
    const carrier = room.heroes.find((h) => h.carrying === e.id);
    if (carrier) {
      // Held overhead by a hero: drawn with them, just in front.
      const [hx, hy] = lerp('h:' + carrier.id, carrier.x, carrier.y), slam = carrier.act === 'slam' ? Math.min(1, carrier.actT / GRAB.slamWindup) : 0;
      f.put('e' + e.id, hx, lift(carrier.z), hy, (c, px, py) => (drawHeld(c, e, px, py, carrier.fx, carrier.fy, slam), drawStatus(c, e, px, py - 20, t)), { bias: 0.05 });
      continue;
    }
    const pz = pulledAt(room, e), [x, y] = pz ?? lerp('e:' + e.id, e.x, e.y), dead = e.act === 'dead', big = e.kind === 'butcher' || e.kind === 'brood';
    f.put('e' + e.id, x, (e.z ?? 0) >= 2 ? ROOF_UP3 : lift(Math.max(0, e.z ?? 0)), y, (c, px, py) => (drawFoe(c, e, px, py, asleep(map, e), map === ARENA), drawStatus(c, e, px, py, t)), { pool: dead || e.kind === 'nest' || lurking(e) ? 0 : big ? 0.55 : 0.28, bias: dead ? -0.3 : 0 });
  }
  // A keg about to go, its fuse spitting; a Smouldering one's embers coming up through it (../blastdraw.ts).
  for (const e of room.enemies) {
    const a = blastShape(e, t);
    if (a && (e.blast!.k === 'ember' || (e.blast!.k === 'keg' && e.act === 'dead'))) f.put('bl' + e.id, a.cx, 0, a.cy, (c, px, py) => drawBlastBits(c, e, a, px, py), { pool: 0, bias: 0.05 });
  }
  // A body being hauled, where they've got it to (../scenedraw.ts).
  // A chalker's tally board in the CRIES room (../chalkdraw.ts).
  for (const e of room.enemies) if (e.task?.k === 'tally') { const k = e.task; f.put('tb' + e.id, k.x, 0, k.y, (c, px, py) => drawTally(c, k.n, px, py), { pool: 0 }); }
  for (const e of room.enemies) if (e.haul) f.put('b' + e.id, e.haul.x, 0, e.haul.y, (c, px, py) => drawHauled(c, e, px, py), { pool: 0, bias: -0.3 });
  // Someone caged: an arm waving out through the bars, and their call when you're close (scene.ts).
  for (const p of room.props) if (p.kind === 'cage' && !p.broken && !p.lifted) {
    const near = !!me && Math.hypot(me.x - p.x, me.y - p.y) < 7;
    f.put('c' + p.id, p.x + propShake(p, t)[0], 0, p.y + 0.05, (c, px, py) => drawCaged(c, px, py, t, near, p.id), { pool: 0 });
  }
  // The freed (the dead lie under everyone; the gone are gone).
  for (const s of room.survivors ?? []) {
    if (s.gone) continue;
    const [x, y] = lerp('s:' + s.id, s.x, s.y);
    f.put('s' + s.id, x, lift(s.z), y, (c, px, py) => drawSurvivor(c, s, px, py, t), { pool: s.dead ? 0 : 0.2, bias: s.dead ? -0.3 : 0 });
  }
  // Hangman's Wood: the cage on its chain, Hew's marks, the fire (../wooddraw.ts).
  for (const g of woodFigs(room, t)) f.put('hw' + g.key, g.x, 0, g.y, g.draw, { pool: 0 });
  // The scenes past the wood's trees (../vignettes.ts).
  for (const g of vignetteFigs(map, t, me)) f.put('w' + g.key, g.x, 0, g.y, g.draw, { pool: g.floor ? 0 : 0.28, bias: g.floor ? -0.3 : 0 });
  // The yard's straw men waiting on their rack (its poles: rack3d.ts), and the watch with their ropes.
  if (map === ARENA) {
    for (const m of rackMen(waiting(room))) f.put('rk' + m.i, m.x, m.hung ? HUNG3 : 0, m.y, (c, px, py) => drawWaiting(c.lit, px, py, false, m.i, t), { pool: 0 });
    RACK.watch.forEach((w, i) => f.put('rw' + i, w.x, 0, w.y, (c, px, py) => drawWatch(c, px, py, i, px + (i ? -14 : 14), py - 24, t), { pool: 0.3 }));
  }
  putStatue(f, map);
  (map.npcs ?? []).forEach((n, i) => {
    const at = npcAt(n, t), near = !!me && Math.hypot(me.x - at.x, me.y - at.y) <= SPOT_REACH;
    f.put('n' + i + n.name, at.x, 0, at.y, (c, px, py) => drawNpc(c, n, px, py, near && !n.mute, at.fx, !!n.path && !at.still, at.x), { pool: n.pose ? 0 : 0.3, bias: n.pose ? -0.3 : 0 });
  });
}
