/**
 * The encoder against the one it replaced (tests/perfref/snap.ts), on made-up rooms no seeded fight would reach
 * (docs/design/perf-sweep.md): fields that come, go and change places, lists inside lists, nothing where a
 * number was, minus zero, numbers that aren't, two entities with one id, entities with none, lists reshuffled,
 * objects that aren't plain. Every patch must be the same text, read three ways: the room's lists as they are,
 * each goblin read straight into the encoder (roomsend.ts), and one reading shared by two friends who each see
 * part of the room (bigsend.ts). Seeded, so a failure can be played again.
 */
import { describe, expect, it } from 'vitest';
import { quiet, quietInto } from '../src/client/interest';
import { Snaps } from '../src/client/sendframe';
import { COLLS, Encoder } from '../src/client/snap';
import { Rng } from '../src/shared/rng';
import { quiet as refQuiet } from './perfref/interest';
import { Encoder as RefEncoder } from './perfref/snap';

type Ent = Record<string, unknown>;
type State = Record<(typeof COLLS)[number], Ent[]>;
const USED = ['heroes', 'enemies', 'bolts', 'props', 'zones', 'blocks'] as const;
const FIELDS = ['x', 'y', 'hp', 'act', 'actT', 'fx', 'fy', 'kvx', 'kvy', 'cooldown', 'home', 'attack', 'bag', 'seen', 'stats', 'tag', 'until', 'a0', 'list', 'deep', '7', '3'];
class Odd { a = 1.006; b = 'odd'; }

function value(r: Rng, depth = 0): unknown {
  const k = Math.floor(r.next() * (depth > 2 ? 9 : 14));
  if (k === 0) return null;
  if (k === 1) return undefined;
  if (k === 2) return r.next() < 0.5;
  if (k === 3) return ['idle', 'attack', 'a|b', '', 'me', '"q"'][Math.floor(r.next() * 6)];
  if (k === 4) return [0, -0, NaN, Infinity, -Infinity, 1.005, 2.675, -1.005, 1e21, 5e-324][Math.floor(r.next() * 10)];
  if (k < 9) return (r.next() - 0.5) * [1, 10, 1000][Math.floor(r.next() * 3)];
  if (k === 9) return Array.from({ length: Math.floor(r.next() * 4) }, () => value(r, depth + 1));
  if (k === 10) return new Odd();
  if (k === 11) return Object.assign(Object.create(null), { n: r.next(), s: 'bare' });
  const o: Ent = {};
  for (let i = Math.floor(r.next() * 4); i > 0; i--) o[['p', 'q', 't', 'dmg', 'done', '2', 'windup'][Math.floor(r.next() * 7)]] = value(r, depth + 1);
  return o;
}

function entity(r: Rng, id: unknown): Ent {
  const e: Ent = id === undefined ? {} : { id };
  for (const f of FIELDS) if (r.next() < 0.5) e[f] = value(r);
  // (A goblin's clocks are numbers in the room; quiet reads them as such.)
  if (r.next() < 0.8) Object.assign(e, { actT: r.next() * 3, fx: r.next() - 0.5, fy: r.next() - 0.5, kvx: (r.next() - 0.5) * 6, kvy: (r.next() - 0.5) * 6 });
  return e;
}

