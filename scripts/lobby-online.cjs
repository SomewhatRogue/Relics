// Parties gathered in town, end to end: two players in their own browsers (Kyle on a laptop, Sam on a
// phone). Kyle posts a party and walks into the forge; Sam joins from the toast; Kyle's card shows him;
// Sam walks into the counting house; Kyle sets out from his card; both arrive in the job. Then: a member
// reloads and stays in, leaves, and the leader sees it; the leader reloads and the party's still up;
// the leader cancels; the leader goes to the yard; the leader's page dies and the party breaks up.
// Usage: node scripts/lobby-online.cjs   (builds with VITE_ONLINE unless NOBUILD=1; ONLINE_PORT, default 8791;
// screenshots into SHOTS, default shots/lobby)
const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT) || 8791;
const SHOTS = process.env.SHOTS || path.join(ROOT, 'shots/lobby');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
(async () => {
  const report = { ok: false, steps: [], errors: [] };
  fs.mkdirSync(SHOTS, { recursive: true });
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { LAG_MS: '150', ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    if (await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/`, (res) => (res.resume(), r(true))).on('error', () => r(false)))) break;
    await wait(200);
  }
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const load = async (p) => {
    const page = await p.ctx.newPage();
    page.on('pageerror', (e) => report.errors.push(`${p.name}: ${e}`));
    await page.goto(`http://127.0.0.1:${PORT}/`);
    await page.waitForFunction(() => window.__game);
    return page;
  };
  const open = async (name, cls, opts) => {
    const p = { name, ctx: await browser.newContext(opts) };
    p.page = await load(p);
    await p.page.evaluate(([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    return p;
  };
  /** Back after a reload: the same hero, the start screen put away. */
  const reload = async (p) => {
    await p.page.close();
    p.page = await load(p);
    await p.page.evaluate(() => { document.getElementById('title').hidden = true; window.__title.open = false; });
  };
  const step = (s, ok) => (report.steps.push({ s, ok: !!ok }), ok);
  const until = (p, fn, arg, ms = 8000) => p.page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const shot = (p, f) => p.page.screenshot({ path: path.join(SHOTS, f) });
  const goIn = (p, door) => p.page.evaluate((d) => window.__game.enter(window.__game.room.map.blocks.find((b) => b.door === d)), door);
  const post = async (p, i) => {
    await p.page.evaluate(() => window.__openSpot('board'));
    // (The board remembers the job last opened: only open it if it's shut.)
    if (!(await p.page.$(`#panel [data-gather="${i}"]`))) await p.page.click(`#panel [data-open="${i}"]`);
    await p.page.click(`#panel [data-gather="${i}"]`);
  };
  const joinFromBoard = async (p) => {
    await p.page.evaluate(() => window.__openSpot('board'));
    await until(p, () => !!document.querySelector('#panel [data-joinparty]'));
    await p.page.click('#panel [data-joinparty]');
    await p.page.evaluate(() => window.__panel.hide());
  };
  /** A card button: opened out first if it's shut (a phone). */
  const card = async (p, sel) => {
    if (await p.page.$('#partycard.shut')) await p.page.click('#partycard .pc-line');
    await p.page.click(`#partycard ${sel}`);
  };
  const has = (p, name) => until(p, (n) => !!window.__game.parties?.current()?.members.some((m) => m[1] === n), name);
  const toast = (p, text, ms) => until(p, (t) => [...document.querySelectorAll('.ptoast')].some((x) => x.textContent.includes(t)), text, ms);
  try {
    const kyle = await open('KYLE', 'WARRIOR', { viewport: { width: 1280, height: 800 } });
    const sam = await open('SAM', 'RANGER', PHONE);
    step('they see each other in town', await until(sam, () => window.__town().here.some((h) => h.name === 'KYLE')));

    // 1. Kyle posts and walks off; Sam joins from the toast; Kyle sets out from the card; both go.
    await post(kyle, 1);
    step('GATHER A PARTY closes the board', await until(kyle, () => !window.__panel.open));
    step("Kyle's card is up, open on a laptop", await until(kyle, () => !document.querySelector('#partycard').hidden && !!document.querySelector('#partycard.open [data-setout]')));
    await goIn(kyle, 'forge');
    step('Kyle walks into the forge, the party still up', await until(kyle, () => window.__GAME_STATE__().inside === 'THE FORGE' && window.__game.parties.leading));
    step('Sam gets a toast: KYLE is gathering', await toast(sam, 'KYLE is gathering for'));
    await shot(sam, 'phone-join-toast.png');
    await sam.page.click('.ptoast.posted [data-act]');
    step("Sam joins from the toast and is in Kyle's party", await has(sam, 'SAM') && await toast(sam, "You're in KYLE's party"));
    step("Kyle's toast: SAM joined your party", await toast(kyle, 'SAM joined your party'));
    step("Kyle's card lists SAM, 2/4", await until(kyle, () => /SAM/.test(document.querySelector('#partycard ul')?.textContent) && document.querySelector('#partycard .slots').textContent === '2/4'));
    await shot(kyle, 'laptop-host-in-forge.png');
    await kyle.page.evaluate(() => window.__openSpot('smith'));
    await wait(400);
    await shot(kyle, 'laptop-host-in-shop.png');
    step("Sam's card is one line on the phone", await until(sam, () => !!document.querySelector('#partycard.shut')));
    await shot(sam, 'phone-card-shut.png');
    await sam.page.click('#partycard .pc-line');
    step('tapped, it opens: names and LEAVE', await until(sam, () => !!document.querySelector('#partycard.open [data-quit]') && /KYLE/.test(document.querySelector('#partycard ul').textContent)));
    await shot(sam, 'phone-card-open.png');
    await goIn(sam, 'bank');
    await sam.page.evaluate(() => window.__openSpot('bank'));
    step('Sam walks into the counting house and opens the vault', await until(sam, () => window.__GAME_STATE__().inside === 'THE COUNTING HOUSE' && window.__panel.open));
    await wait(300);
    await shot(sam, 'phone-in-vault-card.png');
    await card(kyle, '[data-setout]');
    step('Sam gets the setting-out beat, his vault closed', await until(sam, () => document.querySelector('#panel h2')?.textContent === 'SETTING OUT'));
    await shot(sam, 'phone-setting-out.png');
    step('Kyle sets out', await until(kyle, () => window.__game.mode === 'run', null, 10000));
    step("Sam is pulled into Kyle's job from indoors", await until(sam, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === 'me') && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 15000));
    step("Kyle's room has Sam in it", await until(kyle, () => window.__game.room.heroes.some((h) => h.tag === 'SAM'), null, 10000));
    step('no card on a job', await until(sam, () => document.querySelector('#partycard').hidden));
    await kyle.page.evaluate(() => window.__game.endForTest(true));
    step('both home', await until(sam, () => window.__game.mode === 'town', null, 10000) && await until(kyle, () => window.__game.mode === 'town'));
    await sam.page.evaluate(() => window.__panel.hide());
    await kyle.page.evaluate(() => window.__panel.hide());

    // 2. A member reloads and stays in; then leaves, and the leader is told.
    await post(kyle, 2);
    await joinFromBoard(sam);
    step('Sam joins from the board', await has(kyle, 'SAM'));
    await kyle.page.click('#partycard .pc-line');
    step('a laptop card shuts to one line on a click', await until(kyle, () => !!document.querySelector('#partycard.shut')));
    await shot(kyle, 'laptop-card-shut.png');
    await kyle.page.click('#partycard .pc-line');
    await reload(sam);
    step('Sam reloads and is still in the party', await has(sam, 'SAM') && await has(kyle, 'SAM'));
    await wait(1500);
    step("Kyle wasn't told Sam left", !(await kyle.page.evaluate(() => [...document.querySelectorAll('.ptoast')].some((x) => x.textContent.includes('SAM left')))));
    await card(sam, '[data-quit]');
    step('Sam leaves; Kyle gets "SAM left"', await toast(kyle, 'SAM left'));
    await shot(kyle, 'laptop-left-toast.png');
    step("Kyle's card is back to 1/4", await until(kyle, () => document.querySelector('#partycard .slots')?.textContent === '1/4'));

    // 3. The leader reloads: the party's still up, Sam still in it; then the leader cancels.
    await joinFromBoard(sam);
    await has(kyle, 'SAM');
    await reload(kyle);
    step('Kyle reloads: his party is back, Sam in it', await until(kyle, () => window.__game.parties?.leading) && await has(kyle, 'SAM'));
    step("Sam's still in it", await has(sam, 'SAM'));
    await card(kyle, '[data-quit]');
    step('Kyle cancels; Sam is told', await toast(sam, 'KYLE called the party off'));
    step("Sam's card is gone", await until(sam, () => document.querySelector('#partycard').hidden));

    // 4. The leader leaves Wickhold for the yard: the party comes down.
    await post(kyle, 1);
    await joinFromBoard(sam);
    await has(kyle, 'SAM');
    await kyle.page.evaluate(() => window.__game.enterYard());
    step('Kyle goes to the yard; Sam is told', await toast(sam, 'KYLE called the party off'));
    await kyle.page.evaluate(() => window.__game.enterTown());

    // 5. The leader's page dies: past the grace the party breaks up.
    await post(kyle, 1);
    await joinFromBoard(sam);
    await has(kyle, 'SAM');
    await kyle.page.close();
    await wait(5000);
    step('a few seconds on, Sam is still waiting in it', await sam.page.evaluate(() => !!window.__game.parties.joined));
    const broke = await toast(sam, "KYLE's party broke up", 30000);
    step("past the grace, Sam's told the party broke up", broke);
    if (!broke) report.errors.push('sam: ' + JSON.stringify(await sam.page.evaluate(() => ({ joined: window.__game.parties.joined, town: window.__town(), toasts: [...document.querySelectorAll('.ptoast')].map((x) => x.textContent), mode: window.__game.mode }))));
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
