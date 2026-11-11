/** The Cleric's rework (shared/cleric.ts; sim/mercy.ts, holy.ts, censer.ts, flail.ts): no friendly fire, the
 *  mace's heals and smite, the holy shield, the censer's coals, the flail's spin. */
import { describe, expect, it } from 'vitest';
import { CENSER, CHARGE, FLAIL, HOLY_SHIELD, MACE, TICK, VARIANTS, WEAPONS, type WeaponId } from '../src/shared/tuning';
import { ArenaRoom } from '../src/sim/room';
import { newEnemy } from '../src/sim/enemies';
import { hitHero } from '../src/sim/combat';
import { shoot } from '../src/sim/bolts';
import { shield } from '../src/sim/holy';
import { censerCoal } from '../src/sim/lantern';
import { freeSurvivor } from '../src/sim/survivors';
import { NO_INTENT, type Enemy, type EnemyAttack, type FightEvent, type Intent } from '../src/sim/types';

/** A Cleric with `weapon` at (x, 9) facing up, a friend `pal` beside, goblins at (x, y) for each y (held in place unless `free`). */
function arena(weapon: WeaponId, ys: number[] = [7.6], o: { kind?: Enemy['kind']; free?: boolean; x?: number; variant?: Enemy['variant'] } = {}) {
  const room = new ArenaRoom(1, { scrappers: false, props: false }), x = o.x ?? 9;
  const h = room.join('me'), pal = room.join('pal');
  Object.assign(h, { weapon, x, y: 9, fx: 0, fy: -1 });
  Object.assign(pal, { weapon: 'sword', x: x + 1.2, y: 9.6, hp: 50 });
  const es = ys.map((y, i) => Object.assign(newEnemy(10 + i, o.kind ?? 'scrapper', x, y), { cooldown: 99, hp: 400, maxHp: 400, alert: true, fx: 0, fy: 1, respawns: false, variant: o.variant }));
  room.enemies = es;
  let seq = 0;
  const run = (s: number, i: Partial<Intent> = {}): FightEvent[] => {
    const out: FightEvent[] = [];
    room.setIntent('me', { ...NO_INTENT, ay: -1, ...i });
    room.setIntent('pal', NO_INTENT);
    for (let k = 0; k < Math.round(s / TICK); k++) {
      room.step();
      out.push(...room.events);
      if (!o.free) es.forEach((e, j) => Object.assign(e, { x, y: ys[j], kvx: 0, kvy: 0, cooldown: 99 }));
      else es.forEach((e) => (e.cooldown = 99));
    }
    return out;
  };
  const tap = (after = 0.7) => (seq++, run(after, { attackSeq: seq }));
  /** The whole quick combo, each press during the blow before so it chains, then `after` to watch. */
  const combo = (after = 0.5) => [...WEAPONS[weapon].combo.flatMap((s) => (seq++, run(s.windup + s.active + 0.04, { attackSeq: seq }))), ...run(after)];
  const loose = (hold: number, after: number, i: Partial<Intent> = {}) => (seq++, [...run(hold, { attackSeq: seq, attack: true, ...i }), ...run(after, { attackSeq: seq, attack: false })]);
  return { room, h, pal, es, e: es[0], run, tap, loose, combo };
}
const lost = (e: { maxHp: number; hp: number }) => e.maxHp - e.hp;
/** Hold to the white flash, or well past it. */
const flash = (w: WeaponId) => WEAPONS[w].draw! + 0.08, late = (w: WeaponId) => WEAPONS[w].draw! + 0.7;
const blow = (x: number, y: number, dmg = 10): EnemyAttack => ({ kind: 'swing', t: 1, windup: 1, active: 0.1, recover: 0.3, dmg, knock: 2, unblockable: false, dx: 0, dy: 1, ox: x, oy: y - 1.2, range: 2, arc: 90, cx: 0, cy: 0, radius: 0, done: false });

