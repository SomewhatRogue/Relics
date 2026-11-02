// Leaving a job by the LEAVE button: a friend, the leader, the leader of three, and alone.

/** 1. A friend leaves: home with a result; the leader's room lets their hero go at once and carries on. */
async function guestLeaves(k) {
  const kyle = await k.open('KYLEA', 'WARRIOR'), sam = await k.open('SAMA', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await k.leave(sam);
  k.step('Sam is home with a result', await k.home(sam));
  k.step("Kyle's room lets Sam's hero go within 2 s", await k.until(kyle, () => window.__game.room.heroes.length === 1, null, 2000));
  k.step('Kyle still leads the job', (await k.role(kyle)) === 'lead');
  const g0 = await k.ev(kyle, () => window.__game.profile.gold);
  k.step('Kyle finishes it alone', await k.finish(kyle));
  k.step('and is paid', await k.until(kyle, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, g0));
}

/** 2. The leader leaves: home; the friend takes the job on within 5 s, goblins as they were, and finishes it. */
async function leaderLeaves(k) {
  const kyle = await k.open('KYLEB', 'WARRIOR'), sam = await k.open('SAMB', 'RANGER', true);
  if (!(await k.party(kyle, sam))) return;
  await k.wait(2500); // (a whole-job save goes out every 2 s)
  const goblins = await k.alive(sam);
  const at = await k.hero(sam, 'me');
  await k.leave(kyle);
  k.step('Kyle is home with a result', await k.home(kyle));
  k.step('Sam takes the job on within 5 s', await k.until(sam, () => window.__game.mode === 'run' && !!window.__game.coop && !window.__game.remote, null, 5000));
  const now = await k.alive(sam);
  k.step('the same goblins in it', now === goblins, `${now.split(',').length} of ${goblins.split(',').length}`);
  const there = await k.hero(sam, 'me');
  k.step("Sam is where he was", Math.hypot(there.x - at.x, there.y - at.y) < 1.5);
  k.step("Kyle's hero isn't left standing in Sam's room", await k.until(sam, () => window.__game.room.heroes.length === 1, null, 3000));
  const g0 = await k.ev(sam, () => window.__game.profile.gold);
  k.step('Sam takes the party on through the job', await k.finish(sam));
  k.step('and is paid', await k.until(sam, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, g0));
}

/** 3. Three of them, the leader leaves: exactly one friend leads, the other follows them, the same fight. */
async function leaderOfThree(k) {
  const kyle = await k.open('KYLEC', 'WARRIOR'), sam = await k.open('SAMC', 'RANGER', true), ana = await k.open('ANAC', 'HEALER', true);
  if (!(await k.party(kyle, sam, ana))) return;
  await k.wait(2500);
  await k.leave(kyle);
  k.step('Kyle is home', await k.home(kyle));
  // (Ids in line: the lower takes it on; the other waits longer, in case the first is gone too.)
  const [first, second] = [sam, ana].sort((a, b) => (a.id < b.id ? -1 : 1));
  k.step(`${first.name} takes the job on`, await k.until(first, () => !!window.__game.coop && !window.__game.remote, null, 6000));
  await k.wait(9000); // past the second in line's own turn
  const roles = [await k.role(first), await k.role(second)];
  k.step(`one leads, the other follows them (${roles.join(' / ')})`, roles[0] === 'lead' && roles[1] === 'follow:' + first.id, roles);
  const [a, b] = [await k.alive(first), await k.alive(second)];
  k.step('the same goblins on both screens', a === b && a.length > 0, [a.split(',').length, b.split(',').length]);
  k.step('two heroes in the room', await k.until(first, () => window.__game.room.heroes.length === 2, null, 3000));
  const g0 = await k.ev(second, () => window.__game.profile.gold);
  k.step(`${first.name} takes them through the job`, await k.finish(first, [second]));
  k.step(`and ${second.name} is paid`, await k.until(second, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, g0, 10000));
}

/** 13. Alone: back in town, the result up, half the gold picked up. */
async function solo(k) {
  const kyle = await k.open('KYLED', 'WARRIOR');
  await k.ev(kyle, () => window.__openSpot('board'));
  await kyle.page.click('#panel [data-open="1"]');
  await kyle.page.click('#panel [data-job="1"]');
  k.step('Kyle sets out alone', await k.until(kyle, () => window.__game.mode === 'run' && !window.__game.coop));
  const g0 = await k.ev(kyle, () => ((window.__game.run.gold = 40), window.__game.profile.gold));
  await k.leave(kyle);
  k.step('back in town with the result up', await k.home(kyle));
  const g1 = await k.ev(kyle, () => window.__game.profile.gold);
  k.step('half the gold (20 of 40)', g1 - g0 === 20, g1 - g0);
}

module.exports = { 1: guestLeaves, 2: leaderLeaves, 3: leaderOfThree, 13: solo };
