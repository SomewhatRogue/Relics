/**
 * An element put on a weapon by Old Merren, for five jobs (docs/design/element-augments.md; Kyle, 2026-11-24: "Yes and
 * yes" to Merren and to building it). It replaces the old elemental traits that rolled on forged weapons. Called an
 * "edge" in the code, so it never meets the relics' own `augments`.
 *
 * The fight reads it as the old trait it stands for (sim/traits.ts `traitsOf`): fire burns, frost chills, storm
 * shocks on charged hits and full draws.
 */
import { ELEMENT_TRAITS, type TraitId } from './loot.js';
import type { MatId, Mats } from './materials.js';
import { hasMats, spendMats } from './materials.js';

export type EdgeEl = 'fire' | 'frost' | 'storm';
export const EDGE_ELS: EdgeEl[] = ['fire', 'frost', 'storm'];

/** A dressing's grade: 1 plain, 2 STRONG, 3 FIERCE (Kyle, 2026-11-25: "better quality materials for higher burn etc from
 *  the wild"). Set by the material he works in. */
export type Grade = 1 | 2 | 3;

/** On a weapon: which element, its grade, and the jobs it has left. (A save from before grades reads as grade 1.) */
export interface Edge { el: EdgeEl; jobs: number; grade?: Grade }

/** The material each grade of each element is worked in (the lore keeper, 2026-11-25; docs/design/materials.md). */
export const EDGE_MATS: Record<EdgeEl, Record<Grade, MatId>> = {
  fire: { 1: 'charcoal', 2: 'fatwood', 3: 'saltpetre' },
  frost: { 1: 'clay', 2: 'mint', 3: 'peat' },
  storm: { 1: 'struck', 2: 'amber', 3: 'thunder' },
};

/** How much harder each grade hits than the plain one, for the fight (sim/elements.ts). */
export const GRADE_MUL: Record<Grade, number> = { 1: 1, 2: 1.5, 3: 2 };

/** A weapon's live edge grade, 1 if none is said. */
export const gradeOf = (it: { edge?: Edge } | undefined): Grade => (edgeOf(it) ? (it!.edge!.grade ?? 1) : 1);

/** The old trait each stands for in the fight. */
export const EDGE_TRAIT: Record<EdgeEl, TraitId> = { fire: 'ember', frost: 'rime', storm: 'storm' };

export const EDGE = {
  /** Jobs an edge lasts: any job finished, however it ended (Kyle: "just 5 missions in general"). */
  jobs: 5,
  /** Its price after a hero's free first of that element (Kyle: 20s). */
  price: 2000,
  /** The level Merren will see you from, and his runner fetches you (Kyle). */
  level: 5,
} as const;

export const isEdgeEl = (x: unknown): x is EdgeEl => typeof x === 'string' && (EDGE_ELS as string[]).includes(x);

/** The element live on a weapon, if any. */
export const edgeOf = (it: { edge?: Edge } | undefined): EdgeEl | undefined =>
  it?.edge && it.edge.jobs > 0 ? it.edge.el : undefined;

/** The old trait a weapon's live edge stands for, for the fight and the card. */
export const edgeTrait = (it: { edge?: Edge } | undefined): TraitId | undefined => {
  const el = edgeOf(it);
  return el ? EDGE_TRAIT[el] : undefined;
};

/** What the hero pays for `el` at `grade`: nothing for their first of an element at the plain grade; else the coin and
 *  one of that grade's material. */
export interface EdgeCost { gold: number; mats: Mats; free: boolean }
export function edgeCost(p: { edgeFree?: EdgeEl[] }, el: EdgeEl, grade: Grade = 1): EdgeCost {
  const free = grade === 1 && !(p.edgeFree ?? []).includes(el);
  return free ? { gold: 0, mats: {}, free } : { gold: EDGE.price, mats: { [EDGE_MATS[el][grade]]: 1 }, free };
}

export type EdgeRefusal = 'mage' | 'level' | 'weapon' | 'gold' | 'mats';

