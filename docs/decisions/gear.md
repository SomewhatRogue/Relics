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

## 2026-11-14: slice 2, modifiers that fit, in plain words (Opus 5.5)

- **Class fixes** (mods.ts): CHARGE SPEED (was QUICK HOLD) rolls only on `HELD_KITS` (the three bows, the
  greatsword, the staff); no SWEEP on a Ranger's bow. Old pieces keep what they have, and it still works
  (a sword's hold does charge faster), so `modFits` doesn't call it "no use to you".
- **SPELL POWER lifts every spell**: held ones as before (castHold), and a Mage's tap spark now too
  (sim/hero.ts `currentSwing`, one line); the card's HIT row counts it.
- **Names**: CHARGE SPEED, CRIT CHANCE, STAMINA RECOVERY (the hero sheet's own word, not the spec's
  STAMINA REFILL), DODGE RECHARGE, SKILL RECHARGE. Every modifier has a line now, under 45 characters
  for every class. Lore keeper then line editor, one call each (as general agents reading their
  `.claude/agents` files). Taken: DAMAGE, REACH, KNOCKBACK, CRIT, BLOCK and HEALTH lines reworded, the
  legs and Cole words below. Not taken: the lore keeper's "relics only recharge at the church", since
  SKILL RECHARGE does shorten a relic's cooldown in the fight (sim/hero.ts), so its line stays; the line
  editor's "spells cost less", since only a Mage rolls CHEAPER SPELLS.
- **The card head**: tier chip, then `LV 7 +2`, then the name without its plus.
- **The compare** already says the change in the fight's own numbers, old to new, green or red (HIT 12
  to 13, CRIT CHANCE 5% to 11%), never a point total. Kept as it is.
