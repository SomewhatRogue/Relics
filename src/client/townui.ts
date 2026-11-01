/** What each person in Wickhold says and offers, the spots in the open, and the end-of-run results. */
import { FAMILIES, PATIENTS } from '../shared/interiors';
import { PERKS, SHOP, xpFor, perkOffer } from '../shared/progress';
import { CHAPTER_1, QUORUM, chapterGoals, councilOpen, marketOpen, rewardMult } from '../shared/story';
import { TRAINERS, housesFor, type SpotId } from '../shared/town';
import { ballot } from '../shared/worldsync';
import { openSquare } from './squareui';
import { WANT, ARMOR, MODS, REROLL, STEEL, TIERS, nextLevel, POTION, POTIONS, type PotionId, AUGMENTS, CLASS_KITS, CLASS_ORDER, CLASS_SKILL, ELEMENT_NAME, RELICS, TRAITS, WEAPONS, itemName, type Item } from '../shared/tuning';
import type { Game } from './game';
import { PACK } from '../sim/pack';
import { CHURCH, COAL, COPY, SMITH } from './copy';
import { card, compare } from './card';
import type { Panel } from './panels';
import { RUMOURS } from './rumours';

const RUIN = ['Held', 'Raided', 'Occupied', 'Razed', 'Blighted'];
const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> "${s}"`);
const itemLine = (i: Item) => `<b>${itemName(i)}</b>: ${i.traits.map((t) => `${TRAITS[t].name} (${TRAITS[t].text.toLowerCase()})`).join(', ')}`;

export function openSpot(id: SpotId, g: Game, panel: Panel, arg = 0, key = ''): void {
  const pr = g.profile, w = g.world, again = () => openSpot(id, g, panel, arg, key);
  if (openSquare(id, g, panel, arg, key)) return;
  if (id === 'board') {
    const jobs = g.jobs();
    const html = jobs.map((j, i) =>
      `<div class="job ${j.objective === 'story' ? 'story' : j.deep ? 'deep' : ''}"><div class="t">${j.objective === 'story' ? 'STORY: ' : ''}${j.title}</div>` +
      `<div class="m">${j.place.name}, ${j.place.region}. ${RUIN[j.place.ruin]}. ${j.rooms} rooms${j.twist === 'night' ? '. At night' : ''}. Pays ${Math.round(j.reward * rewardMult(w))} gold.</div>` +
      `<div class="d">${j.text}</div><button data-job="${i}">TAKE THE JOB</button></div>`).join('');
    panel.show(`JOB BOARD, DAY ${w.day}`, html);
    document.querySelectorAll<HTMLButtonElement>('#panel [data-job]').forEach((b) =>
      b.addEventListener('click', () => (panel.hide(), g.startJob(jobs[Number(b.dataset.job)]))));
  } else if (id === 'council') {
    const goals = chapterGoals(w), d = CHAPTER_1.decision, done = w.flags[d.id];
    const status = p(`<b>${CHAPTER_1.name}</b>`) + p(`People brought home: ${goals.rescued} of ${goals.rescuedGoal}. Story mission, ${CHAPTER_1.mission.title}: ${goals.story ? 'done' : 'not yet'}.`);
    if (done) {
      const c = d.choices.find((x) => x.id === done)!;
      return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', `${c.label}. That's what the council said, so that's what we do. Some of them will never forgive the rest. That's councils.`) + p(c.text) + p('What comes next is still being written. Hollis will nail it up when it is.'));
    }
    if (!councilOpen(w)) return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', "Bring six of ours home and ring Barrowby's bell, and I'll call the council. Until then the only thing to decide is who's on the wall tonight, and that's always me."));
    const b = ballot(w), mine = w.ballots[d.id]?.[pr.id], need = g.link?.online ? QUORUM : 1;
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
    const next = xpFor(pr.level + 1), offer = perkOffer(pr);
    const html = say(name, pr.picks > 0 ? TEACH[pr.cls][0] : TEACH[pr.cls][1]) + (pr.cls === 'HEALER' && pr.glow > 0 ? say(name, COAL.isolde) : '') +
      p(`Level ${pr.level}. Experience ${pr.xp}${pr.level < 10 ? ` of ${next} for the next` : ' (the chapter cap)'}.`) +
      p(pr.perks.length ? 'Yours: ' + pr.perks.map((k) => `<b>${PERKS[k].name}</b> (${PERKS[k].text.toLowerCase()})`).join(', ') : 'No perks yet.') +
      (pr.picks > 0 ? p(`Choose ${pr.picks > 1 ? `one of ${pr.picks} picks` : 'one'}:`) + offer.map((k) => p(`<b>${PERKS[k].name}</b>${PERKS[k].cls ? ' (only from me)' : ''}: ${PERKS[k].text}`)).join('') : '');
    panel.show(`${t.name}, ${cls} TRAINER`, html, pr.picks > 0 ? offer.map((k) => ({ label: PERKS[k].name, primary: true, act: () => (g.pickPerk(k), again()) })) : []);
  } else if (id === 'smith' || id === 'market') {
    const forged = id === 'market';
    if (forged && !marketOpen(w)) return panel.show('MARKET ROW', p('Empty stalls and a cat. The traders are camped outside the north gate with the refugees, and the gate stays shut to them until the council says otherwise.'));
    const cost = SHOP[forged ? 'forged' : 'fine'], kits = CLASS_KITS[pr.cls], full = pr.bag.length >= PACK, q = forged ? 'forged' : 'fine';
    const html = (forged ? say('Dessa', 'Wickhold steel, with a little weather in it. Fire, frost, storm. Price is the price.') : say('Halvard', SMITH.greet)) +
      p(forged ? `Forged (blue): two modifiers, or one and an element. ${cost} gold each.` : `Fine (green): one modifier. ${cost} gold each.`) + p(full ? COPY.packFull : `You have ${pr.gold} gold.`);
    const sold = (label: string, buy: () => Item | null) => ({ label: `${label} (${cost})`, primary: true, disabled: full || pr.gold < cost, act: () => {
      const it = buy();
      if (it) panel.show('BOUGHT', `<div class="bought">${card(it, g.hero)}${compare(g.hero, it)}</div>` + p(forged ? 'Dessa counts your coin twice and smiles once.' : SMITH.bought), [{ label: 'MORE', act: again }]);
    } });
    const anvil = () => {
      const all = g.gearList(), hungry = all.filter((it) => it.quality === 'hungry');
      panel.show('THE ANVIL', say('Halvard', SMITH.anvil) + p(`You have ${pr.gold} gold and ${pr.steel} steel.`) +
        all.map((it) => p(`<b style="color:${TIERS[it.quality].col}">${itemName(it)}</b>${pr.bag.includes(it) ? ' (packed)' : ' (worn)'}`)).join('') +
        (hungry.length ? say('Halvard', SMITH.hungry) : ''), [
        ...all.flatMap((it) => {
          const next = nextLevel(it);
          return next ? [{ label: `${itemName(it)}: +${(it.level ?? 0) + 1} (${next.gold} GOLD, ${next.steel} STEEL)`, primary: true, disabled: pr.gold < next.gold || pr.steel < next.steel, act: () => (g.upgrade(it), anvil()) }] : [];
        }),
        ...pr.bag.filter((it) => it.quality !== 'hungry').map((it) => ({ label: `MELT ${itemName(it)} (+${STEEL[it.quality]} STEEL)`, act: () => (g.melt(it), anvil()) })),
        { label: 'BACK', act: again },
      ]);
    };
    panel.show(forged ? 'DESSA THE TRADER' : 'HALVARD THE SMITH', html, [
      ...(forged ? [] : [{ label: 'THE ANVIL: UPGRADE, MELT', act: anvil }]),
      ...kits.map((k) => sold(WEAPONS[k].name, () => g.buy(q, k))),
      ...(forged ? [sold('A RING', () => g.buy(q, pr.weapon, 'ring'))] : (['light', 'medium', 'heavy'] as const).map((a) => sold(ARMOR[a].name, () => g.buy(q, pr.weapon, 'armor', a)))),
    ]);
  } else if (id === 'wright') {
    // Your skill, and any relic you've found: fit an element, or choose which relic to carry.
    const rel = [CLASS_SKILL[pr.cls], ...pr.relics];
    const html = (g.gearList().some((it) => it.quality === 'hungry') ? say('Ivo', CHURCH.ivo) : '') + say('Ivo', pr.relics.length ? 'Fire, frost or storm, set right into it. Hear it hum? It likes you. Don\'t let it like you too much.' : 'No relic yet? They come out of the big ones, at the bottom of the deep jobs. Bring me one. Meanwhile I can set an element into that trick of yours.') +
      p(`You have ${pr.gold} gold. An element costs ${SHOP.augment}; taking one out is free.`) +
      rel.map((r, i) => p(`<b>${RELICS[r].name}</b>${i ? (pr.relic === r ? ' (carried)' : ' (on the shelf)') : ' (your skill)'}: ${pr.augments[r] ? ELEMENT_NAME[pr.augments[r] as keyof typeof ELEMENT_NAME] : 'plain'}`)).join('');
    const carry = pr.relics.filter((r) => r !== pr.relic).map((r) => ({ label: `CARRY THE ${RELICS[r].short}`, primary: true, act: () => (g.carry(r), again()) }));
    const buttons = [...carry, ...rel.flatMap((r) => AUGMENTS.filter((a) => a !== (pr.augments[r] ?? '')).map((a) => ({
      label: a ? `${RELICS[r].short}: ${ELEMENT_NAME[a as keyof typeof ELEMENT_NAME]}` : `${RELICS[r].short}: PLAIN`,
      disabled: !!a && pr.gold < SHOP.augment, act: () => (g.fitAugment(r, a), again()),
    })))];
    // Ivo also rerolls one modifier on a worn piece for gold.
    const worn = g.gearList().filter((it) => !pr.bag.includes(it) && it.quality !== 'plain' && it.quality !== 'hungry');
    const rerolls = worn.flatMap((it) => (it.mods ?? []).map((m, k) => ({ label: `${itemName(it)}: REROLL ${MODS[m.id].name} (${REROLL})`, disabled: pr.gold < REROLL, act: () => (g.rerollMod(it, k), again()) })));
    panel.show('IVO THE RELIC-WRIGHT', html + shelf(['frost']) + (rerolls.length ? p(`He'll turn one modifier on anything you wear into another, ${REROLL} gold.`) : ''), [...buttons, ...rerolls, ...potionButtons(g, ['frost'], again)]);
  } else if (id === 'church') {
    // Hungry gear is given up here, and only here. Odric doesn't ask what it is.
    const hungry = g.gearList().filter((it) => it.quality === 'hungry');
    panel.show('FATHER ODRIC', say('Father Odric', 'Give what you can spare. Then a little of what you can\'t. That\'s the part it burns.') + (pr.cls === 'HEALER' ? say('Father Odric', COAL.odric) : '') +
      (hungry.length ? say('Father Odric', CHURCH.hungry) : '') + (pr.armor?.hungry === 'ransom' ? p(CHURCH.ransom) : '') +
      p(`Given to the Lantern so far: ${w.lantern} gold.`) + p(`You have ${pr.gold} gold.`),
      [...[20, 100].map((n) => ({ label: `GIVE ${n}`, disabled: pr.gold < n || pr.armor?.hungry === 'ransom', act: () => (g.donate(n), again()) })),
        ...hungry.map((it) => ({ label: `LEAVE ${itemName(it)} ON THE STEP`, act: () => (g.giveUp(it), panel.show('FATHER ODRIC', say('Father Odric', CHURCH.left), [{ label: 'CLOSE', act: () => panel.hide() }], true)) }))]);
  } else if (id === 'infirmary') {
    panel.show('SISTER AGNE', say('Sister Agne', w.rescued ? `${w.rescued} through that gate so far. Some of them still won\'t sleep in the dark. I leave a candle.` : 'Empty beds. First time in my life I\'ve wanted them full. Bring someone home and I\'ll have work.') +
      p(`Lit houses on Rescue Row: ${housesFor(w.rescued)}.`) + (pr.want >= WANT.noticed ? say('Sister Agne', CHURCH.agne) : '') + shelf(['bitter']) + p(`You have ${pr.gold} gold. Belt: ${pr.belt.length} of ${POTION.belt}.`), potionButtons(g, ['bitter'], again));
  } else if (id === 'yard') {
    panel.show('SQUIRE PELL', say('Squire Pell', "Yard's out back. Straw men, a butcher made of sacking on a chain, and me. Mostly me, getting hit. If you're the sort that heals, I'd take it kindly."), [{ label: 'TO THE YARD', primary: true, act: () => (panel.hide(), g.enterYard()) }]);
  } else if (id === 'granary') {
    panel.show('FARMER JOS', say('Farmer Jos', 'Every sack in here is a week nobody starves. Barley doesn\'t care who won the war. That\'s the best thing about barley.'));
  } else if (id === 'home') {
    const f = FAMILIES[arg % FAMILIES.length];
    panel.show(f.name, say(title(f.adult), RUMOURS[(arg * 3 + w.day) % RUMOURS.length]) + say(f.child, CHILD[arg % CHILD.length]));
  } else if (id === 'chat') {
    const who = CHAT[arg] ?? { name: PATIENTS[arg - 10] ?? 'A STRANGER', line: SURVIVOR[(arg + w.day) % SURVIVOR.length] };
    panel.show(who.name, say(who.name.split(' ').slice(-1)[0], who.line) + (arg === 0 ? say('Wenna', RUMOURS[w.day % RUMOURS.length]) : ''));
  } else {
    panel.show('THE NORTH GATE', p('Oak and iron, and the hungry on the other side of it. The gate opens for a job, not before: the board is in the square.'));
  }
}

