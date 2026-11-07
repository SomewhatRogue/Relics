// The statue in Lantern Square and the Roll's two walls (2026-11-06): the walls of fame and shame filled with
// long names and big numbers on a phone and two laptops (prints anything that spills, wraps or is under 44px),
// the commission panel at the public works, and the plinth in the square, empty and taken, FLAT and 2.5D.
// Usage: node scripts/statue-look.cjs [url] [outdir] [tag] [walls|statue|all]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4601/';
const out = process.argv[3] || 'shots/statue';
const tag = process.argv[4] || 'after';
const only = process.argv[5] || 'all';
require('fs').mkdirSync(out, { recursive: true });
const VIEWS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'laptop', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  { name: 'wide', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
];
const NAMES = ['WWWWWWWWWWWW', 'BARTHOLOMEW', 'MMMMMMMMMMMM', 'ISOLT', 'AB', 'GRIMWALD THE', 'KYLE', 'SOMEWHATROGU', 'OSWIN', 'TAM'];
const CLS = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];

const measure = () => {
  const r = (e) => e.getBoundingClientRect();
  const spill = [...document.querySelectorAll('#panel .card *')]
    .filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1 && !['inline', 'contents'].includes(getComputedStyle(e).display) && getComputedStyle(e).textOverflow !== 'ellipsis')
    .map((e) => `${e.className || e.tagName} "${e.textContent.trim().slice(0, 18)}" ${e.scrollWidth}>${e.clientWidth}`);
  const wraps = [...document.querySelectorAll('#panel h2, #panel .rcard h4, #panel .rtabs button, #panel .rcard li, #panel .step b, #panel .step em')]
    .filter((e) => e.offsetParent && r(e).height > parseFloat(getComputedStyle(e).lineHeight || '18') * 1.6).map((e) => `${e.tagName} "${e.textContent.trim().slice(0, 18)}" ${Math.round(r(e).height)}`);
  const lis = [...document.querySelectorAll('#panel .rcard li')].filter((e) => e.offsetParent).map((e) => Math.round(r(e).height));
  const nums = [...document.querySelectorAll('#panel .rcard li em')].filter((e) => e.offsetParent).map((e) => Math.round(r(e).right));
  const steps = [...document.querySelectorAll('#panel .rcard')].filter((e) => e.offsetParent).slice(0, 1).flatMap((c) => [...c.querySelectorAll('.step')].map((s) => Math.round(r(s).width)));
  return {
    card: (() => { const c = document.querySelector('#panel .card'); return c ? `${Math.round(r(c).width)} wide, scroll ${c.scrollWidth}>${c.clientWidth}` : ''; })(),
    page: document.documentElement.scrollWidth, row: [...new Set(lis)], numRight: [...new Set(nums)], steps,
    small: [...document.querySelectorAll('#panel button')].filter((b) => b.offsetParent && r(b).height < 44).map((b) => b.textContent.trim().slice(0, 16) + ' ' + Math.round(r(b).height)),
    spill, wraps,
  };
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const v of VIEWS) {
    const { name, ...opts } = v;
    for (const look of only === 'walls' ? ['flat'] : ['flat', '3d']) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(url + '?look=' + look);
      await page.waitForFunction(() => window.__game);
      await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(500);
      const click = (sel) => (v.hasTouch ? page.tap(sel) : page.click(sel));
      if (look === 'flat' && only !== 'statue') {
        // A full Roll, as the world would send it: ten a tally, long names, big numbers, me among them.
        await page.evaluate(([NAMES, CLS]) => {
          const g = window.__game, me = g.profile, board = {};
          for (const k of ['jobs', 'saved', 'kills', 'given', 'dens', 'butchers', 'gold', 'raised', 'falls', 'carried', 'teamkills', 'rescueHits', 'rescueKills'])
            board[k] = NAMES.map((n, i) => ({ id: i === 6 ? me.id : 'h' + i, name: n, cls: CLS[i % 5], n: Math.round(98765 / (i + 1)) }));
          g.link.online = true, g.link.board = board, g.link.refresh = async () => {};
          window.__panel.hide();
          window.__openSpot('roll', 0);
        }, [NAMES, CLS]);
        for (const side of ['brave', 'unlucky']) {
          await click(`#panel .rtabs [data-side="${side}"]`);
          await page.waitForTimeout(1200);
          await page.screenshot({ path: `${out}/${tag}-walls-${name}-${side}.png` });
          console.log(name, side, JSON.stringify(await page.evaluate(measure)));
        }
        await page.evaluate(() => (window.__game.link.online = false));
      }
      if (only !== 'walls' && (name !== 'wide' || look === 'flat')) {
        // The square: the empty plinth, then the commission panel, then a statue up.
        await page.evaluate(() => { window.__panel.hide(); Object.assign(window.__game.hero, { x: 31.8, y: 23.6, fx: 0, fy: -1 }); });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${out}/${tag}-square-empty-${look}-${name}.png` });
        if (look === 'flat') {
          // Not given the town enough yet (tuning STATUE_GIVEN): Judd says how much more, and there's nothing to bid with.
          await page.evaluate(() => { window.__game.profile.gold = 1500; window.__game.profile.stats.given = 250; window.__openSpot('works', 0); });
          await page.waitForTimeout(400);
          await page.evaluate(() => [...document.querySelectorAll('#panel .buttons button')].find((b) => b.textContent === 'THE STATUE').click());
          await page.waitForTimeout(2500);
          await page.screenshot({ path: `${out}/${tag}-commission-gate-${name}.png` });
          console.log(name, 'gate', JSON.stringify(await page.evaluate(measure)));
          await page.evaluate(() => { window.__game.profile.stats.given = 1000; window.__openSpot('works', 0); });
          await page.waitForTimeout(400);
          await page.evaluate(() => [...document.querySelectorAll('#panel .buttons button')].find((b) => b.textContent === 'THE STATUE').click());
          await page.waitForTimeout(1500);
          await page.screenshot({ path: `${out}/${tag}-commission-first-${name}.png` });
          console.log(name, 'commission', JSON.stringify(await page.evaluate(measure)));
          await click('#panel .buttons button.primary');
          await page.waitForTimeout(300);
        } else await page.evaluate(() => { window.__game.profile.gold = 1500; });
        // A rival's statue up (as the world would send it), and the panel to take it.
        await page.evaluate(() => {
          const g = window.__game, w = g.world;
          if (!w.statue) w.statue = { by: { id: g.profile.id, name: g.profile.name, w: g.profile.weapon, l: 0 }, price: 1000, n: 1, past: [] };
          g.syncWorld({ ...w, statue: { by: { id: 'hrival01', name: 'GRIMWALD THE', w: 'longbow', l: 2 }, price: 1450, n: w.statue.n + 1, past: [] } });
          window.__panel.hide();
        });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${out}/${tag}-square-statue-${look}-${name}.png` });
        if (look === 'flat') {
          await page.evaluate(() => { window.__game.profile.gold = 2600; window.__openSpot('works', 0); });
          await page.waitForTimeout(400);
          await page.evaluate(() => [...document.querySelectorAll('#panel .buttons button')].find((b) => b.textContent === 'THE STATUE').click());
          await page.waitForTimeout(1500);
          await click('#panel .st-quick [data-add="100"]');
          await page.waitForTimeout(1200);
          await page.screenshot({ path: `${out}/${tag}-commission-bid-${name}.png` });
          console.log(name, 'bid', JSON.stringify(await page.evaluate(measure)));
        }
      }
      console.log(name, look, 'errors', JSON.stringify(errors));
      await ctx.close();
    }
  }
  await browser.close();
})();
