/**
 * The numbers for goblins' new ways of fighting (docs/design/foe-patterns.md; Kyle, 2026-11-27). Pure, shared by the
 * room (sim/foechain.ts and the rest) and anything that draws them.
 */
import { BUTCHER, SCRAPPER, VARIANTS, type EnemyAttackSpec } from './tuning.js';

/** One blow of a string: what kind it is and its numbers. */
export interface ChainStep { kind: 'stab' | 'cleave' | 'slam'; spec: EnemyAttackSpec }

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
