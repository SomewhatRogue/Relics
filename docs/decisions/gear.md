# Gear: decisions

The Gear chat's log (docs/design/gear-levels.md). Newest at the foot.

## 2026-11-14: claimed (Opus 5.5)

- Row moved from Waiting to Active. Slices in the spec's order: item level, modifiers and words, rarity
  measured, legs, looks.
- Uniques stay the Deep chat's (`shared/uniques.ts`, `uniquenames.ts`, `sim/uniquedrop.ts`); gear looks
  pair with docs/design/gear-looks.md. Anything this chat needs from those files goes here as a note to
  that chat. Prices go through the Economy log's rules (`jobs()`, tests/prices.test.ts).

## 2026-11-14: slice 1, item level (Opus 5.5)

- `shared/itemlevel.ts`: `ILVL` (7% a level compounding, LV 1 to 20, the base lift a level), `dropLevel`,
  `growAt`, `atLevel`. `Item.ilvl` (loot.ts). Modifiers are saved as worth: a drop is rolled at LV 1 and
  raised once where it fell (`raise`, budget.ts), so every reader of `mods` reads the truth.
- The tiers sit close (mods.ts PER_MOD): after costs FINE 13, FORGED 16, PRE-WAR 20, TOUCHED 24,
  TURNING 28, HUNGRY 32. I read the spec's numbers as what a piece is worth after its cost, so TOUCHED
  still beats a same-level PRE-WAR: costs scaled to the new points (costs.ts COST_POINTS 5 and 8, from 8
  and 14), modifiers 29 and 36 before them. Costs grow with the level too.
- Where it dropped: the room's level (the Deep's band already on it), an elite's two levels on top, a
  hard place's or long job's treasure one more. The old free +1 at 5 and +2 at 9 is gone: the level does
  that job (base lift 3% damage, 0.5% less taken, 0.75 ring health a level, about what the free plus gave).
- Light armor's lift (budget.ts) isn't grown by a level, so light and plate stay level at every level.
- `rollQuality` takes the level out: prices stay by tier and roll, as the Economy log set them.
- **Old pieces give exactly what they gave**: no `ilvl` means no base lift (their free plus is still in
  `level`), modifiers untouched. The card reads their level from their points (`ilvlOf`), never more
  than they give. Pluses stay pluses.
- The card shows `LV 7` beside the tier (card.ts, one line in style.css).
- **For Trading**: `cleanItem` (shared/trade.ts) should copy `ilvl` (a whole number, 1 to 20) with
  `level` and `temper`. Without it a traded piece keeps its modifiers but loses its base lift and reads
  its level from its points.
- **For Deep**: uniques drop without a level, so they read as their points say (a unique's fixed
  modifiers read about LV 10 to 12 as PRE-WAR). To drop one at the floor's level: roll its fixed
  modifiers as LV 1 values (divide today's by about 2) with `ilvl: 1`, then `raise(item, dropLevel(lv))`.
- Open: shop stock is LV 1 (Tobin's, the pawn); whether it follows your level is Kyle's call.
- Tests: tests/itemlevel.test.ts (the crossings, raising, the base lift, old pieces, treasure).
