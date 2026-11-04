/**
 * The words for each kit: KIT, the one line on how it guards and dodges (the face's sheet, main.ts),
 * and HOLD, what a held ATTACK does with it (the BUTTONS panel, legend.ts). The bows and the crossbow
 * have their own ATTACK lines there.
 */
/** One line on how each kit guards and dodges. */
export const KIT: Record<string, string> = {
  sword: 'BEST GUARD  HOLD: SHIELD BASH, STUNS A CROWD ON THE FLASH  QUICK COUNTER: RIPOSTE',
  greatsword: 'PARRY ONLY  HOLD: OVERHEAD, SHOCKWAVE ON THE FLASH',
  spear: 'LONG REACH  HOLD: LUNGE THROUGH THREE, PINS ON THE FLASH',
  daggers: 'LONG DASH  ONE AT A TIME  BACKSTAB 2.5X',
  longbow: 'TAP: SHORT SWORD  HOLD: DRAW  LET GO ON THE FLASH TO BLIND',
  shortbow: 'TAP: SHORT SWORD  HOLD: QUICK SHOT ON THE MOVE',
  crossbow: 'TAP: SHORT SWORD  HOLD: AIM, LET GO TO FIRE',
  wand: "SPARKS ON THE MOVE  HOLD: BURST (20 STAMINA), BREAKS BLOWS ON THE FLASH",
  staff: "CLOSE SLASH  HOLD: WALL (30 STAMINA)",
  spellblade: "HITS CHARGE IT  HOLD: WREATHE, FREE ON THE FLASH  CATCH AS A BLOW LANDS",
  mace: 'SHORT REACH  3RD BLOW HEALS  HOLD: SMITE, SHIELDS ON THE FLASH',
  rapier: 'LONG REACH  DASH  HOLD: LUNGE THROUGH TWO',
  poisoner: 'SHORT SWORD  DASH  HOLD: POISON DART',
  censer: 'BEST GUARD  3RD BLOW LEAVES COALS  HOLD: WHIRL, SHIELDS ON THE FLASH',
  flail: 'SHOVES  2ND BLOW HEALS  HOLD: SPIN, STUNS ON THE FLASH',
};

/** What holding ATTACK and letting go does, per weapon: "Hold and let go for the {HOLD}." */
export const HOLD: Record<string, string> = {
  sword: 'shield bash', greatsword: 'overhead', spear: 'lunge', daggers: 'thrown dagger', wand: 'burst', staff: 'wall',
  spellblade: 'wreathe', mace: 'smite', rapier: 'lunge', poisoner: 'poison dart', censer: 'whirl', flail: 'spin',
};
