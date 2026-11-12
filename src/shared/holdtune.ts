/**
 * Holding a boss (docs/design/boss-threat.md, step 2; Kyle, 2026-11-11: "immunity to freeze or mass stun
 * more than once per x seconds"). A boss or a BIG ONE can be chilled, but frozen for at most `freeze` s, and
 * then not again for `freezeAgain` s after it thaws. A relic's stun on one (and any stun on a BIG ONE) lasts
 * `stunShare` of its time, and then nobody can stun it for `stunAgain` s after. A boss's POISE stagger (its
 * own bar, the skill reward) and a fight's own scripted knockdowns are not held back. While it can't be held
 * it shows a pale ring at its feet (client/status.ts). Rules: sim/bosshold.ts.
 */
export const BOSS_HOLD = { freeze: 1, freezeAgain: 10, stunShare: 0.5, stunAgain: 8 };