- Approved words for later slices: LEGS; LEATHER TROUSERS, MAIL SKIRT, GREAVES; "Modifiers only. Your
  body piece sets your weight."; "Nothing on your legs."; at Cole's KEEP A LOOK, WEAR AS IS, "Looks only.
  What you wear still does the fighting.", "Miss it, do you? Hand me something plain and I'll make it
  match.", "There. Nobody'll know it's not the real thing.", "Nothing to keep yet. Wear a piece with its
  own look first." Lore keeper's notes for slice 5: Cole's looks are paint and stitching, and a kept look
  from hungry gear is not hungry gear (no Want, Tobin doesn't care).
- tests/gearmods.test.ts; tests/fence.test.ts's 2026-11-05 words moved to these. Shots:
  scripts/gearlevel-look.cjs (the pack, a PRE-WAR LV 7 +2 card, a TOUCHED LV 9 ring).

## 2026-11-15: slice 3, rarity measured (Opus 5.5)

- **Measured like income**: the income bot (scripts/incomebot.ts, a small edit: `Take.rolls`) logs every
  tier roll a job makes (shared/gear.ts `TIER_LOG`, on only in the bot) with its source, danger lift,
  level and floor; scripts/rarity.ts sums each roll's exact odds (`tierOdds`). So the rare three are
  measured from a few days of real jobs, not hundreds. An hour is six jobs.
- **Before**: TOUCHED about 0.4 an hour, TURNING 0.2, HUNGRY 0.13 (two and a half to six times the spec).
- **Retuned** (gear.ts ODDS): PRE-WAR down a little, the rare three down to a third or less, Fine taking
  up the rest. The rare three's level lean halved and more (lootlevel.ts `RARE_LEAN` 0.012, in place of
  threat.ts's LEVEL_SCALE.rare 0.03, which nothing else reads for loot).
- **Now** (an hour, levels 1 / 10): FINE 12 / 15, FORGED 8 / 9, PRE-WAR 0.6 / 0.76, TOUCHED one in about
  6.5 hours, TURNING one in about 28, HUNGRY one in about 70. tests/rarity.test.ts holds a row per tier
  and the lean (a level-10 party finds the rare three under a quarter more often).
- **For Deep**: the Deep's odds lean these same tables (deeploot.ts), so a Deep floor's rare three are
  about a third as common as before. Kept so; if the Deep's bands should make up for it, their `pre` and
  `rare` are the Deep chat's to raise.
- **For Economy**: `Take` has a `rolls` field now; nothing in income changed (tests/income.test.ts passes).

## 2026-11-15: slice 4, legs (Opus 5.5)

- **The slot**: `Item.slot` 'legs', its weight in `armor` (it picks the list and the name, never the
  wearer's weight). `LEGS_MODS` (mods.ts): light DODGE, STAMINA, SPEED; medium HEALTH, STAMINA, SPEED;
  heavy TOUGHNESS, HEALTH, STAMINA. Half a chest piece's points (budget.ts `LEGS_SHARE`), no weight lift,
  half a rare piece's cost. Names LEATHER TROUSERS, MAIL SKIRT, GREAVES (loot.ts `LEGS_NAME`).
- **Worn**: `Profile.legs`, `Hero.legs` (optional, so old saves are simply bare-legged); `gearStats`
  takes them fourth (modifiers and costs, grown by their plus; no base lift, no weight); the room's
  `statsOf` counts them; `GEAR.unlegs` (8) takes them off; equip goes through `wear`. Carried online
  (coop.ts KIT), home and back (keepkit.ts), in the Want sum, the forge's UPGRADE list, the recap's tally.
- **Drops**: treasure 55/16/13/16 (weapon, body, legs, ring); a chest's and a butcher's non-weapon pick
  splits body, legs and ring with the same draws as before.
- **The pack**: LEGS takes the empty top-left square (pack.css area `skill`), a trousers icon by weight
  (itemicons.ts), the card's how row "Modifiers only. Your body piece sets your weight." (approved), the
  compare sees legs, a plus on legs reads "Each modifier on it is 20% stronger".
- **Goblins measured**: a FORGED pair at your level keeps a hero up about 4% longer at level 1, 5% at 5,
  7% at 10 (4% times the item level's growth). threat.ts `LEGS_THREAT` 0.04: `levelHarm` takes that
  share on top. tests/gearmods.test.ts holds it within a fifth of the measure.
- **Other chats' files, one or two lines each, legs only** (asking Kyle in the reply): UI's `pack.ts`
  (the square and its card), `pack.css` (one line), `cells.ts` (what legs replace), `itemicons.ts` (three
  icons); Economy's `prices.ts` (`SLOT_MULT.legs` 0.55, since legs are half the points),
  `storewords.ts` and `shopwords.ts` (the LEGS label and two lines, no gold); shared `game.ts`,
  `keepkit.ts`, `coop.ts`, `recaptally.ts`, `stores.ts`, `forgeview.ts`, `plusrows.ts`, `sim/pack.ts`,
  `packmoves.ts`, `sim/types.ts`, `progress.ts`, `sim/gearstats.ts`, `threat.ts`.
- **For Trading**: `cleanItem` turns legs away (slot must be weapon, armor or ring). Allow 'legs' with
  an armor weight, as armor, and they trade.
- **For Art**: a legs piece on the floor draws as a ring for now (relicsdraw.ts `drawGear`, loot3d.ts
  `makeLoot` fall through). Legs on the hero are slice 5, with gear-looks.

## 2026-11-15: slice 5 started, keeping a look (Opus 5.5)

- **What's in**: `shared/keptlook.ts`. Every unique a hero wears is noted in `Profile.looks` whenever
  their kit settles (keepkit.ts, one line), so the looks are there to keep when Cole's panel can show
  them. `keepLook` keeps one per slot (`Profile.keep`), only a look worn and made for that slot.
  `shownItem(worn, keep, kitFor)` is the piece as it should be drawn: the kept unique over it (a weapon
  only on the same kit), the piece itself otherwise. Drawing only; nothing it gives changes.
  tests/keptlook.test.ts.
- **What waits, and on whom**:
  - Legs on the hero, and a unique's own chest or legs look: armour overlays, gear-looks slice 3, which
    waits for the side view. **For gear-looks**: draw legs as their own overlay under the body's, by the
    legs piece's weight and tier (`Hero.legs`); read every worn piece through `shownItem` so a kept look
    shows; a unique has its own colours and trim (uniques.ts ids).
  - A unique weapon as its own sprite: like the Hungry pieces (gear-looks slice 2). **For Deep**: the
    look of each unique (colours, trim, the thing it is) is yours to say; gear-looks draws it.
  - A ring's faint glow: gear-looks slice 4.
  - Cole's KEEP A LOOK panel (words approved, slice 2's entry above): beside YOUR SHIELD on Cole's
    trainer panel (Art's shieldui.ts, trainerui.ts). Built once a kept look can be seen, so it never
    offers a change nobody sees.