describe('a Cleric never hurts a friend', () => {
  it("a Cleric's swing passes a friend and someone freed in its arc; a Warrior's doesn't", () => {
    for (const [weapon, spared] of [['mace', true], ['censer', true], ['flail', true], ['sword', false]] as const) {
      const { room, pal, tap } = arena(weapon, [2]);
      Object.assign(pal, { x: 9, y: 7.9, hp: 100, maxHp: 100 });
      const s = freeSurvivor(room.survivors, 9.4, 8.1, -5);
      for (let i = 0; i < 3; i++) tap(0.5);
      expect(pal.hp === 100, weapon).toBe(spared);
      expect(s.hp === s.maxHp, weapon).toBe(spared);
    }
  });
  it("a Cleric's shot and blast pass friends and the freed (and knock nobody about)", () => {
    const { room, h, pal, run } = arena('mace', [2]);
    Object.assign(pal, { x: 9, y: 7, hp: 100, maxHp: 100, kvx: 0, kvy: 0 });
    const s = freeSurvivor(room.survivors, 9, 5.5, -5);
    room.bolts.push(shoot(h, { ...WEAPONS.wand.combo[0], range: 6 }, 'fire'));
    room.bolts.push({ ...shoot(h, { ...WEAPONS.wand.heavy, dmg: 30, range: 3 }, 'fire'), burst: 2.5, x: 9, y: 6.5, dx: 0, dy: -1 });
    run(0.6);
    expect(pal.hp).toBe(100);
    expect(s.hp).toBe(s.maxHp);
    expect(s.burnUntil).toBe(0);
  });
  it('a goblin a Cleric flung, or set burning, never hurts or lights someone freed; a coal never touches a friend', () => {
    const { room, pal, e, run } = arena('censer', [6], { free: true });
    const s = freeSurvivor(room.survivors, 9, 4.6, -5);
    Object.assign(e, { lastBy: 'me', kvy: -14, burnUntil: 99, burnNext: 99 });
    room.coals.push(censerCoal(pal.x, pal.y, 'me', -5));
    const hp = pal.hp;
    run(0.5);
    expect(s.hp).toBe(s.maxHp);
    expect(s.burnUntil).toBe(0);
    expect(pal.hp).toBe(hp);
  });
  it('the smite never hurts a friend in its burst', () => {
    const { pal, e, loose } = arena('mace', [6]);
    Object.assign(pal, { x: 9.4, y: 6, hp: 100, maxHp: 100 });
    loose(1.3, 0.8);
    expect(lost(e)).toBeGreaterThan(0);
    expect(pal.hp).toBe(100);
  });
});

describe('the mace', () => {
  it('short reach: a goblin the sword reaches, the mace does not', () => {
    expect(WEAPONS.mace.combo[0].range).toBeLessThan(WEAPONS.sword.combo[0].range);
    const at = 9 - (1.65 + 0.32);
    const m = arena('mace', [at]), s = arena('sword', [at]);
    m.tap(), s.tap();
    expect(lost(m.e)).toBe(0);
    expect(lost(s.e)).toBeGreaterThan(0);
  });
  it('its third blow heals a friend nearby', () => {
    const { pal, combo } = arena('mace', [7.9]);
    combo();
    expect(pal.hp).toBeGreaterThanOrEqual(50 + WEAPONS.mace.combo[2].heal!);
  });
  it("the smite's light mends a friend in the burst", () => {
    // (Aimed one tile up: the smite falls at its shortest, 1.5 ahead, on 7.5.)
    const { pal, loose } = arena('mace', [6]);
    Object.assign(pal, { x: 9.6, y: 7.5 });
    const ev = loose(late('mace'), 0.8);
    expect(ev.some((x) => x.k === 'smite')).toBe(true);
    expect(pal.hp).toBe(50 + MACE.heal);
    expect(pal.shieldHp ?? 0).toBe(0);
  });
  it('let go on the flash, the smite lands harder and shields the friends in it and the Cleric', () => {
    const plain = arena('mace', [6]), sure = arena('mace', [6]);
    Object.assign(sure.pal, { x: 9.6, y: 7.5 });
    plain.loose(late('mace'), 0.8);
    const ev = sure.loose(flash('mace'), 0.8);
    expect(ev.some((x) => x.k === 'perfect')).toBe(true);
    expect(ev.some((x) => x.k === 'holysmite')).toBe(true);
    expect(lost(sure.e)).toBeGreaterThan(lost(plain.e) * (MACE.perfect - 0.1));
    expect(sure.pal.shieldHp).toBe(HOLY_SHIELD.hp);
    expect(sure.h.shieldHp).toBe(HOLY_SHIELD.hp);
  });
});

