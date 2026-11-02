// Falling in a party: helped up, getting up alone, out, the way on without them, everyone out.
const OUT = "You're out";

/** Two of them in a job with nothing left alive to interfere, standing a step apart. */
async function pair(k, a, b) {
  const kyle = await k.open(a, 'WARRIOR'), sam = await k.open(b, 'RANGER', true);
  if (!(await k.party(kyle, sam))) return null;
  await k.clear(kyle);
  const me = await k.hero(kyle, 'me');
  await k.put(kyle, sam.id, me.x + 1, me.y);
  await k.wait(500);
  return { kyle, sam, me };
}

/** 8. Sam goes down; Kyle presses G by him: up well before 20 s, his own get-up unspent. */
async function helped(k) {
  const p = await pair(k, 'KYLEJ', 'SAMJ');
  if (!p) return;
  const { kyle, sam } = p;
  await k.down(kyle, sam.id);
  k.step('Sam is down on his own screen', await k.until(sam, () => window.__game.hero.act === 'down'));
  const t0 = Date.now();
  k.step('Kyle sees G HELP UP', await k.until(kyle, () => document.querySelector('#prompt')?.textContent === 'G  HELP UP'));
  await kyle.page.keyboard.press('g');
  k.step('Sam is up within 4 s, well before 20 s', await k.until(sam, () => window.__game.hero.act !== 'down', null, 4000), `${((Date.now() - t0) / 1000).toFixed(1)} s down`);
  const s = await k.hero(kyle, sam.id);
  k.step('his own get-up is unspent', s && !s.selfUp && !s.bleeding, s);
}

/** 9. Sam down and alone: up by himself at 20 s; down again: out; Kyle goes on alone and Sam's out there too. */
async function alone(k) {
  const p = await pair(k, 'KYLEK', 'SAML');
  if (!p) return;
  const { kyle, sam } = p;
  await k.down(kyle, sam.id);
  k.step('Sam is down', await k.until(kyle, (id) => window.__game.room.heroes.find((h) => h.id === id).bleeding, sam.id));
  await k.ev(kyle, (id) => (window.__game.room.heroes.find((h) => h.id === id).actT = 19.5), sam.id);
  k.step('at 20 s he gets himself up, his get-up spent', await k.until(kyle, (id) => { const h = window.__game.room.heroes.find((x) => x.id === id); return h.act !== 'down' && h.selfUp; }, sam.id, 3000));
  k.step('and is up on his own screen', await k.until(sam, () => window.__game.hero.act !== 'down'));
  await k.down(kyle, sam.id, 19.5);
  k.step('down again and alone: out', await k.until(kyle, (id) => window.__game.room.heroes.find((h) => h.id === id).out, sam.id, 3000));
  k.step('Sam sees he is out', await k.until(sam, (t) => document.querySelector('#banner')?.textContent.includes(t), OUT));
  const rooms = await k.ev(kyle, () => window.__game.run.job.rooms);
  if (rooms < 2) return k.step('(a one-room job: no way on to test)', true);
  const key = await k.ev(kyle, () => window.__game.roomKey), x = await k.exitAt(kyle);
  await k.put(kyle, 'me', x.x, x.y);
  k.step('Kyle alone in the way out: the party goes on', await k.until(kyle, (key) => window.__game.roomKey > key && window.__game.run.index === 1, key));
  k.step("Sam's hero is in the next room, still out", await k.until(kyle, (id) => window.__game.room.heroes.find((h) => h.id === id)?.out, sam.id));
  k.step('Sam is there, and still sees he is out', await k.until(sam, (t) => window.__game.run?.index === 1 && window.__game.hero?.out && document.querySelector('#banner')?.textContent.includes(t), OUT));
}

/** 10. Kyle down and out: Sam clears the room and goes on alone. */
async function leaderOut(k) {
  const p = await pair(k, 'KYLEL', 'SAMM');
  if (!p) return;
  const { kyle, sam } = p;
  await k.down(kyle, 'me', 19.5, true);
  k.step('Kyle is out', await k.until(kyle, () => window.__game.hero.out, null, 3000));
  k.step('Kyle sees he is out', await k.until(kyle, (t) => document.querySelector('#banner')?.textContent.includes(t), OUT));
  const rooms = await k.ev(kyle, () => window.__game.run.job.rooms);
  if (rooms < 2) return k.step('(a one-room job: no way on to test)', true);
  const x = await k.exitAt(kyle);
  await k.put(kyle, sam.id, x.x, x.y);
  k.step('Sam alone in the way out: the party goes on', await k.until(sam, () => window.__game.run?.index === 1));
  k.step('Kyle is in the next room too, still out', await k.until(kyle, () => window.__game.run.index === 1 && window.__game.hero.out));
}

/** 11. Everyone out: the job is lost, both home with a result, nothing left to come back to. */
async function allOut(k) {
  const p = await pair(k, 'KYLEM', 'SAMN');
  if (!p) return;
  const { kyle, sam } = p;
  await k.down(kyle, sam.id, 19.5, true);
  await k.down(kyle, 'me', 19.5, true);
  k.step('Kyle is home, driven back', await k.home(kyle));
  k.step('Sam is home, driven back', await k.home(sam));
  for (const q of [kyle, sam]) k.step(`${q.name}: nothing left of the job`, await k.ev(q, () => !window.__game.coop && !window.__game.remote && !window.__game.run && localStorage.getItem('relic-coop') === null));
  await k.reload(sam);
  await k.wait(3000);
  k.step('Sam reloads and stays in town', (await k.role(sam)) === 'town');
}

/** 12. Kyle down; Sam's phone shows HELP UP beside him, and a tap gets Kyle up. */
async function phoneHelp(k) {
  const p = await pair(k, 'KYLEN', 'SAMO');
  if (!p) return;
  const { kyle, sam } = p;
  await k.down(kyle, 'me');
  k.step("Sam's phone shows HELP UP", await k.until(sam, () => { const b = document.querySelector('.tb.grab'); return !!b && !b.hidden && b.textContent === 'HELP UP'; }));
  await sam.page.tap('.tb.grab');
  k.step('Kyle is up within 4 s', await k.until(kyle, () => window.__game.hero.act !== 'down', null, 4000));
  k.step("Kyle's own get-up unspent", !(await k.hero(kyle, 'me')).selfUp);
}

module.exports = { 8: helped, 9: alone, 10: leaderOut, 11: allOut, 12: phoneHelp };
