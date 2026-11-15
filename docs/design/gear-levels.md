# Gear levels, rarity, uniques and legs (approved by Kyle, 2026-11-14)

Kyle: "push economy also into rarity chance of some items and make sure better items really are more
rare but also a higher tier or higher level item of purple can actually be better stat wise than a
unique or a red of a lower level so you keep wanting to get better gear. Unique gear can be fun but
maybe isn't always better but maybe changes your cosmetics too. Add pants: chest we have but also legs."

## What's there now

- Seven tiers, white to red. A piece's strength is its tier's points (mods.ts: PLAIN 0, FINE 5, FORGED
  16, PRE-WAR 24, TOUCHED 42, TURNING 51, HUNGRY 60) times 1.1 for each of Halvard's pluses (to +5).
- A drop's "level" is only a free +1 at party level 5 and +2 at 9 (lootlevel.ts). So a PRE-WAR +5 (36
  points) never beats a plain TOUCHED (42): tier is everything, and once you have a red you're done.
- Higher party levels lean the odds toward rarer tiers (+3% a level for the rare three).
- Uniques (the Deep's, uniques.ts) are fixed PRE-WAR pieces at +0 with set modifiers, and look like any
  other piece. Worn armor doesn't show on the hero at all; only the weapon kind and a painted shield do.
- Worn: a weapon in hand, one BODY piece, two RINGs, a relic, the belt.

## 1. Item level: the second axis

- Every drop gets an **item level**: the level of where it dropped (the party's level, a few higher in a
  harder place, the Deep's floor counts). It shows on the card as `LV 7` next to the tier.
- A piece's points are its tier's points times its level's: **about 7% more a level, compounding.** The
  tiers move closer together so a level can beat one: PLAIN 10, FINE 13, FORGED 16, PRE-WAR 20,
  TOUCHED 24, TURNING 28, HUNGRY 32 (the rare three still have their costs and traits on top).
- What that does: a PRE-WAR beats a TOUCHED three levels under it, a TURNING five under, a HUNGRY seven
  under. A level-9 purple out-hits a level-2 red. A red at your own level is still the best thing you
  can wear, so it's still the chase.
- Level also lifts the base: a weapon's damage and armor's toughness climb with it, so even a plain
  piece from level 8 beats a plain piece from level 1.
- **Halvard's pluses stay pluses** (Kyle): +1 to +5, each about 10% on top of whatever the piece's level
  gives, priced as the economy set them. The card shows both: `LV 7 +2`.
- Old pieces: their item level is the old free +1 or +2 they dropped with, or the level they'd have
  dropped at if saved; their pluses stay. Nothing anyone wears gets weaker on the day.

## 2. Rarity, measured

- The income bot (scripts/incomebot.ts) also counts drops by tier, so rarity is measured like income.
  Targets, per hour of play (six medium jobs) at your level:

| Tier | How often |
| --- | --- |
| FINE | a few a job |
| FORGED | one or two a job |
| PRE-WAR | one every hour or two |
| TOUCHED | one a week of play (about 6 hours) |
| TURNING | one in a few weeks |
| HUNGRY | rarer still; you hear about them |

- The level lean stays but gentler, so a high level doesn't make reds common. A test holds each row.

## 3. Uniques: fun, a look, not always the best

- A unique has its own look on the hero: a chest or legs in its own colours and trim, a weapon drawn as
  its own sprite, a ring as a faint glow. Seen by the party and friends.
- It drops at the level it dropped (the Deep's floor) like anything else, so a high-level purple can
  beat it; its fixed modifiers and trait are what make it worth keeping, and Halvard can bring it up.
- **Keep the look** (Kyle: yes): once you've worn a unique, you can keep its look on whatever you wear in
  that slot (at Master Cole's, beside the shield painting), so you never have to pick between looking
  right and being strong.
- Uniques are the Deep chat's (pools, names, drops). How gear shows on the hero is
  docs/design/gear-looks.md ("Gear you can see", waiting): tier looks for weapons and armour overlays.
  This spec adds to it a unique's own look, legs, and keeping a look; it doesn't edit their files.

## 4. Legs

- A new worn slot, **LEGS**, under BODY: leathers, mail or plate, rolled and dropped like a chest piece,
  melted, sold, upgraded and traded the same way. It takes the empty square in the pack where the skill
  was (that square is gone as of 2026-11-14).
- Your weight stays your BODY's (speed, damage taken, dodge); legs carry modifiers only (Kyle), about half a
  chest piece's points. A full set is a little stronger than today's chest alone, so goblins get a
  little tougher to match (threat.ts), measured, not guessed.
- Legs show on the hero: trousers, mail skirt or greaves in the piece's tier colour.

## 5. Modifiers that fit the class, in plain words

Kyle: "make sure gear enhancements make sense for some characters and classes and has clear text."
The rule today is sound (mods.ts: a weapon rolls only what improves its own job, armour its weight's
list, rings anyone's plus the class's own, nothing a class can't use when it's rolled for them). What
each class can roll now, checked 2026-11-14:

| Class | Weapons | Armour | Rings, besides anyone's |
| --- | --- | --- | --- |
| Warrior | QUICKNESS, REACH, QUICK HOLD, SWEEP (not the spear), FINISHER, KNOCKBACK, BLOCK | BLOCK, TOUGHNESS, HEALTH | BLOCK |
| Ranger | QUICKNESS, REACH, QUICK HOLD, SWEEP, FINISHER, CRIT (KNOCKBACK on the crossbow) | DODGE, STAMINA, SPEED, CRIT | DODGE |
| Rogue | QUICKNESS, REACH, QUICK HOLD, SWEEP (not the rapier), FINISHER, BACKSTAB, CRIT | DODGE, STAMINA, SPEED, CRIT | DODGE |
| Mage | QUICKNESS, REACH, QUICK HOLD, SWEEP (staff, spellblade), FINISHER (spellblade), SPELL POWER, CHEAPER SPELLS | DODGE, STAMINA, SPEED, CRIT | DODGE, SPELL POWER, CHEAPER SPELLS |
| Healer | QUICKNESS, REACH, QUICK HOLD, SWEEP, FINISHER, KNOCKBACK, BLOCK, HEALING | HEALTH, TOUGHNESS, STAMINA, SPEED | BLOCK, HEALING |

Anyone's ring: DAMAGE, HEALTH, STAMINA, RECHARGE, CRIT, SPEED.

**What doesn't fit, to fix:**
- **Bows roll SWEEP** ("wider swings"), because one step of a bow's combo is a wide melee one. A bow's
  job is the shot: no SWEEP on a bow unless its close blow is a real part of how it fights, and then
  the card says "your close swing is wider", not "wider swings".
- **QUICK HOLD rolls on every weapon.** Only where the held attack is part of the kit's job (bows,
  the greatsword, the staff); elsewhere QUICKNESS does the work.
- **SPELL POWER says "held spells hit harder"**: a Mage reads that as all spells. Either it lifts every
  spell, or the name says HELD (pick one when building; my lean: every spell, so it reads true).
- **Item level never changes which modifiers a piece can have, only how much they give.** Higher tiers
  add modifiers (FINE 1, FORGED and PRE-WAR 2, the rare three 3), and the rare three's traits and costs
  are the extra.
- **LEGS** roll movement and staying up, never a weapon's or a hand's: light DODGE, STAMINA, SPEED;
  medium HEALTH, STAMINA, SPEED; heavy TOUGHNESS, HEALTH, STAMINA. No CRIT, BLOCK or DAMAGE on legs.

**Words on the card.** Each modifier is its name, its value, and one short line saying when it helps.
The name says the stat; nothing a player has to guess at. Proposed (all through one lore keeper and
one line editor call when built):

| Now | Proposed | Line |
| --- | --- | --- |
| QUICK HOLD | CHARGE SPEED | held attacks and bow draws charge faster |
| STAMINA | STAMINA REFILL | stamina comes back faster |
| RECHARGE | SKILL RECHARGE | your skill and relic come back sooner |
| DODGE | DODGE RECHARGE | your dodge comes back sooner |
| CRIT | CRIT CHANCE | a crit hits for 50% more |
| BLOCK | BLOCK | blocks let less through and cost less stamina |
| SPELL POWER | SPELL POWER | spells hit harder (if it lifts every spell) |
| CHEAPER SPELLS | CHEAPER SPELLS | spells cost less magic |
| SWEEP | SWEEP | wider swings (melee only) |

- Values read in the game's own shown scale (as the trainer does: +13 health shows as the big number).
- A modifier the wearer can't use (a pawn-stall piece) stays dim with "no use to you", as now.
- The card's compare against what you wear says the change in plain numbers: `DAMAGE +8%` against
  `+5%` worn, green or red, never a bare point total.
- Tests: no modifier rolls for a class where it changes nothing (every class, kit, slot and weight,
  legs included); every modifier has a line, and no line is over 45 characters.

## Slices

1. Item level on every piece and card, the closer tier points, the level growth; old pieces carried over.
2. Modifiers and words (section 5): the class fixes, the renames through the lore keeper and line
   editor, the card's `LV 7 +2` and its compare, the two tests.
3. Rarity measured by the bot, odds retuned, a test per row.
4. Legs: the slot, drops, the pack square, the card, the sums; goblins measured and retuned.
5. Looks, with docs/design/gear-looks.md: legs on the hero, uniques' own looks, keeping a look at Master
   Cole's (with the Deep chat for uniques, and whichever chat takes gear-looks).

## Kyle's answers (2026-11-14)

- Item level from where it dropped, about 7% a level: yes. Pluses stay pluses, on top.
- Legs: modifiers only, the weight on the chest.
- Keep-the-look for uniques at Master Cole's: yes.
- Modifiers must make sense for each class and read clearly: section 5, slice 2.
- Built by a new Gear chat, not the Economy chat. Prices it sets go through the Economy log's rules
  (prices in jobs of copper, `jobs()` in shared/coins.ts, tests/prices.test.ts).
