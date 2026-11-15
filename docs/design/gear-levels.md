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

## Slices

1. Item level on every piece and card, the closer tier points, the level growth; old pieces carried over.
2. The card: `LV 7 +2`, and what a piece would be now and after a plus.
3. Rarity measured by the bot, odds retuned, a test per row.
4. Legs: the slot, drops, the pack square, the card, the sums; goblins measured and retuned.
5. Looks, with docs/design/gear-looks.md: legs on the hero, uniques' own looks, keeping a look at Master
   Cole's (with the Deep chat for uniques, and whichever chat takes gear-looks).

## Kyle's answers (2026-11-14)

- Item level from where it dropped, about 7% a level: yes. Pluses stay pluses, on top.
- Legs: modifiers only, the weight on the chest.
- Keep-the-look for uniques at Master Cole's: yes.
- Built by a new Gear chat, not the Economy chat. Prices it sets go through the Economy log's rules
  (prices in jobs of copper, `jobs()` in shared/coins.ts, tests/prices.test.ts).
