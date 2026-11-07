// The same six screens in each font pairing (fontchoice.ts), on a phone and a laptop, for choosing one:
// the town with someone talking, the job board's card, the trainer's tiles, an item card in the pack, a
// fight with words and numbers up, and the boss plate. Usage:
// node scripts/fonts-look.cjs [url] [outdir] [fonts: today,a,b,c] [screens]. Prints page errors.
const { chromium } = require('playwright');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:4571/';
const out = process.argv[3] || 'shots/fonts/raw';
const fonts = (process.argv[4] || 'today,a,b,c').split(',');
const only = process.argv[5] ? process.argv[5].split(',') : null;
const NOON = 2400000 * 700 + 1200000;
fs.mkdirSync(out, { recursive: true });

const job = (page) => page.evaluate(async () => {
  const g = window.__game, j = g.jobs()[1];
  g.startJob({ ...j, place: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 }, objective: 'hunt', boss: 'SKARN', rooms: 3, seed: 7 });
  await new Promise((r) => setTimeout(r, 120));
  const h = g.hero, r = g.room, e = r.enemies.find((e) => e.act !== 'dead');
  if (e) Object.assign(h, { x: e.x - 1.6, y: e.y + 0.6, fx: 1, fy: 0 });
  h.hp = Math.round(h.maxHp * 0.6);
});

const SCREENS = {
  async talk(page) { await page.evaluate(() => window.__openSpot('church')); await page.waitForTimeout(2500); },
  async board(page) {
    await page.evaluate(() => window.__openSpot('board'));
    await page.waitForTimeout(600);
    await page.evaluate(() => document.querySelector('#panel [data-open]')?.click());
    await page.waitForTimeout(600);
  },
  async trainer(page) {
    await page.evaluate(() => { const p = window.__game.profile; Object.assign(p, { level: 6, gold: 600, picks: 0 }); window.__openSpot('trainer'); });
    await page.waitForTimeout(600);
    await page.evaluate(() => document.querySelector('#panel [data-tab]:not([data-tab="knacks"])')?.click());
    await page.waitForTimeout(2200);
  },
  async item(page) {
    await page.evaluate(() => window.__pack.toggle(true));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__pack.pick('hand'));
    await page.waitForTimeout(500);
  },
  async fight(page) {
    await job(page);
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      const g = window.__game, h = g.hero, fx = window.__fx, es = g.room.enemies.filter((e) => e.act !== 'dead');
      const [a, b] = [es[0] ?? h, es[1] ?? es[0] ?? h];
      fx.on({ k: 'hit', x: a.x, y: a.y, n: 27, crit: true, heavy: true });
      fx.on({ k: 'hit', x: h.x, y: h.y, n: 12, on: 'hero' });
      fx.on({ k: 'guardbreak', x: b.x, y: b.y });
      fx.say(8 + h.x * 16, 8 + 3 * 16 + h.y * 16 - 46, 'The mill is quiet now. Mind the road home.', '#ffd27a', 3);
    });
    await page.waitForTimeout(160);
  },
  async boss(page) { await page.evaluate(() => Object.assign(window.__game.hero, { x: 6, y: 9.4, fy: -1 })); await page.waitForTimeout(1800); },
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const devs = [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]];
  for (const [dev, opts] of devs) for (const font of fonts) for (const [name, go] of Object.entries(SCREENS)) {
    if (only && !only.includes(name)) continue;
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url + `?hero=WARRIOR&font=${font}` + (name === 'boss' ? '&barn=arena' : ''));
    await page.waitForFunction(() => window.__game, null, { timeout: 30000 });
    if (name === 'boss') await page.waitForFunction(() => window.__game.room?.map.name === 'THE GREAT BARN', null, { timeout: 20000 }).catch(() => {});
    await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await go(page);
    await page.screenshot({ path: `${out}/${font}-${dev}-${name}.png` });
    console.log(dev, font, name, errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'ok');
    await ctx.close();
  }
  await browser.close();
})();
