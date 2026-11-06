/**
 * What a hero can buy from their trainer and pick as knacks, as screens of tiles (Kyle, 2026-11-05:
 * "the UX/UI of the upgrades is really confusing, we should have it be screens and more visual"). Four
 * tabs: SKILLS (the class's three as a fork, CARRY ONE, and the skill's recharge ranks), MOVES (the
 * technique track and the movement ladder), RANKS (the base stats) and KNACKS (the two on offer as a
 * fork, PICK ONE, then the four chains). Each tile: an icon, a name, one line, its cost, and a state
 * (learned, can buy, short of gold, locked with why, maxed, on offer). A track is a list of steps; a
 * step of two or more tiles is a fork (choices that exclude each other), so a new fork is one more step
 * in a track. Built from the profile alone, so the screen and the tests read the same tiles. Nothing
 * here changes a rule, a price or an effect: it reads trainrows.ts and chains.ts.
 */
import { trainerRows, type Pip, type Rung, type TrainRow } from '../shared/trainrows';
import { CLASS_SKILL, RELICS, SKILL_CHOICES, type RelicId } from '../shared/magic';
import { knowsSkill } from '../shared/skillteach';
import { LADDER_TITLE } from '../shared/ladder';
import { CHAINS, CLASS_CHAINS, chainOf, nextStep, perkOffer } from '../shared/chains';
import { PERKS, perkText, type PerkId } from '../shared/perks';
import type { Profile } from '../shared/progress';
import { tileIcon } from './upiconkeys';
import { UPW } from './upgradewords';
import { KNW } from './treewords';

/** owned: learned or taken; max: every rank; buy: can afford now; poor: short of gold; locked: a level
 *  or something first; pick: a knack on offer; next: a knack that can come up on a level up. */
export type TileState = 'owned' | 'max' | 'buy' | 'poor' | 'locked' | 'pick' | 'next';
export type TileAct = 'buy' | 'carry' | 'pick' | '';
export interface UpTile {
  key: string; name: string; line: string; icon: string; state: TileState;
  /** The short word on the tile: its cost, why it's locked, or its state. */
  badge: string;
  /** Why it's locked ('' when it isn't). */
  lock: string;
  /** Ranks, for something bought more than once. */
  pips?: Pip[];
  /** The current pick of a fork: the skill carried, the branch chosen. */
  current?: boolean;
  act: TileAct;
}
/** One step on a track. Two or more tiles: a fork, `fork` the words over it. */
export interface UpStep { tiles: UpTile[]; fork?: string }
/** `track` goes down the screen, `row` across (a knack chain), `grid` is tiles side by side with no order. */
export interface UpTrack { id: string; title: string; sum: string; kind: 'track' | 'row' | 'grid'; steps: UpStep[]; note?: string }
export type TabId = 'skills' | 'moves' | 'ranks' | 'knacks';
export interface UpTab { id: TabId; title: string; ready: number; tracks: UpTrack[] }
export interface UpOpts { atTrainer: boolean; knacksOpen: boolean }

/** A trainer's row as a tile. */
export function rowTile(r: TrainRow, cls?: string): UpTile {
  const multi = r.max > 1;
  const state: TileState = r.state === 'max' ? (multi ? 'max' : 'owned') : r.state === 'needs' ? 'locked' : r.state;
  const lock = r.state === 'locked' ? UPW.level(r.level) : r.state === 'needs' ? UPW.first(r.needs) : '';
  const badge = state === 'owned' ? UPW.owned : state === 'max' ? UPW.max : lock || (state === 'poor' ? UPW.short(r.price) : UPW.cost(r.price));
  return { key: r.key, name: r.name, line: r.text, icon: r.skill ? 's:' + r.skill : tileIcon(r.key, cls), state, badge, lock, ...(multi ? { pips: r.pips } : {}), act: state === 'buy' ? 'buy' : '' };
}

/**
 * A fork's marks: the chosen tile is current. `permanent` (a choice made once, like the guard forks to
 * come): the others are locked, NOT CHOSEN. Otherwise (the skill you carry) the others stay as they are.
 */
export function markFork(tiles: UpTile[], chosen: string | undefined, permanent: boolean, chosenBadge = UPW.chosen): UpTile[] {
  return tiles.map((t) => t.key === chosen ? { ...t, current: true, badge: chosenBadge, ...(permanent ? { state: 'owned' as const, act: '' as const } : {}) } :
    permanent && chosen ? { ...t, state: 'locked', lock: UPW.notChosen, badge: UPW.notChosen, act: '' } : t);
}

