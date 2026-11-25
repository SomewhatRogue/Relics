/**
 * Raiding parties on a roaming land (Kyle, 2026-11-25: "patrols of goblins every now and then, like raiding parties etc,
 * to keep tension high sometimes"; tuning shared/raidtune.ts RAID). Held by the room, on its own stream (`raidRng`).
 * - Now and then (RAID.first, then RAID.every after each), a party of the land's kinds forms on its roads out of sight of
 *   every hero and clear of the shelters and the camp (sim/raidform.ts), and every friend hears it (`raid` event).
 * - It marches the roads (sim/raidroads.ts) in a loose column for the nearest hero not on safe ground, picking again
 *   every RAID.aim. Its goblins never doze while it marches (sim/sleep.ts reads `raid`).
 * - One sees a hero (the usual noticing) and the whole party fights as one pack (pack ids RAID.pack0 up, so no bounty
 *   counts them; pack rushes treat it as any pack). Given up on a hero in a shelter's ring (sim/landrules.ts guard), it
 *   goes back to marching, away.
 * - Nobody met in RAID.life, or nobody to come for: it marches for the road's far end and is gone once out of every
 *   hero's sight (RAID.gone). They drop as goblins drop; ones that leave drop nothing.
 */
import { RAID } from '../shared/raidtune';
import type { Rng } from '../shared/rng';
import { isDead } from './damage';
import { walk } from './enemies';
import { inStation } from './landrules';
import { players } from './party';
import { formAt, open, raider, roadsOf, roster } from './raidform';
import { nearestPt, route, type Roads } from './raidroads';
import type { ArenaRoom } from './room';
import type { Enemy, FightEvent } from './types';

type P = { x: number; y: number };
/** `way`: the road it is on, `i` the next point of it; `crumbs`: where its head has been (the column walks them). */
export interface Raid { pack: number; ids: number[]; t0: number; way: P[]; i: number; aimAt: number; hero: string; crumbs: P[]; fight?: boolean; leave?: boolean }
/** `due`: when the next forms (room time); `n`: how many have formed (the next pack id). */
export interface Raids { due?: number; n: number; live: Raid[] }
export const newRaids = (): Raids => ({ n: 0, live: [] });

const far = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
/** Heroes a party comes for: standing, not on a shelter's safe ground. */
const prey = (room: ArenaRoom) => players(room.heroes).filter((h) => h.act !== 'down' && !h.out && !inStation(room.map.stations, h));

/** Once a tick on a roaming land, after everyone has moved. */
export function stepRaids(room: ArenaRoom, s: Raids, rng: Rng, ev: FightEvent[], dt: number): void {
  const r = roadsOf(room.map), now = room.time;
  if (!r || !RAID.rosters[room.map.name] || !players(room.heroes).length) return;
  s.due ??= now + rng.range(RAID.first[0], RAID.first[1]);
  const byId = new Map([...room.allEnemies, ...room.enemies].map((e) => [e.id, e]));
  s.live = s.live.filter((q) => keep(room, q, r, byId, now, dt));
  // A mark left from a raid this room doesn't hold (a room handed on) is dropped: they're plain goblins now.
  const held = new Set(s.live.map((q) => q.pack));
  for (const e of room.enemies) if (e.raid !== undefined && !held.has(e.raid)) delete e.raid;
  if (now < s.due) return;
  s.due = now + (form(room, s, r, rng, now, ev) ? rng.range(RAID.every[0], RAID.every[1]) : RAID.retry);
}

/** Make the next party form at the next tick of roaming room `room` (tests, the look script). */
export const raidNow = (room: { raids?: Raids }) => void ((room.raids ??= newRaids()).due = -1);

/** A party out of sight on the road, for one hero it can come for; false if none could form. */
function form(room: ArenaRoom, s: Raids, r: Roads, rng: Rng, now: number, ev: FightEvent[]): boolean {
  const hs = prey(room);
  if (!hs.length) return false;
  const h = hs[rng.int(hs.length)], at = formAt(room.map, r, h, players(room.heroes), rng);
  if (at < 0) return false;
  const roles = roster(room.map, rng);
  if (!roles.length) return false;
  const way = route(r, at, nearestPt(r, h, r.part[at])), p = r.pts[at], nx = way[1] ?? h;
  // The column laid back along the road behind its head, loosely.
  const l = far(p, nx) || 1, bx = (p.x - nx.x) / l, by = (p.y - nx.y) / l, pack = RAID.pack0 + s.n++;
  const foes = roles.map((role, k) => {
    const side = k % 2 ? 0.4 : -0.4, x = p.x + bx * k * RAID.gap - by * side * (k ? 1 : 0), y = p.y + by * k * RAID.gap + bx * side * (k ? 1 : 0);
    return open(room.map, x, y) ? raider(role, x, y, pack) : raider(role, p.x + k * 0.01, p.y, pack);
  });
  const ids = room.wake(foes);
  for (const e of room.enemies) if (ids.includes(e.id)) Object.assign(e, { raid: pack, alert: false, fx: -bx, fy: -by, home: { x: e.x, y: e.y } });
  s.live.push({ pack, ids, t0: now, way, i: 1, aimAt: now + RAID.aim, hero: h.id, crumbs: [] });
  ev.push({ k: 'raid', x: p.x, y: p.y });
  return true;
}

