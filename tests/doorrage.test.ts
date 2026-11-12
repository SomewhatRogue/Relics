// The Doorkeepers retuned (Kyle, 2026-11-06: "too easy ... don't chase a ton and attack too slow", "shields in front
// didn't do a ton", "when one's dead it should enrage the other", and the plate "should be up top"): the Door Jab
// lands, is blocked and is dodged; the door shut from 70 degrees either side, and shut through a jab; ENRAGED's
// numbers and floors; the plate at the top of the screen (hud.css).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSS, DOORKEEPERS, HERO, TICK, WEAPONS, type DoorMove } from '../src/shared/tuning';
import { hitEnemy } from '../src/sim/combat';
import { doorShut } from '../src/sim/doorwall';
import { doorWindup, enraged } from '../src/sim/bosskit';
import { keeperPause } from '../src/sim/doorkeepers';
import { barn, blow, place, run, still, wake } from './bossarena';

const D = DOORKEEPERS, E = D.enrage;
const hurt = (b: ReturnType<typeof barn>) => b.heroes[0].hp < b.heroes[0].maxHp;

describe('the Door Jab: quick, light, red', () => {
  const jab = (kit: 'sword' | 'daggers', say: Parameters<typeof run>[2] = () => ({})) => {
    const b = barn([kit], [[6, 6.6]]);
    wake(b);
    still(b.latch);
    place(b.latch, 1.2, 1.6);
    place(b.hasp, 6, 5, 0, 1);
    blow(b.hasp, 'jab', b.heroes[0]);
    const a = b.hasp.attack!;
    const ev = run(b, 1.4, say);
    return { b, a, ev };
  };
  it('a 0.55 to 0.65 s floor, light, red; a mover mixes it in between every big one', () => {
    expect(D.jab.windup).toBeGreaterThanOrEqual(0.55);
    expect(D.jab.windup).toBeLessThanOrEqual(0.65);
    expect(D.jab.unblockable).toBe(false);
    expect(D.jab.dmg).toBeLessThan(D.sweep.dmg / 2);
    for (const p of [1, 2] as const) {
      const r = D.rotation[p];
      expect(r.filter((m) => m === 'jab').length).toBeGreaterThanOrEqual(r.length / 2 - 1);
    }
  });
  it('lands; a held block takes it (no rebound: it fills no POISE); a dodge goes through it (and fills none)', () => {
    const land = jab('sword');
    expect(land.a.windup).toBeCloseTo(D.jab.windup + BOSS.tell, 6);
    expect(hurt(land.b)).toBe(true);
    expect(land.b.heroes[0].maxHp - land.b.heroes[0].hp).toBeLessThanOrEqual(D.jab.dmg * 2);
    const bl = jab('sword', () => ({ block: true, ax: 0, ay: -1 }));
    expect(hurt(bl.b)).toBe(false);
    expect(bl.ev.some((e) => e.k === 'block')).toBe(true);
    expect(bl.ev.some((e) => e.k === 'rebound')).toBe(false);
    expect(bl.b.hasp.boss!.poise).toBe(0);
    const dg = jab('daggers', (_h, t) => (t >= D.jab.windup + BOSS.tell - 0.08 ? { mx: 1, my: 0, rollSeq: 1 } : {}));
    expect(hurt(dg.b)).toBe(false);
    expect(dg.ev.some((e) => e.k === 'dodge')).toBe(true);
    expect(dg.b.hasp.boss!.poise).toBe(0);
  });
  it('the wall jabs at whoever stands in its face', () => {
    const go = (hy: number) => {
      const b = barn(['sword'], [[6, hy]]);
      wake(b);
      still(b.hasp);
      place(b.hasp, 10.5, 12);
      place(b.latch, 6, 5, 0, 1);
      b.latch.boss!.job = 'wall';
      let jabbed = false;
      run(b, 1.5, (h) => ((h.hp = h.maxHp), (jabbed ||= b.latch.attack?.boss === 'jab'), {}));
      return jabbed;
    };
    expect(go(6.8)).toBe(true);
  });
});

describe('the door from the front', () => {
  /** A sword blow on Latch (facing down) from a hero `deg` degrees off its front, 1.2 tiles off. */
  const at = (deg: number, setUp: (b: ReturnType<typeof barn>) => void = () => {}) => {
    const b = barn(['sword'], [[6, 7]]);
    wake(b);
    place(b.latch, 6, 5, 0, 1);
    setUp(b);
    const r = (deg * Math.PI) / 180, h = b.heroes[0];
    Object.assign(h, { x: 6 + Math.sin(r) * 1.2, y: 5 + Math.cos(r) * 1.2, hitIds: [] });
    (h.fx = 6 - h.x), (h.fy = 5 - h.y);
    return hitEnemy(h, WEAPONS.sword.combo[0], b.latch, b.room.time, []);
  };
  it('shut, it takes nothing from within about 70 degrees either side of its front (as the Planker), in full from beyond', () => {
    expect(Math.acos(D.cone) * (180 / Math.PI)).toBeCloseTo(70, 0);
    for (const deg of [0, 30, -50, 65, -68]) expect(at(deg)).toBe(0);
    for (const deg of [80, -100, 180]) expect(at(deg)).toBeGreaterThan(0);
  });
  it('shut through its own jab; aside only a short while after a big blow lands, never its whole recover', () => {
    const b = barn(['sword'], [[6, 6.6]]);
    wake(b);
    still(b.latch);
    place(b.latch, 1.2, 1.6);
    place(b.hasp, 6, 5, 0, 1);
    blow(b.hasp, 'jab', b.heroes[0]);
    let open = 0;
    run(b, 1.3, (h) => ((h.hp = h.maxHp), (open += doorShut(b.hasp, b.room.time) ? 0 : 1), {}));
    expect(open).toBe(0);
    for (const m of ['sweep', 'charge', 'lock'] as DoorMove[]) expect(D.aside[m]).toBeLessThanOrEqual(D[m].recover);
    expect(D.aside.sweep).toBeLessThan(D.sweep.recover);
    place(b.hasp, 6, 5, 0, 1);
    b.hasp.boss!.openUntil = -9;
    // (The sweep's own opening went to the bash straight after it: boss-threat.md step 3.)
    expect(D.aside.sweep).toBe(0);
    blow(b.hasp, 'bash', b.heroes[0]);
    const a = b.hasp.attack!, shutAgain = a.windup + a.active + D.aside.bash;
    run(b, a.windup + a.active + 0.05, (h) => ((h.hp = h.maxHp), {}));
    expect(doorShut(b.hasp, b.room.time)).toBe(false);
    run(b, shutAgain - (a.windup + a.active + 0.05) + 2 * TICK, (h) => ((h.hp = h.maxHp), {}));
    expect(b.hasp.attack?.boss).toBe('bash');
    expect(doorShut(b.hasp, b.room.time)).toBe(true);
  });
});

