# Elevation: the land has height, and you can read it

Spec, 2026-11-17 (Kyle and Claude Fable 5.2). **Not built.** Built first inside the territories
(docs/design/territories.md), then carried back to the board's rooms. Log: `docs/decisions/territories.md`.

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
