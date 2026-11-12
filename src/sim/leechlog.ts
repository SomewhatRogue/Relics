/**
 * THE LEECHMAN's phase 2 water (docs/design/deep-layer-bosses.md section 2; numbers shared/leechtune.ts `flood`, `log`):
 * - the water rises (`riseWater`): every deep channel grows, so the dry and shallow ground shrinks;
 * - a hero across a deep channel from it: it walks to the channel's near end (`crossing`, asked by sim/leechman.ts) and
 *   lays a LOG across (a 'log' prop to hit and a `gangway` deck over the water, as the Staithe's: shared/arena.ts `spanned`,
 *   which heroes and it cross on). One at a time;
 * - a hero's blow on the log (sim/props.ts damageProp -> `hitLog`) knocks it into the water. THE LEECHMAN on it goes in too
 *   (the hungry don't swim): down `down` s (stunned, as the Listener's columns: `holdUntil`, not again for `again` s, when it
 *   shrugs), then it hauls itself out at the nearest shallows (`out` event).
 * The notes are the book's own (a WeakMap), never sent; the events carry what the screen shows.
 */
import { collide, currentMap, inArea, inShallows, type Block, type Water } from '../shared/arena';
import { LEECHMAN as L } from '../shared/tuning';
import { newProp } from './props';
import { bossStun } from './poise';
import { isDead } from './damage';
import { theBook, type BossBook } from './bosskit';
import type { World } from './elements';
import type { Enemy, FightEvent, Prop } from './types';

const G = L.log;
export interface Rect { x: number; y: number; w: number; h: number }
export interface Cross { ch: Water; spot: { x: number; y: number }; log: Rect; near: number }
export interface LogState {
  log: { prop: Prop; block: Block } | null;
  /** Where it has got to and wants a log laid (set by sim/leechman.ts), the earliest the next log may go down, and a fall's floundering. */
  want: Cross | null;
  layAt: number;
  flounder: { until: number; out: { x: number; y: number } } | null;
}

const states = new WeakMap<BossBook, LogState>();
export function logState(bk: BossBook): LogState {
  let s = states.get(bk);
  if (!s) states.set(bk, (s = { log: null, want: null, layAt: -9, flounder: null }));
  return s;
}

/** The water rises: each deep channel grows (kept in the room). */
export function riseWater(ev: FightEvent[]): void {
  const m = currentMap(), F = L.flood;
  for (const w of m.water ?? []) {
    if (!w.deep) continue;
    const vert = w.h >= w.w, gx = vert ? F.grow : F.ends, gy = vert ? F.ends : F.grow;
    const x = Math.max(0, w.x - gx), y = Math.max(0, w.y - gy);
    Object.assign(w, { x, y, w: Math.min(m.w, w.x + w.w + gx) - x, h: Math.min(m.h, w.y + w.h + gy) - y });
  }
  ev.push({ k: 'flood', x: m.w / 2, y: m.h / 2, deep: (m.water ?? []).filter((w) => w.deep).map((w) => ({ x: w.x, y: w.y, w: w.w, h: w.h })) });
}

/** The deep channel that `from` and `to` stand either side of (the straight way between them goes through its body, side to side), and where a log would lie. */
export function crossing(from: { x: number; y: number }, to: { x: number; y: number }): Cross | null {
  for (const ch of currentMap().water ?? []) {
    if (!ch.deep || !ch.span) continue;
    const across = ch.w <= ch.h, a0 = across ? ch.x : ch.y, aw = across ? ch.w : ch.h, c0 = across ? ch.y : ch.x, cw = across ? ch.h : ch.w;
    const fa = across ? from.x : from.y, fc = across ? from.y : from.x, ta = across ? to.x : to.y, tc = across ? to.y : to.x;
    if (!((fa < a0 && ta > a0 + aw) || (ta < a0 && fa > a0 + aw))) continue;
    const at = (a: number) => fc + ((tc - fc) * (a - fa)) / (ta - fa), c1 = at(a0), c2 = at(a0 + aw);
    if (c1 < c0 || c1 > c0 + cw || c2 < c0 || c2 > c0 + cw) continue;
    const half = G.thick / 2, c = Math.max(c0 + half, Math.min(c0 + cw - half, at(a0 + aw / 2))), sa = fa < a0 ? a0 - G.over * 0.5 : a0 + aw + G.over * 0.5;
    const spot = across ? { x: sa, y: c } : { x: c, y: sa };
    const log = across ? { x: a0 - G.over, y: c - half, w: aw + 2 * G.over, h: G.thick } : { x: c - half, y: a0 - G.over, w: G.thick, h: aw + 2 * G.over };
    return { ch, spot, log, near: Math.hypot(from.x - spot.x, from.y - spot.y) };
  }
  return null;
}

