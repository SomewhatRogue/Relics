// The Rogue's look, before and after. Usage: node scripts/rogue-look.cjs <url> <outdir> <tag> [town,sheet]
// town:  phone shots (390x844 at 3x), FLAT and 2.5D: the Rogue idle in town, walking, dashing, attacking with
//        the daggers and with the blowpipe, and beside a Warrior and a Ranger; each also cropped round the hero.
// sheet: a contact sheet of every pose drawn by the game's own drawHero (window.__heroArt), 5x nearest.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const [url = 'http://localhost:4621/', out = 'shots/rogue', tag = 'after', what = 'town,sheet'] = process.argv.slice(2);
const go = (q) => url + (url.includes('?') ? '&' : '?') + q;
fs.mkdirSync(out, { recursive: true });

// In the page: the room stopped, the Rogue posed (and friends beside it for scale).
const POSE = ([pose]) => {
  const r = window.__room, me = r.heroes[0];
  r.advance = () => [];
  r.prev && r.prev.clear && r.prev.clear();
  r.heroes = [me];
  // Down into the square, off the map's top edge, so the camera has the hero in the middle of the screen.
  if (!window.__rogueAt) window.__rogueAt = { x: me.x, y: me.y + 6 };
  Object.assign(me, window.__rogueAt);
  Object.assign(me, { weapon: 'daggers', look: 0, act: 'idle', actT: 0, moving: false, fx: 0, fy: 1, blocking: false, heavy: false, combo: 0, hp: 100 });
  if (pose === 'walk') Object.assign(me, { moving: true, fx: 1, fy: 0.15 });
  if (pose === 'dash') Object.assign(me, { act: 'roll', actT: 0.1, rollDx: 1, rollDy: 0.1, fx: 1, fy: 0.1 });
  if (pose === 'daggers') Object.assign(me, { act: 'attack', actT: 0.08, combo: 0, fx: 1, fy: 0.2 });
  if (pose === 'blowpipe') Object.assign(me, { weapon: 'poisoner', act: 'charge', actT: 0.5, fx: 1, fy: 0.1 });
  if (pose === 'scale') {
    const add = (id, w, dx) => r.heroes.push({ ...me, id, tag: id.toUpperCase(), weapon: w, look: 0, x: me.x + dx, fx: 0, fy: 1 });
    add('bram', 'sword', -1.4);
    add('maeve', 'longbow', 1.4);
  }
};

