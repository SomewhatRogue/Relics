// Going indoors on your own: each player in whichever house (or the street) they walked into, the
// leader's game running every room someone's in, each friend sent only their own. Every scenario sets
// out on a village street (seed 7: door 0 has two goblins inside, door 6 one and a cage).

/** The party's set out; the leader moves it to the village street (its goblins dead), everyone in it. */
async function onVillage(k, lead, rest) {
  await k.ev(lead, async () => {
    const g = window.__game;
    g.startJob(await window.__villageJob(7), g.run.party);
    for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false });
  });
  let ok = await k.until(lead, (n) => window.__game.room.heroes.length === n, rest.length + 1);
  for (const p of rest) ok = (await k.until(p, () => window.__game.run?.job.place.kind === 'village' && window.__game.room.heroes.some((h) => h.id === 'me'), null, 10000)) && ok;
  return k.step('the party is on a village street', ok);
}

/** On the leader's page: the street, a door block, the house behind it, and who's in which room. */
const where = (k, lead, id) => k.ev(lead, (id) => {
  const g = window.__game, r = g.rooms.roomOf(id);
  return r ? (r === g.rooms.street ? 'street' : 'house' + g.rooms.street.map.blocks.indexOf(g.rooms.doorOf(r))) : 'nowhere';
}, id);

/** A friend at door `i`'s foot (put there on the leader's page) walks up into it (the up key, phone or laptop). */
async function friendIn(k, lead, p, i) {
  await k.ev(lead, ([id, i]) => {
    const g = window.__game, b = g.rooms.street.map.blocks[i];
    Object.assign(g.rooms.street.heroes.find((h) => h.id === id), { x: b.x + b.w / 2, y: b.y + b.h + 0.45, kvx: 0, kvy: 0 });
  }, [p.id, i]);
  await k.until(p, () => !!window.__game.near()?.door);
  await p.page.keyboard.down('ArrowUp');
  const ok = await k.until(lead, ([id, i]) => window.__game.rooms.houses.get(window.__game.rooms.street.map.blocks[i])?.heroes.some((h) => h.id === id), [p.id, i]);
  await p.page.keyboard.up('ArrowUp');
  return ok;
}

/** The leader goes in at door `i` (their own game). */
const leaderIn = (k, lead, i) => k.ev(lead, (i) => {
  const g = window.__game, b = g.rooms.street.map.blocks[i];
  Object.assign(g.hero, { x: b.x + b.w / 2, y: b.y + b.h + 0.45 });
  g.enter(b);
  return g.room.indoors;
}, i);

/** On the leader's page: walk a player (by id, 'me' the leader) out of the bottom of the house they're in. */
const walkOut = (k, lead, id) => k.ev(lead, (id) => {
  const r = window.__game.rooms.roomOf(id), x = r.map.exit, h = r.heroes.find((q) => q.id === id);
  Object.assign(h, { x: x.x + x.w / 2, y: x.y + 0.1, kvx: 0, kvy: 0 });
}, id);

/** On the leader's page: the goblins in house `i` dead (or awake and after whoever's in there). */
const house = (k, lead, i, how) => k.ev(lead, ([i, how]) => {
  const g = window.__game, r = g.rooms.houses.get(g.rooms.street.map.blocks[i]);
  for (const e of r.enemies) Object.assign(e, how === 'dead' ? { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false } : { alert: true, act: 'chase', actT: 0 });
  return r.enemies.length;
}, [i, how]);

/** What a page has: indoors or not, who's in its room, the names over doors. */
const sees = (k, p) => k.ev(p, () => {
  const g = window.__game;
  return { indoors: !!g.room.indoors, ids: g.room.heroes.map((h) => h.id).sort().join(','), marks: g.doorMarks().map((m) => m.who.map((w) => w.name).join('+')).sort().join(','), map: g.room.map.name };
});

