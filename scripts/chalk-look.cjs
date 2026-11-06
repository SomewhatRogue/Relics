// The chalker, staged by a Rogue on a job, on a phone, flat and 2.5D: chalking a hero (the red strokes
// over their head, the newest white, the chalk hand up) and the pack turning on them at the fifth (the
// red flash, CHALKED, the red sight at their feet). Usage: node scripts/chalk-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4423/';
const out = process.argv[3] || 'shots';
const PLACE = { name: 'Lowfurrow Fields', kind: 'field', region: 'Barrowfields', ruin: 1 };

async function setUp(page) {
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('ROGUE', 'WREN'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(300);
}

/** A fresh job room with a chalker up the field and three of its pack nearer (held off their blows). */
async function stage(page) {
  await page.evaluate((p) => { const g = window.__game, j = g.jobs()[1]; g.startJob({ ...j, place: p, objective: 'rescue', rooms: 1, seed: 5, layout: 3 }); }, PLACE);
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    clearInterval(window.__hold);
    const g = window.__game, r = g.room, h = g.hero, base = JSON.parse(JSON.stringify(r.enemies.find((e) => e.kind === 'scrapper') || r.enemies[0]));
    for (const e of r.enemies) Object.assign(e, { x: 1.2, y: 1.2, act: 'dead', actT: 99, escaped: true });
    const at = { x: Math.round(r.map.w / 2), y: r.map.hero.y - 5 };
    Object.assign(h, { ...at, fx: 0, fy: -1, safeT: 0, chalk: 0, chalkedUntil: -9 });
    let id = Math.max(...r.enemies.map((e) => e.id)) + 1;
    window.__foes = [['chalker', 0.5, -5.2], [undefined, -2, -2.6], [undefined, 0.4, -3], [undefined, 2.2, -2.4]].map(([variant, dx, dy]) => {
      const hp = variant ? 28 : 36;
      const e = { ...JSON.parse(JSON.stringify(base)), id: id++, kind: 'scrapper', variant, x: h.x + dx, y: h.y + dy, home: { x: h.x + dx, y: h.y + dy }, hp, maxHp: hp, radius: 0.34, weight: 0.6, act: 'chase', attack: null, alert: true, respawns: false, escaped: false, name: undefined, bow: false, z: 0, feeding: false, pack: 1, cooldown: 99, rushTo: null, task: undefined };
      const l = Math.hypot(h.x - e.x, h.y - e.y) || 1;
      Object.assign(e, { fx: (h.x - e.x) / l, fy: (h.y - e.y) / l });
      r.enemies.push(e);
      return e;
    });
    r.rushes.live = [];
    r.rushes.due.clear();
    r.rushes.fought.clear();
    const step = r.step.bind(r);
    r.step = () => { if (!window.__pause) step(); };
    window.__hold = setInterval(() => (Object.assign(h, { ...at, fx: 0, fy: -1, hp: h.maxHp }), window.__foes.forEach((e) => (e.cooldown = 99))), 10);
  });
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const opts = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  for (const look of ['flat', '3d']) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url + '?look=' + look);
    await setUp(page);
    const shot = async (name) => {
      await page.evaluate(() => (window.__pause = true));
      await page.screenshot({ path: `${out}/${name}-phone-${look}.png` });
      await page.evaluate(() => (window.__pause = false));
    };
    await stage(page);
    // Three strokes on, the third just landed (white, the chalk hand up).
    await page.waitForFunction(() => { const h = window.__game.hero, t = window.__game.room.time; return (h.chalk ?? 0) >= 3 && t - h.chalkAt < 0.15; }, null, { timeout: 20000 });
    await shot('chalk-marking');
    const a = await page.evaluate(() => { const h = window.__game.hero; return `strokes ${h.chalk}`; });
    // The fifth: the pack turns on the hero (the flash, CHALKED, the sight at their feet).
    await page.waitForFunction(() => { const g = window.__game, h = g.hero, t = g.room.time; return (h.chalkedUntil ?? -9) > t && t - h.chalkAt > 0.12; }, null, { timeout: 20000 });
    await shot('chalk-turned');
    const b = await page.evaluate(() => { const g = window.__game, r = g.room; return `turned ${r.enemies.filter((e) => e.turnedOn === g.hero.id && e.turnedUntil > r.time).length}`; });
    console.log(look, a, b, errors.length ? errors.slice(0, 3) : 'no errors');
    await ctx.close();
  }
  await browser.close();
})();
