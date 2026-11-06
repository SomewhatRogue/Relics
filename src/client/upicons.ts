/**
 * The upgrade tiles' pictures (upiconkeys.ts names them): the HUD's and the skills' icons where one
 * fits, and a few drawn here in the same 12 by 12 pixel letters (pixgrid.ts) for what had none: a
 * sword (damage), a boot (speed), a star (crits), breath (stamina or magic back), an hourglass (sooner),
 * plate (taking less), two blades crossed (the counter) and a drop of blood (a bleed).
 */
import { ICONS } from './icons';
import { gridUrl, type Grid } from './pixgrid';
import { skillCanvas } from './skillicons';

const UP: Record<string, Grid> = {
  sword: ['..........gW', '.........gWg', '........gWg.', '.......gWg..', '......gWg...', '.....gWg....', '..y.gWg.....', '...yWg......', '...yy.......', '..bBy.......', '.bB..y......', 'BB..........'],
  boot: ['............', '...BBBB.....', '...BbbB.....', '...BbbB.....', '...BbbB.....', '...BbbB.....', '...BbbBB....', '...BbbbbBB..', '...BbbbbbbB.', '...BBBBBBBB.', '...oo...oo..', '............'],
  star: ['.....Y......', '.....Y......', '....YeY.....', 'YYYYeWeYYYY.', '.YYeWWWeYY..', '...YeWeY....', '..YYe.eYY...', '..YY...YY...', '.YY.....YY..', '.Y.......Y..', '............', '............'],
  breath: ['............', '..cccc......', '.c....c.....', '......c.....', '..cccc......', '............', 'cccccccc....', '........c...', '.....ccc.c..', '....c....c..', '.....cc.c...', '............'],
  hourglass: ['.bbbbbbbbb..', '..wwwwwww...', '..wyyyyyw...', '...wyyyw....', '....wyw.....', '.....w......', '....w.w.....', '...w.y.w....', '..w.yyy.w...', '..wyyyyyw...', '.bbbbbbbbb..', '............'],
  plate: ['..ssssssss..', '.sgggggggds.', 'sgggggggggds', 'sggggWgggdds', 'sgggggggggds', '.sggggggdds.', '.sggggggdds.', '..sgggggds..', '..sggggdds..', '...sggdds...', '....sdds....', '.....ss.....'],
  counter: ['W..........W', 'gW........Wg', '.gW......Wg.', '..gW....Wg..', '...gW..Wg...', '....gWWg....', '....gWWg....', '...yWggWy...', '..yy....yy..', '.bB......Bb.', 'bB........Bb', '............'],
  drop: ['.....r......', '.....r......', '....rRr.....', '....rRr.....', '...rRRRr....', '...rWRRr....', '..rWRRRRr...', '..rRRRRRr...', '..rRRRRRr...', '...rRRRr....', '....rrr.....', '............'],
};

const urls = new Map<string, string>();

/** The image for a picture key ('' with no document, in the tests). */
export function upIcon(key: string): string {
  if (typeof document === 'undefined') return '';
  const had = urls.get(key);
  if (had !== undefined) return had;
  const [kind, id] = key.split(':');
  let url = '';
  if (kind === 'i' && ICONS[id]) url = gridUrl('i-' + id, ICONS[id]);
  else if (kind === 'u' && UP[id]) url = gridUrl('u-' + id, UP[id]);
  else if (kind === 's') url = skillCanvas(id as never)?.toDataURL() ?? '';
  if (!url && UP.star) url = gridUrl('u-star', UP.star);
  urls.set(key, url);
  return url;
}