describe('the holy shield', () => {
  it('soaks a blow, then the rest of the next, and wears off in its time', () => {
    const { room, pal, e } = arena('mace', [2]);
    Object.assign(pal, { hp: 100, maxHp: 100 });
    shield(pal, room.time, []);
    hitHero(e, blow(pal.x, pal.y, 12), pal, room.time, []);
    expect(pal.hp).toBe(100);
    expect(pal.shieldHp).toBe(HOLY_SHIELD.hp - 12);
    hitHero(e, blow(pal.x, pal.y, 12), pal, room.time + 0.5, []);
    expect(pal.hp).toBe(100 - (12 - (HOLY_SHIELD.hp - 12)));
    shield(pal, room.time, []);
    hitHero(e, blow(pal.x, pal.y, 12), pal, room.time + HOLY_SHIELD.time + 0.1, []);
    expect(pal.hp).toBe(100 - (24 - HOLY_SHIELD.hp) - 12);
  });
});

describe('the censer', () => {
  it('its swung arc leaves burning coals, and a goblin standing in one catches', () => {
    const { room, es, combo, run } = arena('censer', [2, 12.5]);
    combo();
    const mine = room.coals.filter((c) => c.owner === 'me');
    expect(mine.length).toBe(CENSER.drop);
    Object.assign(es[1], { x: mine[0].x, y: mine[0].y });
    run(TICK * 2);
    expect(es[1].burnUntil).toBeGreaterThan(room.time);
  });
  it('the spin sets alight everything around you, behind too', () => {
    const { room, es, loose } = arena('censer', [7.9, 10.1]);
    loose(late('censer'), 0.5);
    for (const e of es) expect(e.burnUntil).toBeGreaterThan(room.time);
  });
  it('swinging through your own coals bursts them and mends friends near them', () => {
    const { room, pal, combo } = arena('censer', [2]);
    const c = censerCoal(8.3, 7.7, 'me', -5);
    room.coals.push(c);
    Object.assign(pal, { x: 7.6, y: 7.9 });
    const ev = combo();
    expect(ev.some((x) => x.k === 'coalburst')).toBe(true);
    expect(room.coals.includes(c)).toBe(false);
    expect(pal.hp).toBeGreaterThanOrEqual(50 + CENSER.heal);
  });
  it('let go on the flash, the spin flares your coals into the goblins by them and shields friends near', () => {
    const { room, h, pal, es, loose } = arena('censer', [5]);
    room.coals.push(censerCoal(9, 5.6, 'me', -5));
    const ev = loose(flash('censer'), 0.5);
    expect(ev.some((x) => x.k === 'coalflare')).toBe(true);
    expect(lost(es[0])).toBeGreaterThanOrEqual(CENSER.flareDmg);
    expect(pal.shieldHp).toBe(HOLY_SHIELD.hp);
    expect(h.shieldHp).toBe(HOLY_SHIELD.hp);
  });
  it('clumsy in tight spaces: a pillar in the swing snags the chain, half the blow, no coals', () => {
    const open = arena('censer', [7.6]), tight = arena('censer', [5.6], { x: 4 });
    tight.h.y = 6.9;
    for (const a of [open, tight]) a.combo();
    const ev = tight.loose(late('censer'), 0.5);
    expect(ev.some((x) => x.k === 'snag')).toBe(true);
    expect(tight.room.coals.filter((c) => c.owner === 'me').length).toBe(0);
    expect(open.room.coals.filter((c) => c.owner === 'me').length).toBe(CENSER.drop);
  });
});

