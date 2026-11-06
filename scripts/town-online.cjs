// The shared town end to end: two players in their own browsers (one phone, one laptop), each
// connected to the relay on a different instance. Each should see the other walk about Wickhold,
// a third arriving should be seen by both, and someone leaving town should vanish for the rest.
// Usage: node scripts/town-online.cjs   (builds with VITE_ONLINE, serves on 8790; JSON report)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
require('fs').mkdirSync(path.join(__dirname, '../shots/ratgames'), { recursive: true });
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT) || 8790;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const report = { ok: false, steps: [], errors: [] };
  execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    if (await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/`, (res) => (res.resume(), r(true))).on('error', () => r(false)))) break;
    await wait(200);
  }
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (name, cls, opts) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => report.errors.push(`${name}: ${e}`));
    await page.goto(`http://127.0.0.1:${PORT}/${process.env.LOOK ? '?look=' + process.env.LOOK : ''}`);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    return { name, ctx, page };
  };
  const sees = (p, who, ms = 6000) => p.page.waitForFunction((who) => window.__town().here.some((h) => h.name === who), who, { timeout: ms }).then(() => true, () => false);
  const step = (s, ok) => (report.steps.push({ s, ok }), ok);
  try {
    const kyle = await open('KYLE', 'RANGER', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const sam = await open('SAM', 'WARRIOR', { viewport: { width: 1280, height: 800 } });
    step('Kyle sees Sam', await sees(kyle, 'SAM'));
    step('Sam sees Kyle', await sees(sam, 'KYLE'));
    // Sam walks: Kyle should see Sam move.
    const before = await kyle.page.evaluate(() => window.__town().here.find((h) => h.name === 'SAM'));
    await sam.page.keyboard.down('d');
    await wait(900);
    await sam.page.keyboard.up('d');
    await wait(700);
    const after = await kyle.page.evaluate(() => window.__town().here.find((h) => h.name === 'SAM'));
    const samAt = await sam.page.evaluate(() => ({ x: window.__game.hero.x, y: window.__game.hero.y }));
    step(`Sam walked (${before?.x.toFixed(2)} to ${after?.x.toFixed(2)}, really at ${samAt.x.toFixed(2)})`, !!after && after.x > before.x + 0.5 && Math.abs(after.x - samAt.x) < 0.3);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/town-online-phone.png') });
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/town-online-laptop.png') });
    const ava = await open('AVA', 'MAGE', { viewport: { width: 1280, height: 800 } });
    step('A third arrives: Kyle sees Ava', await sees(kyle, 'AVA'));
    step('Ava sees both', (await sees(ava, 'KYLE')) && (await sees(ava, 'SAM')));
    // The town's pastimes (shared/pastimes.ts): Sam sits down to fish and Ava steps up to the butts.
    // Each says so once and then nothing while they play; Kyle sees them parked there at it.
    const sends = (p) => p.page.evaluate(() => window.__town().sends);
    const parked = (p, who, park) => p.page.waitForFunction(([who, park]) => window.__town().here.some((h) => h.name === who && h.park === park), [who, park], { timeout: 8000 }).then(() => true, () => false);
    const samBefore = await sends(sam), avaBefore = await sends(ava);
    await sam.page.evaluate(() => window.__pastime.fish());
    await ava.page.evaluate(() => window.__pastime.range());
    step('Kyle sees Sam parked fishing at the millpond', await parked(kyle, 'SAM', 'fish'));
    step('Kyle sees Ava parked at the butts', await parked(kyle, 'AVA', 'range'));
    const samStart = await sends(sam), avaStart = await sends(ava);
    // Sam casts and waits; Ava shoots: eight seconds of play, not a word to the town from either.
    await sam.page.mouse.move(640, 500);
    await sam.page.mouse.down();
    await wait(600);
    await sam.page.mouse.up();
    for (let i = 0; i < 8; i++) {
      await ava.page.mouse.move(640, 300 + i * 10);
      await ava.page.mouse.down();
      await ava.page.mouse.up();
      await wait(1000);
    }
    const samMid = await sends(sam), avaMid = await sends(ava);
    step(`one word each to sit down (Sam ${samStart - samBefore}, Ava ${avaStart - avaBefore}), none while playing (Sam ${samMid - samStart}, Ava ${avaMid - avaStart})`, samStart - samBefore <= 1 && avaStart - avaBefore <= 1 && samMid === samStart && avaMid === avaStart);
    // Kyle walks over between the pond and the butts: both parked in one phone screen.
    await kyle.page.evaluate(() => Object.assign(window.__game.hero, { x: 46.6, y: 28.6 }));
    await wait(1500);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/pastimes/town-parked-phone.png') });
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/pastimes/town-online-fishing-laptop.png') });
    await sam.page.evaluate(() => window.__fish.close());
    await ava.page.evaluate(() => (window.__range.end(), window.__range.close()));
    step('Sam and Ava get up: Kyle sees both back in town', (await parked(kyle, 'SAM', null)) && (await parked(kyle, 'AVA', null)));
    step(`and that was one more word each (Sam ${(await sends(sam)) - samMid}, Ava ${(await sends(ava)) - avaMid})`, (await sends(sam)) - samMid <= 2 && (await sends(ava)) - avaMid <= 2);
    // The Drowned Rat's table and knife board, and Halvard's anvil (shared/pastimes.ts): parked in the hall,
    // seen by whoever's in it, one word each to sit and one to get up.
    const goIn = (p, door) => p.page.evaluate((door) => { const g = window.__game; if (g.outside) g.leave(); g.enter(g.room.map.blocks.find((b) => b.door === door)); return g.room.map.name; }, door);
    const rat = await Promise.all([kyle, sam, ava].map((p) => goIn(p, 'tavern')));
    step(`all three in the Rat (${rat.join(', ')})`, rat.every((n) => n === 'THE DROWNED RAT'));
    await kyle.page.evaluate(() => Object.assign(window.__game.hero, { x: 14.2, y: 5.6 }));
    await wait(1500);
    const samR = await sends(sam), avaR = await sends(ava);
    await sam.page.evaluate(() => window.__pastime.arm('watch', 0));
    await ava.page.evaluate(() => window.__pastime.knives(0));
    step('Kyle sees Sam parked at the arm-wrestling table', await parked(kyle, 'SAM', 'arm'));
    step('Kyle sees Ava parked at the knife board', await parked(kyle, 'AVA', 'knives'));
    const samR1 = await sends(sam), avaR1 = await sends(ava);
    await sam.page.mouse.move(640, 500);
    for (let i = 0; i < 8; i++) {
      await sam.page.mouse.down();
      await ava.page.mouse.click(640, 400);
      await wait(400);
      await sam.page.mouse.up();
      await wait(500);
    }
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/ratgames/online-arm-laptop.png') });
    const samR2 = await sends(sam), avaR2 = await sends(ava);
    step(`at the Rat: one word each to sit (Sam ${samR1 - samR}, Ava ${avaR1 - avaR}), none while playing (Sam ${samR2 - samR1}, Ava ${avaR2 - avaR1})`, samR1 - samR <= 1 && avaR1 - avaR <= 1 && samR2 === samR1 && avaR2 === avaR1);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/ratgames/rat-parked-phone.png') });
    await sam.page.evaluate(() => (window.__arm.quit(), window.__arm.close()));
    await ava.page.evaluate(() => (window.__knives.quit(), window.__knives.close()));
    step('Sam and Ava get up: Kyle sees both stood in the Rat', (await parked(kyle, 'SAM', null)) && (await parked(kyle, 'AVA', null)));
    step(`and one more word each (Sam ${(await sends(sam)) - samR2}, Ava ${(await sends(ava)) - avaR2})`, (await sends(sam)) - samR2 <= 2 && (await sends(ava)) - avaR2 <= 2);
    // Out of the Rat and into the forge: Sam strikes at the anvil, Kyle watches.
    const forge = await Promise.all([kyle, sam].map((p) => goIn(p, 'forge')));
    step(`Kyle and Sam in the forge (${forge.join(', ')})`, forge.every((n) => n === 'THE FORGE'));
    await kyle.page.evaluate(() => Object.assign(window.__game.hero, { x: 6.2, y: 4.6 }));
    await wait(1500);
    const samF = await sends(sam);
    await sam.page.evaluate(() => { Object.assign(window.__game.profile, { gold: 500, steel: 50 }); window.__pastime.anvil(); });
    step('Kyle sees Sam parked at the anvil', await parked(kyle, 'SAM', 'anvil'));
    const samF1 = await sends(sam);
    for (let i = 0; i < 3; i++) await sam.page.mouse.click(640, 400), await wait(900);
    step(`at the anvil: one word to take the hammer (${samF1 - samF}), none while striking (${(await sends(sam)) - samF1})`, samF1 - samF <= 1 && (await sends(sam)) === samF1);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/ratgames/forge-parked-phone.png') });
    await sam.page.evaluate(() => (window.__anvil.quit(), window.__anvil.close()));
    step('Sam hands the hammer back: Kyle sees him stood in the forge', await parked(kyle, 'SAM', null));
    await sam.ctx.close();
    step('Sam closes the tab: gone for Kyle', await kyle.page.waitForFunction(() => !window.__town().here.some((h) => h.name === 'SAM'), null, { timeout: 15000 }).then(() => true, () => false));
    // The month's Redis budget used up: Kyle's next step is refused; he's told, leaves the town's
    // room, and plays on alone (a job runs in his own browser).
    await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/__spend`, (res) => (res.resume(), r())));
    await kyle.page.keyboard.down('d');
    await wait(600);
    await kyle.page.keyboard.up('d');
    step('budget used up: Kyle is told, and out of the town room', await kyle.page.waitForFunction(() => !window.__town().open && /used up for this month/.test(document.querySelector('#partytoasts')?.textContent ?? ''), null, { timeout: 8000 }).then(() => true, () => false));
    await kyle.page.evaluate(() => window.__game.startJob(window.__game.jobs().find((j) => !j.exped)));
    await wait(1500);
    step('and plays a job on his own', await kyle.page.evaluate(() => window.__game.mode === 'run' && window.__game.room.heroes.length >= 1 && !window.__game.coop));
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
