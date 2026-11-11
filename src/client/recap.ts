/**
 * The job's end (Kyle, 2026-11-04: "it shouldn't immediately hit you with pick a knack; it should give
 * you a mission recap"; 2026-11-05: "Shouldn't have knack picking after a mission, just let them return
 * home and show them a recap of how they and all players did"): one framed card of what happened (the
 * rooms or the expedition's jobs, goblins, the time), every hero in the party side by side
 * (recapparty.ts), what you came home with (gold, xp, the freed, what you found), and one button home.
 * A knack waiting is never picked here: it's banked, and the PACK says so (knackcues.ts). Each player's
 * own (game.ts finish).
 */
import { UNIQUE_COL, isUnique } from './uniquelook';
import { STAITHE_WORDS } from '../shared/staithewords';
import { TRAINERS } from '../shared/town';
import { itemName } from '../shared/tuning';
import { relicName } from '../shared/relicitems';
import type { Game } from './game';
import type { Panel } from './panels';
import { DEEP_WORDS } from './deepwords';
import { labelRows } from './card';
import { RELICW } from './relicwords';
import { chargePips } from './reliccard';
import { relicCol, relicItemIcon } from './relicicons';
import { RECAPW } from './recapwords';
import { partyTable } from './recapparty';
import './recap.css';

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
    // (Each hero's downs are in their column when the room counted them.)
    [RECAPW.downed, c.party.length ? '' : String(c.downs)],
    [RECAPW.time, c.secs ? clock(c.secs) : ''],
  ], 'recap') : '';
  // What you came home with.
  const got = labelRows([
    ['GOLD', String(r.gold)], ['XP', String(r.xp)], ['SAVED', r.won ? String(r.rescued) : ''],
    ['LOST', [r.lost ? `${r.lost} to the fire` : '', r.ledoff ? RECAPW.ledoff(r.ledoff) : '', r.netlost ? STAITHE_WORDS.lost(r.netlost) : ''].filter(Boolean).join(', ')],
    [RECAPW.way, r.won ? r.way ?? '' : ''],
    [RECAPW.found, c?.found.join(', ') ?? ''],
    [RECAPW.treasure, r.treasure.map((x) => (isUnique(x) ? `<span style="color:${UNIQUE_COL}">${itemName(x)}</span>` : itemName(x))).join(', ')],
    // The Deep: what stayed below (shared/deepkit.ts).
    [DEEP_WORDS.keptBelow, r.deep?.lost.map(itemName).join(', ') ?? ''],
    // Picked up on the way, then the sure one at the end, each with the uses it holds.
    [RECAPW.relic, [...(c?.relics ?? []), ...(r.relics ?? (r.relic ? [r.relic] : [])).map((x) => RELICW.withUses(relicName(x), x.charge))].join(', ')],
  ], 'recap');
  // Every relic that came home, drawn: its picture, name, uses and NEW (relicshelf.ts's squares, bigger).
  const won = [...g.profile.relics.filter((x) => c?.relicIds?.includes(x.id)), ...(r.relics ?? (r.relic ? [r.relic] : []))];
  const strip = won.length ? `<div class="rwon">${won.map((x) => `<div class="rwon1"><img src="${relicItemIcon(x)}" alt=""><div><i>${RELICW.newRelic}</i><b style="color:${relicCol(x)}">${relicName(x)}</b>${chargePips(x)}</div></div>`).join('')}</div>` : '';
  const dp = r.deep, deepLine = dp && (dp.end === 'out' ? DEEP_WORDS.out(dp.floor) : dp.end === 'dead' ? DEEP_WORDS.lost(dp.floor) : DEEP_WORDS.outEarly(dp.floor));
  const lines = deepLine ? [deepLine] : r.won ? [] : [ENDED[r.half ? (r.how === 'dropped' ? 'lostCut' : 'half') : r.how === 'dropped' ? 'cut' : 'left']];
  if (r.levels) lines.push(`<b>Level ${g.profile.level}.</b> ${title(TRAINERS[g.profile.cls].name)} trains you, at ${TRAINERS[g.profile.cls].where}.`);
  for (const i of r.sold) lines.push(`No room for the ${itemName(i)}: sold for 20 gold.`);
  if (r.relic) lines.push((r.job.boss && !r.job.exped && r.job.objective !== 'story' ? RELICW.cutOut(r.job.boss, relicName(r.relic)) : RELICW.broughtHome(relicName(r.relic))) + ' ' + (g.profile.relic === r.relic.id ? RELICW.carryHint : RELICW.shelfHint));
  if (r.lit !== undefined) lines.push(RELICW.litLeft(r.lit));
  if (r.won && r.job.objective === 'story') lines.push(`<b>Barrowby's bell rings across the valley.</b> The council sits once enough people are home.`);
  // A knack waiting: banked, picked from the pack whenever you like.
  if (g.profile.picks) lines.push(RECAPW.knack(g.profile.picks));
  const html = `<div class="recapcard">${p(`<b>${r.job.title}</b>`)}${did}${c ? partyTable(c.party) : ''}<hr>${got}${strip}${lines.map(p).join('')}</div>`;
  // One button, home. Never the knacks screen (Kyle, 2026-11-05).
  panel.show(dp ? (dp.end === 'dead' ? DEEP_WORDS.lostTitle : DEEP_WORDS.outTitle) : r.won ? 'JOB DONE' : r.half ? 'DRIVEN BACK' : 'HOME EARLY', html, [{ label: RECAPW.home, primary: true, act: () => panel.hide() }], true);
}
