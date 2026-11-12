/**
 * Every health and damage number on screen, ×SHOWN (docs/design/boss-threat.md, step 1; Kyle, 2026-11-11:
 * "let my numbers be big but its health is bigger"). The fight itself is unchanged: the room still decides
 * in its own small numbers, and only what's shown is scaled, so a hit of 12 reads 120 and a boss's 700 health
 * 7000, and every ratio holds. Use `shown` wherever a hit, a heal, a health figure or a damage figure reaches
 * the screen (popups, cards, drills, perks, recap); stamina, magic, faith, gold and percents stay as they are.
 */
export const SHOWN = 10;
export const shown = (n: number) => Math.round(n * SHOWN);
