# Instances: dungeons with a story, a route and a chain of bosses

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). Not built. Names marked *(lore)* need the lore keeper and line
editor. Build after the Deep (it brings the party loot rolls); in a fresh chat.

## What Kyle wants

"Smaller mobs in a direction and a sort of mini story to play through, with bigger thematic mini bosses
and a final end boss or bosses", in the spirit of the Deadmines, Shadowfang Keep, Scarlet Monastery and
Blackrock Depths; later some "huge, where you can choose to skip bosses or miss them". Every boss, mini
bosses too, has a pool of unique items, one item per boss for the whole party, given out by a roll or a
bid (the Deep chat is building that). Big but not laggy, and the party should want to stay together.

## What the four models teach

| Model | What makes it work | Relic shape |
| --- | --- | --- |
| Deadmines | The story starts in town and pays off inside; one line through very different spaces; a themed boss in each; a reveal at the end | Small: 20 to 30 min, 4 to 5 bosses |
| Shadowfang Keep | A climb through one building; prisoners freed at the start; the building is the story | Small to medium |
| Scarlet Monastery | One place in short wings, each a run of its own, harder in turn; a famous paired final | Wings of 15 to 25 min |
| Blackrock Depths | A city: non-linear, 15+ bosses, many optional; set pieces (an arena, a bar); keys and quests open parts; groups run sections | Huge, later |

## The format

- **A lead-in from town:** a job, a rumour or someone to free, so the story starts before the door.
- **A route of areas,** each its own look, cast of goblins and hazard. Packs stand somewhere doing
  something (the atlas rule: you arrive mid-scene) and the way runs in a direction.
- **A themed mini-boss in each area,** with its own fight and loot pool.
- **An end boss or pair** with a real fight (the boss kit: POISE, rotations, the plate), and its own
  pool.
- **Checkpoints** at area gates: the party saves there, the fallen get up there.
- **Big ones:** side wings and optional bosses you can skip or miss entirely.

## Big without lag

The host's browser runs the fight and sends changes 20 times a second: lag comes from how much is awake
and changing at once, not from map size.

1. **Areas, not one map.** Each area loads when the party gets there; only the current area runs and is
   sent. Areas behind are kept as saved state. (Jobs already go room to room; this is bigger rooms with a
   route.)
2. **Packs asleep until near** (as big maps' dens already are).
3. **The cap on goblins fighting at once stays** (`sim/pacing.ts`): packs over it wait their turn.
4. **Only send what's near a hero.**
5. **A split party is the costly case** (two areas live at once), so gates wait for everyone (below).

## Wanting to stay together

1. **Alone is dangerous, not forbidden.** Some goblins go for whoever is furthest from a friend
   (netters, hamstringers, draggers). Near a friend (a few tiles) you take a little less; alone you're
   noticed sooner.
2. **Fights that need two jobs at once:** a shield goblin held in front while someone goes behind;
   paired mini-bosses where one raises the other; a hexer behind its guards; doors with two plates.
3. **Only friends get you up.** RAISE exists; die alone and you walk back from the last checkpoint.
4. **Gates wait for everyone:** the next area opens when the whole party is at the gate.
5. **Loot needs you there:** a roll on a boss's item only for heroes near it when it died.
6. **Solo where it says so.** Early areas and side pockets can be soloed; marked group areas and bosses
   are tuned for a full party (up to `PARTY_MAX`, 4) with more health and harder hits, not more goblins
   (Kyle, 2026-11-05).

## Loot

- Every boss and mini-boss has a pool of unique items (named, per class where it fits), one item per
  boss for the party, by the Deep chat's roll/bid system. Instances only.
- The boss board shows what each can drop, so people replay for a piece.
- Ties to holy and hungry later: a hungry piece in a pool can be claimed only by a hero already carrying
  hunger, a holy one only by the clean *(to decide)*.

## The first one: the miners' village into the Open Cut (Deadmines-sized)

From the atlas and the boss plan (`claude/atlas.md`, `claude/bosses.md`): Rakehead *(lore)* the miners'
village in Copperdeep, down into the Open Cut, ending at the Haulier *(lore)*. Draft route:

1. **The village** (lead-in job from Wickhold; captives to free; ordinary packs; a mini-boss in the
   square).
2. **The workings** (tunnels, carts on rails, a mini-boss that drives the carts).
3. **The washing floor** (water, sluices, a pair of mini-bosses: one raises the other).
4. **The Open Cut** (the pit: the Haulier, his ropes and loads).

## Build order

1. The instance frame: areas that load in turn, gates that wait for the party, checkpoints, packs asleep
   until near.
2. The first instance's areas with packs and its lead-in job.
3. Its mini-bosses, one at a time, then the Haulier.
4. Boss loot pools wired to the party roll.
5. Togetherness: the lone-hero hunters, the near-a-friend edge, loot only for those present.
6. Later: a wing-based one (Sallow Priory, after the lore keeper's call), then a huge one.

## Open

1. Boss loot every run, or each boss's pool once a week per hero? (Leaning: every run, with the unique
   pieces rare and bad-luck protection, so replay is the point.)
2. Party size for instances: the current 4, or bigger for raids later?
3. Sallow Priory as the wing model: a fanatic order risks echoing our own church and the Blacktongue
   books *(lore keeper first)*.
