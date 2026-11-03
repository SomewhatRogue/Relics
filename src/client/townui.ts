/** What each person in Wickhold says and offers, the spots in the open, and the end-of-run results. */
import { FAMILIES, PATIENTS } from '../shared/interiors';
import { openTrainer } from './trainerui';
import { CHAPTER_1, QUORUM, chapterGoals, councilOpen, rewardMult } from '../shared/story';
import { TRAINERS, type SpotId } from '../shared/town';
import { ballot } from '../shared/worldsync';
import { openSquare } from './squareui';
import { CLASS_ORDER, RELICS, TRAITS, itemName, type Item } from '../shared/tuning';
import { device, type Game } from './game';
import { line } from './speech';
import { openStore } from './stores';
import { openShop } from './shops';
import { CHURCH, COAL, TALLY } from './copy';
import { LINES } from '../shared/wood';
import type { Panel } from './panels';
import { RUMOURS } from './rumours';
import { partyList, wireParties } from './partyboard';
import { postedToast } from './partytoast';
import { CLASS_NAME } from '../shared/classes';
import { KIND, SIZES, STORY_PARTY, danger } from '../shared/jobs';
import { TIME_WORD, timeOf } from '../shared/timeofday';

/** The job open on the board (by id), if any. */
let boardOpen = '';
import { treasureWord } from '../shared/treasure';
import { SPEAKER, townSays } from '../shared/townsays';
import { lossText } from '../shared/raids';
import { MEND_UI, PERRIN } from '../shared/mendlines';
import { dusk } from './streetlife';
import { openTree } from './treeui';
import { relicName } from '../shared/relicitems';
import { RELICW } from './relicwords';
import { openStep } from './churchrelics';
import { KNW } from './treewords';

/** Words from another player's browser, made safe to show. */
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const RUIN = ['Held', 'Raided', 'Occupied', 'Razed', 'Blighted'];
const p = (s: string) => `<p>${s}</p>`;
// The quote marks type in with the words, so the end of the line never shows before it's said.
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const itemLine = (i: Item) => `<b>${itemName(i)}</b>: ${i.traits.map((t) => `${TRAITS[t].name} (${TRAITS[t].text.toLowerCase()})`).join(', ')}`;

