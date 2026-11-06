/**
 * The townsfolk's recorded voices: a greeting when their panel opens and a goodbye when it closes, at
 * most once every 20 s each (GAPS) so tapping in and out doesn't spam; Tobin's panic instead of his
 * greeting when you carry hungry gear; Nettle's hushed line on SELL QUIETLY; Odric's quiet prayer when
 * you give to the Lantern and his whisper when you give something up. `say` plays a line and answers
 * its length (0: not played, so the typed line's blip carries it); `hush` quiets the blips that long.
 */
import { makeGate, type Person } from './voicebank';

export type Say = (name: string, who: Person) => number;

export function createTownVoice(say: Say, hush: (seconds: number) => void = () => {}) {
  const gate = makeGate();
  let current: Person | null = null;
  const line = (who: Person, kind: string, name: string, now: number) => {
    if (!gate.ok(who, kind, now)) return 0;
    const d = say(name, who);
    if (d > 0) hush(d);
    return d;
  };
  return {
    /** Whose panel is open (null: nobody voiced). */
    get current() { return current; },
    /** A panel opens on `who`. `panic`: Tobin, and you carry hungry gear. */
    open(who: Person | null, now: number, panic = false): number {
      current = who;
      if (!who) return 0;
      return panic && who === 'tobin' ? line(who, 'panic', 'tobin_panic', now) : line(who, 'greet', who + '_greet', now);
    },
    /** The panel closes: their goodbye. */
    close(now: number): number {
      const who = current;
      current = null;
      return who ? line(who, 'bye', who + '_bye', now) : 0;
    },
    /** Nettle's SELL QUIETLY tab. */
    hush: (now: number) => line('nettle', 'hush', 'nettle_hush', now),
    /** Odric, when you give to the Lantern. */
    pray: (now: number) => line('odric', 'pray', 'odric_pray', now),
    /** Odric, when hungry gear is given up on the step. */
    rite: (now: number) => line('odric', 'rite', 'odric_rite', now),
  };
}
export type TownVoice = ReturnType<typeof createTownVoice>;
