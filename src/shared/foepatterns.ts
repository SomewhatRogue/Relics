/**
 * The numbers for goblins' new ways of fighting (docs/design/foe-patterns.md; Kyle, 2026-11-27). Pure, shared by the
 * room (sim/foechain.ts and the rest) and anything that draws them.
 */
import { BUTCHER, SCRAPPER, VARIANTS, type EnemyAttackSpec } from './tuning.js';

/** One blow of a string: what kind it is and its numbers. */
export interface ChainStep { kind: 'stab' | 'cleave' | 'slam'; spec: EnemyAttackSpec; /** On its beat, not late (the whirl). */ even?: boolean; /** Turning as it goes (the whirl). */ spin?: boolean }

/**
 * Strings of blows: how often a goblin in reach starts one instead of a single blow, and the blows after the first.
 * Each comes straight after the last's recovery, with its own telegraph; the last waits `late` longer to wind up, so
 * a dodge or a guard dropped early is caught. `quick`: the recovery between blows of a string, as a share of a lone blow's.
 */
export const CHAINS = {
  late: 1.35,
  quick: 0.45,
  scrapper: { chance: 0.3, then: [{ kind: 'stab', spec: SCRAPPER.stab }, { kind: 'stab', spec: { ...SCRAPPER.stab, range: 1.9, dmg: 10, knock: 5 } as EnemyAttackSpec }] as ChainStep[] },
  heavy: { chance: 0.35, then: [{ kind: 'cleave', spec: VARIANTS.heavy.swing }] as ChainStep[] },
  butcher: { chance: 0.3, then: [{ kind: 'slam', spec: BUTCHER.slam }] as ChainStep[] },
};

/** The held swing: how often a big goblin's cleave holds full before it lands, and for how long (least, most; s). */
export const HOLD = { chance: 0.4, least: 0.2, most: 0.6 };

/**
 * Flanking (slice 2): in a pack round one hero, the goblin nearest their front keeps them busy; the rest walk round
 * to their sides and back before they strike, so a block (front only) has to turn. `ready`: only a goblin this near
 * to its next blow (its cooldown, s) goes round; `pack`: how near the hero a
 * goblin counts (tiles); `front`: a goblin this close to straight in front (the cosine) is in front; `slots`: the
 * places round the hero (degrees from where they face), filled in order; `at`: in reach this far round counts as
 * there (the cosine); `pace`: how fast it goes round, as a share of its walk; `keep`: the lean toward the goblin that
 * kept them busy last; going round, `step` radians of the arc at a time, `wide` times its reach out.
 */
export const FLANK_PACK = { ready: 1, pack: 3.5, front: 0.35, slots: [180, 115, -115, 150, -150], ring: 0.85, pace: 1.1, keep: 0.6, step: 0.9, wide: 1.6 };

/**
 * Slice 3. A scrapper that can't reach you throws: a stone (a short red line, a small hit) or now and then a pot that
 * lands where you stand and goes up in fire after its fuse. `from`/`to`: the distances it throws at (tiles);
 * `chance`: a tick's odds once it's ready, so it doesn't always throw;
 * `every`: the least time between one goblin's throws (s), so it still comes in.
 */
export const STONE = { every: 7, from: 4, to: 7, chance: 0.04, spec: { windup: 0.75, active: 0.08, recover: 0.8, dmg: 5, knock: 2, range: 7, arc: 6, unblockable: false } as EnemyAttackSpec };
export const POT = { from: 3, to: 6.5, chance: 0.012, fuse: 1.3, radius: 1.0, life: 8, spec: { windup: 0.9, active: 0.1, recover: 1.0, dmg: 2, knock: 1, radius: 1.0, unblockable: true } as EnemyAttackSpec };
/** A heavy drags its cleaver at you along a long thin line, from `from` to `to` tiles. */
export const DRAG = { from: 2.6, to: 6, chance: 0.03, spec: { windup: 1.1, active: 0.12, recover: 1.0, dmg: 14, knock: 6, range: 6.2, arc: 10, unblockable: false } as EnemyAttackSpec };
/**
 * The whirl: a heavy or butcher in reach spins, a ring round it, three hits, then stands dizzy (`dizzy` s of recovery
 * after the last). `spin`: how fast it turns while it whirls (radians a second).
 */
export const WHIRL = { chance: 0.18, spin: 14, dizzy: 1.6, first: { windup: 0.9, active: 0.08, recover: 0.05, dmg: 10, knock: 5, radius: 2.0, ahead: 0, unblockable: false } as EnemyAttackSpec, next: { windup: 0.28, active: 0.08, recover: 0.05, dmg: 8, knock: 5, radius: 2.0, ahead: 0, unblockable: false } as EnemyAttackSpec };
/** Archers loose together: when one shoots, any other within `near` that's ready shoots at the same hero (`chance` a shot). */
export const VOLLEY_CALL = { near: 7, chance: 0.5, ready: 0.6 };
