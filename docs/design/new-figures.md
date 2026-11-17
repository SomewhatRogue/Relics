# New figures: heroes and enemies at twice the pixels

Spec, 2026-11-17 (Kyle and Claude Fable 5.2). Slice 8 of docs/design/graphics-overhaul.md, grown into its own piece.
**Not in the game. The knight's bench is up (https://claude.ai/artifact/GgoKXqc7Arzz1NbNbL3Ypy): walk him in real
frames of the game, baked or live. Nothing else starts until Kyle has judged him.**

## What Kyle said

On the scale test (the sweep page, https://claude.ai/artifact/LxogAoZ4Stfj95Mgm89tbj): "70 and 210 both look so good.
especially with 32 colors... obviously we'd have to rebuild EVERYTHING to match that newer style. I really like the
styled look of the classes you had there... Basically I want those figures... (though the legs of the knight look
weird?) We can have you spin up sub agents to make things and we have Blender on my computer."

## After the first bench (Kyle, 2026-11-17)

The first knight was "too HD, not stylized"; the reference figures at the finer size are what he wants ("3d but
looking like a dark-pixel might be the play... I like the higher definition but pixel look"). So: figures are models
drawn as dark pixel art (near-black parts in many small pieces, gold as one-pixel lines, four shades a colour, dark
lines between limbs, a big outline shape, a stance), in the 8 facings and frame steps only. The size is open between
70 and 105 tall; 105 is the look in his screenshot and means the world at three times today's pixels, not two.

## After the second bench (Kyle, 2026-11-17)

"I want the reference at 70 tall in that same sort of style... that's the exact look and feel that I want... That
sort of pixel shaded but still clean look... less about height, more about the actual design of the knight itself."
So each figure is designed on what makes its reference work (for the knight: the upright greatsword, the shell of a
cloak with a ringed lining and a gold edge, banded plate, a wide stance), as our own model, and shaded as those
pictures are: four tones a colour, a checker of two where they meet, black between the parts, a black outline.

## The target

- **In play: figures 70 pixels tall, 32 colours each.** A figure pixel is half a world pixel today (3 screen pixels on
  a 3x phone or a retina laptop), whole and even. Twice the height of today's heroes on screen is not wanted: the
  camera and how much floor you see stay as settled (about 12 tiles across a phone).
- **Close up: the same figure with no visible pixels** (the "210" Kyle liked), wherever a figure is shown big and
  still: choosing a hero round the fire, the hero panel, the Roll's statues, a relic won. One model, two renders, so
  "both" costs nothing extra. Not in play: a smooth figure on a pixel floor is the parked HD street look's clash.
- **The world follows, later:** 32 pixels a tile (new-look.md's own second target), once the figures are in and
  liked. Until then new figures stand on today's floor, as the scale test shows them.

## The designs

The pictures Kyle likes (docs/design/ref/heroes-four.jpg, hooded-reaper.jpg) are other artists' work: they set the
language, and are not copied or shipped. Ours, in that language:

- Tall and slender, about eight heads; dark cloth and steel; one line of gold trim; one big shape a class that is
  known from the outline alone; a weapon as tall as its owner.
- **Warrior:** blackened plate, a closed helm, a crimson cape, sword and heater shield (or the greatsword). Proper
  greaves and sabatons: the reference knight's legs read weak when shrunk.
- **Ranger:** a wide brimmed hat with a feather, a cloak over one shoulder, the longbow.
- **Rogue:** a deep hood with no face in it but two glints, a long ragged cloak, knives.
- **Mage:** a wider brim and a tall crown, a long coat, a staff with a worked head taller than the hat.
- **Cleric:** a mail coif and a white tabard edged in gold, a mace or spear and a round shield.
- Each class's three looks, the armour weights and the weapons by tier and element (gear-looks.md) become parts and
  colours on the one model, not new drawings.
- **Enemies:** goblins keep sickly green and glowing eyes, hunched and long armed; the butcher a head taller than a
  hero and three times as wide. No gold on a goblin.

## How a figure is made

1. **A model in Blender** (Blender 5.2 is on Kyle's PC and runs scripts headless). A script builds the figure from
   simple shapes with flat cel colours (`scripts/figures/kit.py`, `knight.py`: the first pass, about an hour, plain
   and stout beside the references). Good for blocking in; the finish (proportions, cloth, faces of plate) wants a
   real modelling pass per class, by hand or by a builder agent with a tight brief and the render to check against.
2. **One skeleton for every hero** (and one for goblins), so a walk, a swing or a block is made once and every class
   and look has it. The room's own clocks drive the poses, as now.
3. **Into the game, one of two ways. The knight's bench decides:**
   - **Live:** the model drawn in the 2.5D view at half-size pixels with a pixel pass (flat bands, a locked palette,
     a one pixel outline). Any facing, gear swaps and new moves cost nothing. The risk is Kyle's own word for 3D
     figures on 2026-11-15, "lame", so it is judged moving, as pixels, in a real street.
   - **Baked:** Blender renders sprite sheets at 70 tall with no smoothing (the Dead Cells way), cleaned by a script,
     played on today's cards. Truest pixels; sheets multiply with every look and weapon.
4. The flat view (the weak-phone fallback) keeps today's sprites.

## Order

1. **The knight, end to end:** the model finished, rigged, walking and striking, in the Open Cut's street at 70 tall
   behind a switch, live and baked side by side. Kyle picks the route, or says no.
2. The other four classes, one builder agent each (Sonnet, two at a time, each with its design lines above, the kit,
   and the knight as the pattern), checked by one render each.
3. The goblin and the butcher, then the kits.
4. Townsfolk, bosses.
5. The world at 32 pixels a tile.

## Who and what it touches

- Art owns the figures' files (`sprites.ts`, `herolooks*.ts`, `figure.ts`, `three/cards3d.ts`); New look: characters
  owns `charpaint.ts` and the parked generated-sheet figures (`three/chars3d.ts`), whose hook is where a new figure
  would hang. Both asked before anything goes in.
- Drawing only. Reach, timing, hit circles and telegraphs are the room's and do not change.
- Cost: builder agents are Kyle's call each round (CLAUDE.md, section 1); he has said yes to using them here.
