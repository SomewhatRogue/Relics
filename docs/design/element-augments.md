# Element augments: an element put on your weapon, for five jobs

Draft, 2026-11-20 (Claude Opus 5.5, from a talk with Kyle in the Holy and hungry chat). Kyle's own calls are marked;
the rest are drafts for his yes. A system of its own, apart from holy and hungry gear.

## Why

Kyle: elements today are "perks on some items as a random chance. I don't honestly love that." So the element
moves off the loot roll and becomes a choice you make, paid for, before a job.

## The rules

- **No more elemental traits on random weapons** (Kyle). FIREFORGED, FROSTFORGED and STORMFORGED (`ember`, `rime`,
  `storm` in shared/loot.ts `ELEMENT_TRAITS`) stop rolling. **Weapons that already have one lose it** (Kyle: "get
  that element stripped, sorry"), once, when a save loads.
- **Someone in town puts an element on your weapon instead**, from level 5 (Kyle). Not Magister Vell (Kyle); the
  townsperson who does nothing today, given a little arcane corner of his own. Draft: **Old Merren**, the Old
  Quarter's elder, talk-only now (Kyle to confirm the person and the name; the lore keeper to say what he is and
  how he knows it, never shard-stuff or the Want).
- **A runner fetches you** the first time, at level 5 (Kyle), as the arrival runner does (client/runner.ts).
- **One element on a weapon, for 5 jobs** (Kyle: "just 5 missions in general"): any job finished, whatever its
  size or how it ended. It does what the old trait did (charged hits and full draws burn, chill or shock), and
  plays off the others as now (steam, shatter, flare, storm jumping between the wet).
- **20s each; the first of each element free** (Kyle: three free, one fire, one frost, one storm, a hero's first).
- **A new element replaces the old** (Kyle), and he says so first: something like "You sure? The old one will be
  lost." (lore keeper and line editor), with a yes and a no.
- **Not for the Mage** (Kyle): a Mage channels his own elements (shared/magic.ts), so the corner has nothing for
  him; it says so kindly.

## Materials (Kyle, 2026-11-24)

Kyle: "I also want to be able to get some materials that's necessary for adding elements onto your weapons ... Let's
add this into that system." Each element after a hero's free first takes one material besides the 20s: fire takes
CHARCOAL (from the Charcoal Hut's keeper on the north fields); frost and storm take materials from lands still to
come (docs/design/materials.md).

## Drafts, for Kyle's yes

- **On the card:** the weapon's element and the jobs left ("FIRE: 3 jobs left"), and a small mark beside the
  weapon in the fight. At 0 it's gone, with a line in the job's recap.
- **Holy and hungry pieces with an element** (Kyle: "fine with some holy or hungry gear having other elemental
  augments"): a few named pieces carry an element of their own, kept for good, not from the corner; a corner
  element on such a piece replaces its own only with his warning. Which pieces, later (holy-and-hungry section 6:
  vowed fire that warms friends it touches, hungry fire that feeds you).
- **More interplay** (Kyle: "I do like elements playing off one another"): a later pass with numbers, for example
  one hero's frost and another's storm meeting.

## Whose files

Gear (`loot.ts`, `gear.ts`: the traits stop rolling; the strip on load with save.ts), Town quests (the runner),
Economy (the price), Art and the town's map (the arcane corner), the lore keeper (who he is). A new chat of its
own, with a board row, builds it.
