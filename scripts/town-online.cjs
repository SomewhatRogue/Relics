// The shared town end to end: two players in their own browsers (one phone, one laptop), each
// connected to the relay on a different instance. Each should see the other walk about Wickhold,
// a third arriving should be seen by both, and someone leaving town should vanish for the rest.
// Usage: node scripts/town-online.cjs   (builds with VITE_ONLINE, serves on 8790; JSON report)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
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
