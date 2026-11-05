/**
 * The newer goblins' sounds, all from the kit we have (sfx.ts, voices.ts, spidersfx.ts): a net
 * whirled and thrown, a thief's grab and its cackle, a banner going down and the rout's shrieks, the
 * log-carriers' roar, wolves, the oil pot and its fire, the sapper's digging, the crows, the blind
 * hunters' clicks, a pack rush's shriek, an ironhide's plates giving way. True when it was one of theirs.
 */
import type { FightEvent } from '../sim/types';
import { sfx } from './sfx';
import { spiderSounds } from './spidersfx';
import { butcher, goblin } from './voices';

export function foeSound(ev: FightEvent): boolean {
  const id = Math.round(ev.x * 7 + ev.y * 3);
  switch (ev.k) {
    case 'windup':
      if (ev.kind === 'net') return sfx.net(), true;
      if (ev.kind === 'grab') return goblin.cackle(id), true;
      if (ev.kind === 'lob') return sfx.throw(), true;
      if (ev.kind === 'torch') return sfx.ignite(), true;
      if (ev.kind === 'erupt') return sfx.rumble(), true;
      return false;
    case 'impact':
      if (ev.kind === 'net') return sfx.snareset(), true;
      if (ev.kind === 'lob') return spiderSounds.splat(), true;
      if (ev.kind === 'erupt') return sfx.boom(), true;
      return false;
    case 'netted': return sfx.grab(), true;
    case 'struggle': return sfx.lift(), true;
    case 'cutfree': case 'netfree': return sfx.propbreak(), true;
    case 'stolen': return sfx.gold(), goblin.cackle(id), true;
    case 'recovered': return sfx.gold(), true;
    case 'escaped': return goblin.cackle(id + 1), true;
    case 'bannerfall': return butcher.groan(), true;
    case 'routed': return goblin.yelp(id), true;
    case 'rooffall': return sfx.land(), goblin.shriek(id), true;
    case 'whip': return sfx.snareset(), true;
    case 'howl': return sfx.bark(), true;
    case 'scatter': return sfx.yelp(), true;
    case 'dig': return sfx.gnaw(), true;
    case 'surface': return sfx.rumble(), true;
    case 'unearthed': return sfx.thud(), goblin.screech(), true;
    case 'slick': return spiderSounds.splat(), true;
    case 'oilwarn': return sfx.ignite(), true;
    case 'oilup': return sfx.oilfire(), true;
    case 'crows': return sfx.flare(), true;
    case 'listen': return goblin.hiss(), true;
    // A pack rush winding up: one short shriek from the pack and a rising note (sim/packrush.ts).
    case 'rush': return goblin.screech(), sfx.charged(), true;
    case 'rushparried': return sfx.perfect(), true;
    // An ironhide's guard broken: iron giving way (sim/ironhide.ts).
    case 'cracked': return sfx.wardbreak(), sfx.propbreak(), true;
    default: return false;
  }
}
