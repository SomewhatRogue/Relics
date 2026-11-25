/**
 * Titles (docs/design/titles.md, Kyle's yes 2026-11-24): a name earned on the church's road or the hungry one, and
 * bought. Cosmetic only. Earn the right with deeds on a road, then buy that road's titles: Father Odric's for a gift
 * at the Lantern, Dorcas's for coin. Own titles from both; wear one at a time, and only on its own road (a church
 * title while clean, a Keeping Room one while corrupt): worn on the wrong road it shows nothing, and isn't lost.
 * Names from the lore keeper (Kyle's "the holy", "the shadow", "the greedy" among them).
 */
import type { Profile } from './progress.js';
import { isCorrupt } from './corrupt.js';
import { AMENDS_STEPS } from './amends.js';
import { payFor } from './jobs.js';

export type Road = 'church' | 'under';
export type TitleId = 'given' | 'vowed' | 'steadfast' | 'holy' | 'greedy' | 'kept' | 'shadow' | 'gilded';
interface Title { road: Road; step: number; word: string; before: boolean }

/** Each road's four, easiest first; `before`: the title goes before the name (VOWED TESS), else after (TESS THE GIVEN). */
export const TITLES: Record<TitleId, Title> = {
  given: { road: 'church', step: 0, word: 'THE GIVEN', before: false },
  vowed: { road: 'church', step: 1, word: 'VOWED', before: true },
  steadfast: { road: 'church', step: 2, word: 'THE STEADFAST', before: false },
  holy: { road: 'church', step: 3, word: 'THE HOLY', before: false },
  greedy: { road: 'under', step: 0, word: 'THE GREEDY', before: false },
  kept: { road: 'under', step: 1, word: 'THE KEPT', before: false },
  shadow: { road: 'under', step: 2, word: 'SHADOW', before: true },
  gilded: { road: 'under', step: 3, word: 'GILDED', before: true },
};
export const TITLE_ORDER = Object.keys(TITLES) as TitleId[];
export const roadTitles = (road: Road) => TITLE_ORDER.filter((t) => TITLES[t].road === road);

/** Deeds a step needs, and its price in jobs' pay (easy early, a flex at the top). */
export const STEPS = { deeds: [1, 5, 15, 40], jobs: [2, 6, 15, 60] };
/** What counts, a deed each unless said: Lantern gifts a deed a gold's worth; jobs in hungry gear a deed every five. */
export const DEED = { goldPerDeed: 10000, hungryJobs: 5 };

/** A hero's deeds and titles, kept on the profile. */
export interface TitleRecord { deeds: Record<Road, number>; owned: TitleId[]; worn?: TitleId }
const rec = (p: Profile): TitleRecord => (p.titles ??= { deeds: { church: 0, under: 0 }, owned: [] });

/** Count a deed on a road (shared/titles.ts callers: the step, the crossroads, the Lantern, the trough, Dorcas). */
export function deed(p: Profile, road: Road, n = 1): void {
  if (n > 0) rec(p).deeds[road] += n;
}

/** All of a road's deeds: those counted, and on the church's, each amends step reached. */
export function deedsOn(p: Profile, road: Road): number {
  const d = Math.floor(p.titles?.deeds[road] ?? 0);
  return road === 'church' ? d + AMENDS_STEPS.filter((s) => (p.penance ?? 0) >= s).length : d;
}

/** A medium job's pay at the place a hero this level would be working (shared/jobs.ts). */
const jobPay = (level: number) => payFor(3, Math.min(4, 1 + Math.floor(Math.max(0, level - 1) / 4)), false, 'medium');
/** A title's price, in copper, for this hero. */
export const titlePrice = (p: Profile, t: TitleId) => STEPS.jobs[TITLES[t].step] * jobPay(p.level);
/** Earned (deeds enough), owned, wearable now. */
export const earned = (p: Profile, t: TitleId) => deedsOn(p, TITLES[t].road) >= STEPS.deeds[TITLES[t].step];
export const owns = (p: Profile, t: TitleId) => !!p.titles?.owned.includes(t);
/** The road a hero is on now: the church's while clean, the hungry one while corrupt. */
export const roadNow = (p: Profile): Road => (isCorrupt(p) ? 'under' : 'church');

/** Buy a title (the caller takes the price: a Lantern gift for the church's, coin for Dorcas's). False if not earned or owned. */
export function own(p: Profile, t: TitleId): boolean {
  if (!earned(p, t) || owns(p, t)) return false;
  rec(p).owned.push(t);
  return true;
}
/** Wear one (or none, `undefined`). Only one owned. */
export function wear(p: Profile, t: TitleId | undefined): void {
  if (t && !owns(p, t)) return;
  rec(p).worn = t;
}

/** The title shown with this hero's name now: the worn one, if it's on the road they're on. */
export function shownTitle(p: Profile): TitleId | undefined {
  const t = p.titles?.worn;
  return t && TITLES[t] && TITLES[t].road === roadNow(p) ? t : undefined;
}
/** A name with its title: VOWED TESS, TESS THE GIVEN; the name alone with none. */
export function titled(name: string, t: TitleId | undefined): string {
  if (!t) return name;
  return TITLES[t].before ? `${TITLES[t].word} ${name}` : `${name} ${TITLES[t].word}`;
}

/** A title heard from another browser, checked: one of ours, or none. */
export const asTitle = (v: unknown): TitleId | undefined => (typeof v === 'string' && v in TITLES ? (v as TitleId) : undefined);

/** The name over another hero's head, with the title they wear (stage B: everyone sees it). Both views draw this. */
export const headName = (h: { tag?: string; id: string; titleOf?: string }): string => titled((h.tag ?? h.id).toUpperCase(), asTitle(h.titleOf));

/** Fill in a saved record (none: nothing yet; a broken one made sound). */
export function fitTitles(o: unknown): TitleRecord | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const r = o as Partial<TitleRecord>, d = (r.deeds ?? {}) as Partial<Record<Road, number>>;
  const owned = (Array.isArray(r.owned) ? r.owned : []).filter((t): t is TitleId => t in TITLES);
  return { deeds: { church: Math.max(0, Number(d.church) || 0), under: Math.max(0, Number(d.under) || 0) }, owned, ...(r.worn && owned.includes(r.worn) ? { worn: r.worn } : {}) };
}
