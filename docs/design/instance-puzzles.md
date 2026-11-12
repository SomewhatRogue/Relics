# Instance puzzles (spec)

Draft, 2026-11-12, Instances chat (Claude Opus 5.5). Kyle: "some puzzles in the instance could be good. Simple
pushing boxes or old runes that open up as a mini game. Nothing super complex but interesting to solve, especially in
multiplayer having a wave come at you while you solve. Single solo would just be the puzzle."

## The rule

- **A puzzle keeps a gate**, as a pack or a named one does (a stretch's `puzzle`, sim/stretches.ts): solve it and the
  gate opens. Small: one screen, solvable in a minute or two once you see it.
- **Teach it in the place:** the thing to do is drawn on the floor or the wall (a plate outlined where a tub goes, a
  carving showing the order), plus one goal line. No guessing what the game wants.
- **Solo: just the puzzle.** Two or more heroes: while it's unsolved, waves come at the party from a marked spot (an
  adit, a door), held to the pacing caps, so some solve while others hold them off. Solved, the waves stop.
- **The room decides it** (sim/): every push and press goes through the room, so friends see the same state, and a
  handover keeps it.
- **A reset** (a lever, or stepping off) so a stuck puzzle is never a dead run.

## Kinds

1. **Pushing tubs** (box pushing): ore tubs on a grid, pushed one tile at a time by walking into them; get each onto
   its outlined plate. Two or three tubs, a few walls. Fits any mine or cellar.
2. **Points and levers:** throw levers to set a rail's points so a cart runs to the right end (the cart then breaks
   the gate). Fits the Open Cut's rails.
3. **Old runes:** a ring of carved stones; press them in the order a carving shows; a wrong one resets the ring.
   *Not in the Open Cut* (the arc spec keeps anything old or carved out of it); for a later instance (a ruined
   keep, the Deep).

## First build (Kyle: "Yup", 2026-11-12; built the same day)

The puzzle frame and **pushing tubs**, in the Open Cut under the hill: the old adit's **ore sorting floor**, three
tubs onto the tipping plates to drop the gate, waves out of a side drift when two or more are in. Then points and
levers over the top, and runes when an instance with old stones comes.

**As built:** THE SORTING FLOOR (shared/cutsorting.ts), the first place under the hill: a 7 by 5 grid of 1.4-tile
squares, three tubs, three chalked iron plates, boulders for walls; ten pushes at the least, and a wrong first push
that strands a tub (tests/puzzles.test.ts solves it). Hold the stick into a tub `PUZZLE.push` s and it slides a square.
The lever by the way in (GRAB, the button reads PULL) puts the tubs back. Two or more near it: one goblin out of the
side drift every 9 s, three at most. Lines (lore keeper, line editor): "Push 3 tubs onto the plates", PULL, TUBS
RESET, TUBS IN PLACE. Lore keeper: the tubs, plates and lever are the old miners' fittings; the chalk is plain
outlines, never strokes in fives (the chalker's tally); the side drift is an ordinary mine passage.
