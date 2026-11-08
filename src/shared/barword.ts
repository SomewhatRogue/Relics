/**
 * The bar's word on screen (Kyle, 2026-11-04): a Mage's is MAGIC, a Cleric's FAITH (2026-11-08: shared/cleric.ts
 * FAITH), every other class's STAMINA.
 * It's the same bar underneath (hero.stamina, sim/hero.ts); only the word, and on screen a violet
 * tint, change for a Mage. Card, trainer and shop text goes through `barWords` with the hero's class.
 */
import type { HeroClass } from './weapons.js';

export const barWord = (cls?: HeroClass): 'MAGIC' | 'FAITH' | 'STAMINA' => (cls === 'MAGE' ? 'MAGIC' : cls === 'HEALER' ? 'FAITH' : 'STAMINA');

/** `text` as a Mage or Cleric reads it: stamina said as magic or faith, the case kept. Unchanged for any other class. */
export function barWords(text: string, cls?: HeroClass): string {
  const w = barWord(cls);
  if (w === 'STAMINA') return text;
  const cap = w[0] + w.slice(1).toLowerCase();
  return text.replace(/STAMINA/g, w).replace(/Stamina/g, cap).replace(/stamina/g, w.toLowerCase());
}
