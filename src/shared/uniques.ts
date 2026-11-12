/**
 * Unique pieces (docs/design/boss-loot.md): each boss of the kit, each named butcher and each sort of BIG ONE
 * has a short pool of its own, found nowhere else, and only in the Deep. A kill there drops one piece of its
 * pool for the whole group, rolled for (NEED / GREED / PASS: sim/lootroll.ts). A piece is PRE-WAR in
 * quality with fixed modifiers and, for a weapon, a fixed trait; `line` is what it is, said on its card.
 * A hero owns at most one of each. Names and lines: lore keeper and line editor 2026-11-11.
 */
import type { Item, TraitId } from './loot.js';
import type { ArmorKind, ModId } from './mods.js';
import type { WeaponId } from './weapons.js';

export type PoolId = 'haulier' | 'doorkeepers' | 'mawl' | 'skarn' | 'knuckles' | 'spoon' | 'gutchain' | 'rust' | 'brute' | 'iron' | 'listener';

export interface Unique {
  name: string;
  pool: PoolId;
  slot: 'weapon' | 'armor' | 'ring';
  kit?: WeaponId;
  armor?: ArmorKind;
  trait?: TraitId;
  mods: { id: ModId; v: number }[];
  line: string;
}

export const UNIQUES = {
  haulpick: { name: "THE HAULIER'S PICK", pool: 'haulier', slot: 'weapon', kit: 'greatsword', trait: 'crushing', mods: [{ id: 'damage', v: 0.18 }, { id: 'knock', v: 0.25 }, { id: 'reach', v: 0.12 }], line: 'A quarry pick ground to an edge, and it goes through plate.' },
  smeltplate: { name: "THE HAULIER'S PLATE", pool: 'haulier', slot: 'armor', armor: 'heavy', mods: [{ id: 'tough', v: 0.2 }, { id: 'health', v: 25 }, { id: 'guard', v: 0.15 }], line: 'Riveted iron plate, dented all over and a lot heavier than it looks.' },
  cartlink: { name: 'A DRAG-CHAIN LINK', pool: 'haulier', slot: 'ring', mods: [{ id: 'health', v: 20 }, { id: 'breath', v: 0.18 }, { id: 'foot', v: 0.08 }], line: 'One link off a drag chain, on a thong.' },
  hingepin: { name: 'THE HINGE PIN', pool: 'doorkeepers', slot: 'weapon', kit: 'spear', trait: 'riposte', mods: [{ id: 'reach', v: 0.15 }, { id: 'damage', v: 0.14 }, { id: 'guard', v: 0.2 }], line: 'An iron pin as long as your arm, ground to a point.' },
  doorbow: { name: 'OLD-OAK BOW', pool: 'doorkeepers', slot: 'weapon', kit: 'longbow', trait: 'deadeye', mods: [{ id: 'damage', v: 0.16 }, { id: 'draw', v: 0.18 }, { id: 'crit', v: 0.1 }], line: 'Cut from a plank of old oak, with the nail hole still in the stave.' },
  keepersring: { name: 'AN IRON HASP', pool: 'doorkeepers', slot: 'ring', mods: [{ id: 'guard', v: 0.2 }, { id: 'health', v: 20 }, { id: 'tough', v: 0.1 }], line: 'A small iron hasp, bent closed round your finger.' },
  mawlteeth: { name: "MAWL'S TEETH", pool: 'mawl', slot: 'weapon', kit: 'daggers', trait: 'reaper', mods: [{ id: 'backstab', v: 0.4 }, { id: 'crit', v: 0.15 }, { id: 'quick', v: 0.12 }], line: 'Two of its own teeth, filed to points and set in bone.' },
  mawlbelt: { name: "MAWL'S BELT", pool: 'mawl', slot: 'armor', armor: 'light', mods: [{ id: 'dodge', v: 0.2 }, { id: 'foot', v: 0.1 }, { id: 'breath', v: 0.15 }], line: "A belt hung with teeth on cords, and not all of them goblin's." },
  skarnhook: { name: "SKARN'S HOOK", pool: 'skarn', slot: 'weapon', kit: 'flail', trait: 'brutal', mods: [{ id: 'damage', v: 0.15 }, { id: 'mending', v: 0.2 }, { id: 'arc', v: 0.15 }], line: 'A meat hook on a chain, worn bright where hands held it.' },
  skarnhide: { name: "SKARN'S HIDE", pool: 'skarn', slot: 'armor', armor: 'medium', mods: [{ id: 'tough', v: 0.18 }, { id: 'health', v: 20 }, { id: 'breath', v: 0.12 }], line: 'Thick, scarred, and it was never cured.' },
  knucklemace: { name: "OLD KNUCKLES' MAUL", pool: 'knuckles', slot: 'weapon', kit: 'mace', trait: 'crushing', mods: [{ id: 'damage', v: 0.18 }, { id: 'knock', v: 0.25 }, { id: 'mending', v: 0.1 }], line: 'A lump of iron on an ash haft, dented by what it hit.' },
  knucklering: { name: 'KNUCKLE-BONE RING', pool: 'knuckles', slot: 'ring', mods: [{ id: 'crit', v: 0.12 }, { id: 'focus', v: 0.15 }, { id: 'health', v: 15 }], line: "Cut from a finger joint, and not a goblin's." },
  spoonladle: { name: "OLD SPOON'S LADLE", pool: 'spoon', slot: 'weapon', kit: 'staff', trait: 'ember', mods: [{ id: 'spell', v: 0.2 }, { id: 'thrift', v: 0.15 }, { id: 'focus', v: 0.12 }], line: 'A long iron ladle, black from the pot.' },
  spoonapron: { name: "OLD SPOON'S SMOCK", pool: 'spoon', slot: 'armor', armor: 'light', mods: [{ id: 'health', v: 20 }, { id: 'dodge', v: 0.15 }, { id: 'focus', v: 0.1 }], line: 'Leather, stiff with old cooking.' },
  gutbow: { name: "GUTCHAIN'S CHAIN BOW", pool: 'gutchain', slot: 'weapon', kit: 'crossbow', trait: 'storm', mods: [{ id: 'damage', v: 0.15 }, { id: 'draw', v: 0.15 }, { id: 'knock', v: 0.15 }], line: 'A crossbow wound with chain instead of cord.' },
  gutcollar: { name: "GUTCHAIN'S COLLAR", pool: 'gutchain', slot: 'ring', mods: [{ id: 'tough', v: 0.12 }, { id: 'breath', v: 0.15 }, { id: 'health', v: 15 }], line: 'An iron collar cut down to fit a finger.' },
  rustshears: { name: "MOTHER RUST'S SHEARS", pool: 'rust', slot: 'weapon', kit: 'spellblade', trait: 'rime', mods: [{ id: 'spell', v: 0.15 }, { id: 'damage', v: 0.14 }, { id: 'quick', v: 0.12 }], line: 'One blade of a pair of shears, very sharp.' },
  rustthimble: { name: "MOTHER RUST'S THIMBLE", pool: 'rust', slot: 'ring', mods: [{ id: 'crit', v: 0.15 }, { id: 'backstab', v: 0.2 }, { id: 'quick', v: 0.08 }], line: 'Dented, and it fits any finger.' },
  brutecleaver: { name: 'SLAB BLADE', pool: 'brute', slot: 'weapon', kit: 'sword', trait: 'brutal', mods: [{ id: 'damage', v: 0.16 }, { id: 'arc', v: 0.2 }, { id: 'knock', v: 0.15 }], line: 'Flat iron as wide as a shield, with an edge ground on it and rags for a grip.' },
  brutering: { name: 'A HEAVY IRON BAND', pool: 'brute', slot: 'ring', mods: [{ id: 'damage', v: 0.1 }, { id: 'knock', v: 0.2 }, { id: 'health', v: 15 }], line: 'Cast for a finger twice the size of yours, then hammered down to fit.' },
  ironscales: { name: 'LACED PLATE', pool: 'iron', slot: 'armor', armor: 'heavy', mods: [{ id: 'tough', v: 0.22 }, { id: 'guard', v: 0.1 }, { id: 'health', v: 15 }], line: 'Iron plates pulled off the biggest ones and laced together.' },
  ironrivet: { name: 'A RIVET', pool: 'iron', slot: 'ring', mods: [{ id: 'tough', v: 0.1 }, { id: 'guard', v: 0.15 }, { id: 'breath', v: 0.1 }], line: 'A rivet off a big iron plate, hammered into a ring.' },
  // THE LISTENER's pool. PLACEHOLDER names and lines for the lore keeper and line editor (theme: cave-damp steel the dark kept, heavy and quiet).
  hushmaul: { name: 'THE HUSHED MAUL', pool: 'listener', slot: 'weapon', kit: 'mace', trait: 'crushing', mods: [{ id: 'damage', v: 0.17 }, { id: 'knock', v: 0.22 }, { id: 'guard', v: 0.1 }], line: 'A cave-damp hammer head on a wrapped haft. It rings like wet cloth.' },
  dampmail: { name: 'DAMP MAIL', pool: 'listener', slot: 'armor', armor: 'heavy', mods: [{ id: 'tough', v: 0.2 }, { id: 'health', v: 25 }, { id: 'foot', v: 0.06 }], line: 'Steel gone dark with cave water, and quiet when it moves.' },
  dripring: { name: 'A DRIPSTONE RING', pool: 'listener', slot: 'ring', mods: [{ id: 'dodge', v: 0.12 }, { id: 'breath', v: 0.15 }, { id: 'health', v: 15 }], line: 'A ring of grey stone with one cold drop always on it.' },
} satisfies Record<string, Unique>;
export type UniqueId = keyof typeof UNIQUES;

