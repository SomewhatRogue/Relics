/**
 * An expedition on screen (main.ts calls it each frame): MAP in the corner while you're on one (M on a
 * laptop), the map screen drawn while it's open (expedmapui.ts), and a word over your hero as things
 * happen: dropped in, a job done, a war-horn, more of them coming, the jobs all done, the beacon lit,
 * the watch come, the weather turning. The words are shared/expedjob.ts's (the weather's shared/sky.ts's).
 */
import { EXPED_SAYS, GOAL_WORDS, MAP_WORDS } from '../shared/expedjob';
import { SKY_TURN } from '../shared/sky';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent } from '../sim/types';
import { ExpedMap } from './expedmapui';

export class ExpedUi {
  readonly map = new ExpedMap();
  private dropped: ArenaRoom | null = null;
  private btn: HTMLButtonElement | null = null;

  constructor() {
    const corner = document.getElementById('corner');
    if (!corner) return;
    const b = (this.btn = document.createElement('button'));
    (b.id = 'mapbtn'), (b.textContent = MAP_WORDS.button), b.setAttribute('aria-label', 'Map');
    b.addEventListener('click', () => this.map.toggle());
    corner.prepend(b);
    addEventListener('keydown', (e) => {
      if ((e.key === 'm' || e.key === 'M') && document.body.classList.contains('exped') && !(e.target instanceof HTMLInputElement)) this.map.toggle();
    });
  }

  /**
   * Each frame: `room` the one you're in, `on` whether it's an expedition's, `evs` this frame's events,
   * `say` puts words over your hero. `boss`: the job's named butcher.
   */
  frame(room: ArenaRoom, on: boolean, evs: FightEvent[], me: string, now: number, say: (s: string, col: string) => void, boss = ''): void {
    document.body.classList.toggle('exped', on);
    if (!on) return void (this.map.open && this.map.toggle(false));
    const x = room.exped;
    if (x && this.dropped !== room) (this.dropped = room), say(EXPED_SAYS.drop, '#ffd27a');
    for (const e of evs) {
      if (e.k !== 'exped' || !x) continue;
      if (e.what === 'goal' || e.what === 'side') {
        const q = (e.what === 'goal' ? x.goals : x.sides)[e.i ?? -1];
        if (q) say(GOAL_WORDS[q.kind].done.split('{boss}').join(boss), e.what === 'goal' ? '#ffd27a' : '#c8d0dc');
      } else if (e.what === 'horn') say(EXPED_SAYS.horn, '#ff6a5a');
      else if (e.what === 'worse') say(EXPED_SAYS.worse, '#ff9a6a');
      else if (e.what === 'open') say(EXPED_SAYS.open, '#ffd27a');
      else if (e.what === 'lit') say(EXPED_SAYS.lit, '#ffd27a');
      else if (e.what === 'watch') say(EXPED_SAYS.watch, '#ffd27a');
      // The weather turned (shared/expedsky.ts): one line, what it does now.
      else if (e.what === 'weather' && x.wx?.to && SKY_TURN[x.wx.to]) say(SKY_TURN[x.wx.to]!, '#c8d8f0');
    }
    this.map.draw(room, me, now);
  }
}
