/**
 * The weapon in hand in its tier's stuff (weaponlook.ts) without touching how held.ts and heldkits.ts draw
 * it: while `drawWeapon` runs, every colour set on the lit layer passes through the look's tint, so a sword's
 * steel, its cross and its grip follow the table and a glove or a bowstring stays itself. held.ts calls
 * `paintWeapon` as it starts and the undo as it ends; the glow layer (flashes, spell light) is never tinted.
 */
import { heldLook } from '../shared/gearlook';
import type { Hero } from '../sim/types';
import type { Ctx } from './draw';
import { tintOf } from './weaponlook';

let tint: ((hex: string) => string) | null = null;
const hooked = new WeakSet<object>();

/** Give a context a fillStyle that passes through `tint` while one is set (once per context). */
function hook(g: CanvasRenderingContext2D): void {
  if (hooked.has(g)) return;
  let proto: object | null = Object.getPrototypeOf(g), d: PropertyDescriptor | undefined;
  while (proto && !(d = Object.getOwnPropertyDescriptor(proto, 'fillStyle'))) proto = Object.getPrototypeOf(proto);
  if (!d?.set || !d.get) return;
  const { get, set } = d;
  Object.defineProperty(g, 'fillStyle', {
    configurable: true,
    get() { return get.call(this); },
    set(v: unknown) { set.call(this, tint && typeof v === 'string' && v[0] === '#' ? tint(v) : v); },
  });
  hooked.add(g);
}

/** Start drawing this hero's weapon in its look; returns the undo. */
export function paintWeapon(c: Ctx, h: Hero): () => void {
  const was = tint;
  hook(c.lit);
  tint = tintOf(heldLook(h));
  return () => void (tint = was);
}