/** Whether it may be looking to lay one now (none down, and the last one's rest is over). */
export const mayLay = (bk: BossBook, now: number) => { const s = logState(bk); return !s.log && now >= s.layAt; };

/** The logs once a tick: one wanted is laid; a fall's floundering ends with it hauled out. */
export function stepLogs(bk: BossBook, e: Enemy, w: World): void {
  const st = logState(bk), now = w.now, b = e.boss!;
  if (st.flounder && now >= st.flounder.until) {
    const o = st.flounder.out;
    Object.assign(e, { x: o.x, y: o.y, kvx: 0, kvy: 0 });
    w.ev.push({ k: 'log', what: 'out', x: o.x, y: o.y, w: 0, h: 0 });
    st.flounder = null;
  }
  const c = st.want;
  st.want = null;
  if (!c || !b.flood || !mayLay(bk, now) || b.stagUntil > now || b.downUntil > now || e.attack) return;
  const m = currentMap(), r = c.log, block: Block = { kind: 'gangway', ...r, deck: true, soft: true, hp: 9999 };
  const prop = newProp('log', r.x + r.w / 2, r.y + r.h / 2, false);
  m.blocks.push(block);
  w.props.push(prop);
  st.log = { prop, block };
  e.cooldown = Math.max(e.cooldown, G.lay);
  b.rotAt = Math.max(b.rotAt, now + G.lay);
  w.ev.push({ k: 'log', what: 'lay', x: prop.x, y: prop.y, w: r.w, h: r.h });
}

/** Nearest ground outside the channels that it can stand on, as shallow as there is (by `from`). */
function haulOut(from: { x: number; y: number }, r: number): { x: number; y: number } {
  const m = currentMap(), deep = (m.water ?? []).filter((q) => q.deep), spots: { x: number; y: number }[] = [];
  const ch = deep.find((q) => inArea(q, from.x, from.y)) ?? deep[0];
  if (ch) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const x = dx < 0 ? ch.x - r - 0.1 : dx > 0 ? ch.x + ch.w + r + 0.1 : from.x, y = dy < 0 ? ch.y - r - 0.1 : dy > 0 ? ch.y + ch.h + r + 0.1 : from.y, q = { x, y };
    collide(q, r);
    if (Math.hypot(q.x - x, q.y - y) < 0.05 && !deep.some((d) => inArea(d, q.x, q.y))) spots.push(q);
  }
  spots.sort((a, b) => Number(!inShallows(a.x, a.y)) - Number(!inShallows(b.x, b.y)) || Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y));
  return spots[0] ?? { x: from.x, y: from.y };
}

/** A hero's blow on the log (sim/props.ts damageProp): it goes into the water, and THE LEECHMAN on it with it. */
export function hitLog(p: Prop, w: World): void {
  const bk = theBook(), now = w.now;
  if (!bk) return;
  const st = logState(bk);
  if (!st.log || st.log.prop !== p) return;
  const { block } = st.log, m = currentMap(), e = w.enemies.find((x) => x.boss?.who === 'leechman');
  m.blocks = m.blocks.filter((x) => x !== block);
  Object.assign(p, { broken: true });
  Object.assign(st, { log: null, layAt: now + G.relay });
  const on = !!e && !isDead(e) && inArea(block, e.x, e.y), by = p.lastBy || undefined;
  w.ev.push({ k: 'log', what: 'fall', x: p.x, y: p.y, w: block.w, h: block.h, down: on, by });
  if (!on || !e) return;
  const b = e.boss!, out = haulOut(e, e.radius);
  if ((e.holdUntil ?? -9) > now) {
    // It has just been through this: it scrambles out, not floored again.
    Object.assign(e, { x: out.x, y: out.y });
    return void w.ev.push({ k: 'shrug', x: e.x, y: e.y }, { k: 'log', what: 'shrug', x: e.x, y: e.y, w: 0, h: 0 });
  }
  e.holdUntil = now + G.down + G.again;
  bossStun(e, G.down);
  Object.assign(b, { downUntil: now + G.down, rotAt: now + G.down });
  st.flounder = { until: now + G.down, out };
}