/** Why Merren can't put `el` on `it` for this hero, or null if he can. */
export function edgeRefusal(p: { cls: string; level: number; gold: number; mats?: Mats; edgeFree?: EdgeEl[] }, it: { slot?: string } | undefined, el: EdgeEl, grade: Grade = 1): EdgeRefusal | null {
  if (p.cls === 'MAGE') return 'mage';
  if (p.level < EDGE.level) return 'level';
  if (!it || (it.slot && it.slot !== 'weapon')) return 'weapon';
  const c = edgeCost(p, el, grade);
  if (p.gold < c.gold) return 'gold';
  if (!hasMats(p.mats, c.mats)) return 'mats';
  return null;
}

/** Put `el` on `it`, paying for it. Replaces any edge it had. Returns the cost paid, or null if refused. */
export function putEdge(p: { cls: string; level: number; gold: number; mats?: Mats; edgeFree?: EdgeEl[] }, it: { slot?: string; edge?: Edge }, el: EdgeEl, grade: Grade = 1): EdgeCost | null {
  if (edgeRefusal(p, it, el, grade)) return null;
  const c = edgeCost(p, el, grade);
  p.gold -= c.gold;
  spendMats((p.mats ??= {}), c.mats);
  if (c.free) (p.edgeFree ??= []).push(el);
  it.edge = { el, jobs: EDGE.jobs, grade };
  return c;
}

/** A job is over: every listed weapon's edge loses one job. Returns the elements (and grades) that ran out. */
export function tickEdges(items: ({ edge?: Edge } | undefined)[]): { el: EdgeEl; grade: Grade }[] {
  const gone: { el: EdgeEl; grade: Grade }[] = [];
  for (const it of items) {
    if (!it?.edge) continue;
    it.edge.jobs -= 1;
    if (it.edge.jobs <= 0) gone.push({ el: it.edge.el, grade: it.edge.grade ?? 1 }), delete it.edge;
  }
  return gone;
}

/** A saved edge, whatever the save says: a known element and 1 to 5 jobs, else none. */
export function fitEdge(e: unknown): Edge | undefined {
  if (!e || typeof e !== 'object') return undefined;
  const { el, jobs, grade } = e as { el?: unknown; jobs?: unknown; grade?: unknown };
  const n = Math.floor(Number(jobs));
  const g = grade === 2 || grade === 3 ? grade : undefined;
  return isEdgeEl(el) && n >= 1 ? { el, jobs: Math.min(EDGE.jobs, n), ...(g ? { grade: g } : {}) } : undefined;
}

/** The element trait that shows on a piece: its live edge first, else one it carries itself (a named piece's own). */
export const elementTraitOf = (it: { edge?: Edge; traits?: TraitId[] } | undefined | null): TraitId | undefined =>
  edgeTrait(it ?? undefined) ?? it?.traits?.find((t) => ELEMENT_TRAITS.includes(t));

/** A piece as the load finds it: the old random element gone (a named piece keeps its own), the edge fitted or dropped. */
export function fitItemEdge<T extends { traits?: TraitId[]; edge?: Edge; hungry?: string; unique?: string }>(it: T): T {
  const traits = it.hungry || it.unique ? it.traits : it.traits?.filter((t) => !ELEMENT_TRAITS.includes(t)), edge = fitEdge(it.edge);
  const out = { ...it, ...(traits ? { traits } : {}) };
  if (edge) out.edge = edge; else delete out.edge;
  return out;
}

/** Every piece a hero has, and the free elements they have used: once more on every load, so it is safe to repeat. */
export function fitEdges(p: { arms?: Record<string, any>; armor?: any; legs?: any; rings?: any[]; bag?: any[]; stash?: any[]; buyback?: { item: any }[]; edgeFree?: EdgeEl[] }): void {
  const f = (x: any) => (x ? fitItemEdge(x) : x);
  if (p.arms) p.arms = Object.fromEntries(Object.entries(p.arms).map(([k, it]) => [k, f(it)]));
  if (p.armor) p.armor = f(p.armor);
  if (p.legs) p.legs = f(p.legs);
  if (p.rings) p.rings = p.rings.map(f);
  if (p.bag) p.bag = p.bag.map(f);
  if (p.stash) p.stash = p.stash.map(f);
  if (p.buyback) p.buyback = p.buyback.map((b) => ({ ...b, item: f(b.item) }));
  p.edgeFree = [...new Set(Array.isArray(p.edgeFree) ? p.edgeFree.filter(isEdgeEl) : [])];
}
