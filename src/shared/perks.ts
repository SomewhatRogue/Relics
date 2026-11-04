/**
 * Knacks: what a level buys. Each is one step on a chain (chains.ts), and every class has its own four
 * chains (Kyle, 2026-11-02: "Knacks should be different per class"), so each step moves a number that
 * class's own kit uses. Gear-named `fx` keys add to what gear gives (sim/gearstats.ts); the rest are read
 * where the fight judges them (sim/knacks.ts and the few files it names). Ids carry the class's letter.
 */
import type { ModId } from './gear.js';
import type { HeroClass } from './weapons.js';

/**
 * What a knack adds. Gear keys add like gear does. The others, by where the fight reads them:
 * `block` off a block's breath, `counter` to a counter, `counterTime` s on the counter window,
 * `full` to a full held blow, `skillFar` to the shield charge's run and the war cry's reach,
 * `skillHold` to the charge's stun and the cry's hold, `perfect` to a shot loosed on the white flash,
 * `flash` s on that window, `leap` to the dodge's distance, `light` off its breath, `snareCd` off the
 * snare's wait, `snareHold` to its hold, `snares` more down at once, `houndEvery` off the hound's
 * wait, `houndBite` to a bite, `houndBites` more bites a run, `slip` s on the last-moment dodge,
 * `angle` on how far round counts as behind, `rear` to a backstab, `ambush` to an ambush, `quiet` off
 * the distance goblins see you creeping, `image` s on the blink's image, `primed` on a primed spell,
 * `clear` breath back on a turn, `twice` more primed spells, `burst` to a spell's burst, `mercyReach`
 * to the heal's reach, `mercy` of the heal on the blow before it, `smiteStun` s on a smite's stun,
 * `bless` to blessed ground and the ward, `blessTime` s on both. (`down` and `winded` belong to old
 * saves' knacks, read still but on no chain.)
 */
export type FxKey = ModId | 'crit' | 'down' | 'winded' | 'block' | 'counter' | 'counterTime' | 'full' | 'skillFar' | 'skillHold'
  | 'perfect' | 'flash' | 'leap' | 'light' | 'snareCd' | 'snareHold' | 'snares' | 'houndEvery' | 'houndBite' | 'houndBites'
  | 'slip' | 'angle' | 'rear' | 'ambush' | 'quiet' | 'image' | 'primed' | 'clear' | 'twice' | 'burst'
  | 'mercyReach' | 'mercy' | 'smiteStun' | 'bless' | 'blessTime';
export type Fx = Partial<Record<FxKey, number>>;
export interface Knack { name: string; text: string; gain: string; fx: Fx }