// A watchdog: a hung page never holds the shared lock for long.
setTimeout(() => (console.log('timed out'), process.exit(2)), 240000).unref();
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const open = async (opts, u) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(u);
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    return { ctx, page };
  };
  const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  if (what.includes('town')) {
    for (const look of ['flat', '3d']) {
      const { ctx, page } = await open(PHONE, go('look=' + look + '&hero=ROGUE'));
      await page.waitForTimeout(1200);
      for (const pose of ['idle', 'walk', 'dash', 'daggers', 'blowpipe', 'scale']) {
        await page.evaluate(POSE, [pose]);
        await page.waitForTimeout(pose === 'idle' ? 1500 : pose === 'walk' ? 700 : 250);
        const file = path.join(out, `${tag}-${look}-${pose}.png`);
        await page.screenshot({ path: file });
      }
      await ctx.close();
    }
  }
  if (what.includes('sheet')) {
    const { ctx, page } = await open({ viewport: { width: 1400, height: 1000 } }, go('hero=WARRIOR'));
    const F = (label, s) => ({ label, s: { cls: 'ROGUE', look: 0, now: 1.0, ...s } });
    const side = { fx: 1, fy: 0.1 };
    const frames = [
      F('stand', { hero: { fx: 0, fy: 1 } }), F('stand side', { hero: side }), F('breath', { now: 0.4, hero: side }),
      F('walk 1', { now: 1.07, hero: { ...side, moving: true }, warm: 1 }), F('walk 2', { now: 1.2, hero: { ...side, moving: true }, warm: 1 }),
      F('walk 3', { now: 1.33, hero: { ...side, moving: true }, warm: 1 }), F('walk down', { now: 1.1, hero: { fx: 0, fy: 1, moving: true }, warm: 1 }),
      F('walk away', { now: 1.2, hero: { fx: 0.1, fy: -1, moving: true }, warm: 1 }), F('dash', { hero: { ...side, act: 'roll', actT: 0.1, rollDx: 1, rollDy: 0.1 } }),
      F('dash down', { hero: { fx: 0, fy: 1, act: 'roll', actT: 0.1, rollDx: 0, rollDy: 1 } }), F('land', { t: 1.3, hero: { ...side, lastRollAt: 1.0 } }),
      F('daggers 1', { hero: side, swing: 0.5 }), F('daggers 2', { hero: { ...side, combo: 1 }, swing: 0.5 }), F('daggers stab', { hero: { ...side, combo: 3 }, swing: 0.5 }),
      F('dagger throw', { hero: { ...side, act: 'charge', actT: 0.6 } }), F('rapier', { hero: { ...side, weapon: 'rapier' }, swing: 0.5 }),
      F('rapier lunge', { hero: { ...side, weapon: 'rapier', act: 'charge', actT: 0.5 } }), F('short sword', { hero: { ...side, weapon: 'poisoner' }, swing: 0.5 }),
      F('blowpipe', { hero: { ...side, weapon: 'poisoner', act: 'charge', actT: 0.5 } }), F('poisoner rest', { hero: { fx: 0, fy: 1, weapon: 'poisoner' } }),
      F('rapier rest', { hero: { fx: 0, fy: 1, weapon: 'rapier' } }), F('hurt', { hero: { ...side, act: 'hurt', actT: 0.04, kvx: -3, kvy: 0 } }),
      F('stun', { hero: { ...side, act: 'stun', actT: 0.2 } }), F('down', { hero: { act: 'down', actT: 0.5, actDur: 3 } }),
      F('crouch', { hero: { ...side, stoop: true } }), F('carry', { hero: { ...side, act: 'carry', moving: true }, warm: 1 }),
      F('shadowstep', { hero: { ...side, act: 'throw', actT: 0.04, signing: true } }), F('vanish', { hero: { ...side, vanishUntil: 9 } }),
      F('idle flip', { idle: { id: 'g_flip', t: 0.7 }, hero: { fx: 0, fy: 1 } }), F('idle coin', { idle: { id: 'g_coin', t: 0.8 }, hero: { fx: 0, fy: 1 } }),
      F('idle glance', { idle: { id: 'g_glance', t: 2.0 }, hero: { fx: 0, fy: 1 } }), F('idle fumble', { idle: { id: 'g_fumble', t: 1.4 }, hero: { fx: 0, fy: 1 } }),
      F('dial red', { now: 2.3, hero: { fx: 0, fy: 1, dial: -1 } }), F('dial gold', { now: 2.3, hero: { fx: 0, fy: 1, dial: 1 } }),
      F('cutpurse', { look: 1, hero: { fx: 0, fy: 1 } }), F('cutpurse walk', { look: 1, now: 1.2, hero: { ...side, moving: true }, warm: 1 }),
      F('night', { look: 2, hero: { fx: 0, fy: 1 } }), F('night walk', { look: 2, now: 1.2, hero: { ...side, moving: true }, warm: 1 }),
      { label: 'warrior', s: { cls: 'WARRIOR', hero: { fx: 0, fy: 1 } } }, { label: 'ranger', s: { cls: 'RANGER', hero: { fx: 0, fy: 1 } } },
    ];
    const urls = [];
    for (const { label, s } of frames) {
      process.stdout.write(label + ' | ');
      urls.push(await page.evaluate((s) => {
        // Moving cloth eases (a walk's trail, a dash's flare): draw a few frames first so it has settled.
        for (let k = 12; k > 0; k--) window.__heroArt({ ...s, now: s.now - k * 0.05 }, 40, 40);
        return window.__heroArt(s, 40, 40);
      }, s).catch((e) => (errors.push(label + ': ' + e), '')));
    }
    const png = await page.evaluate(async ([frames, urls]) => {
      const S = 5, W = 40, H = 40, cols = 8, rows = Math.ceil(frames.length / cols), cw = W * S, ch = H * S + 16;
      const sheet = document.createElement('canvas');
      (sheet.width = cols * cw), (sheet.height = rows * ch);
      const g = sheet.getContext('2d');
      g.imageSmoothingEnabled = false;
      for (let i = 0; i < frames.length; i++) {
        const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
        g.fillStyle = (i + Math.floor(i / cols)) % 2 ? '#3a3844' : '#34323c';
        g.fillRect(x, y, cw, ch);
        if (urls[i]) {
          const img = new Image();
          await new Promise((r) => ((img.onload = r), (img.onerror = r), (img.src = urls[i])));
          g.drawImage(img, x, y, W * S, H * S);
        }
        g.fillStyle = '#e8e0c8';
        g.font = '13px monospace';
        g.fillText(frames[i].label, x + 6, y + H * S + 12);
      }
      return sheet.toDataURL();
    }, [frames, urls]);
    fs.writeFileSync(path.join(out, `${tag}-sheet.png`), Buffer.from(png.split(',')[1], 'base64'));
    await ctx.close();
  }
  console.log(tag, 'errors', JSON.stringify(errors.slice(0, 8)));
  await browser.close();
})();
