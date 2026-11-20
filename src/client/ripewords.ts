/**
 * The crossroads' words (shared/crossroads.ts; client/ripeui.ts): a vowed piece at full strength, on the next
 * return to town. `name` is the piece's own (VOWED), said as written on its card.
 * Words through the lore keeper and the line editor, 2026-11-20.
 */
export const RIPEW = {
  /** Why the moment came. */
  ripe: (name: string) => `${name} has grown all it can.`,
  give: 'GIVE IT UP',
  giveLine: 'Leave it at the church to make great amends, and you get a fresh vowed piece for this slot.',
  fall: 'KEEP IT',
  fallLine: 'It turns hungry and stronger than any hungry piece, its bites start at once, and your own hunger grows faster.',
  /** Father Odric, taking a ripe piece back and handing over a fresh one. */
  thanks: "You've carried it as far as it goes, then, and I'll put it back where it came from. Here, this one's yours.",
  /** A plain line once it has fallen. */
  fell: (name: string) => `${name} is hungry now.`,
  /** What a fallen piece's name carries, after it, for good (asked of the Gear chat's itemName: "THE WIDOW'S SWORD, ONCE VOWED"). */
  once: 'ONCE VOWED',
};
