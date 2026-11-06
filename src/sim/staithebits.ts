/**
 * The Staithe's pieces as rules (sim/staithe.ts has the log and the hold): what its goblins are busy at
 * when you come in (the carriers at their log, the gaffer at the jetty's end, goblins going over the laid
 * log), GRAB at the bank (CUT FREE one of the netted, or SHOVE the log in), the hung nets that catch a
 * foot, the smokehouse alight (it smokes STAITHE.smoke seconds, the cries real, and whoever's left in it
 * when it falls in is lost), a jetty burnt through (everyone on it thrown to the bank), and the big map's
 * playing out (ALARM 3: the smokehouse catches; ALARM 5: they're lost). Rolls nothing.
 */
import { inArea, type GameMap } from '../shared/arena';
import { GAFFER, SCENE, SCRAPPER, STAITHE } from '../shared/tuning';
import { isDead, kill } from './damage';
import type { World } from './elements';
import type { Smoke } from './flasks';
import { players } from './party';
import { wayTo } from './pathing';
import { walk } from './enemies';
import { isNetted, jettyOf, logOf, lose, onJetty, smokehouseOf } from './staithe';
import type { Enemy, FightEvent, Hero, Survivor } from './types';

const pulledOff = (e: Enemy, heroes: Hero[], now: number) => now - e.hitAt < 0.3 || players(heroes).some((h) => h.act !== 'down' && Math.hypot(h.x - e.x, h.y - e.y) < SCENE.stay);

/** A Staithe goblin's task (sim/tasks.ts hands these over): true while it's busy at it. */
export function staitheTask(e: Enemy, heroes: Hero[], survivors: Survivor[], map: GameMap, now: number, dt: number, ev: FightEvent[]): boolean {
  const t = e.task!;
  if (t.k === 'lay' || t.k === 'gaff') {
    if (t.quit) return false;
    if (pulledOff(e, heroes, now)) return (t.quit = true), (e.alert = true), false;
    if (t.k === 'lay') return (e.fx = t.dx), (e.fy = t.dy), (e.moving = false), true;
    // The gaffer: its hook out over the water at whoever's nearest the jetty's end, and into a net on the bank.
    if (now >= t.next) {
      t.next = now + GAFFER.gaff;
      const st = map.staithe, s = survivors.filter(onJetty).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
      if (st && s) {
        const at = st.netted[0] ?? [e.x, e.y], n = survivors.filter((q) => q.netted).length;
        ev.push({ k: 'gaffed', x: e.x, y: e.y, x2: s.x, y2: s.y });
        Object.assign(s, { stay: false, netted: true, x: at[0] + st.down[0] * 0.7 * n, y: at[1] + st.down[1] * 0.7 * n, at: now });
        const l = Math.hypot(s.x - e.x, s.y - e.y) || 1;
        (e.fx = (s.x - e.x) / l), (e.fy = (s.y - e.y) / l);
      }
    }
    return true;
  }
  if (t.k !== 'board') return false;
  // Over the log and onto the jetty (sim/staithe.ts takes the folk); a hero close by and it fights instead.
  const j = jettyOf(map);
  if (!j || j.ruined || !survivors.some(onJetty) || pulledOff(e, heroes, now)) return (e.task = undefined), (e.alert = true), false;
  const x = j.x + j.w / 2, y = j.y + j.h / 2;
  if (inArea(j, e.x, e.y) && Math.hypot(x - e.x, y - e.y) < 1) return (e.moving = false), true;
  const g = wayTo(e, x, y), gx = g.x - e.x, gy = g.y - e.y, gl = Math.hypot(gx, gy) || 1;
  (e.fx = gx / gl), (e.fy = gy / gl);
  walk(e, gx, gy, SCRAPPER.speed * 0.7, dt);
  return true;
}

