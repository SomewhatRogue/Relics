// The new look's characters in play (docs/decisions/new-look-characters.md): a job behind ?look=3d&hd&street, the
// knight walking up to two knife goblins, the full combo, a shield bash, the goblins fighting back and dying, at
// exactly 30 frames a second of game time (the page's clock stepped by hand, so a slow machine still shows the real
// timing: the page's frame callbacks and clocks are driven from here, a thirtieth of a second a frame). Frames to
// <out>/f0000.png...; make a video with ffmpeg after.
// Usage: node scripts/chars-play.cjs [url] [out] [mode: sheet, parts, old, or sharp (today's figures painted sharper)] [seconds]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots/play';
const mode = process.argv[4] || 'sheet';
const secs = Number(process.argv[5] || 10);
const NOON = 2400000 * 700 + 1200000;

// The fight, beat by beat: the knight walks up and runs two full combos and a shield bash while the goblins hold
// off (they stagger but don't strike back); then they attack while he blocks and takes a hit; then he cuts them
// down. Keys held [from, to, keys] and taps of the attack, in seconds.
const HOLD = [[0.2, 0.55, ['d']], [3.9, 4.5, ['j']], [5.3, 6.1, ['k']], [8.9, 9.8, ['a']]];
const TAPS = [1.0, 1.42, 1.84, 2.6, 3.02, 3.44, 6.6, 7.02, 7.44, 8.0, 8.42];
const HOLD_OFF = 5.0, WEAKEN = 6.4;

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // The page's frames and clocks driven from here: requestAnimationFrame queues, and __advance(ms) moves
  // performance.now and Date.now on and runs the queued frames with that time. (Playwright's own clock hands frames
  // a timestamp off the page's clock, and the game steps its tenth-of-a-second most every frame.)
  await page.addInitScript((noon) => {
    let now = 0, q = [];
    window.requestAnimationFrame = (cb) => (q.push(cb), q.length);
    performance.now = () => now;
    Date.now = () => noon + now;
    window.__advance = (ms) => { now += ms; const run = q; q = []; for (const cb of run) cb(now); };
  }, NOON);
  await page.goto(url + '?look=3d&hd&street&' + (mode === 'sharp' ? 'sharp' : 'chars=' + mode));
  for (let i = 0; i < 200 && !(await page.evaluate(() => !!window.__game)); i++) await page.waitForTimeout(50);
  await page.evaluate(() => {
    const g = window.__game;
    g.create('WARRIOR', 'BRANNOCK');
    if (g.profile.errands) g.profile.errands.told = true;
    document.getElementById('title').hidden = true;
    window.__title.open = false;
    if (g.mode === 'wood') g.skipWood();
    g.startJob({ ...g.jobs().find((j) => !j.exped && j.objective !== 'story'), time: 'day', twist: 'none' });
  });
  for (let i = 0; i < 90; i++) await page.evaluate(() => window.__advance(1000 / 30));
  // Two knife goblins a little way ahead, coming for the knight; the rest of the room taken out, so the fight reads.
  await page.evaluate(() => {
    const g = window.__game, r = window.__room, h = g.hero;
    g.hero.hp = g.hero.maxHp = 400;
    const gobs = r.enemies.filter((e) => e.kind === 'scrapper' && e.act !== 'dead').slice(0, 2);
    r.enemies.splice(0, r.enemies.length, ...gobs);
    gobs.forEach((e, i) => { e.variant = undefined; (e.x = h.x + 2.2 + i * 0.5), (e.y = h.y - 0.6 + i * 1.2); e.hp = Math.min(e.hp, 36); e.act = 'chase'; });
  });
  for (let i = 0; i < 12; i++) await page.evaluate(() => window.__advance(1000 / 30));
  const N = Math.round(secs * 30);
  const held = new Set();
  for (let n = 0; n < N; n++) {
    const t = n / 30;
    const want = new Set(HOLD.filter(([a, b]) => t >= a && t < b).flatMap(([, , k]) => k));
    for (const k of held) if (!want.has(k)) await page.keyboard.up(k), held.delete(k);
    for (const k of want) if (!held.has(k)) await page.keyboard.down(k), held.add(k);
    // The goblins hold off till HOLD_OFF and are tough till WEAKEN. A goblin cut apart dies the plain way here, so
    // its new fall shows (the cut-apart deaths aren't drawn new yet).
    await page.evaluate(([t, off, weak]) => {
      for (const e of window.__room.enemies) {
        if (t < off && e.act !== 'dead' && !e.attack) e.cooldown = Math.max(e.cooldown, 0.5);
        if (e.act !== 'dead') e.hp = t < weak ? Math.max(e.hp, 120) : Math.min(e.hp, 14);
        if (e.act === 'dead' && e.death !== 'burn') e.death = '';
      }
    }, [t, HOLD_OFF, WEAKEN]);
    if (TAPS.some((x) => x >= t && x < t + 1 / 30)) await page.keyboard.down('j'), await page.evaluate(() => window.__advance(1000 / 60)), await page.keyboard.up('j'), await page.evaluate(() => window.__advance(1000 / 60));
    else await page.evaluate(() => window.__advance(1000 / 30));
    if (process.env.DEBUG && (n % 10 === 0 || (process.env.DEBUG === 'all' && t > 0.9 && t < 1.6))) console.log(t.toFixed(2), await page.evaluate(() => { const g = window.__game, h = g.hero; return JSON.stringify({ act: h.act, actT: +h.actT.toFixed(3), hs: h.hitstop, x: +h.x.toFixed(2), y: +h.y.toFixed(2), combo: h.combo, mode: g.mode, held: [...(window.__input?.keys ?? [])], focus: document.activeElement?.tagName }); }));
    await page.screenshot({ path: `${out}/f${String(n).padStart(4, '0')}.png` });
  }
  console.log(mode, N, 'frames', errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 3)) : 'ok');
  await browser.close();
})();
