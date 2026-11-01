/** What each person in Wickhold says and offers, the spots in the open, and the end-of-run results. */
import { FAMILIES, PATIENTS } from '../shared/interiors';
import { PERKS, SHOP, xpFor, perkOffer } from '../shared/progress';
import { CHAPTER_1, QUORUM, chapterGoals, councilOpen, marketOpen, rewardMult } from '../shared/story';
import { housesFor, type SpotId } from '../shared/town';
import { AUGMENTS, CLASS_KITS, CLASS_RELICS, ELEMENT_NAME, RELICS, TRAITS, WEAPONS, itemName, type Item } from '../shared/tuning';
import type { Game } from './game';
import type { Panel } from './panels';
import { RUMOURS } from './rumours';

const RUIN = ['Held', 'Raided', 'Occupied', 'Razed', 'Blighted'];
const p = (s: string) => `<p>${s}</p>`;
const say = (who: string, s: string) => p(`<b>${who}:</b> "${s}"`);
const itemLine = (i: Item) => `<b>${itemName(i)}</b>: ${i.traits.map((t) => `${TRAITS[t].name} (${TRAITS[t].text.toLowerCase()})`).join(', ')}`;

export function openSpot(id: SpotId, g: Game, panel: Panel, arg = 0): void {
  const pr = g.profile, w = g.world, again = () => openSpot(id, g, panel, arg);
  if (id === 'board') {
    const jobs = g.jobs();
    const html = jobs.map((j, i) =>
      `<div class="job ${j.objective === 'story' ? 'story' : ''}"><div class="t">${j.objective === 'story' ? 'STORY: ' : ''}${j.title}</div>` +
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
      return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', `The council chose ${c.label.toLowerCase()}. We live with it now.`) + p(c.text) + p('Chapter 2 is written at the next review, from what the group did.'));
    }
    if (!councilOpen(w)) return panel.show('REEVE HOLLIS', status + say('Reeve Hollis', "Bring our people home and ring Barrowby's bell, and the council will sit. Until then there's nothing to decide but how to stay alive."));
    panel.show('THE COUNCIL SITS', status + p(`<b>${d.question}</b>`) + d.choices.map((c) => p(`<b>${c.label}.</b> ${c.text}`)).join('') +
      p(`A council needs ${QUORUM} heroes to decide (1 here). This is a demo, so you can decide alone.`),
      d.choices.map((c) => ({ label: `DECIDE: ${c.label.toUpperCase()}`, primary: true, act: () => (g.decide(c.id, 1), again()) })));
  } else if (id === 'trainer') {
    const next = xpFor(pr.level + 1), offer = perkOffer(pr);
    const html = say('Master Cole', pr.picks > 0 ? 'You came back taller. Show me what you learned out there.' : 'Come back when the fields have taught you something.') +
      p(`Level ${pr.level}. Experience ${pr.xp}${pr.level < 10 ? ` of ${next} for the next` : ' (the chapter cap)'}.`) +
      p(pr.perks.length ? 'Yours: ' + pr.perks.map((k) => `<b>${PERKS[k].name}</b> (${PERKS[k].text.toLowerCase()})`).join(', ') : 'No perks yet.') +
      (pr.picks > 0 ? p(`Choose ${pr.picks > 1 ? `one of ${pr.picks} picks` : 'one'}:`) + offer.map((k) => p(`<b>${PERKS[k].name}</b>: ${PERKS[k].text}`)).join('') : '');
    panel.show('MASTER COLE, TRAINER', html, pr.picks > 0 ? offer.map((k) => ({ label: PERKS[k].name, primary: true, act: () => (g.pickPerk(k), again()) })) : []);
  } else if (id === 'smith' || id === 'market') {
    const forged = id === 'market';
    if (forged && !marketOpen(w)) return panel.show('MARKET ROW', p('The stalls stand empty. The traders are out in the refugee camp past the north gate, and only the council can bring them in.'));
    const cost = SHOP[forged ? 'forged' : 'fine'], mine = Object.values(pr.arms).filter(Boolean) as Item[], kits = CLASS_KITS[pr.cls];
    const html = (forged ? say('Dessa', 'Forged in Tolmouth before it fell. Each one has fire, frost or storm in it.') : say('Halvard', kits.length > 1 ? `A ${pr.cls.toLowerCase()} can carry ${kits.length} ways to fight. Pick one, I'll keep the others oiled.` : 'One weapon, used well. I can make it better.')) +
      p(`You have ${pr.gold} gold. In hand: <b>${WEAPONS[pr.weapon].name}</b>.`) +
      p(forged ? `A forged weapon for your class: ${cost} gold. One skill trait and an element.` : `A fine weapon for your class: ${cost} gold. One skill trait.`) +
      (mine.length ? p('Carried: ' + mine.map(itemLine).join('<br>')) : '');
    const take = forged ? [] : kits.filter((k) => k !== pr.weapon).map((k) => ({ label: `TAKE UP THE ${WEAPONS[k].name}`, act: () => (g.setKit(k), again()) }));
    panel.show(forged ? 'DESSA THE TRADER' : 'HALVARD THE SMITH', html, [{ label: `BUY (${cost})`, primary: true, disabled: pr.gold < cost, act: () => {
      const it = g.buy(forged ? 'forged' : 'fine');
      if (it) panel.show('BOUGHT', p(itemLine(it)) + p('It replaces what you carried for that kit.'), [{ label: 'MORE', act: again }]);
    } }, ...take]);
  } else if (id === 'wright') {
    const rel = CLASS_RELICS[pr.cls];
    const html = say('Ivo', 'Fire, frost or storm, set into the relic itself. It stays fitted until you have me take it out.') +
      p(`You have ${pr.gold} gold. An element costs ${SHOP.augment}; taking one out is free.`) +
      rel.map((r) => p(`<b>${RELICS[r].name}</b>: ${pr.augments[r] ? ELEMENT_NAME[pr.augments[r] as keyof typeof ELEMENT_NAME] : 'plain'}`)).join('');
    const buttons = rel.flatMap((r) => AUGMENTS.filter((a) => a !== (pr.augments[r] ?? '')).map((a) => ({
      label: a ? `${RELICS[r].short}: ${ELEMENT_NAME[a as keyof typeof ELEMENT_NAME]}` : `${RELICS[r].short}: PLAIN`,
      disabled: !!a && pr.gold < SHOP.augment, act: () => (g.fitAugment(r, a), again()),
    })));
    panel.show('IVO THE RELIC-WRIGHT', html, buttons);
  } else if (id === 'church') {
    panel.show('FATHER ODRIC', say('Father Odric', 'The Lantern burns on what the town gives it. Every coin is a little more light against the Want.') +
      p(`Given so far: ${w.lantern} gold. Later, you will give up loot here too, and take holy vows.`) + p(`You have ${pr.gold} gold.`),
      [20, 100].map((n) => ({ label: `GIVE ${n}`, disabled: pr.gold < n, act: () => (g.donate(n), again()) })));
  } else if (id === 'infirmary') {
    panel.show('SISTER AGNE', say('Sister Agne', w.rescued ? `${w.rescued} have come home through that gate. The worst of them mend here before they take a house on Rescue Row.` : 'Empty beds. Bring someone home and I will have work.') +
      p(`Lit houses on Rescue Row: ${housesFor(w.rescued)}.`));
  } else if (id === 'yard') {
    panel.show('SQUIRE PELL', say('Squire Pell', "The yard's out back. Dummies, a butcher on a chain, and me, getting hit. Heal me if you can."), [{ label: 'TO THE YARD', primary: true, act: () => (panel.hide(), g.enterYard()) }]);
  } else if (id === 'granary') {
    panel.show('FARMER JOS', say('Farmer Jos', 'The north fields came back. Every sack in here is a winter we live through. Jobs pay better while we eat.'));
  } else if (id === 'home') {
    const f = FAMILIES[arg % FAMILIES.length];
    panel.show(f.name, say(f.adult.split(' ')[0], RUMOURS[(arg * 3 + w.day) % RUMOURS.length]) + say(f.child, CHILD[arg % CHILD.length]));
  } else if (id === 'chat') {
    const who = CHAT[arg] ?? { name: PATIENTS[arg - 10] ?? 'A STRANGER', line: SURVIVOR[(arg + w.day) % SURVIVOR.length] };
    panel.show(who.name, say(who.name.split(' ').slice(-1)[0], who.line) + (arg === 0 ? say('Wenna', RUMOURS[w.day % RUMOURS.length]) : ''));
  } else {
    panel.show('THE NORTH GATE', p('The gate opens for a job. Take one at the job board in Lantern Square.'));
  }
}

