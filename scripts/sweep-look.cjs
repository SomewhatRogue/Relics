// The graphics sweep's yardstick (docs/design/graphics-overhaul.md, slice 0): eight fixed spots, both views, a phone
// and a laptop, into shots/sweep/<tag>/ with an index.html that lays them out as one sheet. Shoot a tag before a
// change and another after, and open the two sheets side by side.
// node scripts/sweep-look.cjs [tag] [url] [extra switches]     e.g.  node scripts/sweep-look.cjs after http://localhost:4173/
// ONLY=townnight,cut for some scenes; CHANNEL=chrome to drive an installed Chrome in place of Playwright's own.
const fs = require('fs');
const { chromium } = require('playwright');
const [tag = 'now', url = 'http://localhost:4173/', extra = ''] = process.argv.slice(2);
// Where the hero stands in town: the square, below the Lantern.
const SQUARE = [29.5, 30];
const WOOD = { name: 'Gallows Wood', kind: 'forest', region: 'Barrowfields', ruin: 1 };
const SCENES = {
  townday: { q: 'hero=WARRIOR&day=0.5', note: 'Wickhold, day', at: SQUARE },
  townnight: { q: 'hero=WARRIOR&day=0.9', note: 'Wickhold, night', at: SQUARE },
  village: { q: 'hero=WARRIOR', note: 'A village at dusk', job: { time: 'dusk', place: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 }, objective: 'rescue', rooms: 2, seed: 7 } },
  woodfog: { q: 'hero=WARRIOR', note: 'A wood by day, in fog', job: { time: 'day', place: WOOD, objective: 'hunt', rooms: 1, seed: 11 }, mid: true },
  woodnight: { q: 'hero=WARRIOR', note: 'A wood at night', job: { time: 'night', place: WOOD, objective: 'hunt', rooms: 1, seed: 11 }, mid: true },
  cut: { q: 'hero=WARRIOR&cut=1', note: 'The Open Cut' },
  rat: { q: 'hero=WARRIOR&day=0.9', note: 'The Drowned Rat', door: 'tavern' },
  spells: { q: 'hero=MAGE', note: 'A Mage in a fight', job: { time: 'dusk', place: WOOD, objective: 'hunt', rooms: 1, seed: 11 }, mid: true, fight: true },
};
const DEVICES = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 } };
// One hour of the world's clock for every run, so a job's sky is the same before and after.
const NOON = 2400000 * 700 + 1200000;
const only = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(SCENES);

/** Set the scene up as a player would find it; the fight is held still once its spells are out. */
function stage(s) {
  const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  if (g.profile.errands) g.profile.errands.told = true;
  return (async () => {
    if (s.job) g.startJob({ ...g.jobs()[1], twist: 'none', ...s.job });
    // In town: a new hero's arrival scene (client/runner.ts) ends when they leave the street, so in a door and out again.
    if (s.at) (g.enter(g.room.map.blocks.find((b) => b.door === 'tavern')), await wait(300), g.leave());
    if (s.door) (g.outside && g.leave(), g.enter(g.room.map.blocks.find((b) => b.door === s.door)));
    await wait(400);
    const h = g.hero, m = g.room.map;
    if (s.mid) Object.assign(h, { x: m.w / 2, y: m.h / 2 });
    // (Stood on the level under them: shared/arena.ts levelAt.)
    if (s.at) Object.assign(h, { x: s.at[0], y: s.at[1], z: (m.ledges ?? []).reduce((v, l) => (s.at[0] > l.x && s.at[0] < l.x + l.w && s.at[1] > l.y && s.at[1] < l.y + l.h ? Math.max(v, l.lv ?? 1) : v), 0) });
    g.cutFocus = () => ({ x: h.x, y: h.y - 0.4, snap: true });
    if (!s.fight) return;
    Object.assign(h, { hp: 9999, maxHp: 9999, fx: 1, fy: 0 });
    g.room.enemies.filter((e) => e.act !== 'dead').slice(0, 6).forEach((e, i) => Object.assign(e, { x: h.x + 2.4 + (i % 3) * 1.1, y: h.y - 1.2 + Math.floor(i / 3) * 1.6, alert: true }));
    const key = (k) => (document.body.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), setTimeout(() => document.body.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true })), 60));
    for (const [k, ms] of [['e', 450], ['j', 300], ['r', 450]]) (key(k), await wait(ms));
    g.step = () => [];
  })();
}

(async () => {
  const dir = `shots/sweep/${tag}`, errors = [];
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.CHANNEL || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const name of only) for (const [dev, opts] of Object.entries(DEVICES)) for (const look of ['3d', 'flat']) {
    const ctx = await browser.newContext(opts), page = await ctx.newPage(), s = SCENES[name];
    page.on('pageerror', (e) => errors.push(`${name} ${dev} ${look}: ${String(e).slice(0, 200)}`));
    await page.addInitScript((ms) => { const t0 = performance.now(); Date.now = () => ms + (performance.now() - t0); }, NOON);
    await page.goto(`${url}${url.includes('?') ? '&' : '?'}${s.q}&look=${look}${extra ? '&' + extra : ''}`);
    await page.waitForFunction(() => window.__game && window.__game.room);
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: '#caption { display: none !important; }' });
    for (let i = 0; i < 4; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(200);
    await page.evaluate(stage, s);
    await page.waitForTimeout(s.fight ? 400 : 3000);
    await page.screenshot({ path: `${dir}/${name}-${dev}-${look}.png` });
    await ctx.close();
  }
  await browser.close();
  // The sheet: a row a scene, the 2.5D view first (it is the look; flat is the fallback).
  const cell = (n, d, l) => `<figure><img loading="lazy" src="${n}-${d}-${l}.png"><figcaption>${d}, ${l === '3d' ? '2.5D' : 'flat'}</figcaption></figure>`;
  // (Every scene shot under this tag so far, so ONLY can reshoot a few without losing the rest of the sheet.)
  const have = Object.keys(SCENES).filter((n) => fs.existsSync(`${dir}/${n}-laptop-3d.png`));
  const rows = have.map((n) => `<h2>${SCENES[n].note}</h2><div class="row">${['laptop', 'phone'].map((d) => ['3d', 'flat'].map((l) => cell(n, d, l)).join('')).join('')}</div>`).join('');
  fs.writeFileSync(`${dir}/index.html`, `<!doctype html><meta charset="utf-8"><title>Relic sweep: ${tag}</title><style>body{background:#0d0e11;color:#f0e6cc;font:16px system-ui;margin:16px}h2{font-size:18px;margin:20px 0 8px}.row{display:grid;grid-template-columns:2fr 2fr 1fr 1fr;gap:8px;align-items:start}figure{margin:0}img{width:100%;display:block}figcaption{color:#b8a47c;font-size:13px}</style><h1>Relic sweep: ${tag}${extra ? ' (' + extra + ')' : ''}</h1>${rows}`);
  console.log(`${dir}/index.html`, 'errors', JSON.stringify(errors));
})();
