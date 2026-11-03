// A party end to end: two players in their own browsers (one phone, one laptop) on different relay
// instances. Kyle gathers a party at the board, Sam joins it, Kyle sets out; both should be in the
// same fight: Sam sees Kyle and the goblins, Kyle sees Sam move when Sam walks, and both see a
// goblin's health go down together.
// Usage: node scripts/party-online.cjs   (builds with VITE_ONLINE, serves on 8791; JSON report)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT) || 8791;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const report = { ok: false, steps: [], errors: [] };
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  // A phone's worth of lag on every message (LAG_MS, default 150): the test proves play still feels right.
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { LAG_MS: '150', ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
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
  const step = (s, ok) => (report.steps.push({ s, ok: !!ok }), ok);
  const until = (p, fn, arg, ms = 8000) => p.page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const kyle = await open('KYLE', 'WARRIOR', { viewport: { width: 1280, height: 800 } });
    const sam = await open('SAM', 'RANGER', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    step('they see each other in town', await until(sam, () => window.__town().here.some((h) => h.name === 'KYLE')));
    // Kyle gathers a party for the first job on the board.
    await kyle.page.evaluate(() => window.__openSpot('board'));
    await kyle.page.click('#panel [data-open="1"]');
    await kyle.page.click('#panel [data-gather="1"]');
    await sam.page.evaluate(() => window.__openSpot('board'));
    step("Sam's board shows Kyle's party", await until(sam, () => !!document.querySelector('#panel [data-joinparty]')));
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/party-board-phone.png') });
    await sam.page.click('#panel [data-joinparty]');
    step("Sam is in Kyle's party (Kyle's party card lists Sam)", await until(kyle, () => /SAM/.test(document.querySelector('#partycard ul')?.textContent)));
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/party-board-laptop.png') });
    await kyle.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await kyle.page.click('#partycard [data-setout]');
    step('Kyle sets out on the job', await until(kyle, () => window.__game.mode === 'run'));
    step("Sam is pulled into Kyle's job", await until(sam, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === 'me') && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 12000));
    step("Kyle's room has Sam's hero in it", await until(kyle, () => window.__game.room.heroes.length >= 2));
    step('names right on both screens', await until(sam, () => window.__game.room.heroes.find((h) => h.id === '@lead')?.tag === 'KYLE') && await until(kyle, () => window.__game.room.heroes.some((h) => h.tag === 'SAM')));
    const sameGoblins = await Promise.all([kyle, sam].map((p) => p.page.evaluate(() => window.__game.room.enemies.map((e) => e.id).join(','))));
    step(`same goblins on both screens (${sameGoblins[0].split(',').length})`, sameGoblins[0] && sameGoblins[0] === sameGoblins[1]);
    // Sam's own hero answers the stick at once, lag or no lag.
    const x0 = await sam.page.evaluate(() => window.__game.hero.x);
    await sam.page.keyboard.down('a');
    await wait(110);
    const x1 = await sam.page.evaluate(() => window.__game.hero.x);
    await sam.page.keyboard.up('a');
    await wait(900);
    step(`Sam's hero moves the moment he presses, with 150 ms of lag (${x0.toFixed(2)} to ${x1.toFixed(2)} in 0.11 s)`, x1 < x0 - 0.2);
    // Sam walks up the room: Kyle should see Sam's hero move.
    const before = await kyle.page.evaluate(() => window.__game.room.heroes.find((h) => h.id !== 'me').y);
    // While he walks, his hero on his own screen should go steadily up, never jerk back.
    await sam.page.evaluate(() => { window.__ys = []; window.__yt = setInterval(() => window.__ys.push(window.__game.hero.y), 30); });
    await sam.page.keyboard.down('w');
    await wait(1200);
    await sam.page.keyboard.up('w');
    const ys = await sam.page.evaluate(() => (clearInterval(window.__yt), window.__ys));
    const back = ys.slice(1).reduce((n, y, i) => n + (y > ys[i] + 0.04 ? 1 : 0), 0);
    step(`Sam's walk is smooth on his screen (${back} jerks back in ${ys.length} looks: ${ys.slice(1).map((y, i) => (y - ys[i]).toFixed(2)).join(" ")})`, back === 0);
    await wait(600);
    const after = await kyle.page.evaluate(() => window.__game.room.heroes.find((h) => h.id !== 'me').y);
    const samSees = await sam.page.evaluate(() => window.__game.hero.y);
    step(`Sam walked (Kyle sees ${before.toFixed(2)} to ${after.toFixed(2)}; Sam sees himself at ${samSees.toFixed(2)})`, after < before - 1 && Math.abs(after - samSees) < 0.3);
    // A goblin hurt on Kyle's side is hurt on Sam's.
    await kyle.page.evaluate(() => { const e = window.__game.room.enemies.find((x) => x.hp > 0); e.hp -= 5; window.__hurt = [e.id, e.hp]; });
    const [id, hp] = await kyle.page.evaluate(() => window.__hurt);
    step('a hurt goblin is hurt for Sam too', await until(sam, ([id, hp]) => window.__game.room.enemies.find((e) => e.id === id)?.hp <= hp, [id, hp]));
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/party-run-laptop.png') });
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/party-run-phone.png') });
    // Through the job: each room cleared, the whole party in the way out, on to the next; Sam follows.
    const rooms = await kyle.page.evaluate(() => window.__game.run.job.rooms);
    const samGold = await sam.page.evaluate(() => window.__game.profile.gold);
    for (let r = 0; r < rooms; r++) {
      const key = await kyle.page.evaluate(() => window.__game.roomKey);
      await kyle.page.evaluate(() => {
        const g = window.__game, x = g.room.map.exit ?? g.room.map.roads[0].area;
        for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false });
        // The final room's objective, whatever it is, done.
        if (g.run.index === g.run.job.rooms - 1) g.finishForTest = true;
        for (const h of g.room.heroes) Object.assign(h, { x: x.x + x.w / 2, y: x.y + 0.4 });
      });
      if (r === rooms - 1) {
        await kyle.page.evaluate(() => window.__game.endForTest(true));
        break;
      }
      step(`room ${r + 2}: Kyle moves on`, await until(kyle, (key) => window.__game.roomKey > key, key));
      step(`room ${r + 2}: Sam is in it with him`, await until(sam, (i) => window.__game.run?.index === i && window.__game.room.heroes.some((h) => h.id === 'me'), r + 1));
    }
    step('the job ends for Sam too, and pays him', await until(sam, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, samGold, 10000));
    step('Kyle is home', await until(kyle, () => window.__game.mode === 'town'));
    // A second job: Sam reloads mid-job and gets back in; then Kyle's page dies, Sam takes the job
    // on and leads it, Kyle comes back and follows Sam, and Sam ends it with both paid.
    const reopen = async (p) => {
      const page = await p.ctx.newPage();
      page.on('pageerror', (e) => report.errors.push(`${p.name}: ${e}`));
      await page.goto(`http://127.0.0.1:${PORT}/${process.env.LOOK ? '?look=' + process.env.LOOK : ''}`);
      await page.waitForFunction(() => window.__game);
      await page.evaluate(() => { document.getElementById('title').hidden = true; window.__title.open = false; });
      return page;
    };
    await kyle.page.evaluate(() => window.__openSpot('board'));
    await kyle.page.click('#panel [data-open="2"]');
    await kyle.page.click('#panel [data-gather="2"]');
    await sam.page.evaluate(() => window.__openSpot('board'));
    await until(sam, () => !!document.querySelector('#panel [data-joinparty]'));
    await sam.page.click('#panel [data-joinparty]');
    await until(kyle, () => /SAM/.test(document.querySelector('#partycard ul')?.textContent));
    await kyle.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await kyle.page.click('#partycard [data-setout]');
    step('second job: Sam is in it', await until(sam, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 12000));
    await sam.page.close();
    sam.page = await reopen(sam);
    step('Sam reloads and is straight back in', await until(sam, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === 'me') && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 15000));
    const goblins = await kyle.page.evaluate(() => window.__game.room.enemies.filter((e) => e.hp > 0).map((e) => e.id).join(','));
    await wait(2500); // (a whole-job save goes out every 2 s)
    await kyle.page.close();
    step('Kyle gone: Sam takes the job on and leads it', await until(sam, () => !!window.__game.coop && window.__game.mode === 'run' && !window.__game.remote, null, 20000));
    const samGoblins = await sam.page.evaluate(() => window.__game.room.enemies.filter((e) => e.hp > 0).map((e) => e.id).join(','));
    step(`the same goblins left in it (${goblins.split(',').length})`, samGoblins === goblins || samGoblins.split(',').length <= goblins.split(',').length);
    kyle.page = await reopen(kyle);
    step("Kyle comes back and follows Sam's lead", await until(kyle, () => window.__game.mode === 'run' && !!window.__game.remote && window.__game.room.heroes.some((h) => h.id === '@lead' && h.tag === 'SAM'), null, 20000));
    const kyleGold = await kyle.page.evaluate(() => window.__game.profile.gold);
    await sam.page.evaluate(() => window.__game.endForTest(true));
    step('Sam ends it and Kyle is paid too', await until(kyle, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, kyleGold, 10000));
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