/** One step of change to a room: most things stay, some fields and lists move. */
function mutate(r: Rng, s: State, ids: { n: number }): void {
  for (const c of USED) {
    let list = s[c];
    for (const e of list) {
      if (r.next() < 0.6) continue;
      const f = FIELDS[Math.floor(r.next() * FIELDS.length)], roll = r.next();
      if (roll < 0.25) delete e[f];
      else if (roll < 0.5 && typeof e[f] === 'number') e[f] = (e[f] as number) + [0.001, 0.004, 0.02, 1][Math.floor(r.next() * 4)];
      else if (roll < 0.6 && e[f] && typeof e[f] === 'object') e[f] = JSON.parse(JSON.stringify(e[f]) ?? 'null');
      else if (roll < 0.7 && Array.isArray(e[f])) (e[f] as unknown[]).push(value(r, 2));
      else e[f] = value(r);
    }
    const roll = r.next();
    if (roll < 0.08 && list.length) list.splice(Math.floor(r.next() * list.length), 1);
    else if (roll < 0.2) list.push(entity(r, r.next() < 0.15 ? undefined : r.next() < 0.1 && list.length ? list[0].id : r.next() < 0.5 ? ids.n++ : 'e' + ids.n++));
    else if (roll < 0.26 && list.length > 1) list.unshift(list.pop()!);
    else if (roll < 0.3) s[c] = list = [...list].reverse();
  }
}

/** A goblin's clocks kept as the room keeps them (numbers; a blow is an object with its own, or none), whatever else the fuzz did to it: quiet does sums on them. */
function sane(r: Rng, e: Ent): void {
  if (typeof e.actT !== 'number') e.actT = r.next() * 3;
  const a = e.attack;
  if (a === undefined || a === null) return;
  if (typeof a !== 'object' || Array.isArray(a)) e.attack = null;
  else if (typeof (a as Ent).t !== 'number') (a as Ent).t = r.next();
}

function play(seed: number, steps: number): string {
  const r = new Rng(seed), ids = { n: 1 };
  const s = Object.fromEntries(COLLS.map((c) => [c, []])) as unknown as State;
  for (const c of USED) for (let i = 0; i < 4; i++) s[c].push(entity(r, c === 'heroes' ? ['me', 'b2', 'b3', 'b4'][i] : ids.n++));
  const ref = new RefEncoder(), refA = new RefEncoder(), refB = new RefEncoder();
  const plain = new Encoder(), direct = new Encoder(), a = new Encoder(), b = new Encoder();
  const part = (st: State, odd: number): State => Object.fromEntries(COLLS.map((c) => [c, c === 'heroes' ? st[c] : st[c].filter((_, i) => i % 2 === odd || i % 3 === 0)])) as unknown as State;
  for (let n = 0; n < steps; n++) {
    for (const e of s.enemies) sane(r, e);
    const t = n / 30, full = n % 37 === 0, fullB = n % 23 === 0;
    const want = JSON.stringify(ref.encode(refQuiet(s, t), full));
    const got1 = JSON.stringify(plain.encode(quiet(s, t), full));
    if (got1 !== want) return `seed ${seed} step ${n} (lists as they are): ${got1.slice(0, 300)} | ${want.slice(0, 300)}`;
    const got2 = JSON.stringify(direct.encode(s, full, new Snaps(false, (e, keys, vals) => quietInto(e, t, keys, vals))));
    if (got2 !== want) return `seed ${seed} step ${n} (read straight in): ${got2.slice(0, 300)} | ${want.slice(0, 300)}`;
    const shared = new Snaps(true, (e, keys, vals) => quietInto(e, t, keys, vals));
    const wantA = JSON.stringify(refA.encode(refQuiet(part(s, 0), t), full)), wantB = JSON.stringify(refB.encode(refQuiet(part(s, 1), t), fullB));
    const gotA = JSON.stringify(a.encode(part(s, 0), full, shared)), gotB = JSON.stringify(b.encode(part(s, 1), fullB, shared));
    if (gotA !== wantA) return `seed ${seed} step ${n} (shared, first friend): ${gotA.slice(0, 300)} | ${wantA.slice(0, 300)}`;
    if (gotB !== wantB) return `seed ${seed} step ${n} (shared, second friend): ${gotB.slice(0, 300)} | ${wantB.slice(0, 300)}`;
    mutate(r, s, ids);
  }
  return '';
}

describe('the encoder is the old one on rooms no fight would make', () => {
  for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) it(`seed ${seed}: every patch is the text it was`, () => expect(play(seed, 400)).toBe(''));
});
