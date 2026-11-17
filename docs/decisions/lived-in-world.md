# A lived-in world: decisions

The Lived-in world chat's log for docs/design/lived-in-world.md. Slices 1 and 2 (the crowded town, the crowded job
maps) are logged in docs/decisions/art.md, 2026-11-15. Slice 3 (drawn buildings in 2.5D) is the Dark and gold chat's.

## 2026-11-16: slice 4, light and air in 2.5D

- A dark vignette at the screen's edges and a soft warm haze round every lit lamp and lit window, both in the 2.5D
  view's post pass (three/air3d.ts, a few lines in three/post.ts), in stepped, dithered bands like the rest of its light.
  The flat view's light is unchanged (its stepped bands are Kyle's, 2026-10-31).
- The vignette: corners about 60% darker by night, under 40% by day; glowing things keep most of their light at the
  edges, so a lamp or a telegraph out there still shows.
- The haze comes from the lamps themselves (lamp posts, braziers, wall torches, cookfires and the Last Lantern, as lit
  at this hour: the frame's fixed lights) and from lit windows and door lamps (three/buildings3d.ts `panes`, read
  only), not from everything that glows. So a telegraph's edge never blooms past where it is, and reach reads as it did.
  A body well in front of a lamp stays clear of its haze (by depth). At most 16 at once, nearest the middle of the view
  first, one where several sit together (a row of windows). Lamps out by day: no haze.
- The mist "where jobs already have it" was already in (fog thickening away from your hero, Fenmere's banks); untouched.
- `?air=0` turns both off, to compare. scripts/air-look.cjs: Wickhold in 2.5D on a phone, air on and off, both cameras.
  (Claude Opus 5.5)

## 2026-11-16: slice 5, the wider camera to try

- CAMERA: CLOSE or WIDE, a button in the options box under BRIGHT (camwide.ts), changed live, remembered on this
  device; `?cam=wide` or `?cam=close` in the address wins. WIDE is one whole step further out in both views (the scale
  line in scene.ts and the 2.5D view's floor in three/view3d.ts both read `camScale`), so pixels stay whole and the
  two views keep showing the same floor. The step is a whole pixel, so how much wider depends on the screen: a 3x
  phone 5 to 4 (a quarter more each way), a 2x phone 3 to 2, a laptop about 7 to 6. Mouse aim follows (both views'
  `heroScreen` read the same scale).
- The faint ring at your own hero's feet: there already is one, in both views (the blue ring, actors.ts, on the
  2.5D cards too). Left as it is; if it reads too loud or too small in WIDE, it's Art's file.
- Kyle decides which camera stays; then the button goes and the step is set.
  (Claude Opus 5.5)

## 2026-11-16: not too cluttered

- Kyle on slices 4 and 5: "feels good", but make sure it isn't too noisy and cluttered now. Looked at the town by day
  and night and four job maps (forest, marsh, village, mine), flat and 2.5D, both cameras.
- The job maps' scatter (shared/scatter.ts) thinned: about a quarter fewer tries a tile, and the open middle where the
  fights are all but bare (0.06 there, was 0.2); the edges and round rocks, trees and water stay crowded. Bones much
  rarer (about two in five of before), and bones, skulls and the pale petals painted near the ground's own value
  (client/scatterpaint.ts), so nothing on the floor reads like something to pick up.
- The vignette and haze (three/air3d.ts) in finer steps with half the dither, the vignette easing in: they no longer
  lay a checker of their own over the fog's.
- The town's crowd reads fine (folk and street things at the edges, the square clear). What reads busy there in 2.5D is
  the moss speckle on the new town's cobbles and roofs, the town layout and dark and gold work: not touched.
- scripts/air-look.cjs closes each page (it ran out of room on its third).
  (Claude Opus 5.5)