const CHAT: Record<number, { name: string; line: string }> = {
  0: { name: 'OLD WENNA', line: 'I was born under that Lantern and I mean to die under it. Not soon, mind.' },
  1: { name: 'TAM', line: 'Is it true you can throw a goblin into another goblin? Show me. Show me!' },
  2: { name: 'MARTA', line: 'I pray for the ones still out there. Then I pray for you lot to hurry.' },
  3: { name: 'ALDER BRAM', line: 'Every choice the council makes costs someone. Make sure it costs the goblins more.' },
  4: { name: 'GOODWIFE SELL', line: 'Farm or refugees. I have heard both argued until the candles went out.' },
};
const CHILD = ['We have a door now. A real one.', 'Did you kill the big one? The one with the chains?', 'I saw a goblin once. It had a spoon.', "Mum says I can't come with you. Yet."];
const SURVIVOR = ['They kept us in the dark so long. Thank you for the light.', 'My brother is still out at the Copperdeep. If you go...', 'I can hold a pitchfork. When I can stand, I will.'];

export function showResult(g: Game, panel: Panel): void {
  const r = g.result!;
  g.result = null;
  const lines = [`Gold: ${r.gold}`, `Experience: ${r.xp}`, r.won ? `People brought home: ${r.rescued}` : 'Driven back: half the gold, nobody saved.'];
  if (r.levels) lines.push(`<b>Level up!</b> See Master Cole in the training hall.`);
  if (r.won && r.job.objective === 'story') lines.push(`<b>Barrowby's bell rings across the valley.</b> The council can sit once enough people are home.`);
  panel.show(r.won ? 'JOB DONE' : 'DRIVEN BACK', p(`<b>${r.job.title}</b>`) + lines.map(p).join(''), [{ label: 'BACK TO WICKHOLD', primary: true, act: () => panel.hide() }], true);
}
