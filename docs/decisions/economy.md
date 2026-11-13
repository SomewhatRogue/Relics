# Economy: decisions

The economy chat's log (docs/design/economy.md). Newest at the foot.

## 2026-11-13: claimed (Opus 5.5)

- Row moved from Waiting to Active. Slices in the spec's order: coins on screen, the income measure,
  prices by time, fewer and bigger stat ranks, the purse converted once.
- **The unit change is free at slice 1.** The purse field stays `gold` in the save and the code, but from
  now on its number counts copper: 1 old gold is 1 copper. Prices and income are both in that same
  number, so nobody's buying power moves until slice 3 retunes prices. Slice 5's one-time conversion lands
  in the same push as slice 3's new prices, so no one plays a build with new prices and an old purse.
- Read the Deep, Instances and Trading logs for prices: the Deep's board caps a floor at 400 (DEEP_BOARD),
  trades carry gold in the terms (TRADE_GOLD), instance pay goes through `payFor`. None of their numbers
  change here; any change goes to their chat as a note in this log.
