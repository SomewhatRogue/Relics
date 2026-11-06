/**
 * The upgrade screens (Kyle, 2026-11-05: "the UX/UI of the upgrades is really confusing, we should have
 * it be screens and more visual"): every tile's state (learned, can buy, short of gold, locked with why,
 * maxed), the forks (CARRY ONE for the skills, PICK ONE for the knacks on offer, and a permanent one as
 * the guard upgrades will be), the detail view's numbers and button, and nothing about the rules changed.
 */
import { describe, expect, it } from 'vitest';
import { newProfile, drillPrice } from '../src/shared/tuning';
import { learnLesson } from '../src/shared/training';
import { perkOffer } from '../src/shared/chains';
import { allTiles, markFork, tileDetail, upgradeTabs, type UpTile, type UpTrack } from '../src/client/upgrades';
import { upTrack } from '../src/client/upgradeview';

const hero = (cls: Parameters<typeof newProfile>[0], level: number, gold: number) => Object.assign(newProfile(cls), { level, gold });
const at = { atTrainer: true, knacksOpen: true };
const tile = (p: ReturnType<typeof hero>, key: string, o = at): UpTile => allTiles(upgradeTabs(p, o)).find((t) => t.key === key)!;

describe('tiles', () => {
  it('a stat rank: locked by level, then can buy, short of gold, and maxed', () => {
    const p = hero('WARRIOR', 1, 0);
    expect(tile(p, 'drill:power')).toMatchObject({ state: 'locked', lock: 'NEEDS LEVEL 2', badge: 'NEEDS LEVEL 2', act: '' });
    p.level = 2;
    expect(tile(p, 'drill:power')).toMatchObject({ state: 'poor', badge: `${drillPrice('power', 0)} GOLD, NOT ENOUGH`, act: '' });
    p.gold = 1000;
    expect(tile(p, 'drill:power')).toMatchObject({ state: 'buy', badge: `${drillPrice('power', 0)} GOLD`, act: 'buy' });
    expect(tile(p, 'drill:power').pips).toEqual(['off', 'lock', 'lock', 'lock', 'lock']);
    p.drills = { power: 5 };
    expect(tile(p, 'drill:power')).toMatchObject({ state: 'max', badge: 'MAX' });
    // Every tile has a picture key, a name and a line.
    for (const t of allTiles(upgradeTabs(p, at))) expect(t.icon && t.name && t.line).toBeTruthy();
  });

  it('a technique waits on the one before it; a Ranger\'s first waits on the snare', () => {
    const p = hero('WARRIOR', 7, 5000);
    expect(tile(p, 'tech:slam')).toMatchObject({ state: 'buy' });
    expect(tile(p, 'tech:shoulder')).toMatchObject({ state: 'locked', lock: 'NEEDS WIDE SLAM FIRST' });
    p.drills = { technique: 1 };
    expect(tile(p, 'tech:slam')).toMatchObject({ state: 'owned', badge: 'LEARNED' });
    expect(tile(p, 'tech:shoulder')).toMatchObject({ state: 'buy' });
    expect(tile(p, 'tech:ironfeet')).toMatchObject({ state: 'locked', lock: 'NEEDS LEVEL 10' });
    const r = hero('RANGER', 5, 5000);
    expect(tile(r, 'tech:trapper')).toMatchObject({ state: 'locked', lock: 'NEEDS SNARE FIRST' });
    expect(tile(r, 'learn:leave')).toMatchObject({ state: 'buy', icon: 's:net' });
  });

  it('the skills are a fork, CARRY ONE: the one carried is marked, another known can be carried, the rest wait', () => {
    const p = hero('WARRIOR', 5, 5000);
    const skills = upgradeTabs(p, at)[0].tracks[0];
    expect(skills.steps).toHaveLength(1);
    expect(skills.steps[0].fork).toBe('CARRY ONE');
    expect(skills.steps[0].tiles.map((t) => t.state)).toEqual(['buy', 'locked', 'locked']);
    expect(skills.steps[0].tiles[1].lock).toBe('NEEDS SHIELD CHARGE FIRST');
    expect(learnLesson(p, 'skill')).toBe(true);
    const [a, b] = upgradeTabs(p, at)[0].tracks[0].steps[0].tiles;
    expect(a).toMatchObject({ state: 'owned', current: true, badge: 'CARRYING', act: '' });
    expect(b).toMatchObject({ state: 'buy', act: 'buy' });
    p.taught = ['horn'];
    const [, c] = upgradeTabs(p, at)[0].tracks[0].steps[0].tiles;
    expect(c).toMatchObject({ state: 'owned', act: 'carry' });
    expect(c.current).toBeFalsy();
  });

  it('knacks: the two on offer are a fork, PICK ONE, taken only out of a fight; later steps say what they need', () => {
    const p = Object.assign(hero('MAGE', 3, 0), { picks: 1 });
    const offer = perkOffer(p), tabs = upgradeTabs(p, at), knacks = tabs.find((t) => t.id === 'knacks')!;
    expect(knacks.tracks[0].steps[0].fork).toBeUndefined();
    expect(knacks.tracks[0].steps[0].tiles.map((t) => t.key)).toEqual(offer.map((id) => 'knack:' + id));
    for (const t of knacks.tracks[0].steps[0].tiles) expect(t).toMatchObject({ state: 'pick', act: 'pick' });
    expect(knacks.ready).toBe(1);
    expect(tile(p, 'knack:m_leap')).toMatchObject({ state: 'locked', lock: 'NEEDS QUICK BLINK FIRST' });
    // On a job: a look only.
    const away = upgradeTabs(p, { atTrainer: false, knacksOpen: false }).find((t) => t.id === 'knacks')!;
    expect(away.tracks[0].steps[0].tiles.every((t) => t.act === '')).toBe(true);
    expect(away.ready).toBe(0);
    p.perks = ['m_blink'];
    expect(tile(p, 'knack:m_blink')).toMatchObject({ state: 'owned', badge: 'TAKEN' });
    expect(tile(p, 'knack:m_leap').lock).toBe('');
  });

  it('a permanent fork (as the guard upgrades will be) marks the choice and shuts the other, and draws as a fork', () => {
    const p = hero('WARRIOR', 10, 5000);
    const a = tile(p, 'tech:slam'), b = tile(p, 'tech:shoulder');
    const open = markFork([a, b], undefined, true);
    expect(open.map((t) => t.state)).toEqual([a.state, b.state]);
    const made = markFork([a, b], a.key, true);
    expect(made[0]).toMatchObject({ current: true, badge: 'CHOSEN' });
    expect(made[1]).toMatchObject({ state: 'locked', badge: 'NOT CHOSEN', act: '' });
    const track: UpTrack = { id: 'guard', title: 'GUARD', sum: '', kind: 'track', steps: [{ tiles: [tile(p, 'rung:tauntguard')] }, { tiles: made, fork: 'CHOOSE ONE' }] };
    const html = upTrack(track);
    expect(html).toContain('up-fork n2');
    expect(html).toContain('CHOOSE ONE');
    expect(html.match(/data-tile=/g)).toHaveLength(3);
    expect(html).toContain('up-tile s-owned cur');
  });
});

