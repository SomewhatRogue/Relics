# The UI look: iron and ember

Style guide, 2026-11-11 (Kyle and Claude Opus 5.5). Kyle picked A, "iron and ember", over the parchment
look ("B is not on theme at all"). One look for every screen, town and dungeon alike. Mock: the "A: Iron and
ember" artboard on https://claude.ai/artifact/L1ta3vsoJeo8TihHKAJVEw. Not built.

## Why

The panels today are flat grey boxes: readable, but not shiny and not of the world. Every panel should look
forged: iron plate, brass, gold leaf, firelight.

## Colours (one token set, `src/client/ironui.css`)

| Token | Hex | Use |
| --- | --- | --- |
| outline | #07080a | 2 px line round every panel and button |
| iron | #23252b | the outer plate of a panel |
| well | #14151a | the sunk face inside the plate |
| bevel-hi / bevel-lo | #5c616c / #0e0f12 | 2 px inset light top-left, dark bottom-right |
| brass / brass-dk | #c89a4a / #6a4a1e | rivets, hairlines, small labels |
| leaf | #9a6a22, #e8b85a, #fff3c8 | gold-leaf gradient (named pieces, relics, NEED) |
| ember | #6a3a12 to #e87a2a to #fff0b0 | timers, fuses, heat |
| text | #f0e6cc, #b8a47c, #a9b4c2, #8d929c | body, warm second line, cool second line, quiet |
| hungry | #9cc95a on #26301a | hungry pieces glow sick green in place of gold |
| danger | #d8503a | loss, risk, a red floor telegraph's colour |

## Parts

- **Panel:** outline, then iron plate with a 2 px bevel and a brass rivet in each corner (6 px square, lit
  top-left), then the sunk well inside with its own 1 px inset. A soft shadow under it. Squares, never
  rounded: it's pixel art.
- **Heading rule:** a small Silkscreen label in brass between two brass hairlines that fade out each side.
- **Type:** Grenze Gotisch (bundled already) for item names, screen titles and boss names; Silkscreen for
  labels, buttons and numbers; Alegreya Sans for anything read as a sentence. Gift lines sit in a sunk box.
- **Buttons:** pressed metal. Primary is gold leaf with dark brown text; secondary is iron; quiet is sunk.
  Pressed flips the bevel. 48 px tall at least.
- **Bars:** a sunk trough, 1 px edge; the fill a gradient by kind: ember for timers, gold for faith,
  green for the Want, red for health.
- **Item frames:** the frame's colour is the tier's; unique and named pieces get gold leaf and the pulse.

## What glows and what moves (rationed)

- Gold leaf glints (a light sweep every 3 s) only on uniques, named pieces and relics, never on headings.
- A drop or a relic pulses its glow while it waits to be picked up or chosen.
- Timers burn as a fuse, sparks at the burning end.
- Behind a panel over the fight or the town, the torchlight flickers a little.
- Everything moves in steps, never smoothly, so it stays pixel. One option turns motion off.

## Build order (a UI chat, CSS and markup only)

1. `ironui.css`: the tokens and the panel, rule, button, bar and frame classes.
2. The job board (Kyle: "lame"), then the town's shop panels and home cards.
3. The hero panel and the pack, then the boss plate and the HUD bars.
4. Screens other chats own (the loot roll card, the Deep's checkpoint, trading): class names only, through
   their chat or once it finishes.

The UI chat owns `ironui.css` and the `.css` files it restyles; it changes no fight rules.
