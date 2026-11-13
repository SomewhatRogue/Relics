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

## Carts, grab and throw (2026-11-12)

Kyle: "it shouldn't say nothing to grab if you do grab it ... too easy to stun-lock him ... click to grab it then
aim it and click again to throw it." GRAB by a cart at rest takes hold of it (in front of you, the way you face);
GRAB again throws it that way, off the rail, straight on till a wall, a block or a cart at rest stops it, at most
14 tiles (sim/cartpath.ts; the same path drawn as a dotted aim arrow, client/cartaim.ts). It hits heroes in its
way (never its thrower), goblins (30), and knocks the Haulier down 2 s with its plate cracked, but not again for
10 s after (a shrug). The Haulier's shove sends a cart at rest at its hero, its lane out to where it'll stop.

## Carts on tracks (2026-11-12, replaces grab and throw)

Kyle's playtest: "it looks like carts entirely vanished ... the targeting and throw back wasn't working at all.
Instead there's tracks everywhere and you get a warning when one is coming, and if you position the enemy right he
gets hit; he can also hurl one at you." (The two carts had sat at the ends of one rail, against the walls, off a
phone's screen.) THE HAULAGE now has three tracks (one across, two down), each ending in a tunnel mouth. Every 6 s
(4 in phase 2) a track is picked, leaning to one near the Haulier so a party can lure it on: its lamps light amber
for 1.6 s, a striped lane the last second, then a cart bursts out of a mouth at 12 tiles a second, carrying its own
warm light and a spark trail, and goes into the far mouth. It hits heroes on the track (roll or step off), goblins,
and the Haulier (down 2 s, plate cracked, then a shrug for 10 s). HURL: the Haulier lifts a cart off a siding and
hurls it at its hero down a striped lane. Heroes no longer grab, aim or throw carts. (sim/trackshape.ts the one
source for the warning and lane; client/trackdraw.ts.) THE LOADING STAGE (instances) keeps its single rail.
