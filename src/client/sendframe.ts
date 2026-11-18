/**
 * Reading the room once for a send. Snaps: each entity as it is now, read once (goblins as quiet makes
 * them, without copying them first), for one or several encoders. SendFrame: what one send of a big room works out once and shares across the friends' messages (bigsend.ts): the
 * goblins read as quiet makes them, the buildings' copies with their `b<i>`, the slow parts' text and the expedition's
 * view. Only what the room is now goes here, never what a friend was last sent: each friend's Encoder
 * keeps that for itself. A frame holds for one room at one moment (the same `now` and room time, the
 * same lists); anything else starts a new one.
 */
import type { ArenaRoom } from '../sim/room';
import { expedView } from '../sim/exped';
import { INTEREST, quietInto, ringFor } from './interest';
import { rnd, snapOf, stateOf, type Snap, type Source } from './snap';
import { heroInto } from './wire2';

type State = ReturnType<typeof stateOf>;
type Ent = Record<string, unknown>;
/** Reads goblin `e`'s fields as they're to be sent into `keys` and `vals`, returning their count (interest.ts quietInto). */
type Reader = (e: Ent, keys: string[], vals: unknown[]) => number;
/** Reads hero `e` as it's to be sent (the second wire format's clock: wire2.ts heroInto). */
type HeroReader = (e: Ent, skip: Set<string> | null, into: Snap) => Snap;

/**
 * Entities as they are now, each read once. `keep`: kept for the send, for every friend's encoder to
 * share (nothing of what anyone was sent: it must not outlive the moment it was made for); else each
 * entity is read into the same two lists, good until the next, and only goblins at all (an encoder reads
 * the rest itself). `foes`: how to read a goblin from the live one (quiet clocks); `heroes`, if given,
 * a hero (the second wire format's clock), else an encoder reads heroes itself.
 */
export class Snaps implements Source {
  private by = new Map<string, Map<Ent, Snap>>();
  private scratch: Snap = { keys: [], vals: [] };

  constructor(private readonly keep: boolean, private readonly foes?: Reader, private readonly heroes?: HeroReader) {}

  of(e: Ent, c: string, skip: Set<string> | null): Snap | null {
    if (!this.keep) return (c === 'enemies' && this.foes) || (c === 'heroes' && this.heroes) ? this.read(e, c, skip, this.scratch) : null;
    let m = this.by.get(c), s = m?.get(e);
    if (!m) this.by.set(c, (m = new Map()));
    if (!s) m.set(e, (s = this.read(e, c, skip, { keys: [], vals: [] })));
    return s;
  }

  private read(e: Ent, c: string, skip: Set<string> | null, into: Snap): Snap {
    if (c === 'heroes' && this.heroes) return this.heroes(e, skip, into);
    if (c !== 'enemies' || !this.foes) return snapOf(e, skip, into);
    const n = this.foes(e, into.keys, into.vals);
    for (let i = 0; i < n; i++) if (typeof into.vals[i] === 'number') into.vals[i] = rnd(into.vals[i] as number);
    return into;
  }
}

export class SendFrame {
  private readonly time: number;
  private readonly foes: unknown[];
  private readonly map: unknown[];
  private readonly all: State;
  private readonly blocks: Ent[] = [];
  private readonly texts = new Map<string, { v: unknown; s: string }>();
  private view: { s: string; o: unknown } | null = null;
  /** The entities as they are now (goblins as quiet sends them), read once for every friend's Encoder. */
  readonly snaps: Snaps;
  private snaps2: Snaps | null = null;

  constructor(readonly room: ArenaRoom, readonly now: number) {
    const s = stateOf(room), t = room.time;
    this.time = t;
    this.foes = room.enemies;
    this.map = room.map.blocks;
    // (The goblins stay the live ones here, read as quiet would make them: quiet keeps where they stand
    // and their ids, so the friends' rings and keys are the same.)
    this.all = s;
    this.snaps = new Snaps(true, (e, keys, vals) => quietInto(e, t, keys, vals));
  }

  /** The snaps for wire format `v` (2: heroes' clocks as `a0` too, wire2.ts), each made once a send. */
  snapsFor(v: number): Snaps {
    if (v < 2) return this.snaps;
    const t = this.time;
    return (this.snaps2 ??= new Snaps(true, (e, keys, vals) => quietInto(e, t, keys, vals), (e, skip, into) => heroInto(e, t, skip, into)));
  }

  /** Whether this frame is still `room` as it is at `now`. */
  fits(room: ArenaRoom, now: number): boolean {
    return this.room === room && this.now === now && this.time === room.time && this.foes === room.enemies && this.foes.length === room.enemies.length && this.map === room.map.blocks;
  }

  /** quiet(stateFor(room, id)), the same objects for every friend. */
  stateFor(id: string): State {
    return ringFor(this.room, this.all, id, INTEREST.radius, (b, i) => (this.blocks[i] ??= { ...b, id: 'b' + i }));
  }

  /** JSON text of `v` (a part of the message every friend shares, under `key`), written once a send. */
  text(key: string, v: unknown): string {
    const got = this.texts.get(key);
    if (got && got.v === v) return got.s;
    const s = JSON.stringify(v);
    this.texts.set(key, { v, s });
    return s;
  }

  /** The expedition's view as text ('' without one) and as an object to send. */
  exped(): { s: string; o: unknown } {
    if (this.view) return this.view;
    const s = this.room.exped ? JSON.stringify(expedView(this.room.exped)) : '';
    return (this.view = { s, o: s ? JSON.parse(s) : undefined });
  }
}
