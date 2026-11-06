/**
 * The boss plate, as data (client/bossplate.ts draws it into the HUD's #boss): a boss of the kit's name,
 * a health bar for each of it (the Doorkeepers: one each, their names under them), its POISE under each,
 * and pips for its phases (lit for each still to fight through). Any other named goblin: its name and its
 * bar, as before. Read from the room's goblins only, so a friend's screen shows the same plate.
 */
import { DOOR_NAMES } from '../shared/bosswords';
import { isDead } from './damage';
import type { Enemy } from './types';

export interface PlateBar { name: string; hp: number; max: number; poise: number; poiseMax: number; dead: boolean; staggered: boolean }
export interface Plate { name: string; bars: PlateBar[]; pips: number; lit: number }

/** The plate for this room (`near`: which named goblins show; an expedition's only once you're near). */
export function plateOf(enemies: Enemy[], now: number, near: (e: Enemy) => boolean = () => true): Plate | null {
  const kit = enemies.filter((e) => e.boss);
  if (kit.length) {
    if (kit.every(isDead)) return null;
    const phase = Math.max(...kit.map((e) => e.boss!.phase)), pips = kit.length > 1 ? 2 : 1;
    const bars = kit.map((e) => ({ name: DOOR_NAMES[e.boss!.who], hp: Math.max(0, e.hp), max: e.maxHp, poise: e.boss!.poise, poiseMax: e.boss!.poiseMax, dead: isDead(e), staggered: e.boss!.stagUntil > now }));
    return { name: DOOR_NAMES.plate, bars, pips, lit: pips - (phase - 1) };
  }
  const e = enemies.find((x) => x.name && !isDead(x) && near(x));
  return e ? { name: e.name!, bars: [{ name: '', hp: Math.max(0, e.hp), max: e.maxHp, poise: 0, poiseMax: 0, dead: false, staggered: false }], pips: 0, lit: 0 } : null;
}
