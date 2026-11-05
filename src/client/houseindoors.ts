/**
 * What's inside each house on the job, for the street's house fires (sim/houseburn.ts), as the leader's
 * game knows it: a house someone's been in from its room as it is now, one nobody has from its plan
 * (the same seed builds it). When a house catches with a room, that room burns too (its own plan,
 * squeezed into the time left: shared/blaze.ts `blazeFrom`), so whoever's in there gets their few
 * seconds before the smoke. And each house's `cry`: someone still caged inside, heard at its kindling.
 */
import { currentMap, useMap } from '../shared/arena';
import { burnable } from '../shared/kindling';
import { blazeFrom } from '../shared/blaze';
import type { Layout } from '../shared/housekit';
import { runInterior } from '../shared/interiors';
import { Rng } from '../shared/rng';
import { isDead } from '../sim/damage';
import type { Indoors } from '../sim/houseburn';
import { players } from '../sim/party';
import type { ArenaRoom } from '../sim/room';
import { interiorRoom, type Run } from '../sim/run';
import type { Enemy } from '../sim/types';
import type { JobRooms } from './jobrooms';

const cages = (r: ArenaRoom) => r.props.filter((p) => p.kind === 'cage' && !p.broken);

export class HouseIndoors implements Indoors {
  private planned = new Map<string, number>();

  /** `resend`: send a room afresh to whoever's in it (its map changed: it's on fire). */
  constructor(private rooms: JobRooms, private run: () => Run | null, private resend: (r: ArenaRoom) => void) {}

  private room(i: number): ArenaRoom | undefined {
    const b = this.rooms.street?.map.blocks[i];
    return b && this.rooms.houses.get(b);
  }

  contents(i: number): { foes: Enemy[]; chests: number } {
    const r = this.room(i), run = this.run(), b = this.rooms.street?.map.blocks[i];
    if (r) return { foes: r.enemies.filter((e) => !isDead(e)).map((e) => JSON.parse(JSON.stringify(e)) as Enemy), chests: r.chests.filter((c) => c.state !== 'open').length };
    if (!run || !b?.door) return { foes: [], chests: 0 };
    // (Building a room takes the map for its own: the street's is put back.)
    const was = currentMap(), fresh = interiorRoom(run, i, b.door);
    useMap(was);
    return { foes: fresh.enemies, chests: fresh.chests.length };
  }

  take(i: number, id: number): Enemy | null | undefined {
    const r = this.room(i);
    if (!r) return undefined;
    const e = r.enemies.find((x) => x.id === id);
    if (!e || isDead(e) || e.act === 'carried') return null;
    r.enemies.splice(r.enemies.indexOf(e), 1);
    return e;
  }

  caged(i: number): number {
    const r = this.room(i);
    // Someone in there as it falls: that room's own fire counts its caged.
    // (Anyone dragged out of its door while it burned is out: sim/scenes.ts.)
    const out = this.rooms.street?.map.blocks[i]?.pulled ?? 0;
    if (r) return players(r.heroes).length && !r.blaze?.fallen ? 0 : Math.max(0, cages(r).length - out);
    return Math.max(0, this.plannedCages(i) - out);
  }

  caught(i: number, _from: number, fall: number): void {
    const r = this.room(i), street = this.rooms.street, b = street?.map.blocks[i];
    if (!r || !street || !b || r.map.blaze) return;
    const l = { w: r.map.w, h: r.map.h, blocks: r.map.blocks, rounds: r.map.rounds, props: r.props } as unknown as Layout, cage = cages(r)[0];
    r.map.blaze = blazeFrom(l, new Rng((b.look ?? 1) * 19 + 5), r.time, r.time + (fall - street.time), cage && { x: cage.x, y: cage.y });
    r.blaze = undefined;
    this.resend(r);
  }

  /** Each frame: whether someone is still caged in each house that could burn (for the cry at its kindling). */
  cries(): void {
    this.rooms.street?.map.blocks.forEach((b, i) => {
      if (!burnable(b) || b.ruined) return;
      const r = this.room(i), cry = (r ? cages(r).length : this.plannedCages(i)) - (b.pulled ?? 0) > 0;
      if (b.cry !== cry) b.cry = cry;
    });
  }

  private plannedCages(i: number): number {
    const run = this.run(), b = this.rooms.street?.map.blocks[i];
    if (!run || !b?.door) return 0;
    const k = `${run.job.id}:${run.job.seed}:${run.index}:${i}`;
    if (!this.planned.has(k)) this.planned.set(k, runInterior(run.job, run.index, i, b.door).props.filter((p) => p.kind === 'cage').length);
    return this.planned.get(k)!;
  }
}
