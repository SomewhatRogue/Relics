// The trainer's screen, every tab and a tile opened, on a phone and two laptops (from upgradeui-look.cjs,
// 2026-11-06, for "none of the stuff fits well on the page"). Prints what spills: a head that wraps, a
// tile or title wider than its box, a button under 44px, the page scrolling sideways.
// Usage: node scripts/trainfit-look.cjs [url] [outdir] [tag]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4591/';
const out = process.argv[3] || 'shots';
const tag = process.argv[4] || 'after';
const VIEWS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'laptop', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  { name: 'wide', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
];

const measure = () => {
  const r = (e) => e.getBoundingClientRect();
  const lines = (e) => (e ? Math.round(r(e).height / parseFloat(getComputedStyle(e).lineHeight || '16')) : 0);
  const spill = [...document.querySelectorAll('#panel .up-tile, #panel .up-tile > *, #panel .up-th, #panel .up-th > *, #panel .up-stats, #panel .up-tabs button, #panel .up-det *')]
    .filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline')
    .map((e) => `${e.className || e.tagName} "${e.textContent.trim().slice(0, 20)}" ${e.scrollWidth}>${e.clientWidth}`);
  const card = document.querySelector('#panel .card');
  const st = document.querySelector('#panel .up-stats');
  const tiles = [...document.querySelectorAll('#panel .up-tile')].filter((e) => e.offsetParent);
  const sizes = {};
  tiles.forEach((t) => { const k = t.closest('.up-track')?.dataset.track; (sizes[k] ||= []).push(`${Math.round(r(t).width)}x${Math.round(r(t).height)}`); });
  return {
    head: st ? Math.round(r(st).height) : 0,
    level: lines(st?.querySelector('b')), gold: lines(st?.querySelector('.up-gold')), picks: lines(st?.querySelector('.up-picks')),
    card: card ? `${Math.round(r(card).width)} wide, scroll ${card.scrollWidth}>${card.clientWidth}` : '',
    page: document.documentElement.scrollWidth,
    small: [...document.querySelectorAll('#panel button')].filter((b) => b.offsetParent && r(b).height < 44).map((b) => b.textContent.trim().slice(0, 16) + ' ' + Math.round(r(b).height)),
    spill, sizes,
  };
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const v of VIEWS) {
    const { name, ...opts } = v;
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url + '?look=flat');
    await page.waitForFunction(() => window.__game);
    await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.__panel.hide();
      const p = window.__game.profile;
      Object.assign(p, { level: 7, xp: Math.max(p.xp, 900), gold: 640, learned: ['skill'], taught: ['horn'], skill: 'horn', picks: 1, perks: ['w_wide'], drills: { power: 2, health: 1, technique: 1 } });
      window.__game.relicsChanged();
      localStorage.setItem('relic.upgrades.tab', 'skills');
      window.__openSpot('trainer', 0);
    });
    await page.waitForTimeout(2500);
    const click = (sel) => (v.hasTouch ? page.tap(sel) : page.click(sel));
    for (const tab of ['skills', 'moves', 'ranks', 'knacks']) {
      await click(`#panel [data-tab="${tab}"]`);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/${tag}-${name}-${tab}.png` });
      console.log(name, tab, JSON.stringify(await page.evaluate(measure)));
    }
    await click('#panel [data-tab="ranks"]');
    await click('#panel [data-tile="drill:power"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${tag}-${name}-detail.png` });
    console.log(name, 'detail', JSON.stringify(await page.evaluate(measure)));
    console.log(name, 'errors', JSON.stringify(errors));
    await ctx.close();
  }
  await browser.close();
})();