/** GRAB by one of the netted: cut them free (they stand, then follow like anyone freed). */
export function cutNetted(h: Hero, survivors: Survivor[], now: number, ev: FightEvent[]): boolean {
  const s = survivors.filter(isNetted).sort((a, b) => Math.hypot(a.x - h.x, a.y - h.y) - Math.hypot(b.x - h.x, b.y - h.y))[0];
  if (!s || Math.hypot(s.x - h.x, s.y - h.y) > STAITHE.cut) return false;
  Object.assign(s, { netted: false, at: now });
  ev.push({ k: 'cutfree', x: s.x, y: s.y, id: '', by: h.id });
  return true;
}

/** Where the laid log meets the near bank. */
export function logEnd(map: GameMap): { x: number; y: number } | null {
  const g = logOf(map), st = map.staithe;
  if (!g || !st) return null;
  return { x: g.x + g.w / 2 - st.across[0] * (g.w / 2 - 0.2), y: g.y + g.h / 2 - st.across[1] * (g.h / 2 - 0.2) };
}

/** GRAB at the laid log's bank end: shove it into the river (anyone on it goes in, or back to the bank). */
export function shoveLog(h: Hero, w: World, map: GameMap): boolean {
  const g = logOf(map), end = logEnd(map), j = jettyOf(map);
  if (!g?.deck || g.ruined || !end || Math.hypot(end.x - h.x, end.y - h.y) > STAITHE.shoveReach) return false;
  Object.assign(g, { deck: false, ruined: true });
  w.ev.push({ k: 'logshoved', x: g.x + g.w / 2, y: g.y + g.h / 2 });
  // Goblins on it go in with it; a hero on it lands back on the bank.
  for (const e of w.enemies) if (!isDead(e) && inArea(g, e.x, e.y) && !(j && inArea(j, e.x, e.y))) kill(e, w.ev, 'fall');
  for (const o of w.heroes) if (o !== h && inArea(g, o.x, o.y)) Object.assign(o, { x: end.x, y: end.y });
  return true;
}

/** The hung nets: walk into one and it catches you a moment (a hero struggles as in a netter's net; a goblin is held). */
export function stepHungNets(w: World, map: GameMap): void {
  const now = w.now;
  for (const b of map.blocks) {
    if (b.kind !== 'hungnet' || b.ruined) continue;
    const a = { x: b.x - 0.15, y: b.y - 0.15, w: b.w + 0.3, h: b.h + 0.3 };
    for (const h of w.heroes) {
      if (h.act === 'down' || h.act === 'roll' || h.out || (h.z ?? 0) !== 0 || now - (h.snagAt ?? -99) < STAITHE.snag + STAITHE.snagAgain || !inArea(a, h.x, h.y)) continue;
      Object.assign(h, { snagAt: now, netUntil: now + STAITHE.snag, netAng: undefined, act: 'stun', actT: 0, actDur: STAITHE.snag, kvx: 0, kvy: 0 });
      w.ev.push({ k: 'snagged', x: h.x, y: h.y });
    }
    for (const e of w.enemies) {
      if (isDead(e) || e.act === 'carried' || now - (e.snagAt ?? -99) < STAITHE.snag + STAITHE.snagAgain || !inArea(a, e.x, e.y)) continue;
      Object.assign(e, { snagAt: now, attack: null, act: 'stunned', actT: 0, actDur: STAITHE.snag, kvx: 0, kvy: 0 });
      w.ev.push({ k: 'snagged', x: e.x, y: e.y });
    }
  }
}

/**
 * The smokehouse and the jetty as they burn: the smokehouse alight smokes (one of the room's smokes, so
 * goblins can't see through it) and the one inside cries out till they're pulled out of its door (sim/scenes.ts)
 * or it falls in on them; a jetty burnt through throws everyone on it to the bank.
 */
