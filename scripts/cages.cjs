// Cages, phone and laptop, 2.5D and flat: a blow on a cage that holds (it shudders and flashes, sparks
// off the bars), then a false prisoner (forced for the picture): it lurches, tears open, and two goblins
// come out held a beat. Usage: node scripts/cages.cjs [url] [outdir] [looks, comma separated].
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4340/';
const out = process.argv[3] || 'shots';
const looks = (process.argv[4] || '3d,flat').split(',');

const cage = (id, x, y, hp) => ({ id, kind: 'cage', x, y, kvx: 0, kvy: 0, hp, radius: 0.55, weight: 99, lifted: false, lastBy: '', hitAt: -9, broken: false, respawnAt: -1, home: null, fadeAt: Infinity, spin: 0, z: 0 });

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    for (const look of looks) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      // The page's clock is Playwright's: paused for the pictures, stepped a frame at a time.
      await page.clock.install();
      await page.goto(url + '?look=' + look + '&day=0.5');
      await page.waitForFunction(() => window.__game);
      await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(300);
      await page.evaluate(async () => {
        const g = window.__game;
        g.startJob({ ...(await window.__villageJob(7)), objective: 'rescue' });
        g.room.enemies.length = 0;
        window.__keep = setInterval(() => { const h = window.__game.hero; h.hp = h.maxHp; h.safeT = 0; }, 16);
      });
      await page.waitForTimeout(400);
      // A cage just right of the hero, facing it.
      const at = await page.evaluate((c) => {
        const g = window.__game, r = g.room, h = g.hero, s = r.map.hero;
        Object.assign(h, { x: s.x, y: s.y - 1.5, fx: 1, fy: 0 });
        r.props.push({ ...c, x: s.x + 1.05, y: s.y - 1.5, fadeAt: Infinity });
        return { x: s.x, y: s.y, falseCages: r.falseCages };
      }, cage(9001, 0, 0, 400));
      await page.waitForTimeout(300);
      const swing = async () => (dev === 'phone' ? page.tap('.attack') : page.keyboard.press('j'));
      await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 200);
      /** Step the page a frame at a time until `fn` (run in the page) holds. */
      const until = async (fn, arg) => {
        for (let i = 0; i < 400; i++) {
          if (await page.evaluate(fn, arg)) return true;
          await page.clock.runFor(16);
        }
        return false;
      };
      const tear = (d) => { const r = window.__game.room, s = r.survivors.find((q) => q.tearAt !== undefined); return !!s && r.time >= s.tearAt + d; };
      // 1. A blow it holds: caught mid-shudder.
      await swing();
      await until(() => window.__game.room.props.some((p) => p.id === 9001 && window.__game.room.time - p.hitAt > 0.03 && window.__game.room.time - p.hitAt < 0.2));
      await page.screenshot({ path: `${out}/${dev}-${look}-1-cagehit.png` });
      // 2. The false prisoner: the next roll forced false, the cage on its last splinter.
      await page.clock.runFor(800);
      await page.evaluate(() => { const r = window.__game.room; r.cageRng.next = () => 0; r.props.find((p) => p.id === 9001).hp = 1; });
      await swing();
      await until(tear, -0.3);
      await page.screenshot({ path: `${out}/${dev}-${look}-2-lurch.png` });
      await until(tear, 0.06);
      await page.screenshot({ path: `${out}/${dev}-${look}-3-torn.png` });
      await until(tear, 0.4);
      await page.screenshot({ path: `${out}/${dev}-${look}-4-goblins.png` });
      const st = await page.evaluate(() => { const r = window.__game.room; return { goal: window.__game.goalText?.() ?? null, enemies: r.enemies.map((e) => [e.kind, e.act]), survivors: r.survivors.map((s) => [s.tearAt !== undefined, s.gone]) }; });
      console.log(dev, look, JSON.stringify(at), JSON.stringify(st), errors.length ? 'ERRORS ' + JSON.stringify(errors) : '');
      await ctx.close();
    }
  }
  await browser.close();
})();
