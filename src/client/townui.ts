/** What each person in Wickhold says and offers, the spots in the open, and the end-of-run results. */
import { FAMILIES, PATIENTS } from '../shared/interiors';
import { openTrainer } from './trainerui';
import { CHAPTER_1, chapterGoals, councilOpen } from '../shared/story';
import { COUNCILW } from './councilwords';
import { closeNight } from './voteboards';
import { TRAINERS, type SpotId } from '../shared/town';
import { ballot } from '../shared/worldsync';
import { openSquare } from './squareui';
import { CLASS_ORDER, RELICS, TRAITS, itemName, type Item } from '../shared/tuning';
import { device, type Game } from './game';
import { line } from './speech';
import { openStore } from './stores';
import { openShop } from './shops';
import { openVendor } from './vendorui';
import { CHURCH, COAL, TALLY } from './copy';
import { LINES } from '../shared/wood';
import { ORLA } from '../shared/orla';
import type { Panel } from './panels';
import { RUMOURS } from './rumours';
import { openBoard } from './boardui';
import { CLASS_NAME } from '../shared/classes';

import { SPEAKER, townSays } from '../shared/townsays';
import { PERRIN } from '../shared/mendlines';
import { dusk } from './streetlife';
import { RELICW } from './relicwords';
import { openStep } from './churchrelics';
import { openAdvocate } from './councilui';
import { openPractice } from './practiceui';
import { openWatchPost } from './watchpost';
import { townVoice, voiceClock } from './voiceplay';


const p = (s: string) => `<p>${s}</p>`;
// The quote marks type in with the words, so the end of the line never shows before it's said.
const say = (who: string, s: string) => p(`<b>${who}:</b> ${line(`"${s}"`, who)}`);
const itemLine = (i: Item) => `<b>${itemName(i)}</b>: ${i.traits.map((t) => `${TRAITS[t].name} (${TRAITS[t].text.toLowerCase()})`).join(', ')}`;

