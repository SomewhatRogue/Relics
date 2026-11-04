// Layout 3's rooms (docs/terrain-nodes.md slices 2 to 4), phone and laptop, flat and 2.5D: a route that
// turns left then right, a fork with roads out by the top and the side, a side way and the dead end
// through it, the carr where the wood goes to fen, and mixed rooms (a ruined chapel in the fields, a farm
// burned out at the wood's edge). Usage: node scripts/terrain-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4360/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const NOON = 2400000 * 700 + 1200000;
const P = {
  Barrowby: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 },
  'Fennick Ford': { name: 'Fennick Ford', kind: 'village', region: 'Fenmere', ruin: 2 },
};
// Each scene: the job, the road at the fork, the room, where to stand, and what to do first.
const SCENES = [
  { name: 'turn-left', place: 'Barrowby', seed: 2, took: 'h', room: 2, open: true, stand: 'out' },
  { name: 'turn-right', place: 'Barrowby', seed: 2, took: 'h', room: 3, open: true, stand: 'in' },
  { name: 'fork', place: 'Barrowby', seed: 1, took: 'h', room: 2, open: true, stand: 'mid' },
  { name: 'sideway', place: 'Barrowby', seed: 5, took: 'h', room: 0, stand: 'side' },
  { name: 'deadend', place: 'Barrowby', seed: 5, took: 'h', room: 0, stand: 'side', enter: true },
  { name: 'wood-to-fen', place: 'Fennick Ford', seed: 2, took: 'h', room: 3, stand: 'mid' },
  { name: 'mixed-chapel', place: 'Barrowby', seed: 15, took: 'h', room: 0, stand: 'mid' },
  { name: 'mixed-burntfarm', place: 'Barrowby', seed: 2, took: 'h', room: 2, stand: 'mid' },
];

async function to(page, s) {
  await page.evaluate(async ([s, place]) => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms)), j = g.jobs()[1];
    g.startJob({ ...j, place, objective: 'hunt', boss: 'SKARN', rooms: 5, seed: s.seed, layout: 3, deep: false });
    await wait(120);
    for (let k = 0; k < s.room; k++) {
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      g.room.exitOpen = true;
      const m = g.room.map, a = m.exit ?? m.roads.find((r) => r.road[0] === s.took).area;
      Object.assign(g.hero, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
      await wait(250);
    }
  }, [s, P[s.place]]);
}

async function stand(page, s) {
  await page.evaluate((s) => {
    const g = window.__game, m = g.room.map, sw = m.blocks.find((b) => b.kind === 'sideway');
    for (const e of g.room.enemies) e.cooldown = 99;
    if (s.open) {
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      g.room.exitOpen = true;
    }
    const a = m.exit ?? m.roads[0].area, c = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, mid = { x: m.w / 2, y: m.h / 2 };
    const at = s.stand === 'side' && sw ? { x: sw.face === 'W' ? 3 : sw.face === 'E' ? m.w - 3 : sw.x + 1, y: sw.face === 'S' ? m.h - 3 : sw.y + 1 }
      : s.stand === 'out' ? { x: c.x + (mid.x - c.x) * 0.3, y: c.y + (mid.y - c.y) * 0.3 } : s.stand === 'in' ? { x: m.hero.x + (mid.x - m.hero.x) * 0.25, y: m.hero.y + (mid.y - m.hero.y) * 0.25 } : mid;
    Object.assign(g.hero, at);
    if (s.enter && sw) g.enter(sw);
  }, s);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts), page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${dev} ${look} ${e}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${dev} ${look} ${m.text()}`));
    for (const s of SCENES) {
      // A fresh page each scene, so nothing said in the last one is still on screen.
      await page.goto(url + (look === '3d' ? '&look=3d' : ''));
      await page.waitForFunction(() => window.__game && typeof window.render_game_to_text === 'function');
      await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
      await to(page, s);
      await stand(page, s);
      await page.waitForTimeout(look === '3d' ? 1300 : 800);
      await page.screenshot({ path: `${out}/${s.name}-${dev}-${look}.png` });
      const info = await page.evaluate(() => { const g = window.__game, m = g.room.map; return { room: g.run && g.run.index, w: m.w, h: m.h, exit: m.exit, roads: m.roads && m.roads.map((r) => [r.label, r.side]), banner: document.getElementById('banner')?.textContent, side: m.blocks.filter((b) => b.kind === 'sideway').map((b) => b.label + ' ' + b.face) }; });
      console.log(dev, look, s.name, JSON.stringify(info));
    }
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
