/**
 * The chain sickle's numbers (docs/design/chain-sickle.md; Kyle, 2026-11-23), in the rapier's place.
 * SPIN: held, the chain whirls round you; every `every` s it cuts everything within `r` tiles for `dmg`
 * (up to `top` at a full spin), and once the spin is full leaves it bleeding `bleed` s. A wall within `catch` tiles catches the
 * chain and the spin cuts nothing. The spin never staggers. THROW: let go fully spun (the spin's time is the
 * weapon's draw, so anything that draws faster spins up faster), it flies `range` tiles (`big` on the white flash)
 * and snags (sim/hook.ts); on the flash the goblin it snags bleeds `bleed` s. Let go short of full, nothing goes out.
 */
export const SICKLE_SPIN = { every: 0.5, r: 2.8, dmg: 2, top: 7, bleed: 2, catch: 1.2 };
export const SICKLE_THROW = { range: 6, big: 8, bleed: 3 };
