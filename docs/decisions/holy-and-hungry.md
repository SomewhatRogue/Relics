# Holy and hungry: decisions

The chat building docs/design/holy-and-hungry.md (sections 1 to 3, 2b, 5, 5b and the crossroads, 6 to 8;
section 4 is docs/design/relics.md, the Relics chat's). Newest at the foot.

## 2026-11-19: how it works today, and the slice plan (Claude Opus 5.5)

**Today, read before planning:**
- **The Want** is `Profile.want` (progress.ts; save.ts sets 0 for old heroes), copied to `Hero.want` for the
  eyes. It grows only at a job's end (game.ts `finish`): each hungry piece worn adds its own `want` (5, the
  Wedding Ring 15), plus `WANT.perKill` (0.2) a kill if any is worn; TOUCHED and TURNING add `TIER_WANT` (1 and
  2) a piece. It falls by `WANT.giveUp` (30) a piece given up at the church (`Game.giveUp`), and 0.1 a copper
  given at the Lantern. What it does: eyes at 15 (actors.ts), two town lines at 30 (shops.ts). Nothing else.
- **Hungry gear** (shared/hungry.ts, Gear's to edit): ten named pieces, weapon, armour or ring (no legs), three
  modifiers at `budget('hungry')`, which is 32 points a piece against TURNING's 36 and TOUCHED's 29 (mods.ts
  `PER_MOD`), plus a gift and a named cost wired in sim/hungry.ts. No pluses, no trading, given up at the church.
  So today a hungry piece is not stronger in numbers than TURNING; its gift is the pull.
- **Tiers** (gear.ts, Gear's): seven, steps 0 to 6, PLAIN to HUNGRY. TOUCHED and TURNING carry one cost each
  (costs.ts) and grow the Want. No per-piece count of any kind exists yet.
- **Jobs** have a `size` (short, medium, long: 2, 3 and 5 rooms, about 5, 10 and 15 minutes), and may be an
  `instance`, an `exped`, a `land`, a Deep dive, or end at a great boss (Hangman's Wood's Hempen, the
  Doorkeepers in the great barn, an instance's end).

**The plan.** Slices in the spec's build order, the new pieces (2b, 5b, the crossroads) put where they first
can work. Relics (spec step 4) are built by the Relics chat; where a slice touches them it asks.

1. **Hungry pieces get hungrier (2b), and jobs by size.** Each piece keeps a count, in job-units worn
   (`jobUnits`: short 0.5, medium 1, long, Deep dive, instance or expedition 2, a great boss's end 3; driven back
   half, gone early none). A hungry piece rolls one bite when first counted: 5% at 0 units, rising evenly to 50%
   at 12; then a second bite, the same way from there, both held at 50%. This slice's four bites go through numbers
   the fight already has: less health, slower stamina or magic, a dearer dodge, less healing on you. Shown on the
   card with its percent and the jobs to its next step. And the other half of 2b, asked of Gear: a hungry piece's
   modifiers at 1.5 times TURNING's (`PER_MOD.hungry` 18).
2. **Corrupt, and the Want bites (spec 1 and 2).** `isCorrupt` (hungry worn, or the Want at 30). The Want's
   table: the gift +10/20/35%, goblins notice you sooner (one hook, shared with a fifth bite), prices +25%,
   town healers turn you away, half heals from others at 60. The bar on the panel and pack. The sixth bite (it eats
   gold you pick up). Corrupt heroes can't recharge relics (asked of the Relics and Economy chats).
3. **Penance and paid turn-ins, the first holy pieces (spec 3 and 5).** `Profile.penance`; giving a hungry piece
   up pays a holy piece for its slot if clean after. Holy pieces as their own kind (named, one per class per slot to
   start, gifts that lean to the party, small fair costs); dim under any hungry piece; won't go on over one.
4. **Holy pieces grow (5b).** The same count, clean jobs only: from PRE-WAR's strength (step 3) to a cap at step
   5.5 in about 30 units; frozen, never lost, while corrupt; shown on the piece.
5. **The crossroads (5b).** A piece at its cap is ripe; on the next return to town, a moment of its own per ripe
   piece before anything else: give it up (a large penance, a fresh holy piece, the church's thanks) or fall (it
   turns hungry at 1.2 times a fresh hungry piece, bites from 5% at once, "Once HALLOWED").
6. **Penance rewards and the holy shop** (spec 5).
7. **VOWED and HALLOWED replace TOUCHED and TURNING** (spec 6): Gear's tiers, costs.ts, drop tables, the bible.
   Planned with the Gear chat; the old pieces in saves carried over once.
8. **The Keeping Room and Dorcas** (spec 7).
9. **Elements** (spec 8), later.

**Open calls, mine to tune (say if wrong):** a job driven back counts half its units and one left early none (so
quitting can't grow a holy piece); a territory counts by its size; a Deep dive counts as long whatever its
floors. Note for the spec: 2b says a traded hungry piece keeps its count, but hungry gear can't be traded
(trading.md); the count rides on the piece either way, so nothing to build.

## 2026-11-19: slice 1 in, hungry pieces get hungrier (Claude Opus 5.5)

- **Mine, new:** `shared/jobunits.ts` (`jobUnits`, `UNITS`, `greatEnd`), `shared/hunger.ts` (the count, the bites,
  `fed`, `feedKit`, `biteOn`), `sim/bites.ts` (`withBites`, `healBite`), `client/bitewords.ts` (`BITEW`,
  `biteLines` for the card), `tests/hunger.test.ts`.
- **How it works:** a piece's count is `worn` (job-units), its bites `bites` (kept the first time it's counted).
  Until then its bites come from its own seed (its hungry id, kit, weight and modifiers), so a fresh piece shows
  and feels its 5% bite from the moment it drops, and nothing in `rollHungry` had to change. Four bites: FRAIL (less
  health), WINDED (slower stamina, magic or faith), CLUMSY (a dearer dodge; never on a Warrior's or Cleric's piece,
  who can't dodge), STARVED (less healing on you). Several pieces biting the same way take their shares together
  (each from what the others left), never past 75%. A fed piece is a new object, so `statsOf`'s cache never
  reads it stale.
- **Small edits:** `client/game.ts` `finish` (one line: `feedKit` by the job's units, after the Want); `sim/gearstats.ts`
  (`withBites` last, so a bite takes its share of everything); `sim/hungry.ts` `heals` (the STARVED share);
  `sim/flasks.ts` (the Bitter's mend, one line). Not counted by STARVED: Skarn's Cleaver's own leech and REAPER's heal. `tests/hungry.test.ts`'s Cleaver self-heal now allows for a STARVED bite (one line).
- **Checked:** the touched tests, `npm run check`, the full suite (2214 passed).
- **Words:** lore keeper (ON THEME; BITE kept as the word; "recovers", "Healing on you is N% weaker", "gains a second
  bite", "can't bite any harder" taken) and line editor (all kept). For the bible (lore keeper): hungry gear gets
  hungrier the longer it's worn, counted in jobs; BITE is an on-screen word beside GIFT and COST; never say why.
- **For Gear (asked, not made; ready as three small commits on a local branch `gear-asks`, each its own):**
  1. `shared/loot.ts`: two optional Item fields, `worn?: number` and `bites?: BiteId[]` (until then hunger.ts reads
     them through its own `FedItem` type, so nothing breaks without them).
  2. `shared/mods.ts`: `PER_MOD.hungry` 32/3 to 18, so a hungry piece's modifiers are 1.5 times TURNING's (54 points
     against 36), spec 2b's "super strong from the start". Yours to check against `CAPS` and the rarity and budget tests.
  3. `client/card.ts`: one call after `hungryRows`, `labelRows(biteLines(it, cls), 'hungry')`, so the bites show.
  Without 3 the bites work but don't show; without 2 the piece only got worse. So 2 and 3 should land with slice 1.
  On that branch, 2 fails two of Gear's own tests in `tests/itemlevel.test.ts` ("tiers close, 13 to 32 after costs",
  and "a level beats a tier: ... HUNGRY seven"): 1.5 times puts HUNGRY at 54 and further from the levels. Those are Gear's
  rules, so the number, or a smaller lift (1.25 is 45), and those tests are Gear's to settle; I didn't touch them.
- Next: slice 2, corrupt and the Want's table.

## 2026-11-19: pushed; slice 2 in, the Want bites in the fight (Claude Opus 5.5)

- Kyle said push: slice 1 is on main; Gear's three asks are on the branch `gear-asks` (not main), still for Gear.
- **Slice 2 split in two** (the plan's 2 was too big for one go): **2, the fight's side** (this), and **3, the town's
  side** (corrupt heroes refused by the church, Isolde and the healers, prices up 25%, named butchers come for you
  first, the Want's bar on the panel and pack: other chats' files, each asked). The plan's 3 to 9 become 4 to 10.
- **Mine, new:** `shared/corrupt.ts` (`WANT_BANDS`, `bandOf`, `CORRUPT_AT`, `isCorrupt`, `wearsHungry`), `tests/corrupt.test.ts`.
- **The bands in the fight:** at 15, 30 and 60 the Want lifts each hungry piece's own modifiers by 10, 20 and 35%
  (`withBites`, on top of the caps, as the bites are; the named gifts themselves don't scale yet); from 15 goblins
  see you from 15% further off (`seenBy`, sim/enemies.ts's sight line); at 60, heals from anyone else do half
  (`othersHeal`, in `heals`). `statsOf`'s cache now keys on the Want's band too.
- **Two more bites, so all six from the spec are in:** NOTICED (goblins see you N% further off, with the band's) and
  GREEDY (you pick up N% less coin, sim/pickups.ts). A piece whose bite wasn't kept yet may show another now that
  there are six to roll from; pieces worn through a job since slice 1 keep theirs.
- **Small edits:** `sim/enemies.ts` (one factor on the sight line, an import), `sim/pickups.ts` (the coin line, an
  import), `sim/gearstats.ts` (the cache key), `sim/hungry.ts` (`heals`).
- **Words:** lore keeper (ON THEME, "coin" right, never "gold") and line editor ("You pick up N% less coin." taken over
  "It eats N% of the coin you pick up.").
- **Checked:** the touched tests, `npm run check`, the full suite (2221 passed).
- Next: slice 3, the town's side.

## 2026-11-19: slice 3, the town's side, my part in; the rest asked (Claude Opus 5.5)

Corrupt (shared/corrupt.ts `isCorrupt`: wearing hungry gear, or the Want at 30) now costs something outside the
fight. Per hero, whoever they came in with (Kyle, 2026-11-08).

- **In:** named butchers come for a corrupt hero first (`hunted`, sim/bites.ts, a lure of 6 on the target line in
  sim/enemies.ts, beside the Apron's); Sister Agne won't sell the Bitter to a corrupt hero (client/shops.ts `infirmary`:
  her old line, then a refusal, two versions, with hungry gear on or the hunger alone, and the plain rule); the
  Want's bar, ready to place (client/wantbar.ts, wantbar.css): HUNGER, no number, ticks at 15, 30 and 60, filling to
  80, and under it only the costs that are in the game now; `corruptPrice` (a quarter more, rounded up) ready for the
  Economy chat.
- **Mine, new:** `client/wantbar.ts`, `wantbar.css`, `corruptwords.ts`, `tests/wantbar.test.ts`. Small edits:
  `client/shops.ts` (the infirmary), `sim/enemies.ts` (the target line, `hunted`).
- **Words:** lore keeper (HUNGER kept as the bar's word; never "Want"; "friends", not "others"; Agne sends you to the
  church and its step, not to Isolde) and line editor (Agne's hedges, "your hunger is high", "Healing from friends is
  halved on you."). For the bible (lore keeper): HUNGER is the on-screen name of the bar; Agne refuses the Bitter
  to the corrupt and sends them to the church; giving gear up at the church still works for the corrupt.
- **Asked, each a small edit in your own file (I'll write any new lines with the lore pass if you'd rather):**
  - **UI** (`pack.ts`): in the foot, after the Healer's coal row, `wantBar(h)` from client/wantbar.ts, and `h.want`
    in the third key so it redraws. The character panel is the pack's foot, so that's the one place.
  - **Economy** (`prices.ts` or wherever a town price is paid and shown): every price a hero pays in town through
    `corruptPrice(profile, base)`, shown and charged the same. When it's in I add "Prices are a quarter higher." to the bar.
  - **Relics and Economy** (`churchrelics.ts`, `shared/church.ts`): no relic recharge for a corrupt hero, and no church
    light from leaving a relic on the step; giving hungry gear up still works (it's how they come clean). Isolde's
    relic quests: no reward handed to a corrupt hero (section 1, "no turn-in rewards"). Isolde says why in her own words.
  - **Art** (`actors.ts`): at a Want of 60 the party should see it on you (section 2); today the eyes brighten with the
    Want. Something more at 60, your call.
- **Checked:** the touched tests, `npm run check`, the full suite (2225 passed).
- The plan's later slices are unchanged (4: penance and the first holy pieces).

## 2026-11-19: slice 4 drafted as a spec, for Kyle's yes (Claude Opus 5.5)

- docs/design/holy-gear.md (mine; the General chat owns holy-and-hungry.md, so the detail goes in its own file):
  what a holy piece is (steel someone gave, kept by the church), the first nine (a weapon a class, two bodies, two
  rings) with gifts for the party and small fair costs, penance and the paid turn-in, how it shows, whose files.
- Through the lore keeper: names for all nine (THE WIDOW'S SWORD to THE TITHE RING), the path's word GIVEN (not
  HOLY: the Lantern isn't holy), AMENDS on screen for penance, HALLOWED to be renamed before slice 5. Four questions
  for Kyle at its foot. Nothing built until he answers.

## 2026-11-19: slice 4, stage 1 in: the nine VOWED pieces, amends, the paid turn-in (Claude Opus 5.5)

Kyle's answers to docs/design/holy-gear.md: **VOWED** on screen (over the lore keeper's GIVEN), nine pieces to
start, amends shown only by Odric's line, the costs as drafted.

- **Mine, new:** `shared/vowed.ts` (the nine with the lore keeper's names, `rollVowed`, `dimmed`, `blocksVowed`,
  `VOWED_FX` for stage 2), `shared/amends.ts` (`amendsOf`: 1, and 1 more for every 12 units the piece was worn;
  `AMENDS_STEPS` 3, 8, 15, 25), `client/vowedwords.ts`, `client/vowedui.ts` (Odric at the step), `tests/vowed.test.ts`.
- **The turn-in** (`Game.giveUp`, now returning what happened): the Want falls by 30 as before, `Profile.penance`
  (new, optional) grows by the piece's weight, and a hero clean after the give is handed a vowed piece for that slot,
  raised to their level, put where the hungry one was (in hand, on the body, a ring, or the pack). The church's
  button shows Odric handing it over, or the plain rule if they aren't clean, and his line at an amends step.
- **Never with hunger:** `statsOf` leaves vowed pieces out while any hungry piece is worn (DIM); `applyGear` won't put
  a vowed piece on over hungry gear; Halvard won't melt one, Ivo won't reroll one.
- **Small edits:** `client/game.ts` (`giveUp`, `melt`, `rerollMod`), `sim/gearstats.ts` (dim), `sim/pack.ts` (the
  block), `client/townui.ts` (the step's button, one line), `shared/progress.ts` (`penance?`).
- **Not yet, stage 2:** the nine gifts and costs in the fight (`VOWED_FX` holds their numbers), Moll's dice vow,
  Tobin and Nettle refusing a vowed piece.
- **Words:** lore keeper (Odric never says holy or blessed; "the step", not stairs, except the third stair that
  rocks; names said in title case, not shouted; nothing dated "a long while back") and line editor (Odric's hedges;
  the nine gifts and costs plainer, the two heals given numbers, "coin", not "gold", per the lore keeper).
- **For Gear (all five asks now on the branch `gear-asks-2`, on today's main; the old `gear-asks` is stale, safe to delete):** `loot.ts` an `Item.holy` field and `itemName` knowing vowed names
  (until then a vowed piece shows as its PRE-WAR kit, SWORD, in the pack); `card.ts` the VOWED chip, its GIFT and COST
  rows and DIM. **For Economy:** `plusCost` (forgeplus.ts) refusing a vowed piece, as hungry. **For Trading:**
  `cleanItem` keeping `holy` and `worn`.
- **Checked:** the touched tests, `npm run check`, the full suite (2234 passed).