describe('ENRAGED: one dead, the other quicker and harder', () => {
  const slowest = Math.min(...Object.values(WEAPONS).map((w) => HERO.speed * (w.speed ?? 1)));
  it('pace and wind-ups 20 to 25% quicker, never under the floors; +25% damage; Door Spin more often', () => {
    expect(E.pace).toBeGreaterThanOrEqual(1.2);
    expect(E.pace).toBeLessThanOrEqual(1.25);
    expect(1 - E.windup).toBeGreaterThanOrEqual(0.2 - 1e-9);
    expect(1 - E.windup).toBeLessThanOrEqual(0.25 + 1e-9);
    expect(E.dmg).toBe(1.25);
    for (const m of ['jab', 'sweep', 'charge', 'spin'] as DoorMove[]) {
      const s = D[m], w = doorWindup(m, true);
      expect(w).toBeLessThan(s.windup);
      if (m === 'jab') expect(w).toBeGreaterThanOrEqual(0.55);
      else if (!s.unblockable) expect(w).toBeGreaterThanOrEqual(0.9);
      else {
        expect(w).toBeGreaterThanOrEqual(1.1);
        expect((s.radius! + HERO.radius) / slowest).toBeLessThanOrEqual(w * 0.6 + 1e-9);
      }
    }
    const share = (p: 1 | 2) => D.rotation[p].filter((m) => m === 'spin').length / D.rotation[p].filter((m) => m !== 'jab').length;
    expect(share(2)).toBeGreaterThan(0.5);
  });
  it('the survivor: roars, then its blows come quicker and harder with a growl, and it rests less', () => {
    const b = barn(['sword'], [[6, 7]]);
    wake(b);
    Object.assign(b.latch, { hp: 0, act: 'dead' });
    run(b, BOSS.roar + 0.1, (h) => ((h.hp = h.maxHp), {}));
    expect(enraged(b.hasp)).toBe(true);
    expect(keeperPause(b.hasp)).toBeCloseTo(D.pause * E.windup, 6);
    place(b.hasp, 6, 5.2, 0, 1);
    const ev = blow(b.hasp, 'sweep', b.heroes[0]), a = b.hasp.attack!;
    expect(a.windup).toBeCloseTo(doorWindup('sweep', true) + BOSS.tell, 6);
    expect(a.dmg).toBeGreaterThanOrEqual(Math.round(D.sweep.dmg * E.dmg));
    expect(ev.some((e) => e.k === 'growl')).toBe(true);
    const jev = (place(b.hasp, 6, 5.2, 0, 1), blow(b.hasp, 'jab', b.heroes[0]));
    expect(b.hasp.attack!.windup).toBeCloseTo(0.55 + BOSS.tell, 6);
    expect(jev.some((e) => e.k === 'growl')).toBe(false);
  });
  it('a living pair is not enraged, and their blows keep their own times', () => {
    const b = barn(['sword'], [[6, 6.6]]);
    wake(b);
    expect(enraged(b.hasp) || enraged(b.latch)).toBe(false);
    blow(b.hasp, 'sweep', b.heroes[0]);
    expect(b.hasp.attack!.windup).toBeCloseTo(D.sweep.windup + BOSS.tell, 6);
    expect(keeperPause(b.hasp)).toBe(D.pause);
  });
});

describe('the plate at the top of the screen', () => {
  const css = readFileSync(new URL('../src/client/hud.css', import.meta.url), 'utf8');
  const rule = (sel: string) => css.split('\n').find((l) => l.startsWith(sel + ' {')) ?? '';
  it('a laptop: top centre; a phone: just under the top row; never at the bottom', () => {
    expect(rule('#boss')).toMatch(/top: calc\(8px/);
    expect(rule('#boss')).toMatch(/bottom: auto/);
    expect(rule('#boss')).toMatch(/left: 50%; transform: translateX\(-50%\)/);
    expect(rule('body.touch #boss')).toMatch(/top: calc\(76px/);
    expect(rule('body.touch #boss')).not.toMatch(/bottom/);
    // (No laptop rule anywhere puts it back at the bottom over the key bar.)
    expect(readFileSync(new URL('../src/client/keybar.css', import.meta.url), 'utf8')).not.toMatch(/#boss/);
  });
  it('the tracker, the tip and the party card step down under it while it is up', () => {
    for (const sel of ['#banner', 'body.touch #banner', '#tip', 'body.touch #tip', 'body.touch #partyhud']) expect(rule(sel)).toMatch(/var\(--boss-push, 0px\)/);
  });
});
