/**
 * THE LAMPMAN (docs/design/open-cut-arc.md, under the hill: the lamp room). It keeps the dark: the miners' lamps on
 * their posts round the room (`map.lamps`) are all lit when you come in, and it puts them out.
 * - Roused, every LAMP.every s it goes for the lit lamp nearest the nearest hero and, stood at it, snuffs it in
 *   LAMP.snuff s, its blows dropped meanwhile (an opening). It gives up on one it can't reach in LAMP.give s.
 * - Where no lamp lights it (LAMP.r), its blows do LAMP.dark times the harm.
 * - GRAB by a dark lamp (the button reads BURN) lights it again; lit with the Lampman in its light, it's dazzled:
 *   stunned LAMP.dazzle s and OPEN (INSTANCE.open).
 * Plain data on the goblin (`lamps`), so a friend's screen and a handed-on room have which are lit; who pressed
 * GRAB last and its harm before the dark are kept here only.
 */
import { currentMap } from '../shared/arena';
import { INSTANCE, LAMP, TICK } from '../shared/tuning';
import { isDead } from './damage';
import type { World } from './elements';
import { players } from './party';
import { stun } from './stuns';
import { goTo } from './tasks';
import type { Enemy, Hero } from './types';

const seen = new WeakMap<Enemy, Map<string, number>>();
const back = new WeakMap<Enemy, { x: number; y: number }>();
const harm = new WeakMap<Enemy, number>();
const up = (h: Hero) => h.act !== 'down' && !h.out;

/** The lamps lit now (all, where there's no Lampman about to say). */
export function lampsLit(enemies: Enemy[], n: number): boolean[] {
  return enemies.find((e) => e.lamps)?.lamps?.lit ?? Array(n).fill(true);
}
/** Is (x, y) in a lit lamp's light? */
export const inLight = (lamps: { x: number; y: number }[], lit: boolean[], x: number, y: number) => lamps.some((l, i) => lit[i] && Math.hypot(l.x - x, l.y - y) <= LAMP.r);
/** The dark lamp hero `h` stands by, if any (GRAB lights it). */
export function darkLampBy(h: Hero, enemies: Enemy[]): number {
  const L = currentMap().lamps ?? [], lit = lampsLit(enemies, L.length);
  return L.findIndex((l, i) => !lit[i] && Math.hypot(l.x - h.x, l.y - h.y) <= LAMP.burn);
}

export function stepLampman(w: World): void {
  const L = currentMap().lamps;
  if (!L?.length) return;
  const e = w.enemies.find((x) => x.lamps);
  if (!e) return;
  const st = e.lamps!, now = w.now, alive = !isDead(e);
  if (st.lit.length !== L.length) st.lit = L.map(() => true);
  // GRAB pressed by a dark lamp: lit again; the Lampman in its light, dazzled.
  let m = seen.get(e);
  if (!m) seen.set(e, (m = new Map()));
  for (const h of players(w.heroes)) {
    const prev = m.get(h.id);
    m.set(h.id, h.seen.grab);
    if (prev === undefined || prev === h.seen.grab || !up(h)) continue;
    const i = darkLampBy(h, w.enemies);
    if (i < 0) continue;
    st.lit[i] = true;
    w.ev.push({ k: 'lamp', what: 'lit', x: L[i].x, y: L[i].y, by: h.id });
    h.grabQueuedAt = -9;
    if (alive && Math.hypot(e.x - L[i].x, e.y - L[i].y) <= LAMP.r) {
      Object.assign(st, { at: undefined, snuffT: undefined });
      Object.assign(e, { takes: INSTANCE.open.mult, openUntil: now + INSTANCE.open.time, lastBy: h.id });
      stun(e, h.id, now, LAMP.dazzle, w.ev, 'stunned', true, true);
      w.ev.push({ k: 'opened', x: e.x, y: e.y });
    }
  }
  if (!alive) return;
  // In the dark it hits harder.
  if (!harm.has(e)) harm.set(e, e.harm ?? 1);
  e.harm = +(harm.get(e)! * (inLight(L, st.lit, e.x, e.y) ? 1 : LAMP.dark)).toFixed(3);
  if (!e.alert || e.act === 'stunned' || e.act === 'dead') return void back.delete(e);
  if (st.next <= 0) st.next = now + LAMP.first;
  // Time to put one out: the lit lamp nearest the nearest hero.
  if (st.at === undefined && now >= st.next && st.lit.some(Boolean)) {
    const h = w.heroes.filter(up).sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0];
    if (h) {
      const i = L.map((l, n) => [n, Math.hypot(l.x - h.x, l.y - h.y)] as const).filter(([n]) => st.lit[n]).sort((a, b) => a[1] - b[1])[0][0];
      Object.assign(st, { at: i, since: now, snuffT: undefined });
    }
  }
  if (st.at === undefined) return void back.delete(e);
  const l = L[st.at];
  if (!st.lit[st.at] || now - (st.since ?? now) > LAMP.give) {
    Object.assign(st, { at: undefined, snuffT: undefined, next: now + LAMP.every });
    return void back.delete(e);
  }
  // Going for it (its own chase this tick undone, or it rocks between you and the lamp); its blows dropped.
  const was = back.get(e);
  if (was) Object.assign(e, { x: was.x, y: was.y });
  Object.assign(e, { attack: null, act: 'chase' });
  if (Math.hypot(l.x - e.x, l.y - e.y) > LAMP.reach) {
    goTo(e, l.x, l.y, LAMP.walk, TICK);
    back.set(e, { x: e.x, y: e.y });
    return;
  }
  back.set(e, { x: e.x, y: e.y });
  if (st.snuffT === undefined) (st.snuffT = 0), w.ev.push({ k: 'lamp', what: 'snuff', x: l.x, y: l.y });
  st.snuffT += TICK;
  if (st.snuffT < LAMP.snuff) return;
  st.lit[st.at] = false;
  w.ev.push({ k: 'lamp', what: 'out', x: l.x, y: l.y });
  // The first few: how to stop it, said over it.
  if ((st.told ?? 0) < LAMP.told) (st.told = (st.told ?? 0) + 1), w.ev.push({ k: 'lamp', what: 'how', x: e.x, y: e.y });
  Object.assign(st, { at: undefined, snuffT: undefined, next: now + LAMP.every });
  back.delete(e);
}