/** `text` says what it does, in full; `gain` is the few words on the tree. */
const LIST = {
  // The Warrior: guard, plate, the held blow, the skill (shield charge or war cry).
  w_parry: { name: 'WIDE PARRY', text: 'Your parry window is 0.04 s longer', gain: 'parry +0.04 s', fx: { parry: 0.04 } },
  w_block: { name: 'EASY BLOCK', text: 'Blocking costs 25% less stamina', gain: 'block -25% stamina', fx: { block: 0.25 } },
  w_counter: { name: 'HARD COUNTER', text: 'Your counter after a parry does 25% more damage', gain: 'counter +25%', fx: { counter: 0.25 } },
  w_health: { name: 'EXTRA HEALTH', text: 'You have 20 more health', gain: '+20 health', fx: { health: 20 } },
  w_tough: { name: 'THICK SKIN', text: 'You take 8% less damage', gain: '8% less damage taken', fx: { tough: 0.08 } },
  w_foot: { name: 'QUICK FEET', text: 'You move 6% faster, plate and all', gain: '+6% speed', fx: { foot: 0.06 } },
  w_charge: { name: 'QUICK CHARGE', text: 'Your held blow charges 15% faster', gain: 'charge 15% faster', fx: { draw: 0.15 } },
  w_full: { name: 'FULL FORCE', text: 'A fully charged blow does 15% more damage', gain: 'full charge +15%', fx: { full: 0.15 } },
  w_knock: { name: 'KNOCKBACK', text: 'Your hits knock goblins back 25% further', gain: 'knock +25%', fx: { knock: 0.25 } },
  w_focus: { name: 'QUICK RECHARGE', text: 'Your skill and your relic are ready again 20% sooner', gain: 'recharge 20% sooner', fx: { focus: 0.2 } },
  w_far: { name: 'FAR REACH', text: 'Your shield charge and your war cry reach 20% further', gain: 'skill +20% further', fx: { skillFar: 0.2 } },
  w_hold: { name: 'LONG HOLD', text: 'Goblins hit by your shield charge stay down 40% longer, and your war cry holds them 40% longer', gain: 'skill +40% longer', fx: { skillHold: 0.4 } },
  // The Ranger: the bow, the jump, the snare, the hound.
  r_draw: { name: 'FAST DRAW', text: 'Your bow draws 15% faster', gain: 'draw 15% faster', fx: { draw: 0.15 } },
  r_true: { name: 'PERFECT SHOT', text: 'A shot let go on the white flash at full draw (a PERFECT) does 20% more damage', gain: 'PERFECT +20%', fx: { perfect: 0.2 } },
  r_flash: { name: 'LONG FLASH', text: 'The white flash at full draw lasts 0.15 s longer, so a PERFECT is easier to hit', gain: 'flash +0.15 s', fx: { flash: 0.15 } },
  r_jump: { name: 'QUICK JUMP', text: 'You can jump again 20% sooner', gain: 'jump 20% sooner', fx: { dodge: 0.2 } },
  r_leap: { name: 'LONG JUMP', text: 'Your jump goes 20% further', gain: 'jump +20% further', fx: { leap: 0.2 } },
  r_foot: { name: 'QUICK FEET', text: 'You move 6% faster', gain: '+6% speed', fx: { foot: 0.06 } },
  r_snare: { name: 'QUICK SNARE', text: 'Your next snare is ready 25% sooner', gain: 'snare 25% sooner', fx: { snareCd: 0.25 } },
  r_hold: { name: 'TIGHT SNARE', text: 'Your snares hold a goblin 25% longer', gain: 'hold +25%', fx: { snareHold: 0.25 } },
  r_three: { name: 'THIRD SNARE', text: 'Three of your snares can be down at once, not two', gain: '3 snares down', fx: { snares: 1 } },
  r_hound: { name: 'EAGER HOUND', text: 'Your hound waits 25% less between attacks', gain: 'hound 25% sooner', fx: { houndEvery: 0.25 } },
  r_bite: { name: 'HARD BITE', text: 'Your hound bites for 9 damage instead of 7', gain: 'bite 7 to 9', fx: { houndBite: 2 } },
  r_bites: { name: 'EXTRA BITE', text: 'Your hound bites one more time before it comes back to you', gain: '+1 bite', fx: { houndBites: 1 } },
  // The Rogue: the dash, the backstab, the knives, the shadow.
  g_light: { name: 'LIGHT DASH', text: 'Your dash costs 20% less stamina', gain: 'dash -20% stamina', fx: { light: 0.2 } },
  g_leap: { name: 'LONG DASH', text: 'Your dash goes 15% further', gain: 'dash +15% further', fx: { leap: 0.15 } },
  g_slip: { name: 'WIDE LAST SECOND', text: 'A dash just as a blow lands (a LAST SECOND) leaves the goblin reeling. You get 0.08 s longer to make one', gain: 'last moment +0.08 s', fx: { slip: 0.08 } },
  g_angle: { name: 'WIDE BACKSTAB', text: 'Backstabs count from further round a goblin\'s side, so they\'re easier to land', gain: 'backstab from wider', fx: { angle: 0.15 } },
  g_rear: { name: 'HARD BACKSTAB', text: 'Backstabs do 15% more damage', gain: 'backstab +15%', fx: { rear: 0.15 } },
  g_ambush: { name: 'HARD AMBUSH', text: 'An ambush does 25% more damage', gain: 'ambush +25%', fx: { ambush: 0.25 } },
  g_quick: { name: 'QUICK HANDS', text: 'You attack 6% faster', gain: '+6% quicker', fx: { quick: 0.06 } },
  g_throw: { name: 'HARD THROW', text: 'A fully held throw, lunge or bolt does 20% more damage', gain: 'held blow +20%', fx: { full: 0.2 } },
  g_draw: { name: 'QUICK DRAW', text: 'Your held blow is ready 15% sooner', gain: 'held 15% sooner', fx: { draw: 0.15 } },
  g_foot: { name: 'QUICK FEET', text: 'You move 6% faster', gain: '+6% speed', fx: { foot: 0.06 } },
  g_focus: { name: 'QUICK RECHARGE', text: 'Your skill and your relic are ready again 20% sooner', gain: 'recharge 20% sooner', fx: { focus: 0.2 } },
  g_quiet: { name: 'QUIET FEET', text: 'While you creep, goblins have to be 20% closer to see you', gain: 'seen 20% closer', fx: { quiet: 0.2 } },
  // The Mage: the blink, the channel, the spells, the breath.
  m_blink: { name: 'QUICK BLINK', text: 'You can blink again 20% sooner', gain: 'blink 20% sooner', fx: { dodge: 0.2 } },
  m_leap: { name: 'FAR BLINK', text: 'Your blink goes 20% further', gain: 'blink +20% further', fx: { leap: 0.2 } },
  m_image: { name: 'LONG IMAGE', text: 'The image your blink leaves lasts 1.5 s longer', gain: 'image +1.5 s', fx: { image: 1.5 } },
  m_primed: { name: 'PRIMED POWER', text: 'Your primed spell (the first after you change element) does 25% more damage', gain: 'primed +25%', fx: { primed: 0.25 } },
  m_clear: { name: 'MAGIC ON CHANGE', text: 'Changing element gives you back 15 magic', gain: '+15 magic a change', fx: { clear: 15 } },
  m_twice: { name: 'TWICE PRIMED', text: 'The first two spells after you change element are both primed', gain: 'two primed', fx: { twice: 1 } },
  m_draw: { name: 'QUICK CHARGE', text: 'Held spells charge 12% faster', gain: 'charge 12% faster', fx: { draw: 0.12 } },
  m_burst: { name: 'WIDE BURST', text: 'Your spell bursts are 20% wider', gain: 'burst +20%', fx: { burst: 0.2 } },
  m_dmg: { name: 'SPELL DAMAGE', text: 'Your spells do 6% more damage', gain: '+6% damage', fx: { damage: 0.06 } },
  m_breath: { name: 'QUICK RECOVERY', text: 'Your magic comes back 25% faster', gain: 'magic recovery +25%', fx: { breath: 0.25 } },
  m_light: { name: 'LIGHT BLINK', text: 'Your blink costs 20% less magic', gain: 'blink -20% magic', fx: { light: 0.2 } },
  m_quick: { name: 'QUICK CASTS', text: 'You cast 6% faster', gain: '+6% quicker', fx: { quick: 0.06 } },
  // The Healer: guard, healing (the healing blow), the smite, the sanctuary.
  h_parry: { name: 'WIDE PARRY', text: 'Your parry window is 0.04 s longer', gain: 'parry +0.04 s', fx: { parry: 0.04 } },
  h_block: { name: 'EASY BLOCK', text: 'Blocking costs 25% less stamina', gain: 'block -25% stamina', fx: { block: 0.25 } },
  h_counter: { name: 'LONG COUNTER', text: 'After a parry you have 0.6 s longer to land your counter', gain: 'counter +0.6 s', fx: { counterTime: 0.6 } },
  h_mend: { name: 'STRONG HEALS', text: 'Every heal you give is 12% bigger', gain: 'heals +12%', fx: { mending: 0.12 } },
  h_reach: { name: 'WIDE HEAL', text: 'Your healing blow reaches friends 20% further away', gain: 'heal reach +20%', fx: { mercyReach: 0.2 } },
  h_mercy: { name: 'EARLY HEAL', text: 'The blow before your healing blow heals too, for half as much', gain: 'blow before heals', fx: { mercy: 0.5 } },
  h_draw: { name: 'QUICK SMITE', text: 'Your smite charges 12% faster', gain: 'charge 12% faster', fx: { draw: 0.12 } },
  h_stun: { name: 'LONG STUN', text: 'Your smite stuns 0.4 s longer', gain: 'stun +0.4 s', fx: { smiteStun: 0.4 } },
  h_full: { name: 'HEAVY SMITE', text: 'A fully charged smite does 15% more damage', gain: 'full charge +15%', fx: { full: 0.15 } },
  h_focus: { name: 'QUICK RECHARGE', text: 'Your skill and your relic are ready again 20% sooner', gain: 'recharge 20% sooner', fx: { focus: 0.2 } },
  h_bless: { name: 'STRONG BLESSING', text: 'Blessed ground is 25% wider and your ward is 25% stronger', gain: 'blessing +25%', fx: { bless: 0.25 } },
  h_long: { name: 'LONG BLESSING', text: 'Blessed ground and your ward last 1.5 s longer', gain: 'blessing +1.5 s', fx: { blessTime: 1.5 } },
} satisfies Record<string, Knack>;

export type PerkId = keyof typeof LIST;
export const PERKS: Record<PerkId, Knack> = LIST;

/** A knack's words (`text` in full, `gain` for the tree). The class is kept for callers; each knack is one class's own. */
export const perkText = (id: PerkId, _cls?: HeroClass, key: 'text' | 'gain' = 'text') => PERKS[id][key];

/** Everything a hero's knacks add up to (unknown ids, from old saves, add nothing). */
export function perkFx(perks: readonly string[] | undefined): Fx {
  const out: Fx = {};
  for (const id of perks ?? []) for (const [k, v] of Object.entries(PERKS[id as PerkId]?.fx ?? {})) out[k as FxKey] = (out[k as FxKey] ?? 0) + v!;
  return out;
}
