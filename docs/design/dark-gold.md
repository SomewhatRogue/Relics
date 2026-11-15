# Dark and gold: the look Kyle's going for

Kyle, 2026-11-15, three pictures (docs/design/ref/heroes-four.jpg, hooded-reaper.jpg, iso-dungeon.png):
"Honestly I'm going more for this feel." Asked which level, he took the mood at the size we draw now, across
"heroes and enemies, buildings etc." (not hand-drawn sprites at three times the pixels, which is a different way
of making art).

## The feel

- **Dark, with one accent.** Near-black, slate, deep teal, dull green and rust; gold trim and filigree the one
  bright thing on a hero. Figures sit dark on dark and the accent picks them out. Firelight stays the only warm
  light (the look approved 2026-10-31 holds: cool stone, torches).
- **Tall, slender, big shapes.** Silhouettes made by a brim and a feather, a cloak to the ground, a hood with no
  face in it but two glints, a spear or sword taller than its owner. (The heroic proportions of 2026-11-12 are
  the start; this leans further.)
- **Heavy, worn stone.** Green-grey stone in big blocks, moss in the joints, columns, rubble heaps at the foot
  of walls, broken steps, timber gone dark. (The dungeon picture's world, not its little hero.)

## Slices

1. **Buildings and the world.** blocklook.ts's table and the 2.5D houses to the dark palette: green-grey stone,
   dark timber, slate and moss on roofs; rubble at wall feet, columns and broken steps as props; the halls and
   the Deep's stone the same. Takes in lived-in-world.md's slice 3 (drawn buildings in 2.5D) since they're the
   same work. Free to start now.
2. **Enemies.** Goblins keep their sickly greens and glowing eyes, the rest of them darkened: rust, bone, black
   leather, dirty iron; butchers and bosses the same, each keeping its own shape. No gold on goblins: gold is the
   heroes' mark. Free to start now (sprites.ts goblin parts, foekits*, butcherparts.ts, the boss draws).
3. **Heroes.** Every class and look to the dark-and-gold palette with gold trim lines; slimmer; the Mage's brim
   wider with a feather or band, the Rogue's face lost in the hood but for two glints, the Ranger's hat and
   cloak, the Warrior's plate darker with gold edging, the Cleric's mail with gold filigree. Weapons longer.
   Waits for the side-view chat (it's drawing the Warrior's side maps in herolooks.ts) and goes with the gear
   chat's weapon colours (dark steel, gold fittings).
4. **Townsfolk** after the heroes, in the same palette but no gold.

## Looked at and left for now

- **True isometric in 2.5D** (the dungeon picture's 45 degree turn): the 2.5D camera is already orthographic,
  but everything in it (the floor painting, the overlays, the mist, the follow, the culling) assumes it looks
  straight north. Turning it is a real piece of work, not a quick trial. Kyle to decide after slices 1 to 3.
- **Heroes at the pictures' own detail** (80 to 110 pixels tall): hand-drawn frames for every pose, an artist
  or careful generated sheets. Not this pass.

## Not changing

The fight; the flat view's stepped light bands; the readability rules (red floor telegraphs, goblin eyes).