export function stepStaitheFire(w: World, map: GameMap, smokes: Smoke[]): void {
  const st = map.staithe, h = smokehouseOf(map), j = jettyOf(map), now = w.now, ev = w.ev;
  if (!st) return;
  if (h) {
    const inside = (h.held ?? 0) - (h.pulled ?? 0);
    if (h.cry !== (inside > 0 && !h.ruined)) h.cry = inside > 0 && !h.ruined;
    const alight = (h.burning ?? -1) >= 0 && !h.ruined, x = h.x + h.w / 2, y = h.y + h.h / 2;
    if (alight && !smokes.some((s) => s.x === x && s.y === y)) {
      smokes.push({ x, y, until: h.burning! + STAITHE.smoke, r: STAITHE.smokeR });
      ev.push({ k: 'smokehouse', x, y });
    }
    if (h.ruined && inside > 0) {
      h.pulled = h.held;
      for (let i = 0; i < inside; i++) ev.push({ k: 'cagelost', x, y });
      if (j) j.lost = (j.lost ?? 0) + inside;
    }
  }
  if (j?.ruined && !j.thrown) {
    // Burnt through: whoever's on it into the shallows at the bank, hurt and winded; the folk on it too.
    j.thrown = true;
    const land = (i: number) => ({ x: st.ring.x + st.down[0] * ((i % 3) - 1) * 0.7, y: st.ring.y + st.down[1] * ((i % 3) - 1) * 0.7 });
    let i = 0;
    for (const o of w.heroes) if (o.act !== 'down' && inArea(j, o.x, o.y)) {
      Object.assign(o, land(i++), { act: 'stun', actT: 0, actDur: STAITHE.thrownStun, kvx: 0, kvy: 0, hp: Math.max(1, o.hp - STAITHE.thrown) });
      ev.push({ k: 'thrown', x: o.x, y: o.y });
    }
    for (const e of w.enemies) if (!isDead(e) && inArea(j, e.x, e.y)) kill(e, ev, 'fall');
    for (const s of w.survivors ?? []) if (onJetty(s)) Object.assign(s, land(i++), { stay: false, at: now }), ev.push({ k: 'thrown', x: s.x, y: s.y });
  }
}

/**
 * The big map: a Staithe nobody's come to plays out. At ALARM STAITHE.catchAt the smokehouse catches; at
 * STAITHE.lostAt everyone still on the jetty, in a net or shut in is lost, and it's over.
 */
export function playOut(w: World, map: GameMap, level: number): void {
  const h = smokehouseOf(map), j = jettyOf(map);
  if (!j || j.over) return;
  if (level >= STAITHE.catchAt && h && !h.ruined && (h.burning ?? -1) < 0) {
    Object.assign(h, { burning: w.now });
    w.ev.push({ k: 'houselit', x: h.x + h.w / 2, y: h.y + h.h, by: '' }, { k: 'blaze', x: h.x + h.w / 2, y: h.y + h.h / 2 });
  }
  if (level < STAITHE.lostAt) return;
  for (const s of w.survivors ?? []) if (onJetty(s) || isNetted(s)) lose(j, s, w.ev);
  if (h && (h.held ?? 0) > (h.pulled ?? 0)) {
    const n = h.held! - (h.pulled ?? 0);
    h.pulled = h.held;
    j.lost = (j.lost ?? 0) + n;
    for (let i = 0; i < n; i++) w.ev.push({ k: 'folklost', x: h.x + h.w / 2, y: h.y + h.h / 2 });
  }
  j.over = true;
}

/** What GRAB would do at the Staithe from where `h` stands (the button's word): cut one free, shove the log, or nothing. */
export function staitheGrabbable(h: Hero, survivors: Survivor[], map: GameMap): 'cut' | 'shove' | null {
  if (!map.staithe || h.act === 'down') return null;
  if (survivors.some((s) => isNetted(s) && Math.hypot(s.x - h.x, s.y - h.y) <= STAITHE.cut)) return 'cut';
  const g = logOf(map), end = logEnd(map);
  return g?.deck && !g.ruined && end && Math.hypot(end.x - h.x, end.y - h.y) <= STAITHE.shoveReach ? 'shove' : null;
}
