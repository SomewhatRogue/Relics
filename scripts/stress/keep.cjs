// What a player picks up or earns on a job is theirs, whatever happens to their page: a reload, a
// closed tab, a crash. Gold and experience are owed by the job's leader (api/owed.ts), so these clear
// the player's own device tally before they come back, to show the pay comes from the leader's record.

const ring = (tag) => ({ slot: 'ring', quality: 'fine', traits: [], mods: [], level: 0, tag });
const hasTag = (p, tag) => p.page.evaluate((tag) => { const q = window.__game.profile; return [...q.bag, ...q.rings].some((it) => it.tag === tag); }, tag);
const gold = (p) => p.page.evaluate(() => window.__game.profile.gold);
const xp = (p) => p.page.evaluate(() => window.__game.profile.xp);
/** The goblins gone (on the leader's page), so nothing interferes. */
const calm = (k, lead) => k.clear(lead);

/**
 * On the leader's page: coins and a ring dropped at `id`'s feet. The coins are theirs as they stand
 * on them; the ring is taken with the loot card's TAKE on `p`'s own page, as a player does.
 */
async function pickUp(k, lead, p, id, tag) {
  await k.ev(lead, ([id, item]) => {
    const r = window.__game.roomOf(id === 'me' ? 'me' : id) ?? window.__game.room, h = r.heroes.find((x) => x.id === id);
    r.pickups.push({ id: 7000 + Math.floor(Math.random() * 999), x: h.x, y: h.y, life: 60, gold: 25 });
    r.drops.push({ id: 8000 + Math.floor(Math.random() * 999), x: h.x, y: h.y, life: 60, item });
  }, [id, ring(tag)]);
  if (!(await k.until(p, () => !!document.querySelector('#loot button') && !document.getElementById('loot').hidden, null, 5000))) return false;
  await p.page.click('#loot button');
  return k.until(p, (tag) => window.__game.profile.bag.some((it) => it.tag === tag), tag, 5000);
}

