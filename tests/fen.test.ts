/**
 * Fenmere, the atlas's second curated zone (shared/fen.ts): its fixed ground and seeded details; every scene,
 * job, the fire and the way out walkable by every class, through the causeways, boards and fords, with no
 * stuck spots; the mist (a rule the room reads, never over a telegraph); goblins lying in the reeds; what's
 * placed where and how much threat it is; the beats; the same fight twice, and a friend's patches.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fenmere } from '../src/shared/expedjob';
import { expedPlan } from '../src/shared/expedmap';
import { MAIN, ON_THE_WAY, SIDES, SPINE } from '../src/shared/fen';
import { BOARDWALKS, groundAt, LAND } from '../src/shared/fenland';
import { mistAt, mistReach, mistSight } from '../src/shared/fenmist';
import { collide, solid, useMap, wadeAt, WADE } from '../src/shared/arena';
import { CHECK, LURK, MIST, TICK, WEAPONS, type WeaponId } from '../src/shared/tuning';
import { threatOf, SCREEN } from '../src/shared/threat';
import { Decoder, Encoder, stateOf } from '../src/client/snap';
import { faced } from '../src/sim/facing';
import { lurking, rising } from '../src/sim/lurk';
import { expedRoom } from '../src/sim/expedroom';
import type { ArenaRoom } from '../src/sim/room';
import { NO_INTENT, type FightEvent, type Hero } from '../src/sim/types';
import { walkable } from './walk';

const job = (d = 70) => fenmere(d);
function fen(d = 70, ids = ['me'], keep: (e: ArenaRoom['enemies'][number]) => boolean = () => false, soft = false): ArenaRoom {
  const room = expedRoom(job(d), ids.length);
  for (const id of ids) {
    const h = room.join(id);
    if (!soft) Object.assign(h, { hp: 9999, maxHp: 9999 });
    room.setIntent(id, NO_INTENT);
  }
  room.enemies = room.enemies.filter(keep);
  return room;
}
const step = (room: ArenaRoom, s: number, each?: () => void): FightEvent[] => {
  const out: FightEvent[] = [];
  for (let n = 0; n < Math.round(s / TICK); n++) room.step(), out.push(...room.events), each?.();
  return out;
};
const put = (h: Hero, x: number, y: number) => Object.assign(h, { x, y, kvx: 0, kvy: 0 });
const inDeep = (room: ArenaRoom, x: number, y: number) => !!room.map.water?.some((w) => w.deep && x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h);
const KITS: WeaponId[] = ['sword', 'daggers', 'shortbow', 'wand', 'mace'];

describe('Fenmere', () => {
  it('is posted on the board as a curated zone with a relic, and its ground never changes', () => {
    const j = job(70);
    expect([j.exped, j.zone, j.title, j.size]).toEqual(['fen', 'fen', 'Fenmere', 'long']);
    expect(j.text).toContain(j.boss!);
    const a = expedPlan(job(70)), b = expedPlan(job(71));
    expect([a.map.w, a.map.h, a.map.name]).toEqual([76, 60, 'FENMERE']);
    expect(JSON.stringify(b.map.water)).toBe(JSON.stringify(a.map.water));
    expect(JSON.stringify(b.map.blocks.filter((q) => q.kind === 'boards'))).toBe(JSON.stringify(a.map.blocks.filter((q) => q.kind === 'boards')));
    expect(b.map.fen!.beats).toEqual(a.map.fen!.beats);
    expect(b.goals.map((g) => [g.kind, g.x, g.y])).toEqual(a.goals.map((g) => [g.kind, g.x, g.y]));
    // The seed moves the trees, the reeds, the goblins and the mist; the same seed lays the same fen.
    expect(JSON.stringify(b.foes)).not.toBe(JSON.stringify(a.foes));
    expect(JSON.stringify(b.map.fen!.mist)).not.toBe(JSON.stringify(a.map.fen!.mist));
    expect(JSON.stringify(expedPlan(job(70)))).toBe(JSON.stringify(a));
    expect(a.map.water!.length).toBeLessThan(120);
  });

  it('can be walked from the way in to every scene, job, the fire and the way out, as a body with feet, with no pocket you could be put in', { timeout: 60000 }, () => {
    for (const d of [3, 70, 120]) {
      const p = expedPlan(job(d)), w = walkable(p, [], true);
      for (const b of p.map.fen!.beats) expect(w.reach(b.x, b.y, 2.2), `${d} ${b.kind}`).toBe(true);
      for (const g of [...p.goals, ...p.sides]) expect(w.reach(g.x, g.y, 2.2), `${d} ${g.kind}`).toBe(true);
      expect(w.reach(p.map.fen!.check.x, p.map.fen!.check.y, 1.6)).toBe(true);
      expect(w.reach(p.map.exit!.x + 1.5, 1.2, 1.2)).toBe(true);
      // Every trail point and the middle of every boardwalk is reached.
      for (const l of [MAIN, ...SIDES]) for (const q of l) expect(w.reach(q.x, q.y, 0.9), `${d} trail ${q.x},${q.y}`).toBe(true);
      for (const [x0, y0, x1, y1] of BOARDWALKS) expect(w.reach((x0 + x1) / 2, (y0 + y1) / 2, 0.4), `${d} boards ${x0},${y0}`).toBe(true);
      // Ground you can stand on but not walk to is only pinholes between trees, shut in on every side.
      expect(w.all - w.reached).toBeLessThan(80);
    }
  });

  it('every class walks the whole way from the way in to the way out, dodging as it goes, never into deep water', { timeout: 120000 }, () => {
    for (const k of KITS) {
      const room = fen(70), h = room.heroes[0];
      h.weapon = k;
      let i = 1, seq = 0, worst = 0;
      const pts = [...MAIN.slice(0, 10), ...SIDES[3], ...[...SIDES[3]].reverse(), ...MAIN.slice(10, 14), ...SIDES[2], ...MAIN.slice(17)];
      // (A jump goes back, the shortbow's furthest (2026-11-13): more steps for it.)
      for (let n = 0; n < 6000 && i < pts.length; n++) {
        const to = pts[i], dx = to.x - h.x, dy = to.y - h.y, l = Math.hypot(dx, dy);
        if (l < 0.6) { i++; continue; }
        // A dodge every so often (a Warrior's and a Healer's do nothing).
        if (n % 45 === 20) seq++;
        room.setIntent('me', { ...NO_INTENT, mx: dx / l, my: dy / l, rollSeq: seq });
        room.step();
        expect(inDeep(room, h.x, h.y), `${k} at ${h.x.toFixed(2)},${h.y.toFixed(2)}`).toBe(false);
        worst = Math.max(worst, n);
      }
      expect(i, `${WEAPONS[k].cls} got to ${i} of ${pts.length}`).toBe(pts.length);
    }
  });

  it('knocked hard off a causeway, a boardwalk or the ford, you stay out of deep water and can walk back', () => {
    const room = fen(70), h = room.heroes[0], p = expedPlan(job(70)), w = walkable(p, [], true);
    const spots = [{ x: 36, y: 42.9 }, { x: 46.1, y: 40 }, { x: 51, y: 43.1 }, { x: 33.7, y: 24.8 }, { x: 52.1, y: 9.1 }, { x: 47.2, y: 34.5 }, { x: 37.7, y: 41.1 }];
    for (const s of spots) for (const [kx, ky] of [[0, 16], [0, -16], [16, 0], [-16, 0]]) {
      put(h, s.x, s.y), Object.assign(h, { kvx: kx, kvy: ky, act: 'idle' });
      step(room, 0.8);
      expect(inDeep(room, h.x, h.y), `${s.x},${s.y} knocked ${kx},${ky}`).toBe(false);
      expect(w.reach(h.x, h.y, 0.5), `${s.x},${s.y} knocked ${kx},${ky} to ${h.x.toFixed(1)},${h.y.toFixed(1)}`).toBe(true);
    }
  });

  it('causeways have deep bog either side, the fords and reeds are shallows, and the boards are decks over deep water', () => {
    const p = expedPlan(job(70));
    useMap(p.map);
    for (let x = 28; x < 44; x += 2) for (const y of [39.6, 46.2]) if (y > 40 || x < 35 || x > 39.5) expect(groundAt(x, y), `bog by the causeway at ${x},${y}`).toBe(2);
    for (let x = 28; x < 44; x += 2) expect(groundAt(x, 42.9)).toBe(0);
    for (let y = 32.4; y < 37; y += 1) expect(wadeAt(47.2, y), `the ford at ${y}`).toBe(WADE);
    expect(wadeAt(36, 22.6)).toBe(WADE);
    for (const b of p.map.blocks.filter((q) => q.kind === 'boards')) {
      expect(b.deck && !solid(b)).toBe(true);
      const mx = b.x + b.w / 2, my = b.y + b.h / 2, q = { x: mx, y: my, z: 0 };
      collide(q, 0.32);
      expect(Math.hypot(q.x - mx, q.y - my), `boards at ${mx},${my}`).toBeLessThan(1e-6);
    }
    for (const b of p.map.blocks.filter((q) => q.kind === 'reeds')) expect(b.soft && !solid(b)).toBe(true);
    // Deep water at both sides of each boardwalk's middle (it's over the water).
    for (const [x0, y0, x1, y1] of BOARDWALKS) {
      const along = x1 - x0 >= y1 - y0, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      expect(along ? [groundAt(mx, y0 - 0.3), groundAt(mx, y1 + 0.3)] : [groundAt(x0 - 0.3, my), groundAt(x1 + 0.3, my)], `boards ${x0},${y0}`).toEqual([2, 2]);
    }
  });

  it('goblins come over the ford and the boards after you', { timeout: 30000 }, () => {
    const room = fen(70, ['me'], () => false), h = room.heroes[0], seed = expedRoom(job(70)).enemies.find((e) => e.kind === 'scrapper' && !e.task)!;
    for (const [from, to] of [[{ x: 47.2, y: 38.6 }, { x: 45.6, y: 30 }], [{ x: 37.7, y: 42.6 }, { x: 37.4, y: 39.4 }], [{ x: 33.7, y: 27 }, { x: 33.7, y: 22 }]]) {
      const e = { ...structuredClone(seed), x: from.x, y: from.y, alert: true, feeding: false, held: undefined, dozing: false };
      room.enemies = [e];
      put(h, to.x, to.y);
      let n = 0;
      while (n++ < 400 && Math.hypot(e.x - h.x, e.y - h.y) > 1.6) room.step();
      expect(n, `from ${from.x},${from.y}`).toBeLessThan(400);
    }
  });

  it('mist drifts by the room clock alone, and in it goblins notice you and archers reach you from less far', () => {
    const p = expedPlan(job(70)), m = p.map, bank = m.fen!.mist[0];
    expect(m.fen!.mist.length).toBe(MIST.banks);
    expect(mistAt(m, bank.x, bank.y, 10)).toBe(mistAt(m, bank.x, bank.y, 10));
    const samples = [0, 20, 40, 60, 80].map((t) => mistAt(m, bank.x, bank.y, t));
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.05);
    let thick = { x: 0, y: 0, t: 0, k: 0 };
    for (let t = 0; t < 90; t += 3) for (const b of m.fen!.mist) for (let dx = -3; dx <= 3; dx++) {
      const k = mistAt(m, b.x + dx, b.y, t);
      if (k > thick.k) thick = { x: b.x + dx, y: b.y, t, k };
    }
    expect(thick.k).toBeGreaterThan(0.5);
    expect(mistSight(m, thick.x, thick.y, thick.t)).toBeCloseTo(1 - MIST.sight * thick.k);
    expect(mistReach(m, thick.x, thick.y, thick.t)).toBeLessThan(1);
    expect(mistAt(m, 74, 58, 0)).toBe(0);
    // A goblin at rest notices a hero in the open sooner than one stood in the mist.
    const seen = (inMist: boolean) => {
      const room = fen(70, ['me'], () => false), h = room.heroes[0], src = expedRoom(job(70)).enemies.find((e) => e.kind === 'scrapper' && !e.task)!;
      room.time = thick.t;
      const at = inMist ? thick : { x: 74, y: 58 }, e = { ...structuredClone(src), x: at.x + 5.2, y: at.y, fx: -1, fy: 0, alert: false, feeding: false, dozing: false, task: undefined };
      if (!inMist) room.map.fen!.mist = [];
      room.enemies = [e];
      put(h, at.x, at.y);
      step(room, TICK * 2);
      return e.alert;
    };
    expect(seen(false)).toBe(true);
    expect(seen(true)).toBe(false);
  });

  it('mist is laid only over the lit layer, never within reach of anything glowing: a telegraph shows through it', () => {
    const flat = readFileSync('src/client/light.ts', 'utf8'), post = readFileSync('src/client/three/post.ts', 'utf8');
    // The flat pass: mist mixed in before the glowing layer goes on top, and only where nothing glows near.
    expect(flat.indexOf('mistK(px, bz)')).toBeGreaterThan(-1);
    expect(flat.indexOf('mistK(px, bz)')).toBeLessThan(flat.indexOf('o = vec4(mix(c, e.rgb, e.a), 1.0);'));
    expect(flat).toMatch(/near = max\(near, texture\(uEmis[\s\S]*if \(near < 0\.1\) c = mix\(c, uMC, mk\)/);
    // The 2.5D pass: ordinary surfaces only (glowing ones, a telegraph's, are less than 1), none near a glowing pixel.
    expect(post).toMatch(/c\.a > 0\.995 \? mistK/);
    expect(post).toMatch(/if \(near > 0\.99\) col = mix\(col, uMC, mk\)/);
    // And the rule: a goblin's blow in the mist is the blow it would be out of it (the telegraph is the one judged).
    const room = fen(70, ['me'], (e) => e.variant === 'heavy'), e = room.enemies[0], spec = { ...e };
    room.time = 30;
    expect(e.radius).toBe(spec.radius);
  });

  it('goblins lie hidden in the reeds till sprung, then the whole knot stands up together and fights', () => {
    const room = fen(70, ['me'], (e) => e.task?.k === 'lurk'), h = room.heroes[0];
    expect(room.enemies.length).toBeGreaterThanOrEqual(8);
    const first = room.enemies[0], pack = room.enemies.filter((e) => e.pack === first.pack);
    // Close by but not within the spring: still hidden, not faced, nothing to swing at.
    put(h, first.x + LURK.spring + 0.6, first.y);
    step(room, 1);
    expect(pack.every(lurking)).toBe(true);
    Object.assign(h, { fx: -1, fy: 0 });
    expect(faced(h, room.enemies, 6)).toBeNull();
    // Within it: every one of the knot stands up at once, and does nothing that lands until it's up.
    put(h, first.x + LURK.spring - 0.4, first.y);
    const ev = step(room, TICK * 2);
    expect(ev.filter((q) => q.k === 'lurkrise')).toHaveLength(1);
    expect(pack.every((e) => !lurking(e) && rising(e, room.time) !== null)).toBe(true);
    expect(pack.every((e) => !e.attack)).toBe(true);
    step(room, LURK.rise + 0.1);
    expect(pack.every((e) => rising(e, room.time) === null && e.alert)).toBe(true);
    // The other knots are still lying there.
    expect(room.enemies.filter((e) => e.pack !== first.pack).every(lurking)).toBe(true);
    // A blow on one springs it too.
    const other = room.enemies.find((e) => e.pack !== first.pack)!;
    other.hitAt = room.time;
    step(room, TICK * 2);
    expect(lurking(other)).toBe(false);
  });

  it('places the fen goblins to suit its ground, within what a lone hero can take a scene at a time', () => {
    for (const d of [3, 70, 120]) {
      const p = expedPlan(job(d)), f = p.foes;
      expect(f.length).toBeLessThanOrEqual(70);
      expect(f.filter((q) => q.variant === 'gaffer').length).toBe(3);
      expect(f.filter((q) => q.variant === 'skimmer').length).toBe(1);
      expect(f.filter((q) => q.task?.k === 'lurk').length).toBeGreaterThanOrEqual(8);
      // Lurkers lie in the reeds' shallows; the gaffers stand at water; nobody stands in deep water.
      for (const q of f) expect(groundAt(q.x, q.y), `${q.kind} ${q.variant ?? q.role} at ${q.x},${q.y}`).not.toBe(2);
      for (const q of f.filter((r) => r.task?.k === 'lurk')) expect(groundAt(q.x, q.y)).toBe(1);
      // No pack of the scenes over a lone hero's screen.
      const packs = new Map<number, number>();
      for (const q of f) if (q.pack !== undefined && !q.name) packs.set(q.pack, (packs.get(q.pack) ?? 0) + threatOf(q.role));
      for (const [, t] of packs) expect(t).toBeLessThanOrEqual(SCREEN.threat[0] + 2);
      // None near the way in.
      expect(f.every((q) => Math.hypot(q.x - SPINE.in.x, q.y - SPINE.in.y) > 8)).toBe(true);
      const butcher = f[p.goals[2].foe!];
      expect(butcher).toMatchObject({ kind: 'butcher', name: job(d).boss, zoned: true });
    }
    // The new sorts bleed in: a Planker on the causeway and a Forker on the cuts' boards only once they're common.
    const early = expedPlan(job(3)).foes, late = expedPlan(job(120)).foes;
    expect(early.some((q) => q.role === 'planker' || q.role === 'forker')).toBe(false);
    expect(late.some((q) => q.role === 'planker')).toBe(true);
    expect(late.some((q) => q.role === 'forker')).toBe(true);
  });

  it('says the scenes as you come to them, once each, and the fire saves the run', () => {
    const room = fen(70), h = room.heroes[0], said: string[] = [];
    for (const k of ['in', ...ON_THE_WAY] as const) {
      put(h, SPINE[k].x, SPINE[k].y + 0.5);
      for (const e of step(room, 0.4)) if (e.k === 'exped' && e.what === 'beat') said.push(room.map.fen!.beats[e.i!].kind);
    }
    expect(said).toEqual([...ON_THE_WAY]);
    put(h, SPINE.check.x, SPINE.check.y + 0.6);
    step(room, CHECK.call + 0.3);
    expect(room.exped!.wood!.check.lit).toBe(true);
    // Every pinned job done: straight out, no beacon.
    for (const g of room.exped!.goals) (g.done = true), (g.p = 1);
    step(room, TICK * 2);
    expect(room.exped!.phase).toBe('leave');
  });

  it('the same fight twice is the same, and a friend gets the lurkers and the skimmer from the patches with nothing new each tick', () => {
    const go = () => {
      const r = fen(70, ['me'], () => true, true);
      put(r.heroes[0], 42, 31);
      r.setIntent('me', { ...NO_INTENT, mx: -0.4, my: -1 });
      step(r, 6);
      return r;
    };
    const same = (r: ArenaRoom) => JSON.stringify({ ...stateOf(r), chests: r.chests.map(({ id: _i, ...c }) => c), props: r.props.map(({ id: _i, ...p }) => p) });
    const a = go(), b = go();
    expect(same(b)).toBe(same(a));
    expect(JSON.stringify(b.exped)).toBe(JSON.stringify(a.exped));
    const room = fen(70, ['me'], (e) => e.task?.k === 'lurk' || e.variant === 'skimmer'), enc = new Encoder(), dec = new Decoder();
    put(room.heroes[0], 60, 30);
    let got = dec.apply(enc.encode(stateOf(room), true), true);
    for (let i = 0; i < 90; i++) room.step(), (got = dec.apply(enc.encode(stateOf(room))));
    // Lying still in the reeds: nothing about them goes, tick after tick.
    const lurkers = new Set(room.enemies.filter((e) => e.task?.k === 'lurk').map((e) => String(e.id)));
    for (let i = 0; i < 5; i++) {
      room.step();
      const p = enc.encode(stateOf(room));
      expect((p.enemies?.u ?? []).filter(([id]) => lurkers.has(String(id)))).toHaveLength(0);
    }
    // Sprung: the rise reaches the friend as it is.
    const first = room.enemies.find((e) => e.task?.k === 'lurk')!;
    put(room.heroes[0], first.x + 1, first.y);
    for (let i = 0; i < 4; i++) room.step(), (got = dec.apply(enc.encode(stateOf(room))));
    const seen = (got.enemies as unknown as { id: number; task?: { up?: number } }[]).find((e) => e.id === first.id)!;
    expect(seen.task?.up).toBe((first.task as { up?: number }).up);
    void LAND;
  });
});