/** 15. A friend goes into a house alone; the leader stays out and sees their name at that door; the goblins in there go for them. */
async function friendAlone(k) {
  const kyle = await k.open('KYLE15', 'WARRIOR'), sam = await k.open('SAM15', 'RANGER', true);
  if (!(await k.party(kyle, sam)) || !(await onVillage(k, kyle, [sam]))) return;
  k.step('Sam walks up into a door and goes in', await friendIn(k, kyle, sam, 0));
  k.step('Sam alone in the house on his screen', await k.until(sam, () => window.__game.room.indoors && window.__game.room.heroes.map((h) => h.id).join() === 'me'), await sees(k, sam));
  const ks = await sees(k, kyle);
  k.step('Kyle still out in the street, by himself', !ks.indoors && ks.ids === 'me', ks);
  k.step("Kyle sees SAM15's name over that door", await k.until(kyle, () => { const m = window.__game.doorMarks(); return m.length === 1 && m[0].who[0].name === 'SAM15'; }));
  const at = await k.ev(kyle, () => { const g = window.__game, b = g.rooms.street.map.blocks[0], m = g.doorMarks()[0]; return Math.hypot(m.x - (b.x + b.w / 2), m.y - (b.y + b.h + 0.45)) < 0.01; });
  k.step('the name is over the door he went in by', at);
  const n = await house(k, kyle, 0, 'awake');
  const hpOf = (id) => window.__game.rooms.roomOf(id).heroes.find((h) => h.id === id).hp;
  const hp0 = await k.ev(kyle, `(${hpOf})('${sam.id}')`);
  k.step(`the ${n} goblins in there hurt Sam (on both screens)`, (await k.until(kyle, ([id, hp0]) => { const r = window.__game.rooms.roomOf(id); return r.indoors && r.heroes.find((h) => h.id === id).hp < hp0; }, [sam.id, hp0], 12000)) && (await k.until(sam, () => window.__game.hero.hp < window.__game.hero.maxHp)));
  await house(k, kyle, 0, 'dead');
  await walkOut(k, kyle, sam.id);
  k.step('Sam walks out: back in the street with Kyle', await k.until(sam, () => !window.__game.room.indoors && window.__game.room.heroes.some((h) => h.id === '@lead')));
  k.step('and the name over the door is gone', await k.until(kyle, () => window.__game.doorMarks().length === 0));
}

/** 16. The leader goes in alone; the friend stays out and keeps playing (not dragged in). */
async function leaderAlone(k) {
  const kyle = await k.open('KYLE16', 'WARRIOR'), sam = await k.open('SAM16', 'RANGER');
  if (!(await k.party(kyle, sam)) || !(await onVillage(k, kyle, [sam]))) return;
  k.step('Kyle goes in', await leaderIn(k, kyle, 6));
  k.step("Sam's not dragged in: still in the street", (await where(k, kyle, sam.id)) === 'street' && (await k.until(sam, () => !window.__game.room.indoors && !window.__game.room.heroes.some((h) => h.id === '@lead'))));
  k.step("Sam sees KYLE16's name over the door", await k.until(sam, () => window.__game.doorMarks().some((m) => m.who.some((w) => w.name === 'KYLE16'))));
  const x0 = await k.ev(kyle, (id) => window.__game.rooms.street.heroes.find((h) => h.id === id).x, sam.id);
  await sam.page.keyboard.down('ArrowRight');
  await k.wait(1200);
  await sam.page.keyboard.up('ArrowRight');
  await k.wait(300);
  const x1 = await k.ev(kyle, (id) => window.__game.rooms.street.heroes.find((h) => h.id === id).x, sam.id);
  k.step('Sam keeps walking about out there', x1 > x0 + 0.8, [x0, x1]);
  const ks = await sees(k, kyle);
  k.step('Kyle indoors alone', ks.indoors && ks.ids === 'me', ks);
  await house(k, kyle, 6, 'dead');
  await walkOut(k, kyle, 'me');
  k.step('Kyle comes out: both in the street again', await k.until(sam, () => !window.__game.room.indoors && window.__game.room.heroes.some((h) => h.id === '@lead')));
}

