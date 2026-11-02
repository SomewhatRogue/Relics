/**
 * A house on fire inside (the plan is shared/blaze.ts, the numbers HOUSEFIRE in tuning.ts). Standing
 * in fire burns you a little at a time; a beam that comes down where its circle showed hits anyone under
 * it; when the roof falls in, everyone inside is thrown out the door hurt (never killed by it), the
 * freed with them, and anyone still caged is lost. The room keeps the house's state on `blaze`.
 */
import { burningAt, inBox } from '../shared/blaze';
import type { Blaze } from '../shared/arena';
import { HOUSEFIRE } from '../shared/tuning';
import { downIfDead } from './combat';
import type { FightEvent, Hero, Prop, Survivor } from './types';

export interface BlazeState { burnt: Record<string, number>; beams: number; fallen: boolean }

/** What a burning house needs of its room. */
export interface Burning {
  map: { w: number; h: number; blaze?: Blaze };
  heroes: Hero[];
  props: Prop[];
  survivors: Survivor[];
  time: number;
  events: FightEvent[];
  blaze?: BlazeState;
}

const scorch = (h: Hero, n: number, ev: FightEvent[], src: string) => {
  h.hp -= n;
  ev.push({ k: 'hit', x: h.x, y: h.y, n, heavy: n >= 20, on: 'hero', src });
  downIfDead(h, ev);
};

export function stepBlaze(r: Burning, dt: number): void {
  const b = r.map.blaze, st = (r.blaze ??= { burnt: {}, beams: 0, fallen: false }), t = r.time, ev = r.events;
  if (!b || st.fallen) return;
  // Fire underfoot: a few points at a time, so it reads as burning, not a blow.
  const fire = burningAt(b, t);
  for (const h of r.heroes) {
    if (h.act === 'down') continue;
    const on = fire.some((a) => inBox(a, h.x, h.y + 0.1));
    st.burnt[h.id] = on ? (st.burnt[h.id] ?? 0) + HOUSEFIRE.dps * dt : 0;
    if (st.burnt[h.id] >= 4) (st.burnt[h.id] -= 4), scorch(h, 4, ev, 'fire');
  }
  // Beams down on their time, on whoever's under them.
  while (st.beams < b.beams.length && t >= b.beams[st.beams].at) {
    const m = b.beams[st.beams++];
    ev.push({ k: 'rafter', x: m.x, y: m.y });
    for (const h of r.heroes) if (h.act !== 'down' && h.act !== 'roll' && Math.hypot(h.x - m.x, h.y - m.y) <= HOUSEFIRE.beamR) {
      scorch(h, HOUSEFIRE.beamDmg, ev, 'beam');
      const l = Math.hypot(h.x - m.x, h.y - m.y) || 1;
      (h.kvx += ((h.x - m.x) / l) * 6), (h.kvy += ((h.y - m.y) / l) * 6);
    }
  }
  if (t < b.fall) return;
  // The roof comes in: out the door, hurt; the caged are lost to it.
  st.fallen = true;
  const out = { x: r.map.w / 2, y: r.map.h - 0.35 };
  ev.push({ k: 'housefall', x: r.map.w / 2, y: r.map.h / 2 });
  for (const h of r.heroes) {
    const n = Math.min(HOUSEFIRE.fallDmg, Math.max(0, h.hp - 1));
    if (n > 0 && h.act !== 'down') scorch(h, n, ev, 'beam');
    Object.assign(h, { x: out.x + (h.x < out.x ? -0.3 : 0.3), y: out.y, kvx: 0, kvy: 0 });
  }
  for (const s of r.survivors) if (!s.dead && !s.gone) Object.assign(s, { x: out.x, y: out.y - 0.4 });
  for (const p of r.props) if (p.kind === 'cage' && !p.broken) ev.push({ k: 'cagelost', x: p.x, y: p.y });
  r.props = r.props.filter((p) => p.kind !== 'cage' || p.broken);
}
