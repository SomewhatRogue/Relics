/**
 * The job's end (Kyle, 2026-11-04: "it shouldn't immediately hit you with pick a knack; it should give
 * you a mission recap"): one framed card of what happened (the rooms or the expedition's jobs, goblins,
 * downs, the time) and what you came home with (gold, xp, the freed, what you found), then one button.
 * A knack waiting comes after that button, never before. Each player's own (game.ts finish).
 */
import { TRAINERS } from '../shared/town';
import { itemName } from '../shared/tuning';
import { relicName } from '../shared/relicitems';
import type { Game } from './game';
import type { Panel } from './panels';
import { labelRows } from './card';
import { openTree } from './treeui';
import { RELICW } from './relicwords';
import { RECAPW } from './recapwords';

const p = (s: string) => `<p>${s}</p>`;
const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** A job not won, by how it ended (Game.finish): driven back, gone early from a party, or cut off from it. */
const ENDED = {
  half: 'You keep half the gold. Nobody you freed comes home.',
  left: "You left early. You keep the gold you picked up, not the job's pay.",
  cut: "Cut off from your party. You keep the gold you picked up, not the job's pay.",
  lostCut: 'Cut off, and your party was driven back. You keep half the gold. Nobody you freed comes home.',
};

export function showResult(g: Game, panel: Panel): void {
  const r = g.result!, c = r.recap;
  g.result = null;
  // What happened out there.
  const did = c ? labelRows([
    c.rooms ? [RECAPW.rooms, RECAPW.of(...c.rooms)] : ['', ''],
    c.jobs ? [RECAPW.jobs, c.jobs[1] ? RECAPW.of(...c.jobs) : String(c.jobs[0])] : ['', ''],
    [RECAPW.sides, c.sides ? String(c.sides) : ''],
    [RECAPW.goblins, String(c.kills)],
    [RECAPW.dens, c.dens ? String(c.dens) : ''],
    [RECAPW.downed, String(c.downs)],
    [RECAPW.time, c.secs ? clock(c.secs) : ''],
  ], 'recap') : '';
  // What you came home with.
  const got = labelRows([
    ['GOLD', String(r.gold)], ['XP', String(r.xp)], ['SAVED', r.won ? String(r.rescued) : ''], ['LOST', r.lost ? `${r.lost} to the fire` : ''],
    [RECAPW.found, c?.found.join(', ') ?? ''],
    [RECAPW.treasure, r.treasure.map(itemName).join(', ')],
    [RECAPW.relic, c?.relics.join(', ') ?? ''],
  ], 'recap');
  const lines = r.won ? [] : [ENDED[r.half ? (r.how === 'dropped' ? 'lostCut' : 'half') : r.how === 'dropped' ? 'cut' : 'left']];
  if (r.levels) lines.push(`<b>Level ${g.profile.level}.</b> ${title(TRAINERS[g.profile.cls].name)} trains you, at ${TRAINERS[g.profile.cls].where}.`);
  for (const i of r.sold) lines.push(`No room for the ${itemName(i)}: sold for 20 gold.`);
  if (r.relic) lines.push(RELICW.cutOut(r.job.boss ?? '', relicName(r.relic)) + ' ' + (g.profile.relic === r.relic.id ? RELICW.carryHint : RELICW.shelfHint));
  if (r.lit !== undefined) lines.push(RELICW.litLeft(r.lit));
  if (r.won && r.job.objective === 'story') lines.push(`<b>Barrowby's bell rings across the valley.</b> The council sits once enough people are home.`);
  const html = `<div class="recapcard">${p(`<b>${r.job.title}</b>`)}${did}<hr>${got}${lines.map(p).join('')}</div>`;
  // One button. A knack waiting is picked after it, not on this card.
  const picks = g.profile.picks;
  panel.show(r.won ? 'JOB DONE' : r.half ? 'DRIVEN BACK' : 'HOME EARLY', html, [
    { label: picks ? RECAPW.next : RECAPW.home, primary: true, act: () => (picks ? openTree(g, panel) : panel.hide()) },
  ], true);
}
