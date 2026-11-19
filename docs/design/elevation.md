# Elevation: the land has height, and you can read it

Spec, 2026-11-17 (Kyle and Claude Fable 5.2). **Steps 1 and 2 built the same day** (the log). **Then narrowed to raised areas the same night: read that section first.** Built first inside the territories
(docs/design/territories.md), then carried back to the board's rooms. Log: `docs/decisions/territories.md`.

## Raised areas: what replaced the rethink (2026-11-17, late)

**This section is the rule now. Where the sections below disagree with it, they are history.**

Kyle, having played Lowfurrow's slopes: "the elevation doesn't read as elevation at all. It also doesn't really add
anything to the game that much. We need to do research into how other games like this do elevation and it might
just be some raised areas or something." He agreed the change below the same evening.

**What the research said** (the sources are in the log):

- A slope seen from above is close to invisible. The rethink's wide grass slopes, walked up anywhere, were the one
  kind of height this camera cannot show.
- Games in this view show height as a stacked layer with a wall face toward the camera (A Link to the Past, Stardew
  Valley). An edge that faces away from the camera is hard to judge, so they avoid it.
- Most ground is flat and height is rare. Ledges drop down the screen or sideways, mostly south. The way up is a
  small stair.
- A ledge is often a one-way shortcut: off it anywhere, back up only by the stair.
- Hades gets its variety from room shape and hazards and does not use height as a mechanic. CrossCode went all in
  on layered height, and its makers and players both say it is hard to read.
