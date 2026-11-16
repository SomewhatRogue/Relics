// The town's insides in the new look (docs/design/new-look-interiors.md): go in each door and shoot.
// node scripts/inside-look.cjs [url] [out prefix] [day 0..1]   (LAPTOP=1 for a 1440x900 laptop, else a phone)
// VIEW=flat or VIEW=3d for the normal views; PASTIMES=1 to sit at the Rat's and forge's pastimes too; DOORS=church,hall to shoot only some; UP=1 to stand halfway up each room, to see its back wall.
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/?hero=WARRIOR', out = 'shots/inside', day = '0.9'] = process.argv.slice(2);
const ALL = ['church', 'hall', 'townhall', 'tavern', 'forge', 'infirmary'];
const only = process.env.DOORS ? process.env.DOORS.split(',') : ALL;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const ctx = process.env.LAPTOP ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const page = await (await browser.newContext(ctx)).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  // VIEW=flat (the 2D view) or VIEW=3d (the regular 2.5D view); otherwise the parked street look.
  const view = { flat: '', '3d': 'look=3d&' }[process.env.VIEW] ?? 'look=3d&hd&street&';
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}${view}day=${day}`);
  await page.waitForFunction(() => window.__game);
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '#caption { display: none !important; }' });
  await page.evaluate(() => { const p = window.__game.profile; if (p.errands) p.errands.told = true; });
  for (let i = 0; i < 6; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(300);
  for (const d of only) {
    await page.evaluate(([d, up]) => {
      const g = window.__game;
      if (g.outside) g.leave();
      const b = g.room.map.blocks.find((x) => x.door === d);
      g.enter(b);
      const h = g.hero;
      // UP=1: stood halfway up the room, to see the back wall.
      if (up) Object.assign(h, { x: g.room.map.w / 2 + 0.6, y: Math.min(g.room.map.h - 2, 6.5) });
      g.cutFocus = () => ({ x: h.x, y: h.y - 0.4 });
    }, [d, !!process.env.UP]);
    await page.waitForTimeout(2500);
    const name = await page.evaluate(() => window.__game.room.map.name + ' ' + window.__game.room.map.w + 'x' + window.__game.room.map.h);
    await page.screenshot({ path: `${out}-${d}.png` });
    console.log(d, name);
    // PASTIMES=1: sit at the Rat's arm table and knife line, and take the anvil, as a player would.
    for (const id of process.env.PASTIMES ? { tavern: ['arm', 'knives'], forge: ['anvil'] }[d] ?? [] : []) {
      // Open it as talking to its keeper does (the anvil from the smith's shifts).
      const at = await page.evaluate((id) => {
        const g = window.__game;
        window.__openSpot(id === 'anvil' ? 'smith' : id, 0);
        const b = document.querySelector('[data-shift], [data-anvil]');
        if (id === 'anvil' && b) b.click();
        return `${g.mode} ${g.hero.x.toFixed(2)},${g.hero.y.toFixed(2)}`;
      }, id);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}-${id}.png` });
      console.log(' ', id, at);
      await page.keyboard.press('Escape'), await page.waitForTimeout(300), await page.keyboard.press('Escape'), await page.waitForTimeout(300);
    }
    await page.evaluate(() => window.__game.leavePastime());
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
