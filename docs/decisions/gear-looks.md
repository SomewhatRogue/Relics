# Gear looks: decisions

The gear-looks chat's log (docs/design/gear-looks.md). Newest at the foot.

## 2026-11-14: started, slice 1 (weapons by tier and element)

- Claimed the row on the board. The side-view chat owns actors.ts, figure.ts and where hands sit in held.ts;
  this chat keeps to colours there, in small edits pulled just before, and draws its own marks in new files.
(Opus 5.5)

## 2026-11-14: slice 1 in, weapons look like their tier and element

- One table, `client/weaponlook.ts`: every colour today's weapon art uses has a role (steel, fittings, grip,
  wood), and each tier has a ramp that maps a shade of a role by how light it is. Plain: dull iron, iron
  fittings, a wooden grip. Fine: unchanged (today's bright steel and gold). Forged: dark steel, a silver edge,
  silver fittings, a black grip. PRE-WAR, touched, turning, hungry: blackening steel with the hungry's green
  veins, more each tier, glowing faintly on turning and hungry. A starting (plain) weapon now looks dull, as
  the spec asks.
- In hand: held.ts's `drawWeapon` now wraps the old body (`inHand`) with `paintWeapon` (weaponpaint.ts),
  which tints colours set on the lit layer while the weapon draws and undoes in a finally; glows untouched.
  Veins and the element edge (its spell colour, breathing, a spark up it) draw in weaponmarks.ts along each
  kit's metal, from the hand and angle held.ts already worked out. No hand placement touched; heldkits.ts not
  edited at all (its colours follow through the tint).
- The look is read from the weapon in hand (`Hero.arms[weapon]`), not set in game.ts: arms already rides the
  party's patches, and a swap mid-fight shows at once. `Hero.gearLook` (shared/gearlook.ts) is only for friends
  in town, sent as `gw` in the `me` word (one to a few characters). The room never reads either.
- Floor: lootart.ts makes each weapon sprite per kit and look (cached); an element's blade breathes its colour
  and the glint takes it. relicsdraw.ts passes the item's look (one line). 2.5D: loot3d.ts tints its parts, an
  element's edge glows, cursed pieces get green flecks.
- Bag: itemicons.ts (the UI chat's) draws a weapon's picture in its tier's stuff, veins on cursed metal, the
  element's colour on the bright line (a bow keeps its string; the tip spark stays).
- Dev page `?gearlook` (gearlookpage.ts, one line in main.ts): every kit in every look, held, on the floor,
  and the bag pictures. `node scripts/gear-look.cjs` shoots it.
- Open: an elemental bow or crossbow shows its element only in the bag and on the floor, not in hand (the bow
  has no metal run for weaponmarks.ts). Mage tips still glow in the spell's element as before. Next: slice 2,
  the Hungry pieces.
(Opus 5.5)

## 2026-11-15: slice 2, the six Hungry weapons, and kept looks shown

- `WeaponLook.hungry` is now `named` (a Hungry id or a unique id). Your own hero and a party's look go
  through the Gear chat's `shownItem` (keptlook.ts) with `Hero.keep` (copied from `Profile.keep` in
  game.ts's equip, one line; drawing only), so a kept unique's look shows over the piece worn, on the
  same kit only. Friends in town get it in `gw` as before.
- Named looks, data in `client/namedlooks.ts`: their own stuff (ramps by role over the tier's, exact
  colour swaps) and a few strokes along the weapon in hand, drawn last from weaponmarks.ts in the hand's
  frame, so held.ts needed no new edit. Floor sprites and bag pictures in `client/namedart.ts`, picked by
  lootart.ts and itemicons.ts (one line each). 2.5D loot takes the named stuff only, no shape yet.
  - Skarn's Cleaver: a black iron slab off the greatsword's spine, squared, with a hanging hole; rag grip.
  - The Larder Pike: a barbed head, three meat hooks hung down a greasy haft.
  - Spendthrift: a black bow on a gold string, coins tied at the grip.
  - Mother Rust's Needles: long rusted needles bound in red thread (the main hand's runs longer).
  - The Jealous Wand: black twisted wood, a green eye at the tip that glows.
  - The Keeping Mace: tarnished collar, a coal burning in the head.
- A named piece carries fewer veins (three in hand, half on the floor and in the bag) so its shape leads.
- `?gearlook` has a HUNGRY row, mid-swing so the pieces are out.
- Next: the twelve unique weapons by their lines (uniques.ts), the same way, so a kept look shows as its
  own thing. The Deep chat owns what a unique looks like; drawn from its `line` unless they say otherwise.
(Opus 5.5)

## 2026-11-16: the twelve unique weapons, each its own thing (so a kept look at Cole's shows)

- Each unique weapon drawn as its `line` in shared/uniques.ts says, on its kit's shape: data in
  `client/uniquelooks.ts` (stuff and strokes in hand) and `client/uniqueart.ts` (floor and bag), merged into
  namedlooks.ts and namedart.ts. The Haulier's Pick a quarry pick on the greatsword; the Hinge Pin an iron
  rod with a head at the butt; the Old-Oak Bow a plank with its nail hole; Mawl's Teeth yellowed teeth in
  bone; Skarn's Hook a bright worn hook and chain (in hand, the flail's head and chain recoloured; its hook
  shape shows on the floor and in the bag, since the flail's head swings on its own angle in heldkits.ts);
  Old Knuckles' Maul a dented lump on an ash haft; Old Spoon's Ladle a black iron ladle, the spell's light
  in its bowl; Gutchain's Chain Bow chain links across the prod; Mother Rust's Shears a wedge blade, ring
  handle and pivot; the Slab Blade shield-wide iron with a rag grip; the Hushed Maul a black wet hammer
  head on a rag-wrapped haft; the Bog-Oak Hook a black pole tarred at the hands, a hook bent back.
- A unique's stuff is over today's art, not its PRE-WAR tier, and it carries no veins: it is itself whatever
  its tier (`tierStuff` on a named look keeps the tier's stuff and thinned veins: the Hungry six).
- The weapons were lengthened (dark-gold, the side-view chat): vein spans moved to the new sizes (sword to
  17.4, greatsword to 24.4, spear head 16 to 21, staff to 14.6), and the Cleaver's slab and the Pike's
  barbs moved with them.
- Strokes can `lift` (a crossbow comes up to the shoulder to aim), and get the hero.
- `?gearlook`: two UNIQUE rows under HUNGRY; a Ranger's piece shown standing (their wind-up is the short sword).
- For the Deep chat: these follow the lines; say if a unique should look otherwise and it's a data edit.
- For the new-look characters chat: generated sheets with the weapon baked in would hide all of this; keep
  the weapon drawn by held.ts over them, as your log says.
(Opus 5.5)

## 2026-11-16: slice 3, armour weight and legs on the hero

- `client/armourlook.ts`: the body piece's weight at the shoulders and neck, the legs piece's on the shins,
  in the piece's tier (the weapons' colour roles, so weaponlook.ts recolours them the same way: plain dull
  iron, fine bright steel, forged dark steel, cursed blackening and veined). Heavy: pauldrons with a rivet, a
  gorget, greaves with a knee cop. Medium: a mail mantle, mail shins. Light: a leather collar and bracers,
  leather shin wraps. A robe's legs (only the feet) take nothing.
- Made from each body's own pixels, not drawn per look: a second jointed figure (joints.ts) holding only the
  armour pixels, laid on the body's inside pixels (never the outline, so silhouettes stay), each in a tone
  matching the shading under it, pale colourless pixels (beards, white trim) left alone. `drawFigure` draws it
  right after the body (one hook line in actors.ts, the side-view chat's), so it walks, leans, crouches and
  turns with it, front, back and side, every class and look, and in 2.5D through drawHero. Cached per body
  sprite and look.
- Read through Gear's `shownItem` (`Hero.armor`, `Hero.legs`, `Hero.keep`), so a kept look applies. A unique's
  armour (PRE-WAR tier) shows clean steel, not blackened, until it has its own look; the Hungry apron and coat
  show their hungry tier. Friends in town get it in the `me` word as `ga` and `gl` ("4h", "0l").
- `?gearlook=armour` (armourpage.ts): each class facing you and in profile, light, medium and heavy at plain,
  fine and forged, and heavy at turning. `node scripts/gear-look.cjs <url> shots/armour armour` shoots it.
- Not yet: a unique's or a Hungry piece's own chest or legs look (the Haulier's Plate, the apron), and rings
  (slice 4). The Warrior's shield covers most of the chest, so on the Warrior it shows at the sword shoulder,
  the neck and the shins.
(Opus 5.5)