const single = (tiles: UpTile[]): UpStep[] => tiles.map((t) => ({ tiles: [t] }));
const nextAt = (rs: TrainRow[]) => Math.min(...rs.filter((r) => r.state === 'locked').map((r) => r.level), 99) % 99;
const sumOf = (rs: TrainRow[], done: (r: TrainRow) => boolean) => `${rs.filter(done).length} OF ${rs.length}` + (nextAt(rs) ? ` &middot; NEXT AT LEVEL ${nextAt(rs)}` : '');

/** The skills: the class's three, CARRY ONE, the one carried marked; and the skill's recharge ranks. */
function skillsTab(p: Profile, rows: TrainRow[]): UpTrack[] {
  const choices = SKILL_CHOICES[p.cls], known = choices.filter((r) => knowsSkill(p, r));
  const carried: RelicId = p.skill && known.includes(p.skill) ? p.skill : known[0] ?? CLASS_SKILL[p.cls];
  const skills = rows.filter((r) => r.group === 'skills');
  const tiles = skills.map((r) => {
    const t = rowTile(r);
    return r.skill && knowsSkill(p, r.skill) ? { ...t, state: 'owned' as const, badge: UPW.owned, act: r.skill === carried ? '' as const : 'carry' as const } : t;
  });
  const carryKey = known.length ? skills.find((r) => r.skill === carried)?.key : undefined;
  const drill = rows.find((r) => r.key === 'drill:skill');
  return [
    { id: 'skills', title: 'SKILLS', sum: sumOf(skills, (r) => !!r.skill && knowsSkill(p, r.skill)), kind: 'track', steps: [{ tiles: markFork(tiles, carryKey, false, UPW.carrying), fork: UPW.carryOne }], note: known.length > 1 ? UPW.carryNote : undefined },
    ...(drill ? [{ id: 'skilldrill', title: drill.name, sum: `${drill.rank} OF ${drill.max}`, kind: 'grid' as const, steps: [{ tiles: [rowTile(drill)] }] }] : []),
  ];
}

/** The class's technique (and what its dodge leaves) down one track, its movement ladder down another. */
function movesTab(p: Profile, rows: TrainRow[]): UpTrack[] {
  const craft = rows.filter((r) => r.group === 'craft' && r.key !== 'drill:technique'), rungs = rows.filter((r) => r.group === 'ladder');
  return [
    { id: 'craft', title: 'TECHNIQUE', sum: sumOf(craft, (r) => r.state === 'max'), kind: 'track', steps: single(craft.map((r) => rowTile(r, p.cls))) },
    { id: 'ladder', title: LADDER_TITLE[p.cls], sum: sumOf(rungs, (r) => r.state === 'max'), kind: 'track', steps: single(rungs.map((r) => rowTile(r, p.cls))) },
  ];
}

/** The base stats, side by side. */
function ranksTab(rows: TrainRow[]): UpTrack[] {
  const ranks = rows.filter((r) => r.group === 'ranks' && r.key !== 'drill:skill');
  const have = ranks.reduce((n, r) => n + r.rank, 0), all = ranks.reduce((n, r) => n + r.max, 0);
  return [{ id: 'ranks', title: 'RANKS', sum: `${have} OF ${all}` + (nextAt(ranks) ? ` &middot; NEXT AT LEVEL ${nextAt(ranks)}` : ''), kind: 'grid', steps: [{ tiles: ranks.map((r) => rowTile(r)) }] }];
}

/** A knack as a tile: taken, on offer, next on its chain, or waiting on the one before. */
export function knackTile(p: Profile, id: PerkId, offer: PerkId[], open: boolean): UpTile {
  const c = chainOf(id)!, steps = CHAINS[c].steps as PerkId[], i = steps.indexOf(id), next = nextStep(c, p.perks);
  const base = { key: 'knack:' + id, name: PERKS[id].name, line: perkText(id, p.cls, 'gain'), icon: tileIcon('knack:' + id), lock: '' };
  if (p.perks.includes(id)) return { ...base, state: 'owned', badge: UPW.taken, act: '' };
  if (offer.includes(id)) return { ...base, state: 'pick', badge: UPW.onOffer, act: open ? 'pick' : '' };
  if (i === next) return { ...base, state: 'next', badge: UPW.next, act: '' };
  const lock = UPW.first(PERKS[steps[i - 1]].name);
  return { ...base, state: 'locked', lock, badge: lock, act: '' };
}