/** A raid's tick; false once it's over (all its goblins dead or gone). */
function keep(room: ArenaRoom, q: Raid, r: Roads, byId: Map<number, Enemy>, now: number, dt: number): boolean {
  const mine = q.ids.map((id) => byId.get(id)).filter((e): e is Enemy => !!e && !isDead(e));
  if (!mine.length) return false;
  // Seen: the whole party fights, as one pack.
  if (!q.fight && mine.some((e) => e.alert === true)) {
    q.fight = true;
    for (const e of mine) if (e.alert === false) e.alert = true;
  }
  if (q.fight) {
    // It gave up (a hero on safe ground) and is home: back on the road, and away.
    if (!mine.every((e) => e.alert === false && !e.homing)) return true;
    Object.assign(q, { fight: false, leave: true, aimAt: now, crumbs: [] });
  }
  if (!q.leave && now - q.t0 >= RAID.life) Object.assign(q, { leave: true, aimAt: now });
  if (now >= q.aimAt) aim(room, q, r, mine[0], now);
  const ps = players(room.heroes);
  if (q.leave) for (const e of mine) if (ps.every((h) => far(h, e) >= RAID.gone)) gone(e);
  const left = mine.filter((e) => !isDead(e));
  if (left.length) march(q, left, dt);
  return left.length > 0;
}

/** Its hero and its way again: along the road to the nearest it can come for, or, leaving, to the road's far end. */
function aim(room: ArenaRoom, q: Raid, r: Roads, lead: Enemy, now: number): void {
  q.aimAt = now + RAID.aim;
  const from = nearestPt(r, lead), c = r.part[from];
  const h = q.leave ? undefined : prey(room).sort((a, b) => far(a, lead) - far(b, lead) || a.id.localeCompare(b.id))[0];
  if (!q.leave && !h) q.leave = true;
  if (h) {
    q.hero = h.id;
    q.way = [...route(r, from, nearestPt(r, h, c)), { x: h.x, y: h.y }];
  } else {
    // The end of the road farthest from every hero, one at the map's edge if it can.
    const m = room.map, ps = players(room.heroes), mine = r.ends.filter((i) => r.part[i] === c);
    const edge = mine.filter((i) => { const p = r.pts[i]; return p.x < 5 || p.y < 5 || p.x > m.w - 5 || p.y > m.h - 5; });
    const pool = edge.length ? edge : mine.length ? mine : [from];
    const score = (i: number) => Math.min(...ps.map((o) => far(o, r.pts[i])));
    q.way = route(r, from, pool.reduce((b, i) => (score(i) > score(b) ? i : b), pool[0]));
  }
  q.i = q.way.length > 1 && far(lead, q.way[1]) < far(q.way[0], q.way[1]) ? 1 : 0;
}

/** The head walks the road; the rest walk where it has been, a gap apart. */
function march(q: Raid, mine: Enemy[], dt: number): void {
  const lead = mine[0];
  while (q.i < q.way.length && far(lead, q.way[q.i]) < 0.9) q.i++;
  if (q.i < q.way.length) go(lead, q.way[q.i], RAID.speed, dt);
  else lead.home = { x: lead.x, y: lead.y };
  const c = q.crumbs, last = c[c.length - 1];
  if (!last || far(last, lead) >= 0.5) c.push({ x: lead.x, y: lead.y }), c.length > 40 && c.shift();
  mine.slice(1).forEach((e, k) => {
    const t = c[Math.max(0, c.length - 1 - Math.round(((k + 1) * RAID.gap) / 0.5))], to = { x: t.x + (k % 2 ? 0.35 : -0.35), y: t.y };
    const d = far(e, to);
    if (d > 0.3) go(e, to, RAID.speed * (d > 2 ? 1.3 : 1), dt);
    else e.home = { x: e.x, y: e.y };
  });
}

function go(e: Enemy, to: P, k: number, dt: number): void {
  const dx = to.x - e.x, dy = to.y - e.y, l = Math.hypot(dx, dy) || 1;
  (e.fx = dx / l), (e.fy = dy / l);
  walk(e, dx, dy, k, dt);
  e.home = { x: e.x, y: e.y };
}

/** Off out of sight: gone, and drops nothing. */
function gone(e: Enemy): void {
  Object.assign(e, { act: 'dead', actT: 99, hp: 0, attack: null, escaped: true, respawns: false, death: '' });
  delete e.raid;
}

