# Gear you can see

Kyle, 2026-11-14: "items that change appearance". Today the hero's look is its class and skin; the weapon drawn
is its kit (a sword is a sword whatever its tier), worn armour and rings don't show, and a Hungry piece looks
like any other of its kit. Make what you carry show on you, in the hand, on the floor and in the bag.

## What shows

- **Weapons by tier.** One weapon look per tier, the same shapes as today (held.ts, heldkits.ts) in different
  stuff: plain, dull iron and a wooden grip; fine, bright steel with brass fittings; forged, dark steel with a
  silver edge, and if it carries an element, that element's colour along the edge and a faint glow (fire,
  frost, storm: the colours the spells already use); the three cursed tiers (Tol's Mouth, touched, turning),
  the metal blackening and veined in the sickly green of the hungry, more of it each tier; Hungry, below.
- **The named Hungry pieces** (shared/hungry.ts, eleven): each its own look, as the thing it's named for
  (Skarn's Cleaver a butcher's cleaver, the Larder Pike hung with hooks), held, on the floor and in the bag.
- **Armour weight**, worn: light, medium, heavy as overlays on the class's own body rather than new bodies:
  heavy adds pauldrons and a gorget in plate, medium a mail coif or mantle edge, light a leather collar and
  bracers. Tier tints the trim the way it tints weapons. Every class and skin keeps its silhouette and colours.
- **Rings**: a glint on the off hand, the tier's colour, now and then.

## How

- `Hero.gearLook?` (drawing only, like `houndLook` and `shieldLook`): the equipped weapon's tier, element and
  Hungry id if any, the armour's weight and tier, whether a ring is worn. Set from the profile when the hero is
  made or re-equips (game.ts); sent to friends in the town's `me` word (townpresence.ts, packed small) and to
  the party as a hero field. The room never reads it.
- Weapon colours from one table (a new `weaponlook.ts`: tier and element to blade, edge, fittings, glow), read
  by held.ts, heldkits.ts, the floor loot (lootart.ts, three/loot3d.ts) and the bag icons (itemicons.ts), so
  all three agree.
- Armour overlays as small pixel maps per class, drawn on the body in actors.ts after the body, cut with it
  (joints.ts) so they walk with it; their own file per class.
- 2.5D gets it free (its cards draw with drawHero).
- The lineup page: a GEAR group showing one hero of each class in each weapon tier and armour weight.

## Slices

1. Weapon looks by tier and element, held, on the floor and in the bag. `Hero.gearLook` with just the weapon.
2. The eleven Hungry pieces.
3. Armour weight overlays, the Warrior and the Cleric first (the heaviest wearers); then the rest.
4. Rings.

## Not changing

Reach, hit circles, stats and timing. A Warrior's painted shield (shieldlook.ts) stays the player's choice.

## Working beside the side-view chat

The side-view chat (docs/design/side-view.md) owns actors.ts, figure.ts and the hand placement in held.ts.
This chat changes only colours in held.ts and heldkits.ts, in small separate edits pulled just before, and
puts its own drawing in new files. Armour overlays (slice 3) wait until the side view has landed, since they
must be drawn for it too.
