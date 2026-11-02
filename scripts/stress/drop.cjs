// A page that goes away mid-job: hidden, frozen, closed, reloaded.

/** Sam's hero three tiles from the nearest goblin still standing, so the fight is on. */
async function engage(k, kyle, sam) {
  await k.ev(kyle, (id) => {
    const g = window.__game, h = g.room.heroes.find((x) => x.id === id), e = g.room.enemies.find((x) => x.hp > 0);
    if (e) Object.assign(h, { x: e.x, y: e.y + 3, hp: h.maxHp });
  }, sam.id);
}
const where = (p) => p.page.evaluate(() => window.__game.room.enemies.map((e) => `${e.x.toFixed(1)},${e.y.toFixed(1)}`).join(' '));

/** 4. The leader's page hidden 30 s mid-fight: the room runs on for Sam, nobody takes over, all fine after. */
async function hidden(k) {
  const kyle = await k.open('KYLEE', 'WARRIOR'), sam = await k.open('SAME', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await engage(k, kyle, sam);
  await k.hide(kyle);
  const t0 = await k.ev(sam, () => window.__game.room.time), w0 = await where(sam);
  let split = 0;
  for (let i = 0; i < 30; i++) {
    await k.wait(1000);
    if ((await k.role(sam)) !== 'follow:' + kyle.id || (await k.role(kyle)) !== 'lead') split++;
  }
  const t1 = await k.ev(sam, () => window.__game.room.time), w1 = await where(sam);
  k.step(`the room ran on for Sam (${t0.toFixed(1)} to ${t1.toFixed(1)})`, t1 - t0 > 25);
  k.step('the goblins moved', w0 !== w1);
  k.step('nobody took over in 30 s', split === 0, split);
  await k.hide(kyle, false);
  await k.wait(1500);
  k.step('back in sight: Kyle leads, Sam follows', (await k.role(kyle)) === 'lead' && (await k.role(sam)) === 'follow:' + kyle.id);
  const [a, b] = [await k.ev(kyle, () => window.__game.room.time), await k.ev(sam, () => window.__game.room.time)];
  k.step('both on the same moment of the fight', Math.abs(a - b) < 1, [a, b]);
  // Half a minute with nobody at the keys: the goblins may well have put both of them down by now
  // (the board's first job is harder some days). On their feet again, so the way on can take them.
  await k.ev(kyle, () => { for (const h of window.__game.room.heroes) if (h.act === 'down') Object.assign(h, { act: 'idle', actT: 0, actDur: 0, hp: h.maxHp, bleeding: false, out: false }); });
  k.step('and they finish it together', (await k.finish(kyle, [sam])) && (await k.until(sam, () => window.__game.mode === 'town', null, 10000)));
}

/** 4f. A phone that suspends the leader's page outright: Sam takes over, and Kyle, thawed, follows Sam. */
async function frozen(k) {
  const kyle = await k.open('KYLEF', 'WARRIOR'), sam = await k.open('SAMF', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await k.wait(2500);
  const goblins = await k.alive(kyle);
  await k.freeze(kyle);
  k.step('Kyle frozen: Sam takes the job on', await k.until(sam, () => !!window.__game.coop && !window.__game.remote, null, 20000));
  await k.wait(2000);
  await k.freeze(kyle, false);
  k.step('Kyle thaws and follows Sam (no split)', await k.until(kyle, (id) => window.__game.mode === 'run' && !window.__game.coop && window.__game.remote?.lead === id, sam.id, 15000), await k.role(kyle));
  await k.wait(2000);
  k.step('Sam still leads', (await k.role(sam)) === 'lead');
  const [a, b] = [await k.alive(sam), await k.alive(kyle)];
  k.step('one fight: the same goblins on both screens', a === b && a.split(',').length <= goblins.split(',').length, [a.split(',').length, b.split(',').length]);
  k.step('Sam finishes it, Kyle with him', (await k.finish(sam, [kyle])) && (await k.until(kyle, () => window.__game.mode === 'town', null, 10000)));
}

/** 5. The leader's tab closed: Sam takes over within 15 s and carries on to the next room. */
async function closed(k) {
  const kyle = await k.open('KYLEG', 'WARRIOR'), sam = await k.open('SAMG', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await k.wait(2500);
  const goblins = await k.alive(kyle);
  await kyle.ctx.close();
  k.step('Sam takes the job on within 15 s', await k.until(sam, () => !!window.__game.coop && !window.__game.remote, null, 15000));
  const now = await k.alive(sam);
  k.step('the same goblins in it', now === goblins, [now.split(',').length, goblins.split(',').length]);
  const t0 = await k.ev(sam, () => window.__game.room.time);
  await k.wait(1000);
  k.step("Sam's room runs", (await k.ev(sam, () => window.__game.room.time)) > t0 + 0.5);
  k.step('Sam takes it on to the next room and the end', await k.finish(sam));
  k.step('Sam is home', await k.until(sam, () => window.__game.mode === 'town', null, 10000));
}

/** 6. Sam reloads: straight back in, following Kyle, one hero of his in the room. */
async function guestReload(k) {
  const kyle = await k.open('KYLEH', 'WARRIOR'), sam = await k.open('SAMH', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await k.reload(sam);
  k.step('Sam is back in, following Kyle', await k.until(sam, (id) => window.__game.mode === 'run' && window.__game.remote?.lead === id && window.__game.room.heroes.some((h) => h.id === 'me') && window.__game.room.heroes.some((h) => h.id === '@lead'), kyle.id, 15000));
  k.step("one Sam in Kyle's room", await k.until(kyle, (id) => window.__game.room.heroes.filter((h) => h.id === id).length === 1 && window.__game.room.heroes.length === 2, sam.id));
  k.step('they finish it together', (await k.finish(kyle, [sam])) && (await k.until(sam, () => window.__game.mode === 'town', null, 10000)));
}

/** 6b. Sam's phone locked over a minute: Kyle's room lets his hero go; back, Sam is straight back in it. */
async function guestAway(k) {
  const kyle = await k.open('KYLEO', 'WARRIOR'), sam = await k.open('SAMP', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await k.freeze(sam);
  // (A minute is a long wait: Kyle's room is told Sam was last heard from 61 s ago.)
  await k.ev(kyle, (id) => (window.__game.coop.friends.get(id).heard -= 61), sam.id);
  k.step("Kyle's room lets Sam's hero go", await k.until(kyle, () => window.__game.room.heroes.length === 1, null, 3000));
  await k.freeze(sam, false);
  k.step("Kyle's room has Sam's hero again", await k.until(kyle, (id) => window.__game.room.heroes.some((h) => h.id === id), sam.id, 10000));
  k.step('Sam is back in, with his hero', await k.until(sam, (id) => window.__game.remote?.lead === id && window.__game.room.heroes.some((h) => h.id === 'me') && window.__game.room.heroes.length === 2, kyle.id, 10000));
  k.step('they finish it together', (await k.finish(kyle, [sam])) && (await k.until(sam, () => window.__game.mode === 'town', null, 10000)));
}

/** 7. Kyle reloads: one of them leads and the other follows (never both, never neither), and they finish. */
async function leaderReload(k) {
  const kyle = await k.open('KYLEI', 'WARRIOR'), sam = await k.open('SAMI', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await k.wait(2500);
  const goblins = await k.alive(kyle);
  await k.reload(kyle);
  const settled = async () => {
    const r = [await k.role(kyle), await k.role(sam)];
    return (r[0] === 'lead' && r[1] === 'follow:' + kyle.id) || (r[1] === 'lead' && r[0] === 'follow:' + sam.id) ? r : null;
  };
  let r = null;
  for (let i = 0; i < 40 && !(r = await settled()); i++) await k.wait(500);
  // ...and still so a while later (nobody flapping between leading and following).
  await k.wait(12000);
  const again = await settled();
  k.step('one leads, the other follows, and it holds', !!r && !!again && r.join() === again.join(), again ?? [await k.role(kyle), await k.role(sam)]);
  if (!again) return;
  const [lead, other] = again[0] === 'lead' ? [kyle, sam] : [sam, kyle];
  k.step(`${lead.name} leads now`, true);
  k.step('two heroes in the room, the same goblins', await k.until(lead, () => window.__game.room.heroes.length === 2) && (await k.alive(other)) === (await k.alive(lead)) && (await k.alive(lead)).split(',').length <= goblins.split(',').length);
  const g0 = await k.ev(other, () => window.__game.profile.gold);
  k.step('they finish it and both are paid', (await k.finish(lead, [other])) && (await k.until(other, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, g0, 10000)));
}

module.exports = { 4: hidden, '4f': frozen, 5: closed, 6: guestReload, '6b': guestAway, 7: leaderReload };
