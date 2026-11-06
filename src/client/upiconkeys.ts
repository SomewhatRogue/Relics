/**
 * Which picture each upgrade tile wears (upgrades.ts), as a key upicons.ts draws: 'i:' one of the HUD's
 * icons (icons.ts), 's:' a skill's (skillicons.ts), 'u:' one drawn for these screens (upicons.ts).
 * Knacks go by what they move (their first fx key), so a new knack gets a fitting picture for nothing.
 * Pure: no drawing here.
 */
import { PERKS, type FxKey, type PerkId } from '../shared/perks';
import type { DrillId } from '../shared/drills';
import type { TechId } from '../shared/techniques';
import type { RungId } from '../shared/ladder';

const DRILL: Partial<Record<DrillId, string>> = { power: 'u:sword', health: 'i:heart', speed: 'u:boot', crit: 'u:star', wind: 'u:breath', skill: 'u:hourglass' };
const TECH: Record<TechId, string> = {
  slam: 'i:slam', shoulder: 'u:boot', ironfeet: 'u:plate', knifework: 'u:drop', slip: 's:vanish', cutpurse: 'i:coin',
  trapper: 's:net', quicknock: 's:volley', steady: 's:mark', mending: 'i:help', sanctstep: 's:sanctuary', judgement: 's:light',
  primed: 's:fire', attuned: 's:storm', spellthief: 's:grasp',
};
const RUNG: Record<RungId, string> = {
  airshot: 's:volley', twinsnare: 's:net', landing: 'i:jump', blinkburst: 's:firering', blinkthrough: 'i:blink', halfblink: 's:tether',
  caltrops: 's:knives', underlegs: 'i:dash', shakeoff: 'i:poison', shelter: 's:ward', allyward: 'i:help', blockmend: 's:heal',
  tauntguard: 's:horn', ironstance: 'u:plate', standfast: 's:stamp',
};
/** A knack by what it moves. (`dodge`, `leap` and `light` are the class's own dodge: by the knack's letter.) */
const FX: Partial<Record<FxKey, string>> = {
  guardArc: 'i:block', block: 'i:block', counterTime: 'u:counter', counter: 'u:counter', health: 'i:heart', tough: 'u:plate', foot: 'u:boot',
  draw: 'u:hourglass', full: 'u:sword', knock: 's:stamp', focus: 'u:hourglass', skillFar: 's:horn', skillHold: 's:horn',
  perfect: 's:mark', flash: 's:mark', snareCd: 's:net', snareHold: 's:net', snares: 's:net', houndEvery: 's:sic', houndBite: 's:sic', houndBites: 's:sic',
  slip: 'i:dash', angle: 's:shadow', rear: 's:shadow', ambush: 's:vanish', quick: 's:knives', quiet: 'i:view', image: 'i:blink',
  primed: 's:fire', clear: 's:storm', twice: 's:firering', burst: 's:firering', damage: 's:fire', breath: 'u:breath',
  mending: 's:heal', mercyReach: 's:heal', mercy: 's:heal', smiteStun: 's:light', bless: 's:blessing', blessTime: 's:blessing',
};
const DODGE: Record<string, string> = { r: 'i:jump', g: 'i:dash', m: 'i:blink', w: 'i:block', h: 'i:block' };

function knackIcon(id: PerkId): string {
  const k = Object.keys(PERKS[id].fx)[0] as FxKey | undefined, letter = id[0];
  if (k === 'dodge' || k === 'leap' || k === 'light') return DODGE[letter] ?? 'i:jump';
  if (k === 'quick' && letter === 'm') return 's:fire';
  return (k && FX[k]) ?? 'u:star';
}

/** The picture key for a tile's key ('drill:power', 'tech:slam', 'rung:taunt', 'learn:horn', 'knack:w_wide'). */
export function tileIcon(key: string, cls?: string): string {
  const [kind, id] = key.split(':');
  if (kind === 'drill') return DRILL[id as DrillId] ?? 'u:star';
  if (kind === 'tech') return TECH[id as TechId] ?? 'u:star';
  if (kind === 'rung') return RUNG[id as RungId] ?? 'u:star';
  if (kind === 'knack') return knackIcon(id as PerkId);
  // A lesson: the skill it teaches, or what the dodge leaves (a Ranger's snare, a Mage's image).
  if (kind === 'learn') return id === 'leave' ? (cls === 'MAGE' ? 'i:blink' : 's:net') : 's:' + id;
  return 'u:star';
}
