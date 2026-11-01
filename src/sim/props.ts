/**
 * Props: barrels, an oil barrel, crates, a table and the pieces they break into. They're bodies:
 * blows, blasts and flying goblins push and break them, and a strong hero can lift one overhead,
 * slam it down or throw it. A thrown prop hits like its weight; big ones break on what they hit.
 */
import { collide } from '../shared/arena';
import { GRAB, KNOCK, PROP, PROPS, ROOM_PROPS, STRONG, WEAPONS, type PropKind, type Swing } from '../shared/tuning';
import { shove, slide } from './bodies';
import { inArc } from './combat';
import { damage, isDead } from './damage';
import { afflict, type World } from './elements';
import type { Enemy, FightEvent, Hero, Intent, Prop } from './types';

let nextId = 1;

export function newProp(kind: PropKind, x: number, y: number, home = true): Prop {
  const s = PROPS[kind];
  return {
    id: nextId++, kind, x, y, kvx: 0, kvy: 0, hp: s.hp, radius: s.radius, weight: s.weight, lifted: false, lastBy: '', hitAt: -9,
    broken: false, respawnAt: -1, home: home ? { x, y } : null, fadeAt: Infinity, spin: 0,
  };
}

export const roomProps = () => ROOM_PROPS.map((p) => newProp(p.kind, p.x, p.y));

/** Everything a prop can reach. */
export type PropWorld = World;

export function damageProp(p: Prop, n: number, w: PropWorld, dx = 0, dy = 0): void {
  if (p.broken) return;
  p.hp -= n;
  p.hitAt = w.now;
  if (p.hp <= 0) breakProp(p, w, dx, dy);
}

function breakProp(p: Prop, w: PropWorld, dx: number, dy: number): void {
  const spec = PROPS[p.kind];
  Object.assign(p, { broken: true, lifted: false, kvx: 0, kvy: 0, respawnAt: p.home ? w.now + PROP.respawn : -1 });
  w.ev.push({ k: 'propbreak', x: p.x, y: p.y, kind: p.kind, dx, dy });
  if (spec.pieces) for (let i = 0; i < spec.pieces.n; i++) {
    const a = (i / spec.pieces.n) * Math.PI * 2 + 0.6, q = newProp(spec.pieces.kind, p.x + Math.cos(a) * 0.3, p.y + Math.sin(a) * 0.3, false);
    Object.assign(q, { kvx: Math.cos(a) * 5 + dx * 4, kvy: Math.sin(a) * 5 + dy * 4, fadeAt: w.now + PROP.pieceLife, lastBy: p.lastBy });
    collide(q, q.radius);
    w.props.push(q);
  }
  if (p.kind === 'oil') {
    // The oil goes up: everything near is set burning.
    w.ev.push({ k: 'oilfire', x: p.x, y: p.y });
    for (const e of w.enemies) {
      if (isDead(e) || Math.hypot(e.x - p.x, e.y - p.y) > PROP.oilRadius + e.radius) continue;
      if (!damage(e, 6, w.now, w.ev, { how: 'burn' })) afflict(w, e, 'fire', 6);
    }
  }
}

/** Slide, crack on walls, come back (big ones), fade (pieces). Returns the props still in the room. */
export function stepProps(w: PropWorld, dt: number): Prop[] {
  for (const p of w.props) {
    if (p.broken) {
      if (p.home && w.now >= p.respawnAt) Object.assign(p, { broken: false, hp: PROPS[p.kind].hp, x: p.home.x, y: p.home.y, kvx: 0, kvy: 0 });
      continue;
    }
    if (p.lifted) continue;
    if (w.now >= p.fadeAt) p.broken = true;
    const speed = Math.hypot(p.kvx, p.kvy);
    p.spin += speed * dt * 1.5;
    const slam = slide(p, p.radius, dt);
    if (slam) damageProp(p, Math.round(slam * 2.5), w, -p.kvx, -p.kvy);
  }
  return w.props.filter((p) => !(p.broken && !p.home));
}

/** A melee swing's active frames: props in its arc are hit once per swing (their ids go in negative). */
export function sweepProps(h: Hero, s: Swing, w: PropWorld): void {
  for (const p of w.props) {
    if (p.broken || p.lifted || h.hitIds.includes(-p.id)) continue;
    if (!inArc(h.x, h.y, h.fx, h.fy, p.x, p.y, s.range, s.arc, p.radius)) continue;
    h.hitIds.push(-p.id);
    p.lastBy = h.id;
    shove(p, h.fx, h.fy, s.knock, p.weight);
    damageProp(p, s.dmg, w, h.fx, h.fy);
  }
}

/** A blast at (x, y): props within reach are hit and thrown outward. */
export function blastProps(x: number, y: number, r: number, dmg: number, knock: number, w: PropWorld): void {
  for (const p of w.props) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (p.broken || p.lifted || d > r + p.radius) continue;
    shove(p, d > 0.05 ? (p.x - x) / d : 0, d > 0.05 ? (p.y - y) / d : -1, knock, p.weight);
    damageProp(p, dmg, w, (p.x - x) / (d || 1), (p.y - y) / (d || 1));
  }
}

