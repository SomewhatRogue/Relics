/**
 * The Gospel Oak alight (numbers: shared/hangtune.ts OAK). Fire into its hollow (a spell, an oil flask, the
 * lamp oil by the path, a fire arrow: any fire that reaches its wood, sim/catching.ts) and it burns from
 * inside like a chimney. While it burns, burning wood comes down every OAK.every seconds onto a striped
 * circle a little way out from the trunk (nothing to block: walk out), OAK.warn seconds' warning, then it
 * lands, hurting heroes and goblins under it and setting goblins alight; the brood mother in the hollow
 * burns all the while (and wakes). Where the wood will land is on the oak's block (`falls`, `nextFall`),
 * so a friend's screen draws the same circles from the usual patch, one change each time a piece comes down.
 */
import type { Block } from '../shared/arena';
import type { Rng } from '../shared/rng';
import { OAK } from '../shared/tuning';
import { damage, isDead } from './damage';
import { strike } from './dropper';
import { afflict, type World } from './elements';

const lit = (b: Block) => (b.burning ?? -1) >= 0 && !b.ruined;

export function stepOak(b: Block | undefined, w: World, rng: Rng, dt: number): void {
  if (!b || b.kind !== 'oak') return;
  const now = w.now, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  if (!lit(b)) {
    if (b.falls?.length) b.falls = [];
    return;
  }
  // The brood mother in the hollow: burning the whole while, and awake to it.
  for (const e of w.enemies) if (e.kind === 'brood' && !isDead(e) && Math.hypot(e.x - cx, e.y - (b.y + b.h)) < 2.4) {
    Object.assign(e, { alert: true, feeding: false });
    damage(e, OAK.brood * dt, now, w.ev, { tick: true, el: 'fire' });
  }
  const falls = b.falls ?? [];
  // What's due lands.
  const down = falls.filter((f) => now >= f[2]);
  for (const [x, y] of down) {
    w.ev.push({ k: 'oakfall', x, y });
    for (const h of w.heroes) if (Math.hypot(h.x - x, h.y - y) <= OAK.fall) strike(h, OAK.dmg, x, y, 3, w.ev, 'fire');
    for (const e of w.enemies) if (!isDead(e) && Math.hypot(e.x - x, e.y - y) <= OAK.fall + e.radius * 0.5) {
      if (!damage(e, OAK.dmg, now, w.ev, { el: 'fire' })) afflict(w, e, 'fire', OAK.dmg);
    }
  }
  if (down.length) b.falls = falls.filter((f) => now < f[2]);
  // The next piece: somewhere round the trunk, on the room's fire stream.
  if (now >= (b.nextFall ?? 0)) {
    const a = rng.range(0, Math.PI * 2), d = rng.range(OAK.r0, OAK.r1), r = (v: number) => Math.round(v * 100) / 100;
    b.falls = [...(b.falls ?? []), [r(cx + Math.cos(a) * d), r(cy + Math.sin(a) * d * 0.8 + 0.4), r(now + OAK.warn)]];
    b.nextFall = r(now + OAK.every);
  }
}
