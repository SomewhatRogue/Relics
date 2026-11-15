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

/** The columns: each tier, the forged one in each element too. */
const LOOKS: { label: string; tier: Tier; el?: TraitId }[] = [
  { label: 'PLAIN', tier: 'plain' }, { label: 'FINE', tier: 'fine' }, { label: 'FORGED', tier: 'forged' },
  { label: 'FIRE', tier: 'forged', el: 'ember' }, { label: 'FROST', tier: 'forged', el: 'rime' }, { label: 'STORM', tier: 'forged', el: 'storm' },
  { label: 'PREWAR', tier: 'tolmouth' }, { label: 'TOUCH', tier: 'touched' }, { label: 'TURN', tier: 'turning' }, { label: 'HUNGRY', tier: 'hungry' },
];
const KITS = (Object.entries(CLASS_KITS) as [HeroClass, WeaponId[]][]).flatMap(([cls, ks]) => ks.map((kit) => ({ cls, kit })));
const CELL = 34, ROW = 58, LEFT = 50, TOP = 20, SCALE = 2;
const item = (kit: WeaponId, l: (typeof LOOKS)[number]): Item => ({ slot: 'weapon', kit, quality: l.tier, traits: l.el ? [l.el] : [] });
/** The last row: the named Hungry weapons, each held by its class (namedlooks.ts). */
const NAMED = HUNGRY_ORDER.filter((id) => HUNGRY[id].slot === 'weapon').map((id) => ({ id, cls: HUNGRY[id].cls!, kit: HUNGRY[id].kit!, it: { slot: 'weapon', kit: HUNGRY[id].kit!, quality: 'hungry', traits: [], hungry: id } as Item }));

export function openGearLooks(): void {
  const W = LEFT + LOOKS.length * CELL + 4, H = TOP + (KITS.length + 1) * ROW + 6;
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
  const lights: Light[] = [...KITS, null].flatMap((_, r) => [0.28, 0.76].map((k) => ({ x: W * k, y: TOP + r * ROW + 20, r: W * 0.36, i: 0.45, c: [1, 0.76, 0.5] as [number, number, number] }))).slice(0, 32);

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
      const fy = TOP + KITS.length * ROW + 34;
      drawText(c.glow, 'HUNGRY', 2, fy - 12, '#ff6a5a');
      NAMED.forEach(({ cls, kit, it }, i) => {
        const x = LEFT + i * CELL + CELL / 2;
        // (Mid-swing, so the piece is out where it can be seen; a bow as it stands.)
        const { h, t } = heroIn({ cls, look: 0, weapon: kit }, kit === 'longbow' ? 'stand' : 'wind up', 'named' + i, now);
        Object.assign(h, { arms: { [kit]: it } });
        if (kit === 'longbow') Object.assign(h, { fx: 1, fy: 0.15 });
        drawHero(c, h, x, fy, 'bare', t);
        drawGear(c, 'weapon', kit, undefined, TIERS.hungry.col, x, fy + 16, 900 + i, 1, weaponLookOf(it));
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
  t.append(Object.assign(document.createElement('div'), { textContent: 'hungry' }));
  for (const { it } of NAMED) {
    const img = Object.assign(document.createElement('img'), { src: itemIcon(it) });
    img.style.cssText = `width:28px;height:28px;image-rendering:pixelated;background:#1a1720;border:2px solid ${TIERS.hungry.col};padding:2px`;
    t.append(img);
  }
  return t;
}
