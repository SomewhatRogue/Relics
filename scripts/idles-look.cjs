// The heroes' idles (client/idles.ts) and petting in the lodge (client/petting.ts), to look at.
// Usage: node scripts/idles-look.cjs <url> <outdir>
// sheet: every class's idles and rare one, frames across each, drawn by the game's own drawHero
//        (window.__heroArt), at 4x: <outdir>/idles-sheet.png. Rows for other weapons where it changes.
// phone: the Ranger playing fetch with the hound in town, and petting it in the hunters' lodge.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const [url = 'http://localhost:4421/', out = 'shots'] = process.argv.slice(2);
const go = (q) => url + (url.includes('?') ? '&' : '?') + q;
const save = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
const IDLES = {
  WARRIOR: [['sword', 'w_stretch', 3.4], ['sword', 'w_edge', 3.6], ['greatsword', 'w_edge', 3.6], ['sword', 'w_lean', 4.6], ['greatsword', 'w_plant', 4.6], ['spear', 'w_plant', 4.6], ['spear', 'w_shoulder', 4], ['sword', 'w_yawn', 4.6, 1]],
  RANGER: [['longbow', 'r_fetch', 6.2], ['crossbow', 'r_fetch', 6.2], ['longbow', 'r_ruffle', 3.8], ['shortbow', 'r_scan', 5.2], ['longbow', 'r_tackle', 6, 1]],
  ROGUE: [['daggers', 'g_flip', 3], ['rapier', 'g_flip', 3], ['daggers', 'g_coin', 2.8], ['poisoner', 'g_glance', 3.2], ['daggers', 'g_fumble', 3.8, 1]],
  MAGE: [['wand', 'm_read', 5.2], ['wand', 'm_sparks', 3], ['staff', 'm_sparks', 3], ['spellblade', 'm_sparks', 3], ['wand', 'm_brim', 2.8], ['wand', 'm_flop', 3.8, 1]],
  HEALER: [['mace', 'c_censer', 4.2], ['mace', 'c_pray', 4.4], ['mace', 'c_polish', 3.8], ['flail', 'c_polish', 3.8], ['censer', 'c_polish', 3.8], ['mace', 'c_sneeze', 3.6, 1]],
};
const N = 8, W = 112, H = 52, K = 4, LABEL = 120;

(async () => {
  fs.mkdirSync(out, { recursive: true });
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
  {
    const { ctx, page } = await open({ viewport: { width: 800, height: 600 } }, go('hero=WARRIOR'));
    const rows = [];
    for (const [cls, list] of Object.entries(IDLES)) for (const [weapon, id, dur, rare] of list) rows.push({ cls, weapon, id, dur, rare });
    rows.push({ cls: 'RANGER', weapon: 'longbow', id: 'pet', dur: 2.6 });
    const sheet = await page.evaluate(async ({ rows, N, W, H, K, LABEL }) => {
      const cv = document.createElement('canvas');
      cv.width = LABEL + N * W * K;
      cv.height = rows.length * H * K;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.fillStyle = '#20242c';
      g.fillRect(0, 0, cv.width, cv.height);
      const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        g.fillStyle = r % 2 ? '#262b34' : '#2c323c';
        g.fillRect(0, r * H * K, cv.width, H * K);
        g.fillStyle = row.rare ? '#ffd27a' : '#d8dce4';
        g.font = '20px monospace';
        g.fillText(row.cls, 8, r * H * K + 40);
        g.fillText(row.id + (row.rare ? ' (rare)' : ''), 8, r * H * K + 70);
        g.fillStyle = '#9aa3ad';
        g.fillText(row.weapon, 8, r * H * K + 100);
        for (let i = 0; i < N; i++) {
          const t = (row.dur * (i + 0.5)) / N;
          const spec = { cls: row.cls, look: 0, now: 10 + t, hero: { fx: 1, fy: 0.15, weapon: row.weapon }, hound: row.cls === 'RANGER' };
          if (row.id === 'pet') spec.pet = t;
          else spec.idle = { id: row.id, t };
          const img = await load(await window.__heroArt(spec, W, H));
          g.drawImage(img, LABEL + i * W * K, r * H * K, W * K, H * K);
          g.fillStyle = '#6a7280';
          g.font = '14px monospace';
          g.fillText(t.toFixed(1) + 's', LABEL + i * W * K + 6, r * H * K + 18);
        }
      }
      return cv.toDataURL();
    }, { rows, N, W, H, K, LABEL });
    save(path.join(out, 'idles-sheet.png'), sheet);
    await ctx.close();
  }
  const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  {
    // Fetch in the square: the stick out and the hound after it, then bringing it back.
    const { ctx, page } = await open(PHONE, go('hero=RANGER'));
    await page.waitForTimeout(1500);
    // Into the square by the lamp, the hound with them, facing the open side.
    await page.evaluate(() => {
      const g = window.__game, h = g.hero;
      Object.assign(h, { x: 22.4, y: 16.6, fx: 1, fy: 0.2 });
      if (h.hound) Object.assign(h.hound, { x: 21.3, y: 16.8 });
      g.room.prev && g.room.prev.clear();
    });
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.__idles.force('r_fetch'));
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(out, 'phone-fetch-town.png') });
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(out, 'phone-fetch-town-back.png') });
    console.log('town', await page.evaluate(() => ({ mode: window.__game.mode, x: window.__game.hero.x, y: window.__game.hero.y, hound: window.__game.hero.hound && window.__game.hero.hound.state })));
    // Into the lodge: to a quiet corner, the hound comes to heel, USE (PET) and the hearts.
    await page.evaluate(() => {
      const g = window.__game, b = g.room.map.blocks.find((x) => x.door === 'lodge');
      g.enter(b);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const h = window.__game.hero; Object.assign(h, { x: 2.2, y: 6.4, fx: 1, fy: 0 }); });
    await page.waitForTimeout(2500);
    const label = await page.evaluate(() => ({ near: window.__game.near(), use: document.querySelector('.tb.use')?.textContent }));
    console.log('lodge', JSON.stringify(label));
    await page.tap('.tb.use').catch((e) => errors.push('tap ' + e.message.split('\n')[0]));
    await page.waitForTimeout(1100);
    await page.screenshot({ path: path.join(out, 'phone-pet-lodge.png') });
    // And Maeve's hound by the fire, up from it for a pet.
    await page.waitForTimeout(2500);
    await page.evaluate(() => { const h = window.__game.hero; Object.assign(h, { x: 10.1, y: 3.0, fx: -1, fy: -0.3 }); });
    await page.waitForTimeout(600);
    console.log('fire', JSON.stringify(await page.evaluate(() => window.__game.near())));
    await page.tap('.tb.use').catch((e) => errors.push('tap ' + e.message.split('\n')[0]));
    await page.waitForTimeout(1100);
    await page.screenshot({ path: path.join(out, 'phone-pet-maeves-hound.png') });
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors.slice(0, 8)));
  await browser.close();
})();
