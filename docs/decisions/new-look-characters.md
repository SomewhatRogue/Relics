# New look: characters, decisions

This chat's log (docs/design/new-look.md, "The chats"). Heroes, goblins and townsfolk in the concepts' style: the
sprite sheet in Kyle's ElevenLabs flow "Relic: HD-2D look tests" (five heroes; the knife, torch and spear goblins and
the butcher). Everything here is behind `?look=3d&hd&street`; without it nothing changes.

## 2026-11-15: started

- Row moved to Active. First a test: the knight (Warrior) and the knife goblin (a scrapper) walking and attacking in
  the 2.5D view, made two ways from the same generated art, to choose how all characters get made:
  `&chars=sheet` (generated frames, cleaned up and played by the act) and `&chars=parts` (the idle frame cut into
  parts that the pose code, heropose.ts and foepose.ts, moves).
  (Claude Opus 5.5)

## 2026-11-15: the test, the knight and the knife goblin, made both ways

- **The art.** Two sheets generated in the flow from the concept sheet as reference (gpt-image-2.5-sunburst, node
  "knight" and "goblin" next to the concepts; picked take 2 of four for each): one character, flat magenta, 3 rows
  (facing you, side-on facing right, walking away) by 7 columns (idle, a four-frame walk, the attack drawn back, the
  attack through). `scripts/charprep.py` cuts them out, scales the lot by one factor (the knight's idle 80 px tall,
  the goblin's 56, at 32 px a tile), snaps to one 40-colour palette with no dither, adds a one-pixel dark edge, puts
  every frame's feet at one point in a fixed cell, and keeps hot reds out of the palette as a glow layer (the
  goblin's eyes; opt-in, as the knight's cape would count). Out: `src/client/three/charkit/` (knight 96x98 cells,
  goblin 81x65).
- **On screen** (`three/chars3d.ts`, one hook line in `view3d.ts`): any Warrior and the plain, lunger and looter
  scrappers stand on their own card at the feet, turned to the chase camera, lit by the same card material as the
  flat figures (figmat.ts). The old card stays for its shadow, drawn empty. The row is the facing as the camera sees
  it, the side row mirrored for the left; the column follows the pose code's phase, so the room's timing is kept
  (`charframe.ts`, tested). `&chars=sheet` (the default under `?street`) plays the frames; `&chars=parts` cuts each
  facing's idle frame into joints.ts's parts and moves them with figure.ts and heropose.ts or foepose.ts, the pose
  numbers scaled to the new density; `&chars=old` is today's.
- **What the shots say** (`scripts/chars-look.cjs`, shots/chars/compare-*.png): the sheet way reads like the
  concepts: the sword comes up and over, the goblin coils and lunges, the legs step. The parts way is the idle frame
  nudged a pixel or two: a blade can't swing (parts only slide), and the hip cut shows as a seam across the cape.
  **Recommendation: generated sheets, cleaned up.** Kyle to choose.
- **Not yet in the new figures** (the old drawing had them): the swing's smear, your hero's ring at the feet, status
  marks over a goblin, the silhouette behind a wall, the red after the white hit flash, rolls, carrying, being down.
  Weapons are baked into a sheet, so gear looks (the gear-looks chat's tiers and elements) need the weapon left out of
  the sheet and drawn at the hand, or a sheet per weapon kind. On a phone the street draws 24 px a tile, so the 32 px
  art is shown a little under 1:1.
- Script note: the room is held still for shots (`__game.step` stubbed, positions and the eased positions set every
  16 ms), and the runner's arrival scene is skipped, or its camera cut leaves the knight.
  (Claude Opus 5.5)

## 2026-11-15: blood, dismemberment and fire (Kyle: "remember the blood / dismemberment and fire")

What today's goblins carry and the new ones must too: wounds while alive on the tough ones (wounds.ts: cuts, blood
running, an eye put out, a limp), deaths by kind (foes.ts, gore.ts: beheaded with the head flung, halved, opened,
burst or shattered to stains, burned to a charred body), and flames on the burning (status.ts). In the test, a dead
goblin falls back to today's drawing.
- **With sheets** (the recommendation, unchanged): each sheet gets a dying row (struck, falling, lying, charred
  lying). The cuts are made in code from the frames, as foes.ts's `halves` does today: the head's rows lifted off a
  falling frame and flung (gore.ts's head gib becomes that picture), a frame split along the blow for a halving, a
  frame broken into chunks for a burst. Wounds and blood are drawn over the frame by code (wounds.ts at the new
  density, seeded the same), fire as glow flames over the card with the body darkening as it burns.
- **With parts** dismemberment comes free (the parts are already apart), but the living figure stays stiff.
- Next, once Kyle chooses: the dying row and the cuts for the knife goblin, then wounds and fire, before the other
  characters.
  (Claude Opus 5.5)

## 2026-11-15: pushed further (Kyle: "slow and bad, not fluid, missing a lot of animation steps"; "the danger area
doesn't come out nicely from the blade"; "the attack looks lame, not a pull back and then attack, too few frames")

- **More frames.** Each facing is now its own generated sheet (sources in docs/design/ref/chars/): the knight a walk
  of 8, the three combo blows in 7 each (raise, fully cocked, halfway, through, follow-through, recovering, guard;
  the third a wide lunging sweep, as the room judges it), then bash in, bash out, bash recovery, block, hit,
  stagger; the goblin a scuttle of 8, stab, backhand and pounce in 5, then hit, stagger, dazed and a three-frame
  death fall. `charprep.py` takes a sheet per facing with named rows, places each frame by its hips (so a walk's
  feet move under a steady body) and keeps one palette for the lot.
- **Motion from code on top** (chars3d.ts): the frame from the pose phase (each combo hit its own row, the windup's
  tenth of a second as two frames); the walk from the ground covered (no body bob: Kyle asked for none on
  2026-11-12); the card leant, squashed and shifted by the pose; a blow pushed past its frames (sinking back on the
  windup, thrown forward stretched as it snaps out); a short white then red flash when struck (a full white
  silhouette hid the body); a roll turns the card over; a dead goblin falls, lies and dissolves away in an ordered
  dither, charred if burned (cut-apart deaths keep today's drawing, gore and all, for now).
- **The danger area** at the new blade's height: a sweep laid in the world along the arc the room judges (held.ts),
  bright at the blade and fading back. extras3d.ts (no chat's) skips its dotted trail for a hero drawn new (one line).
- **Real timing on video**: `scripts/chars-play.cjs` drives the page's frames and clocks itself, a thirtieth of a
  second a frame (Playwright's clock let the game step its maximum tenth every frame, ten times fast), and plays a
  set fight: walk up, two combos, a bash, a block under attack, the kills. shots/new-vs-today.mp4 sets it beside
  today's figures.
- **Cost** (for Kyle's call): a sheet take is 433 ElevenLabs credits at 1K; this chat spent about 21,000 of the
  plan's 40,000. See the estimate in the chat of 2026-11-15; roughly 230,000 credits for every hero kit, goblin
  and townsperson with baked-in weapons, about 140,000 with weapons drawn by code.
  (Claude Opus 5.5)
