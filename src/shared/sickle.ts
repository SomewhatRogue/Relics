/**
 * The chain sickle's numbers (docs/design/chain-sickle.md; Kyle, 2026-11-23), in the rapier's place.
 * SPIN: held, the chain whirls round you; every `every` s it cuts everything within `r` tiles for `dmg`
 * (up to `top` at a full spin) and leaves it bleeding `bleed` s. A wall within `catch` tiles catches the
 * chain and the spin cuts nothing. THROW: let go, it flies `range` tiles (`big` on the white flash); fully
 * spun it snags (sim/hook.ts), and on the flash the goblin it snags bleeds `bleed` s.
 */
export const SICKLE_SPIN = { every: 0.3, r: 2.8, dmg: 3, top: 6, bleed: 2, catch: 1.2, knock: 1 };
export const SICKLE_THROW = { range: 6, big: 8, bleed: 3 };
