// MEND online (Kyle, 2026-11-06: "Cleric could heal friends only self with V"): two Clerics in a party,
// Kyle leading on a laptop, Sam a guest on a phone, on different relay instances with a phone's lag.
// Each is a little hurt, 4.5 tiles apart (past the old 4-tile reach). Sam's MEND (V) goes to Kyle on
// Kyle's room, not to Sam; then Kyle's goes to Sam. While it's ready, each screen shows the gold mark
// over the friend it would reach. Shots of the mark into shots/mend-*.png.
// Usage: node scripts/mend-online.cjs   (builds with VITE_ONLINE unless NOBUILD; ONLINE_PORT, default 8795)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT) || 8795;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const report = { ok: false, steps: [], errors: [] };
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { LAG_MS: '150', ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    if (await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/`, (res) => (res.resume(), r(true))).on('error', () => r(false)))) break;
    await wait(200);
  }
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (name, opts) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => report.errors.push(`${name}: ${e}`));
    await page.goto(`http://127.0.0.1:${PORT}/?pick=lead${process.env.LOOK ? '&look=' + process.env.LOOK : ''}`);
    await page.waitForFunction(() => window.__game);
    await page.evaluate((name) => { window.__game.create('HEALER', name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, name);
    return { name, ctx, page };
  };
  const step = (s, ok) => (report.steps.push({ s, ok: !!ok }), ok);
  const until = (p, fn, arg, ms = 8000) => p.page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const kyle = await open('KYLE', { viewport: { width: 1280, height: 800 } });
    const sam = await open('SAM', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    step('they see each other in town', await until(sam, () => window.__town().here.some((h) => h.name === 'KYLE')));
    await kyle.page.evaluate(() => window.__openSpot('board'));
    await kyle.page.click('#panel [data-open="1"]');
    await kyle.page.click('#panel [data-gather="1"]');
    await sam.page.evaluate(() => window.__openSpot('board'));
    await until(sam, () => !!document.querySelector('#panel [data-joinparty]'));
    await sam.page.click('#panel [data-joinparty]');
    step("Sam is in Kyle's party", await until(kyle, () => /SAM/.test(document.querySelector('#partycard ul')?.textContent)));
    await kyle.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await kyle.page.click('#partycard [data-setout]');
    step('both on the job, Kyle leading', await until(sam, () => window.__game.mode === 'run' && !!window.__game.remote && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 15000));
    // Nothing else going on: the goblins down, both on their feet, 4.5 tiles apart, a little hurt, Sam the worse.
    const setUp = (kyleHp, samHp) => kyle.page.evaluate(([kh, sh]) => {
      const g = window.__game, r = g.room, me = g.hero, s = r.heroes.find((h) => h !== me);
      for (const e of r.enemies) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false, attack: null });
      const x = r.map.hero.x, y = r.map.hero.y;
      Object.assign(me, { x, y, act: 'idle', hp: Math.round(me.maxHp * kh), stamina: 100, signReady: 0, safeT: 1e9 });
      Object.assign(s, { x: x + 4.5, y, act: 'idle', hp: Math.round(s.maxHp * sh), stamina: 100, signReady: 0, safeT: 1e9 });
      return { kyle: me.hp, kyleMax: me.maxHp, sam: s.hp, samMax: s.maxHp };
    }, [kyleHp, samHp]);
    const hp = () => kyle.page.evaluate(() => { const g = window.__game, s = g.room.heroes.find((h) => h !== g.hero); return { kyle: g.hero.hp, sam: s.hp }; });
    // Sam, the guest, a little worse off than Kyle (the old rule kept it for himself).
    let at = await setUp(0.7, 0.6);
    await wait(1200);
    step(`Sam's screen shows the gold mark over Kyle (his MEND would reach him)`, await until(sam, () => {
      const g = window.__game, me = g.hero, lead = g.room.heroes.find((h) => h.id === '@lead');
      return !!lead && lead.hp < lead.maxHp && Math.hypot(lead.x - me.x, lead.y - me.y) > 4;
    }));
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/mend-mark-guest-phone.png') });
    await sam.page.keyboard.press('v');
    await wait(1500);
    let now = await hp();
    step(`Sam (guest) presses MEND: Kyle ${at.kyle} to ${now.kyle}, Sam ${at.sam} to ${now.sam}`, now.kyle === Math.min(at.kyleMax, at.kyle + 25) && now.sam === at.sam);
    // Kyle, the leader, the same way round.
    at = await setUp(0.6, 0.7);
    await wait(1000);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/mend-mark-host-laptop.png') });
    await kyle.page.keyboard.press('v');
    await wait(800);
    now = await hp();
    step(`Kyle (leader) presses MEND: Sam ${at.sam} to ${now.sam}, Kyle ${at.kyle} to ${now.kyle}`, now.sam === Math.min(at.samMax, at.sam + 25) && now.kyle === at.kyle);
    step("Sam's own screen shows his health back up", await until(sam, (want) => window.__game.hero.hp >= want, now.sam));
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
