// The party stress test: real browsers against the local relay, leaving, joining, rejoining, dying and
// coming back, each scenario with fresh players. Prints a JSON report (each step ok or not, and any
// page errors) and exits non-zero on any failure.
// Usage: node scripts/stress-online.cjs [1 2 4f ...]   (builds with VITE_ONLINE unless NOBUILD=1; port 8792, or STRESS_PORT)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const { kit, wait } = require('./stress/kit.cjs');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.STRESS_PORT) || 8792;
const SCENES = { ...require('./stress/leave.cjs'), ...require('./stress/drop.cjs'), ...require('./stress/falls.cjs'), ...require('./stress/order.cjs'), ...require('./stress/split.cjs') };
const NAMES = {
  1: 'friend leaves', 2: 'leader leaves', 3: 'leader of three leaves', 4: "leader's page hidden 30 s", '4f': "leader's page frozen",
  5: "leader's tab closed", 6: 'friend reloads', '6b': "friend's phone locked over a minute", 7: 'leader reloads', 8: 'friend down, leader helps', 9: 'friend down alone, then out',
  10: 'leader out, friend goes on', 11: 'everyone out', 12: 'HELP UP on the phone', 13: 'solo leave', 14: 'friend in before the leader',
  15: 'friend goes into a house alone', 16: 'leader goes in alone', 17: 'two houses at once', 18: 'small goblins follow, big ones not', 19: 'friend brings a captive out',
  20: 'leader leaves while a friend is indoors', 21: 'the way on waits for a friend indoors',
};

(async () => {
  const report = { ok: false, scenes: {}, steps: [], errors: [] };
  const pick = process.argv.slice(2);
  const order = Object.keys(NAMES).filter((k) => !pick.length || pick.includes(k));
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { LAG_MS: '120', ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    if (await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/`, (res) => (res.resume(), r(true))).on('error', () => r(false)))) break;
    await wait(200);
  }
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const k = kit(browser, PORT, report);
  try {
    for (const id of order) {
      const name = `${id}. ${NAMES[id]}`, from = report.steps.length, errs = report.errors.length, t0 = Date.now();
      k.scene = name;
      try {
        await SCENES[id](k);
      } catch (e) {
        report.steps.push({ scene: name, s: 'ran without throwing', ok: false, got: String(e).slice(0, 300) });
      }
      // Each scenario's players go before the next one's come.
      for (const ctx of browser.contexts()) await ctx.close().catch(() => {});
      const steps = report.steps.slice(from);
      report.scenes[name] = { ok: steps.length > 0 && steps.every((s) => s.ok) && report.errors.length === errs, secs: Math.round((Date.now() - t0) / 1000) };
      process.stderr.write(`${report.scenes[name].ok ? 'ok  ' : 'FAIL'} ${name} (${report.scenes[name].secs} s)\n`);
    }
    report.ok = Object.values(report.scenes).every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
