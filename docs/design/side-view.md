# Heroes seen from the side

Kyle, 2026-11-14, picked from the art chat's list: heroes walking left or right still show their front (the
`down` map, mirrored), so a hero striding east looks like they're sliding sideways. Give them a side view.
Trial on the Warrior first; roll out to the other classes only if Kyle likes it.

## What's there now

- A look (`LookDef`, lookkit.ts) has two pixel maps, `down` (front) and `up` (back), 18 wide, plus `cut`
  (joints.ts: where the head, arm, back and legs are cut for the walk) and `lift` (how high the hands sit).
- actors.ts picks `up` when facing mostly north, else `down`, and mirrors when facing west (`flip`). The walk
  (figure.ts STRIDE) swings the legs apart sideways, which only reads from the front.
- Weapons, shields and the bow hands (held.ts, heldkits.ts) are placed from the hand point `px, py` beside
  the body; the shield sits off the front shoulder.

## The change

- `LookDef.side?`: a third map, the hero in profile facing east (mirrored for west), on the same 18 wide
  canvas and the same height and `cut` rows as the front, so the joints, the walk timing and the lift carry over.
  A look without `side` draws as now.
- actors.ts: `side` when the facing is mostly east or west (|fx| clearly above |fy|), with a little hysteresis
  so a hero walking diagonally doesn't flicker between views.
- The walk from the side: the legs swing fore and aft (a stride table of its own in figure.ts: front leg out,
  back leg trailing, the passing pose), the far leg and arm a shade darker; a robe or cloak swings as a skirt.
- Held things from the side: the weapon arm in front of the body, the shield on the far arm showing its face
  forward (a narrow edge-on sliver when turned), the far hand hidden behind the body. held.ts's angles stay as
  they are; only where the hand point sits changes.
- 2.5D gets it free (its cards draw with drawHero).
- The lineup page gets SIDE columns (walk east, strike east) so each look can be checked side by side.

## Slices

1. The Warrior's three looks get `side` maps; actors.ts chooses it; the side stride; the shield and sword
   placed for it. The lineup's side columns. Kyle tries it.
2. If yes: Ranger, Rogue (cloaks swing), Mage (robe and hat brim), Cleric (tabard, friar's habit), every skin.
3. Townsfolk, if they walk across a lot.

## Not changing

The fight: facing, reach, hit circles and timing are the room's and stay the same. Goblins (Kyle: "good as
they are for now").
