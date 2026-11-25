# Damage ranges: every hit rolls, and the card shows the range

Kyle, 2026-11-25: "I actually wonder if weapons should have damage ranges shown on them that go up with level too so
you want to increase your weapon etc", then, asked whether hits roll or only the card shows a range: "Rolls inside the
range and then modified by str etc". Built by the land's chat; the fight is everyone's, so notes on the board.

## The rules

- **A weapon has a range**, not one number: its base hit, lifted by the level it dropped at and by its plus (both
  already raise damage: shared/gear.ts `ILVL.base.damage`, forgeplus.ts `PLUS.damage`), spread either side by the
  weapon's kind. A heavy weapon swings wide, a light one is steady:

  | Weapon | Spread |
  | --- | --- |
  | daggers, wand, staff | 10% either side |
  | sword, spear, the bows and crossbow, the rest | 15% |
  | greatsword, mace | 25% |

  (`SPREAD` in shared/tuning.ts, by weapon id.) A hero on their starting weapon has the same range as a plain one.
- **Each hit rolls inside it**, then everything else applies as it does now ("modified by str etc."): the hero's
  damage modifiers, crits, counters, backstabs, weak spots, the edge's element. The roll is even across the range, so
  the average hit is today's hit.
- **The room decides it**: a per-hero dice stream kept on the hero (`h.dmgSeed`), the way crits are rolled
  (sim/combat.ts `rollCrit`), so no other stream in the room moves. Enemy damage does not roll.
- **The card shows it**: DAMAGE 9 TO 12 at the top of a weapon's card (the weapon's own range, before the hero's
  modifiers), and the hit numbers below as ranges with the hero's modifiers in (HIT 10 TO 14). The card's comparison
  against what you hold (client/card.ts `compare`, green better, red worse) compares the ranges' middles.
- **The recorded sample fight** (tests/perfparity.sim.golden.json) is recorded again once, with this change and
  nothing else in it (`RECORD_PARITY=1`), since every hero hit's number moves.

## Not in this

Enemy ranges; a separate strength stat (Relic has none: the modifiers are it); ranges on spells' areas.

## Built (2026-11-25)

shared/dmgrange.ts (`spreadOf`, `rangeOf`, `rollDmg` from the hero's own `dmgSeed` stream, salted apart from the
crit's), `SPREAD` in shared/tuning.ts. Rolled once a landed hit in sim/combat.ts `hitEnemy` (every swing), sim/bolts.ts
`strike` (bows, crossbow, sparks, knives, darts) and `blast` (a hero's burst; not potions or relics), sim/sickle.ts
(each spin tick), sim/frostholds.ts (cold blast, nova, shatter). Not rolled: burns, poisons and bleeds, enemy blows,
the chain lightning, nets and the lodestone; other spells' damage (staff rings, storm, skystrike) and the cleric's
chain could roll later. The card: DAMAGE lo TO hi for the weapon, HIT, FULL CHARGE and LAST BLOW as ranges with the
hero's modifiers in. The sample fight re-recorded once (every scene moved, from its first hero hit).

