/**
 * Your heroes and the world's state, kept in this browser for now. Up to three heroes, each with its
 * own class (for life), level, gold and kit; the world (the town, the chapter, the council) is shared
 * by all of them. (The shared world moves to the server, api/world.ts, when the group plays online.)
 */
import { fitDeepBest } from '../shared/deepskill';
import { deepTest } from './deeptest';
import type { Pending } from '../shared/trade';
import { HERO_SLOTS, fitPerks, newProfile, newStats, type Profile } from '../shared/progress';
import { newWorld, type WorldState } from '../shared/story';
import { DORMANT_POTIONS, WEAPONS, fitPlus, upgradeOld } from '../shared/tuning';
import { fitStores } from '../shared/bags';
import { fitRelics } from '../shared/relicitems';
import { fitEarned } from '../shared/relicreset';
import { renameKits } from '../shared/oldkits';
import { fitOldSkills } from '../shared/oldskills';
import { fitHound } from '../shared/houndlook';
import { fitShield } from '../shared/shieldlook';
import { wearable, wearsCloth } from '../shared/clothlook';
import { fitNoParry } from '../shared/oldparry';
import { fitFishRecord } from '../shared/fishing';
import { fitRangeRecord } from '../shared/range';
import { fitArmRecord } from '../shared/armwrestle';
import { fitKnifeRecord } from '../shared/knives';
import { fitShiftRecord } from '../shared/shiftpay';
import { fitErrands } from '../shared/errands';
import { fitQuests } from '../shared/heroquests';
import { fitPurse } from '../shared/coins';
import { fitRanks } from '../shared/drills';

const KEY = 'relic.save.v2', OLD = 'relic.save.v1';
/** `savedAt`: when it was last kept here (it only goes forward), to tell which copy is newer (recovery.ts). */
/** `trade`: one this browser accepted on the server and hasn't settled yet (client/tradesave.ts). */
export interface Save { heroes: Profile[]; current: number; world: WorldState; savedAt?: number; /** The fresh start it's been through (FRESH). */ epoch?: number; trade?: Pending; /** A class being tried (trial.ts): never written. */ trial?: boolean }

/** Fill in fields a saved hero predates. */
const hero = (old: Partial<Profile>): Profile => {
  // The hand crossbow is the poisoner's kit now, the lance rod the spellblade (shared/oldkits.ts).
  const p = renameKits(old);
  const cls = p.cls ?? (p.weapon ? WEAPONS[p.weapon].cls : 'WARRIOR');
  const out = { ...newProfile(cls, p.name), ...p, cls };
  // Before the pack, a hero kept one weapon per kind: the one in hand stays, the rest go in the pack.
  if (!p.belt) out.belt = [];
  // Lamp Oil and the frost and smoke flasks are gone from the game (Kyle, 2026-11-04): any on a belt become Bitter.
  out.belt = out.belt.map((x) => (DORMANT_POTIONS.includes(x) ? 'bitter' : x));
  // The Mage's class skill was the Elemental Channel; switching element has its own button now and the
  // skill a Mage was taught is GRASP (Kyle, 2026-11-04). Taught the one, you know the other.
  if ((out.skill as string) === 'channel') out.skill = 'grasp';
  // Shadow Step is the Rogue's own button now; a Rogue who carried it gets Smoke Bomb (shared/oldskills.ts).
  if (!p.signs) fitOldSkills(out);
  if (p.armor === undefined) out.armor = newProfile(cls).armor;
  if (!p.rings) out.rings = [];
  out.steel ??= 0;
  // The purse into copper at the new prices, once (shared/coins.ts, economy.md section 6).
  fitPurse(out, p);
  // Five small stat ranks to three big ones, the same total, once (shared/drills.ts).
  fitRanks(out, p);
  // Heroes from before the longer Roll start the new tallies at nothing.
  out.stats = { ...newStats(), ...(p.stats ?? {}) };
  out.want ??= 0;
  // A Ranger's hound (shared/houndlook.ts): heroes from before the choice get the wolfhound and a name.
  if (cls === 'RANGER') out.hound = fitHound(p.hound, out.id);
  else delete out.hound;
  // A Warrior's shield (shared/shieldlook.ts): heroes from before the choice carry the red heater.
  if (cls === 'WARRIOR') out.shield = fitShield(p.shield);
  else delete out.shield;
  // The cloth worn (shared/clothlook.ts): kept as far as it's earned, for a class the tailor has cloth for.
  if (wearsCloth(cls) && p.cloth) out.cloth = wearable({ stats: out.stats, deepBest: p.deepBest, quests: p.quests, level: p.level ?? 1 }, p.cloth);
  else delete out.cloth;
  // Relics before they had charge: each kind owned becomes a full plain relic (shared/relicitems.ts).
  Object.assign(out, fitRelics(p as never, out.xp * 31 + out.runs + 7));
  // Relics are earned now (docs/design/relics.md): an older hero keeps the javelin only, once (shared/relicreset.ts).
  fitEarned(out, p);
  // Heroes made before the prologue existed don't have to play it.
  if (p.prologue === undefined) out.prologue = true;
  if (!p.bag) {
    const arms = p.arms ?? {}, inHand = arms[out.weapon];
    out.bag = Object.entries(arms).filter(([k, it]) => k !== out.weapon && it).map(([, it]) => it!);
    out.arms = inHand ? { [out.weapon]: inHand } : {};
  }
  out.arms = Object.fromEntries(Object.entries(out.arms).map(([k, it]) => [k, it && upgradeOld(it)]));
  out.bag = (out.bag ?? []).map(upgradeOld);
  // The pack, the vault and the buyback (shared/bags.ts): older heroes keep every piece.
  fitStores(out);
  // Pluses stop at +5 (shared/forgeplus.ts, 2026-11-06): anything over comes down to +5, its temper kept.
  fitAllPlus(out);
  // PARRY is gone (2026-11-05): any piece with it has BLOCK or DODGE instead, worth the same (shared/oldparry.ts).
  fitNoParry(out);
  // The town's pastimes (shared/fishing.ts, shared/range.ts): only once played, and made sound.
  if (p.fishing) out.fishing = fitFishRecord(p.fishing);
  if (p.range) out.range = fitRangeRecord(p.range);
  if (p.arm) out.arm = fitArmRecord(p.arm);
  if (p.knives) out.knives = fitKnifeRecord(p.knives);
  if (p.shift) out.shift = fitShiftRecord(p.shift);
  if (p.strikes !== undefined) out.strikes = Math.max(0, Math.floor(Number(p.strikes) || 0));
  // Town errands (shared/errands.ts): a hero from before them has done them all, and is never sent on the first two.
  out.errands = fitErrands(p.errands, out.level);
  // Hero quests (shared/heroquests.ts): an old hero has done every one up to their level.
  out.quests = fitQuests(p.quests, out.level);
  // Knacks onto the tree: one the class can't use comes back as a pick (shared/chains.ts).
  out.perks = [...(out.perks ?? [])];
  fitPerks(out);
  return out;
};

