/** The banner-bearer, the netter, the sneak-thief, the log-carriers and the roof archer. */
import { describe, expect, it } from 'vitest';
import { BANNER, HERO, LOGS, NETTER, ROOF, THIEF } from '../src/shared/tuning';
import { NO_INTENT } from '../src/sim/types';
import { kill } from '../src/sim/damage';
import { begin } from '../src/sim/enemies';
import { field, run } from './foeyard';

describe('the banner-bearer', () => {
  it('goblins near its banner take heart and hit harder; out of its reach they do not', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'banner', x: 15, y: 4 }, { kind: 'scrapper', x: 15, y: 7 }, { kind: 'scrapper', x: 3, y: 20 }]);
    run(room, 0.1);
    const [, near, far] = room.enemies;
    expect(near.heart).toBe(true);
    expect(far.heart).toBeFalsy();
    begin(near, 'stab', { windup: 1, active: 0.1, recover: 0.5, dmg: 8, knock: 0, range: 1, arc: 50, unblockable: false }, h, []);
    expect(near.attack!.dmg).toBe(Math.round(8 * BANNER.heart.dmg));
  });

  it('kill it and the goblins near it rout: they run and strike nothing for a few seconds', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'banner', x: 15, y: 6 }, { kind: 'scrapper', x: 15, y: 11 }, { kind: 'scrapper', x: 16, y: 11 }]);
    run(room, 0.1);
    const [b, g] = room.enemies;
    kill(b, room.events);
    const ev = run(room, 0.1);
    expect(ev.some((e) => e.k === 'bannerfall')).toBe(true);
    expect(g.routUntil).toBeGreaterThan(room.time);
    const d0 = Math.hypot(g.x - h.x, g.y - h.y), hp = h.hp;
    run(room, BANNER.rout.time - 0.5);
    expect(Math.hypot(g.x - h.x, g.y - h.y)).toBeGreaterThan(d0 + 3);
    expect(h.hp).toBe(hp);
  });
});

describe('the netter', () => {
  const netAt = () => {
    const { room, h, hs } = field([{ kind: 'scrapper', variant: 'netter', x: 15, y: 9.5 }], [['me', 15, 14], ['pal', 21, 14]]);
    const n = room.enemies[0];
    run(room, 5, () => n.attack?.kind === 'net');
    return { room, h, hs, n, a: n.attack! };
  };

  it('throws at whoever is furthest from a friend; the striped circle is where they stood', () => {
    const { room, hs } = field([{ kind: 'scrapper', variant: 'netter', x: 15, y: 8 }], [['me', 15, 13], ['pal', 16, 13], ['lone', 21, 12]]);
    const n = room.enemies[0];
    run(room, 5, () => n.attack?.kind === 'net');
    expect(n.attack!.unblockable).toBe(true);
    expect([n.attack!.cx, n.attack!.cy]).toEqual([hs[2].x, hs[2].y]);
  });

  it('caught, you are held; pressing attack and dodge works you out sooner than waiting', () => {
    const { room, h, a } = netAt();
    const target = room.heroes.find((x) => x.x === a.cx && x.y === a.cy)!;
    run(room, a.windup + 0.05);
    expect(target.netUntil).toBeGreaterThan(room.time);
    expect(target.act).toBe('stun');
    // Mash: each press takes NETTER.mash off.
    const held = target.netUntil! - room.time;
    let seq = 0;
    for (let i = 0; i < 5; i++) room.setIntent(target.id, { ...NO_INTENT, attackSeq: ++seq, rollSeq: seq }), run(room, 0.1);
    expect(target.netUntil ?? 0).toBeLessThan(room.time + held - 5 * 2 * NETTER.mash + 0.1);
    // (The netter put down, or it'd net them again.)
    kill(room.enemies[0], room.events);
    run(room, NETTER.hold);
    expect(target.netUntil).toBeUndefined();
    expect(target.act).not.toBe('stun');
    void h;
  });

  it('a friend pressing GRAB beside you cuts you out at once', () => {
    const { room, a } = netAt();
    const target = room.heroes.find((x) => x.x === a.cx && x.y === a.cy)!, pal = room.heroes.find((x) => x !== target)!;
    run(room, a.windup + 0.05);
    expect(target.netUntil).toBeGreaterThan(room.time);
    Object.assign(pal, { x: target.x + 0.8, y: target.y });
    room.setIntent(pal.id, { ...NO_INTENT, grabSeq: 1 });
    const ev = run(room, 0.1);
    expect(ev).toContainEqual(expect.objectContaining({ k: 'cutfree', id: target.id, by: pal.id }));
    expect(target.netUntil).toBeUndefined();
  });

  it('step out of the circle and the net misses', () => {
    const { room, a } = netAt();
    const target = room.heroes.find((x) => x.x === a.cx && x.y === a.cy)!;
    target.x += a.radius + HERO.radius + 0.1;
    run(room, a.windup + 0.2);
    expect(target.netUntil).toBeUndefined();
  });
});

