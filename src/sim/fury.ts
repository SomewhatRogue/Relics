/**
 * A fury boss (shared/fury.ts) is destructive: every blow it lands, and its charge as it runs, smashes the props
 * under it (crates, barrels, tables), as a hero's bash does, and fells any tree it reaches, as a Warrior's heavy does
 * (sim/felling.ts: the trunk goes over away from it, lands on whatever's under, and lies there). Stepped by the room
 * after the goblins.
 */
import { FURY, HIGH_GROWTH } from '../shared/tuning';
import { isDead } from './damage';
import { currentMap } from '../shared/arena';
import { fell, fellable } from './felling';
import { isRound } from './types';
import { damageProp, type PropWorld } from './props';
import type { Enemy, Prop } from './types';

const inArc = (e: Enemy, p: Prop, range: number, arc: number) => {
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  if (d > range + p.radius) return false;
  if (d < 1e-6 || arc >= 359) return true;
  return (dx * e.fx + dy * e.fy) / d >= Math.cos(((arc / 2) * Math.PI) / 180) - p.radius / Math.max(d, 0.5);
};

/** At a high level, a BIG ONE or a shield goblin grows and gets about more (shared/fury.ts HIGH_GROWTH). */
export function growOn(e: Enemy, lv: number): void {
  if (!(e.big || e.variant === 'shield') || e.name || e.boss) return;
  const n = Math.max(0, lv - HIGH_GROWTH.from), G = HIGH_GROWTH;
  if (!n) return;
  const k = Math.min(G.sizeMost, 1 + G.size * n);
  e.scale = +k.toFixed(3);
  e.radius = +(e.radius * k).toFixed(3);
  e.stride = +Math.min(G.paceMost, 1 + G.pace * n).toFixed(3);
}

/** Made a fury boss: tougher, harder-hitting, quicker to wind up and rest, broader (its pace: sim/enemies.ts). */
export function furyOn(e: Enemy): void {
  e.fury = true;
  e.hp = e.maxHp = Math.round(e.maxHp * FURY.hp);
  e.harm = +((e.harm ?? 1) * FURY.harm).toFixed(3);
  e.edge = { windup: (e.edge?.windup ?? 1) * FURY.windup, pause: (e.edge?.pause ?? 1) * FURY.pause };
  e.radius = +(e.radius * FURY.radius).toFixed(3);
}

/** A fury boss's landed blow or running charge: what it covers, smashed. Each prop once a blow. */
export function stepFury(enemies: Enemy[], props: Prop[], w: PropWorld): void {
  for (const e of enemies) {
    const a = e.attack;
    if (!e.fury || isDead(e) || !a || a.t < a.windup) continue;
    const running = a.kind === 'charge' || a.kind === 'pounce';
    if (!running && a.t > a.windup + a.active + 0.05) continue;
    const smashed = (a.smashed ??= []);
    for (const p of props) {
      if (p.broken || p.lifted || smashed.includes(p.id)) continue;
      const hit = running ? Math.hypot(p.x - e.x, p.y - e.y) <= e.radius + p.radius + 0.3
        : isRound(a.kind) ? Math.hypot(p.x - a.cx, p.y - a.cy) <= a.radius + p.radius
        : inArc(e, p, a.range, a.arc);
      if (!hit) continue;
      smashed.push(p.id);
      damageProp(p, FURY.propDmg, w, p.x - e.x, p.y - e.y);
    }
    // Trees: one a blow, felled away from it.
    if (a.felled) continue;
    const m = currentMap();
    for (let i = 0; i < m.rounds.length; i++) {
      const t = m.rounds[i];
      if (!fellable(t)) continue;
      const near = running ? Math.hypot(t.x - e.x, t.y - e.y) <= e.radius + t.r + 0.3
        : isRound(a.kind) ? Math.hypot(t.x - a.cx, t.y - a.cy) <= a.radius + t.r
        : inArc(e, { x: t.x, y: t.y, radius: t.r } as Prop, a.range, a.arc);
      if (near && fell(m, i, t.x - e.x, t.y - e.y, w.now, w.ev)) {
        a.felled = true;
        break;
      }
    }
  }
}
