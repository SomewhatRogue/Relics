/**
 * Which buttons are waiting to be pressed for the first time (Kyle, 2026-11-06: "Ditto what your other
 * buttons and abilities are"). A button given (the wood hands it over, or it turns up mid-job for the
 * first time) waits, ringed in gold with its name and key (unlockflash.ts), until its press counter
 * moves. No DOM here, so the rule is tested in Node (tests/firstuse.test.ts).
 */
import type { Intent } from '../sim/types';
import type { BtnId } from './keycaps';

/** The presses each button counts in this screen's intent (a skill and a relic share relicSeq: relicPick says which). */
const SEQ = { attack: 'attackSeq', block: 'blockSeq', roll: 'rollSeq', potion: 'potionSeq', grab: 'grabSeq', element: 'elementSeq', sign: 'signSeq', reload: 'reloadSeq', deep: 'deepSeq' } as const;

export class FirstUse {
  private waiting = new Set<BtnId>();
  private last: Intent | null = null;

  /** Given now: it waits for its first press. */
  give(id: BtnId): void {
    this.waiting.add(id);
  }

  /** Each frame, this screen's intent: a button whose press count moved has been used. Returns those just used. */
  pressed(i: Intent): BtnId[] {
    const was = this.last, used: BtnId[] = [];
    this.last = { ...i };
    if (!was) return used;
    for (const [id, k] of Object.entries(SEQ) as [BtnId, (typeof SEQ)[keyof typeof SEQ]][]) if ((i[k] ?? 0) !== (was[k] ?? 0)) used.push(id);
    if (i.relicSeq !== was.relicSeq) used.push(i.relicPick === 1 ? 'relic' : 'skill');
    for (const k of used) this.waiting.delete(k);
    return used;
  }

  /** Still waiting for its first press. */
  waits(id: BtnId): boolean {
    return this.waiting.has(id);
  }

  get list(): BtnId[] {
    return [...this.waiting];
  }
}