/** A pool's pieces, in order. */
export const poolOf = (pool: PoolId): UniqueId[] => (Object.keys(UNIQUES) as UniqueId[]).filter((id) => UNIQUES[id].pool === pool);

/** The piece as an item in the pack. */
export function uniqueItem(id: UniqueId): Item {
  const u: Unique = UNIQUES[id];
  return {
    slot: u.slot, quality: 'tolmouth', traits: u.trait ? [u.trait] : [], mods: u.mods.map((m) => ({ ...m })), level: 0, unique: id,
    ...(u.kit ? { kit: u.kit } : {}), ...(u.armor ? { armor: u.armor } : {}),
  };
}

/** Named butchers' pools, by the name over their heads (shared/jobs.ts BOSSES). */
export const BUTCHER_POOLS: Record<string, PoolId> = { MAWL: 'mawl', SKARN: 'skarn', 'OLD KNUCKLES': 'knuckles', 'OLD SPOON': 'spoon', GUTCHAIN: 'gutchain', 'MOTHER RUST': 'rust' };

/**
 * How often a kill in the Deep drops a piece of its pool (for the whole group), and the roll's time to
 * choose. A boss of the kit (the Doorkeepers: once, for the pair) and a named butcher always; a BIG ONE
 * `big` of the time by the floor's band (shared/deepbands.ts: 1 to 5, 6 to 10, 11 to 15, 16 on).
 */
export const UNIQUE_DROP = { boss: 1, butcher: 1, big: [0.3, 0.4, 0.5, 0.6], choose: 20 };
