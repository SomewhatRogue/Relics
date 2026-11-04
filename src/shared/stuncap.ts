/**
 * How often one hero may take the same goblin's turn (Kyle, 2026-11-04): a stun, daze, knockdown,
 * pin, retch, blind, snare or a skill's stagger. Once a hero has, that goblin shrugs off their next
 * for `every` seconds: the blows still land, it just isn't stopped. Another hero can still stop it,
 * so a party can chain them. The goblin says so at most once every `say` seconds (sim/stuns.ts).
 */
export const STUN_CAP = { every: 6, say: 1 };
