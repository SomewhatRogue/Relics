// The big map in a real browser: the leader's frame time and frames a second with four heroes spread
// over the field (your hero walked by a bot too), at laptop size and at phone size with the CPU slowed
// 4x (CDP), FLAT and 2.5D, 100 / 300 / 600 goblins. Then screenshots (`shots` as the first argument).
// Needs `npm run build && npx vite preview --port 4220` running. Usage:
//   node scripts/bigmap/browser.cjs [perf|shots] [outdir]
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4220/';
const LAPTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const what = process.argv[2] || 'perf', out = process.argv[3] || 'shots';

async function open(browser, dev, query, slow) {
  const ctx = await browser.newContext(dev === 'phone' ? PHONE : LAPTOP), page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  if (slow) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: slow });
  await page.goto(BASE + '?hero=WARRIOR&bigmap=1&' + query);
  await page.waitForFunction(() => typeof window.__bigPerf === 'function', null, { timeout: 60000 });
  return { ctx, page, errors };
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  if (what === 'perf') {
    const rows = [];
    for (const n of [100, 300, 600]) for (const look of ['flat', '3d']) for (const [dev, slow] of [['laptop', 0], ['phone', 4]]) {
      const p = await open(browser, dev, `n=${n}&auto=1&look=${look}`, slow);
      await wait(6000);
      await p.page.evaluate(() => window.__bigPerf(true));
      await wait(10000);
      const r = await p.page.evaluate(() => window.__bigPerf());
      rows.push({ n, look, dev: dev + (slow ? ` (CPU /${slow})` : ''), ...r, errors: p.errors.length });
      process.stderr.write(`${n} ${look} ${dev}: ${r.fps} fps, frame ${r.frame.mean}/${r.frame.p95} ms, sim ${r.sim.mean}, draw ${r.draw.mean}\n`);
      await p.ctx.close();
    }
    console.log(JSON.stringify(rows, null, 1));
    console.log('\n| goblins | view | device | fps | frame mean ms | frame p95 | room ms a frame | draw ms a frame | awake |\n|---|---|---|---|---|---|---|---|---|');
    for (const r of rows) console.log(`| ${r.n} | ${r.look === '3d' ? '2.5D' : 'flat'} | ${r.dev} | ${r.fps} | ${r.frame.mean} | ${r.frame.p95} | ${r.sim.mean} | ${r.draw.mean} | ${r.awake} |`);
  } else {
    for (const [dev, look] of [['phone', 'flat'], ['laptop', 'flat'], ['phone', '3d'], ['laptop', '3d']]) {
      const p = await open(browser, dev, `n=300&auto=1&look=${look}`, 0);
      await wait(7000);
      await p.page.screenshot({ path: `${out}/${dev}-${look === '3d' ? '25d' : 'flat'}.png` });
      process.stderr.write(`${dev} ${look}: ${p.errors.join(' | ') || 'no errors'}\n`);
      await p.ctx.close();
    }
    for (const [name, q] of [['overview-party', 'n=300&auto=1&overview=1'], ['overview-solo', 'n=300&bots=0&overview=1']]) {
      const p = await open(browser, 'laptop', q, 0);
      await wait(6000);
      await p.page.screenshot({ path: `${out}/${name}.png` });
      process.stderr.write(`${name}: ${JSON.stringify(await p.page.evaluate(() => window.__bigPerf()))}\n`);
      await p.ctx.close();
    }
  }
  await browser.close();
})();
