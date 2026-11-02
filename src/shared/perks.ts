/**
 * Knacks: what a level buys. Each is one step on a chain (chains.ts); a level up offers the next step of
 * two different chains, and you take one. Every knack moves a number the fight already reads: the gear
 * stats (`fx` keys named like gear modifiers add to what gear gives, sim/gearstats.ts) or a few of its
 * own (down, block, rear, bless, counter, winded). Ids of the old perks are kept so saves still load.
 */
import type { ModId } from './gear.js';
import { dodgeName, type HeroClass } from './weapons.js';

export type PerkId =
  | 'tough' | 'secondwind' | 'scarred' | 'endurance' | 'longwind' | 'relicsworn'
  | 'guard' | 'ironhide' | 'counter' | 'footwork' | 'fleet' | 'slip' | 'focus'
  | 'heft' | 'heavy' | 'keen' | 'steadyhand' | 'longshot' | 'shadowed' | 'quick' | 'charge' | 'potent' | 'devotion' | 'mender';

/** What a knack adds. Gear keys add like gear does; `down` a share off time down, `block` off a block's
 *  breath, `rear` to a backstab, `bless` to blessed ground and the ward, `counter` to a counter, `winded`
 *  off the wait before winded breath comes back. */
export type FxKey = ModId | 'crit' | 'down' | 'block' | 'rear' | 'bless' | 'counter' | 'winded';
export type Fx = Partial<Record<FxKey, number>>;

/** `text` says what it does; `gain` is the few words on the tree. `{dodge}` is the class's own dodge. */
export const PERKS: Record<PerkId, { name: string; text: string; gain: string; fx: Fx }> = {
  tough: { name: 'TOUGH', text: '20 more health', gain: '+20 health', fx: { health: 20 } },
  secondwind: { name: 'SECOND WIND', text: 'Back on your feet sooner when you go down', gain: 'up sooner', fx: { down: 0.4 } },
  scarred: { name: 'SCARRED', text: 'Every blow lands a little lighter on you', gain: '8% less hurt', fx: { tough: 0.08 } },
  endurance: { name: 'ENDURANCE', text: 'Your breath comes back a third faster', gain: 'breath +33%', fx: { breath: 0.33 } },
  longwind: { name: 'LONG WIND', text: 'Run out of breath and it starts coming back at once', gain: 'no winded wait', fx: { winded: 1 } },
  relicsworn: { name: 'RELIC-WISE', text: 'Your skill and relic come back a fifth sooner', gain: 'skill back 20%', fx: { focus: 0.2 } },
  guard: { name: 'GUARD', text: 'A slightly wider parry window', gain: 'wider parry', fx: { parry: 0.05 } },
  ironhide: { name: 'IRONHIDE', text: 'Blocking costs a quarter less breath', gain: 'cheaper block', fx: { block: 0.25 } },
  counter: { name: 'COUNTERSTROKE', text: 'Your counter after a parry hits a quarter harder', gain: 'counter +25%', fx: { counter: 0.25 } },
  footwork: { name: 'FOOTWORK', text: '{dodge} again a fifth sooner', gain: '{dodge} 20% sooner', fx: { dodge: 0.2 } },
  fleet: { name: 'FLEET', text: 'A little faster on your feet', gain: '+6% speed', fx: { foot: 0.06 } },
  slip: { name: 'SLIPPERY', text: '{dodge} again sooner still', gain: '{dodge} 15% sooner', fx: { dodge: 0.15 } },
  focus: { name: 'FOCUS', text: 'The blink comes back a quarter sooner', gain: 'blink 25% sooner', fx: { dodge: 0.25 } },
  heft: { name: 'HEFT', text: 'Your hits throw goblins a quarter further', gain: 'knock +25%', fx: { knock: 0.25 } },
  heavy: { name: 'HEAVY HANDS', text: 'Your hits land a little harder', gain: '+6% damage', fx: { damage: 0.06 } },
  keen: { name: 'KEEN', text: 'A better chance of a hit landing half again as hard', gain: '+5% crit', fx: { crit: 0.05 } },
  steadyhand: { name: 'STEADY HAND', text: 'Bows draw a sixth faster', gain: 'draw 15% faster', fx: { draw: 0.15 } },
  longshot: { name: 'LONG SHOT', text: 'Your shots carry a tenth further', gain: '+10% range', fx: { reach: 0.1 } },
  shadowed: { name: 'SHADOWED', text: 'Backstabs hit half as hard again', gain: 'backstab +50%', fx: { rear: 0.5 } },
  quick: { name: 'QUICK HANDS', text: 'Your blows come a little faster', gain: '+6% quicker', fx: { quick: 0.06 } },
  charge: { name: 'DEEP CHARGE', text: 'Charged spells fill a little faster', gain: 'charge 12% faster', fx: { draw: 0.12 } },
  potent: { name: 'POTENT', text: 'Your spells land a little harder', gain: '+6% damage', fx: { damage: 0.06 } },
  devotion: { name: 'DEVOTION', text: 'Blessed ground a quarter wider, the ward a quarter stronger', gain: 'blessing +25%', fx: { bless: 0.25 } },
  mender: { name: 'MENDER', text: 'Every heal you give mends a tenth more', gain: 'heals +10%', fx: { mending: 0.1 } },
};

const cap = (s: string) => s[0] + s.slice(1).toLowerCase();
/** A knack's words for a class: `{dodge}` becomes its own dodge (Dash, Jump, Blink). */
export const perkText = (id: PerkId, cls: HeroClass, key: 'text' | 'gain' = 'text') => PERKS[id][key].replace('{dodge}', key === 'text' ? cap(dodgeName(cls)) : dodgeName(cls).toLowerCase());

/** Everything a hero's knacks add up to (unknown ids, from old saves, add nothing). */
export function perkFx(perks: readonly string[] | undefined): Fx {
  const out: Fx = {};
  for (const id of perks ?? []) for (const [k, v] of Object.entries(PERKS[id as PerkId]?.fx ?? {})) out[k as FxKey] = (out[k as FxKey] ?? 0) + v!;
  return out;
}
