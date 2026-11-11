# Boss loot: a unique pool per boss, one drop a group, rolled for

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). Kyle's answers (2026-11-11): NEED / GREED / PASS with the
room's 1 to 100 (no gold bid); no bad-luck protection; pools for bosses of the kit, named butchers and BIG
ONEs; a won piece is a run find, at risk till LEAVE. Building.

Kyle: "I also want each boss to have a loot pool even mini bosses of unique items but its only one loot
item per entire group. We will want to add a bid and rng system for loot similar to what world of
warcraft had. Only for these sort of instances raids so people are encouraged to play and replay."

## The shape

- **Where:** the instances only: the Deep (and later any raid-like place built the same way). Ordinary
  jobs keep their per-hero treasure and drops as now.
- **Who has a pool:** every boss of the kit (the Haulier, the Doorkeepers, later the rest), every named
  butcher, and every BIG ONE (the mini bosses). Each has its own short list of unique pieces, found
  nowhere else. Elites keep ordinary drops.
- **One piece a kill, for the whole group.** A kill rolls once on that boss's pool (better odds deeper:
  `shared/deepbands.ts`). The piece lands on the floor glowing in its own colour, and the group rolls for
  it (below). Solo: it's yours, no roll.
- **Unique pieces** are named, with fixed stats and one trait of their own (a short line of what it does),
  each with its boss's name on it (as SKARN'S CLEAVER carries SKARN's today). Some are weapons for one
  class, some armor or rings anyone can wear, so a pool has something for most parties. A hero can own
  one of each. Deep-only, so a repeat run is the way to complete a set.
- **Like any find below**, a won piece is a run find: lost if you die, banked on LEAVE
  (`shared/deepkit.ts`). That's the push-your-luck.

## The roll (WoW's need and greed, with a bid on top)

When a unique piece drops, everyone in the group still in the run gets a card: its name, picture, what it
does, and three buttons, decided within 20 s (no answer is PASS):

- **NEED**: for your class (a weapon of another class's kit can't be NEEDed).
- **GREED**: you'd take it.
- **PASS**.

Then everyone who chose NEED rolls 1 to 100 (the room's seeded roll, shown to all); highest wins. If nobody
NEEDed, the GREEDs roll. Ties roll again. Everyone sees every roll in the chat and over the piece.

**The bid (option B, if wanted):** instead of NEED and GREED, a gold bid: a few seconds of sealed bids, the
highest wins and pays, and the gold is split among everyone else in the group (WoW's gold-split raids). It
makes every drop worth something to the losers too.

**Loyalty (option C, if wanted):** a hero who loses a NEED roll on a boss's pool gets +10 on their next NEED
roll on that same pool (bad-luck protection), kept on their save.

## The room decides

The roll is the room's (`src/sim/`), seeded, never `Math.random`. The choices ride on each player's input as
the Deep's GO DEEPER vote does (`Intent`), so nothing is lost on a dropped packet. The winner's own game
puts the piece in their pack from the room's event, and their tally (client/jobbank.ts) keeps it if they
reload mid-roll.

## Build order

1. Pools and pieces: the Haulier's, the Doorkeepers', and a few named butchers' (names and lines: lore
   keeper and line editor), drawn in the pack with their own icon frame.
2. One drop a kill, on the floor, solo pick-up.
3. The roll card and NEED / GREED / PASS, the room's d100, the chat lines.
4. Option B or C, if chosen.
5. The BIG ONEs' pools.

## For Kyle

1. NEED/GREED/PASS (WoW's group loot), a gold bid with the pot split (option B), or both (bid when two or
   more NEED)?
2. Bad-luck protection (option C)?
3. Mini bosses: the BIG ONEs too, or bosses and named butchers only?
4. A won piece in the Deep: a run find (lost on death), or yours the moment you win it?
