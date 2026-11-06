/**
 * The HUD's pixel icons (pixgrid.ts letters): the corner row, the guard and the dodges, the context
 * slot's actions, and the small status marks under the portrait. Words stay in tooltips and menus.
 */
import { gridCanvas, gridUrl, type Grid } from './pixgrid';

export const ICONS: Record<string, Grid> = {
  pack: ['............', '....LLLL....', '...L....L...', '.LLLLLLLLLL.', '.LllllllllL.', '.LlllyylllL.', '.LLLLyyLLLL.', '.LllllllllL.', '.LllllllllL.', '.LllllllllL.', '.LLLLLLLLLL.', '............'],
  cog: ['.....gg.....', '..g.gggg.g..', '.gggssssggg.', '..gss..ssd..', '.gss....ssd.', 'ggs......sdd', 'ggs......sdd', '.gss....ssd.', '..sss..ssd..', '.ddsssssddd.', '..d.dddd.d..', '.....dd.....'],
  chat: ['............', '..wwwwwwww..', '.wwwwwwwwww.', 'wwwwwwwwwwww', 'wwOwwOwwOwww', 'wwwwwwwwwwww', '.wwwwwwwwww.', '..wwwwwwww..', '...ww.......', '..ww........', '.w..........', '............'],
  leave: ['............', '.BBBBBB.....', '.BbbbbB.....', '.BbbbbB..y..', '.BbbbbB..yy.', '.BbbybByyyyy', '.BbbbbB..yy.', '.BbbbbB..y..', '.BbbbbB.....', '.BbbbbB.....', '.BBBBBB.....', '............'],
  heroes: ['.....rr.....', '....ssss....', '...sggggs...', '..sggggsss..', '..sgsssssd..', '..kkkkkkkk..', '..sgsssssd..', '..sgs.s.sd..', '..sgssssd...', '...sssssd...', '....dddd....', '............'],
  sound: ['.....yy.....', '....yYYy....', '...yYYyyy...', '...yYyyyy...', '...yYyyyy...', '..yYyyyyyy..', '..yyyyyyyy..', '.yyyyyyyyyy.', '.BBBBBBBBBB.', '.....yy.....', '............', '............'],
  music: ['......wwwww.', '......wwwww.', '......w...w.', '......w...w.', '......w...w.', '......w...w.', '......w...w.', '....www.www.', '...wwww.www.', '...wwww.ww..', '....ww......', '............'],
  // VOICES: a head in profile, speaking.
  voices: ['....www.....', '...wwwww....', '..wwwwwww.y.', '..wwwwww..y.', '..wwwww.y..y', '..wwwwww...y', '...wwwww.y.y', '...wwww..y..', '....www.....', '...wwwww....', '..wwwwwww...', '............'],
  tips: ['............', '....wwww....', '...ww..ww...', '.......ww...', '......ww....', '.....ww.....', '.....ww.....', '............', '.....ww.....', '.....ww.....', '............', '............'],
  view: ['............', '............', '....wwww....', '..ww....ww..', '.w...UU...w.', 'w...UkkU...w', '.w...UU...w.', '..ww....ww..', '....wwww....', '............', '............', '............'],
  // An expedition's MAP: a folded sheet, the way marked on it.
  map: ['............', '.BBBBBBBBBB.', '.ByyyBwwwwB.', '.ByyyBwwrwB.', '.ByrrBwwrwB.', '.ByyrBwrwwB.', '.ByyrBrwwwB.', '.ByyyBwwwwB.', '.ByyyBwwwwB.', '.BBBBBBBBBB.', '............', '............'],
  // The guard: a heater shield to block.
  block: ['gggggggggggg', 'suuuuyyuuuus', 'suuuuyyuuuus', 'suuuuyyuuuus', 'syyyyyyyyyys', 'suuuuyyuuuus', 'suuuuyyuuuus', '.suuuyyuuus.', '.suuuyyuuus.', '..suuyyuus..', '...suyyus...', '....ssss....'],
  // The dodges, one each (dodgeName): JUMP, DASH, BLINK, ROLL.
  jump: ['.....ww.....', '....wwww....', '...ww..ww...', '..ww....ww..', '.ww......ww.', '............', '.....ww.....', '....wwww....', '...ww..ww...', '..ww....ww..', '............', '.o.o....o.o.'],
  dash: ['............', '.ww...ww....', '..ww...ww...', '...ww...ww..', '....ww...ww.', '.....ww...ww', '....ww...ww.', '...ww...ww..', '..ww...ww...', '.ww...ww....', '............', '............'],
  blink: ['.....p......', '.....p......', '....pPp.....', '..p.pWp.p...', 'pppPWWWPppp.', '..p.pWp.p...', '....pPp.....', '.....p......', '.....p...p..', '........pWp.', '.........p..', '............'],
  roll: ['............', '...wwwww....', '..w.....w...', '.w.......w..', '.w......www.', '.w.......w..', '.w..........', '..w.........', '...wwwww....', '............', '............', '............'],
  // The crossbow's RELOAD: a bolt in a winding arrow.
  reload: ['....wwww....', '..ww....ww..', '.w...gg...wW', '.w..gssg..WW', 'w....bb.....', 'w....bb.....', 'w....bb....w', '.w...bb....w', '.w..yyyy..w.', '..ww.yy.ww..', '....wwww....', '............'],
  // The options box's BUTTONS (what each icon means): a round button with a letter on it.
  buttons: ['............', '...ssssss...', '..sggggggs..', '.sgg.ww.ggs.', '.sg.w..w.gs.', '.sg.wwww.gs.', '.sg.w..w.gs.', '.sgg....ggd.', '..sggggggd..', '...dddddd...', '............', '............'],
  // The context slot's actions.
  grab: ['....h.h.....', '..h.h.h.h...', '..h.h.h.h...', '..h.h.h.h...', '..hhhhhhh.h.', '..hhhhhhhhh.', '..hhhhhhhh..', '..hhhhhhh...', '...hhhhhh...', '...hhhhh....', '....HHHH....', '............'],
  throw: ['.......wwww.', '.........ww.', '........w.w.', '.......w..w.', '......w.....', '.....w......', '....w.......', '...h........', '..hhh.......', '.hhhhh......', '..hhh.......', '............'],
  slam: ['....wwww....', '....wwww....', '....wwww....', '....wwww....', '.wwwwwwwwww.', '..wwwwwwww..', '...wwwwww...', '....wwww....', '.....ww.....', '.y.y....y.y.', 'oooooooooooo', '............'],
  help: ['.....Y......', '....YYY.....', '...YYYYY....', '.....Y......', '.....Y......', '..h.h.h.h...', '..h.h.h.h...', '..hhhhhhh...', '..hhhhhhh...', '...hhhhh....', '...hhhhh....', '............'],
  burn: ['.....F......', '....FfF.....', '...FffF.....', '...ffFff....', '....fff.....', '....BBB.....', '....bbb.....', '.....b......', '.....b......', '.....b......', '.....B......', '............'],
  open: ['............', '..BBBBBBBB..', '.BbbbbbbbbB.', '.BbbbbbbbbB.', '.yyyyyyyyyy.', '.BbbbyybbbB.', '.BbbbYybbbB.', '.BbbbbbbbbB.', '.BbbbbbbbbB.', '.BBBBBBBBBB.', '............', '............'],
  enter: ['...BBBBBB...', '..BbbbbbbB..', '.BbbbBbbbbB.', '.BbbbBbbbbB.', '.BbbbBbbbbB.', '.BbbbBbbybB.', '.BbbbBbbbbB.', '.BbbbBbbbbB.', '.BbbbBbbbbB.', '.BBBBBBBBBB.', 'oooooooooooo', '............'],
  use: ['....h.......', '....h.......', '....h.......', '....hhh.h...', '..h.hhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '...hhhhhhh..', '...hhhhhh...', '....hhhhh...', '....HHHH....', '............'],
  // Small marks: hearts, coin, a friend fallen, and the statuses.
  heart: ['.rr.rr.', 'rWrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  hollow: ['.oo.oo.', 'o..o..o', 'o.....o', '.o...o.', '..o.o..', '...o...'],
  coin: ['..yyy..', '.yYYyy.', 'yYyyyyB', 'yYyyyyB', 'yyyyyyB', '.yyyyB.', '..BBB..'],
  // A friend down or out (never dead in this world: they can be helped up or raised): their shield
  // fallen flat on the ground, and a gold mark over it pointing up.
  fallen: ['....Y....', '...YYY...', '..sssss..', '.suuyyus.', 'suyyyyyus', '.suuyyus.', '.OOOOOOO.'],
  room: ['..o..', '.ooo.', 'ooooo', '.ooo.', '..o..'],
  roomon: ['..Y..', '.YyY.', 'YyyyY', '.YyY.', '..Y..'],
  poison: ['....n....', '....n....', '...nnn...', '..nnnnn..', '..nWnnn..', '.nWnnnnN.', '.nnnnnnN.', '..nnnnN..', '...NNN...'],
  blessed: ['....Y....', '.Y..Y..Y.', '..YYYYY..', '..YFFFY..', 'YYYFFFYYY', '..YFFFY..', '..YYYYY..', '.Y..Y..Y.', '....Y....'],
  ward: ['ccccccccc', 'cCCCcCCCc', 'cCCCcCCCc', 'ccccccccc', 'cCCCcCCCc', '.cCCcCCc.', '..cCcCc..', '...ccc...', '....c....'],
  brandy: ['.........', '.yyyyy...', '.wwwww...', '.bbbbbbb.', '.bYbbb.b.', '.bYbbb.b.', '.bbbbbbb.', '.bbbbb...', '.BBBBB...'],
  smoke: ['.........', '...oooo..', '..oggggo.', '.ogggggo.', 'ogggggggo', 'ogggggggo', '.ooooooo.', '.........', '.........'],
  tempo: ['.....ee..', '....ee...', '...ee....', '..eeeee..', '....ee...', '...ee....', '..ee.....', '.ee......', '.........'],
  mend: ['...rrr...', '...rWr...', 'rrrrWrrrr', 'rWWWWWWWr', 'rrrrWrrrr', '...rWr...', '...rrr...'],
  // A job's weather on the board (shared/sky.ts): sun (a moon at night), rain, fog, storm.
  clear: ['....Y....', '.Y..Y..Y.', '..YYYYY..', '..YeeeY..', 'YYYeeeYYY', '..YeeeY..', '..YYYYY..', '.Y..Y..Y.', '....Y....'],
  moon: ['...www...', '..wwg....', '.wwg.....', '.wwg.....', '.wwg.....', '.wwg.....', '..wwg....', '...www...', '.........'],
  rain: ['...ggg...', '.gggggg..', 'gggggggWs', 'sssssssss', '.........', '.c..c..c.', 'c..c..c..', '.........', '.c..c..c.'],
  fog: ['.........', 'gggggg...', '.........', '..gggggg.', '.........', 'gggggggg.', '.........', '.ggggg...', '.........'],
  storm: ['...sss...', '.ssssss..', 'ssssssssd', 'ddddddddd', '....e....', '...ee....', '..eeee...', '....e....', '...e.....'],
  lit: ['....F....', '...FfF...', '...FfF...', '....f....', '...www...', '...www...', '...www...', '...www...', '..BBBBB..'],
};

export type IconId = keyof typeof ICONS;
export const icon = (id: IconId, tint?: string) => gridCanvas('i-' + id, ICONS[id], tint);
export const iconUrl = (id: IconId, tint?: string) => gridUrl('i-' + id, ICONS[id], tint);

/** Hand the corner row's and the menu's icons to the CSS (--ic-pack and so on). */
export function iconVars(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  for (const id of ['pack', 'cog', 'chat', 'leave', 'heroes', 'sound', 'music', 'voices', 'tips', 'view', 'heart', 'hollow', 'coin', 'fallen', 'room', 'roomon', 'lit', 'buttons', 'map']) root.setProperty('--ic-' + id, `url(${iconUrl(id)})`);
}
