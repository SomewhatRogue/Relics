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

## 2026-11-13: slice 2, the income measure and the retune (Opus 5.5)

- `scripts/incomebot.ts` plays a real board job through the client's Game, headless: the hero kept up and
  its blows made lethal in that process only, walked onto every goblin, coin pile and chest, the job
  finished through the game's own payout. `npx vite-node scripts/income.ts [days] [levels...]` prints
  pay, coins, gear's sale value and total per job by level. Ordinary jobs only (no Deep, instance,
  expedition or quest postings).
- **Measured before:** a medium job brought in 2s 65c to 2s 77c at every level (pay about 1s 36c, coins
  about 1s 55c: more from kills than from the job). Income doesn't rise with level; harder places pay more
  through payFor's ruin term, and that's kept as the only climb. Prices will climb by level instead.
- **Retuned:** `PAY_SCALE` 0.8 in `payFor`. Goblins: 30% for 1 to 3c (archers 35%, 2 to 4c), a butcher a
  silver half the time, a named butcher a sure silver; a big one's handful 5 to 10c (threat.ts BIG); a plain
  chest 4 to 12c half the time (`CHEST_COPPER`, sim/chests.ts). Boss chests left at 80 to 120: bosses pay
  more. **After:** a medium job about 1s 54c, the pay 62% of everything a job brings in (gear's sale value
  not counted in that share).
- `JOB_COPPER = 150` (shared/coins.ts) is the unit prices are set against; `tests/income.test.ts` plays 12
  jobs and holds a medium job at 1s 20c to 1s 87c and the pay over 58%.
- Kept two old rules true: an expedition's goblins drop about half a job's copper in under a third of the
  piles (EXPED_COINS retuned); Halvard's forge shift pays clearly less a minute than a job (cap 25 to 20).
- **For the Deep, Instances and quest chats:** `payFor` is the economy's, and its 0.8 reaches your
  postings' base pay (your added constants, +40, +80, are untouched). Kill coins are the shared COINS table,
  so the Deep's floors drop copper now too. Nothing of yours was edited; say if a number needs to move back.
- Until slice 3, old prices stand against the new, lower income: everything costs about twice the jobs it
  did. Slice 3 sets prices by time, with the purse conversion in the same push.

## 2026-11-13: slices 3 and 5, prices by time and the purse carried over (Opus 5.5)

- Prices are written in jobs of copper (`jobs(n)`, shared/coins.ts, from JOB_COPPER 150), so each reads as
  time. A Bitter 25c, other drinks 20 to 30c, a relic charge 30c. Stat ranks: rank 1 at 1.4 to 1.6 jobs,
  each next one half that again, the fifth 4.2 to 4.8 jobs (`drillPrice`; the old curve made late ranks
  cheaper in jobs than now). SKILL drill 2 jobs, technique 2.2, a ladder rung 3.5 on the same climb. The
  first class skill 3 jobs at level 3, the second 5, the third 6; a dodge's leave-behind 4. Gear: plain
  half a job, fine 1.2, FORGED 3.5, TOLMOUTH 11, TOUCHED 25, TURNING 60. Halvard +1 a job, +2 2.5, +3 5,
  +4 30, +5 60 (weeks). Tobin's cut 0.3 to 0.2, a level on a piece 20c; Nettle's cut 0.2 to 0.13 (two
  thirds of Tobin's, as before). Packs 4, 8, 14, 24 jobs; vault 2, 5, 10. A reroll half a job, an element
  at the relic-wright a job. The wishing coin stays 5c; bets stay even money.
- `tests/prices.test.ts` holds each row of the spec's table. Pinned old prices in the trainer, forge,
  church, Tobin and buildings tests moved to the new ones.
- **The purse carried over (slice 5):** the geometric mean over 64 prices moved x1.46 in copper (income
  fell to about 0.56, so in jobs things cost about 2.6 times what they did). `PURSE_RATIO` 1.45: a hero
  saved without `coin` has the purse multiplied once and is marked `coin: 1` (`fitPurse`, client/save.ts;
  new heroes are made marked). Tested: once only, and never on a new hero. Shipped in the same push as the
  prices.
- **Not converted, for Kyle:** the town's shared totals on the server (the works' needs, the Lantern, the
  statue's price to beat, STATUE_GIVEN) and the Roll's COIN EARNED and COIN GIVEN, which mix old and new
  units. Works fill about half as fast now. Also not converted: a trade or statue bid pending across the
  update (rare, small).
- The job board's list rows still printed `120g` (missed in slice 1; Kyle caught it): coins now. Phone
  shot of the board checked.
- Next: slice 4, fewer and bigger stat ranks.

## 2026-11-13: slice 4, fewer and bigger stat ranks (Opus 5.5)

- The five base stats go from 5 ranks to 3, at levels 2, 5 and 8 (`STAT_DRILLS`, drills.ts). A rank is
  worth a little under double, the top total about what it was: STRENGTH +8% a rank (24%, was 25%),
  HEALTH +13 (39, was 40), SPEED +5% (15%), CRITICAL +7% (21%, was 20%), STAMINA refill +13% (39%, was 40%).
- Prices climb 1x, 2x, 3x from the base (`drillPrice`), so a rank is 1.4 to 1.6 jobs at first and 4.2 to
  4.8 at the top. SKILL and TECHNIQUE drills on the same climb from 1.6 jobs (top 4.8), a ladder rung from
  2.5 (top 7.5).
- Old heroes: their small ranks become the nearest big rank with the same total, once (`fitRanks`, a
  `ranks` version on the hero, client/save.ts; new heroes are made at it). STRENGTH 5 is 3, 2 is 1, 1 is 1.
  A hero holding a rank above their level's cap keeps it, as before.
- The trainer's rows and tiles already show the hero's number now and after a rank, so no new words.
  Tests: tests/prices.test.ts (three ranks, the totals, the carry-over once); pinned old ranks moved in
  the trainer, upgrades, drills and shown tests. Not shot on the phone: the pips go from five to three in
  the same row (Kyle to look).
- All five slices are in. Open for Kyle: the town's shared totals (works, Lantern, statue) left in the old
  units; voice.md and story-bible.md still give prices in gold (the lore keeper's note above).
