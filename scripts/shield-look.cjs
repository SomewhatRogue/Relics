// The shield-bearer's board on a phone (sim/board.ts): a Ranger's plain arrow stopped on it (BLOCKED), a
// Warrior's full charge knocking it aside (BOARD OUT, the board swung wide), and a Rogue at its back.
// Flat and 2.5D. Usage: node scripts/shield-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4551/';
const out = process.argv[3] || 'shots';

const PLACE = { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 };
// Each scene: the hero's kit, where the shield-bearer stands from the hero, which way it faces (1 at the hero,
// -1 away), and what the hero does (a hold of `hold` ms on attack, `taps` quick ones), shot `after` ms later.
const SCENES = {
  'shield-arrow': { weapon: 'longbow', dy: -3.2, face: 1, hold: 420, after: 120 },
  'shield-out': { weapon: 'sword', dy: -1.3, face: 1, hold: 1000, after: 260 },
  'shield-behind': { weapon: 'daggers', dy: -1.15, face: -1, taps: 3, after: 60 },
};

async function setUp(page) {
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('ROGUE', 'WREN'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(300);
}

async function stage(page, s) {
  await page.evaluate(() => {
    const g = window.__game, j = g.jobs()[1];
    g.startJob({ ...j, place: window.__place, objective: 'rescue', rooms: 1, seed: 5, layout: 3 });
  });
  await page.waitForTimeout(400);
  await page.evaluate((s) => {
    const g = window.__game, r = g.room, h = g.hero, base = JSON.parse(JSON.stringify(r.enemies.find((e) => e.kind === 'scrapper') || r.enemies[0]));
    for (const e of r.enemies) Object.assign(e, { x: 1.2, y: 1.2, act: 'dead', actT: 99, escaped: true });
    const x0 = Math.round(r.map.w / 2), y0 = r.map.hero.y - 4;
    Object.assign(h, { x: x0, y: y0, fx: 0, fy: -1, safeT: 0, weapon: s.weapon });
    const id = Math.max(...r.enemies.map((e) => e.id)) + 1;
    const e = { ...base, id, kind: 'scrapper', variant: 'shield', role: 'shield', x: h.x, y: h.y + s.dy, home: { x: h.x, y: h.y + s.dy }, hp: 999, maxHp: 999, radius: 0.34, weight: 0.6, act: 'chase', attack: null, alert: true, respawns: false, escaped: false, name: undefined, bow: false, z: 0, feeding: false, pack: 1, cooldown: 99, held: 0, big: false, elite: undefined, boardOutAt: undefined, fx: 0, fy: s.face };
    r.enemies.push(e);
    clearInterval(window.__hold);
    window.__hold = setInterval(() => {
      Object.assign(e, { x: h.x, y: h.y + s.dy, fx: 0, fy: s.face, cooldown: 99, hp: 999 });
      Object.assign(h, { x: x0, y: y0, hp: h.maxHp });
      if (s.face < 0) Object.assign(h, { fx: 0, fy: -1 });
    }, 10);
  }, s);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const look of ['flat', '3d']) {
    await page.goto(url + '?look=' + look);
    await setUp(page);
    await page.evaluate((p) => (window.__place = p), PLACE);
    for (const [name, s] of Object.entries(SCENES)) {
      await stage(page, s);
      await page.waitForTimeout(500);
      const evs = page.evaluate(() => new Promise((ok) => {
        const seen = new Set(), t0 = Date.now(), r = window.__game.room;
        const tick = setInterval(() => { for (const e of r.events) seen.add(e.k + (e.boarded ? '(boarded)' : '') + (e.backstab ? '(backstab)' : '')); if (Date.now() - t0 > 2500) clearInterval(tick), ok([...seen].filter((k) => /hit|deflect|boardout/.test(k))); }, 5);
      }));
      if (s.hold) await page.keyboard.down('j'), await page.waitForTimeout(s.hold), await page.keyboard.up('j');
      for (let i = 0; i < (s.taps ?? 0); i++) await page.keyboard.press('j'), await page.waitForTimeout(230);
      await page.waitForTimeout(s.after);
      await page.screenshot({ path: `${out}/${name}-${look}-phone.png` });
      const e = await page.evaluate(() => { const r = window.__game.room, e = r.enemies.find((x) => x.variant === 'shield' && !x.escaped); return { out: e.boardOutAt !== undefined && r.time - e.boardOutAt < 1.2, lost: 999 - e.hp }; });
      console.log(name, look, JSON.stringify(e), (await evs).join(' '));
    }
  }
  console.log(errors.length ? errors.slice(0, 5) : 'no errors');
  await browser.close();
})();
