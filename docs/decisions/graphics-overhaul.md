# Graphics sweep and overhaul: decisions

This chat's log for docs/design/graphics-overhaul.md. Plan first; nothing is built until Kyle says yes.

## 2026-11-17: the look read, the plan and the mocks

- Read every look spec and log (the look of 2026-10-31, art pass, dark and gold, the new look and its four chats,
  town layout, lived-in world, side view, the UI look and its mock canvas) and mapped the drawing: both views, the
  lit and glow layers, the light pass, the 2.5D post pass.
- Looked at the live build (main at 455468c) on a phone (390 by 844 at 3x) and a laptop (1280 by 800 at 2x), both
  views: the town by day and night, a village at dusk, a wood by day in fog and by night, the Open Cut, the Drowned
  Rat. This chat ran on a machine without Node, so no local build: headless Chrome against the deployed site, driven
  by a small script of its own (not in the repo).
- What the numbers say: the flat view paints a laptop at 427 by 267 and scales by 6; 2.5D at 366 by 229 and scales
  by 7 (a phone 5 and 6). The light's five bands, the fog's four, the vignette and the lamps' haze are all dithered
  at that size. That checker is the grain Kyle saw on a PC, more than the art.
- The plan (docs/design/graphics-overhaul.md): three changes first (clean light, a regrade by value and off the
  olive, one world with 2.5D as the look), then eight slices with their files, today's owners and how each is judged.
  Overlaps with Art, Lived-in world, New look: interiors, New look: characters and UI are listed there with a
  suggestion for each. No file claimed yet.
- The page for Kyle, with the screenshots and the mocks: https://claude.ai/artifact/LxogAoZ4Stfj95Mgm89tbj. The mocks
  light the game's own frames (the unlit art, the glow layer and the lights, captured from the live flat view) with
  the game's own shader, today against clean bands or smooth pools, and move stone from olive to slate on a slider.
  The art's pixels are the same on both sides.
- Waiting on Kyle: smooth pools or clean bands; how far to slate; whether the flat view is frozen as the fallback;
  whether Lived-in world and Side view move to Finished.
  (Claude Fable 5.2)
