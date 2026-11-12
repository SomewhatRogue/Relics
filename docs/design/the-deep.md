# The Deep: an endless dungeon under Wickhold

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). Steps 1 to 6 built 2026-11-11 (`shared/deep.ts`, `deepkit.ts`, `deepbands.ts`, `deeploot.ts`, `client/deepui.ts`). Names marked *(lore)* need the lore keeper and
line editor before they go on screen.

## The shape

- Enter from the Wickhold Sewers, at the sewer grate once the works have opened it. Cobb the gravedigger
  sits at the way down with a lamp and a slate and tells you plainly what you risk (lore keeper; story bible, "The Deep").
- Each floor is a fresh random map from the existing generator. Goblins get harder every floor through
  the threat budget (more of them, elites and named butchers deeper); loot gets better every floor.
- At the end of each floor, a checkpoint: **LEAVE** with what you've found, or **GO DEEPER**.
- Die and the run's finds are gone. Your deepest floor still goes on the board.

## What's at risk

- **Only what you picked up on the run.** Everything you walked in with is yours, always.
- The game snapshots each hero's gear and pack at the way down. Anything found below is marked as the
  run's until you leave. If you die, run finds are lost and everything from the snapshot comes back,
  **even if you swapped it out mid-run** (equipped a find, dropped your old sword in the pack). Gold
  found below works the same way.
- Leaving banks everything: run finds become ordinary gear.

## Party

- Parties welcome; each hero's risk and haul is their own.
- At a checkpoint each player chooses. Those who leave bank and go up; the rest go on together.
- **Disconnects are forgiving:** a dropped player counts as having left at the last checkpoint they
  passed, banking what they had there, unless they rejoin the run.
- Boards: solo and party listed apart.

## Paths, blessings and curses (Kyle, 2026-11-11)

- **Every five floors, a curse**: the way forks into three paths and you pick which curse you take.
  Curses are small and they **stack** for the rest of the run: less damage, slower, a little less
  health, slower stamina or faith, goblins spot you sooner.
- **Every ten floors, a blessing** as well: pick one of three, and they stack too (more damage, a relic
  use back each floor, faster stamina or faith, more health).
- None of it lasts outside the Deep, good or bad.

## Floors and loot

| Floors | Goblins | Loot |
| --- | --- | --- |
| 1 to 5 | ordinary packs, the odd elite | town tiers, PRE-WAR now and then |
| 6 to 10 | elites common, a butcher every few floors | PRE-WAR common, rare tiers start |
| 11 to 15 | named butchers, mixed affixes | rare tiers common |
| 16+ | everything, rising without end | the best tables, Deep-only finds *(later: tie to holy and hungry)* |

Each floor is short (2 to 4 minutes) so a run's length is the player's choice.

## The board

- Beside the way down and on BEST IN WICKHOLD: deepest floor reached, then gold banked as tiebreak.
- Kept per hero, as the other boards, checked on the server the way the butts and the forge are.

## Build order

1. The way down and its keeper; one floor generated, the checkpoint, LEAVE and GO DEEPER.
2. The run snapshot: gear and pack kept on death, run finds lost, mid-run swaps handled.
3. Floor scaling (threat and loot tables by band).
4. Party: per-player checkpoint choice, disconnect counts as leaving at the last checkpoint.
5. The board.
6. A curse every five floors, a blessing every ten, stacking for the run.

## Open

1. ~~Who sits at the way down, and what is the Deep in the world?~~ Cobb; a pit older than the town (story bible).
2. Leaving mid-floor alone counts as leaving at the last checkpoint passed (as a disconnect does). Relics and potions are not run finds: a relic found below is kept even on death, a potion drunk is gone.
3. Any tie to holy and hungry (hungry finds only below a floor, say)?

## After the build (2026-11-11)

- **Layers** (shared/deeplayers.ts): every five floors the pit goes down into somewhere else, a place that sank
  whole long before Wickhold (lore keeper: never "warp" or "magic"). The drains, then old caves, a drowned fen, a
  buried wood, a buried street, those four round and round. Each is the room builder's own country (under,
  rock, fen, wood, village): its ground, walls, light and set pieces. Boss floors keep their arenas.
- **The checkpoint** (client/deepui.ts, deep.css): each choice a card with its good and its cost; what's next
  (the boss waiting, a new layer starting); in a party who has chosen what, live, and after choosing you wait
  there. Each way on at a fork is a curse and a boon now (shared/deepmarks.ts WAYS, BOONS).
- **Cobb** stands by the grate in town once it's open; talking to him is the way down.
