# Choosing a new hero round the fire

Kyle, 2026-11-15, after Riteborn's character select: "you select it from all the characters standing in a
circle, then push yours and the screen fades to black, then starts." Today (title.ts) a new hero is chosen from
a grid of five portraits; tapping one shows it fighting (preview.ts) with its ratings, then a name and BEGIN.

## The scene

- Night at the edge of the wood above Wickhold, a campfire in the middle, the five classes standing round it
  in a ring, each in its first look, idling as heroes idle (herolife.ts, the idles they already have: the
  thumb on the edge, the yawn, the stick). Drawn with the game's own renderer and lighting, the fire the only
  light, so it looks like the game from the first second. In 2.5D when that's the player's view.
- Tap a hero: the camera eases toward them, they step a pace toward the fire, the others dim. A small card
  rises: the class's name and tag line, its ratings (STATS), its three looks to flip through (the hero changes
  on the spot), WATCH IT FIGHT (today's preview), and the name box.
- Tap another, or the dark, to go back to the ring.
- CHOOSE (the name passed, as now): the hero turns to the road down to Wickhold, the fire flares, the screen
  fades to black over about a second, and the game starts in black with the arrival as it does now.
- Your existing heroes and RETIRE stay where they are on the start screen; the ring is only for a new hero.

## How

- A small scene module of its own (`heroring.ts`): a fixed map (a clearing, the fire, a few trees, the
  road's head), the five heroes placed round it, drawn through the same scene and three views as a job, no
  room running (nothing fights; the idles and the fire are drawn from the clock).
- title.ts swaps its class grid for the ring and keeps everything after the name check.
- Phone first: the ring fits a 390 by 844 screen in portrait with the card below it; a laptop shows it wider.
- Words: CHOOSE and any new line go through the lore keeper and the line editor once.

## Not changing

What a hero is, its stats, its looks, naming rules, the three hero slots, the arrival.

## Who

A fresh chat (UI or art). title.ts and preview.ts aren't on anyone's row now; check the board first.
