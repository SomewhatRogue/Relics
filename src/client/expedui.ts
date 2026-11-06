/**
 * An expedition on screen (main.ts calls it each frame): MAP in the corner while you're on one (M on a
 * laptop), the map screen drawn while it's open (expedmapui.ts), and a word over your hero as things
 * happen: dropped in, a job done, a war-horn, more of them coming, the jobs all done, the beacon lit,
 * the watch come, the weather turning. The words are shared/expedjob.ts's (the weather's shared/sky.ts's).
 */
import { EXPED_SAYS, GOAL_WORDS, MAP_WORDS } from '../shared/expedjob';
import { SKY_TURN } from '../shared/sky';
import { WOOD_BEATS, WOOD_EXIT, WOOD_GOALS } from '../shared/hangwords';
import { FEN_BEATS, FEN_EXIT, FEN_GOALS } from '../shared/fenwords';
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
    if (x && this.dropped !== room) (this.dropped = room), say(room.map.hang ? WOOD_EXIT.drop : room.map.fen ? FEN_EXIT.drop : EXPED_SAYS.drop, '#ffd27a');
    for (const e of evs) {
      if (e.k !== 'exped' || !x) continue;
      const wood = !!room.map.hang, fen = !!room.map.fen;
      if (e.what === 'goal' || e.what === 'side') {
        const q = (e.what === 'goal' ? x.goals : x.sides)[e.i ?? -1];
        const words = wood && q?.kind === 'butcher' ? WOOD_GOALS.hempen : fen && q && q.kind in FEN_GOALS ? FEN_GOALS[q.kind as keyof typeof FEN_GOALS] : q && GOAL_WORDS[q.kind];
        if (words) say(words.done.split('{boss}').join(boss), e.what === 'goal' ? '#ffd27a' : '#c8d0dc');
      }
      // Hangman's Wood (sim/woodzone.ts): a scene on the way said as you come to it, the fire lit.
      else if (e.what === 'beat') {
        const b = room.map.hang?.beats[e.i ?? -1], f = room.map.fen?.beats[e.i ?? -1];
        if (b) say(WOOD_BEATS[b.kind], '#e8dcc0');
        // Fenmere's (shared/fenwords.ts), the butcher by name.
        else if (f) say(FEN_BEATS[f.kind].split('{boss}').join(boss), '#e8dcc0');
      } else if (e.what === 'check') say(fen ? FEN_EXIT.lit : WOOD_EXIT.lit, '#ffd27a');
      else if (e.what === 'open' && (wood || fen)) say(fen ? FEN_EXIT.open : WOOD_EXIT.open, '#ffd27a');
      else if (e.what === 'horn') say(EXPED_SAYS.horn, '#ff6a5a');
      else if (e.what === 'worse') say(EXPED_SAYS.worse, '#ff9a6a');
      else if (e.what === 'open') say(EXPED_SAYS.open, '#ffd27a');
      else if (e.what === 'lit') say(EXPED_SAYS.lit, '#ffd27a');
      else if (e.what === 'watch') say(EXPED_SAYS.watch, '#ffd27a');
      else if (e.what === 'staithelost') say(EXPED_SAYS.staithelost, '#ff9a6a');
      // The weather turned (shared/expedsky.ts): one line, what it does now.
      else if (e.what === 'weather' && x.wx?.to && SKY_TURN[x.wx.to]) say(SKY_TURN[x.wx.to]!, '#c8d8f0');
    }
    this.map.draw(room, me, now);
  }
}
