/**
 * The armour page (`?gearlook=armour`, docs/design/gear-looks.md slice 3), beside the weapons' (gearlookpage.ts):
 * each class facing you and in profile, in each armour weight at a few tiers, a legs piece of the same weight and
 * tier on too, drawn by the game's own drawHero under the real lighting pass. Drawing only.
 */
import { CLASS_KITS, type HeroClass } from '../shared/weapons';
import type { Item, Tier } from '../shared/loot';
import { TIERS } from '../shared/gear';
import { drawHero } from './actors';
import { BARE, type Ctx } from './draw';
import { Lighting, type Light } from './light';
import { drawText } from './pixfont';
import { heroIn } from './lineupcast';
import { UNIQUES } from '../shared/uniques';
import { HUNGRY, HUNGRY_ORDER } from '../shared/hungry';
import { TIER_ORDER } from '../shared/gear';
import { RING_SHOW } from './ringlook';

type Weight = 'light' | 'medium' | 'heavy';
const COLS: { label: string; w: Weight; tier: Tier }[] = [
  { label: 'L PLN', w: 'light', tier: 'plain' }, { label: 'L FIN', w: 'light', tier: 'fine' }, { label: 'L FRG', w: 'light', tier: 'forged' },
  { label: 'M PLN', w: 'medium', tier: 'plain' }, { label: 'M FIN', w: 'medium', tier: 'fine' }, { label: 'M FRG', w: 'medium', tier: 'forged' },
  { label: 'H PLN', w: 'heavy', tier: 'plain' }, { label: 'H FIN', w: 'heavy', tier: 'fine' }, { label: 'H FRG', w: 'heavy', tier: 'forged' }, { label: 'H TRN', w: 'heavy', tier: 'turning' },
];
const CLASSES = Object.keys(CLASS_KITS) as HeroClass[];
/** Each class facing you, then each in profile. */
const ROWS = [...CLASSES.map((cls) => ({ cls, side: false })), ...CLASSES.map((cls) => ({ cls, side: true }))];
/** Then the named body pieces (namedarmour.ts), each on a class that would wear it, facing you and in profile; then rings (ringlook.ts). */
type Unique = { slot: string; armor?: Weight };
const NAMED_BODY: Item[] = [
  ...(Object.entries(UNIQUES) as [string, Unique][]).filter(([, u]) => u.slot === 'armor').map(([id, u]): Item => ({ slot: 'armor', armor: u.armor ?? 'light', quality: 'tolmouth', traits: [], unique: id })),
  ...HUNGRY_ORDER.filter((id) => HUNGRY[id].slot === 'armor').map((id): Item => ({ slot: 'armor', armor: (HUNGRY[id] as { armor?: Weight }).armor ?? 'light', quality: 'hungry', traits: [], hungry: id })),
];
const WEARER: Record<Weight, HeroClass> = { heavy: 'WARRIOR', medium: 'HEALER', light: 'ROGUE' };
const RINGS: Item[] = [
  ...TIER_ORDER.map((tier): Item => ({ slot: 'ring', quality: tier, traits: [] })),
  { slot: 'ring', quality: 'hungry', traits: [], hungry: 'wedding' }, { slot: 'ring', quality: 'hungry', traits: [], hungry: 'tooth' }, { slot: 'ring', quality: 'tolmouth', traits: [], unique: 'dripring' },
];
const EXTRA = 3;
const CELL = 34, ROW = 50, LEFT = 50, TOP = 22, SCALE = 2;
const piece = (slot: 'armor' | 'legs', w: Weight, tier: Tier): Item => ({ slot, armor: w, quality: tier, traits: [] });

export function openArmourLooks(): void {
  const W = LEFT + COLS.length * CELL + 4, H = TOP + (ROWS.length + EXTRA) * ROW + 6;
  const mk = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  const lit = mk(), glow = mk(), out = mk();
  const page = document.createElement('div');
  page.id = 'gearlook';
  page.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;background:#0d0b10;-webkit-overflow-scrolling:touch';
  out.style.cssText = `display:block;width:${W * SCALE}px;height:${H * SCALE}px;image-rendering:pixelated`;
  page.append(out);
  document.body.append(page);
  const light = new Lighting(out);
  const c: Ctx = { lit: lit.getContext('2d')!, glow: glow.getContext('2d')!, now: 0 };
  for (const g of [c.lit, c.glow]) g.imageSmoothingEnabled = false;
  const lights: Light[] = [...ROWS, ...Array(EXTRA)].flatMap((_, r) => [0.28, 0.76].map((k) => ({ x: W * k, y: TOP + r * ROW + 20, r: W * 0.36, i: 0.45, c: [1, 0.76, 0.5] as [number, number, number] }))).slice(0, 32);
  RING_SHOW.always = true;

  const frame = () => {
    if (!page.isConnected) return;
    const now = performance.now() / 1000;
    c.now = now;
    c.lit.clearRect(0, 0, W, H);
    c.glow.clearRect(0, 0, W, H);
    c.lit.fillStyle = '#4a4652';
    c.lit.fillRect(0, 0, W, H);
    COLS.forEach((k, i) => drawText(c.glow, k.label, LEFT + i * CELL + 2, i % 2 ? 10 : 2, TIERS[k.tier].col));
    BARE.on = true;
    try {
      ROWS.forEach(({ cls, side }, r) => {
        const fy = TOP + r * ROW + 38;
        drawText(c.glow, cls.slice(0, 6), 2, fy - 14, side ? '#9ad8a8' : '#d8c8a0');
        COLS.forEach((k, i) => {
          const { h, t } = heroIn({ cls, look: 0, weapon: CLASS_KITS[cls][0] }, 'stand', 'arm' + r + '-' + i, now);
          Object.assign(h, { armor: piece('armor', k.w, k.tier), legs: piece('legs', k.w, k.tier) }, side ? { fx: 1, fy: 0.1 } : { fx: 0.15, fy: 1 });
          drawHero(c, h, LEFT + i * CELL + CELL / 2, fy, 'bare', t);
        });
      });
      const row = (r: number, label: string, col: string, each: (i: number) => { cls: HeroClass; set: object; side?: boolean } | null) => {
        const fy = TOP + (ROWS.length + r) * ROW + 38;
        drawText(c.glow, label, 2, fy - 14, col);
        for (let i = 0; i < COLS.length; i++) {
          const e = each(i);
          if (!e) continue;
          const { h, t } = heroIn({ cls: e.cls, look: 0, weapon: CLASS_KITS[e.cls][0] }, 'stand', 'x' + r + '-' + i, now);
          Object.assign(h, e.set, e.side ? { fx: 1, fy: 0.1 } : { fx: 0.15, fy: 1 });
          drawHero(c, h, LEFT + i * CELL + CELL / 2, fy, 'bare', t);
        }
      };
      for (const side of [false, true]) row(side ? 1 : 0, 'NAMED', '#d8b0ff', (i) => (NAMED_BODY[i] ? { cls: WEARER[NAMED_BODY[i].armor as Weight], set: { armor: NAMED_BODY[i] }, side } : null));
      row(2, 'RINGS', '#ffd860', (i) => (RINGS[i] ? { cls: 'RANGER', set: { armor: null, rings: [RINGS[i]] } } : null));
    } finally {
      BARE.on = false;
    }
    light.render(lit, glow, lights, [0.2, 0.21, 0.27]);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
