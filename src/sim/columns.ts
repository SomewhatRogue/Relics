/**
 * THE LISTENER's dripstone columns, once a tick (docs/design/deep-layer-bosses.md section 1; numbers
 * shared/listentune.ts `column`; the lane sim/columnshape.ts). A standing column hit by anything that counts as
 * hitting a prop (a blow, a shot, a spell, a thing thrown at it: sim/props.ts damageProp) is set falling the way
 * it leans. `column.fall` s on it lands: a hero in the lane is hit (a striped boss blow, as the Haulier's cart),
 * a goblin takes `addDmg` and is flung, and THE LISTENER is knocked down `down` s with its plate cracked (as a
 * cart on the Haulier: not again for `again` s, it shrugs). A fallen column is rubble and can't be hit again.
 */
import { LISTENER as L } from '../shared/tuning';
import { downIfDead, hitHero } from './combat';
import { damage, isDead } from './damage';
import { crack } from './ironhide';
import { bossStun } from './poise';
import { falling, heroInLane, inColumnLane, columnLane } from './columnshape';
import type { World } from './elements';
import type { Enemy, EnemyAttack, Hero, Prop } from './types';

const standing = (p: Prop) => p.kind === 'column' && !p.fallen && p.fallAt === undefined;
const up = (h: Hero) => h.act !== 'down' && !h.out && h.id !== 'squire';

/** A hit on a standing column: it begins to fall the way it leans (`lean`, from the cave's spot). */
export function hitColumn(p: Prop, w: World): void {
  if (!standing(p)) return;
  const l = p.lean ?? { x: 0, y: 1 }, n = Math.hypot(l.x, l.y) || 1;
  p.lean = { x: l.x / n, y: l.y / n };
  p.fallAt = w.now + L.column.fall;
  w.ev.push({ k: 'column', what: 'start', x: p.x, y: p.y, dx: p.lean.x, dy: p.lean.y, by: p.lastBy || undefined });
}

/** THE LISTENER flat on its back for column.down s, its plate cracked; but not again for column.again s. */
function knockDown(e: Enemy, p: Prop, now: number, ev: World['ev']): boolean {
  const b = e.boss!;
  if ((e.holdUntil ?? -9) > now) return void ev.push({ k: 'shrug', x: e.x, y: e.y }, { k: 'column', what: 'shrug', x: e.x, y: e.y, dx: p.lean!.x, dy: p.lean!.y }), false;
  e.holdUntil = now + L.column.down + L.column.again;
  crack(e, now, ev);
  bossStun(e, L.column.down);
  Object.assign(b, { downUntil: now + L.column.down, rotAt: now + L.column.down });
  return true;
}

/** Columns once a tick: a thrown thing that strikes one sets it falling; any whose time is up lands. */
export function stepColumns(e: Enemy, w: World): void {
  const now = w.now;
  for (const p of w.props) {
    if (!standing(p)) continue;
    // (A prop in the air that reaches it: the thrower's hit.)
    const t = w.props.find((q) => q !== p && q.kind !== 'column' && !q.broken && (q.air ?? 0) > 0 && Math.hypot(q.x - p.x, q.y - p.y) <= q.radius + p.radius);
    if (t) {
      p.lastBy = t.lastBy;
      hitColumn(p, w);
      t.kvx *= 0.3;
      t.kvy *= 0.3;
      t.air = 0;
    }
  }
  for (const p of w.props) if (falling(p) && now >= p.fallAt!) land(p, e, w);
}

function land(p: Prop, e: Enemy, w: World): void {
  const now = w.now, a = columnLane(p);
  Object.assign(p, { fallen: true, fallAt: undefined });
  let down = false;
  for (const h of w.heroes) {
    if (!up(h) || (h.z ?? 0) !== 0 || !heroInLane(p, h)) continue;
    const blow: EnemyAttack = {
      kind: 'charge', aimed: h.id, t: 0, windup: 0, active: 0.2, recover: 0, dmg: Math.round(L.column.dmg * (e.harm ?? 1)), knock: L.column.knock, unblockable: true,
      dx: a.dx, dy: a.dy, ox: a.ox, oy: a.oy, range: 0, arc: 0, cx: h.x, cy: h.y, radius: 0.01, done: true,
    };
    hitHero(e, blow, h, now, w.ev, w.heroes);
    downIfDead(h, w.ev);
  }
  for (const g of w.enemies) {
    if (isDead(g) || g.act === 'carried' || !inColumnLane(p, g.x, g.y, g.radius)) continue;
    if (g.boss?.who === 'listener') {
      if (!g.boss.under) down = knockDown(g, p, now, w.ev);
      continue;
    }
    if (g.boss) continue;
    if (p.lastBy) g.lastBy = p.lastBy;
    Object.assign(g, { kvx: a.dx * 12, kvy: a.dy * 12 });
    damage(g, L.column.addDmg, now, w.ev, { heavy: true, how: 'burst', dx: a.dx, dy: a.dy });
  }
  w.ev.push({ k: 'column', what: 'land', x: p.x + a.dx * a.len * 0.5, y: p.y + a.dy * a.len * 0.5, dx: a.dx, dy: a.dy, down });
}