export function openSpot(id: SpotId, g: Game, panel: Panel, arg = 0, key = ''): void {
  const pr = g.profile, w = g.world, again = () => openSpot(id, g, panel, arg, key);
  if (openSquare(id, g, panel, arg, key)) return;
  if (openStore(id, g, panel) || openShop(id, g, panel)) return;
  // A class's vendor, at a counter in its place (vendorui.ts); `arg` is the class.
  if (id === 'vendor') return openVendor(g, panel, arg);
  if (id === 'practice') {
    openPractice(g, panel);
  } else if (id === 'board') {
    openBoard(g, panel);
  } else if (id === 'council') {
    const goals = chapterGoals(w), d = CHAPTER_1.decision, done = w.flags[d.id];
    const status = p(`<b>${CHAPTER_1.name}</b>`) + p(`People brought home: ${goals.rescued} of ${goals.rescuedGoal}. Story mission, ${CHAPTER_1.mission.title}: ${goals.story ? 'done' : 'not yet'}.`);
    if (done) {
      const c = d.choices.find((x) => x.id === done)!;
      return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', `${c.label}. That's what the council said, so that's what we do. Some of them will never forgive the rest. That's councils.`) + p(c.text) + p('What comes next is still being written. Hollis will nail it up when it is.'));
    }
    if (!councilOpen(w)) return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', "Bring six of ours home and ring Barrowby's bell, and I'll call the council. Until then the only thing to decide is who's on the wall tonight, and that's always me."));
    const b = ballot(w), mine = w.ballots[d.id]?.[device()] ?? w.ballots[d.id]?.[pr.id];
    panel.show('THE COUNCIL SITS', status + p(`<b>${d.question}</b>`) + d.choices.map((c) => p(`<b>${c.label}.</b> ${c.text} <span class="dim">(${b.counts[c.id] ?? 0} for)</span>`)).join('') +
      p(COUNCILW.closes(...closeNight(w.councilCloses ?? Date.now()))) + (w.councilTied ? p(COUNCILW.tied) : '') + (mine ? p(COUNCILW.yours) : ''),
      d.choices.map((c) => ({ label: `${mine === c.id ? 'VOTED: ' : 'VOTE: '}${c.label.toUpperCase()}`, primary: mine !== c.id, act: () => (g.vote(c.id), again()) })));
  } else if (id === 'advocate') {
    // Under each vote board, someone arguing for it while the council's undecided; after, the usual talk.
    if (!openAdvocate(g, panel, arg)) openSpot('chat', g, panel, arg);
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
  } else if (id === 'orla') {
    panel.show(ORLA.name, say('Orla', ORLA.meet[ORLA.meet.length - 1]));
  } else if (id === 'church') {
    // Hungry gear is given up here, and only here. Odric doesn't ask what it is.
    const hungry = g.gearList().filter((it) => it.quality === 'hungry');
    // The first time in after the wood: one line about Hew (Orla brought the stick; you carry nothing).
    const hew = pr.tally ? say('Father Odric', TALLY.odric) : '';
    if (pr.tally) (pr.tally = false), g.keep();
    panel.show('FATHER ODRIC', hew + say('Father Odric', 'Give what you can spare to the Lantern. It keeps the light burning, and it does the giver good, more than you\'d think.') + (pr.cls === 'HEALER' ? say('Father Odric', COAL.odric) : '') +
      (hungry.length ? say('Father Odric', CHURCH.hungry) : '') +
      p(`Given to the Lantern so far: ${w.lantern} gold.`) + p(`You have ${pr.gold} gold.`),
      [...[20, 100].map((n) => ({ label: `GIVE ${n}`, disabled: pr.gold < n || pr.armor?.hungry === 'ransom', act: () => (g.donate(n), townVoice.pray(voiceClock()), again()) })),
        { label: RELICW.churchButton, primary: pr.relics.length > 0, act: () => openStep(g, panel, again) },
        ...hungry.map((it) => ({ label: `LEAVE ${itemName(it)} ON THE STEP`, act: () => (g.giveUp(it), townVoice.rite(voiceClock()), again()) }))]);
  } else if (id === 'yard') {
    panel.show('SQUIRE PELL', say('Squire Pell', "Yard's out back. Straw men, a butcher made of sacking on a chain, and me. Mostly me, getting hit. If you're the sort that heals, I'd take it kindly."), [{ label: 'TO THE YARD', primary: true, act: () => (panel.hide(), g.enterYard()) }]);
  } else if (id === 'watch') {
    // Corporal Brisk, at the stair up to the wall: a shift on the Night Watch, after dark (watchpost.ts).
    openWatchPost(g, panel, CHAT[13].line);
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
  MAGE: ['Yes, yes, sit. No, not there. There. You\'ve grown, I can see it on you. Pick, quickly, before I lose my nerve.', 'Don\'t touch that. Or that. Come back when you\'ve a level more in you.'],
  HEALER: ['Burn me, you\'re still breathing. Good. Choose.', 'Hold still, you great calf. There. Now go and get somebody else\'s blood on you, and come back when you\'ve learned something from it.'],
};

const CHAT: Record<number, { name: string; line: string }> = {
  0: { name: 'OLD WENNA', line: "Seventy-one winters. Saw the walls go up, saw the last bell go into the pot for arrowheads. I'll see the hungry off this valley too, or I'll haunt the lot of you." },
  1: { name: 'TAM', line: "Is it true you can throw a greenie at another greenie? Did it burst? Mam says don't ask about the bursting. Did it, though?" },
  2: { name: 'MARTA', line: 'I pray for the ones still out there. Then I pray you lot walk faster.' },
  3: { name: 'ALDER BRAM', line: 'Every choice this council makes, somebody pays for it. I\'d sooner it was the hungry.' },
  4: { name: 'GOODWIFE SELL', line: 'Farm or refugees. I have heard both argued till the candles gave out, and the candles were the only ones talking sense.' },
  5: { name: 'GATE GUARD', line: 'Gate opens for a job, and shuts behind you whether you\'re through or not. Board is in the square.' },
  6: { name: 'SERGEANT DUNN', line: 'Two of us for a whole wall, and boots that let the rain in. Put coin in the public works and I will find you a proper watch. And boots.' },
  7: { name: 'WATCHMAN HOB', line: 'Quiet tonight. I said that last night and one of them took the Fosters\' goat off the wall. So, not quiet.' },
  8: { name: 'WATCHMAN PIKE', line: 'New spear and new boots, and the same teeth out there. Still, good boots.' },
  9: { name: 'OLD MERREN', line: 'Father Odric nailed that chapel shut with his own hands, the night the siege broke. I asked him why. He said, so it stays where it is.' },
  13: { name: 'CORPORAL BRISK', line: "Cole says I'll make sergeant when Dunn dies. Dunn says he's not dying till he gets new boots. So that's me, corporal for life." },
  15: { name: PERRIN.name, line: PERRIN.stages[0] },
  16: { name: 'GRAVEDIGGER COBB', line: "I dig and Odric says the words, by name where he knows one." },
  17: { name: 'GOODMAN TULL', line: "Our house stood against the north wall, and some of it is the wall now." },
  18: { name: 'GOODWIFE MAB', line: "It tastes of copper, but it's wet and it's ours." },
  19: { name: 'RECRUIT WAT', line: "Master Cole says a dull blade's a gift to the other fellow, so they get *nothing* from me." },
  14: { name: 'ORLA OF THE WATCH', line: "Third night on the east wall. Something out there whistles when I whistle. I've stopped whistling." },
  11: { name: 'A DRUNK', line: 'Moll cheats. Everyone knows Moll cheats. I keep playing her. What does that make me? Don\'t answer that. Buy me one.' },
  12: { name: 'A CARD SHARP', line: 'Whisper, round the back, trains rogues and nobody else. If you have to ask, you\'re not one.' },
};
const CHILD = ['We have a door now. A real one, with a latch. I open it all the time.', 'Did you kill the big one? The one with the chains? Was it heavy?', 'I saw one once, through the wall. It had a spoon. Why did it have a spoon?', "Mam says I can't come with you. Yet."];
const SURVIVOR = ['They kept us in the dark so long I forgot what my hands looked like. Thank you for the candle.', 'My brother is still out at the Copperdeep. They took the ones who could dig. If you go down there...', 'I can hold a pitchfork. When my legs hold me, I will.'];
