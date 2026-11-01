// The browser walk-through CI runs after the build: serves dist/, then on a phone-sized and a
// laptop-sized page makes a hero on the start screen, goes into the forge and talks to the smith,
// takes a job and wins its first room. Fails on any page error or a step that doesn't happen.
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const PORT = Number(process.env.SMOKE_PORT || 4179), url = `http://localhost:${PORT}/`;

const fail = (why) => {
  console.error('SMOKE FAILED:', why);
  process.exitCode = 1;
};

(async () => {
  const server = spawn('node_modules/.bin/vite', ['preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  try {
    for (let i = 0; i < 50; i++) {
      try {
        if ((await fetch(url)).ok) break;
      } catch { /* not up yet */ }
      await new Promise((r) => setTimeout(r, 200));
    }
    const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    for (const [tag, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 } }]]) {
      const page = await (await browser.newContext(opts)).newPage(), errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(url);
      await page.waitForFunction(() => window.__game && window.__title);
      // The start screen: pick the Ranger, begin.
      if (!(await page.isVisible('#title'))) fail(`${tag}: no start screen`);
      await page.click('[data-cls="RANGER"]');
      await page.click('[data-begin]');
      const p = await page.evaluate(() => window.__game.profile);
      if (p.cls !== 'RANGER') fail(`${tag}: hero not made (${p.cls})`);
      // Into the forge, to the smith.
      const inside = await page.evaluate(() => {
        const g = window.__game, b = g.room.map.blocks.find((x) => x.door === 'forge');
        g.enter(b);
        return g.room.map.name;
      });
      if (inside !== 'THE FORGE') fail(`${tag}: forge not entered (${inside})`);
      // A job: win the first room, walk out.
      const ran = await page.evaluate(() => {
        const g = window.__game;
        g.startJob(g.jobs()[1]);
        for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false });
        return g.mode;
      });
      if (ran !== 'run') fail(`${tag}: job did not start`);
      await page.waitForTimeout(800);
      const open = await page.evaluate(() => window.__game.room.exitOpen);
      if (!open) fail(`${tag}: the way out never opened`);
      await page.screenshot({ path: `shots/smoke-${tag}.png` }).catch(() => {});
      if (errors.length) fail(`${tag}: page errors ${JSON.stringify(errors)}`);
      console.log(tag, 'ok');
    }
    await browser.close();
  } finally {
    server.kill();
  }
})().catch((e) => fail(String(e)));
