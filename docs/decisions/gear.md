# Gear: decisions

The Gear chat's log (docs/design/gear-levels.md). Newest at the foot.

## 2026-11-14: claimed (Opus 5.5)

- Row moved from Waiting to Active. Slices in the spec's order: item level, modifiers and words, rarity
  measured, legs, looks.
- Uniques stay the Deep chat's (`shared/uniques.ts`, `uniquenames.ts`, `sim/uniquedrop.ts`); gear looks
  pair with docs/design/gear-looks.md. Anything this chat needs from those files goes here as a note to
  that chat. Prices go through the Economy log's rules (`jobs()`, tests/prices.test.ts).
