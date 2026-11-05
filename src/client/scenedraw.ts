/**
 * Layout 4's scenes as each view draws them (the room decides them: sim/scenes.ts, tasks.ts): the body
 * two goblins are hauling, lying where they've got it to; the rope between the prisoners and their
 * guards; the ring at a house's woodpile filling as the torch-bearers get it going (full, it's alight:
 * the same number the room judges by); and the ring at a burning house's door while a hero drags
 * someone out of it. Paint only, from the room's own state, so every screen draws the same.
 */
import type { Block, Npc } from '../shared/arena';
import { SCENE } from '../shared/tuning';
import { isDead } from '../sim/damage';
import type { ArenaRoom } from '../sim/room';
import type { Enemy } from '../sim/types';
import { ring, type Ctx } from './draw';
import { drawNpc } from './npcs';

/** The body being hauled: one of the dead, by whoever it was (a soldier off the road, else a villager). */
export function drawHauled(c: Ctx, e: Enemy, x: number, y: number): void {
  const body: Npc = { x: e.haul!.x, y: e.haul!.y, name: '', talk: '', look: e.id % 2 ? 'soldier2' : 'villager', pose: 'corpse', mute: true };
  drawNpc(c, body, x, y, false);
}

/** The rope's lengths, in tiles: front guard, each prisoner in turn, the rear guard (whoever's still on it). */
export function ropeOf(room: ArenaRoom): [number, number, number, number][] {
  const led = room.survivors.filter((s) => s.led && !s.gone).sort((a, b) => b.led!.s - a.led!.s);
  if (!led.length) return [];
  const guards = room.enemies.filter((e) => e.task?.k === 'escort' && !e.task.quit && !isDead(e)).sort((a, b) => (b.task as { s: number }).s - (a.task as { s: number }).s);
  const front = guards.find((g) => (g.task as { s: number }).s > led[0].led!.s), rear = guards.find((g) => (g.task as { s: number }).s < led[led.length - 1].led!.s);
  const pts = [...(front ? [front] : []), ...led, ...(rear ? [rear] : [])];
  return pts.slice(1).map((p, i) => [pts[i].x, pts[i].y, p.x, p.y]);
}

/** One length of rope between two screen points, sagging a little. */
export function drawRope(c: Ctx, x1: number, y1: number, x2: number, y2: number): void {
  const l = c.lit, n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 2));
  l.fillStyle = '#2e2016';
  for (let i = 0; i <= n; i++) {
    const k = i / n, sag = Math.sin(k * Math.PI) * 3;
    l.fillRect(Math.round(x1 + (x2 - x1) * k), Math.round(y1 + (y2 - y1) * k + sag), 1, 1);
  }
}

/** The torch-bearers' ring at the woodpile (red: theirs), and the ring at the door while someone's dragged out. */
export function drawSceneRings(c: Ctx, b: Block, kx: number, ky: number, dx: number, dy: number): void {
  if (b.torched !== undefined && (b.burning ?? -1) < 0 && !b.ruined) {
    ring(c, kx, ky - 2, 13, '#ff5a30', b.torched, '#3a1810');
    const g = c.glow;
    for (let i = 0; i < 3 + Math.floor(b.torched * 6); i++) {
      g.fillStyle = ['#fff1b0', '#ffb040', '#ff6a20'][(i + Math.floor(c.now * 14)) % 3];
      g.fillRect(Math.round(kx - 4 + ((i * 5) % 9)), Math.round(ky - 6 - ((c.now * 11 + i * 3) % (4 + b.torched * 8))), 1, 1);
    }
  }
  if (b.pullT) ring(c, dx, dy - 2, 11, '#c8f0c0', Math.min(1, b.pullT / SCENE.pull), '#203020');
}
