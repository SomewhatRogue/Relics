// The movement ladder, seen: the trainer's ladder section (a Mage on a phone, a Warrior on a laptop), the
// Warrior's TAUNT button on a phone and its roar's ring, a Rogue's caltrops, a Mage's BLINK BURST, and a
// Ranger's TWO SNARES, each fired for real in the yard (the dodge pressed) and the room held still for
// the picture. Usage: node scripts/ladder-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4398/';
const out = process.argv[3] || 'shots';
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const LAPTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const ORDER = ['WARRIOR', 'RANGER', 'ROGUE', 'MAGE', 'HEALER'];

/** A fresh page with a hero of `cls` at `level`, `drills`, past the wood. */
async function start(browser, opts, cls, drills, level = 10) {
  const ctx = await browser.newContext(opts), page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('relic.trainer.open', JSON.stringify({ skills: false, craft: true, ladder: true, ranks: false })));
  await page.goto(url + '?look=flat');
  await page.waitForFunction(() => window.__game);
  await page.evaluate(([cls, drills, level]) => {
    const g = window.__game;
    g.create(cls, 'LOOK');
    document.getElementById('title').hidden = true;
    window.__title.open = false;
    Object.assign(g.profile, { level, gold: 3000, drills, learned: ['skill', 'leave'] });
    g.hero.drills = g.profile.drills;
  }, [cls, drills, level]);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  return { ctx, page, errors };
}

/** Into the yard, goblins held and set round the hero. */
async function yard(page, spots) {
  await page.evaluate(() => window.__game.enterYard());
  await page.waitForTimeout(700);
  await page.evaluate((spots) => {
    const g = window.__game, r = g.room, h = g.hero;
    g.hero.drills = g.profile.drills;
    Object.assign(h, { x: 9, y: 9, fx: 0, fy: -1, stamina: 100 });
    r.enemies.forEach((e, i) => { e.cooldown = 99; e.attack = null; const s = spots[i % spots.length]; if (s) Object.assign(e, { x: s[0], y: s[1] }); });
  }, spots);
}

const freeze = (page) => page.evaluate(() => { window.__game.step = () => []; });

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const say = (name, errors) => console.log(name, errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'ok');

  // The trainer, a Mage on a phone: PRIMED SPELLS learned, ATTUNED next; BLINK BURST learned, BLINK THROUGH next, PERFECT BLINK at 15.
  for (const [dev, opts, cls, drills] of [['phone', PHONE, 'MAGE', { technique: 1, ladder: 1 }], ['laptop', LAPTOP, 'WARRIOR', { technique: 2, ladder: 1 }]]) {
    const { ctx, page, errors } = await start(browser, opts, cls, drills);
    await page.evaluate((i) => window.__openSpot('trainer', i), ORDER.indexOf(cls));
    await page.waitForTimeout(400);
    await page.evaluate(() => { const s = document.querySelector('[data-sec="ladder"]'); s && s.scrollIntoView({ block: 'start' }); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/${dev}-trainer-ladder.png` });
    say(`${dev} trainer`, errors);
    await ctx.close();
  }

  // The Warrior's TAUNT on a phone: the button in the dodge's place, then pressed (the roar's ring at its reach).
  {
    const { ctx, page, errors } = await start(browser, PHONE, 'WARRIOR', { ladder: 3 });
    await yard(page, [[11.5, 7.5], [6.5, 10.5], [12.5, 11.5], [9, 13.6]]);
    await page.screenshot({ path: `${out}/phone-taunt-button.png` });
    await page.tap('.tb.roll');
    await page.waitForTimeout(120);
    await freeze(page);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/phone-taunt-roar.png` });
    console.log('taunted', await page.evaluate(() => window.__room.enemies.filter((e) => e.tauntBy).length));
    say('phone taunt', errors);
    await ctx.close();
  }

  // A Rogue's caltrops, a Mage's BLINK BURST, a Ranger's TWO SNARES, on a laptop (SPACE, D held).
  for (const [cls, drills, name] of [['ROGUE', { ladder: 1 }, 'caltrops'], ['MAGE', { ladder: 1 }, 'blinkburst'], ['RANGER', { ladder: 2 }, 'twosnares']]) {
    const { ctx, page, errors } = await start(browser, LAPTOP, cls, drills);
    // (Goblins on the spot would spring the snares at once: they stand off for that one.)
    const spots = { caltrops: [[7.2, 10.4], [10.8, 7.6], [13, 6], [5, 12]], blinkburst: [[8.6, 9.6], [9.6, 8.4], [13, 6], [5, 12]], twosnares: [[12.5, 6], [5.5, 12], [13, 11.5], [5, 6]] }[name];
    await yard(page, spots);
    await page.evaluate(() => { const g = window.__game; g.hero.learned = g.profile.learned; });
    await page.keyboard.down('d');
    await page.keyboard.press(' ');
    await page.waitForTimeout(name === 'blinkburst' ? 60 : 250);
    await page.keyboard.up('d');
    await freeze(page);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/laptop-${name}.png` });
    console.log(name, await page.evaluate(() => JSON.stringify({ zones: window.__room.zones.map((z) => z.kind), snares: window.__room.snares.length })));
    say(`laptop ${name}`, errors);
    await ctx.close();
  }
  await browser.close();
})();