describe('the flail', () => {
  it('spins up still, and the release reaches further than a quick blow without carrying you', () => {
    const far = 9 - (2.4 + 0.32), quick = arena('flail', [far]), spin = arena('flail', [far]);
    quick.tap();
    expect(lost(quick.e)).toBe(0);
    // Spun up without the stick, then let go: the release doesn't carry you (you may walk while spinning: 2026-11-07).
    spin.run(CHARGE.start + 0.05, { attackSeq: 1, attack: true });
    expect(spin.h.act).toBe('charge');
    const at = [spin.h.x, spin.h.y];
    spin.run(late('flail'), { attackSeq: 1, attack: true });
    spin.run(WEAPONS.flail.heavy.windup + WEAPONS.flail.heavy.active + 0.05, { attackSeq: 1, attack: false });
    expect(spin.h.act).not.toBe('charge');
    expect(lost(spin.e)).toBeGreaterThan(0);
    expect(Math.hypot(spin.h.x - at[0], spin.h.y - at[1])).toBeLessThan(0.01);
    expect(WEAPONS.flail.heavy.range).toBeGreaterThan(WEAPONS.flail.combo[1].range);
  });
  it("a quick blow shoves a goblin a little; a shield-bearer's board stops the shove and the full blow", () => {
    const bare = arena('flail', [7.6], { free: true }), board = arena('flail', [7.6], { free: true, variant: 'shield' });
    bare.tap(0.6), board.tap(0.6);
    // (Both close in on the Cleric first; the bare one is thrown back past where the board stood.)
    expect(board.e.y - bare.e.y).toBeGreaterThan(0.5);
    expect(lost(board.e)).toBe(0);
    expect(WEAPONS.flail.shoves).toBe(true);
  });
  it('let go on the flash, the spin stuns what it hits (a butcher less) and shields friends near', () => {
    const s = arena('flail', [7.2]), b = arena('flail', [7.2], { kind: 'butcher' });
    const ev = s.loose(flash('flail'), TICK * 6);
    b.loose(flash('flail'), TICK * 6);
    expect(ev.some((x) => x.k === 'flailstun')).toBe(true);
    expect(s.e.act).toBe('stunned');
    expect(s.e.actDur).toBeCloseTo(FLAIL.stun, 5);
    expect(b.e.act).toBe('stunned');
    expect(b.e.actDur).toBeCloseTo(FLAIL.stun * FLAIL.big, 5);
    expect(s.pal.shieldHp).toBe(HOLY_SHIELD.hp);
    const plain = arena('flail', [7.2]);
    plain.loose(late('flail'), TICK * 6);
    expect(plain.e.act).not.toBe('stunned');
  });
  it('still a breaker, but only on the flash (Kyle, 2026-11-08): a spun blow let go on it knocks a butcher out of its heavy wind-up', () => {
    const { e, loose } = arena('flail', [7.2], { kind: 'butcher' });
    const wind = (): EnemyAttack => ({ ...blow(9, 9, 30), kind: 'cleave', t: 0, windup: 99 });
    e.attack = wind();
    e.act = 'attack';
    loose(flash('flail'), TICK * 4);
    expect(e.attack).toBeNull();
    // (The flail's perfect dazes it: what its flash does, as Kyle wants a big goblin's blow broken.)
    expect(e.act).toBe('stunned');
  });
  it('a charged blow off the flash no longer knocks a butcher out of its wind-up (Kyle, 2026-11-08)', () => {
    const { e, loose } = arena('flail', [7.2], { kind: 'butcher' });
    e.attack = { ...blow(9, 9, 30), kind: 'cleave', t: 0, windup: 99 };
    e.act = 'attack';
    loose(late('flail') - CHARGE.start, TICK * 4);
    expect(e.attack).not.toBeNull();
    expect(e.act).toBe('attack');
  });
});