/** 17. Three of them: the leader in one house, a friend in another, the third outside sees both names. */
async function twoHouses(k) {
  const kyle = await k.open('KYLE17', 'WARRIOR'), sam = await k.open('SAM17', 'RANGER', true), ana = await k.open('ANA17', 'HEALER', true);
  if (!(await k.party(kyle, sam, ana)) || !(await onVillage(k, kyle, [sam, ana]))) return;
  await leaderIn(k, kyle, 0);
  await house(k, kyle, 0, 'dead');
  k.step('Sam goes into another house', await friendIn(k, kyle, sam, 3));
  await house(k, kyle, 3, 'dead');
  const [a, b] = [await where(k, kyle, 'me'), await where(k, kyle, sam.id)];
  k.step('Kyle in one, Sam in the other', a === 'house0' && b === 'house3', [a, b]);
  const t = () => k.ev(kyle, () => window.__game.rooms.live().map((r) => r.time));
  const t0 = await t();
  await k.wait(1000);
  const t1 = await t();
  k.step('the street and both houses all run', t0.length === 3 && t1.every((x, i) => x > t0[i] + 0.5), [t0, t1]);
  const [ks, ss, as] = [await sees(k, kyle), await sees(k, sam), await sees(k, ana)];
  k.step('each screen has its own room', ks.indoors && ss.indoors && !as.indoors && ks.map !== undefined && ks.ids === 'me' && ss.ids === 'me' && as.ids === 'me', [ks, ss, as]);
  k.step('Ana, outside, sees both names over their doors', await k.until(ana, () => window.__game.doorMarks().map((m) => m.who[0].name).sort().join() === 'KYLE17,SAM17'));
}

/** 18. A small goblin after a friend follows them in; a butcher doesn't. */
async function followers(k) {
  const kyle = await k.open('KYLE18', 'WARRIOR'), sam = await k.open('SAM18', 'RANGER', true);
  if (!(await k.party(kyle, sam)) || !(await onVillage(k, kyle, [sam]))) return;
  // Two of the street's dead brought back by door 9, awake: a plain goblin and one made a butcher.
  await k.ev(kyle, () => {
    const g = window.__game, s = g.rooms.street, b = s.map.blocks[9], x = b.x + b.w / 2, y = b.y + b.h + 0.45, [a, c] = s.enemies;
    Object.assign(a, { hp: 30, maxHp: 30, act: 'chase', actT: 0, alert: true, x: x + 2.2, y: y + 1.2, tagged: 'small', attack: null, cooldown: 5 });
    Object.assign(c, { kind: 'butcher', hp: 300, maxHp: 300, act: 'chase', actT: 0, alert: true, x: x - 2.2, y: y + 1.2, tagged: 'big', attack: null, cooldown: 5 });
  });
  k.step('Sam goes in with goblins after him', await friendIn(k, kyle, sam, 9));
  const ok = await k.until(kyle, () => { const g = window.__game, r = g.rooms.houses.get(g.rooms.street.map.blocks[9]); return r.enemies.some((e) => e.tagged === 'small'); }, null, 5000);
  k.step('the small one comes in after him', ok);
  k.step("the butcher doesn't", await k.ev(kyle, () => { const g = window.__game, r = g.rooms.houses.get(g.rooms.street.map.blocks[9]); return !r.enemies.some((e) => e.tagged === 'big') && g.rooms.street.enemies.some((e) => e.tagged === 'big'); }));
  k.step('Sam sees it in there with him', await k.until(sam, (n) => window.__game.room.enemies.filter((e) => e.hp > 0).length >= n, await k.ev(kyle, () => { const g = window.__game; return g.rooms.houses.get(g.rooms.street.map.blocks[9]).enemies.filter((e) => e.hp > 0).length; })));
}

/** 19. A friend frees someone in a house and brings them out alone: home, and counted on both screens. */
async function captiveOut(k) {
  const kyle = await k.open('KYLE19', 'WARRIOR'), sam = await k.open('SAM19', 'WARRIOR');
  if (!(await k.party(kyle, sam)) || !(await onVillage(k, kyle, [sam]))) return;
  k.step('Sam goes into the house with the cage', await friendIn(k, kyle, sam, 6));
  await house(k, kyle, 6, 'dead');
  await k.ev(kyle, (id) => {
    const g = window.__game, r = g.rooms.houses.get(g.rooms.street.map.blocks[6]), c = r.props.find((p) => p.kind === 'cage');
    c.hp = 1;
    Object.assign(r.heroes.find((h) => h.id === id), { x: c.x, y: c.y + 0.9, fx: 0, fy: -1, kvx: 0, kvy: 0 });
  }, sam.id);
  // One swing at a time until it breaks (another would land on whoever was in it).
  const freed = () => k.until(kyle, () => { const g = window.__game; return g.rooms.houses.get(g.rooms.street.map.blocks[6]).survivors.length === 1; }, null, 700);
  let broke = false;
  for (let i = 0; i < 5 && !broke; i++) (await sam.page.keyboard.press('j'), (broke = await freed()));
  k.step('Sam breaks the cage', broke);
  await k.wait(1800);
  await walkOut(k, kyle, sam.id);
  k.step('Sam walks out with them: home', await k.until(kyle, () => window.__game.run.rescued === 1 && window.__game.rooms.street.survivors.length === 1), await k.ev(kyle, () => { const g = window.__game; return { rescued: g.run.rescued, street: g.rooms.street.survivors.map((s) => [s.dead, s.home]), house: g.rooms.houses.get(g.rooms.street.map.blocks[6]).survivors.map((s) => [s.dead, s.home, s.hp]) }; }));
  k.step("Sam's screen has them in the street too", await k.until(sam, () => !window.__game.room.indoors && window.__game.room.survivors.length === 1 && window.__game.run?.rescued === 1));
  k.step('Kyle never went in', (await where(k, kyle, 'me')) === 'street');
}

