/**
 * On a job, everyone is where they walked: out in the street (the job's room) or in one of the houses
 * off it, each player on their own. Going indoors takes nobody else in with you. The leader's game runs
 * the street and every house anyone's in, side by side (coop.ts sends each friend only their own).
 *
 * Through a door the small goblins after you follow you (followers.ts), the freed you're leading come
 * out with you (sim/survivors.ts walkOut, and maybe an ambush by the door), and a house that fell in
 * behind you is ash in the street. Over each door outside, the names of whoever's in there.
 */
import { doorAt, useMap, type Block, type GameMap } from '../shared/arena';
import { SPOT_REACH } from '../shared/town';
import { ARRIVE_SAFE, WEAPONS, type HeroClass } from '../shared/tuning';
import { release } from '../sim/grab';
import { players } from '../sim/party';
import { dropProp } from '../sim/props';
import { rebase } from '../sim/rebase';
import type { Indoors } from '../sim/houseburn';
import type { ArenaRoom } from '../sim/room';
import { interiorRoom, type Run } from '../sim/run';
import { walkOut } from '../sim/survivors';
import type { Hero, Intent } from '../sim/types';
import { loadRoom, saveRoom } from './coop';
import type { Followers } from './followers';

/** A house door with players inside, and who (drawn over the door outside: doormarks.ts). */
export interface DoorMark { x: number; y: number; who: { name: string; cls: HeroClass }[] }
/** The houses as plain data, by their block's place in the street's map. */
export type SavedHouses = [number, Record<string, unknown>][];

export class JobRooms {
  /** The job's room (null off a job). */
  street: ArenaRoom | null = null;
  /** Its houses, once anyone has been in (their goblins stay dead). */
  readonly houses = new Map<Block, ArenaRoom>();
  /** What's in the houses, for a street's house fires (houseindoors.ts). */
  inside?: Indoors;

  constructor(private followers: Followers) {}

  /** A new room on the job (or none): no houses yet. */
  reset(street: ArenaRoom | null): void {
    this.street = street;
    this.houses.clear();
    if (street) street.houseIn = this.inside;
  }

  all(): ArenaRoom[] {
    return this.street ? [this.street, ...this.houses.values()] : [];
  }

  /** The room with this player's hero in it. */
  roomOf(id: string): ArenaRoom | undefined {
    return this.all().find((r) => r.heroes.some((h) => h.id === id));
  }

  /** The door a house is behind. */
  doorOf(room: ArenaRoom): Block | undefined {
    for (const [b, r] of this.houses) if (r === room) return b;
    return undefined;
  }

  /** The rooms that run this tick: the street always (fires burn, dens breed), and any house with a player in it. */
  live(): ArenaRoom[] {
    return this.all().filter((r) => r === this.street || players(r.heroes).length > 0);
  }

  /** Every player indoors. */
  indoors(): Hero[] {
    return [...this.houses.values()].flatMap((r) => players(r.heroes));
  }

  /** `h` (in the street) goes in at door `b`: the house, built the first time anyone goes in. */
  goIn(run: Run, h: Hero, b: Block): ArenaRoom | null {
    const street = this.street;
    if (!street || !b.door || b.ruined || b.locked || (b.burning ?? -1) >= 0 || !street.heroes.includes(h)) return null;
    let inside = this.houses.get(b);
    const fresh = !inside;
    if (!inside) this.houses.set(b, (inside = interiorRoom(run, street.map.blocks.indexOf(b), b.door)));
    const at = inside.map.hero, n = players(inside.heroes).length;
    this.followers.through(street, inside, h, at.x, at.y);
    carry(h, street, inside, at.x + (n ? (n % 2 ? 0.7 : -0.7) : 0), at.y + 0.2 * n, -1);
    // First in: a moment's grace, so nobody's cut down in the doorway.
    if (fresh) h.safeT = ARRIVE_SAFE;
    return inside;
  }

  /** `h` walks out of the house they're in, by its door: back in the street. */
  comeOut(h: Hero): ArenaRoom | null {
    const street = this.street, inside = this.roomOf(h.id), b = inside && this.doorOf(inside);
    if (!street || !inside || !b) return null;
    const d = doorAt(b);
    this.followers.through(inside, street, h, d.x, d.y + 0.6);
    // Whoever they're leading comes out too: home (the street may have goblins waiting).
    walkOut(inside.survivors, [h], street.survivors, d.x, d.y + 1.1);
    if (inside.blaze?.fallen) Object.assign(b, { ruined: true, smoulder: false });
    carry(h, inside, street, d.x, d.y + 0.5, 1);
    return street;
  }

  /** Over each door with anyone inside: who. */
  marks(name: (h: Hero) => string): DoorMark[] {
    const out: DoorMark[] = [];
    for (const [b, r] of this.houses) {
      const who = players(r.heroes).map((h) => ({ name: name(h), cls: WEAPONS[h.weapon].cls }));
      if (who.length) out.push({ ...doorAt(b), who });
    }
    return out;
  }

  /** The houses as plain data (to hand the job on), every one anyone's been in. */
  save(): SavedHouses {
    const street = this.street;
    return street ? [...this.houses].map(([b, r]) => [street.map.blocks.indexOf(b), saveRoom(r)]) : [];
  }

  /** Back from a save: the street and its houses as they were. */
  load(street: ArenaRoom, houses: SavedHouses = []): void {
    this.reset(street);
    for (const [i, r] of houses) if (street.map.blocks[i]) this.houses.set(street.map.blocks[i], loadRoom(r));
  }
}

/**
 * The door a friend is walking up into: the nearest within reach (the same reach the leader's own
 * prompt uses), pushed up into and lined up with.
 */
export function doorPushed(map: GameMap, h: Hero, i: Intent): Block | null {
  let best: Block | null = null, bd = SPOT_REACH;
  for (const b of map.blocks) {
    if (!b.door || b.ruined || b.locked || (b.burning ?? -1) >= 0) continue;
    const d = doorAt(b), dist = Math.hypot(d.x - h.x, d.y - h.y) * 1.4;
    if (dist <= bd) (bd = dist), (best = b);
  }
  return best && i.my < -0.5 && Math.abs(h.x - doorAt(best).x) < 0.7 ? best : null;
}

/** A hero carried from one room into another as they are (health, potions, cooldowns), its clock moved on. */
function carry(h: Hero, from: ArenaRoom, to: ArenaRoom, x: number, y: number, fy: number): void {
  // Nothing held goes through the door: a goblin overhead drops where it was, a crate too.
  useMap(from.map);
  if (h.carrying) release(h, from.enemies);
  if (h.lifting) dropProp(h, from.props);
  from.heroes.splice(from.heroes.indexOf(h), 1);
  to.heroes.push(h);
  rebase(h, from.time, to.time);
  Object.assign(h, { x, y, fx: 0, fy, kvx: 0, kvy: 0, act: h.act === 'down' ? 'down' : 'idle', actT: h.act === 'down' ? h.actT : 0, moving: false });
  if (h.hound) Object.assign(h.hound, { x: x + 0.6, y: y + 0.3, state: 'heel', target: 0, moving: false });
  to.prev.set('h:' + h.id, [x, y]);
  if (h.hound) to.prev.set('d:' + h.id, [h.hound.x, h.hound.y]);
}