- Having to stop and click to climb annoys people (Diablo 4's ladders and ropes).

**The rules:**

1. **Land is flat by default.** No lynchets, no land-wide levels, no slope along a whole edge. A bank or a terrace
   that is only there for the look is paint: a band of colour, a line of turf.
   (Two makes: earth under turf, `kind: 'earth'`; and the same faced in rock for a mine and under the ground,
   `kind: 'crag'`. `raised(l)` in `shared/arena.ts` is the one test for both.)
2. **A raised area is a set piece.** One box, flat on top, **two levels high** (a face a tile and a half tall), drawn
   with a tall earth or stone face, a lit lip, a dark foot and a shadow on the ground below it.
3. **Higher ground is always up the screen.** Its face is to the south, and to the east or west where a side is
   open. Its back runs to the map's edge or is grown over (a hedge across the top, a copse behind), so nobody ever
   stands on a drop that faces away from the camera.
4. **One or two narrow ways up**, three tiles wide at most, drawn as log steps between two posts so they are seen
   from across the field. Walking only: no button, no climb.
5. **Off it anywhere.** You can step off the lip and land below. It is a way down, never a way up.
6. **Each one has a job in the fight**, or it is not built: an archer's perch you must go round to reach, a
   chokepoint, a shortcut down, a lookout with a chest or a cage. **Two or three a map at most.**

**Kyle on the knoll (2026-11-18):** "MUCH better... actually really love this I'm going to be honest." His notes,
all built the same morning:

7. **Nobody lands in the bank.** An earth face leans out at its foot. A body below stops at that foot, and whoever
   comes off the lip is set down clear of it, from the one number the face is drawn with (`FACE_FOOT`,
   `shared/arena.ts`).
8. **Coming off is a jump.** The body is drawn leaping: up and out from where it stood on the lip, carried across
   to where the rules set it down, its shadow already on the ground there, dust and a shake when its feet land
   (`client/three/hop.ts`, the `land` event's `how`), in both views. (First built as a short drop; Kyle: "it still
   feels like I'm falling off the edge, not jumping and landing.")
12. **Everything is drawn at the height it happens at.** Shots, thrown things and every effect made by the fight
    (sparks, numbers, words, rings) are drawn at the level of the ground they happen on; a shot flies from the
    level it was loosed at and sinks to the ground by the end of its reach (`shared/heights.ts` `shotLv`,
    `client/fx.ts` `atLevel`). They were all drawn at level 0, so from a height a cast seemed to come from under
    the caster (Kyle: "like it thinks I'm under myself").
9. **A Rogue climbs.** A Rogue who keeps walking into an earth face for `HEIGHT.climb` seconds (0.4) goes up it and
   stands on the lip. No button. Everyone else goes round by the steps (`sim/climb.ts`).

10. **Height is range** (Kyle, 2026-11-18: "if you're up, you get a range bonus... so that there's benefits to
    taking higher zones"; `sim/highrange.ts`, numbers in `HEIGHT`).
    - **Down:** a shot loosed from a height reaches 1.5 tiles further for each level it looks down, but only from
      near the lip: lower ground within 2.5 tiles ahead of the one shooting. Stood back from the edge, nothing.
    - **Up:** each level the mark stands above the one shooting counts as 1.5 tiles more to cover. From too far
      the shot passes under them and OUT OF REACH shows.
    - The same for a hero's shots and a goblin archer's. A goblin archer on a height comes to the lip and holds
      it; it never steps off after you. A goblin archer's reach is never cut below 3 tiles.
    - On the knoll (two levels): a goblin archer on the lip reaches 10.5 tiles instead of 7.5; from below it must
      come within 4.5. On the lane's banks (one level): 9 and 6.
    - Not yet touched by it: the javelin, the hook, a Mage's held spells, a mace's smite, thrown flasks.
11. **The flat view shows all of it** ("that's almost accessibility"): a land's raised area is an earth bank with a
    turf lip and leaning sides, its ways up are log steps between posts, and bodies hop there too
    (`client/levelpaint.ts`, `client/scene.ts`).

13. **You hit what you click, at any height** (Kyle: "I want to be able to click on a goblin and have it hit them
    easily if they're on the same height as me"). The mouse's aim is measured from the middle of the hero's body
    at the height they stand at, so a goblin beside you on a raised area is hit where you click it. A goblin on
    another level is drawn higher or lower on the screen than its place on the map; the aim is put back on the
    ground the pointer is over (`shared/heights.ts` `aimOnGround`). Both views.

**The sunken lane is the one other shape.** Kyle, of THE RISE's lane: it "reads really well with the edge and the
steps on the sides." Two banks one level up either side of a road, faces to the lane and at their south ends, log
steps up them, and a flight of steps across the lane's head (up to six tiles wide) onto the ground beyond, which
stays at the banks' level so nothing drops away to the north. Of the old foot slope on the same map: "reads really
weirdly and it's not clear what's up with it." Every slope along a whole edge is gone from Lowfurrow.

**What stays from the rethink:** levels in the rules (`Ledge.lv`), `map.settle`, level-aware pathing (round a face
from below, off it from above), the fight's level tests (`sim/afoot.ts`), the shot from above, the 2.5D drawing of
a face (`client/three/landledges.ts`). What goes: slopes as the main way of showing height, heights carried
through a whole territory, the "8 tiles to a way up" rule (a raised area is small enough not to need it).

**Proved on the knoll** (`shared/knollmap.ts`, `?hero=WARRIOR&land=knoll`, `tests/knoll.test.ts`): a flat field, one
raised area across its north with two archers on its lip, a brute, the cage and a chest on top, log steps up the
south face and up the east end, three goblins and cover from the bows in the field below.

**Lowfurrow, as built 2026-11-18:** THE FIELDS is flat but for the bank behind the near hay cart. THE RISE keeps its sunken lane, the banks and the top one level up, and nothing else.

**Next:** the proving hill (`?land=hill`) still has the old slopes, kept
only because the frame's tests stand on it.

## The sweep: every other map and spec (2026-11-18)

Kyle: "Can we sweep any other maps and designs and move to this new elevation system where / if it makes sense."
Every map that lays raised ground, and what was done:

| Map | What it had | Now |
| --- | --- | --- |
| **The board's job rooms, outdoors** (`shared/terrain.ts`, `shared/roomledge.ts`: fields, villages, woods, the high road, hedged tracks) | A wooden deck or a grey rock slab one level up with a ramp, archers on it, under the old shelf rules | **Moved.** A raised area of earth, its level ground (`kind: 'earth', lv: 1`): a bank with a turf lip and log steps in both views, and every rule above (nobody lands in the bank, the leap, a Rogue climbs, height is range, archers hold the lip, you hit what you click). The same box and ramp in the same place. Look: `?hero=WARRIOR&job=2:3&area=3` |
| **The board's job rooms, in rock and underground** (mines, the under) | A rock shelf with a ramp | **Moved, the same afternoon.** A raised area faced in rock (`kind: 'crag', lv: 1`): the same bank in hewn stone with a pale worn lip, stone steps and no posts, the room's own floor on top, and every rule the earth one has. Look: `?hero=WARRIOR&job=1:1&area=1` |
| **The Open Cut's winding gantry** (`shared/cutwinding.ts`, the Instances chat's) | A wooden gantry | **Left.** It is a built thing and reads as one. It could take the rules (range, the leap) without the look; the Instances chat's call |
| **The town** (`shared/layouttown.ts`) | Three stone levels with steps | **Left.** Already levels-as-ground, built stone, no fights. It gets the leap and the truer aim with everyone else |
| **Lowfurrow** | Slopes | Done earlier today: THE FIELDS flat, THE RISE its sunken lane |
| **The proving hill** (`?land=hill`) | The old slopes | **Left** as a fixture: the frame's and the pathing's tests walk its slopes. Not on any board |
| **Expeditions, the Deep, the raid, the instance arenas** | No raised ground at all | Nothing to move. Whether any of them wants a raised area is each owner's call, by rule 6: only where it does a job |

**What moving the job rooms changed, measured:** four pinned room hashes (the ledge's kind and level are in the
plan; nothing else in any room moved), and one balance bench: in the one sampled room with a bank, the bot that
stands still with a wand takes 231 s where it took 202 and is hit about a tenth more, because the two archers on
the bank reach further and hold their lip. Daggers 120 s, staff 83 s. That is the rule working as asked.

**A back that is not closed.** A routed room's bank can stand out in the open, so its north side is a drop that
faces away. It is three or four tiles deep and one level high, and it was already so. Left; rule 3 is for what is
laid by hand.

## The quest territories' raised areas (replaces "The quest territories' height", below)

| Territory | Flat, but for |
| --- | --- |
| Lowfurrow Fields | THE RISE's sunken lane (built). THE FIELDS: the old headland bank behind the near hay cart, a level up, the stooks' archer on its lip over the loading, steps at each end, its back hedged (built 2026-11-18) |
| Tollan's Farm | **The yard**, a levelled terrace behind its wall, face to the orchard below: the bank barn's upper door opens onto it. A flight where the cart road comes up, steps at the far corner. MAWL fights on it; whoever holds the wall's lip covers the orchard. **Laid 2026-11-18** as a `'crag'` terrace two levels up across the yard map (`tollanyardland.ts`), archers on the lip either side of the flight; MAWL is inside the barn, which is its own flat map |
| Sallow Carr | Its height is water, which the game already has. One raised area: **the main bank at the sluice house**, stone-faced, the biggest den on it, over the causeway you come by |
| Fennick Ford | **The mill dam**, the race along its top, over the ford: bows on the dam cover the crossing. The town up the far bank is drawn, not walked |
| The Copperdeep Shafts | Down, by ladders, as screens. In a level: **the stope's benches**, the rock-faced raised area (`'crag'`), which the mines' job rooms now have |

## What Kyle said (2026-11-17)

"Rethink elevation: it's hard to see, and archers are on these pre-fab things. I'd like actual elevation to
be in this game and it not to be annoying." Also: "I want worlds to be beautiful and interesting."

## What height is today

- **In the rules** (`shared/arena.ts` `Ledge`): a box of raised ground at a whole-number level, a wall from
  below, a drop from above, and ramp boxes on its edge where you go between levels. A blade reaches only its
  own level; a shot from above hits a quarter harder (`HEIGHT.shot`); a goblin knocked off takes the fall.
- **On a job:** one or two shelves of about 7 by 4 tiles put down beside the track by the generator
  (`shared/roomledge.ts`), a ramp at one end, archers on top. These are the pre-fab things. They belong to
  no place, they're one level and 12 pixels high in the flat view, and the only way to an archer is to find
  the ramp.
- **In town:** three real levels with retaining walls and flights of steps (the new layout). The rules
  already stack levels; only the town uses it.

So the rules are most of the way there. What's wrong is where height is put, how you get up it, and how it's
drawn.

## The rethink

**1. Height is the land's, never a platform's.** A territory is laid on a hill, a river terrace, a hollow
lane, a bank. Whole zones sit at different levels and the road climbs or drops between them. Nothing is
raised that the place wouldn't raise. The generator's shelves go.

**2. Two kinds of edge, and one is rare.**
- A **slope**: you walk up it anywhere along its length, at full speed. Most edges are slopes. (In the rules
  a slope is a ramp as long as the edge, so this needs no new rule: to prove in the first slice.)
- A **face**: a cliff, a retaining wall, a quarry bench. A wall from below, a drop from above. Used on
  purpose, where the place has one, and never without a way round in sight.

**3. You can always read it.** One language in both views:
- Higher ground is **lighter and warmer**, lower is **darker and cooler**, a step a level.
- A **face** is tall, with a lit lip along its top, a dark foot and a cast shadow on the ground below it.
- A **slope** is drawn as a slope: a bank with its grass combed downhill, never a flight of steps unless
  someone built steps there.
- Everything stands at its height: bodies, trees, fires, telegraphs (a red floor telegraph lies on the
  ground it will hit, whatever level that is).
- In 2.5D (the look now) the ground is really raised and a slope is really a slope. In the flat view (the
  weak-phone fallback) the same land is lifted and shaded.
- Nothing hides behind height: where a rise would cover a hero or a goblin from the camera, the near face
  is cut away or the body shows through.

**4. What height does in a fight.** Few rules, the same everywhere:
- A blade reaches its own level only (as now). Because most edges are slopes, the answer to someone above
  you is to run at them.
- A shot from above hits harder (as now). So you take the high ground too.
- Off a face is a fall: a thrown, hooked or blasted goblin takes the hurt (as now); a hero who steps off
  just lands.
- Downhill is a direction: what rolls, rolls down (the Open Cut's carts already do).
- No slow for climbing, no stamina for it, no climbing button.

**5. Archers stand where a bowman would.** On the land's own high ground, or on a thing of the place: a hay
cart, a cart shed's roof, a bank over a hollow lane, a mill's gallery, a rock. Each has an answer every
class can use: walk up the slope behind it, burn or tip the cart, shoot back. An archer is never somewhere
a blade can't get to within a few seconds.

## Not annoying: the tests it has to pass

1. From anywhere a hero can stand, the way up to any goblin is a walk of no more than about 8 tiles more
   than the straight line (a test over every territory map).
2. No edge that looks walkable stops you, and no edge that looks like a wall lets you through.
3. Goblins path over slopes as freely as heroes.
4. Aim, auto-aim and telegraphs work across levels with no extra input.
5. The camera never loses your hero behind a rise.
6. A friend's name and the way-on arrow sit at the right height.

## The quest territories' height (history: see "The quest territories' raised areas")

| Territory | Its height |
| --- | --- |
| Lowfurrow Fields | A hill of three levels. The headland at the bottom, the strips stepping up in lynchets (the low banks old ploughing leaves), the hollow lane cut into the hill with a bank either side, the barn on the top. From the last stile you look back down over everything you walked |
| Tollan's Farm | A farm on a shoulder. The orchard below, the yard on a levelled terrace behind a wall, and a bank barn: its upper door is at the yard's level and its lower floor opens downhill, so MAWL's ground has two floors joined by the bank |
| Sallow Carr | Nearly flat, and the height is down: banks and holms a level over black water, and the drained cuts a level under them |
| Fennick Ford | A river terrace. The tenter field on top, the leat path along the slope, the mill at the water, the weir and the bar at river level, and the town stacked up the far bank |
| The Copperdeep Shafts | Down, by ladders. In a level: the stope's benches |

## Build order

**Built 2026-11-17:** step 1 (slopes proved, and with it goblins pathing over heights: `sim/pathlevels.ts`; the
fight's rules on every level: `sim/afoot.ts`) and step 2 (`client/three/landledges.ts`, `shared/heights.ts`).

1. **Slopes proved:** a land-shaped rise with slopes for edges on the Lowfurrow grey box; the "no more than
   8 tiles" test; goblins and heroes over it.
2. **Drawn in 2.5D:** raised ground, sloped edges, faces with lip, foot and shadow; bodies and telegraphs at
   height; the camera rule.
3. **Drawn flat:** the same land lifted and shaded.
4. **Perches:** archers on carts, roofs and banks with their answers (tip, burn, walk up).
5. **Back to the board's rooms:** the generator's shelves replaced by land-shaped rises (asked on the board:
   `shared/roomledge.ts` is terrain's).

## Calls for Kyle

1. **Slopes everywhere, faces rare:** is that the feel you want, or do you want more cliffs and climbing?
2. **What annoys you most today:** not seeing the height, not reaching the archers, or something else? I've
   guessed the first two.