/** Potion buttons for a shop: each kind this one sells, at its price. */
export const potionButtons = (g: Game, ids: PotionId[], again: () => void) =>
  ids.map((id) => ({ label: `${POTIONS[id].short} (${POTIONS[id].price})`, disabled: g.profile.gold < POTIONS[id].price || g.profile.belt.length >= POTION.belt, act: () => (g.buyPotion(id), again()) }));
const shelf = (ids: PotionId[]) => ids.map((id) => p(`<b>${POTIONS[id].name}</b>: ${POTIONS[id].text}`)).join('');

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
  14: { name: 'ORLA OF THE WATCH', line: "Third night on the east wall. Something out there whistles when I whistle. I've stopped whistling." },
  11: { name: 'A DRUNK', line: 'Moll cheats. Everyone knows Moll cheats. I keep playing her. What does that make me? Don\'t answer that. Buy me one.' },
  12: { name: 'A CARD SHARP', line: 'Whisper talks to his own kind. If you have to ask which kind, you are not it.' },
};
const CHILD = ['We have a door now. A real one, with a latch. I open it all the time.', 'Did you kill the big one? The one with the chains? Was it heavy?', 'I saw one once, through the wall. It had a spoon. Why did it have a spoon?', "Mam says I can't come with you. Yet."];
const SURVIVOR = ['They kept us in the dark so long I forgot what my hands looked like. Thank you for the candle.', 'My brother is still out at the Copperdeep. They took the ones who could dig. If you go down there...', 'I can hold a pitchfork. When my legs hold me, I will.'];

export function showResult(g: Game, panel: Panel): void {
  const r = g.result!;
  g.result = null;
  const lines = [`Gold: ${r.gold}`, `Experience: ${r.xp}`, r.won ? `People brought home: ${r.rescued}` : 'Driven back: half the gold, nobody saved.'];
  if (r.levels) lines.push(`You've grown. ${title(TRAINERS[g.profile.cls].name)} will want to see you, at ${TRAINERS[g.profile.cls].where}.`);
  if (r.relic) lines.push(`<b>You cut a relic out of ${r.job.boss}: the ${RELICS[r.relic].name}.</b> It's on your RELIC button. Ivo at the forge can set an element into it.`);
  if (r.won && r.job.objective === 'story') lines.push(`<b>Barrowby's bell rings across the valley.</b> The council can sit once enough people are home.`);
  panel.show(r.won ? 'JOB DONE' : 'DRIVEN BACK', p(`<b>${r.job.title}</b>`) + lines.map(p).join(''), [{ label: 'BACK TO WICKHOLD', primary: true, act: () => panel.hide() }], true);
}