describe('a tile opened', () => {
  it('says now and after, every rank, and the button; away from the trainer it says where to buy it', () => {
    const p = hero('WARRIOR', 4, 1000);
    p.drills = { power: 1 };
    const d = tileDetail(p, 'drill:power', at)!;
    expect(d.now).toBe('+5% damage');
    expect(d.after).toBe('+10% damage');
    expect(d.ladder).toHaveLength(5);
    expect(d.button).toEqual({ label: `RANK 2: ${drillPrice('power', 1)} GOLD`, act: 'buy', on: true });
    const away = tileDetail(p, 'drill:power', { atTrainer: false, knacksOpen: true }, { who: 'Master Cole', where: 'the barracks' })!;
    expect(away.button?.on).toBe(false);
    expect(away.note).toBe('Master Cole teaches this at the barracks.');
    const locked = tileDetail(hero('WARRIOR', 1, 0), 'drill:power', at)!;
    expect(locked.button).toMatchObject({ label: 'NEEDS LEVEL 2', on: false });
    const k = tileDetail(Object.assign(hero('WARRIOR', 3, 0), { perks: ['w_wide'] }), 'knack:w_block', at)!;
    expect(k.now).toBe('block +20 degrees');
    expect(k.after).toBe('block +20 degrees, block -25% stamina');
  });

  it('reading the screens changes nothing on the hero', () => {
    const p = Object.assign(hero('HEALER', 6, 700), { picks: 2 });
    const before = JSON.stringify(p);
    for (const t of allTiles(upgradeTabs(p, at))) tileDetail(p, t.key, at);
    expect(JSON.stringify(p)).toBe(before);
  });
});