/** A flying prop into a goblin (hits like its weight, big ones break), or a flying goblin into a prop. */
export function propImpacts(w: PropWorld): void {
  for (const p of w.props) {
    if (p.broken || p.lifted) continue;
    for (const e of w.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (isDead(e) || e.act === 'carried' || d > e.radius + p.radius + 0.05) continue;
      const nx = (e.x - p.x) / (d || 1), ny = (e.y - p.y) / (d || 1), rel = (p.kvx - e.kvx) * nx + (p.kvy - e.kvy) * ny;
      if (rel >= KNOCK.bodySpeed) {
        // The prop drives into the goblin.
        const sp = Math.hypot(p.kvx, p.kvy) || 1, n = Math.min(PROP.hitMax, Math.round(Math.max(rel, sp * 0.7) * PROP.hitPerSpeed * p.weight));
        w.ev.push({ k: 'bodyhit', x: (e.x + p.x) / 2, y: (e.y + p.y) / 2 });
        e.lastBy = p.lastBy;
        if (!damage(e, n, w.now, w.ev, { heavy: true, flinch: 0.7, how: 'burst', dx: p.kvx / sp, dy: p.kvy / sp }) && e.act !== 'pinned') {
          const k = Math.min(1.5, p.weight / e.weight) * 0.8;
          e.kvx += p.kvx * k;
          e.kvy += p.kvy * k;
        }
        p.kvx *= 0.3;
        p.kvy *= 0.3;
        p.air = 0;
        // Thrown hard, it breaks on whatever it hits, glancing or not.
        damageProp(p, sp >= 8 ? p.hp : Math.round(rel * 1.5), w, nx, ny);
      } else if (-rel >= KNOCK.bodySpeed) {
        // A goblin flung into the prop.
        const n = Math.min(KNOCK.bodyMax, Math.round(-rel * KNOCK.bodyDmg));
        w.ev.push({ k: 'bodyhit', x: (e.x + p.x) / 2, y: (e.y + p.y) / 2 });
        shove(p, -nx, -ny, -rel * e.weight * 0.6, p.weight);
        e.kvx *= 0.3;
        e.kvy *= 0.3;
        damage(e, n, w.now, w.ev, { heavy: true, flinch: 0.6, how: 'burst', dx: -nx, dy: -ny });
        damageProp(p, Math.round(-rel * 2), w, -nx, -ny);
      }
    }
  }
}

/** Can this hero lift this prop? Only strong classes, within reach. */
export const liftable = (h: Hero, p: Prop) =>
  STRONG.includes(WEAPONS[h.weapon].cls) && !p.broken && !p.lifted && Math.hypot(p.x - h.x, p.y - h.y) <= GRAB.reach + p.radius;

export function tryLift(h: Hero, props: Prop[], ev: FightEvent[]): boolean {
  let best: Prop | null = null, bd = Infinity;
  for (const p of props) {
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (d < bd && liftable(h, p)) (bd = d), (best = p);
  }
  if (!best) return false;
  Object.assign(best, { lifted: true, kvx: 0, kvy: 0, lastBy: h.id });
  Object.assign(h, { act: 'carry', actT: 0, lifting: best.id, grabQueuedAt: -9 });
  ev.push({ k: 'lift', x: best.x, y: best.y });
  return true;
}

/** Set the lifted prop down in front (dropped when hit or rolling). */
export function dropProp(h: Hero, props: Prop[]): void {
  const p = props.find((x) => x.id === h.lifting);
  h.lifting = 0;
  if (!p) return;
  p.lifted = false;
  p.x = h.x + h.fx * (p.radius + 0.5);
  p.y = h.y + h.fy * (p.radius + 0.5);
  collide(p, p.radius);
}

/** A hero holding a prop overhead: walk, ATTACK slams it down (it breaks on whatever is there), GRAB throws it. */
export function stepLift(h: Hero, inp: Intent, w: PropWorld, dt: number, walk: (k: number) => void): void {
  const p = w.props.find((x) => x.id === h.lifting);
  if (!p || p.broken) return void Object.assign(h, { act: 'idle', actT: 0, lifting: 0 });
  p.x = h.x;
  p.y = h.y;
  if (h.act === 'slam') {
    if (h.actT < GRAB.slamWindup || h.actT - dt >= GRAB.slamWindup) return;
    dropProp(h, w.props);
    w.ev.push({ k: 'slam', x: p.x, y: p.y });
    for (const e of w.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (isDead(e) || e.act === 'carried' || d > PROP.slamRadius + e.radius) continue;
      e.lastBy = h.id;
      if (!damage(e, PROP.slamDmg, w.now, w.ev, { heavy: true, flinch: 0.8, mult: true, how: 'burst', dx: h.fx, dy: h.fy })) shove(e, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1), 8, e.weight);
    }
    damageProp(p, p.hp, w, h.fx, h.fy);
    return;
  }
  walk(PROP.carrySpeed * (p.weight >= 3 ? 0.8 : 1));
  collide(h, 0.32);
  if (w.now - h.attackQueuedAt < 0.25) return void Object.assign(h, { act: 'slam', actT: 0, attackQueuedAt: -9 });
  if (w.now - h.grabQueuedAt < 0.25) {
    h.grabQueuedAt = -9;
    dropProp(h, w.props);
    Object.assign(p, { kvx: h.fx * PROP.throwSpeed, kvy: h.fy * PROP.throwSpeed, air: PROP.air, lastBy: h.id });
    Object.assign(h, { act: 'idle', actT: 0 });
    w.ev.push({ k: 'hurl', x: p.x, y: p.y });
  }
}

/** For the separation pass: props that are standing in the room. */
export const solidProps = (props: Prop[]) => props.filter((p) => !p.broken && !p.lifted);
export type { Enemy };
