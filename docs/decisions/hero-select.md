# Decisions: the hero select chat (choosing a new hero round the fire: docs/design/hero-select.md)

From 2026-11-15. Newest at the bottom. Sign each entry with the model name.

## 2026-11-15 (Claude Opus 5.5)

- Took the Hero select row on the board, out of Waiting. Owns `src/client/heroring.ts`, `ringdraw.ts`,
  `ringcard.ts`, `ring.css`, `scripts/ring-look.cjs`, and `title.ts` and `preview.ts`, which were nobody's.
  (Claude Opus 5.5)
- Built the ring (flat view). `heroring.ts`: the five in their first look on the far side of the fire, open
  to the road and to you, each a real Hero drawn by `drawHero` and lit by the game's lighting pass (the
  fire the only light, moonlit ambient), at the game's scale a step closer. Idles come from idles.ts on
  their own once a hero stands (`noHound` on the Ranger: no hound by the fire yet). A clear `data-cls`
  button rides over each hero, so taps, keys and the old scripts (`smoke.cjs`, `buildings.cjs`) still
  reach them. Picked: the camera eases toward them, they step a pace (10 px) toward the fire, the rest
  dim under a dark wash. CHOOSE: they turn and walk onto the road, the fire flares, black over 1.1 s,
  the game starts under it and the black lifts. `ringdraw.ts`: the clearing, pines, two logs, the road
  head, the fire painted once and blitted with the camera. (Claude Opus 5.5)
- The card (`ringcard.ts`, `ring.css`): name and tag line, the three looks (the hero by the fire changes
  on the spot, the chosen one framed gold), STATS, the name box and CHOOSE (`data-begin`, so scripts still
  work), then WATCH IT FIGHT (opens preview.ts's fight and the rest of the old class sheet, scrolled to)
  and TRY THE class. A class you have already says YOURS in place of the name box. Rises from the foot on
  a phone, stands at the right on a wide screen. Tap another hero to switch, the dark to go back.
  (Claude Opus 5.5)
- title.ts: the class grid and class page are gone; the ring and card replace them; the name check,
  claim, SKIP THE WOOD, TRY, the home screen and RETIRE are as they were. No new player lines beyond the
  spec's CHOOSE and WATCH IT FIGHT (and YOURS, already approved), so no lore or line pass.
  (Claude Opus 5.5)
- Not yet: the ring in 2.5D for players on that view (the spec asks for it; the flat ring shows for
  everyone today). Next step if Kyle wants it. Shots: `scripts/ring-look.cjs`. (Claude Opus 5.5)
