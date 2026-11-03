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
  w_parry: { name: 'WIDE PARRY', text: 'Your parry window is a little wider', gain: 'parry +0.04 s', fx: { parry: 0.04 } },
  w_block: { name: 'IRONHIDE', text: 'Blocking costs a quarter less breath', gain: 'block -25% stamina', fx: { block: 0.25 } },
  w_counter: { name: 'COUNTERSTROKE', text: 'Your counter after a parry hits a quarter harder', gain: 'counter +25%', fx: { counter: 0.25 } },
  w_health: { name: 'TOUGH', text: 'You have 20 more health', gain: '+20 health', fx: { health: 20 } },
  w_tough: { name: 'SCARRED', text: 'Every blow lands a little lighter on you', gain: '8% less damage taken', fx: { tough: 0.08 } },
  w_foot: { name: 'SURE FEET', text: 'You\'re a little quicker on your feet, plate and all', gain: '+6% speed', fx: { foot: 0.06 } },
  w_charge: { name: 'QUICK CHARGE', text: 'Your held blow charges 15% faster', gain: 'charge 15% faster', fx: { draw: 0.15 } },
  w_full: { name: 'HEAVY HANDS', text: 'A fully charged blow lands 15% harder', gain: 'full charge +15%', fx: { full: 0.15 } },
  w_knock: { name: 'HEFT', text: 'Your hits throw goblins a quarter further', gain: 'knock +25%', fx: { knock: 0.25 } },
  w_focus: { name: 'BATTLE-WISE', text: 'Your skill and your relic come back a fifth sooner', gain: 'skill 20% sooner', fx: { focus: 0.2 } },
  w_far: { name: 'FAR REACH', text: 'Your shield charge and your war cry both reach a fifth further', gain: 'skill +20% further', fx: { skillFar: 0.2 } },
  w_hold: { name: 'HARD KNOCKS', text: 'Your shield charge keeps goblins down longer, and your war cry holds them longer', gain: 'skill +40% longer', fx: { skillHold: 0.4 } },
  // The Ranger: the bow, the jump, the snare, the hound.
  r_draw: { name: 'STEADY HAND', text: 'Your bow draws 15% faster', gain: 'draw 15% faster', fx: { draw: 0.15 } },
  r_true: { name: 'TRUE RELEASE', text: 'Loose on the white flash at full draw and the shot lands a fifth harder', gain: 'flash shot +20%', fx: { perfect: 0.2 } },
  r_flash: { name: 'LONG FLASH', text: 'The white flash at full draw lasts a little longer', gain: 'flash +0.15 s', fx: { flash: 0.15 } },
  r_jump: { name: 'SPRING', text: 'You can jump again a fifth sooner', gain: 'jump 20% sooner', fx: { dodge: 0.2 } },
  r_leap: { name: 'LONG JUMP', text: 'Your jump carries a fifth further', gain: 'jump +20% further', fx: { leap: 0.2 } },
  r_foot: { name: 'FLEET', text: 'You\'re a little faster on your feet', gain: '+6% speed', fx: { foot: 0.06 } },
  r_snare: { name: 'QUICK SNARE', text: 'A fresh snare is ready a quarter sooner', gain: 'snare 25% sooner', fx: { snareCd: 0.25 } },
  r_hold: { name: 'TIGHT SNARE', text: 'Your snares hold a goblin a quarter longer', gain: 'hold +25%', fx: { snareHold: 0.25 } },
  r_three: { name: 'THIRD SNARE', text: 'Three of your snares can be down at once, not two', gain: '3 snares down', fx: { snares: 1 } },
  r_hound: { name: 'EAGER HOUND', text: 'Your hound goes in a quarter sooner', gain: 'hound 25% sooner', fx: { houndEvery: 0.25 } },
  r_bite: { name: 'HARD BITE', text: 'Your hound bites harder', gain: 'bite 7 to 9', fx: { houndBite: 2 } },
  r_bites: { name: 'WORRIER', text: 'Your hound bites once more before it comes back', gain: '+1 bite', fx: { houndBites: 1 } },
  // The Rogue: the dash, the backstab, the knives, the shadow.
  g_light: { name: 'LIGHT STEP', text: 'Your dash costs a fifth less breath', gain: 'dash -20% stamina', fx: { light: 0.2 } },
  g_leap: { name: 'LONG DASH', text: 'Your dash goes 15% further', gain: 'dash +15% further', fx: { leap: 0.15 } },
  g_slip: { name: 'LAST SECOND', text: 'You get a little longer to make a last-moment dash, the one that leaves a goblin reeling', gain: 'last moment +0.08 s', fx: { slip: 0.08 } },
  g_angle: { name: 'FLANKER', text: 'You count as behind a goblin from further round its side', gain: 'backstab from wider', fx: { angle: 0.15 } },
  g_rear: { name: 'SHADOWED', text: 'Backstabs hit 15% harder', gain: 'backstab +15%', fx: { rear: 0.15 } },
  g_ambush: { name: 'FIRST CUT', text: 'An ambush hits a quarter harder', gain: 'ambush +25%', fx: { ambush: 0.25 } },
  g_quick: { name: 'QUICK HANDS', text: 'Your blows come a little faster', gain: '+6% quicker', fx: { quick: 0.06 } },
  g_throw: { name: 'HARD THROW', text: 'A fully held throw, lunge or bolt lands a fifth harder', gain: 'held blow +20%', fx: { full: 0.2 } },
  g_draw: { name: 'QUICK DRAW', text: 'Your held blow is ready 15% sooner', gain: 'held 15% sooner', fx: { draw: 0.15 } },
  g_foot: { name: 'FLEET', text: 'You\'re a little faster on your feet', gain: '+6% speed', fx: { foot: 0.06 } },
  g_focus: { name: 'DEEP SHADOW', text: 'Your shadowstep and your relic come back a fifth sooner', gain: 'skill 20% sooner', fx: { focus: 0.2 } },
  g_quiet: { name: 'QUIET FEET', text: 'While you creep, goblins spot you a fifth later', gain: 'seen 20% later', fx: { quiet: 0.2 } },
  // The Mage: the blink, the channel, the spells, the breath.
  m_blink: { name: 'QUICK BLINK', text: 'You can blink again a fifth sooner', gain: 'blink 20% sooner', fx: { dodge: 0.2 } },
  m_leap: { name: 'FAR BLINK', text: 'Your blink goes a fifth further', gain: 'blink +20% further', fx: { leap: 0.2 } },
  m_image: { name: 'LONG IMAGE', text: 'The image your blink leaves lasts a second and a half longer', gain: 'image +1.5 s', fx: { image: 1.5 } },
  m_primed: { name: 'PRIMED', text: 'The first spell after you turn your spells hits harder still', gain: 'primed +0.25x', fx: { primed: 0.25 } },
  m_clear: { name: 'CLEAR HEAD', text: 'Turning your spells gives you back 15 breath', gain: '+15 stamina a turn', fx: { clear: 15 } },
  m_twice: { name: 'TWICE PRIMED', text: 'The first two spells after a turn are both primed', gain: 'two primed', fx: { twice: 1 } },
  m_draw: { name: 'DEEP CHARGE', text: 'Charged spells fill 12% faster', gain: 'charge 12% faster', fx: { draw: 0.12 } },
  m_burst: { name: 'WIDE BURST', text: 'Your spells burst a fifth wider', gain: 'burst +20%', fx: { burst: 0.2 } },
  m_dmg: { name: 'POTENT', text: 'Your spells land a little harder', gain: '+6% damage', fx: { damage: 0.06 } },
  m_breath: { name: 'DEEP BREATH', text: 'Your breath comes back a quarter faster', gain: 'stamina recovery +25%', fx: { breath: 0.25 } },
  m_light: { name: 'LIGHT BLINK', text: 'Your blink costs a fifth less breath', gain: 'blink -20% stamina', fx: { light: 0.2 } },
  m_quick: { name: 'QUICK CASTS', text: 'Your casts come a little faster', gain: '+6% quicker', fx: { quick: 0.06 } },
  // The Healer: guard, mercy (the healing blow), the smite, the sanctuary.
  h_parry: { name: 'WIDE PARRY', text: 'Your parry window is a little wider', gain: 'parry +0.04 s', fx: { parry: 0.04 } },
  h_block: { name: 'IRONHIDE', text: 'Blocking costs a quarter less breath', gain: 'block -25% stamina', fx: { block: 0.25 } },
  h_counter: { name: 'LONG COUNTER', text: 'After a parry you have longer to make your counter', gain: 'counter +0.6 s', fx: { counterTime: 0.6 } },
  h_mend: { name: 'MENDER', text: 'Every heal you give mends 12% more', gain: 'heals +12%', fx: { mending: 0.12 } },
  h_reach: { name: 'WIDE MERCY', text: 'Your healing blow reaches friends a fifth further off', gain: 'heal reach +20%', fx: { mercyReach: 0.2 } },
  h_mercy: { name: 'EARLY MERCY', text: 'The blow before your healing blow heals too, half as much', gain: 'blow before heals', fx: { mercy: 0.5 } },
  h_draw: { name: 'QUICK SMITE', text: 'Your held blow charges 12% faster', gain: 'charge 12% faster', fx: { draw: 0.12 } },
  h_stun: { name: 'DAZING LIGHT', text: 'Your smite stuns 0.4 s longer', gain: 'stun +0.4 s', fx: { smiteStun: 0.4 } },
  h_full: { name: 'HEAVY SMITE', text: 'A fully charged blow lands 15% harder', gain: 'full charge +15%', fx: { full: 0.15 } },
  h_focus: { name: 'DEVOUT', text: 'Your sanctuary and your relic come back a fifth sooner', gain: 'skill 20% sooner', fx: { focus: 0.2 } },
  h_bless: { name: 'DEVOTION', text: 'Blessed ground spreads a quarter wider and the ward is a quarter stronger', gain: 'blessing +25%', fx: { bless: 0.25 } },
  h_long: { name: 'LONG BLESSING', text: 'Blessed ground and the ward last a second and a half longer', gain: 'blessing +1.5 s', fx: { blessTime: 1.5 } },
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
