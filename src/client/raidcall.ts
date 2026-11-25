/**
 * A raiding party formed on the land (sim/raids.ts, the room's `raid` event, sent to every friend: interest.ts): its war
 * drum, heard by everyone wherever it formed (the soundscape's earshot leaves it alone), and one line across the top of
 * the screen a few seconds (client/raidwords.ts), as the land's banner names a zone.
 */
import { FEN_ROAM } from '../shared/fenroam';
import type { FightEvent } from '../sim/types';
import { RAID_SAYS } from './raidwords';
import { goblin } from './voices';

const SHOW_MS = 3600;
let el: HTMLDivElement | null = null, hide = 0;

function line(): HTMLDivElement {
  if (el) return el;
  el = document.createElement('div');
  el.id = 'raidcall';
  Object.assign(el.style, {
    position: 'fixed', left: '50%', top: '22%', transform: 'translateX(-50%)', zIndex: '40', pointerEvents: 'none',
    font: '400 26px/1.1 var(--font-body)', letterSpacing: '0.08em', color: '#ff6a5a', textShadow: '0 2px 0 #000, 0 0 12px #000',
    padding: '6px 18px 8px', background: '#15171bd0', whiteSpace: 'nowrap', opacity: '0', transition: 'opacity 0.4s',
  });
  document.body.appendChild(el);
  return el;
}

/** The drum: four beats, the off-beats higher, and a far screech after. */
function drum(): void {
  for (let i = 0; i < 4; i++) setTimeout(() => goblin.drum(1, i % 2 === 1), i * 320);
  setTimeout(() => goblin.screech(), 1400);
}

/** Each event of the frame, on the map named `land` (the fen says track, not road). */
export function raidCall(ev: FightEvent, land: string): void {
  if (ev.k !== 'raid') return;
  const b = line();
  b.textContent = land === FEN_ROAM ? RAID_SAYS.track : RAID_SAYS.road;
  b.style.opacity = '1';
  clearTimeout(hide);
  hide = window.setTimeout(() => (b.style.opacity = '0'), SHOW_MS);
  drum();
}
