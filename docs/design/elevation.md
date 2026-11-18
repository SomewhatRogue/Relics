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
8. **Coming off is seen.** The body is drawn hopping (a small rise, the fall), and dust is kicked up where its feet
   land (`client/three/hop.ts`, the `land` event's `how`). 2.5D only so far.
9. **A Rogue climbs.** A Rogue who keeps walking into an earth face for `HEIGHT.climb` seconds (0.4) goes up it and
   stands on the lip. No button. Everyone else goes round by the steps (`sim/climb.ts`).

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

**Lowfurrow, as built 2026-11-18:** THE FIELDS is flat (no raised area yet: one for the stooks' archer is the
next thing to lay there). THE RISE keeps its sunken lane, the banks and the top one level up, and nothing else.

**Next:** a raised area on THE FIELDS where it does a job; the flat view draws a land's raised area as town masonry
today and wants the same earth face and the hop; the proving hill (`?land=hill`) still has the old slopes, kept
only because the frame's tests stand on it.

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

## The quest territories' height

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
