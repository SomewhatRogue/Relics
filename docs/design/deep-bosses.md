# The Deep's bosses: a guardian every five floors

Spec, 2026-11-11 (Claude Opus 5.5; Kyle: "Butcher isnt the only boss ... other boss types beyond just
butch"). Kyle, yes: "fine as long as we have graphics and creative and animations for them". Every fifth
floor and the Haulier first, as below. Building 2026-11-11. Builds on `docs/design/the-deep.md` and
`docs/plans/bosses.md`.

## The shape

- **Floors 5, 10, 15, 20 and on are boss floors**: one arena room, a boss of the kit (POISE, phases,
  one clock a hero, the boss plate: `sim/bosskit.ts`), the doors shut till it's dead. Its checkpoint
  comes after, so the curse at every fifth floor (the-deep.md, step 6) is chosen with the boss behind you.
- The floors between keep what they have now: named butchers on the hunt floors, BIG ONEs, elites.
- **Bosses rotate** through the ones built, a different one each time, on the run's seed. The same boss
  met again deeper has the floor's toughness on it (`shared/deepbands.ts`), so floor 20's is worse than
  floor 5's.

## The first one: the Haulier, built for the Deep

Already designed in `docs/plans/bosses.md` (the non-butcher heavy, next in its rollout). Its arena is
underground already, so the Deep gets it first and the Open Cut reuses it later:

- **The Deep's version of the arena:** an old ore rail across the floor with carts on it, winding gear
  over a shaft (the headframe: the rod for storm), and a flooded sump (the sluice pool).
- Attacks, phases, the plate and its breaking as in bosses.md: Pick Swing, Overhead, Cart Shove, Chain
  Drag in phase 2; a cart sent down the rail (GRAB at the top) knocks it down; storm under the gear or in
  the sump breaks the plate.
- **Payoff** as bosses.md's "Not a butcher": a sure Forged-or-better piece each hero plus 80 to 120 gold,
  rolled on the floor's band odds, and the relic chance from its hoard. In the Deep these are run finds
  like any other (lost on death, banked on LEAVE).

## Then

- The Doorkeepers in a Deep arena of their own (a pair at a sealed door in the rock, not the barn) once
  the Haulier's in; Turnkey and Antlers as they're built for their zones, each given a Deep arena.
- A boss of the Deep's own, met nowhere else, is for later (tied to what the Deep is: lore keeper).

## Build order

1. Boss floors at every fifth floor, as a hunt for now (a named butcher with the boss plate's look),
   so the rhythm can be played before any arena exists.
2. The Haulier and its Deep arena.
3. The Doorkeepers' Deep arena.

## For Kyle

1. Every fifth floor, or every tenth?
2. The Haulier first, and in the Deep before the Open Cut?
3. Names: the Haulier† (and every new arena feature) go to the lore keeper and line editor before they
   go on screen.
