/**
 * Heroes' voices in a fight: a grunt on a heavy swing, a gasp when hurt, a cry when downed, a breath on
 * getting up, a laugh when the hound knocks a Ranger flat. (A Cleric no longer prays aloud on a heal or a
 * smite: Kyle, 2026-11-06; the smite is the sound of it striking instead.) Each hero's voice follows its look (voicebank.ts LOOK_VOICE), so a party sounds
 * different, and each kind is rate-limited per hero (GAPS) so a combo doesn't stack grunts. `say` plays
 * a line and answers its length (0: not ready; efforts are dropped, never late). Cosmetic only.
 */
import { WEAPONS } from '../shared/tuning';
import type { FightEvent, Hero } from '../sim/types';
import { heroVoice, makeGate, type HeroVoice } from './voicebank';

export type HeroSay = (name: string, vol: number) => number;

const voiceOf = (h: Hero): HeroVoice => heroVoice(WEAPONS[h.weapon].cls, h.look ?? 0);
const near = (heroes: readonly Hero[], x: number, y: number, max: number, only?: (h: Hero) => boolean) => {
  let best: Hero | undefined, bd = max;
  for (const h of heroes) {
    if (only && !only(h)) continue;
    const d = Math.hypot(h.x - x, h.y - y);
    if (d < bd) (bd = d), (best = h);
  }
  return best;
};

export function createHeroVoice(say: HeroSay) {
  const gate = makeGate();
  /** Your own hero is heard full; the others a little back. */
  let me = '';
  const speak = (h: Hero | undefined, kind: string, now: number): number => {
    if (!h || !gate.ok(h.id, kind, now)) return 0;
    return say(`hero_${voiceOf(h)}_${kind}`, h.id === me ? 1 : 0.7);
  };
  return {
    voiceOf,
    setMe: (id: string) => void (me = id),
    /** A fight event: the hero it belongs to says their piece, if it's their turn. */
    event(ev: FightEvent, heroes: readonly Hero[], now: number): number {
      if (ev.k === 'swing' && ev.heavy) return speak(near(heroes, ev.x, ev.y, 1.5), 'grunt', now);
      if (ev.k === 'hit' && ev.on === 'hero' && !ev.tick && ev.n > 0) return speak(near(heroes, ev.x, ev.y, 1.5), 'hurt', now);
      if (ev.k === 'down') return speak(heroes.find((h) => h.id === ev.id) ?? near(heroes, ev.x, ev.y, 1.5), 'down', now);
      if (ev.k === 'gotup') return speak(heroes.find((h) => h.id === ev.id) ?? near(heroes, ev.x, ev.y, 1.5), 'up', now);
      // No spoken prayer on a heal or a smite (Kyle, 2026-11-06: "his bark when he smites is SO annoying ... a full prayer sucks;
      // I'd rather it sounds more like the smite coming down"): the smite is heard as light striking (soundscape.ts).
      return 0;
    },
    /** An idle playing on `h`, `t` s in: the Ranger laughs on the floor when the hound bowls them over. */
    idle(h: Hero, id: string, t: number, now: number): number {
      return id === 'r_tackle' && t > 1.4 && t < 2.2 ? speak(h, 'laugh', now) : 0;
    },
  };
}
export type HeroVoices = ReturnType<typeof createHeroVoice>;
