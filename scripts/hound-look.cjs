// The Ranger's hounds (client/hound.ts, houndbody.ts), to look at.
// Usage: node scripts/hound-look.cjs <url> <outdir>
// sheet: the four breeds in every coat (and each breed with its white), in each gait, idle and fight
//        move, drawn by the game's own drawHound (window.__houndArt), at 4x: <outdir>/hound-sheet.png.
// phone: Maeve's YOUR HOUND panel with the live preview (<outdir>/phone-hound-panel.png), and the Ranger
//        back in the square playing fetch with the new hound (<outdir>/phone-hound-fetch.png).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const [url = 'http://localhost:4426/', out = 'shots'] = process.argv.slice(2);
const go = (q) => url + (url.includes('?') ? '&' : '?') + q;
const save = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
const BREEDS = ['wolfhound', 'lurcher', 'hillhound', 'collie'];
const COLS = [
  ['walk', 0], ['walk', 1], ['walk', 2], ['walk', 3], ['trot', 0], ['trot', 1], ['trot', 2], ['trot', 3], ['run', 0], ['run', 1], ['run', 2], ['run', 3],
  ['stand', 0], ['sit', 0], ['sniff', 0], ['sniff', 1], ['scratch', 0], ['scratch', 1], ['down', 0], ['downUp', 0], ['shake', 0], ['shake', 1], ['shake', 2],
  ['lunge', 0], ['lunge', 1], ['bite', 0], ['bite', 1], ['latch', 0], ['latch', 1], ['bow', 0], ['leap', 0],
];
const W = 39, H = 24, K = 4, LABEL = 200, HEAD = 40;

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
    const { ctx, page } = await open({ viewport: { width: 800, height: 600 } }, go('hero=RANGER'));
    const rows = [];
    for (const breed of BREEDS) for (let coat = 0; coat < 3; coat++) rows.push({ breed, coat, mark: 'none' });
    for (const breed of BREEDS) rows.push({ breed, coat: 0, mark: 'both' });
    const sheet = await page.evaluate(async ({ rows, COLS, W, H, K, LABEL, HEAD }) => {
      const cv = document.createElement('canvas');
      cv.width = LABEL + COLS.length * W * K;
      cv.height = HEAD + rows.length * H * K;
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.fillStyle = '#20242c';
      g.fillRect(0, 0, cv.width, cv.height);
      g.font = '16px monospace';
      g.fillStyle = '#9aa3ad';
      COLS.forEach(([n, f], i) => g.fillText(n + (f || ['walk', 'trot', 'run', 'sniff', 'scratch', 'shake', 'lunge', 'bite', 'latch'].includes(n) ? ' ' + f : ''), LABEL + i * W * K + 6, 26));
      const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
      const COAT = { wolfhound: ['grey', 'wheaten', 'brindle'], lurcher: ['blue', 'fawn', 'brindle'], hillhound: ['black & tan', 'liver & tan', 'red'], collie: ['black & white', 'red & white', 'merle'] };
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r], y0 = HEAD + r * H * K;
        g.fillStyle = r % 2 ? '#262b34' : '#2c323c';
        g.fillRect(0, y0, cv.width, H * K);
        g.fillStyle = '#d8dce4';
        g.font = '20px monospace';
        g.fillText(row.breed, 8, y0 + 34);
        g.fillStyle = '#9aa3ad';
        g.font = '16px monospace';
        g.fillText(COAT[row.breed][row.coat], 8, y0 + 58);
        if (row.mark !== 'none') g.fillText('blaze + socks', 8, y0 + 78);
        for (let i = 0; i < COLS.length; i++) {
          const img = await load(await window.__houndArt({ ...row, name: 'FLY' }, COLS[i], W, H));
          g.drawImage(img, LABEL + i * W * K, y0, W * K, H * K);
        }
      }
      return cv.toDataURL();
    }, { rows, COLS, W, H, K, LABEL, HEAD });
    save(path.join(out, 'hound-sheet.png'), sheet);
    await ctx.close();
  }
  const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  {
    const { ctx, page } = await open(PHONE, go('hero=RANGER'));
    await page.waitForTimeout(1500);
    // Into the lodge, up to Maeve, USE: her trainer panel, then YOUR HOUND.
    await page.evaluate(() => {
      const g = window.__game, b = g.room.map.blocks.find((x) => x.door === 'lodge');
      g.enter(b);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => Object.assign(window.__game.hero, { x: 4.7, y: 3.1, fx: -1, fy: -0.5 }));
    await page.waitForTimeout(700);
    console.log('near', JSON.stringify(await page.evaluate(() => window.__game.near())));
    await page.tap('.tb.use').catch((e) => errors.push('tap use ' + e.message.split('\n')[0]));
    await page.waitForTimeout(600);
    await page.locator('#panel button', { hasText: /^YOUR HOUND$/ }).click().catch((e) => errors.push('your hound ' + e.message.split('\n')[0]));
    await page.waitForTimeout(400);
    // A merle collie with a blaze, called Sloe.
    await page.locator('#panel .body').click().catch(() => {});
    for (const t of ['COLLIE', 'MERLE', 'BLAZE']) await page.locator('#panel .hd-o', { hasText: new RegExp('^' + t + '$') }).first().click().catch((e) => errors.push(t + ' ' + e.message.split('\n')[0]));
    await page.locator('#panel .hd-name input').fill('Sloe');
    await page.locator('#panel .hd-name input').dispatchEvent('input');
    await page.locator('#panel .hd-name input').blur();
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(out, 'phone-hound-panel.png') });
    await page.locator('#panel button', { hasText: /^DONE$/ }).click();
    await page.waitForTimeout(300);
    console.log('kept', JSON.stringify(await page.evaluate(() => ({ profile: window.__game.profile.hound, hero: window.__game.hero.houndLook }))));
    // Out to the square by the lamp, and a game of fetch.
    await page.locator('#panel button', { hasText: /^CLOSE$/ }).click().catch(() => {});
    await page.evaluate(() => window.__game.leave());
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const g = window.__game, h = g.hero;
      Object.assign(h, { x: 22.4, y: 16.6, fx: 1, fy: 0.2 });
      if (h.hound) Object.assign(h.hound, { x: 21.3, y: 16.8 });
    });
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.__idles.force('r_fetch'));
    await page.waitForTimeout(2400);
    await page.screenshot({ path: path.join(out, 'phone-hound-fetch.png') });
    console.log('town', JSON.stringify(await page.evaluate(() => ({ mode: window.__game.mode, map: window.__game.room.map.name, look: window.__game.hero.houndLook }))));
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors.slice(0, 8)));
  await browser.close();
})();
