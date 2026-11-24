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

## 2026-11-19: slice 4, stage 2 in: vowed costs and six gifts in the fight (Claude Opus 5.5)

- **Mine, new:** `sim/vowed.ts`, `tests/vowedfight.test.ts`. Nothing works while DIM.
- **All the costs** (`withVowed`, last in `statsOf`): the Widow's Sword 5% and the Breach Mail 8% off SPEED (`foot`),
  Ketterby's Bow 10% off CHARGE SPEED (`draw`), the Returned Pair's dodge 10% dearer, the Apprentice's Staff 10%
  off SKILL RECHARGE (`focus`), the Cart-hand's Coat 5% more taken; the Tithe Ring a tenth less coin (`goldKeep`;
  all coin picked up for now, chest coin too, though the card says from kills).
- **Six gifts:** the Breach Mail (friends within 4 tiles take 10% less) and the Returned Pair's backstab (friends
  near take 10% less for 4 s), both `vowedGuard` on the blow's damage beside SHELTER in sim/combat.ts; the Widow's
  Sword's block (12 stamina to the nearest friend, the block path); Ketterby's full draw that hits (heals the nearest
  friend 6), the Returned Pair's backstab and the Apprentice's kill (12 to the nearest friend's bar), queued from
  `damage()` (sim/damage.ts, one line; a new `charged` option, passed by sim/bolts.ts's two shot lines) and paid
  each tick by `payVowed` (sim/room.ts, after the long cuts). "Killing with a spell" is any kill by the staff's wearer
  (a Mage's every blow is a spell).
- **Small edits:** `sim/gearstats.ts`, `sim/combat.ts` (two lines), `sim/damage.ts`, `sim/bolts.ts`, `sim/room.ts`,
  `sim/bites.ts` (mine).
- **Stage 3, still to wire:** the Infirmary Censer's carry and its cost (half heals on yourself), the Cart-hand's
  Coat's raise, both rings' relic gifts (the Relics chat's files: asked then), Moll's dice vow, Tobin and Nettle
  refusing a vowed piece.
- **Checked:** the touched tests, `npm run check`, the full suite (2242 passed).

## 2026-11-19: slice 4, stage 3 in: the censer, the coat, Moll's vow, Tobin and Nettle (Claude Opus 5.5)

- **The Infirmary Censer:** a heal on a friend reaches the next nearest (not the healer, not the one healed) at half
  of what landed (`noteCarry` from `mend`, sim/holy.ts, paid by `payVowed`; a carry never carries again); heals on
  yourself do half (`heals`, sim/hungry.ts).
- **The Cart-hand's Coat:** picking a friend up twice as fast (sim/party.ts, the pick-up rate).
- **The Sworn-Off Ring's vow:** Dicer Moll won't play (client/squareui.ts shows her line and the rule; `Game.dice`
  refuses too). While it's dim the vow lapses with the gift.
- **Tobin and Nettle won't buy a vowed piece** (shared/fence.ts: `tobinWont` gives 'vowed', `nettleTakes` never;
  client/stores.ts gives Tobin his own line for it, not his hungry-gear fear).
- **For the Relics chat (asked):** both rings' gifts, ready in sim/vowed.ts as two calls: `moreRelicUses(h)` (1 more
  for THE SWORN-OFF RING) wherever a relic's uses are counted, and `vowedRelicUsed(h, heroes, ev)` when a relic is
  used (THE TITHE RING heals friends within 4 tiles 4 each). Until then the two rings have their costs and no gift.
- **Words:** lore keeper (Moll shrugs, points you to Gannet, "love"; Tobin defers to the church, it came off Odric's
  shelf; for the bible: vowed pieces sit on Odric's shelf, and Moll and Tobin know them by sight) and line editor
  (both run on). 
- **Small edits:** `sim/holy.ts`, `sim/party.ts`, `sim/hungry.ts`, `shared/fence.ts`, `client/stores.ts`,
  `client/squareui.ts`, `client/game.ts` (`dice`).
- **Checked:** the touched tests, `npm run check`, the full suite (2246 passed).
- Slice 4 is done but for the asks: Gear (names and card rows, `gear-asks-2`), Economy (no pluses), Trading
  (`cleanItem`), Relics (the rings). Next: slice 5, vowed pieces grow (holy-and-hungry 5b).

## 2026-11-19: slice 5 in: vowed pieces grow (Claude Opus 5.5)

- **Mine, new:** `shared/vowgrow.ts` (`GROW`, `growMult`, `grownBy`, `growKit`, `grown`, `ripe`), `tests/vowgrow.test.ts`.
- **How:** the same count as hungry gear (`worn`, job-units by size), grown in `finish` beside `feedKit` (one line in
  `client/game.ts`), but only when the hero ends the job clean (`isCorrupt` false); corrupt, nothing grows and
  nothing is lost. From PRE-WAR's 20 points to 45 over 30 units: 1.25 times TURNING's 36, halfway to hungry's
  hoped-for 1.5 times, so under hungry once Gear's number lands. The piece keeps its modifiers as given (`vowBase`)
  and its live ones are rewritten from them, so the card, stats and fight read the grown numbers with no other
  hook, and growing never compounds. A grown piece can pass its modifiers' caps, as hungry's Want gift can.
- **At full strength a piece is ripe** (`ripe`): the crossroads is slice 6.
- **Words:** the card's GROWS row (`growRow` in client/vowedwords.ts), lore keeper ("clean" reads as no damage taken,
  so the condition is said plainly; "Full strength." not "Fully grown."; the frozen line says it keeps what it has)
  and line editor ("each job", "% grown").
- **For Gear (added to `gear-asks-2`):** the GROWS row on a vowed piece's card. **For Trading:** `cleanItem` keeps
  `vowBase` too.
- **Checked:** the touched tests, `npm run check`, the full suite (2250 passed). Next: slice 6, the crossroads.

## 2026-11-20: slice 6 in: the crossroads (Claude Opus 5.5)

- **Mine, new:** `shared/crossroads.ts` (`FALL`, `firstRipe`, `giveRipe`, `fallWith`, `onceOf`), `client/ripeui.ts`,
  `client/ripewords.ts`, `tests/crossroads.test.ts`.
- **When:** back in town with a ripe vowed piece (full strength, shared/vowgrow.ts), worn or in the pack, the choice
  opens by itself before anything else (client/main.ts, ahead of Dunn's raid news), titled with the piece's name,
  with no close: one ripe piece at a time. The vault isn't looked in: a stowed piece doesn't grow, so can't ripen.
- **GIVE IT UP:** amends +5 (a hungry piece given up is 1 to 3), and a fresh vowed piece for that slot where it was;
  Odric's thanks, and his line at an amends step.
- **KEEP IT, and fall:** it turns hungry (no hungry id: no named gift or cost, only power, bites and the Want), its
  modifiers at 1.2 times a fresh hungry piece's of its slot and level (`budget('hungry')`, so it follows Gear's
  number), its count back to 0 so its bites start at 5%, and it adds 8 to the Want a job (a fresh hungry piece 5).
  It keeps `once` (which vowed piece it was), for its name. `finish`'s Want line now reads a missing hungry id as 8.
- **Small edits:** `client/game.ts` (`crossroads`, the Want line), `client/main.ts` (the moment).
- **Words:** lore keeper (nobody speaks at the moment itself, the plain choice; no "It can't stay as it is.";
  ONCE VOWED after the name, for good; for the bible: the church lends vowed steel, Odric keeps the shelf, a ripe
  piece goes back there) and line editor (one sentence a choice; Odric's thanks split at the handing-over).
- **For Gear (added to `gear-asks-2`):** `itemName` for a fallen piece: its vowed name, then ", ONCE VOWED".
- **Checked:** the touched tests, `npm run check`, the full suite (2254 passed). Next: slice 7, amends paying out and the vowed shop.

## 2026-11-20: slice 7 in: amends pay out, and Odric's shelf (Claude Opus 5.5)

Kyle's answers to docs/design/holy-gear.md slice 7: part-grown pieces at each amends step; the shelf paid as a gift
at the Lantern.

- **Mine, new:** `shared/shelf.ts` (`PAYOUT`, `owed`, `canPay`, `payOut`, `shelfFor`, `shelfPrice`, `takenNow`),
  `client/shelfui.ts`, `client/shelfwords.ts`, `tests/shelf.test.ts`. `Profile.amendsPaid?` and `Profile.shelf?` new
  (shared/progress.ts).
- **Amends pay out:** each step reached (3, 8, 15, 25) owes a vowed piece for a slot the hero picks (WEAPON, ARMOR,
  RING), raised to their level and already grown a quarter, a half, three quarters, nine tenths, into the pack. Only
  to a clean hero; owed ones wait. Heroes who made amends before this get theirs now.
- **Odric's shelf:** three fresh vowed pieces for the hero's class (its weapon, a body, a ring), the same on every
  device for a shops' window (10 minutes), each taken once per window, for a gift at the Lantern of 1.3 times its
  PRE-WAR price (`Game.donate`, so the gold goes in the box and the Want falls with it). Clean heroes only; the
  corrupt see neither button (holy-and-hungry section 1: no church shop for them).
- **Small edit:** `client/townui.ts` (the church panel, one call: `churchVowed`).
- **Words:** lore keeper (no "lent": you keep it; "gift", not "give what you would"; the payout's line fits every one
  of the nine's origins, no single wearer; plain slot buttons) and line editor (Odric runs on, hedges). For the bible:
  the church keeps a shelf by the step; its pieces are gifts, the gold in the Lantern box; Odric pays amends, never
  as a number; vowed pieces have been through many hands, none of them harmful.
- **Checked:** the touched tests, `npm run check`, the full suite (2259 passed). Next: slice 8, VOWED and the top tier replace TOUCHED and TURNING (with the Gear chat).

## 2026-11-20: slice 8 planned and prepared: SIEGE and MARSHAL, the clean tiers (Claude Opus 5.5)

Kyle's call: make TOUCHED and TURNING clean (over turning them into vowed pieces, or leaving them). Spec:
docs/design/holy-gear.md slice 8; names from the lore keeper.

- **All code is other chats', so it waits on the branch `gear-asks-2`, four commits:** (1) gear.ts: the names
  SIEGE and MARSHAL; (2) costs.ts: `TIER_WANT` empty (no Want from either), the header retold; (3) fence.ts: Tobin
  refuses only hungry gear (fence.ts is unclaimed, but it lands with the rest so the rules change together);
  (4) tests/fence.test.ts and tests/shops.test.ts: the three assertions that held the old rules. `RARE` is unchanged
  (it also drives the card's rare chip and loot-level odds). On the branch, every touched test passes but Gear's
  two item-level tests the hungry 1.5x number already broke.
- **Asked of Economy (its words):** storewords.ts `PAWN.wont` to "Tobin won't buy hungry gear.", and the end of
  `PAWN.greet` ("Nothing touched, mind, or worse than touched") to hungry gear alone; vendorwords.ts Nettle's `about`
  and `wont` ("buys touched and turning gear"): Nettle still buys SIEGE and MARSHAL at a third under Tobin, so his
  lines and his role (hungry gear, and anyone carrying it) are yours to retell. Through your own lore pass.
- **Asked of the General chat (the bible, lines by the lore keeper):** story-bible.md 325 ("the same thing as hungry
  gear caught partway", "grows the Want", the names), 327 (the vestry's reason), 328 to 331 (Tobin and Nettle on
  yellow and orange), 245 ("buys anything but touched, turning and hungry" to "anything but hungry"), 175 ("hungry
  gear" means red alone). New lore: SIEGE and MARSHAL steel as above.
- Nothing lands on main from this slice; it's ready when Gear, Economy and General say yes.

## 2026-11-20: slice 9 in: the Keeping Room and Dorcas, as panels (Claude Opus 5.5)

- **Mine, new:** `shared/keeping.ts` (`KEEPING`, `findsRoom`, `feedRelic`, `piecesToFill`, `giveToDorcas`,
  `dorcasPays`), `client/keepingui.ts`, `client/keepingwords.ts`, `tests/keeping.test.ts`.
- **How it's reached, for now:** the open sewer grate's panel (client/squareui.ts, one button: THE BRICKED ARCH) for
  a corrupt hero only; a clean one sees nothing there. The first time in a visit, the door line: the scratches bright
  where your eyes fall, a bolt going back. The walkable node in the Sewers (the arch, the cistern, the trough, the
  map in section 7) is the maps' owners' (Deep, Territories, Art): asked below. Soured relics don't exist yet, so
  carrying one isn't a way in.
- **Feed a relic:** vowed pieces from the pack, least grown first, each filling 1 use (up to 3 for a grown one),
  until it's full or they run out; elemental relics never; each piece eaten grows the Want 3. The corrupt hero's
  only recharge (the church's refusing them is still asked of Relics and Economy, slice 3).
- **Give a vowed piece to Dorcas:** she pays 40% of its PRE-WAR price, and the Want grows 10. Her trade in what the
  town hid (section 7's draft) isn't built: nothing to sell yet.
- **Small edit:** `client/squareui.ts` (the grate's buttons).
- **Words:** lore keeper (the hoard's origin left unsaid on screen; "vowed pieces", not "church steel"; the door
  about you, not the scratches; one "always" only) and line editor (Dorcas's cup line). For the bible: the cradle is
  part of the hoard, empty, never a child's; Dorcas pays coin for vowed pieces (trade, never the Lantern box); she
  has regulars; what she's given stays on her shelf, never resold on screen.
- **Asked of the Deep and Territories chats, and Art:** the Keeping Room as a node off the Sewers' cistern (section
  7's map: the dry arch, the cistern, the trough; no light but yours), reached only by a corrupt hero; when it's in,
  the bricked arch button moves there.
- **Checked:** the touched tests, `npm run check`, the full suite (2265 passed). Next: slice 10, elements (spec section 8), when Kyle wants it.

## 2026-11-20: element augments drafted as their own spec (Claude Opus 5.5)

Kyle, on the spec's section 6 (elements): pull elements off random weapon rolls and have a townsperson put one on
your weapon for 5 jobs instead. Drafted in docs/design/element-augments.md with his answers (strip old ones, any 5
jobs, not for the Mage, a replacement warns first) and drafts for the rest; on the board's Waiting list for a
chat of its own. Holy and hungry's section 6 now points there for anything elemental.

## 2026-11-23: the first hungry piece home, two quests (Claude Opus 5.5)

Kyle's call: the first time a hero brings a hungry piece home, two quests at once: talk to the church about giving it
up, and talk to the under church about growing the Want; the Want's bar shows from the first of those talks on.
Also confirmed: TOUCHED and TURNING become SIEGE and MARSHAL (slice 8), so Odric speaks of hungry gear only.

- **Mine, new:** `shared/wanterrands.ts` (`hungryHome`, `wantOpen`, `wantTalked`, `wantShown`),
  `client/wanterrandwords.ts`, `tests/wanterrands.test.ts`.
- **On the errand pattern** (as Nettle's): `Errands.church` and `Errands.under` (1 to go, 2 been), the ids `church` and
  `under` in `openErrands` and `errandWho` (the church; the sewer grate), kept by `fitErrands`; their goal-line words
  in `ERRANDW` (client/errandwords.ts). Opened by `hungryHome` at a job's end (client/game.ts `finish`, beside the
  hungry count) when hungry gear is on the hero or in the pack, once only, old heroes too.
- **Done by talking:** the church panel shows Odric's two lines and the rule above its usual line, once, and that's the
  church's quest done; behind the bricked arch, Dorcas's three lines in place of her greeting, once, and that's the
  under one. The arch lets a hero on the quest in even before they're corrupt; feeding and giving stay corrupt-only,
  so a clean one has come to listen. The grate must be open (the sewers' public work) to reach her.
- **The Want's bar placed myself (Kyle's word: the UI chat hadn't):** in the pack's foot, above the stats, while
  `Hero.wantSeen` (new, optional, copied in `equip` from `wantShown`), redrawn when the Want changes.
- **Small edits in other chats' files:** Town quests' `shared/errands.ts` and `client/errandwords.ts`; UI's
  `client/pack.ts` (the bar); `sim/types.ts` (`wantSeen?`); `client/game.ts` (`finish`, `equip`); `client/townui.ts`
  (the church); mine `client/keepingui.ts`.
- **Words:** the two titles are Kyle's as written. The lore keeper would change the second ("Talk to the under church
  about growing the Want" names the Want, which is otherwise never on screen, and calls the Keeping Room a church,
  never a shrine): its pick is "Talk to Dorcas below the grate about feeding it". Put to Kyle. The rest through the
  lore keeper (Odric: "goes bad", Kyle's words, not "turns", the old tier; Dorcas names only live costs; no invented
  church refusal of relics) and line editor (all kept). For the bible: Dorcas and the Keeping Room as a place apart
  from the Deep's door, the trough; a vowed piece that goes bad turns hungry (slice 6, ONCE VOWED).
- **The whisper** (Kyle, same day: "it's a whisper you hear leading you there"): back in town with the first red
  piece, A WHISPER opens by itself before anything else, once (client/wanterrandui.ts, beside the crossroads in
  client/main.ts; `Profile.whispered?`): an unnamed voice, an arch past the grate that will open for you, a woman
  who knows what you're carrying. The goal line's row for the Keeping Room reads A WHISPER. Lore keeper (not "keeps
  what was never given": that's the hoard's secret) and line editor.
- **Checked:** the touched tests, `npm run check`, the full suite (2298 passed).

## 2026-11-23: titles drafted; the Keeping Room claimed and mapped (Claude Opus 5.5)

- **Titles** (docs/design/titles.md): Kyle's calls (cosmetic, from both roads, never worn on the other road, shown
  to everyone, a flex, easy ones early) and the lore keeper's eight names (church: THE GIVEN, VOWED, THE STEADFAST,
  THE HOLY, Kyle's word kept as the church's own; under: THE GREEDY, THE KEPT, SHADOW, GILDED); 1, 5, 15, 40 deeds;
  about 2, 6, 15 and 60 jobs' pay. Waiting on Kyle's yes.
- **The walkable Keeping Room is this chat's now** (Kyle: "claim walkable room here, map it out"):
  docs/design/keeping-room.md maps it (a 12 by 11 interior through the dry arch, entered from the grate's button as
  a door, out at the grate), and its build in three slices (the room with stand-in furniture, the art in the kit,
  the titles). The ask of the Deep, Territories and Art chats (slice 9) is withdrawn.