/** The testers' fresh start (Kyle, 2026-11-16: "reset all characters ... I want my testers to try it net new"):
 *  a save from before it (here or brought from the server) loses every hero but those kept, and with none kept
 *  its town starts over too. The shared world, Best in Wickhold, the Roll and the names start over on the
 *  server (api/_world.ts, api/_names.ts). Raise FRESH to do it again. */
export const FRESH = 2;
const KEPT = (p: Partial<Profile>) => p.name === 'ASHE' && p.cls === 'MAGE';

/** A save as it comes in from outside (this browser, or the server under a recovery code): past the fresh
 *  start, then filled in. */
export const fromStored = (s: Partial<Save> | null) => fromJson(fresh(s));

/** Through the fresh start, if it's from before it. */
export function fresh(s: Partial<Save> | null): Partial<Save> | null {
  if (!s || !Array.isArray(s.heroes) || !s.world || (s.epoch ?? 1) >= FRESH) return s;
  const kept = s.heroes.filter(KEPT);
  return { ...s, heroes: kept, current: -1, world: kept.length ? s.world : newWorld(), epoch: FRESH };
}

/** A save as kept, with older heroes filled in. */
export function fromJson(s: Partial<Save> | null): Save | null {
  if (!s || !Array.isArray(s.heroes) || !s.world) return null;
  const heroes = s.heroes!.slice(0, HERO_SLOTS).map(hero);
  // The Deep's deepest floor (shared/deepskill.ts): an older hero's from their saved run or the Deep's boards.
  for (const h of heroes) if (h.deepBest || h.deep || s.world!.deepSolo || s.world!.deepParty) h.deepBest = fitDeepBest(h, [s.world!.deepSolo, s.world!.deepParty]) || undefined;
  return { heroes, current: Math.min(s.current ?? -1, heroes.length - 1), world: { ...newWorld(), ...s.world! }, savedAt: Number(s.savedAt) || 0, epoch: FRESH, ...(s.trade ? { trade: s.trade } : {}) };
}

export function load(): Save {
  try {
    const s = fromStored(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
    // (Test hooks: ?deepbest=20, &deepskill=1: client/deeptest.ts.)
    if (s) return s.heroes.forEach(deepTest), s;
    // (The first save, one hero unnamed, is from before the fresh start: FRESH. It starts over.)
  } catch {
    /* no storage here: a fresh start */
  }
  return { heroes: [], current: -1, world: newWorld(), epoch: FRESH };
}

let listener: (() => void) | null = null;
/** Told after every store (recovery.ts sends the save on to the server a little later). */
export const onStore = (f: () => void) => void (listener = f);

/** Keep it; `at` keeps a copy's own time (one brought from the server), else it moves forward. */
export function store(s: Save, at?: number): void {
  if (s.trial) return;
  // (Every save kept is past the fresh start, however it was made.)
  s.epoch = FRESH;
  s.savedAt = at ?? Math.max(Date.now(), (s.savedAt ?? 0) + 1);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private window: progress lasts this session only */
  }
  listener?.();
}

export function wipe(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(OLD);
  } catch {
    /* nothing to wipe */
  }
}

/** Every piece a hero has (in hand, worn, packed, in the vault, at Tobin's) at +5 at most. */
export function fitAllPlus(p: Pick<Profile, 'arms' | 'armor' | 'rings' | 'bag' | 'stash' | 'buyback'>): void {
  p.arms = Object.fromEntries(Object.entries(p.arms ?? {}).map(([k, it]) => [k, it && fitPlus(it)]));
  if (p.armor) p.armor = fitPlus(p.armor);
  p.rings = (p.rings ?? []).map(fitPlus);
  p.bag = (p.bag ?? []).map(fitPlus);
  if (p.stash) p.stash = p.stash.map(fitPlus);
  if (p.buyback) p.buyback = p.buyback.map((b) => ({ ...b, item: fitPlus(b.item) }));
}
