# Relics: earned, never found

Spec, 2026-11-15 (Kyle and Claude Opus 5.5). Approved by Kyle; not built. Takes over section 4 of
docs/design/holy-and-hungry.md (built ahead of the rest of that spec). Lines marked *(lore)* need the lore
keeper and line editor.

## Why

Kyle: "make relics more rare and more fanfare for getting them ... right now I feel like you get too many too
fast and it's cumbersome to trade it out mid fight or mid mission."

Today a relic can come from a named butcher (4%), a hero's first named-butcher kill (sure), any zone's climax,
a story mission, the expedition's beacon, the bottom of a deep dive, or a boss's chest (15 to 20%); each is
rolled at random, so repeats come, and a hero carries several and swaps between them on a job.

## 1. Where relics come from (both, Kyle)

Each relic has one home, and getting it is a big moment, never a roll:

- **A church quest.** Isolde (the quest mark on her: docs/design/town-quests.md) sends you for a relic: where it
  was last seen and what holds it *(lore: her words per relic)*. The quest's job ends at a boss that has it.
- **A great boss's first kill.** Beat the end boss of a big quest or instance and, if you don't have its
  relic, it's yours, no roll (docs/design/instances.md: the Haulier's).

A church quest can send you to a great boss: the two are one road, from the church or straight at the boss.

| Relic | Home (draft; the lore keeper settles) |
| --- | --- |
| Relic Javelin | Every hero starts with it (broken, mended at the church: town-quests.md) |
| Grappling Hook | The Haulier, the Open Cut (Rakehead's end) |
| Knuckle | The Hempen Man, Hangman's Wood |
| Lodestone | The Doorkeepers, Lowfurrow |
| Net | Fenmere's end boss |
| Gall Bomb, Wind-Up Bow, Bone Whistle | Church quests to the next great bosses (Coldscar's Turnkey, the Old Park, the Corpse Road) |

- **One of each, never twice.** No random relics, no repeats.
- **Gone:** the named butcher's 4% and its first-kill sure relic, zone climaxes' and story missions' rolled
  relics, the beacon's, the deep dive's, boss chests' relic odds (shared/relicaward.ts, sim/namedrelic.ts,
  sim/pickups.ts dropRelic). Elemental and LOUD relic rolls go with them (later: holy-and-hungry section 6).

## 2. The fanfare

- The full-screen moment (the "A relic won" artboard on https://claude.ai/artifact/L1ta3vsoJeo8TihHKAJVEw):
  its name in gold leaf, where it came from, its five uses, a line from whoever's near *(lore)*.
- **The Roll:** the first in Wickhold to win each relic is named on it.
- It goes straight into the relic slot, carried if you carry nothing better.

## 3. Carry one

- A hero carries **one** relic on a job, chosen in town: in the pack's relic slot, or at the church when
  it's handed over. No swapping on a job (the relic swap and its button go).
- Five uses each before the church recharges it (holy-and-hungry section 4; recharge for gold, clean heroes).

## 4. Existing heroes (Kyle: "re-earn")

Every hero keeps the Relic Javelin only; every other relic they hold is gone, once, when the save loads
under this version (a version on the save so it runs once). Shown to them once, plainly *(lore: a line)*.

## Build order (slices)

1. Remove the old sources (above) and the swap; carry one, chosen in town.
2. The save step: everything but the javelin gone, once, with its notice.
3. Great bosses' first kills give their relic (the Haulier's with the Instances chat; the Hempen Man and the
   Doorkeepers here).
4. The fanfare: the moment, the Roll line, the slot.
5. Church relic quests from Isolde (with the Town quests chat's quest marks and goal line).

## Coordination

The Town quests chat owns the church's errands and quest marks; the Instances chat owns the Haulier's drop
and boss loot; check the board and change their files through them.
