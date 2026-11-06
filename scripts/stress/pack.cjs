// The pack on a friend's screen: opened while following someone else's job (the friend's copy of the
// room is drawn from the leader's patches), every change made from it reaching the leader's room and
// holding, in town, in the street and inside a house. (Seen live, 2026-11-04: a friend's pack threw
// on opening, because the patches left out the relics they own.)

const piece = (slot, tag, extra = {}) => ({ slot, quality: 'fine', traits: [], mods: [], level: 0, tag, ...extra });
/** On a page: the pack opened with its button; true once it's drawn (the paper doll and the bag). */
async function openPack(k, p) {
  await k.ev(p, () => { window.__pack.toggle(false); document.getElementById('packbtn').click(); });
  return k.until(p, () => window.__pack.open && !!document.querySelector('#pack:not([hidden]) .doll') && !!document.querySelector('#pack .bag'), null, 4000);
}
const shut = (k, p) => k.ev(p, () => window.__pack.toggle(false));
/** Where a tagged piece is in this page's pack (-1: not there). */
const at = (k, p, tag) => k.ev(p, (tag) => window.__game.hero.bag.findIndex((it) => it.tag === tag), tag);
/** Tap a piece in the pack (`src`, as its square's data-src), then the card's button for gear change `op` (and `arg`, if given). */
async function tapThen(k, p, src, op, arg) {
  await k.ev(p, (src) => window.__pack.pick(src), src);
  const sel = `#pack .detail button[data-op="${op}"]` + (arg === undefined ? '' : `[data-arg="${arg}"]`);
  if (!(await k.until(p, (sel) => !!document.querySelector(sel), sel, 3000))) return false;
  await k.ev(p, (sel) => document.querySelector(sel).click(), sel);
  return true;
}
/** True once `test` holds of the friend's hero, on the leader's page and on the friend's own. */
async function holds(k, lead, p, test) {
  const there = await k.until(lead, ([id, test]) => { const g = window.__game, h = (g.rooms?.roomOf(id) ?? g.room).heroes.find((x) => x.id === id); return !!h && new Function('h', 'return ' + test)(h); }, [p.id, test], 5000);
  return there && (await k.until(p, (test) => new Function('h', 'return ' + test)(window.__game.hero), test, 5000));
}
const GEAR = { equip: 1, drop: 2, carry: 3, front: 4, off: 6 };

