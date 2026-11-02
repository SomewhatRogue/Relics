/**
 * What each foe takes from each kind of blow: the one table every damage path reads (blades, shots,
 * spells, bursts, burns, chains). Over 1 is a weakness and pops WEAK where it lands; under 1 a
 * resistance and pops RESIST (small, grey). A kind not listed takes everything as it comes.
 *
 * The jobs it backs up (Kyle, 2026-11-01): fire for swarms (spiders, rag-clad looters, the drummer's
 * hide drum), frost for the big and the quick (lungers, brutes, butchers, bosses, the Stoker), storm
 * for packs and shields (it goes round a board: sim/bolts.ts) and the hexer's charms.
 */
import type { Element } from './magic.js';

/** What a blow is made of. */
export type Hurt = Element | 'physical';

export const WEAK: Record<string, Partial<Record<Hurt, number>>> = {
  /** Small goblins: plain. Fire's spread is what clears a crowd of them. */
  scrapper: {},
  looter: { fire: 1.5 },
  archer: { fire: 1.2, storm: 1.2 },
  /** The lunge is the danger: frost slows it to a crawl. */
  lunger: { frost: 1.4, fire: 0.9 },
  /** The brute: thick hide, cold-blooded (shrugs a little frost, though it still slows). */
  heavy: { physical: 0.85, frost: 0.8, storm: 1.2 },
  /** The board takes blows from the front (VARIANTS.shield.front); lightning goes round it. */
  shield: { storm: 1.4, fire: 0.8 },
  hexer: { storm: 1.6, frost: 0.8 },
  drummer: { fire: 1.6, storm: 1.2 },
  butcher: { fire: 0.7, frost: 1.3 },
  /** A named butcher (a hunt's quarry, a story boss). */
  boss: { fire: 0.8, frost: 1.25, storm: 0.9 },
  /** The Stoker lives by the kiln: fire hardly touches it; cold is what hurts. */
  stoker: { fire: 0.6, frost: 1.6, storm: 0.9 },
  spider: { fire: 2.5, storm: 1.2 },
  brood: { fire: 1.8, frost: 1.2, physical: 0.9 },
  nest: { fire: 3, frost: 0.5, storm: 0.8, physical: 0.6 },
};

export const weakness = (kind: string, by: Hurt | '' = 'physical') => WEAK[kind]?.[by || 'physical'] ?? 1;

/** Which row of the table a foe reads: its variant, else a bow, else a named butcher, else its kind. */
export const foeKind = (e: { kind: string; variant?: string; bow?: boolean; name?: string }): string =>
  e.variant ?? (e.bow ? 'archer' : e.name && e.kind === 'butcher' ? 'boss' : e.kind);

export const weakOn = (e: { kind: string; variant?: string; bow?: boolean; name?: string }, by: Hurt | '' = 'physical') => weakness(foeKind(e), by);

/** At most one WEAK or RESIST over a foe this often (seconds), so a storm of hits doesn't spam it. */
export const WEAK_POP = 0.5;
