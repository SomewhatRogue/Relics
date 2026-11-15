/**
 * Weapon colours by tier and element (docs/design/gear-looks.md), the one table the hand (held.ts and
 * heldkits.ts, through weaponpaint.ts), the floor (lootart.ts, three/loot3d.ts) and the bag (itemicons.ts)
 * all read, so the three agree. The weapons keep today's shapes; their stuff changes:
 * - plain: dull iron, iron fittings, a wooden grip;
 * - fine: bright steel and brass (the look every weapon had before);
 * - forged: dark steel with a silver edge and silver fittings, the grip in black leather;
 * - PRE-WAR, touched, turning: the metal blackening and veined in the hungry's sickly green, more each tier;
 * - hungry: blackest, most veined.
 * A named piece (a Hungry weapon, a unique) has its own stuff over its tier's (namedlooks.ts).
 * An element (fire, frost, storm) runs along the edge in the spells' colours with a faint glow (weaponmarks.ts).
 *
 * Every colour today's weapon art uses has a role (steel, fittings, grip, wood); a tier's ramp maps each
 * shade of a role to its own by how light it is, so every shade in every kit follows without listing them.
 */
import type { Tier } from '../shared/loot';
import { lookKey, type WeaponLook } from '../shared/gearlook';
import { EL_COL } from './palette';
import { NAMED } from './namedlooks';

export type Role = 'steel' | 'fit' | 'grip' | 'wood';
/** The weapon art's colours by role (held.ts, heldkits.ts, lootart.ts, three/loot3d.ts, itemicons.ts). */
const ROLES: Record<Role, string[]> = {
  steel: ['#eef2f5', '#e6ecf0', '#dfe6ec', '#e8eef2', '#e4eaf2', '#cfd6dc', '#c4cad4', '#cfd6e8', '#d8e0f4', '#9aa4ae', '#9aa3ad', '#9aa6b2', '#aab2be', '#8a929c', '#6a727c', '#6a7280', '#8a8490', '#6a6470', '#5a5560'],
  fit: ['#d4a537', '#b89a4a', '#d9b13a'],
  grip: ['#4a3420', '#2a2420', '#3a2a1a', '#5a3a1e'],
  wood: ['#5a3d22', '#8b6a3a', '#6b4a2b', '#7a6a3a', '#8a5a30'],
};
/** How light each role's shades run in today's art (luma), so a ramp spans them. */
const SPAN: Record<Role, [number, number]> = { steel: [0.34, 0.95], fit: [0.58, 0.7], grip: [0.14, 0.26], wood: [0.26, 0.44] };
const ROLE_OF = new Map<string, Role>();
for (const r of Object.keys(ROLES) as Role[]) for (const h of ROLES[r]) ROLE_OF.set(h, r);

/** Dark, middle and light, and how far up the middle sits (a high one keeps only the brightest edge light). */
export type Ramp = [string, string, string, number];
interface Paint { steel?: Ramp; fit?: Ramp; grip?: Ramp; wood?: Ramp; /** Green veins on the metal: held marks, and one pixel in `veins` on the floor and in the bag. */ veins: number }