/** 20. The leader leaves for home while a friend is in a house: the friend takes the job on, still in there, and carries on. */
async function leaveWhileIn(k) {
  const kyle = await k.open('KYLE20', 'WARRIOR'), sam = await k.open('SAM20', 'RANGER', true);
  if (!(await k.party(kyle, sam)) || !(await onVillage(k, kyle, [sam]))) return;
  k.step('Sam goes in', await friendIn(k, kyle, sam, 0));
  await house(k, kyle, 0, 'dead');
  await k.wait(2600); // (a whole-job save goes out every 2 s)
  await k.leave(kyle);
  k.step('Kyle is home', await k.home(kyle));
  k.step('Sam takes the job on', await k.until(sam, () => !!window.__game.coop && !window.__game.remote, null, 8000));
  const s = await k.ev(sam, () => { const g = window.__game; return { indoors: !!g.room.indoors, door: !!g.outside, street: !!g.rooms.street, houses: g.rooms.houses.size, ids: g.rooms.all().flatMap((r) => r.heroes.map((h) => h.id)).join() }; });
  k.step('still inside the same house, the street behind its door', s.indoors && s.door && s.street && s.houses === 1, s);
  k.step("Kyle's hero gone from every room", await k.until(sam, () => window.__game.rooms.all().flatMap((r) => r.heroes.map((h) => h.id)).join() === 'me', null, 3000));
  await walkOut(k, sam, 'me');
  k.step('Sam walks out into the street', await k.until(sam, () => !window.__game.room.indoors && !window.__game.outside));
  const g0 = await k.ev(sam, () => window.__game.profile.gold);
  k.step('and takes the job on to the end', await k.finish(sam));
  k.step('and is paid', await k.until(sam, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, g0));
}

/** 21. The way on waits for a friend who's indoors: once they're out and in it too, the party goes on. */
async function waitsForYou(k) {
  const kyle = await k.open('KYLE21', 'WARRIOR'), sam = await k.open('SAM21', 'RANGER', true);
  if (!(await k.party(kyle, sam)) || !(await onVillage(k, kyle, [sam]))) return;
  k.step('Sam goes in', await friendIn(k, kyle, sam, 0));
  await house(k, kyle, 0, 'dead');
  const ex = await k.exitAt(kyle);
  await k.put(kyle, 'me', ex.x, ex.y);
  await k.wait(2000);
  k.step("Kyle in the way on alone doesn't go on", (await k.ev(kyle, () => window.__game.run.index)) === 0 && (await k.ev(kyle, () => window.__game.room.exitOpen)));
  await walkOut(k, kyle, sam.id);
  await k.until(kyle, (id) => window.__game.room.heroes.some((h) => h.id === id), sam.id);
  await k.put(kyle, sam.id, ex.x + 0.5, ex.y);
  k.step('Sam comes out and joins him: on they go', await k.until(kyle, () => window.__game.run.index === 1));
  k.step("on Sam's screen too", await k.until(sam, () => window.__game.run?.index === 1 && window.__game.room.heroes.some((h) => h.id === '@lead') && !window.__game.room.indoors));
}

module.exports = { 15: friendAlone, 16: leaderAlone, 17: twoHouses, 18: followers, 19: captiveOut, 20: leaveWhileIn, 21: waitsForYou };
