// What every stress scenario needs: players in their own browsers, a party gathered at the board and
// set out, a page hidden or frozen the way a phone does it, and checks that wait for something true.
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LAPTOP = { viewport: { width: 1280, height: 800 } };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

// A page out of sight in Chrome runs its timers at most once a second: so do ours, when hidden. A
// page a phone has suspended (`__frozen`) runs nothing at all: timers, frames and the socket's news
// wait until it thaws, then come all at once.
const PHONE_OS = () => {
  const held = [], later = (fn) => (...a) => (window.__frozen ? held.push(() => fn(...a)) : fn(...a));
  window.__thaw = () => { window.__frozen = false; held.splice(0).forEach((f) => f()); };
  const si = window.setInterval.bind(window), st = window.setTimeout.bind(window), raf = window.requestAnimationFrame.bind(window);
  window.setInterval = (fn, ms, ...a) => {
    let ran = 0;
    return si(() => {
      if (window.__frozen) return;
      if (document.hidden && (ms ?? 0) < 1000) {
        const n = performance.now();
        if (n - ran < 1000) return;
        ran = n;
      }
      fn(...a);
    }, ms);
  };
  window.setTimeout = (fn, ms, ...a) => st(later(fn), ms, ...a);
  window.requestAnimationFrame = (fn) => raf(later(fn));
  const WS = window.WebSocket;
  window.WebSocket = class extends WS {
    // (`__route`, set by a scenario: rewrites a relay URL, to pick its instance or hold it back.)
    constructor(url, p) { super(window.__route ? window.__route(String(url)) : url, p); }
    set onmessage(f) { super.onmessage = f && later(f); }
    set onclose(f) { super.onclose = f && later(f); }
    set onopen(f) { super.onopen = f && later(f); }
    send(d) { if (!window.__frozen) super.send(d); }
  };
};