export function openSpot(id: SpotId, g: Game, panel: Panel, arg = 0, key = ''): void {
  const pr = g.profile, w = g.world, again = () => openSpot(id, g, panel, arg, key);
  if (openSquare(id, g, panel, arg, key)) return;
  if (openStore(id, g, panel) || openShop(id, g, panel)) return;
  if (id === 'board') {
    const jobs = g.jobs(), pt = g.parties;
    // Online: the parties gathering, and the board's jobs taken alone or with a party.
    if (pt) pt.onChange = () => panel.open && document.querySelector('#panel h2')?.textContent?.startsWith('JOB BOARD') && openSpot('board', g, panel);
    const { html: partyHtml, parties } = partyList(g);
    // Jobs done lately, by whoever did them (the shared world's, online).
    const deeds = (w.deeds ?? []).slice(0, 5), raid = w.raids?.[0];
    // The town hit, while the raid is still the newest thing on the board.
    const raidHtml = raid && !deeds.some((d) => d.day > raid.day) ? `<div class="m">${esc(MEND_UI.board(raid.day, lossText(raid)))}</div>` : '';
    const doneHtml = deeds.length || raidHtml ? '<h3>DONE LATELY</h3>' + raidHtml + deeds.map((d) => `<div class="m">Day ${Number(d.day) || 1}: ${esc(d.title)}, by ${d.party.map(esc).join(', ')}.</div>`).join('') : '';
    // The list: what kind of job, how long, how hard, what it pays. Tap one for the rest.
    const pips = (n: number) => '<span class="pips">' + '<i class="on"></i>'.repeat(n) + '<i></i>'.repeat(5 - n) + '</span>';
    const html = partyHtml + doneHtml + (partyHtml || doneHtml ? '<h3>JOBS</h3>' : '') + jobs.map((j, i) => {
      const open = boardOpen === j.id, size = SIZES[j.size ?? 'medium'], pay = Math.round(j.reward * rewardMult(w)), story = j.objective === 'story';
      const alone = g.canTake(j, 1), head = `<button class="jhead" data-open="${i}"><b class="kind k-${j.objective}">${KIND[j.objective]}</b><span class="where">${esc(j.place.name)}</span><span class="len">${size.label}</span><span class="when t-${timeOf(j)}">${TIME_WORD[timeOf(j)]}</span>${pips(danger(j))}<em>${pay}g</em></button>`;
      const more = open ? `<div class="jmore"><div class="t">${story ? 'STORY: ' : ''}${j.title}</div>` +
        `<div class="m">${j.place.region}. ${RUIN[j.place.ruin]}. ${j.rooms} rooms, ${size.minutes}. Pays ${pay} gold and ${treasureWord(j)}.</div>` +
        `<div class="d">${j.text}</div>` + (story && !alone ? `<div class="need">Needs ${STORY_PARTY} to set out.</div>` : '') +
        (alone ? `<button data-job="${i}">${pt ? 'GO ALONE' : 'TAKE THE JOB'}</button>` : '') + (pt ? ` <button data-gather="${i}">GATHER A PARTY</button>` : '') + '</div>' : '';
      return `<div class="job ${story ? 'story' : j.deep ? 'deep' : ''}${open ? ' open' : ''}">${head}${more}</div>`;
    }).join('');
    panel.show(`JOB BOARD, DAY ${w.day}`, html);
    const on = (sel: string, f: (b: HTMLButtonElement) => void) => document.querySelectorAll<HTMLButtonElement>(`#panel ${sel}`).forEach((b) => b.addEventListener('click', () => f(b)));
    on('[data-open]', (b) => ((boardOpen = boardOpen === jobs[Number(b.dataset.open)].id ? '' : jobs[Number(b.dataset.open)].id), openSpot('board', g, panel)));
    on('[data-job]', (b) => g.canTake(jobs[Number(b.dataset.job)], 1) && (panel.hide(), pt?.quit(), g.startJob(jobs[Number(b.dataset.job)])));
    // A party posted, the panel closes: walk where you like while it gathers (the HUD card: partycard.ts).
    on('[data-gather]', (b) => (pt?.gather(jobs[Number(b.dataset.gather)]), panel.hide(), postedToast()));
    wireParties(g, panel, parties, () => openSpot('board', g, panel));
  } else if (id === 'council') {
    const goals = chapterGoals(w), d = CHAPTER_1.decision, done = w.flags[d.id];
    const status = p(`<b>${CHAPTER_1.name}</b>`) + p(`People brought home: ${goals.rescued} of ${goals.rescuedGoal}. Story mission, ${CHAPTER_1.mission.title}: ${goals.story ? 'done' : 'not yet'}.`);
    if (done) {
      const c = d.choices.find((x) => x.id === done)!;
      return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', `${c.label}. That's what the council said, so that's what we do. Some of them will never forgive the rest. That's councils.`) + p(c.text) + p('What comes next is still being written. Hollis will nail it up when it is.'));
    }
    if (!councilOpen(w)) return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', "Bring six of ours home and ring Barrowby's bell, and I'll call the council. Until then the only thing to decide is who's on the wall tonight, and that's always me."));
    const b = ballot(w), mine = w.ballots[d.id]?.[device()] ?? w.ballots[d.id]?.[pr.id], need = g.link?.online ? QUORUM : 1;
    panel.show('THE COUNCIL SITS', status + p(`<b>${d.question}</b>`) + d.choices.map((c) => p(`<b>${c.label}.</b> ${c.text} <span class="dim">(${b.counts[c.id] ?? 0} for)</span>`)).join('') +
      p(need > 1 ? `The council decides when ${need} heroes have voted: ${b.voters} so far.${mine ? ' Your voice is in; you can change it until it decides.' : ''}` : 'Playing alone, off the shared world: your vote decides.'),
      d.choices.map((c) => ({ label: `${mine === c.id ? 'VOTED: ' : 'VOTE: '}${c.label.toUpperCase()}`, primary: mine !== c.id, act: () => (g.vote(c.id), again()) })));
  } else if (id === 'trainer') {
    // Each class has its own teacher, somewhere in town; only yours will train you.
    const cls = CLASS_ORDER[arg] ?? 'WARRIOR', t = TRAINERS[cls], who = t.name.split(' ').slice(-1)[0];
    const name = who.charAt(0) + who.slice(1).toLowerCase();
    if (cls !== pr.cls) {
      const yours = TRAINERS[pr.cls];
      return panel.show(t.name, say(name, ELSEWHERE[cls].replace('{who}', title(yours.name)).replace('{where}', yours.where)));
    }
    if (pr.cls === 'HEALER' && pr.cold) {
      pr.cold = false;
      g.keep();
      g.hero.cold = false;
      return panel.show(`${t.name}, ${CLASS_NAME[cls]} TRAINER`, p('She takes your censer without asking, carries it to the Lantern, and brings it back lit.') + say(name, TALLY.isolde), [{ label: 'CLOSE', act: again }], true);
    }
    // One spoken line at most: grown since you were last here, or (a Cleric) coals for the censer.
    const greet = pr.picks > 0 ? TEACH[pr.cls][0] : pr.cls === 'HEALER' && pr.glow > 0 ? COAL.isolde : '';
    openTrainer(g, panel, `${t.name}, ${CLASS_NAME[cls]} TRAINER`, name, greet);
  } else if (id === 'hew') {
    panel.show('HEW', say('Hew', g.wood && g.wood.stage >= 2 ? LINES.north : LINES.later));
  } else if (id === 'church') {
    // Hungry gear is given up here, and only here. Odric doesn't ask what it is.
    const hungry = g.gearList().filter((it) => it.quality === 'hungry');
    if (pr.tally) {
      pr.tally = false;
      g.keep();
      return panel.show('FATHER ODRIC', p('You give him the hazel stick. He counts the notches with his thumb, eleven, then takes out a knife and cuts a twelfth.') + say('Father Odric', TALLY.odric), [{ label: 'CLOSE', act: again }], true);
    }
    panel.show('FATHER ODRIC', say('Father Odric', 'Give what you can spare. Then a little of what you can\'t. That\'s the part it burns.') + (pr.cls === 'HEALER' ? say('Father Odric', COAL.odric) : '') +
      (hungry.length ? say('Father Odric', CHURCH.hungry) : '') + (pr.armor?.hungry === 'ransom' ? p(CHURCH.ransom) : '') +
      p(`Given to the Lantern so far: ${w.lantern} gold.`) + p(`You have ${pr.gold} gold.`),
      [...[20, 100].map((n) => ({ label: `GIVE ${n}`, disabled: pr.gold < n || pr.armor?.hungry === 'ransom', act: () => (g.donate(n), again()) })),
        { label: RELICW.churchButton, primary: pr.relics.length > 0, act: () => openStep(g, panel, again) },
        ...hungry.map((it) => ({ label: `LEAVE ${itemName(it)} ON THE STEP`, act: () => (g.giveUp(it), panel.show('FATHER ODRIC', say('Father Odric', CHURCH.left), [{ label: 'CLOSE', act: () => panel.hide() }], true)) }))]);
  } else if (id === 'yard') {
    panel.show('SQUIRE PELL', say('Squire Pell', "Yard's out back. Straw men, a butcher made of sacking on a chain, and me. Mostly me, getting hit. If you're the sort that heals, I'd take it kindly."), [{ label: 'TO THE YARD', primary: true, act: () => (panel.hide(), g.enterYard()) }]);
  } else if (id === 'granary') {
    panel.show('FARMER JOS', say('Farmer Jos', 'Every sack in here is a week nobody starves. Barley doesn\'t care who won the war. That\'s the best thing about barley.'));
  } else if (id === 'home') {
    const f = FAMILIES[arg % FAMILIES.length];
    panel.show(f.name, say(title(f.adult), RUMOURS[(arg * 3 + w.day) % RUMOURS.length]) + say(f.child, CHILD[arg % CHILD.length]));
  } else if (id === 'chat') {
    const who = CHAT[arg] ?? { name: PATIENTS[arg - 10] ?? 'A STRANGER', line: SURVIVOR[(arg + w.day) % SURVIVOR.length] };
    // How the town's coming on (or what the hungry pulled down) comes first, when they've a mind to.
    const said = SPEAKER[arg] ? townSays(w, SPEAKER[arg], dusk() > 0.5) : null;
    panel.show(who.name, say(who.name.split(' ').slice(-1)[0], said ?? who.line) + (arg === 0 ? say('Wenna', RUMOURS[w.day % RUMOURS.length]) : ''));
  } else {
    panel.show('THE NORTH GATE', p('Oak and iron, and the hungry on the other side of it. The gate opens for a job, not before: the board is in the square.'));
  }
}

const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
/** What each trainer says to a hero not of their class ({who}, {where}: that hero's own trainer). */
const ELSEWHERE: Record<string, string> = {
  WARRIOR: 'Not mine. {who}, {where}.',
  RANGER: "You're not one of mine, and I've a dog with better manners waiting. {who} has your sort: {where}.",
  ROGUE: 'Lovely to see you. Wrong shop. {who} takes your sort, {where}. That one was free.',
  MAGE: "No, no, you're not, you can't be. {who}. {where}. Go. Mind the door.",
  HEALER: "You're not mine to stitch, more's the pity. {who}, {where}. Off you go.",
};
/** What each class's trainer says when you've grown, and when you haven't. */
const TEACH: Record<string, [string, string]> = {
  WARRIOR: ['Again. Better. Pick one.', 'Again.'],
  RANGER: ['You came back with all your fingers. Good. Now learn something with them.', 'You breathe like a bull in a barley field. Out on the draw, not in. Come back when you\'ve shot something that shot back.'],
  ROGUE: ['Look at you, still alive. That\'s worth a lesson. A cheap one.', 'I don\'t teach. I let you watch me, and you pay for the seat. Come back with more to pay.'],
  MAGE: ['Yes, yes, sit. No, not there. There. You\'ve grown, the relic says so. Pick, quickly, before I lose my nerve.', 'Don\'t touch that. Or that. Come back when the relic\'s heard more of you.'],
  HEALER: ['Burn me, you\'re still breathing, and so is half the company. Choose.', 'Hold still, you great calf. There. Now go and get somebody else\'s blood on you, and come back when you\'ve learned something from it.'],
};

const CHAT: Record<number, { name: string; line: string }> = {
  0: { name: 'OLD WENNA', line: "Seventy-one winters. Saw the walls go up, saw the last bell go into the pot for arrowheads. I'll see the hungry off this valley too, or I'll haunt the lot of you." },
  1: { name: 'TAM', line: "Is it true you can throw a greenie at another greenie? Did it burst? Mam says don't ask about the bursting. Did it, though?" },
  2: { name: 'MARTA', line: 'I pray for the ones still out there. Then I pray you lot walk faster.' },
  3: { name: 'ALDER BRAM', line: 'Every choice this council makes, somebody pays for. My job is to make sure it is somebody with teeth.' },
  4: { name: 'GOODWIFE SELL', line: 'Farm or refugees. I have heard both argued till the candles gave out, and the candles were the only ones talking sense.' },
  5: { name: 'GATE GUARD', line: 'Gate opens for a job, and shuts behind you whether you\'re through or not. Board is in the square.' },
  6: { name: 'SERGEANT DUNN', line: 'Two of us for a whole wall, and boots that let the rain in. Put coin in the town works and I will find you a proper watch. And boots.' },
  7: { name: 'WATCHMAN HOB', line: 'Quiet tonight. I said that last night and a tallyman took the Fosters\' goat off the wall. So, not quiet.' },
  8: { name: 'WATCHMAN PIKE', line: 'New spear, new boots, same teeth out there. Still. Good boots.' },
  9: { name: 'OLD MERREN', line: 'Father Odric nailed that chapel shut with his own hands, the night the siege broke. I asked him why. He said, so it stays where it is.' },
  13: { name: 'CORPORAL BRISK', line: "Cole says I'll make sergeant when Dunn dies. Dunn says he's not dying till he gets new boots. So that's me, corporal for life." },
  15: { name: PERRIN.name, line: PERRIN.stages[0] },
  16: { name: 'GRAVEDIGGER COBB', line: "I dig and Odric says the words, by name where he knows one." },
  17: { name: 'GOODMAN TULL', line: "Our house stood against the north wall, and some of it is the wall now." },
  18: { name: 'GOODWIFE MAB', line: "It tastes of copper, but it's wet and it's ours." },
  19: { name: 'RECRUIT WAT', line: "Master Cole says a dull blade's a gift to the other fellow, so they get *nothing* from me." },
  14: { name: 'ORLA OF THE WATCH', line: "Third night on the east wall. Something out there whistles when I whistle. I've stopped whistling." },
  11: { name: 'A DRUNK', line: 'Moll cheats. Everyone knows Moll cheats. I keep playing her. What does that make me? Don\'t answer that. Buy me one.' },
  12: { name: 'A CARD SHARP', line: 'Whisper talks to his own kind. If you have to ask which kind, you are not it.' },
};
const CHILD = ['We have a door now. A real one, with a latch. I open it all the time.', 'Did you kill the big one? The one with the chains? Was it heavy?', 'I saw one once, through the wall. It had a spoon. Why did it have a spoon?', "Mam says I can't come with you. Yet."];
const SURVIVOR = ['They kept us in the dark so long I forgot what my hands looked like. Thank you for the candle.', 'My brother is still out at the Copperdeep. They took the ones who could dig. If you go down there...', 'I can hold a pitchfork. When my legs hold me, I will.'];

/** A job not won, by how it ended (Game.finish): driven back, gone early from a party, or cut off from it. */
const ENDED = {
  half: 'Driven back: half the gold, nobody saved.',
  left: "You left before the end. You keep the gold you picked up, but not the job's pay.",
  cut: "You were cut off from your party. You keep the gold you picked up, but not the job's pay.",
  lostCut: 'You were cut off, and your party was driven back. Half the gold, nobody home.',
};

export function showResult(g: Game, panel: Panel): void {
  const r = g.result!;
  g.result = null;
  const lines = [`Gold: ${r.gold}`, `Experience: ${r.xp}`, r.won ? `People brought home: ${r.rescued}` : ENDED[r.half ? (r.how === 'dropped' ? 'lostCut' : 'half') : r.how === 'dropped' ? 'cut' : 'left'], ...(r.lost ? [`Lost to the fire: ${r.lost}`] : [])];
  if (r.levels) lines.push(`You've grown to level ${g.profile.level}. ${title(TRAINERS[g.profile.cls].name)} will want to see you, at ${TRAINERS[g.profile.cls].where}.`);
  if (r.treasure.length) lines.push(`<b>Treasure in your pack:</b> ${r.treasure.map((i) => `<b>${itemName(i)}</b>`).join(' and ')}.`);
  for (const i of r.sold) lines.push(`No room in your pack for the ${itemName(i)}, so it went for 20 gold.`);
  if (r.relic) lines.push(RELICW.cutOut(r.job.boss ?? '', relicName(r.relic)) + ' ' + (g.profile.relic === r.relic.id ? RELICW.carryHint : RELICW.shelfHint));
  if (r.lit !== undefined) lines.push(RELICW.litLeft(r.lit));
  if (r.won && r.job.objective === 'story') lines.push(`<b>Barrowby's bell rings across the valley.</b> The council can sit once enough people are home.`);
  const html = p(`<b>${r.job.title}</b>`) + lines.map(p).join(''), done = { label: 'BACK TO WICKHOLD', primary: true, act: () => panel.hide() };
  // Grown: a knack to pick, straight from here (the line comes and goes with the picks).
  const again = () => {
    const n = g.profile.picks, pick = n ? p(`${KNW.jobLine(n)}`) : '';
    const tree = n ? [{ label: KNW.pick, primary: true, act: () => openTree(g, panel, { back: again }) }] : r.levels ? [{ label: KNW.see, act: () => openTree(g, panel, { back: again }) }] : [];
    panel.show(r.won ? 'JOB DONE' : r.half ? 'DRIVEN BACK' : 'HOME EARLY', html + pick, [...tree, { ...done, primary: !n }], true);
  };
  again();
}
