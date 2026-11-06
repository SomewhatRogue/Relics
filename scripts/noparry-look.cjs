// Three phone shots for the no-parry change: a Warrior blocking a heavy (the yard's BLOCK THE HEAVY),
// a Ranger's controls (no guard button), and the class picker's Ranger card.
// Usage: node scripts/noparry-look.cjs [url] [outdir]  (build first; `npx vite preview --port 4428`).
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4428/';
const out = process.argv[3] || 'shots';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [], report = {};
  const open = async () => {
    const ctx = await browser.newContext(PHONE);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url);
    await page.waitForFunction(() => window.__game);
    return { ctx, page };
  };

  // 1. A Warrior blocking a heavy, in the yard's drill.
  {
    const { ctx, page } = await open();
    await page.evaluate(() => {
      const g = window.__game;
      g.create('WARRIOR', 'KYLE');
      if (g.mode === 'wood') g.skipWood();
      document.getElementById('title').hidden = true;
      window.__title.open = false;
      g.enterYard();
      g.practice({ k: 'drill', key: 'block' });
      const heavy = g.room.enemies.find((e) => e.variant === 'heavy');
      Object.assign(g.hero, { x: heavy.x, y: heavy.y + 1.5, fx: 0, fy: -1, safeT: 0 });
      Object.assign(heavy, { cooldown: 0.3 });
    });
    // Hold BLOCK down on the touch button (no lift), as a thumb would.
    const b = await page.locator('.tb.block').boundingBox();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
    // Wait for the heavy's swing to land on the guard, then shoot as the BLOCK shows.
    await page.waitForFunction(() => { const g = window.__game, h = g.hero; h.stamina = 100; return g.drill && /BLOCKED [1-9]/.test(g.drill.line); }, null, { timeout: 20000 }).catch(() => errors.push('no block landed'));
    await wait(90);
    await page.screenshot({ path: `${out}/noparry-warrior-block.png` });
    report.warrior = await page.evaluate(() => ({ line: window.__game.drill.line, blocking: window.__game.hero.blocking, hp: window.__game.hero.hp, guard: document.body.dataset.guard }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await ctx.close();
  }

  // 2. A Ranger's controls: no guard button.
  {
    const { ctx, page } = await open();
    await page.evaluate(() => {
      const g = window.__game;
      g.create('RANGER', 'WREN');
      if (g.mode === 'wood') g.skipWood();
      document.getElementById('title').hidden = true;
      window.__title.open = false;
      g.enterYard();
    });
    await wait(1500);
    await page.screenshot({ path: `${out}/noparry-ranger-controls.png` });
    report.ranger = await page.evaluate(() => {
      const el = document.querySelector('.tb.block'), r = el?.getBoundingClientRect();
      return { guard: document.body.dataset.guard, blockShown: !!el && getComputedStyle(el).display !== 'none' && !el.hidden && r.width > 0 && getComputedStyle(el).visibility !== 'hidden' };
    });
    await ctx.close();
  }

  // 3. The class picker's Ranger card.
  {
    const { ctx, page } = await open();
    await page.waitForSelector('[data-cls="RANGER"]', { timeout: 10000 }).catch(() => errors.push('no class picker'));
    await page.click('[data-cls="RANGER"]');
    await wait(600);
    await page.screenshot({ path: `${out}/noparry-ranger-card.png` });
    report.card = await page.evaluate(() => document.getElementById('title')?.innerText.replace(/\s+/g, ' ').slice(0, 600));
    await ctx.close();
  }
  console.log(JSON.stringify({ report, errors }, null, 1));
  await browser.close();
})();
