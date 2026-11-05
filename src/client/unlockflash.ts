/**
 * The wood gives you its buttons a lesson at a time (Game.taught). The first time one is given, it
 * pulses gold for a few seconds with a small label naming it (cluster.css .unlock); on a laptop, which
 * has no buttons, the move and its key are said over your hero instead.
 */
import { guardOf, dodgeName, WEAPONS } from '../shared/weapons';
import { knows, type Hero } from '../sim/types';
import { SIGNS, SIGN_KEY, signOf } from '../shared/signs';

const SECS = 4;
/** The phone's buttons for each move the wood teaches, and what each is called. */
const BTN: Record<string, [string, string][]> = {
  attack: [['.tb.attack', 'ATTACK']],
  roll: [['.tb.roll', 'DODGE']],
  block: [['.tb.block', 'BLOCK']],
  relic: [['.tb.relic', 'SKILL'], ['.tb.relic2', 'RELIC']],
  potion: [['.tb.potion', 'POTION']],
  grab: [['.tb.grab', 'GRAB']],
  element: [['.tb.element', 'ELEMENT']],
  // A Rogue's, Ranger's or Healer's own button: named for the class (signName).
  sign: [['.tb.sign', '']],
};
/** A laptop's: the move and its key. */
const KEYS: Record<string, string> = { attack: 'ATTACK: LEFT CLICK', roll: 'DODGE: SPACE', block: 'BLOCK: RIGHT CLICK', relic: 'SKILL: E', potion: 'POTION: Q', grab: 'GRAB: G', element: 'ELEMENT: X' };
/** What this hero's guard is called: BLOCK, or PARRY for a parry-only kit (the spellblade too). */
function guardName(me: Hero): string {
  return guardOf(WEAPONS[me.weapon]) === 'parry' ? 'PARRY' : 'BLOCK';
}
/** A Rogue's, Ranger's or Healer's own button's name (SHADOW STEP, MARK, MEND). */
const signName = (me: Hero) => { const s = signOf(WEAPONS[me.weapon].cls); return s ? SIGNS[s].name : ''; };
/** A laptop's line for a move: the hero's own word for it; the relic lesson names SKILL only once one is known. */
function keyLine(m: string, me: Hero): string | null {
  const cls = WEAPONS[me.weapon].cls;
  if (m === 'roll') return KEYS.roll.replace('DODGE', dodgeName(cls));
  if (m === 'block') return KEYS.block.replace('BLOCK', guardName(me));
  if (m === 'relic') return knows(me, 'skill') ? KEYS.relic : me.relics[1] ? 'RELIC: R' : null;
  if (m === 'sign') return signName(me) ? `${signName(me)}: ${SIGN_KEY}` : null;
  return KEYS[m] ?? null;
}

export class UnlockFlash {
  private had: Set<string> | null = null;
  private until = new Map<HTMLElement, number>();

  /** Each frame: `taught` the wood's moves now (null out of the wood). `say` speaks over the hero (laptop). */
  update(taught: string[] | null, me: Hero, touch: boolean, now: number, say: (s: string) => void, wait = false): void {
    const cls = WEAPONS[me.weapon].cls;
    if (!taught) this.had = null;
    else {
      // (The first frames of the wood, while you lie there, teach nothing: so only what comes after counts.)
      const fresh = this.had ? taught.filter((m) => !this.had!.has(m)) : [];
      this.had = new Set(taught);
      for (const m of fresh) {
        if (!touch) {
          const line = keyLine(m, me);
          if (line) say(line);
          continue;
        }
        for (const [sel, name] of BTN[m] ?? []) {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (!el) continue;
          el.dataset.unlock = m === 'roll' ? dodgeName(cls) : m === 'block' ? guardName(me) : m === 'sign' ? signName(me) : name;
          this.until.set(el, now + SECS);
        }
      }
    }
    for (const [el, t] of this.until) {
      // (While the wood is teaching you to move, a button's flash waits its turn: it'd point the wrong way.)
      if (wait) { this.until.set(el, Math.max(t, now + SECS)); el.classList.remove('unlock'); continue; }
      const on = now < t && !el.hidden;
      el.classList.toggle('unlock', on);
      if (now >= t) this.until.delete(el);
    }
  }
}