/** 27. Sam's pack in town, then following Kyle's job: a ring on, armor swapped, a piece dropped, the belt reordered, a relic carried; then inside a house. Kyle's too. */
async function guestPack(k) {
  const kyle = await k.open('KYLE27', 'WARRIOR'), sam = await k.open('SAM27', 'RANGER', true);
  // Sam's kit: armor on, more armor and two rings in the pack, two potions, two relics he owns.
  await k.ev(sam, (kit) => {
    const g = window.__game, q = g.profile;
    q.armor = kit[0];
    q.bag.push(...kit.slice(1));
    q.belt = ['bitter', 'oil'];
    q.relics = [{ id: 'r27a', kind: 'bell', tier: 1, el: '', charge: 24 }, { id: 'r27b', kind: 'bomb', tier: 1, el: '', charge: 24 }];
    g.keep();
    g.enterTown();
  }, [piece('armor', 'a27', { armor: 'light' }), piece('armor', 'b27', { armor: 'medium' }), piece('ring', 'ring27'), piece('ring', 'junk27')]);
  k.step('in town: the pack opens', await openPack(k, sam));
  await shut(k, sam);
  k.step("in town: the leader's pack opens", await openPack(k, kyle));
  await shut(k, kyle);
  if (!(await k.party(kyle, sam))) return;
  // A village street with two houses to go into (seed 207, as split.cjs: since the atlas's doors rule
  // seed 7 has one): a barn with goblins in it, and the torch-bearers' house. Every goblin dead.
  const d = await k.ev(kyle, async () => {
    const g = window.__game;
    g.startJob(await window.__villageJob(207), g.run.party);
    const bs = g.room.map.blocks, at = (held) => bs.findIndex((b) => !!b.door && !b.door.startsWith('side:') && b.door.endsWith(':held') === held);
    return { plain: at(false), caged: at(true) };
  });
  k.step('a village street with two doors', d.plain >= 0 && d.caged >= 0, d);
  await k.until(sam, () => window.__game.run?.job.place.kind === 'village' && window.__game.room.heroes.some((h) => h.id === 'me'), null, 10000);
  await k.clear(kyle);
  k.step('on the job, following: the pack opens', await openPack(k, sam));
  k.step('a ring from the pack goes on', (await tapThen(k, sam, 'bag:' + (await at(k, sam, 'ring27')), GEAR.equip)) && (await holds(k, kyle, sam, "h.rings.some((r) => r.tag === 'ring27')")));
  k.step('armor swapped for the packed one', (await tapThen(k, sam, 'bag:' + (await at(k, sam, 'b27')), GEAR.equip)) && (await holds(k, kyle, sam, "h.armor?.tag === 'b27' && h.bag.some((it) => it.tag === 'a27')")));
  k.step('a piece dropped from the pack', (await tapThen(k, sam, 'bag:' + (await at(k, sam, 'junk27')), GEAR.drop)) && (await holds(k, kyle, sam, "!h.bag.some((it) => it.tag === 'junk27')")));
  k.step('the second potion to the front of the belt', (await tapThen(k, sam, 'belt:1', GEAR.front)) && (await holds(k, kyle, sam, "h.belt[0] === 'oil'")));
  // The relics' own row (relicshelf.ts, since the upgradeui merge; the card with nothing chosen lists
  // them no more): the empty RELIC slot tapped, CARRY the bomb; then the bell's square on the shelf
  // tapped, CARRY on its card (the bomb goes back on the shelf).
  const found = (id) => k.ev(sam, (id) => window.__game.hero.found.findIndex((r) => r.id === id), id);
  k.step('a relic he owns carried from the empty slot', (await tapThen(k, sam, 'relic', GEAR.carry, await found('r27b'))) && (await holds(k, kyle, sam, "h.relicItem === 'r27b'")));
  k.step('the other carried from its card on the shelf', (await tapThen(k, sam, 'found:' + (await found('r27a')), GEAR.carry)) && (await holds(k, kyle, sam, "h.relicItem === 'r27a'")));
  await shut(k, sam);
  await k.wait(1500);
  k.step('everything holds on his page', await k.ev(sam, () => { const h = window.__game.hero; return h.armor?.tag === 'b27' && h.rings.some((r) => r.tag === 'ring27') && !h.bag.some((it) => it.tag === 'junk27') && h.belt[0] === 'oil'; }));
  k.step('and in his save', await k.until(sam, () => { const q = window.__game.profile; return q.armor?.tag === 'b27' && q.rings.some((r) => r.tag === 'ring27') && q.relic === 'r27a' && q.belt[0] === 'oil'; }, null, 4000));
  // Into the barn (its goblins dead), then the pack again: a ring off.
  await k.ev(kyle, (i) => {
    const g = window.__game, b = g.rooms.street.map.blocks[i], r = g.rooms.houses.get(b);
    for (const e of r?.enemies ?? []) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false });
    Object.assign(g.rooms.street.heroes.find((h) => h.id !== 'me'), { x: b.x + b.w / 2, y: b.y + b.h + 0.45, kvx: 0, kvy: 0 });
  }, d.plain);
  await k.until(sam, () => !!window.__game.near()?.door);
  await sam.page.keyboard.down('ArrowUp');
  const inside = await k.until(sam, () => window.__game.room.indoors, null, 6000);
  await sam.page.keyboard.up('ArrowUp');
  k.step('Sam goes into a house', inside);
  k.step('inside: the pack opens', await openPack(k, sam));
  const ring = await k.ev(sam, () => window.__game.hero.rings.findIndex((r) => r.tag === 'ring27'));
  k.step('inside: the ring comes off', (await tapThen(k, sam, 'ring:' + ring, GEAR.off)) && (await holds(k, kyle, sam, "!h.rings.some((r) => r.tag === 'ring27') && h.bag.some((it) => it.tag === 'ring27')")));
  await shut(k, sam);
  // The leader goes into the other house, and opens his own.
  await k.ev(kyle, (i) => { const g = window.__game, b = g.rooms.street.map.blocks[i]; Object.assign(g.hero, { x: b.x + b.w / 2, y: b.y + b.h + 0.45 }); g.enter(b); }, d.caged);
  k.step("inside: the leader's pack opens", (await k.until(kyle, () => window.__game.room.indoors)) && (await openPack(k, kyle)));
  await shut(k, kyle);
}

module.exports = { 27: guestPack };
