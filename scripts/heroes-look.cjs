// The heroes for a look sheet. Usage: node scripts/heroes-look.cjs <url> <outdir> <tag> [art,game,phone]
// art:   every class and look drawn alone by the game's own drawHero (window.__heroArt): standing, walking
//        side on and away, mid-blow, and (if the build has it) the eye dial at -1, -0.5, 0, 0.5 and 1.
//        Saved as <outdir>/<tag>-art/<CLS>-<look>-<frame>.png at one scene pixel a pixel.
// game:  all fifteen in the training yard, walking and then mid-blow, FLAT and 2.5D (laptop page, 1x).
// phone: four phone shots: the Mage's class card, a mixed party in town (2.5D), a fight FLAT and 2.5D.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const [url = 'http://localhost:4417/', out = 'shots', tag = 'new', what = 'art,game,phone'] = process.argv.slice(2);
const CLS = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];
const save = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
const go = (look) => url + (url.includes('?') ? '&' : '?') + 'look=' + look;

// In the page: stop the room, clear the goblins, and line the fifteen up.
const LINEUP = (pose) => {
  const r = window.__room, me = r.heroes[0], CLS = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];
  r.advance = () => [];
  r.prev && r.prev.clear();
  r.enemies = [];
  const kits = { WARRIOR: 'sword', RANGER: 'longbow', ROGUE: 'daggers', MAGE: 'staff', HEALER: 'mace' };
  const x0 = me.x - 4, y0 = me.y - 2;
  r.heroes = [];
  CLS.forEach((c, i) => [0, 1, 2].forEach((l) => {
    const h = { ...me, id: 'L' + i + l, tag: '', weapon: kits[c], look: l, x: x0 + i * 2, y: y0 + l * 1.6, fx: 1, fy: 0.15, moving: pose === 'walk', act: 'idle', actT: 0, blocking: false, primed: false, hp: 100 };
    if (pose === 'attack') Object.assign(h, { act: 'attack', actT: 0.2, combo: 0 });
    r.heroes.push(h);
  }));
  r.heroes[0].id = me.id;
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const open = async (opts, u) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(u);
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    return { ctx, page };
  };
  const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  if (what.includes('art')) {
    const dir = path.join(out, tag + '-art');
    fs.mkdirSync(dir, { recursive: true });
    const { ctx, page } = await open({ viewport: { width: 800, height: 600 } }, url + (url.includes('?') ? '&' : '?') + 'hero=WARRIOR');
    const frames = {
      stand: { hero: { fx: 0, fy: 1 }, now: 1.0 },
      walk: { hero: { fx: 1, fy: 0.1, moving: true }, now: 1.07 },
      walk2: { hero: { fx: 1, fy: 0.1, moving: true }, now: 1.33 },
      away: { hero: { fx: 0.1, fy: -1, moving: true }, now: 1.2 },
      attack: { hero: { fx: 1, fy: 0.2 }, swing: 0.5, now: 1.0 },
    };
    for (const c of CLS) for (const l of [0, 1, 2]) for (const [f, s] of Object.entries(frames)) {
      save(path.join(dir, `${c}-${l}-${f}.png`), await page.evaluate(([c, l, s]) => window.__heroArt({ cls: c, look: l, ...s }, 40, 40), [c, l, s]));
    }
    for (const c of CLS) for (const d of [-1, -0.5, 0, 0.5, 1]) {
      save(path.join(dir, `${c}-0-dial${d}.png`), await page.evaluate(([c, d]) => window.__heroArt({ cls: c, look: 0, now: 2.3, hero: { fx: 0, fy: 1, dial: d } }, 40, 40), [c, d]));
    }
    await ctx.close();
  }
  if (what.includes('game')) {
    for (const look of ['flat', '3d']) {
      const { ctx, page } = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }, go(look) + '&hero=WARRIOR');
      await page.evaluate(() => window.__game.enterYard());
      await page.waitForTimeout(800);
      for (const pose of ['walk', 'attack']) {
        await page.evaluate(LINEUP, pose);
        await page.waitForTimeout(pose === 'attack' ? 30 : 500);
        await page.screenshot({ path: path.join(out, `${tag}-yard-${pose}-${look}.png`) });
      }
      await ctx.close();
    }
  }
  if (what.includes('phone')) {
    for (const look of ['flat', '3d']) {
      // The class pick: the grid, then a class card with its three looks and the live preview (once).
      if (look === 'flat') {
        const { ctx, page } = await open(PHONE, go(look));
        await page.evaluate(() => { try { window.__title.show(); } catch (e) {} });
        await page.waitForTimeout(400);
        for (const c of ['MAGE']) {
          const b = page.locator(`[data-cls="${c}"]`);
          if (await b.count()) {
            await b.first().tap();
            await page.waitForTimeout(1600);
            await page.screenshot({ path: path.join(out, `${tag}-phone-pick-${c}.png`) });
            const back = page.locator('[data-pick]');
            if (await back.count()) await back.first().tap(), await page.waitForTimeout(200);
          }
        }
        await ctx.close();
      }
      // A mixed party in town: one of each class, a different look each, standing and walking about (2.5D).
      if (look === '3d') {
        const { ctx, page } = await open(PHONE, go(look) + '&hero=WARRIOR');
        await page.waitForTimeout(600);
        await page.evaluate(() => {
          const r = window.__room, me = r.heroes[0], kits = ['longbow', 'daggers', 'staff', 'mace'];
          kits.forEach((w, i) => r.heroes.push({ ...me, id: 'p' + i, tag: ['MAEVE', 'TAM', 'VELL', 'ODA'][i], weapon: w, look: (i + 1) % 3, x: me.x + (i % 2 ? 1.6 : -1.6) * (1 + (i >> 1)), y: me.y + (i >> 1 ? 1.2 : -1), fx: i % 2 ? -1 : 1, fy: 0.2, moving: i % 2 === 0, act: 'idle', actT: 0 }));
          window.__party = r.heroes.map((h) => h.id);
        });
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(out, `${tag}-phone-town-${look}.png`) });
        await ctx.close();
      }
      // A fight in the yard: a Warrior and friends against the goblins there, a few seconds in.
      {
        const { ctx, page } = await open(PHONE, go(look) + '&hero=WARRIOR');
        await page.evaluate(() => window.__game.enterYard());
        await page.waitForTimeout(500);
        await page.evaluate(() => {
          const r = window.__room, me = r.heroes[0];
          const add = (id, w, look, dx, dy, dial) => r.heroes.push({ ...me, id, tag: id.toUpperCase(), weapon: w, look, x: me.x + dx, y: me.y + dy, act: 'idle', actT: 0, dial });
          add('ash', 'staff', 1, -1.5, 0.4, 0.8);
          add('rook', 'daggers', 2, 1.6, 0.2, -0.9);
          add('ida', 'censer', 0, 0.2, 1.4, 0);
          Object.assign(me, { y: me.y - 1.2 });
        });
        await page.waitForTimeout(2200);
        await page.screenshot({ path: path.join(out, `${tag}-phone-fight-${look}.png`) });
        await ctx.close();
      }
    }
  }
  console.log(tag, 'errors', JSON.stringify(errors.slice(0, 8)));
  await browser.close();
})();
