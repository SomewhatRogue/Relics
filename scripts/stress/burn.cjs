// A house set alight from outside with a friend in it (sim/houseburn.ts): the leader lights the kindling
// with G (the room decides, through the grab press), the friend's screen shows it alight and the smoke,
// and as the roof comes in he's out in the street on both screens, the house a shell nobody can enter.

/** The party on a village street (seed 7), its goblins gone. */
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

/** 26. Sam's inside when Kyle lights the house: he gets out as it falls. */
async function burnWithFriendIn(k) {
  const kyle = await k.open('KYLE26', 'MAGE'), sam = await k.open('SAM26', 'RANGER', true);
  if (!(await k.party(kyle, sam)) || !(await onVillage(k, kyle, [sam]))) return;
  const i = await k.ev(kyle, () => window.__game.room.map.blocks.findIndex((b, i) => window.__kindling(i)));
  k.step('a house with a kindling spot', i >= 0, i);
  // Sam walks up into its door.
  await k.ev(kyle, ([id, i]) => {
    const g = window.__game, b = g.rooms.street.map.blocks[i];
    Object.assign(g.rooms.street.heroes.find((h) => h.id === id), { x: b.x + b.w / 2, y: b.y + b.h + 0.45, kvx: 0, kvy: 0 });
  }, [sam.id, i]);
  await k.until(sam, () => !!window.__game.near()?.door);
  await sam.page.keyboard.down('ArrowUp');
  const inside = await k.until(kyle, ([id, i]) => window.__game.rooms.houses.get(window.__game.rooms.street.map.blocks[i])?.heroes.some((h) => h.id === id), [sam.id, i]);
  await sam.page.keyboard.up('ArrowUp');
  k.step('Sam goes in', inside);
  await k.ev(kyle, (i) => { const r = window.__game.rooms.houses.get(window.__game.rooms.street.map.blocks[i]); for (const e of r.enemies) Object.assign(e, { hp: 0, act: 'dead', actDur: 99 }); }, i);
  // Kyle at the kindling: G.
  await k.ev(kyle, (i) => { const s = window.__kindling(i); Object.assign(window.__game.hero, { x: s.x + s.side * 0.45, y: s.y, kvx: 0, kvy: 0 }); }, i);
  k.step('Kyle sees G BURN', await k.until(kyle, () => document.getElementById('prompt')?.textContent === 'G  BURN'));
  await kyle.page.keyboard.press('g');
  k.step('the house is alight (on the leader)', await k.until(kyle, (i) => window.__game.room.map.blocks[i].burning >= 0, i, 8000));
  k.step("Sam's room burns on his screen (the smoke's coming)", await k.until(sam, () => window.__game.room.indoors && window.__game.room.map.blaze?.smoke !== undefined, null, 8000));
  // The roof brought forward, and Sam kept on his feet in the smoke.
  await k.ev(kyle, ([id, i]) => {
    const g = window.__game, f = g.rooms.street.houseFires.find((x) => x.i === i), r = g.rooms.houses.get(g.rooms.street.map.blocks[i]);
    const left = 3, now = g.rooms.street.time;
    f.fall = now + left;
    r.map.blaze.fall = r.time + left;
    window.__keepSam = setInterval(() => { const h = g.rooms.roomOf(id)?.heroes.find((x) => x.id === id); if (h) h.hp = Math.max(h.hp, h.maxHp / 2); }, 50);
  }, [sam.id, i]);
  k.step('as it falls, Sam is out in the street (leader)', await k.until(kyle, (id) => window.__game.rooms.street.heroes.some((h) => h.id === id), sam.id, 12000));
  k.step('and on his own screen', await k.until(sam, () => !window.__game.room.indoors && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 10000));
  k.step('the house is a shell, no way in', await k.until(sam, (i) => window.__game.room.map.blocks[i]?.ruined === true, i, 6000));
  await k.ev(kyle, () => clearInterval(window.__keepSam));
}

module.exports = { 26: burnWithFriendIn };
