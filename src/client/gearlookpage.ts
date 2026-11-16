/**
 * The gear-looks page (docs/design/gear-looks.md), a dev page like the lineup: every kit in every weapon look,
 * held by its class (the game's own drawHero under the real lighting pass), lying on the floor beneath it
 * (lootart.ts), and the bag's pictures below (itemicons.ts). Open it with `?gearlook`. Drawing only.
 */
import { CLASS_KITS, type HeroClass, type WeaponId } from '../shared/weapons';
import type { Item, Tier, TraitId } from '../shared/loot';
import { TIERS } from '../shared/gear';
import { weaponLookOf } from '../shared/gearlook';
import { drawHero } from './actors';
import { BARE, type Ctx } from './draw';
import { drawGear } from './lootart';
import { itemIcon } from './itemicons';
import { Lighting, type Light } from './light';
import { drawText } from './pixfont';
import { heroIn } from './lineupcast';
import { HUNGRY, HUNGRY_ORDER } from '../shared/hungry';
import { UNIQUES } from '../shared/uniques';
import { WEAPONS } from '../shared/weapons';

/** The columns: each tier, the forged one in each element too. */
const LOOKS: { label: string; tier: Tier; el?: TraitId }[] = [
  { label: 'PLAIN', tier: 'plain' }, { label: 'FINE', tier: 'fine' }, { label: 'FORGED', tier: 'forged' },
  { label: 'FIRE', tier: 'forged', el: 'ember' }, { label: 'FROST', tier: 'forged', el: 'rime' }, { label: 'STORM', tier: 'forged', el: 'storm' },
  { label: 'PREWAR', tier: 'tolmouth' }, { label: 'TOUCH', tier: 'touched' }, { label: 'TURN', tier: 'turning' }, { label: 'HUNGRY', tier: 'hungry' },
];
const KITS = (Object.entries(CLASS_KITS) as [HeroClass, WeaponId[]][]).flatMap(([cls, ks]) => ks.map((kit) => ({ cls, kit })));
const CELL = 34, ROW = 58, LEFT = 50, TOP = 20, SCALE = 2;
const item = (kit: WeaponId, l: (typeof LOOKS)[number]): Item => ({ slot: 'weapon', kit, quality: l.tier, traits: l.el ? [l.el] : [] });
/** The last rows: the named weapons, each held by its class (namedlooks.ts): the Hungry six, then the uniques six a row. */
const named = (kit: WeaponId, it: Item) => ({ cls: WEAPONS[kit].cls, kit, it });
const HUNGRY_ROW = HUNGRY_ORDER.filter((id) => HUNGRY[id].slot === 'weapon').map((id) => named(HUNGRY[id].kit!, { slot: 'weapon', kit: HUNGRY[id].kit!, quality: 'hungry', traits: [], hungry: id }));
const UNIQUE_ALL = (Object.entries(UNIQUES) as [string, { slot: string; kit?: WeaponId }][]).filter(([, u]) => u.slot === 'weapon' && u.kit).map(([id, u]) => named(u.kit!, { slot: 'weapon', kit: u.kit!, quality: 'tolmouth', traits: [], unique: id }));
const NAMED_ROWS = [{ label: 'HUNGRY', col: '#ff6a5a', pieces: HUNGRY_ROW }, { label: 'UNIQUE', col: '#d8b0ff', pieces: UNIQUE_ALL.slice(0, 6) }, { label: 'UNIQUE', col: '#d8b0ff', pieces: UNIQUE_ALL.slice(6) }];