function kit(browser, port, report) {
  let scene = '';
  const step = (s, ok, extra) => (report.steps.push({ scene, s, ok: !!ok, ...(extra !== undefined ? { got: extra } : {}) }), !!ok);
  const until = (p, fn, arg, ms = 8000) => p.page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const ev = (p, fn, arg) => p.page.evaluate(fn, arg);
  const watch = (p) => p.page.on('pageerror', (e) => report.errors.push(`${scene} ${p.name}: ${e}`));

  async function open(name, cls, phone = false) {
    const ctx = await browser.newContext(phone ? PHONE : LAPTOP);
    await ctx.addInitScript(PHONE_OS);
    const p = { name, ctx, page: await ctx.newPage(), phone };
    watch(p);
    await p.page.goto(`http://127.0.0.1:${port}/`);
    await p.page.waitForFunction(() => window.__game);
    await ev(p, ([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    p.id = await ev(p, () => window.__game.profile.id);
    return p;
  }

  /** `lead` gathers a party for the first job on the board, the rest join, and they set out. */
  async function party(lead, ...rest) {
    await ev(lead, () => window.__openSpot('board'));
    await lead.page.click('#panel [data-open="1"]');
    await lead.page.click('#panel [data-gather="1"]');
    for (const p of rest) {
      await ev(p, () => window.__openSpot('board'));
      await until(p, () => !!document.querySelector('#panel [data-joinparty]'));
      await p.page.click('#panel [data-joinparty]');
      await until(lead, (n) => document.querySelector('#panel .job.party .m')?.textContent.includes(n), p.name);
    }
    await lead.page.click('#panel [data-setout]');
    let ok = await until(lead, () => window.__game.mode === 'run');
    for (const p of rest) ok = (await until(p, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === 'me') && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 15000)) && ok;
    ok = (await until(lead, (n) => window.__game.room.heroes.length >= n, rest.length + 1)) && ok;
    return step(`${[lead, ...rest].map((p) => p.name).join(', ')} set out together`, ok);
  }

  /** Who is in charge on this page: 'lead', 'follow:<leader id>', 'town', or what's wrong. */
  const role = (p) => ev(p, () => { const g = window.__game; return g.mode !== 'run' ? g.mode : g.coop && !g.remote ? 'lead' : g.remote && !g.coop ? 'follow:' + g.remote.lead : 'both'; });
  /** The goblins still standing, by id, as this page has them. */
  const alive = (p) => ev(p, () => window.__game.room.enemies.filter((e) => e.hp > 0 && e.act !== 'dead').map((e) => e.id).sort().join(','));
  /** Every goblin in the room dead (on the page that runs the room), so nothing interferes. */
  const clear = (p) => ev(p, () => { for (const e of window.__game.room.enemies) Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false }); });
  /** Put a hero (`id` as the leader's room has it) somewhere, on the leader's page. */
  const put = (lead, id, x, y) => ev(lead, ([id, x, y]) => Object.assign(window.__game.room.heroes.find((h) => h.id === id), { x, y, kvx: 0, kvy: 0 }), [id, x, y]);
  /** The way on in the leader's room. */
  const exitAt = (lead) => ev(lead, () => { const m = window.__game.room.map, a = m.exit ?? m.roads[0].area; return { x: a.x + a.w / 2, y: a.y + 0.4 }; });
  /** Down (on the leader's page), as if just hit to nothing; `bled`: already lain there that long. */
  const down = (lead, id, bled = 0, selfUp) => ev(lead, ([id, bled, selfUp]) => {
    const h = window.__game.room.heroes.find((x) => x.id === id);
    Object.assign(h, { hp: 0, act: 'down', actT: bled, actDur: bled ? Infinity : 9, bleeding: !!bled, kvx: 0, kvy: 0 }, selfUp === undefined ? {} : { selfUp });
  }, [id, bled, selfUp]);
  const hero = (p, id) => ev(p, (id) => { const h = window.__game.room.heroes.find((x) => x.id === id); return h && { act: h.act, out: !!h.out, selfUp: !!h.selfUp, bleeding: !!h.bleeding, x: h.x, y: h.y }; }, id);

  /** The LEAVE button, then LEAVE in the panel it asks with. */
  async function leave(p) {
    await p.page.click('#leave');
    await p.page.click('#panel button[data-i="0"]');
  }
  /** Back in town with the job's result up. */
  const home = (p, title = 'DRIVEN BACK', ms = 8000) => until(p, (t) => window.__game.mode === 'town' && window.__panel.open && document.querySelector('#panel h2')?.textContent === t, title, ms);

  /** Out of sight (another tab, the phone locked): no frames; timers once a second. */
  const hide = (p, hidden = true) => ev(p, (hidden) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  /** A phone that suspended the page outright: nothing runs at all until it thaws. */
  const freeze = (p, frozen = true) => ev(p, (frozen) => (frozen ? (window.__frozen = true) : window.__thaw()), frozen);
  async function reload(p) {
    await p.page.reload();
    await p.page.waitForFunction(() => window.__game);
    await ev(p, () => { document.getElementById('title').hidden = true; window.__title.open = false; });
  }

  /**
   * The leader takes the party through the rest of the job: each room cleared and everyone standing
   * (who can) in the way out, the last room won. Returns false if a room wouldn't let them on.
   */
  async function finish(lead, rest = []) {
    const rooms = await ev(lead, () => window.__game.run.job.rooms);
    for (let r = await ev(lead, () => window.__game.run.index); r < rooms; r++) {
      const key = await ev(lead, () => window.__game.roomKey);
      await clear(lead);
      if (r === rooms - 1) return ev(lead, () => (window.__game.endForTest(true), true));
      // (Only the players still at their screens walk there: anyone else's hero stays where it is.)
      await ev(lead, (ids) => { const g = window.__game, x = g.room.map.exit ?? g.room.map.roads[0].area; for (const h of g.room.heroes) if (h.act !== 'down' && ids.includes(h.id)) Object.assign(h, { x: x.x + x.w / 2, y: x.y + 0.4 }); }, ['me', ...rest.map((p) => p.id)]);
      if (!(await until(lead, (key) => window.__game.roomKey > key, key))) return false;
      for (const p of rest) if (!(await until(p, (i) => window.__game.run?.index === i, r + 1))) return false;
    }
    return true;
  }

  return { set scene(s) { scene = s; }, step, until, ev, open, party, role, alive, clear, put, exitAt, down, hero, leave, home, hide, freeze, reload, finish, wait, ROOT };
}

module.exports = { kit, wait };
