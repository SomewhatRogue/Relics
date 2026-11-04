/**
 * A pixel icon for every class skill (pixgrid.ts letters), for the touch cluster's skill button. The
 * found relics keep their own pictures (relicicons.ts). A Mage's channel shows the element it's in.
 */
import type { RelicId } from '../shared/tuning';
import { gridCanvas, type Grid } from './pixgrid';

const SKILLS: Partial<Record<RelicId | 'fire' | 'frost' | 'storm', Grid>> = {
  bash: ['............', '.....gsssss.', '.....suuyus.', '.www.syyyys.', '.....suuyus.', '..www.suyus.', '......suus..', '.www...ss...', '............', '............', '............', '............'],
  horn: ['............', '..........w.', '.........w..', 'yy.....w...w', 'yYyy.....w..', '.yyyyy.....w', '..yyyyyyw...', '...yyyyyy...', '....BBBB....', '............', '............', '............'],
  stamp: ['....gsssss..', '....suuyus..', '....syyyys..', '....suuyus..', '.....suus...', '......ss....', '............', '.y.y.ww.y.y.', '..y.wwww.y..', 'oooooooooooo', '............', '............'],
  net: ['w...w...w...', '.w.w.w.w.w..', '..w...w...w.', '.w.w.w.w.w..', 'w...w...w...', '.w.w.w.w.w..', '..w...w...w.', '.w.w.w.w.w..', 'w...w...w...', '............', '............', '............'],
  volley: ['..g.....g...', '.gs....gs...', 'g.s...g.s...', '..s.g...s...', '..sgs...s...', '..g.s...s...', '....s.......', '..b.s...b...', '.b.bs..b.b..', '....s.......', '...b.b......', '............'],
  sic: ['............', '.oo.........', '.ooo........', '.oooooo.....', 'ooWooooo....', 'oooooooooo..', '..oooooooo..', '...oooooooo.', '...o..o.o.o.', '...o..o.o.o.', '............', '............'],
  shadow: ['.......pp...', '......pPPp..', '.....pP..p..', '.....p......', '..gs..p.....', '...gs..p....', '....gs......', '.....gs.....', '......gs....', '.....b..s...', '....b.......', '............'],
  vanish: ['............', '...oooo.....', '..ogggo.....', '.ogggggoo...', 'ogggggggo...', '.oggggggggo.', '..ooggggggo.', '....oooooo..', '.o......o...', '...o..o.....', '............', '............'],
  knives: ['.....g......', '.....s......', '..g..s..g...', '...s.s.s....', '....sss.....', 'gsssssssssg.', '....sss.....', '...s.b.s....', '..b..b..b...', '.....b......', '............', '............'],
  fire: ['.....f......', '....fF......', '...fFf..f...', '...fFFf.ff..', '..fFFFFfFf..', '..fFWWFFFf..', '.fFFWWWFFf..', '.fFFFWFFFf..', '..fFFFFFf...', '...fffff....', '............', '............'],
  frost: ['.....c......', '..c..c..c...', '...c.c.c....', '....cWc.....', 'cccccWccccc.', '....cWc.....', '...c.c.c....', '..c..c..c...', '.....c......', '............', '............', '............'],
  storm: ['......ee....', '.....ee.....', '....ee......', '...eeeeee...', '......ee....', '.....ee.....', '....ee......', '...ee.......', '..e.........', '............', '............', '............'],
  firering: ['....fffff...', '..ff.....ff.', '.f..FF.....f', '.f.......F.f', 'f..........f', 'f.F........f', 'f..........f', '.f.......F.f', '.f..F......f', '..ff.....ff.', '....fffff...', '............'],
  tether: ['ee..........', '.e..........', '..e...e.....', '...e.e.e....', '....e...e...', '.........e..', '..........e.', '...........e', '..pP....Pp..', '..PP....PP..', '............', '............'],
  blessing: ['.....Y......', '..Y..Y..Y...', '...YYYYY....', '...YFFFY....', 'YYYYFWFYYYY.', '...YFFFY....', '...YYYYY....', '..Y..Y..Y...', '.....Y......', '..yyyyyyy...', '.yyyyyyyyy..', '............'],
  ward: ['.ccccccccc..', '.cCCCcCCCc..', '.cCCCcCCCc..', '.ccccccccc..', '.cCCCcCCCc..', '..cCCcCCc...', '...cCcCc....', '....ccc.....', '.....c......', '............', '............', '............'],
  sanctuary: ['.....Y......', '.....Y......', '...YYYYY....', '.....Y......', '.....Y......', '..yyyyyyy...', '.y.......y..', 'y..........y', 'y...........', '.y.......y..', '..yyyyyyy...', '............'],
  chain: ['.....s......', '....s.s.....', '.....s......', '....s.s.....', '.....s......', '....s.s.....', '...yyyyy....', '..yFfFfFy...', '..yfFfFfy...', '...yyyyy....', '....B.B.....', '............'],
  light: ['.F...F...F..', '..F..F..F...', '....FFF.....', '.FF.FWF.FF..', '....FFF.....', '...syyys....', '...yFfFy....', '...yfFfy....', '...syyys....', '....BBB.....', '............', '............'],
};

/** The class skill's icon (a Mage's channel in its element), or null for a found relic (relicicons.ts draws those). */
export function skillCanvas(r: RelicId, el?: string): HTMLCanvasElement | null {
  const key = r === 'channel' ? ((el as 'fire' | 'frost' | 'storm') || 'fire') : r;
  const g = SKILLS[key];
  return g ? gridCanvas('s-' + key, g) : null;
}
