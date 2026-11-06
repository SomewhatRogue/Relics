// RAISE on a phone (sim/raise.ts): a Cleric by a friend who is out (the RAISE button), the raise under way
// (the ring filling and the column of light), and a hero raised by a Cleric friend (the health bar's cut-off
// end and the line over them). Usage: node scripts/raise-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4471/';
const out = process.argv[3] || 'shots';
const PLACE = { name: 'Lowfurrow Fields', kind: 'field', region: 'Barrowfields', ruin: 2 };
const key = (k) => `document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', bubbles: true })); document.body.dispatchEvent(new KeyboardEvent('keyup', { key: '${k}', bubbles: true }));`;

/** A Cleric on a one-room job with no goblins, and Sam (a Warrior, or a Cleric) beside them. */
async function stage(page, samCleric) {
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('HEALER', 'ISOLDE'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(300);
  await page.evaluate((p) => { const g = window.__game, j = g.jobs()[1]; g.startJob({ ...j, place: p, objective: 'rescue', rooms: 1, seed: 5, layout: 3 }); }, PLACE);
  await page.waitForTimeout(500);
  await page.evaluate((samCleric) => {
    const g = window.__game, r = g.room, h = g.hero;
    for (const e of r.enemies) Object.assign(e, { x: 1.2, y: 1.2, act: 'dead', actT: 99, escaped: true, respawns: false });
    const at = { x: Math.round(r.map.w / 2), y: r.map.hero.y - 4 };
    Object.assign(h, { ...at, fx: 1, fy: 0, safeT: 0 });
    const s = r.join('sam-00001');
    Object.assign(s, { x: at.x + 0.9, y: at.y + 0.1, weapon: samCleric ? 'mace' : 'sword', tag: 'SAM', safeT: 0, fx: -1, fy: 0 });
    r.prev.set('h:sam-00001', [s.x, s.y]);
  }, samCleric);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [], phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  // 1. Isolde (a Cleric) by Sam, who is out: RAISE, then the raise under way.
  let page = await (await browser.newContext(phone)).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await stage(page, false);
  await page.evaluate(() => { const s = window.__game.room.heroes.find((x) => x.id === 'sam-00001'); Object.assign(s, { hp: 0, act: 'down', actT: 0, actDur: Infinity, bleeding: true, out: true, selfUp: true }); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/raise-ready-phone.png` });
  const word = await page.evaluate(() => document.querySelector('.tb.grab')?.textContent ?? '');
  await page.evaluate(key('g'));
  await page.waitForTimeout(2200);
  const mid = await page.evaluate(() => { const g = window.__game, s = g.room.heroes.find((x) => x.id === 'sam-00001'); return { riseBy: s.riseBy, share: (g.room.time - s.riseAt) / 4, out: s.out }; });
  await page.screenshot({ path: `${out}/raise-mid-phone.png` });
  await page.waitForTimeout(2400);
  const after = await page.evaluate(() => { const s = window.__game.room.heroes.find((x) => x.id === 'sam-00001'); return { out: s.out, hp: s.hp, maxHp: s.maxHp, hpCut: s.hpCut }; });
  await page.context().close();
  // 2. Isolde is out and Sam, a Cleric, raises her: her health bar is cut off at the far end.
  page = await (await browser.newContext(phone)).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await stage(page, true);
  await page.evaluate(() => {
    const g = window.__game, h = g.hero;
    Object.assign(h, { hp: 0, act: 'down', actT: 0, actDur: Infinity, bleeding: true, out: true, selfUp: true });
    g.room.setIntent('sam-00001', { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false, attackSeq: 0, blockSeq: 0, rollSeq: 0, weaponSeq: 0, relicSeq: 0, relicSwapSeq: 0, relicPickSeq: 0, relicPick: 0, augmentSeq: 0, classSeq: 0, grabSeq: 1, takeSeq: 0, take: 0, gearSeq: 0, gearOp: 0, gearArg: 0, potionSeq: 0, beltSeq: 0, openSeq: 0, open: 0, reload: false, reloadSeq: 0 });
  });
  await page.waitForTimeout(1500);
  const outLine = await page.evaluate(() => document.querySelector('#obj, .obj')?.textContent ?? '');
  await page.screenshot({ path: `${out}/raise-being-raised-phone.png` });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/raise-cut-phone.png` });
  const me = await page.evaluate(() => { const h = window.__game.hero; return { out: h.out, hp: h.hp, maxHp: h.maxHp, hpCut: h.hpCut, bar: document.querySelector('#hud .hp i').style.width, cut: document.querySelector('#hud .hp .cut').style.width, cutShown: !document.querySelector('#hud .hp .cut').hidden }; });
  console.log(JSON.stringify({ word, mid, after, outLine, me, errors }, null, 1));
  await browser.close();
})();
