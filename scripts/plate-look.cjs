// The boss plate at the top (Kyle, 2026-11-06): the Doorkeepers (two bars) and Hempen (one) on a phone (390x844
// at 3x, touch) and laptops at 1280x800 and 1920x1080, with where the plate, the unit frame, the corner buttons and
// the tracker sit. Usage: node scripts/plate-look.cjs [url] [outdir] [look: flat | 3d]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4611/';
const out = process.argv[3] || 'shots';
const look = process.argv[4] || 'flat';
const SIZES = [
  { tag: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { tag: 'laptop1280', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  { tag: 'laptop1920', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
];

const rects = (page) => page.evaluate(() => {
  const r = (s) => { const el = document.querySelector(s); if (!el || el.hidden || !el.offsetWidth) return null; const b = el.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round); };
  const meet = (a, b) => a && b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const plate = r('#boss'), parts = { hud: r('#hud .unit'), corner: r('#corner'), banner: r('#banner'), tip: r('#tip') };
  const hits = Object.entries(parts).filter(([, v]) => meet(plate, v)).map(([k]) => k);
  return `plate ${JSON.stringify(plate)} "${document.getElementById('boss').textContent}" | ${Object.entries(parts).map(([k, v]) => k + ' ' + JSON.stringify(v)).join(' ')} | overlaps: ${hits.join(',') || 'none'}`;
});

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const s of SIZES) {
    const { tag, ...opts } = s;
    const ctx = await browser.newContext(opts), page = await ctx.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    // The barn: the pair awake at the back, the hero coming in.
    await page.goto(`${url}?hero=WARRIOR&barn=arena&look=${look}`);
    await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === 'THE GREAT BARN', null, { timeout: 30000 });
    await page.evaluate(() => { Object.assign(window.__game.hero, { x: 6, y: 9.4, fy: -1 }); for (const e of window.__game.room.enemies) if (e.boss) e.alert = true; });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const g = window.__game; g.hero.hp = g.hero.maxHp; for (const e of g.room.enemies) if (e.boss) Object.assign(e, { y: 4.2, x: e.name === 'LATCH' ? 4.4 : 7.6 }); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/plate-barn-${tag}-${look}.png` });
    console.log(tag, 'barn:', await rects(page));
    // Enraged: Latch dead, Hasp alone with burning eyes.
    await page.evaluate(() => { const r = window.__game.room, l = r.enemies.find((e) => e.name === 'LATCH'); Object.assign(l, { hp: 0, act: 'dead', actT: 0, attack: null }); });
    await page.waitForTimeout(2600);
    await page.evaluate(() => { const g = window.__game; g.hero.hp = g.hero.maxHp; });
    await page.screenshot({ path: `${out}/plate-enraged-${tag}-${look}.png` });
    console.log(tag, 'enraged:', await rects(page), await page.evaluate(() => window.__game.room.enemies.filter((e) => e.boss).map((e) => e.name + ' phase ' + e.boss.phase).join(', ')));
    // Hempen on its ground.
    await page.goto(`${url}?hero=WARRIOR&wood=1&look=${look}`);
    await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === "HANGMAN'S WOOD", null, { timeout: 30000 });
    await page.evaluate(() => {
      const g = window.__game, r = g.room, e = r.enemies.find((x) => x.boss);
      r.enemies = r.enemies.filter((x) => x.boss);
      Object.assign(e, { x: 62, y: 9, fx: 0, fy: 1, attack: null, act: 'chase', actT: 0, alert: true });
      Object.assign(g.hero, { x: 62, y: 12, fx: 0, fy: -1, hp: g.hero.maxHp });
    });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const h = window.__game.hero; h.hp = h.maxHp; });
    await page.screenshot({ path: `${out}/plate-hempen-${tag}-${look}.png` });
    console.log(tag, 'hempen:', await rects(page));
    console.log(tag, errors.length ? errors.slice(0, 3) : 'no errors');
    await ctx.close();
  }
  await browser.close();
})();
