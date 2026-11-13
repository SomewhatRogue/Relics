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

## 2026-11-13: slice 1, coins on screen (Opus 5.5)

- `shared/coins.ts`: `coins(n)` (plain, for the canvas: `3g 4s 20c`), `coinsHtml(n)` (each part in its
  colour with a round coin mark, `client/coins.css`), `coinCol(n)` (a floater's colour by its biggest
  coin). Zero parts left out; nothing at all is `0c`. `tests/coins.test.ts`.
- Every amount on screen goes through it: shop rows and buy buttons, Tobin's and Nettle's sell grids,
  the trainer's rows, tiles and header, the forge, the vault, the purse lines, the works, the Lantern,
  the statue, the pastimes and their bets, Moll's dice and the wishing coin, job pay on the board and in
  the recap, the church's recharge, the home card, the Roll's COIN EARNED and COIN GIVEN, fight floaters.
- Numbers unchanged: 1 old gold is 1 copper, prices and income in the same count (see claim above).
- Prose that used "gold" for money says "coin" now (recap, leaving a job, the yard, Halvard's help line,
  the statue's lines, the Tooth Ring, Spendthrift). Judd no longer names the statue's price. The Ransom
  Coat and Spendthrift print their amounts through the formatter. Lore keeper (four fixes taken) and line
  editor (COIN TAKEN, "has the coin back") both run; the repo's agents aren't registered in this
  session, so each ran as a general agent reading its `.claude/agents` file.
- **Other chats' files, display only (the formatter, no numbers):** Deep `deepwords.ts` (haul, board
  lines); Instances `opencutwords.ts` (pays); Trading `tradewords.ts`, `tradeui.ts` (the gold line and
  the +/- buttons); Art `boardui.ts` (the pay row); Town quests' tests of the trainer. **For the Deep
  chat:** the Haulier's speech and the rules line still say "gear and gold found below"; "coin" fits
  better now (your words, your call).
- Lore keeper notes for later: voice.md and story-bible.md still price things in gold ("150 gold" trainer
  fees, "You have 40 gold."); to update when slice 3 sets the new prices.
- Phone shots: Tobin's stall and the trainer with a purse of 3g 4s 20c (the trainer's old coin icon
  dropped, each part has its own mark).
