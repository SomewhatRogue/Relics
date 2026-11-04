// The UI on a phone and a laptop, flat and 2.5D: town, a fight on a job (hurt, a skill cooling), the pack,
// a panel (the job board), someone talking, and the gear box. Usage:
// node scripts/ui-look.cjs [url] [outdir] [only,these]. Prints page errors.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4290/';
const out = process.argv[3] || 'shots';
const only = process.argv[4] ? process.argv[4].split(',') : null;
const NOON = 2400000 * 700 + 1200000;

const job = (page, cls) => page.evaluate(async (cls) => {
  const g = window.__game, j = g.jobs()[1];
  g.startJob({ ...j, place: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 }, objective: 'hunt', boss: 'SKARN', rooms: 3, seed: 7 });
  await new Promise((r) => setTimeout(r, 120));
  const h = g.hero, r = g.room, e = r.enemies.find((e) => e.act !== 'dead');
  if (e) Object.assign(h, { x: e.x - 1.6, y: e.y + 0.6, fx: 1, fy: 0 });
  h.hp = Math.round(h.maxHp * 0.42);
  h.stamina = 55;
  h.belt = ['bitter', 'oil', 'frost'];
  if (cls === 'WARRIOR') h.relicReady[h.relics[0]] = r.time + 4.2;
}, cls);

const SCENES = {
  async town(page) { await page.evaluate(() => Object.assign(window.__game.hero, { x: 31, y: 21 })); await page.waitForTimeout(700); },
  async fight(page) { await job(page, 'WARRIOR'); await page.waitForTimeout(1500); },
  async mage(page) { await job(page, 'MAGE'); await page.waitForTimeout(1200); },
  async pack(page) { await job(page, 'WARRIOR'); await page.waitForTimeout(300); await page.evaluate(() => window.__pack.toggle(true)); await page.waitForTimeout(300); },
  async board(page) { await page.evaluate(() => window.__openSpot('board')); await page.waitForTimeout(1500); },
  async talk(page) { await page.evaluate(() => window.__openSpot('church')); await page.waitForTimeout(2500); },
  async options(page) { await page.evaluate(() => document.getElementById('opts').click()); await page.waitForTimeout(300); },
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const devs = [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]];
  for (const [dev, opts] of devs) for (const look of ['flat', '3d']) for (const [name, go] of Object.entries(SCENES)) {
    if (only && !only.includes(name) && !only.includes(`${dev}-${look}-${name}`)) continue;
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const cls = name === 'mage' ? 'MAGE' : 'WARRIOR';
    await page.goto(url + `?hero=${cls}` + (look === '3d' ? '&look=3d' : '&look=flat'));
    await page.waitForFunction(() => window.__game);
    await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
    await page.waitForTimeout(400);
    await go(page);
    await page.screenshot({ path: `${out}/${dev}-${look}-${name}.png` });
    console.log(dev, look, name, errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'ok');
    await ctx.close();
  }
  await browser.close();
})();