const BLACK_GRIP: Ramp = ['#1a1418', '#241c20', '#30262a', 0.5];
export const PAINT: Record<Tier, Paint> = {
  plain: { steel: ['#55524e', '#7c7872', '#aaa59c', 0.6], fit: ['#4a4640', '#5e5a52', '#706a60', 0.5], grip: ['#6a4a2a', '#7e5a34', '#8e6a40', 0.5], wood: ['#6e5234', '#86663e', '#9a7a4c', 0.5], veins: 0 },
  fine: { veins: 0 },
  forged: { steel: ['#343c4a', '#566070', '#eaf0f8', 0.8], fit: ['#8a929e', '#b8c0cc', '#e0e6ee', 0.5], grip: ['#1a161c', '#262028', '#342c38', 0.5], wood: ['#3a2616', '#4e341e', '#644428', 0.5], veins: 0 },
  tolmouth: { steel: ['#3a3840', '#55525c', '#a4a2ac', 0.72], fit: ['#4a4238', '#5e5444', '#72664e', 0.5], grip: BLACK_GRIP, wood: ['#3a3028', '#4e4034', '#665444', 0.5], veins: 9 },
  touched: { steel: ['#302e34', '#48464e', '#8e8c96', 0.72], fit: ['#3a342e', '#4a4238', '#5a5044', 0.5], grip: BLACK_GRIP, wood: ['#342a24', '#463830', '#5c4a3e', 0.5], veins: 6 },
  turning: { steel: ['#262428', '#3c3a40', '#7c7a84', 0.72], fit: ['#2e2a26', '#3a342e', '#48403a', 0.5], grip: ['#141012', '#1c1618', '#241c20', 0.5], wood: ['#2e2622', '#3e322c', '#524238', 0.5], veins: 4 },
  hungry: { steel: ['#201e22', '#38363c', '#7a7882', 0.72], fit: ['#2a2622', '#36302a', '#443c34', 0.5], grip: ['#141012', '#1c1618', '#241c20', 0.5], wood: ['#2a2220', '#382e2a', '#4a3c36', 0.5], veins: 3 },
};
/** The hungry's sickly green: the vein on the metal, and its glow on the worst tiers. */
export const VEIN = '#6fae32', VEIN_GLOW = '#a6e85a';
/** Veins that glow (unlit, pulsing): turning and hungry. */
export const glowingVeins = (t: Tier) => t === 'turning' || t === 'hungry';
/** An element's colour, as the spells use it. */
export const elCol = (l: WeaponLook) => (l.el ? EL_COL[l.el] : undefined);

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const luma = (h: string) => { const [r, g, b] = rgb(h); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; };
const mix = (a: string, b: string, k: number) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * k).toString(16).padStart(2, '0')).join('');
function along(r: Ramp, t: number): string {
  const [d, m, l, at] = r;
  return t <= at ? mix(d, m, t / at) : mix(m, l, (t - at) / (1 - at));
}

const tints = new Map<string, (hex: string) => string>();
/** Today's colour to this look's (anything not weapon stuff, a glove or a string, unchanged). */
export function tintOf(l: WeaponLook): (hex: string) => string {
  const key = lookKey(l);
  let f = tints.get(key);
  if (f) return f;
  const n = l.named ? NAMED[l.named] : undefined, p: Paint = { ...PAINT[l.tier], ...(n?.paint ?? {}) }, swap = n?.swap ?? {}, done = new Map<string, string>();
  f = (hex: string) => {
    const k = hex.toLowerCase(), had = done.get(k);
    if (had) return had;
    const role = ROLE_OF.get(k), ramp = role && p[role];
    let out = swap[k] ?? hex;
    if (!swap[k] && role && ramp) {
      const [lo, hi] = SPAN[role];
      out = along(ramp, Math.max(0, Math.min(1, (luma(k) - lo) / (hi - lo))));
    }
    done.set(k, out);
    return out;
  };
  tints.set(key, f);
  return f;
}

/** For pixel maps (the floor, the bag): the tint, and on cursed metal a green vein pixel here and there. */
export function tintPixel(l: WeaponLook): (hex: string, x: number, y: number) => string {
  // (A named piece shows its shape first: half the veins.)
  const t = tintOf(l), v = PAINT[l.tier].veins, n = v && l.named ? v * 2 : v;
  return (hex, x, y) => (n && ROLE_OF.get(hex.toLowerCase()) === 'steel' && (x * 7 + y * 13 + ((x * y) % 5)) % n === 0 ? VEIN : t(hex));
}

/** A number colour (three.js) through the tint. */
export const tintNum = (l: WeaponLook) => { const t = tintOf(l); return (n: number) => parseInt(t('#' + n.toString(16).padStart(6, '0')).slice(1), 16); };
