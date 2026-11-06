// Chat end to end: two players (Kyle on a phone, Sam on a laptop) on different relay instances.
// In town: a world line reaches the other; a NEAR line only when they stand close (and then as a
// bubble, world lines too); typing never moves the hero; a muted player goes unheard. On a job together: the party
// hears each other's quick lines and typed lines, as bubbles. Screenshots of each into SHOTS.
// Usage: node scripts/chat-online.cjs   (builds with VITE_ONLINE unless NOBUILD; ONLINE_PORT or PORT, default 8795)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT ?? process.env.PORT) || 8795;
const SHOTS = process.env.SHOTS || path.join(ROOT, 'shots');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const report = { ok: false, steps: [], errors: [] };
  fs.mkdirSync(SHOTS, { recursive: true });
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
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
    await page.goto(`http://127.0.0.1:${PORT}/?pick=lead${process.env.LOOK ? '&look=' + process.env.LOOK : ''}`);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    return { name, ctx, page };
  };
  const step = (s, ok) => (report.steps.push({ s, ok: !!ok }), ok);
  const until = (p, fn, arg, ms = 8000) => p.page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const logHas = (p, bit, ms) => until(p, (bit) => window.__chat.log().some((l) => l.includes(bit)), bit, ms);
  const shot = (p, name) => p.page.screenshot({ path: path.join(SHOTS, name) });
  /** Put a hero at (x, y) tiles and keep it there a moment, so the town hears where it is. */
  const place = (p, x, y) => p.page.evaluate(([x, y]) => Object.assign(window.__game.hero, { x, y }), [x, y]);
  try {
    const kyle = await open('KYLE', 'RANGER', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const sam = await open('SAM', 'WARRIOR', { viewport: { width: 1280, height: 800 } });
    step('they see each other in town', await until(kyle, () => window.__town().here.some((h) => h.name === 'SAM')) && await until(sam, () => window.__town().here.some((h) => h.name === 'KYLE')));
    step('chat is on in town', await until(kyle, () => window.__chat.where() === 'town') && await until(sam, () => window.__chat.where() === 'town'));
    const k0 = await kyle.page.evaluate(() => ({ x: window.__game.hero.x, y: window.__game.hero.y }));
    // Sam far off: a world line reaches Kyle, typed for real (Enter, the words, Enter), and the
    // letters typed (w, a, s, d among them) never move Sam's hero.
    await place(sam, k0.x + 14, k0.y);
    await wait(800);
    const s0 = await sam.page.evaluate(() => ({ x: window.__game.hero.x, y: window.__game.hero.y }));
    await sam.page.keyboard.press('Enter');
    step('Enter opens the box on a laptop', await until(sam, () => document.body.classList.contains('chat-open') && document.activeElement?.tagName === 'INPUT'));
    await sam.page.keyboard.type('Who wants the mill job? Ask Dunn', { delay: 25 });
    const s1 = await sam.page.evaluate(() => ({ x: window.__game.hero.x, y: window.__game.hero.y }));
    step(`typing never moves the hero (${s0.x.toFixed(2)},${s0.y.toFixed(2)} to ${s1.x.toFixed(2)},${s1.y.toFixed(2)})`, Math.hypot(s1.x - s0.x, s1.y - s0.y) < 0.01);
    await sam.page.keyboard.press('Enter');
    step("Kyle hears Sam's world line", await logHas(kyle, 'Who wants the mill job? Ask Dunn'));
    step('a world line floats over Sam too', await until(kyle, () => window.__chat.bubbles().includes('Who wants the mill job? Ask Dunn')));
    // A NEAR line from far off: not heard.
    await wait(1700);
    await sam.page.evaluate(() => window.__chat.say('Anyone near the well?', 'local'));
    await wait(1500);
    step('a NEAR line from 14 tiles off is not heard', !(await kyle.page.evaluate(() => window.__chat.log().some((l) => l.includes('near the well')))));
    // Close by: heard, as a bubble over Sam.
    await place(sam, k0.x + 2.5, k0.y + 0.5);
    await until(kyle, (x) => Math.abs((window.__town().here.find((h) => h.name === 'SAM')?.x ?? 0) - x) < 0.3, k0.x + 2.5);
    await sam.page.evaluate(() => window.__chat.say('Mind the guard, he bites.', 'local'));
    step('a NEAR line from close by is heard', await logHas(kyle, 'local SAM: Mind the guard, he bites.'));
    step('and floats over Sam', await until(kyle, () => window.__chat.bubbles().includes('Mind the guard, he bites.')));
    await wait(250);
    await shot(kyle, 'phone-town-bubble-peek.png');
    await shot(sam, 'laptop-town-bubble.png');
    // Kyle answers from the phone's panel: CHAT, type, SAY.
    await kyle.page.tap('#chatbtn');
    step("the phone's CHAT opens the panel", await until(kyle, () => document.body.classList.contains('chat-open')));
    await kyle.page.fill('#chat input', 'I know. He had my thumb last week.');
    await kyle.page.tap('#chat .say');
    step('Sam hears Kyle', await logHas(sam, 'I know. He had my thumb last week.'));
    await wait(300);
    await shot(kyle, 'phone-chat-panel.png');
    const k1 = await kyle.page.evaluate(() => ({ x: window.__game.hero.x, y: window.__game.hero.y }));
    step('the hero stands still with the panel open', Math.hypot(k1.x - k0.x, k1.y - k0.y) < 0.01);
    await kyle.page.tap('#chat .shut');
    await shot(sam, 'laptop-town-log.png');
    await sam.page.keyboard.press('Enter');
    await wait(200);
    await shot(sam, 'laptop-town-box-open.png');
    await sam.page.keyboard.press('Escape');
    // Mute: Sam taps Kyle's name; Kyle's next line never shows for Sam.
    await sam.page.keyboard.press('Enter');
    await sam.page.click('#chatlog b[data-who]');
    step('Sam mutes Kyle', await logHas(sam, 'is muted on this device'));
    await sam.page.keyboard.press('Escape');
    await wait(1700);
    await kyle.page.evaluate(() => window.__chat.say('Can you hear me?', 'world'));
    await wait(1500);
    step('a muted player goes unheard', !(await sam.page.evaluate(() => window.__chat.log().some((l) => l.includes('Can you hear me')))));
    await sam.page.evaluate(() => localStorage.removeItem('relic.mute'));
    await sam.page.keyboard.press('Enter');
    await sam.page.click('#chatlog .note b[data-who]');
    await sam.page.keyboard.press('Escape');
    // On a job together: Kyle leads from his phone.
    await kyle.page.evaluate(() => window.__openSpot('board'));
    await kyle.page.click('#panel [data-open="1"]');
    await kyle.page.click('#panel [data-gather="1"]');
    await sam.page.evaluate(() => window.__openSpot('board'));
    await until(sam, () => !!document.querySelector('#panel [data-joinparty]'));
    await sam.page.click('#panel [data-joinparty]');
    await until(kyle, () => !!window.__game.parties?.current()?.members.some((m) => m[1] === 'SAM'));
    await kyle.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await kyle.page.click('#partycard [data-setout]');
    step('on the job together', await until(sam, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 12000));
    step('party chat is on for both', await until(kyle, () => window.__chat.where() === 'party') && await until(sam, () => window.__chat.where() === 'party'));
    await wait(1500); // (the party's chat room opening)
    await kyle.page.tap('#chatbtn');
    step('on a job the phone opens the quick lines', await until(kyle, () => document.body.classList.contains('chat-quick')));
    await shot(kyle, 'phone-job-quick.png');
    await kyle.page.tap('#chat .quick button:nth-child(6)');
    step("Sam hears Kyle's quick line", await logHas(sam, 'party KYLE: Over here!'));
    step('as a bubble over Kyle', await until(sam, () => window.__chat.bubbles().includes('Over here!')));
    await wait(250);
    await shot(sam, 'laptop-job-bubble.png');
    await sam.page.keyboard.press('Enter');
    await sam.page.keyboard.press('Digit3');
    step('a number key says a quick line from the laptop', await logHas(kyle, 'party SAM: Wait.'));
    await wait(1700);
    await sam.page.keyboard.press('Enter');
    await sam.page.keyboard.type('Two on the left, one with a bow', { delay: 15 });
    await sam.page.keyboard.press('Enter');
    step("Kyle hears Sam's typed party line, over Sam's head", await logHas(kyle, 'Two on the left, one with a bow') && await until(kyle, () => window.__chat.bubbles().includes('Two on the left, one with a bow')));
    await wait(250);
    await shot(kyle, 'phone-job-bubble.png');
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