describe('the sneak-thief', () => {
  it('grabs gold off you and runs; kill it and the gold drops where it falls', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'thief', x: 15, y: 12.5 }]);
    h.purse = 40;
    const t = room.enemies[0];
    const ev = run(room, 8, () => !!t.loot);
    expect(t.loot?.gold).toBeGreaterThanOrEqual(THIEF.take[0]);
    run(room, 1);
    run(room, 1);
    expect(Math.hypot(t.x - h.x, t.y - h.y)).toBeGreaterThan(1.5);
    const n = t.loot!.gold!;
    kill(t, room.events);
    run(room, 0.1);
    const drop = room.pickups.find((p) => p.gold === n);
    expect(drop).toBeTruthy();
    // Walk over it: it's back.
    Object.assign(h, { x: drop!.x, y: drop!.y });
    run(room, 0.2);
    expect(h.purse).toBe(40);
    void ev;
  });

  it('with little gold on you it takes your front potion; if it reaches the edge it is gone with it', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'thief', x: 15, y: 12.5 }]);
    Object.assign(h, { purse: 2, belt: ['bitter', 'brandy'] });
    const t = room.enemies[0];
    run(room, 8, () => !!t.loot);
    expect(t.loot?.potion).toBe('bitter');
    expect(h.belt).toEqual(['brandy']);
    const ev = run(room, 12, () => !!t.escaped);
    expect(t.escaped).toBe(true);
    expect(ev.some((e) => e.k === 'escaped')).toBe(true);
    expect(room.pickups.some((p) => p.potion === 'bitter')).toBe(false);
  });
});

describe('the log-carriers', () => {
  it('charge down the lane they showed, knock down whoever is on it and smash a crate in the way', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'log', x: 15, y: 5 }], [['me', 15, 12]], [], [{ kind: 'crate', x: 15.3, y: 9 }]);
    const l = room.enemies[0];
    expect(l.radius).toBe(LOGS.radius);
    run(room, 3, () => l.attack?.kind === 'charge');
    const a = l.attack!;
    expect(a.unblockable).toBe(true);
    expect(a.range).toBe(LOGS.charge.range);
    // A crate on the lane, between them and you: smashed.
    run(room, a.windup + 0.4);
    expect(h.hp).toBeLessThan(HERO.hp);
    expect(h.act).toBe('stun');
    expect(room.props.find((p) => p.kind === 'crate')?.broken ?? true).toBe(true);
  });

  it('sidestep the lane and it runs past; then it turns slowly', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'log', x: 15, y: 5 }], [['me', 15, 12]]);
    const l = room.enemies[0];
    run(room, 3, () => l.attack?.kind === 'charge');
    h.x += 2.5;
    run(room, l.attack!.windup + l.attack!.active + 0.1);
    expect(h.hp).toBe(HERO.hp);
    // It took its turn rate: after its run it can't have swung round to face you yet.
    const face0 = Math.atan2(l.fy, l.fx);
    run(room, 0.3);
    expect(Math.abs(Math.atan2(l.fy, l.fx) - face0)).toBeLessThanOrEqual(LOGS.turn * 0.3 + 0.01);
  });
});

describe('the roof archer', () => {
  const house = { kind: 'house' as const, x: 12, y: 3, w: 4, h: 3, hp: 200, maxHp: 200, burning: -1 };
  it('shoots from up on a roof; no blade reaches it, an arrow does', () => {
    const { room, h } = field([{ kind: 'scrapper', variant: 'roofer', bow: true, z: ROOF.z, x: 14, y: 4.2 }], [['me', 14, 7.2]], [house]);
    const r = room.enemies[0];
    run(room, 4, () => r.attack?.kind === 'shot');
    expect(r.attack?.kind).toBe('shot');
    expect(r.x).toBeCloseTo(14, 3);
    // A sword swing at it from right below does nothing.
    Object.assign(h, { x: 14, y: 6.2, fx: 0, fy: -1 });
    room.setIntent('me', { ...NO_INTENT, attackSeq: 1 });
    run(room, 0.5);
    expect(r.hp).toBe(r.maxHp);
  });

  it('a house alight throws it off, hurt, into the street', () => {
    const { room } = field([{ kind: 'scrapper', variant: 'roofer', bow: true, z: ROOF.z, x: 14, y: 4.2 }], [['me', 14, 12]], [{ ...house }]);
    const r = room.enemies[0];
    run(room, 0.2);
    room.map.blocks[0].burning = room.time;
    const ev = run(room, 0.2);
    expect(ev.some((e) => e.k === 'rooffall')).toBe(true);
    expect(r.z).toBe(0);
    expect(r.y).toBeGreaterThan(house.y + house.h);
    expect(r.hp).toBeLessThan(r.maxHp);
  });
});