/** The two on offer as a fork (PICK ONE), then each chain across. */
function knacksTab(p: Profile, open: boolean): UpTrack[] {
  const offer = p.picks > 0 ? perkOffer(p) : [];
  const fork: UpTrack[] = offer.length ? [{ id: 'offer', title: KNW.waiting(p.picks), sum: '', kind: 'track', steps: [{ tiles: offer.map((id) => knackTile(p, id, offer, open)), fork: undefined }], note: open ? undefined : KNW.notHere }] : [];
  return [...fork, ...CLASS_CHAINS[p.cls].map((c) => {
    const steps = CHAINS[c].steps as PerkId[];
    return { id: c, title: CHAINS[c].name, sum: `${steps.filter((s) => p.perks.includes(s)).length} / ${steps.length}`, kind: 'row' as const, steps: single(steps.map((id) => knackTile(p, id, offer, open))) };
  })];
}

const readyIn = (tracks: UpTrack[]) => new Set(tracks.flatMap((t) => t.steps.flatMap((s) => s.tiles)).filter((t) => t.act === 'buy' || t.act === 'pick').map((t) => t.key)).size;

/** Every tab for this hero. */
export function upgradeTabs(p: Profile, o: UpOpts): UpTab[] {
  const rows = trainerRows(p);
  const tabs: [TabId, UpTrack[]][] = [['skills', skillsTab(p, rows)], ['moves', movesTab(p, rows)], ['ranks', ranksTab(rows)], ['knacks', knacksTab(p, o.knacksOpen)]];
  return tabs.map(([id, tracks]) => ({ id, title: UPW.tabs[id], ready: id === 'knacks' ? (o.knacksOpen ? Math.min(p.picks, readyIn(tracks)) : 0) : o.atTrainer ? readyIn(tracks) : 0, tracks }));
}

/** Every tile on every tab (a fork's tiles once each). */
export const allTiles = (tabs: UpTab[]) => tabs.flatMap((t) => t.tracks.flatMap((k) => k.steps.flatMap((s) => s.tiles)));

/** What a tile opens to: its whole effect, now and after, the ranks, and the one button (or why not). */
export interface UpDetail { tile: UpTile; text: string; now: string; after: string; ladder?: Rung[]; rows?: [string, string][]; button?: { label: string; act: TileAct; on: boolean }; note: string }

export function tileDetail(p: Profile, key: string, o: UpOpts, where?: { who: string; where: string }): UpDetail | null {
  const tile = allTiles(upgradeTabs(p, o)).find((t) => t.key === key);
  if (!tile) return null;
  if (key.startsWith('knack:')) {
    const id = key.slice(6) as PerkId, steps = CHAINS[chainOf(id)!].steps as PerkId[];
    const taken = steps.filter((s) => p.perks.includes(s)), gains = (ids: PerkId[]) => ids.map((s) => perkText(s, p.cls, 'gain')).join(', ');
    const button = tile.state === 'pick' ? { label: `${UPW.take} ${tile.name}`, act: 'pick' as const, on: tile.act === 'pick' } : undefined;
    const note = tile.state === 'pick' && !o.knacksOpen ? KNW.notHere : tile.state === 'next' ? UPW.nextKnack : '';
    return { tile, text: perkText(id, p.cls), now: gains(taken) || UPW.nothingYet, after: tile.state === 'owned' ? '' : gains([...taken, id]), button, note };
  }
  const r = trainerRows(p).find((x) => x.key === key)!, multi = r.max > 1;
  const skill = r.skill && r.id !== 'skill' ? r.skill : r.key === 'learn:skill' ? r.skill : undefined;
  const text = r.text, rows: [string, string][] = skill ? [['COOLDOWN', `${RELICS[skill].cooldown} s`]] : [];
  if (tile.act === 'carry' || tile.current) {
    return { tile, text, now: '', after: '', rows, button: tile.act === 'carry' ? { label: `${UPW.carry} ${tile.name}`, act: 'carry', on: true } : undefined, note: '' };
  }
  const label = tile.state === 'locked' ? tile.lock : `${r.lesson ? 'LEARN' : `RANK ${r.rank + 1}`}: ${UPW.cost(r.price)}`;
  const done = tile.state === 'owned' || tile.state === 'max';
  return {
    tile, text, rows, now: r.now || (multi ? UPW.nothingYet : UPW.notYet), after: done ? '' : r.next, ...(multi ? { ladder: r.ladder } : {}),
    button: done ? undefined : { label, act: 'buy', on: tile.state === 'buy' && o.atTrainer },
    note: !done && !o.atTrainer && where ? UPW.away(where.who, where.where) : '',
  };
}
