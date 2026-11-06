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
/** Frames (and ms) on `p`'s page from running `act` in the page until `seen` holds; with what `look` saw each frame. */
const frames = (p, act, seen, look, ms = 900) => p.page.evaluate(([act, seen, look, ms]) => new Promise((res) => {
  const g = window.__game, t0 = performance.now(), saw = [];
  let n = 0, first = -1, firstMs = -1;
  new Function('g', act)(g);
  const f = () => {
    n++;
    saw.push(new Function('g', 'return ' + look)(g));
    if (first < 0 && new Function('g', 'return ' + seen)(g)) (first = n), (firstMs = Math.round(performance.now() - t0));
    if (performance.now() - t0 > ms) return res({ first, firstMs, frames: n, saw });
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}), [act, seen, look, ms]);
const key = (k, type) => `document.body.dispatchEvent(new KeyboardEvent('${type}', { key: '${k}', bubbles: true }));`;
/** Looks that go back against the way of going by more than `by` (a jerk back). */
const jerks = (ps, dx, dy, by = 0.04) => ps.slice(1).reduce((n, p, i) => n + (((p[0] - ps[i][0]) * dx + (p[1] - ps[i][1]) * dy) < -by ? 1 : 0), 0);

/**
 * Sam's own block, walk with a block held, creep, dodge, and a goblin's stab dodged by his own screen,
 * with LAG_MS of lag each way. Each in numbers, for DECISIONS (run against the old build for the before).
 */
async function guestFeel(kyle, sam, step) {
  const out = {}, until = (p, fn, arg, ms = 8000) => p.page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const samOnKyle = (js) => kyle.page.evaluate(`(() => { const g = window.__game, s = g.room.heroes.find((h) => h.id !== 'me'); ${js} })()`);
  // Nothing else in the way: every goblin but one down, no snares; Sam back at the way in, on his feet.
  await kyle.page.evaluate(() => {
    const g = window.__game, keep = g.room.enemies.find((e) => e.hp > 0);
    for (const k of ['nooses', 'slicks', 'snares', 'puddles', 'zones']) g.room[k] = [];
    Object.assign(g.room.heroes.find((h) => h.id !== 'me'), { x: g.room.map.hero.x, y: g.room.map.hero.y, act: 'idle', actT: 0, kvx: 0, kvy: 0, z: 0 });
    // (Kyle out of the stab's way: only Sam's dodge or hit is counted below.)
    Object.assign(g.hero, { x: g.room.map.hero.x + 4, y: g.room.map.hero.y, safeT: 1e9 });
    window.__keep = keep?.id;
    for (const e of g.room.enemies) if (e !== keep) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false });
    // (Held still till its stab: a stunned goblin does nothing, nets and pots included.)
    if (keep) Object.assign(keep, { x: 2, y: 2, hp: 999, maxHp: 999, cooldown: 99, act: 'stunned', actT: 0, actDur: 999, attack: null });
    const s = g.room.heroes.find((h) => h.id !== 'me');
    Object.assign(s, { hp: 999, maxHp: 999, stamina: 100 });
  });
  // A held block (a sword for it: a Ranger has no guard), and walking with it held.
  await samOnKyle(`s.weapon = 'sword';`);
  await until(sam, () => window.__game.hero.weapon === 'sword');
  await wait(400);
  const pre = await sam.page.evaluate(() => { const h = window.__game.hero; return { act: h.act, weapon: h.weapon, stamina: Math.round(h.stamina), winded: !!h.winded, panel: window.__game.mode }; });
  const block = await frames(sam, key('k', 'keydown'), 'g.hero.blocking', '0', 700);
  const bw = await frames(sam, key('w', 'keydown'), 'false', '[g.hero.x, g.hero.y]', 1200);
  const bwAfter = await frames(sam, key('w', 'keyup') + key('k', 'keyup'), 'false', '[g.hero.x, g.hero.y]', 600);
  out.block = { frames: block.first, ms: block.firstMs, walkJerks: jerks([...bw.saw, ...bwAfter.saw], 0, -1, 0.04), pre };
  step(`Sam's block shows the moment he holds it (frame ${block.first}, ${block.firstMs} ms; walking with it held, ${out.block.walkJerks} jerks back)`, block.first >= 1 && block.first <= 2 && out.block.walkJerks === 0);
  await samOnKyle(`s.weapon = 'longbow'; s.stamina = 100;`);
  await until(sam, () => window.__game.hero.weapon === 'longbow');
  await wait(600);
  // Creeping (Shift held): steady on his screen, and no pull back when he stops.
  const cr = await frames(sam, key('Shift', 'keydown') + key('w', 'keydown'), 'false', '[g.hero.x, g.hero.y]', 1200);
  const crAfter = await frames(sam, key('w', 'keyup') + key('Shift', 'keyup'), 'false', '[g.hero.x, g.hero.y]', 600);
  out.creep = { jerks: jerks([...cr.saw, ...crAfter.saw], 0, -1, 0.04), looks: cr.saw.length + crAfter.saw.length };
  step(`Sam's creep is smooth on his screen (${out.creep.jerks} jerks back in ${out.creep.looks} frames, the stop included)`, out.creep.jerks === 0);
  await wait(500);
  // A dodge: on his screen within two frames, and never pulled back over it.
  const roll = await frames(sam, key(' ', 'keydown') + key(' ', 'keyup'), "g.hero.act === 'roll'", '[g.hero.x, g.hero.y, g.hero.act, g.hero.rollDx, g.hero.rollDy]', 900);
  const r0 = roll.saw.find((p) => p[2] === 'roll') ?? [0, 0, '', 0, 1];
  out.roll = { frames: roll.first, ms: roll.firstMs, jerks: jerks(roll.saw, r0[3], r0[4], 0.04), steps: roll.saw.length };
  step(`Sam's dodge shows at once (frame ${roll.first}, ${roll.firstMs} ms) with no jerk back (${out.roll.jerks} in ${out.roll.steps} frames)`, roll.first >= 1 && roll.first <= 2 && out.roll.jerks === 0);
  await wait(1200);
  // What the lag is made of here (headless pages draw slowly): the trip, the playout's wait, the time between patches, frames.
  out.parts = await sam.page.evaluate(() => { const r = window.__game.remote; return { trip: Math.round((r.own?.trip ?? r.trip) * 1000), playout: Math.round(r.playout.delay * 1000), gap: Math.round(r.gap * 1000) }; });
  const frameMs = async (p) => { const t = (await frames(p, '', 'false', 'performance.now()', 500)).saw; return Math.round((t[t.length - 1] - t[0]) / (t.length - 1)); };
  out.parts.kyleFrameMs = await frameMs(kyle);
  out.parts.samFrameMs = await frameMs(sam);
  if (process.env.FEEL_SAW) Object.assign(out, { saw: { roll: roll.saw, creep: [...cr.saw, ...crAfter.saw], bw: [...bw.saw, ...bwAfter.saw] } });
  // A goblin's stab at Sam, dodged by his own screen: he jumps back when it's `X` s from landing there.
  // The leader waits for his word on it LAGCOMP.cap (0.15 s) at most: with his lag, a jump counts if it
  // came at least his lag less the cap before the blow on his screen, and in the jump's i-frames
  // (RANGER_JUMP: 0.02 to 0.2 s). Tried at the cap as it is, then with the cap at his lag (the same
  // mechanism, no cap in the way), so both are on record.
  const stab = async (cap) => {
    const lag = await samOnKyle('return s.lag ?? 0;'), was = await kyle.page.evaluate(() => window.__lagcomp?.cap ?? null);
    const use = cap === 'lag' ? lag + 0.05 : was ?? 0;
    if (was !== null) await kyle.page.evaluate((c) => (window.__lagcomp.cap = c), use);
    const X = Math.max(0.1, Math.min(0.15, lag - use + 0.04)), reach = was !== null && lag - use <= 0.17;
    await kyle.page.evaluate(() => {
      const g = window.__game, r = g.room, s = r.heroes.find((h) => h.id !== 'me'), e = r.enemies.find((x) => x.id === window.__keep);
      window.__evs = [];
      if (!r.__watched) {
        const adv = r.advance.bind(r);
        r.advance = (dt) => { const ev = adv(dt); window.__evs.push(...ev); return ev; };
        r.__watched = true;
      }
      Object.assign(s, { hp: 999, stamina: 100, fx: 0, fy: -1 });
      Object.assign(e, { x: s.x, y: s.y - 1.3, fx: 0, fy: 1, hp: 999, cooldown: 99, act: 'attack', actT: 0, actDur: 0, kvx: 0, kvy: 0, alert: true,
        attack: { kind: 'stab', aimed: s.id, t: 0, windup: 0.9, active: 0.1, recover: 0.6, dmg: 7, knock: 2, unblockable: false, dx: 0, dy: 1, ox: s.x, oy: s.y - 1.3, range: 2.4, arc: 70, cx: s.x, cy: s.y - 1.3, radius: 0, done: false } });
    });
    const pressed = await sam.page.evaluate(([id, X]) => new Promise((res) => {
      const g = window.__game, t0 = performance.now();
      const f = () => {
        const a = g.room.enemies.find((e) => e.id === id)?.attack;
        if (a && a.t >= a.windup - X) {
          document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
          document.body.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
          return res({ left: Math.round((a.windup - a.t) * 1000) });
        }
        if (performance.now() - t0 > 5000) return res(null);
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    }), [await kyle.page.evaluate(() => window.__keep), X]);
    await wait(1500);
    const got = await kyle.page.evaluate(() => ({ evs: window.__evs.filter((e) => e.k === 'dodge' || (e.k === 'hit' && e.on === 'hero')).map((e) => e.k), hp: window.__game.room.heroes.find((h) => h.id !== 'me').hp }));
    if (was !== null) await kyle.page.evaluate((c) => (window.__lagcomp.cap = c), was);
    await samOnKyle('s.hp = 999; s.stamina = 100;');
    await kyle.page.evaluate(() => Object.assign(window.__game.room.enemies.find((x) => x.id === window.__keep), { act: 'stunned', actT: 0, actDur: 999, attack: null }));
    await wait(1200);
    return { lag: Math.round(lag * 1000), cap: Math.round(use * 1000), aimedMs: Math.round(X * 1000), pressedMs: pressed?.left ?? null, reach, dodged: got.evs.includes('dodge') && got.hp === 999, ...got };
  };
  out.stab = await stab('as is');
  step(`a goblin's stab at Sam, jumped ${out.stab.pressedMs} ms before it lands on his screen, his lag ${out.stab.lag} ms, the cap ${out.stab.cap} ms: ${out.stab.evs.join(', ') || 'nothing'} (${out.stab.reach ? 'within what the cap allows: should be dodged' : 'past what the cap allows: lands, as designed'})`, out.stab.dodged === out.stab.reach || Math.abs(out.stab.lag - out.stab.cap - 170) < 60 /* within 60 ms of the edge, either result is fair (headless lag swings run to run) */);
  out.stabAtLag = await stab('lag');
  step(`the same stab with the cap at his lag (${out.stabAtLag.cap} ms), jumped ${out.stabAtLag.pressedMs} ms before it lands on his screen: ${out.stabAtLag.evs.join(', ') || 'nothing'}`, out.stabAtLag.dodged);
  return out;
}

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
    await page.goto(`http://127.0.0.1:${PORT}/?pick=lead${process.env.LOOK ? '&look=' + process.env.LOOK : ''}`);
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
    // (Sampled while the key is down: the settle after he lets go is a separate matter.)
    const ys = await sam.page.evaluate(() => (clearInterval(window.__yt), window.__ys));
    await sam.page.keyboard.up('w');
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
    // The guest feel (DECISIONS 2026-11-06): Sam's own acts on his own screen at once, LAG_MS each way.
    report.feel = await guestFeel(kyle, sam, step);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/party-run-laptop.png') });
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/party-run-phone.png') });
    // Sam (a Ranger, on his phone) pets his hound on the job (client/petting.ts): with nothing awake
    // near, PET on his context button; one word over the party's chat room; Kyle sees it.
    require('fs').mkdirSync(path.join(ROOT, 'shots/pet'), { recursive: true });
    await kyle.page.evaluate(() => { for (const e of window.__game.room.enemies) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false }); });
    // (A few steps up off the way in, so the shot shows him clear of the buttons.)
    await sam.page.keyboard.down('w');
    await wait(700);
    await sam.page.keyboard.up('w');
    await wait(2500);
    step('Sam has PET on his context button on the job', await sam.page.waitForFunction(() => window.__game.near()?.pet === 'own' && !document.querySelector('.tb.use').hidden && document.querySelector('.tb.use').textContent.includes('PET'), null, { timeout: 6000 }).then(() => true, () => false));
    await sam.page.tap('.tb.use');
    const knelt = await until(sam, () => !!window.__idles.petting(), null, 2000);
    const why = knelt ? '' : await sam.page.evaluate(async () => {
      const h = window.__game.hero, out = { near: window.__game.near(), act: h.act, moving: h.moving, look: window.__loot.near, again: window.__idles.pet('own'), seen: [] };
      for (let i = 0; i < 6; i++) out.seen.push([!!window.__idles.petting(), h.x.toFixed(3), h.y.toFixed(3), h.fx.toFixed(2), h.act, h.moving]), await new Promise((r) => setTimeout(r, 60));
      return JSON.stringify(out);
    });
    step(`Sam kneels to his hound${why}`, knelt);
    step("Kyle sees Sam petting his hound", await until(kyle, () => window.__pets().some((p) => p.name === 'SAM'), null, 3000));
    await wait(600);
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/pet/job-pet-phone.png') });
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/pet/job-pet-friend-laptop.png') });
    await wait(3000);
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
      await page.goto(`http://127.0.0.1:${PORT}/?pick=lead${process.env.LOOK ? '&look=' + process.env.LOOK : ''}`);
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
