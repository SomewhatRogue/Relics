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