export function openGearLooks(): void {
  const W = LEFT + LOOKS.length * CELL + 4, H = TOP + (KITS.length + NAMED_ROWS.length) * ROW + 6;
  const mk = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  const lit = mk(), glow = mk(), out = mk();
  const page = document.createElement('div');
  page.id = 'gearlook';
  page.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;background:#0d0b10;-webkit-overflow-scrolling:touch';
  out.style.cssText = `display:block;width:${W * SCALE}px;height:${H * SCALE}px;image-rendering:pixelated`;
  page.append(out, bag());
  document.body.append(page);
  const light = new Lighting(out);
  const c: Ctx = { lit: lit.getContext('2d')!, glow: glow.getContext('2d')!, now: 0 };
  for (const g of [c.lit, c.glow]) g.imageSmoothingEnabled = false;
  // Two torches a row, so every column is lit about the same.
  const torch = (x: number, y: number, r: number): Light => ({ x, y, r, i: 0.45, c: [1, 0.76, 0.5] });
  // (The lighting pass takes 32: two a kit row, and two for the named rows below.)
  const lights: Light[] = [...KITS.flatMap((_, r) => [0.28, 0.76].map((k) => torch(W * k, TOP + r * ROW + 20, W * 0.36))), torch(W * 0.32, TOP + (KITS.length + 0.6) * ROW, W * 0.42), torch(W * 0.32, TOP + (KITS.length + 2.2) * ROW, W * 0.42)];

  const frame = () => {
    if (!page.isConnected) return;
    const now = performance.now() / 1000;
    c.now = now;
    c.lit.clearRect(0, 0, W, H);
    c.glow.clearRect(0, 0, W, H);
    c.lit.fillStyle = '#4a4652';
    c.lit.fillRect(0, 0, W, H);
    LOOKS.forEach((l, i) => drawText(c.glow, l.label, LEFT + i * CELL + 2, i % 2 ? 9 : 2, l.el ? '#ffd27a' : TIERS[l.tier].col));
    BARE.on = true;
    try {
      KITS.forEach(({ cls, kit }, r) => {
        const fy = TOP + r * ROW + 34;
        drawText(c.glow, kit.toUpperCase().slice(0, 8), 2, fy - 12, '#9ad8a8');
        LOOKS.forEach((l, i) => {
          const x = LEFT + i * CELL + CELL / 2, it = item(kit, l);
          const { h, t } = heroIn({ cls, look: 0, weapon: kit }, 'stand', 'gear' + r + '-' + i, now);
          Object.assign(h, { fx: 1, fy: 0.15, arms: { [kit]: it } });
          drawHero(c, h, x, fy, 'bare', t);
          drawGear(c, 'weapon', kit, undefined, TIERS[l.tier].col, x, fy + 16, r * 10 + i, 1, weaponLookOf(it));
        });
      });
      NAMED_ROWS.forEach(({ label, col, pieces }, nr) => {
      const fy = TOP + (KITS.length + nr) * ROW + 34;
      drawText(c.glow, label, 2, fy - 12, col);
      pieces.forEach(({ cls, kit, it }, i) => {
        const x = LEFT + i * CELL + CELL / 2;
        // (Mid-swing, so the piece is out where it can be seen; a Ranger's as it stands, since their wind-up is the short sword.)
        const bow = cls === 'RANGER', { h, t } = heroIn({ cls, look: 0, weapon: kit }, bow ? 'stand' : 'wind up', 'named' + nr + '-' + i, now);
        Object.assign(h, { arms: { [kit]: it } });
        if (bow) Object.assign(h, { fx: 1, fy: 0.15 });
        drawHero(c, h, x, fy, 'bare', t);
        drawGear(c, 'weapon', kit, undefined, TIERS[it.quality].col, x, fy + 16, 900 + nr * 10 + i, 1, weaponLookOf(it));
      });
      });
    } finally {
      BARE.on = false;
    }
    light.render(lit, glow, lights, [0.2, 0.21, 0.27]);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** The bag's pictures, one row a kit, each look a cell, on the pack's dark ground at twice their size. */
function bag(): HTMLElement {
  const t = document.createElement('div');
  t.id = 'gearbag';
  t.style.cssText = `display:grid;grid-template-columns:${LEFT * SCALE}px repeat(${LOOKS.length}, ${CELL * SCALE}px);gap:4px 0;padding:8px 0;color:#9ad8a8;font:10px monospace`;
  for (const { kit } of KITS) {
    t.append(Object.assign(document.createElement('div'), { textContent: kit }));
    for (const l of LOOKS) {
      const img = Object.assign(document.createElement('img'), { src: itemIcon(item(kit, l)) });
      img.style.cssText = `width:28px;height:28px;image-rendering:pixelated;background:#1a1720;border:2px solid ${TIERS[l.tier].col};padding:2px`;
      t.append(img);
    }
  }
  for (const { label, pieces } of NAMED_ROWS) {
    t.append(Object.assign(document.createElement('div'), { textContent: label.toLowerCase() }));
    for (let i = 0; i < LOOKS.length; i++) {
      const it = pieces[i]?.it, img = Object.assign(document.createElement(it ? 'img' : 'div'), it ? { src: itemIcon(it) } : {});
      if (it) img.style.cssText = `width:28px;height:28px;image-rendering:pixelated;background:#1a1720;border:2px solid ${TIERS[it.quality].col};padding:2px`;
      t.append(img);
    }
  }
  return t;
}
