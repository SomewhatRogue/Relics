/**
 * A hero's kit is theirs: what the room changes on them (a pickup, a weapon swapped from the pack, a
 * potion drunk, a relic carried, a coal fed to the censer, the Mage's element) goes into their save
 * the moment it changes, leading or following. And a room brought back from an older save (a leader's
 * reload, a friend taking the job on) is dressed again from the save, so it never hands back an older
 * pack: the profile is always the newer word on a hero's own kit.
 */
import type { Profile } from '../shared/progress';
import { bagSize } from '../shared/bags';
import { refreshHealth } from '../sim/gearstats';
import type { ArenaRoom } from '../sim/room';
import type { Hero } from '../sim/types';

type Kit = Pick<Profile, 'weapon' | 'arms' | 'bag' | 'armor' | 'rings' | 'belt' | 'glow' | 'relic' | 'relics'> & { channel: string };

const fromHero = (h: Hero, p: Profile): Kit => ({
  weapon: h.weapon ?? p.weapon, arms: h.arms ?? p.arms, bag: h.bag ?? p.bag, armor: h.armor === undefined ? p.armor : h.armor, rings: h.rings ?? p.rings,
  belt: h.belt ?? p.belt, glow: h.glow ?? p.glow, relic: h.relics ? (h.relics[1] ? h.relicItem ?? '' : '') : p.relic, relics: h.found ?? p.relics, channel: h.augments?.channel ?? p.augments.channel ?? '',
});
const fromProfile = (p: Profile): Kit => ({ weapon: p.weapon, arms: p.arms, bag: p.bag, armor: p.armor, rings: p.rings, belt: p.belt, glow: p.glow, relic: p.relic, relics: p.relics, channel: p.augments.channel ?? '' });

/** A relic's charge is spent in the room: compared by id and charge, kept as copies. */
const relicSig = (rs: Profile['relics']) => rs.map((r) => r.id + ':' + r.charge).join(',');
const sameList = <T>(a: T[], b: T[]) => a.length === b.length && a.every((x, i) => x === b[i]);
const same = (a: Kit, b: Kit) => a.weapon === b.weapon && a.glow === b.glow && a.relic === b.relic && a.channel === b.channel && a.armor === b.armor
  && relicSig(a.relics) === relicSig(b.relics) && sameList(a.bag, b.bag) && sameList(a.rings, b.rings) && sameList(a.belt, b.belt) && sameList(Object.entries(a.arms).flat(), Object.entries(b.arms).flat());

/**
 * The room's word on this hero's kit, into their profile. True when anything changed (the caller
 * stores the save). `copy`: a friend's hero comes from the leader's patches, so its pieces are copied;
 * the leader's own shares its pieces with the profile (the forge swaps a piece in both at once).
 */
export function keepKit(p: Profile, h: Hero, copy: boolean): boolean {
  const now = fromHero(h, p);
  // (The same pieces, as the leader's own nearly always has: no need to look closer.)
  if (same(now, fromProfile(p))) return false;
  if (JSON.stringify(now) === JSON.stringify(fromProfile(p))) return false;
  const k = copy ? (JSON.parse(JSON.stringify(now)) as Kit) : now;
  Object.assign(p, { weapon: k.weapon, arms: { ...k.arms }, bag: [...k.bag], armor: k.armor, rings: [...k.rings], belt: [...k.belt], glow: k.glow, relic: k.relic, relics: k.relics.map((r) => ({ ...r })) });
  p.augments.channel = k.channel as Profile['augments']['channel'];
  return true;
}

/** Dress a restored hero's kit from their profile (their health and the rest stay as the room had them). */
export function dressKit(h: Hero, p: Profile): void {
  const k = JSON.parse(JSON.stringify(fromProfile(p))) as Kit;
  Object.assign(h, { weapon: k.weapon, arms: k.arms, bag: k.bag, armor: k.armor, rings: k.rings, belt: k.belt, glow: k.glow, found: k.relics, bagSize: bagSize(p) });
  refreshHealth(h);
}

/** A piece already in this profile isn't also left lying in a restored room (taken just before the save). */
export function forgetTaken(rooms: ArenaRoom[], p: Profile): void {
  const mine = new Set([...p.bag, ...Object.values(p.arms), p.armor, ...p.rings].filter(Boolean).map((it) => JSON.stringify(it)));
  for (const r of rooms) r.drops = r.drops.filter((d) => !mine.has(JSON.stringify(d.item)));
}
