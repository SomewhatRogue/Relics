/**
 * The bar's word on screen (Kyle, 2026-11-04): a Mage's is MAGIC, every other class's is STAMINA.
 * It's the same bar underneath (hero.stamina, sim/hero.ts); only the word, and on screen a violet
 * tint, change for a Mage. Card, trainer and shop text goes through `barWords` with the hero's class.
 */
import type { HeroClass } from './weapons.js';

export const barWord = (cls?: HeroClass): 'MAGIC' | 'STAMINA' => (cls === 'MAGE' ? 'MAGIC' : 'STAMINA');

/** `text` as a Mage reads it: stamina said as magic, the case kept. Unchanged for any other class. */
export function barWords(text: string, cls?: HeroClass): string {
  if (cls !== 'MAGE') return text;
  return text.replace(/STAMINA/g, 'MAGIC').replace(/Stamina/g, 'Magic').replace(/stamina/g, 'magic');
}
