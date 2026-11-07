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
    // The statue in the square (shared/statue.ts): Sam pays for it at the works, the world takes it, and
    // Kyle's next look at the world has Sam on the plinth. Then both bid over the same price at once: the
    // world takes one, and the other gets the gold back.
    require('fs').mkdirSync(path.join(ROOT, 'shots/statue'), { recursive: true });
    await sam.page.evaluate(() => Object.assign(window.__game.profile, { gold: 1500 }, { stats: { ...window.__game.profile.stats, given: 1000 } }));
    step('Sam pays 1000 gold for the statue', await sam.page.evaluate(() => window.__statue.commission(1000)));
    step('the world takes it: Sam on the plinth, 500 gold left, nothing out', await sam.page.waitForFunction(() => { const g = window.__game; return g.world.statue?.by.name === 'SAM' && !g.profile.statueBid && g.profile.gold === 500; }, null, { timeout: 6000 }).then(() => true, () => false));
    await kyle.page.evaluate(() => { window.__game.link.refresh(true); Object.assign(window.__game.hero, { x: 31.8, y: 23.8, fx: 0, fy: -1 }); });
    step("Kyle sees Sam's statue in the square", await kyle.page.waitForFunction(() => window.__game.room.map.rounds.find((r) => r.kind === 'plinth')?.hero?.name === 'SAM', null, { timeout: 6000 }).then(() => true, () => false));
    await wait(1200);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/statue/online-kyle-sees-sam-phone.png') });
    for (const p of [kyle, sam]) await p.page.evaluate(() => Object.assign(window.__game.profile, { gold: 3000 }, { stats: { ...window.__game.profile.stats, given: 1000 } }));
    const [kBid, sBid] = await Promise.all([kyle.page.evaluate(() => window.__statue.commission(1001)), sam.page.evaluate(() => window.__statue.commission(1500))]);
    const settled = (p) => p.page.waitForFunction(() => !window.__game.profile.statueBid, null, { timeout: 8000 }).then(() => true, () => false);
    const both = (await settled(kyle)) && (await settled(sam));
    const kEnd = await kyle.page.evaluate(() => ({ gold: window.__game.profile.gold, on: window.__game.world.statue?.by.name })), sEnd = await sam.page.evaluate(() => ({ gold: window.__game.profile.gold, on: window.__game.world.statue?.by.name }));
    const won = kEnd.gold === 1999 ? 'KYLE' : sEnd.gold === 1500 ? 'SAM' : null;
    step(`a race over 1000: both sent (${kBid}, ${sBid}), one won (${won}), the other paid back (Kyle ${kEnd.gold}, Sam ${sEnd.gold}), both see the winner (${kEnd.on}, ${sEnd.on})`, kBid && sBid && both && !!won && (won === 'KYLE' ? sEnd.gold === 3000 : kEnd.gold === 3000) && sEnd.on === won);
    await kyle.page.evaluate(() => window.__game.link.refresh(true));
    await wait(800);
    step('and Kyle sees the winner on the plinth', await kyle.page.evaluate((won) => window.__game.room.map.rounds.find((r) => r.kind === 'plinth')?.hero?.name === won, won));
    // Kyle (a Ranger, on his phone) pets his hound in the square (client/petting.ts): the PET button,
    // one word to the town, and Sam sees it on his screen.
    require('fs').mkdirSync(path.join(ROOT, 'shots/pet'), { recursive: true });
    const clear = await kyle.page.evaluate(() => {
      const g = window.__game, h = g.hero, x0 = h.x, y0 = h.y;
      for (let r = 1; r < 12; r++) for (let a = 0; a < 16; a++) {
        Object.assign(h, { x: x0 + Math.cos(a / 2.5) * r, y: y0 + 2 + Math.sin(a / 2.5) * r * 0.6 });
        if (h.hound) Object.assign(h.hound, { x: h.x - 1, y: h.y + 0.2, state: 'heel' });
        if (g.near()?.pet === 'own') return true;
      }
      return false;
    });
    await wait(2500);
    step('Kyle has PET on his context button, with the hound at heel', clear && await kyle.page.waitForFunction(() => !document.querySelector('.tb.use').hidden && document.querySelector('.tb.use').textContent.includes('PET'), null, { timeout: 4000 }).then(() => true, () => false));
    const kyleSent = await kyle.page.evaluate(() => window.__town().sends);
    await kyle.page.tap('.tb.use');
    step('Kyle kneels to his hound', await kyle.page.waitForFunction(() => !!window.__idles.petting(), null, { timeout: 2000 }).then(() => true, () => false));
    step('Sam sees Kyle petting his hound', await sam.page.waitForFunction(() => window.__town().here.some((h) => h.name === 'KYLE' && h.pet), null, { timeout: 3000 }).then(() => true, () => false));
    await wait(500);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/pet/town-pet-phone.png') });
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/pet/town-pet-friend-laptop.png') });
    await wait(2500);
    const kyleWords = (await kyle.page.evaluate(() => window.__town().sends)) - kyleSent;
    step(`and that pet was one word from Kyle (${kyleWords})`, kyleWords === 1);
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
    // A shift at the forge: parked at the anvil the same way, two words however long it runs.
    const samS = await sends(sam);
    await sam.page.evaluate(() => window.__pastime.shift());
    step('Kyle sees Sam parked at the anvil for a shift', await parked(kyle, 'SAM', 'anvil'));
    const samS1 = await sends(sam);
    for (let i = 0; i < 4; i++) await sam.page.mouse.click(640, 400), await wait(700);
    step(`a shift: one word to start (${samS1 - samS}), none while working (${(await sends(sam)) - samS1})`, samS1 - samS <= 1 && (await sends(sam)) === samS1);
    await sam.page.evaluate(() => (window.__shift.quit(), window.__shift.close()));
    step(`Sam stops the shift: Kyle sees him stood (and one word: ${(await sends(sam)) - samS1})`, (await parked(kyle, 'SAM', null)) && (await sends(sam)) - samS1 <= 2);
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
