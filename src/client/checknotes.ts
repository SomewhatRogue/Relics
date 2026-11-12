/**
 * An instance's checkpoint lines, said over your hero (shared/opencutwords.ts CHECK_WORDS): a gate passed,
 * a wipe and how many more the run takes, and walking into an open gate before the rest of the party is
 * there (the gate waits for everyone: Game.together). Each said once, as it happens; the leader's and a
 * friend's page alike, from the run and the room they have.
 */
import { inArea } from '../shared/arena';
import { CHECK_WORDS } from '../shared/opencutwords';
import { INSTANCE } from '../shared/tuning';
import { players } from '../sim/party';
import { gateReady, lastStretch, stretchOf } from '../sim/stretches';
import type { ArenaRoom } from '../sim/room';
import type { Run } from '../sim/run';

export class CheckNotes {
  private index = -1;
  private downs = 0;
  private there = false;

  /** This frame's line, if any. `together`: the whole party already stands in the gate (it's opening). */
  note(run: Run | null, room: ArenaRoom, me: string, together: boolean): string | null {
    if (!run?.job.instance) return void Object.assign(this, { index: -1, downs: 0, there: false }), null;
    let say: string | null = null;
    // A gate passed: the next room, or (one map in stretches) the next stretch.
    const at = run.index * 100 + (run.stretch ?? 0);
    if (at !== this.index) {
      if (this.index >= 0 && at > this.index) say = CHECK_WORDS.passed;
      Object.assign(this, { index: at, downs: run.downs, there: false });
    }
    if (run.downs > this.downs && !run.failed) say = CHECK_WORDS.wiped(INSTANCE.wipes - run.downs);
    this.downs = run.downs;
    // The gate the party's waiting at: this stretch's (sim/stretches.ts), or the room's way out.
    const st = stretchOf(run, room.map), gate = st?.at && gateReady(run, room) ? st.at : !st || lastStretch(run, room.map) ? room.map.exit : undefined;
    const open = st?.at && gate === st.at ? true : room.exitOpen;
    const h = room.heroes.find((x) => x.id === me), e = gate;
    const there = !!h && !!e && open && h.act !== 'down' && inArea(e, h.x, h.y) && !together;
    if (there && !this.there && e) {
      const up = players(room.heroes).filter((x) => x.act !== 'down');
      say = CHECK_WORDS.waiting(up.filter((x) => inArea(e, x.x, x.y)).length, up.length);
    }
    this.there = there;
    return say;
  }
}
