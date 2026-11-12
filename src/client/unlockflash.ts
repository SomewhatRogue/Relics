/**
 * The wood gives you its buttons a lesson at a time (Game.taught). A button just given is ringed in gold
 * with its name over it (cluster.css .unlock), and on a laptop its key too (short: the lesson card says
 * it in full), until you've pressed it once
 * (Kyle, 2026-11-06: "Ditto what your other buttons and abilities are"; it was 4 s, easy to miss). On a
 * laptop, whose buttons sit in a row at the bottom (keybar.css), the move and its key are also said over
 * your hero. Out of the wood, a button that turns up for the first time (a relic picked up, a skill
 * learned) is ringed the same way till it's used, unless you've used it before on this device.
 */
import { dodgeName, WEAPONS } from '../shared/weapons';
import { knows, type Hero, type Intent } from '../sim/types';
import { SIGNS, signOf } from '../shared/signs';
import { BTN_SEL, KEYCAP, KEYLONG, type BtnId } from './keycaps';
import { FirstUse } from './firstuse';

/** Grabs goblins at all (sim/grab.ts): a Warrior, or a Mage with the spellblade. */
export const grabsGoblins = (me: Hero) => WEAPONS[me.weapon].cls === 'WARRIOR' || me.weapon === 'spellblade';
/** The buttons for each move the wood teaches. */
const BTN: Record<string, BtnId[]> = { attack: ['attack'], roll: ['roll'], block: ['block'], relic: ['skill', 'relic'], potion: ['potion'], grab: ['grab'], element: ['element'], sign: ['sign'] };
/** The buttons that can turn up later (the context slot, RELOAD and USE come and go: never ringed). */
const LATER: BtnId[] = ['attack', 'block', 'roll', 'skill', 'relic', 'potion', 'element', 'sign'];
/** A Rogue's, Ranger's or Healer's own button's name (SHADOW STEP, MARK, MEND). */
const signName = (me: Hero) => { const s = signOf(WEAPONS[me.weapon].cls); return s ? SIGNS[s].name : ''; };
/** What a button is called, for this hero. */
function nameOf(id: BtnId, me: Hero): string {
  if (id === 'roll') return dodgeName(WEAPONS[me.weapon].cls, WEAPONS[me.weapon]);
  if (id === 'sign') return signName(me);
  return { attack: 'ATTACK', block: 'BLOCK', skill: 'SKILL', relic: 'RELIC', potion: 'POTION', grab: 'GRAB', use: 'USE', reload: 'RELOAD', element: 'ELEMENT' }[id];
}
/** A laptop's line over the hero for a move: the relic lesson names SKILL only once one is known. */
function keyLine(m: string, me: Hero): string | null {
  if (m === 'relic') return knows(me, 'skill') ? `SKILL: ${KEYLONG.skill}` : me.relics[1] ? `RELIC: ${KEYLONG.relic}` : null;
  const id = BTN[m]?.[0];
  return id && nameOf(id, me) ? `${nameOf(id, me)}: ${KEYLONG[id]}` : null;
}

/** Buttons pressed at least once on this device (a convenience: lost with the site's data, no harm done). */
const USED = 'relic.buttonsUsed';
function usedBefore(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(USED) ?? '[]')); } catch { return new Set(); }
}
function remember(ids: BtnId[]): void {
  try { localStorage.setItem(USED, JSON.stringify([...new Set([...usedBefore(), ...ids])])); } catch { /* (private window) */ }
}

const el = (id: BtnId) => document.querySelector(BTN_SEL[id]) as HTMLElement | null;

export class UnlockFlash {
  private had: Set<string> | null = null;
  private uses = new FirstUse();
  /** Out of the wood: buttons already on screen (the first frame's don't count as new). */
  private seen: Set<BtnId> | null = null;
  private used = usedBefore();

  /**
   * Each frame: `taught` the wood's moves now (null out of the wood); `intent` this screen's presses.
   * `say` speaks over the hero (laptop). `wait`: the wood is teaching you to move, so the rings wait.
   */
  update(taught: string[] | null, me: Hero, touch: boolean, intent: Intent, mode: string, say: (s: string) => void, wait = false): void {
    const just = this.uses.pressed(intent);
    if (just.some((k) => !this.used.has(k))) just.forEach((k) => this.used.add(k)), remember(just);
    if (!taught) this.had = null;
    else {
      // (The first frames of the wood, while you lie there, teach nothing: so only what comes after counts.)
      const fresh = this.had ? taught.filter((m) => !this.had!.has(m)) : [];
      this.had = new Set(taught);
      for (const m of fresh) {
        // Only a Warrior, or a Mage with the spellblade, grabs goblins: nobody else is told about GRAB (Kyle, 2026-11-05).
        if (m === 'grab' && !grabsGoblins(me)) continue;
        if (!touch) {
          const line = keyLine(m, me);
          if (line) say(line);
        }
        for (const id of BTN[m] ?? []) this.uses.give(id);
      }
    }
    // Out of the wood (and out of town, where the fight's buttons are put away): a button new to you.
    if (taught || mode === 'town') this.seen = taught ? null : this.seen;
    else {
      const up = LATER.filter((id) => el(id) && !el(id)!.hidden);
      if (this.seen) for (const id of up) if (!this.seen.has(id) && !this.used.has(id)) this.uses.give(id);
      this.seen = new Set([...(this.seen ?? []), ...up]);
    }
    for (const id of Object.keys(BTN_SEL) as BtnId[]) {
      const b = el(id);
      if (!b) continue;
      const on = this.uses.waits(id) && !wait && !b.hidden;
      if (on) {
        const word = nameOf(id, me) + (touch ? '' : `: ${KEYCAP[id]}`);
        if (b.dataset.unlock !== word) b.dataset.unlock = word;
      }
      if (b.classList.contains('unlock') !== on) b.classList.toggle('unlock', on);
    }
  }
}
