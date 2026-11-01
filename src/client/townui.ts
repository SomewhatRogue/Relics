/** What each town spot says and offers, and the end-of-run results. */
import { PERKS, SHOP, xpFor, perkOffer } from '../shared/progress';
import { CHAPTER_1, QUORUM, chapterGoals, councilOpen, marketOpen, rewardMult } from '../shared/story';
import { housesFor } from '../shared/town';
import type { SpotId } from '../shared/town';
import { TRAITS, itemName, type Item } from '../shared/tuning';
import type { Game } from './game';
import type { Panel } from './panels';

const RUIN = ['Held', 'Raided', 'Occupied', 'Razed', 'Blighted'];
const p = (s: string) => `<p>${s}</p>`;
const itemLine = (i: Item) => `<b>${itemName(i)}</b>: ${i.traits.map((t) => `${TRAITS[t].name} (${TRAITS[t].text.toLowerCase()})`).join(', ')}`;

export function openSpot(id: SpotId, g: Game, panel: Panel): void {
  const pr = g.profile, w = g.world, again = () => openSpot(id, g, panel);
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
      return panel.show('THE COUNCIL', status + p(`The council chose: <b>${c.label}</b>. ${c.text}`) + p('Chapter 2 is written at the next review, from what the group did.'));
    }
    if (!councilOpen(w)) return panel.show('THE COUNCIL', status + p("When the chapter's goals are met, the council sits and decides what Wickhold does next."));
    panel.show('THE COUNCIL SITS', status + p(`<b>${d.question}</b>`) + d.choices.map((c) => p(`<b>${c.label}.</b> ${c.text}`)).join('') +
      p(`A council needs ${QUORUM} heroes to decide (1 here). This is a demo, so you can decide alone.`),
      d.choices.map((c) => ({ label: `DECIDE: ${c.label.toUpperCase()}`, primary: true, act: () => (g.decide(c.id, 1), again()) })));
  } else if (id === 'trainer') {
    const next = xpFor(pr.level + 1), offer = perkOffer(pr);
    const html = p(`Level ${pr.level}. Experience ${pr.xp}${pr.level < 10 ? ` of ${next} for the next` : ' (the chapter cap)'}.`) +
      p(pr.perks.length ? 'Yours: ' + pr.perks.map((k) => `<b>${PERKS[k].name}</b> (${PERKS[k].text.toLowerCase()})`).join(', ') : 'No perks yet.') +
      (pr.picks > 0 ? p(`You have grown. Choose ${pr.picks > 1 ? `one of ${pr.picks} picks` : 'one'}:`) + offer.map((k) => p(`<b>${PERKS[k].name}</b>: ${PERKS[k].text}`)).join('') : p('Come back when you have grown.'));
    panel.show('THE TRAINER', html, pr.picks > 0 ? offer.map((k) => ({ label: PERKS[k].name, primary: true, act: () => (g.pickPerk(k), again()) })) : []);
  } else if (id === 'smith' || id === 'market') {
    const forged = id === 'market';
    if (forged && !marketOpen(w)) return panel.show('MARKET ROW', p('The stalls stand empty. The traders are out in the refugee camp past the north gate, and only the council can bring them in.'));
    const cost = SHOP[forged ? 'forged' : 'fine'], mine = Object.values(pr.arms).filter(Boolean) as Item[];
    panel.show(forged ? 'THE TRADER' : 'THE SMITH', p(`You have ${pr.gold} gold.`) + p(forged ? `A forged weapon for your class: ${cost} gold. One skill trait and an element.` : `A fine weapon for your class: ${cost} gold. One skill trait.`) +
      (mine.length ? p('Carried: ' + mine.map(itemLine).join('<br>')) : ''),
      [{ label: `BUY (${cost})`, primary: true, disabled: pr.gold < cost, act: () => {
        const it = g.buy(forged ? 'forged' : 'fine');
        if (it) panel.show('BOUGHT', p(itemLine(it)) + p('It replaces what you carried for that kit.'), [{ label: 'MORE', act: again }]);
      } }]);
  } else if (id === 'church') {
    panel.show('THE CHURCH', p(`The Last Lantern burns on what the town gives it: ${w.lantern} gold so far.`) +
      p('Here, later, you will give up gold and loot to cleanse the Want, and take holy vows.') + p(`You have ${pr.gold} gold.`),
      [20, 100].map((n) => ({ label: `GIVE ${n}`, disabled: pr.gold < n, act: () => (g.donate(n), again()) })));
  } else if (id === 'infirmary') {
    panel.show('THE INFIRMARY', p(`${w.rescued} people have come home. The wounded among them mend here before they take a house on Rescue Row.`));
  } else if (id === 'row') {
    const n = housesFor(w.rescued);
    panel.show('RESCUE ROW', p(n ? `${n} house${n > 1 ? 's are' : ' is'} lit on Rescue Row, two people to a house.` : 'The row is dark. Bring people home and it fills.'));
  } else if (id === 'yard') {
    panel.show('TRAINING YARD', p('Dummies, a goblin butcher on a chain, and a squire who keeps getting hit. Try kits and relics here.'), [{ label: 'GO IN', primary: true, act: () => (panel.hide(), g.enterYard()) }]);
  } else {
    panel.show('THE NORTH GATE', p('The gate opens for a job. Take one at the job board in Lantern Square.'));
  }
}

export function showResult(g: Game, panel: Panel): void {
  const r = g.result!;
  g.result = null;
  const lines = [`Gold: ${r.gold}`, `Experience: ${r.xp}`, r.won ? `People brought home: ${r.rescued}` : 'Driven back: half the gold, nobody saved.'];
  if (r.levels) lines.push(`<b>Level up!</b> See the trainer.`);
  if (r.won && r.job.objective === 'story') lines.push(`<b>Barrowby's bell rings across the valley.</b> The council can sit once enough people are home.`);
  panel.show(r.won ? 'JOB DONE' : 'DRIVEN BACK', p(`<b>${r.job.title}</b>`) + lines.map(p).join(''), [{ label: 'BACK TO WICKHOLD', primary: true, act: () => panel.hide() }], true);
}