/** 22. Sam picks up gold and a ring, reloads mid-job, comes back in, and they finish: he has the ring and the same pay as Kyle. */
async function reloadIn(k) {
  const kyle = await k.open('KYLE22', 'WARRIOR'), sam = await k.open('SAM22', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await calm(k, kyle);
  k.step('Sam picks up coins and a ring', await pickUp(k, kyle, sam, sam.id, 'ring22'));
  k.step('the coins are in the party pot', await k.until(kyle, () => window.__game.run.gold >= 25));
  await k.reload(sam);
  k.step('Sam is back in', await k.until(sam, (id) => window.__game.mode === 'run' && window.__game.remote?.lead === id && window.__game.room.heroes.some((h) => h.id === 'me'), kyle.id, 15000));
  k.step('the ring is still his', await hasTag(sam, 'ring22'));
  const [k0, s0] = [await gold(kyle), await gold(sam)];
  k.step('they finish it', (await k.finish(kyle, [sam])) && (await k.until(sam, () => window.__game.mode === 'town', null, 10000)));
  const [k1, s1] = [await gold(kyle), await gold(sam)];
  k.step(`Sam is paid what Kyle is (${s1 - s0} and ${k1 - k0})`, s1 - s0 === k1 - k0 && s1 > s0, [s1 - s0, k1 - k0]);
  k.step('and keeps the ring', await hasTag(sam, 'ring22'));
  await k.reload(sam);
  await k.wait(4000);
  k.step('a reload after: not paid again', (await gold(sam)) === s1, await gold(sam));
}

/** 23. Sam picks up gold and a ring, closes the tab; Kyle finishes without him; Sam opens the game again: the ring, and what he earned, once. */
async function closedAway(k) {
  const kyle = await k.open('KYLE23', 'WARRIOR'), sam = await k.open('SAM23', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await calm(k, kyle);
  k.step('Sam picks up coins and a ring', await pickUp(k, kyle, sam, sam.id, 'ring23'));
  await k.ev(kyle, () => (window.__game.run.xp += 300));
  await k.wait(5000); // (the leader writes what each is owed every few seconds)
  const pot = await k.ev(kyle, () => window.__game.run.gold), [g0, x0] = [await gold(sam), await xp(sam)];
  await k.crash(sam);
  await k.wait(7000); // (gone from the job once the leader hasn't heard from him in 5 s)
  k.step('Kyle finishes without him', await k.finish(kyle));
  // Sam's own device tally, gone: what he's paid must be the leader's word.
  await sam.ctx.addInitScript(() => localStorage.removeItem('relic-job-bank'));
  await k.reopen(sam);
  k.step('Sam opens the game: back in town, paid', await k.until(sam, () => window.__game.mode === 'town' && window.__panel.open && document.querySelector('#panel h2')?.textContent === 'HOME EARLY', null, 60000), await k.ev(sam, () => window.__game.mode));
  const [g1, x1] = [await gold(sam), await xp(sam)];
  k.step(`the gold the party had picked up while he was there (${pot})`, g1 - g0 === pot, g1 - g0);
  k.step('and the experience', x1 > x0, [x0, x1]);
  k.step('and the ring', await hasTag(sam, 'ring23'));
  await k.reopen(sam);
  await k.wait(5000);
  k.step('opened again: not paid twice', (await gold(sam)) === g1 && !(await k.ev(sam, () => window.__panel.open)), await gold(sam));
}

/** 24. Kyle (leading) picks up a ring and coins, his page crashes; Sam takes over and finishes; Kyle opens the game: the ring and what he earned. */
async function leaderCrash(k) {
  const kyle = await k.open('KYLE24', 'WARRIOR'), sam = await k.open('SAM24', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await calm(k, kyle);
  k.step('Kyle picks up coins and a ring', await pickUp(k, kyle, kyle, 'me', 'ring24'));
  await k.ev(kyle, () => (window.__game.run.xp += 300));
  await k.wait(2600); // (a whole-job save goes out every 2 s)
  const [g0, x0] = [await gold(kyle), await xp(kyle)];
  await k.crash(kyle);
  k.step('Sam takes the job on', await k.until(sam, () => !!window.__game.coop && !window.__game.remote, null, 15000));
  const pot = await k.ev(sam, () => window.__game.run.gold);
  await k.wait(1000);
  k.step('Sam takes it on to the end', (await k.finish(sam)) && (await k.until(sam, () => window.__game.mode === 'town', null, 10000)));
  await kyle.ctx.addInitScript(() => localStorage.removeItem('relic-job-bank'));
  await k.reopen(kyle);
  k.step('Kyle opens the game: home, paid', await k.until(kyle, () => window.__game.mode === 'town' && window.__panel.open && document.querySelector('#panel h2')?.textContent === 'HOME EARLY', null, 40000), await k.ev(kyle, () => [window.__game.mode, !!window.__game.coop]));
  const [g1, x1] = [await gold(kyle), await xp(kyle)];
  k.step(`the gold picked up before the crash (${pot})`, g1 - g0 === pot, g1 - g0);
  k.step('and the experience', x1 > x0, [x0, x1]);
  k.step('and the ring', await hasTag(kyle, 'ring24'));
}

/** 25. Sam takes a crossbow from his pack mid-job, then reloads: still holding it, in the job and home after. */
async function swapReload(k) {
  const kyle = await k.open('KYLE25', 'WARRIOR'), sam = await k.open('SAM25', 'RANGER', true);
  await k.ev(sam, () => { const g = window.__game; g.profile.bag.push({ slot: 'weapon', kit: 'crossbow', quality: 'fine', traits: [], mods: [], level: 0, tag: 'xbow' }); g.keep(); g.enterTown(); });
  if (!(await k.party(kyle, sam))) return;
  await calm(k, kyle);
  await k.ev(sam, () => window.__pack.gear(1, window.__game.hero.bag.findIndex((it) => it.tag === 'xbow')));
  k.step("the crossbow in Sam's hands", await k.until(kyle, (id) => window.__game.room.heroes.find((h) => h.id === id)?.weapon === 'crossbow', sam.id, 5000));
  k.step('and in his save', await k.until(sam, () => window.__game.profile.weapon === 'crossbow' && window.__game.profile.arms.crossbow?.tag === 'xbow', null, 3000));
  await k.reload(sam);
  k.step('Sam is back in, still holding it', await k.until(sam, () => window.__game.mode === 'run' && window.__game.room.heroes.find((h) => h.id === 'me')?.weapon === 'crossbow', null, 15000));
  k.step('they finish it', (await k.finish(kyle, [sam])) && (await k.until(sam, () => window.__game.mode === 'town', null, 10000)));
  k.step('home, the crossbow in hand', await k.ev(sam, () => window.__game.hero.weapon === 'crossbow' && window.__game.hero.arms.crossbow?.tag === 'xbow'));
}

module.exports = { 22: reloadIn, 23: closedAway, 24: leaderCrash, 25: swapReload };
