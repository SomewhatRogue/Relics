/**
 * Your heroes and the world's state, kept in this browser for now. Up to three heroes, each with its
 * own class (for life), level, gold and kit; the world (the town, the chapter, the council) is shared
 * by all of them. (The shared world moves to the server, api/world.ts, when the group plays online.)
 */
import { HERO_SLOTS, newProfile, type Profile } from '../shared/progress';
import { newWorld, type WorldState } from '../shared/story';
import { WEAPONS, upgradeOld } from '../shared/tuning';

const KEY = 'relic.save.v2', OLD = 'relic.save.v1';
export interface Save { heroes: Profile[]; current: number; world: WorldState }

/** Fill in fields a saved hero predates. */
const hero = (p: Partial<Profile>): Profile => {
  const cls = p.cls ?? (p.weapon ? WEAPONS[p.weapon].cls : 'WARRIOR');
  const out = { ...newProfile(cls, p.name), ...p, cls };
  // Before the pack, a hero kept one weapon per kind: the one in hand stays, the rest go in the pack.
  if (!p.belt) out.belt = [];
  if (p.armor === undefined) out.armor = newProfile(cls).armor;
  if (!p.rings) out.rings = [];
  out.steel ??= 0;
  out.want ??= 0;
  // Heroes made before the prologue existed don't have to play it.
  if (p.prologue === undefined) out.prologue = true;
  if (!p.bag) {
    const arms = p.arms ?? {}, inHand = arms[out.weapon];
    out.bag = Object.entries(arms).filter(([k, it]) => k !== out.weapon && it).map(([, it]) => it!);
    out.arms = inHand ? { [out.weapon]: inHand } : {};
  }
  out.arms = Object.fromEntries(Object.entries(out.arms).map(([k, it]) => [k, it && upgradeOld(it)]));
  out.bag = (out.bag ?? []).map(upgradeOld);
  return out;
};

export function load(): Save {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (s && Array.isArray(s.heroes) && s.world) {
      const heroes = s.heroes.slice(0, HERO_SLOTS).map(hero);
      return { heroes, current: Math.min(s.current ?? -1, heroes.length - 1), world: { ...newWorld(), ...s.world } };
    }
    // The first save kept one hero, unnamed: they come across as HERO, their class from their weapon.
    const v1 = JSON.parse(localStorage.getItem(OLD) ?? 'null');
    if (v1 && v1.profile && v1.world) return { heroes: [hero(v1.profile)], current: -1, world: { ...newWorld(), ...v1.world } };
  } catch {
    /* no storage here: a fresh start */
  }
  return { heroes: [], current: -1, world: newWorld() };
}

export function store(s: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private window: progress lasts this session only */
  }
}

export function wipe(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(OLD);
  } catch {
    /* nothing to wipe */
  }
}
