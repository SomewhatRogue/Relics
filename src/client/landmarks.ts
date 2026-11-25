/**
 * What the wilds' map puts on the ground (client/landmapui.ts draws them): the zone names once their ground has been seen, the
 * shelters once seen (found if the hero has rested at them), the way in, on and back, and the places of the held bounties' packs
 * while they are not done. Pure: the room's bits go in, plain places come out. Not nooks or mini bosses: those are for finding.
 */
import { LANDMAP_WORDS } from '../shared/landmapwords';
import { bountyOf, held, isDone } from '../shared/bounties';
import { ONWARD } from '../shared/landlinks';
import type { Profile } from '../shared/progress';
import type { LandId } from '../shared/territory';
import { BOUNTYW } from './bountywords';

type P = { x: number; y: number };
export interface Mark extends P { name: string }
export interface LandMarks { zones: Mark[]; shelters: (Mark & { found: boolean })[]; bounties: Mark[]; ways: Mark[] }
export interface MarkIn {
  land: LandId;
  zones: { name: string; kind: string; x: number; y: number; w: number; h: number }[];
  stations: { name: string; x: number; y: number }[];
  foes: { x: number; y: number; pack?: number; kind: string; hp: number }[];
  profile: Pick<Profile, 'bounties' | 'shelters'>;
  gate: P;
  seen: (x: number, y: number) => boolean;
}

export function landMarks(i: MarkIn): LandMarks {
  const station = new Set(i.stations.map((s) => s.name)), out: LandMarks = { zones: [], shelters: [], bounties: [], ways: [] };
  // A zone's name sits at the middle of what has been seen of it (the ground, sampled every 3 tiles).
  for (const z of i.zones) {
    if (z.kind === 'scape' && station.has(z.name)) continue;
    let n = 0, sx = 0, sy = 0;
    for (let y = z.y + 1.5; y < z.y + z.h; y += 3) for (let x = z.x + 1.5; x < z.x + z.w; x += 3) if (i.seen(x, y)) (n++, (sx += x), (sy += y));
    if (n) out.zones.push({ name: z.name, x: sx / n, y: sy / n });
  }
  const mine = i.profile.shelters ?? [];
  for (const s of i.stations) if (i.seen(s.x, s.y)) out.shelters.push({ name: s.name, x: s.x, y: s.y, found: mine.includes(s.name) });
  // The way in is the gate on the land that has one, or the way back; the way on is the far end.
  const back = LANDMAP_WORDS.back[i.land], on = LANDMAP_WORDS.on[i.land], to = ONWARD[i.land];
  out.ways.push({ name: back ?? LANDMAP_WORDS.gate, ...i.gate });
  if (on && to) out.ways.push({ name: on, ...to.from });
  // Each held bounty's packs, where the living of them are (a pack's middle), while it is not done.
  for (const h of held(i.profile)) {
    const b = bountyOf(h.id);
    if (!b || isDone(h)) continue;
    for (const pk of b.packs) {
      const f = i.foes.filter((e) => e.pack === pk && e.hp > 0 && (!b.kinds || b.kinds.includes(e.kind as never)));
      if (f.length) out.bounties.push({ name: BOUNTYW.title[h.id] ?? h.id, x: f.reduce((a, e) => a + e.x, 0) / f.length, y: f.reduce((a, e) => a + e.y, 0) / f.length });
    }
  }
  return out;
}
