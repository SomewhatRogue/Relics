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
