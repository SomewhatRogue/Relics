/**
 * Where relics come from (Kyle, 2026-11-05: "Doing bigger quests like this can get you relics"). A
 * named butcher still drops one now and then (RELIC_DROP.named, rarer now), but the sure ones are the
 * big things: the climax of a curated zone (Hangman's Wood now, Coldscar later), a story mission won,
 * the expedition's beacon held, the bottom of a deep dive. Every one of them goes through awardRelic,
 * which rolls the relic on the caller's seeded stream, notes it on the run (the recap's RELICS row
 * reads it) and hands it back. Pure: the room, the game's job end and the tests all call it.
 */
import { Rng } from './rng.js';
import { FOUND_RELICS, type RelicId } from './magic.js';
import { RELIC_DROP, makeRelic, rollRelic, type RelicItem } from './relicitems.js';

/** A curated zone's climax names its relic: one kind given first (`kind`), then a pool to roll from. */
export interface ZoneRelic { kind?: RelicId; pool?: RelicId[] }

/**
 * Each curated zone's relic, by zone id. Hangman's Wood: the grappling hook, a hook on a rope out of
 * Hempen at the gibbet (the bible's "the grappling hook is the next one found", after the wood's
 * javelin); after that, the ones that fit a wood of snares and droppers. Coldscar (later): a castle's
 * siege kit.
 */
export const ZONE_RELICS: Record<string, ZoneRelic> = {
  hangman: { kind: 'hook', pool: ['hook', 'sentry', 'javelin'] },
  coldscar: { pool: ['knuckle', 'bomb', 'bell'] },
  // Fenmere: the hook first (the fen's gaffers), then what fits a fight on causeways and boards (Kyle's call).
  fen: { pool: ['hook', 'lodestone', 'javelin'] },
};

/** What gave it. A zone's climax names the zone. */
/** `boss`: a boss of the kit's sure chest, found in its hoard (docs/plans/bosses.md): the Doorkeepers' 15% (BOSS.chest.relic),
 *  Hempen's 20% (HEMPEN_BOSS.chest.relic, never the hook: Hangman's Wood gives that one at the job's end). */
export type RelicSource = 'deep' | 'story' | 'beacon' | 'named' | 'boss' | { zone: string };
export const sourceKey = (s: RelicSource) => (typeof s === 'string' ? s : 'zone:' + s.zone);

/** The odds a sure relic comes elemental (and LOUD of those), by source: the bigger the job, the better. */
const ODDS: Record<string, { elemental: number; loud: number }> = {
  named: RELIC_DROP, deep: RELIC_DROP, boss: RELIC_DROP,
  story: { elemental: 0.25, loud: 0.3 },
  beacon: { elemental: 0.25, loud: 0.35 },
  zone: { elemental: 0.2, loud: 0.3 },
};

/** A relic won on a run, and what gave it. */
export interface RelicWon { item: RelicItem; from: string }
/** What awardRelic notes the award on: a run (sim/run.ts) or anything with the same list. */
export interface Awarded { relicsWon?: RelicWon[] }

/**
 * Award one relic from `source`, on the caller's seeded stream (`rng`; never Math.random). A zone that
 * names a kind gives it if you don't have one yet; otherwise any source gives a kind from its pool you
 * don't have yet, plain and full; once you have them all, any from the pool, maybe elemental. `owned`:
 * the hero's relics (none known: every kind counts as new). Noted on `run` (if given) and returned.
 */
export function awardRelic(run: Awarded | null | undefined, rng: Rng, source: RelicSource, owned: readonly RelicItem[] = [], kinds?: readonly RelicId[]): RelicItem {
  const zone = typeof source === 'string' ? undefined : ZONE_RELICS[source.zone];
  const pool = [...(kinds ?? zone?.pool ?? FOUND_RELICS)];
  const has = (k: RelicId) => owned.some((r) => r.kind === k);
  const odds = ODDS[typeof source === 'string' ? source : 'zone'];
  const first = zone?.kind && !has(zone.kind) ? zone.kind : pool.find((k) => !has(k));
  const item = first ? makeRelic(rng, first) : rollRelic(rng, odds.elemental, odds.loud, pool);
  if (run) run.relicsWon = [...(run.relicsWon ?? []), { item, from: sourceKey(source) }];
  return item;
}

/** The sure relics a won job gives at its end, by what it was (a zone's climax may have given its own already). */
export function jobSources(job: { deep?: boolean; exped?: string; objective?: string; zone?: string }): RelicSource[] {
  const out: RelicSource[] = [];
  if (job.zone && ZONE_RELICS[job.zone]) out.push({ zone: job.zone });
  if (job.exped) out.push('beacon');
  if (job.objective === 'story') out.push('story');
  if (job.deep) out.push('deep');
  // One relic a job: the biggest reason wins.
  return out.slice(0, 1);
}

/** A won job's relic for this hero, unless the run already holds one from the same source (a zone's
 *  climax awards it in the room). Seeded per hero, so each player in a party gets their own. */
export function jobRelic(run: Awarded & { job: Parameters<typeof jobSources>[0] }, seed: number, owned: readonly RelicItem[]): RelicItem | undefined {
  const src = jobSources(run.job)[0];
  if (!src || run.relicsWon?.some((w) => w.from === sourceKey(src))) return undefined;
  return awardRelic(run, new Rng(seed || 1), src, owned);
}

/** Every relic this hero takes home from a won run: what the run already holds (a zone's climax), as
 *  copies, then the job's own sure one. */
export function wonRelics(run: Awarded & { job: Parameters<typeof jobSources>[0] }, seed: number, owned: readonly RelicItem[]): RelicItem[] {
  const held = (run.relicsWon ?? []).map((w) => ({ ...w.item })).filter((r) => !owned.some((o) => o.id === r.id));
  const fresh = jobRelic(run, seed, [...owned, ...held]);
  return fresh ? [...held, fresh] : held;
}
