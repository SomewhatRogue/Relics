# New look: town layout, decisions

The chat re-laying out Wickhold (docs/design/town-layout.md; new-look.md "The town re-organised").

## 2026-11-15: the spec and the sketch

- Row moved from Waiting to Active on the board. Spec written (docs/design/town-layout.md) with a map sketch
  (`docs/design/ref/town-layout-sketch.png`, from `scripts/townsketch.py`). Waiting on Kyle's yes before any code.
- The shape: a walled town on a slope, three levels (the lower quarter 0, the town 1, Kirkhill 2); Lantern Square in
  the middle, lanes out of it every way; each landmark at a lane's or a stair's end, front-on, for the chase camera.
- Levels need `Ledge.lv` (stacked ledges) in shared/arena.ts: optional, old maps unchanged.
- Other chats' things move into the new town by district (layoutmove.ts) rather than being copied or edited.
- The Buildings and camera chat went Active at the same time and owns new `street*.ts` files: mine are `layout*.ts`.
  Turning the kit's fronts to a block's `face` is on their list; this map sets every block's face for them.
- For the Buildings and camera chat: slice 1 needs ledges drawn at `lv` height with steps (your ground.ts) and a
  building lifted to the level it stands on (your houses3d.ts). I'll make those few lines when I get there unless
  you'd rather; say so in your log. Art: townsfolk lifted to their level in cards3d.ts, one line, same.

Claude Opus 5.5

## 2026-11-15: built behind `?street` (Kyle: "approved, get it done!")

- Kyle's three open calls went to my picks, unanswered: Kirkhill 1.5 tiles over the square (LEDGE_H, unchanged);
  arriving on the square's south side (a new hero still comes in at the north gate, as the arrival scene has it);
  the training yard kept, and Perrin's garden moved into it.
- **Levels** (shared/arena.ts): `Ledge.lv` (stacked, default 1), `levelAt` the highest under you, `levels()` walls
  you off anything higher, drops you off an edge, ramps join the levels either side. `GameMap.settle`: anyone set down
  well inside a raised level stands on it (the new town only; job maps still push you out). Old maps unchanged (the
  full suite). tests/layout.test.ts.
- **Drawn** (three/layoutledges.ts, new): each level's top in the floor's own material at its height, coursed stone
  faces where the ground beside is lower, ramps as flights of steps. Small edits, logged here: ground.ts (stacked
  ledges; rounds, braziers and their lights lifted to their level; `Boxes.mark`/`raise` in boxes.ts),
  buildings3d.ts (a building lifted to its level), Art's cards3d.ts (townsfolk lifted), water3d.ts (the floor's
  cut for water undoes the street cobbles' texture repeat: the millpond was missing under `?street`, old town too).
- **The map**: shared/layoutplan.ts (buildings with faces, levels, steps, walls, fences on the drops, the pond, soil,
  graves), layoutmove.ts (thirteen districts of today's town and where each now stands; the Rat's turned about;
  a few things set by hand; new rounds for the guards, the carter, the washerwoman, the digger, the ducks),
  layouttown.ts (the map from today's map for the same world). town.ts: `LAYOUT.on`, `townMap`/`townSpots`
  ask it, `townProps()`, `townPoint()`; old body is `oldTown`. main.ts sets `LAYOUT.on = STREET`; game.ts uses
  `townProps()` and the pastime seat via `townPoint` out in the street.
- Tests: every spot, door and person standing still reached from where you arrive, up and down the steps, in three
  world states; every door and person of today's town kept; rounds clear of buildings. Full suite 1955 passed.
- **For others:**
  - Buildings and camera: every block has its `face`; the kit still puts fronts south. The swing's 45 degree cap
    means north-facing fronts (the Drowned Rat, the lodge, half of Rescue Row) are never seen front-on; the camera
    also looks at y 0.8 whatever level the hero stands on. Yours to decide.
  - Town quests: runnerpath.ts walks round buildings but not levels (the runner can cut across a retaining wall in
    the new town); the arrival scene still brings a new hero in at the north gate, which is fine.
  - Lived-in world: folkwork.ts's poses compare with ANVIL, WASHTUB, CHOPBLOCK at today's spots; their districts
    move by translation only, so the smith and the woodcutter keep their poses; the washerwoman's new round is longer.
  - TRAINERS' "where" lines still say the church is in the north-west (it's north, on Kirkhill): words for Kyle.
- Tools: `scripts/town-look.cjs` (walks the chase camera's views; VIEWS=1,2 LAPTOP=1), `scripts/townsketch.py`.

Claude Opus 5.5

## 2026-11-15: to do once Kyle confirms the town

Kyle: fix these once the layout is confirmed, not before.
- Trainers' directions (TRAINERS' "where" lines: the church is north on Kirkhill now, not north-west).
- Quest markers: check every marker and errand target points at the new town's spots and doors.
- First-time runners: the arrival scene and runnerpath.ts, so the runner walks the new lanes and steps (not across
  retaining walls) and brings a new hero in the right way.
Also still open: the Drowned Rat (camera turns all the way round, or the Rat moves off the square's line).

Claude Opus 5.5

## 2026-11-15: the Rat down, the square open, back in front of the board (Kyle)

- The Drowned Rat further down, front toward the camera: the map is 64 by 58; the Rat at the bottom of town past a
  yard below the Rat Steps, its front on Rat Lane along the south wall; its district moves by translation again (no
  turn). Five cottages down Wall Lane now.
- The square open, never hidden behind anything in it: the square's district moves 1.3 tiles less far south, so the
  job and works boards stand flush against the north edge; the trader's and pawnbroker's stalls side by side against
  the hall and the house at Market Lane's mouth (Dessa and Tobin in front, the market spot between); the two trees
  in the middle gone; the gallows against the tower. Spots can now be set by hand (layoutmove OVERRIDES, kind 'spot').
- Back from a job: game.ts `boardFront()`, a step in front of the job board wherever it stands (the same point as
  before in the old town). Was a fixed (24.1, 14.8), behind the board in the new town.

Claude Opus 5.5

## 2026-11-15: quieter, bigger stalls, the Rat in the corner, the statue (Kyle)

- Quieter (layoutmove QUIET): the children, Judd's hauler, the carter, pigeons and crows left out of the new town.
  Everyone you can talk to stays, and the folk at their work. The test allows these and only these to go.
- The market's stalls 3.6 by 2.6 (STALL), vendors in front; Dunn's round a tile further south to pass them.
- The Drowned Rat in the bottom-left corner (13.5, 48), out of the square's view, front on Rat Lane; the millpond
  under the Rat Steps in its place (26, 41.5), Pennock, the coop and the ducks with it; the washerwoman's round redrawn.
- The statue: its figure and name plate are cards drawn at ground height while the plinth's stone is lifted with the
  square (my lifts): the figure sat 0.75 tiles inside the plinth. statue3d.ts lifts them too (small edit).
- **For Buildings and camera:** Kyle finds the props standing as boards that turn with the camera noisy (benches and
  the like): "shouldn't pivot as the screen does, it reads really noisy." Yours (streetprops.ts).
- **For Art (or whoever owns the dais):** Kyle: "the statue looks awful now". Past the sunk figure (fixed), the dais
  and plinth are the flat view's plain boxes (olive steps, a grey block crossing them) beside the new kit art.

Claude Opus 5.5

## 2026-11-15: the Rat's end in dirt and mud, the works down by the Rat (Kyle)

- Dirt and mud: the street floor is one cobble picture, so soil never showed under `?street`. three/layoutsoil.ts
  (new) paints the plan's earth, mud and grass as pixel art (32 a tile, ragged dithered edges, flecks) and lays it
  over the floor in its shader by the floor's UVs, after the water's cut (cache key chained), so it runs up the
  raised levels too. Only the new town. The Rat's whole end is earth, with mud along Rat Lane, round the pond, by
  the works and Rescue Row's backs; never over the pond itself.
- The town works down by the Rat, off to the side: districts `works` (the stall, Judd, his sweeper, their brazier)
  and `workscart`, east of the Rat's front between the pond and Rat Lane. The south lane's old rubble now lies on
  the Lower Lane (it came along with the Rat).
- **For Buildings and camera** (Kyle, 16:22): the trees are bad; every house has the same roofs and look, some
  variation wanted; the job board wants a redesign. All yours (streetprops.ts, streetbuild.ts, the JOBS stall).
- **For Buildings and camera:** the millpond draws as a flat grey slab under `?street`, day and night, wherever it
  sits (moved it as a test: same). It was blue with its ripples at 13:00; your whole-pixel zoom (15:52) is the
  change between. Not the soil layer: off, same slab.

Claude Opus 5.5

## 2026-11-15: a cliff over a gorge, not a wall in front of the Drowned Rat (Kyle)

- No south town wall: the town stands on a bluff. A timber rail runs along the brink (three fence runs, one per
  level). three/layoutledges.ts `gorge()`: the bluff's face in narrow columns of stacked stones (strata bands, moss
  near the top, dark seams), jutting further the deeper they go, down 9 tiles to a dark river, a far bank, the cliff
  running on past the town either side. Its own mesh in the town's lit material, so night darkens it.
- Two things hid it, both small edits logged here: ground.ts's near-black `under` plane ran 60 tiles past every
  edge (the new town's now stops at its south edge); the Buildings and camera chat's land past the walls
  (streetsky.ts) is now cut open over the gorge's strip (`gorgeSpan`). Neither changes the old town.
- The pond: not the `under` plane either (it's been there since 08:36 and the pond was blue at 13:00). Still flagged.

Claude Opus 5.5

## 2026-11-16: parked by Kyle's call

- Kyle: the HD street look isn't working for him, so stop here. Parked, nothing deleted; board row moved from Active
  to Finished, marked parked.
- Everything stays behind its switch: `LAYOUT.on = STREET` (main.ts), so the new town only with `?look=3d&hd&street`.
  Closed the one leak: lifting rounds, braziers, buildings, townsfolk and the statue onto raised levels (ground.ts,
  buildings3d.ts, cards3d.ts, statue3d.ts) applied to any map with ledges, job maps in the plain 2.5D view too; now
  only a stacked map's (the new town's). What's left outside the switch changes nothing: `Ledge.lv`/`settle`
  (identical for maps without levels), `boardFront()` (the same point in the old town), the water cut's repeat
  (1 off the street), `Boxes.mark`/`raise`. Full suite 1971 passed.
- `?sharp` (the characters chat's sharper figures) has its own switch in charpaint.ts and nothing here touches it.
- Left for whoever picks it up: trainers' directions, quest markers, first-time runners (above); the grey millpond
  under the street; the notes for Buildings and camera and Art above.

Claude Opus 5.5

## 2026-11-16: the new town in the normal look (picked up from Waiting)

Kyle likes the layout, not the HD street look. Goal: the new town in the flat view and the plain 2.5D view, its levels
drawn in both, behind `?layout` first, then the default once he has walked it. Board row "Town layout, normal look".

The plan, in slices:
1. **The switch.** `LAYOUT.on` stays what the insides read as "the street look is on" (bighalls.ts, inside.ts,
   interiors.ts and tests/insides.test.ts treat it so: tall walls, bigger job houses), so I don't touch the
   interiors chat's files. The map gets its own flag, `LAYOUT.town` (town.ts: `townMap`, `townSpots`, `townProps`,
   `townPoint`); main.ts: `LAYOUT.town = STREET || ?layout`. Off the switch nothing changes.
2. **Plain 2.5D.** ground.ts already draws stacked levels, steps and the gorge for any stacked map; only the soil
   overlay is street-only (the plain view's floor is the flat painting, which paints soil itself). Check it, fix
   what looks wrong.
3. **Flat levels** (new `client/levelpaint.ts`, called from world.ts for a stacked map): each level's top is the
   floor already painted under it, lifted `lv` times LIFT (12 px, the same 0.75 tiles as 2.5D), a coursed stone face
   below its front where the ground is lower, a dark edge at its sides, ramps as flights of steps, the gorge's brink
   along the south edge.
4. **Flat lifts** (scene.ts, small edits through one helper in new `client/levels.ts`): buildings, rounds, townsfolk,
   braziers, barrels and their lights drawn at their level, as 2.5D already does. Heroes already rise with `z`.
5. Then Kyle walks it; on his yes, `?layout` becomes the default (`?layout=old` for the old town), and the to-dos
   above (trainers' directions, quest markers, first-time runners) get done.

Claude Opus 5.5

## 2026-11-16: slices 1 to 4 in, behind `?layout`

- **The switch:** `LAYOUT.town` (shared/town.ts) is the new town's map, spots, props and seats; main.ts sets it with
  `?layout` or the street look. `LAYOUT.on` stays the street look itself, which is what the insides read (their tall
  walls and bigger job houses don't come with `?layout`). tests/layout.test.ts uses `LAYOUT.town`.
- **Plain 2.5D** (`?layout&look=3d`): nothing needed. ground.ts already drew stacked levels, steps, the gorge and
  lifted rounds, braziers, buildings and townsfolk for any stacked map; the floor is the flat painting, so soil shows.
- **Flat levels** (client/levelpaint.ts, new; world.ts calls it for a stacked map in the pixel view only, since the
  2.5D floor is the same painting unlifted): each level's top is the floor painted under it moved up `lv` times
  LIFT (12 px, the same 0.75 tiles as 2.5D), a pale coursed face with a lit coping below its front where the ground is
  lower, a seam at its sides, ramps as flights of about 3 px steps cut into the upper level. Torches lifted.
  `stacked` lives here now; three/layoutledges.ts re-exports it (one source).
- **Flat lifts:** `lifter(map)` (levelpaint.ts) in scene.ts: buildings, rounds, townsfolk, braziers, barrels, the
  town's animals and the lights of rounds, buildings and Cobb's lamp at their level; `tileScreen` (bubbles, the under
  buttons, dread) the floor at its level. **Small edit in Art's lampsdraw.ts** (three lines: torches, braziers and lamp
  posts lifted with their level, off a stacked map unchanged): Kyle, flagging it as the board asks.
- Not lifted yet: blood and decals (nobody fights in town), quest marks and door marks (Town quests' files; with
  the to-dos above, once Kyle confirms the town).
- Online: the town is built on each screen, so both players need the same switch until it's the default.
- `scripts/town-look.cjs`: `LOOK=layout` (flat) or `LOOK='layout&look=3d'` (plain 2.5D); default still the street.
- Full suite 1968 passed. Next: Kyle walks it (`?layout`, and `?layout&look=3d`); on his yes it becomes the default.

Claude Opus 5.5

## 2026-11-16: the default (Kyle: "approved"), the sewer grate by the pond

- **The new town is the default**, flat and plain 2.5D: main.ts `LAYOUT.town` unless `?layout=old` (today's town).
  `?layout` alone still works (it's simply on). Everyone online gets the same town again.
- **The sewer grate and Cobb** (Kyle: "didn't we lose Cobb at the sewer grate?"): they came along with the Rat's
  district and sat on the south brink by the gorge rail (24, 56), out of sight. Their own district now
  (layoutmove `sewer`, before the Rat's): the grate, its spot and Cobb to the right of the millpond, a way off from it,
  grate at (37, 44.5), between the pond and Rescue Row. tests/layout.test.ts: all reachable.
- **For others:** scripts that walk the old town by its coordinates (firstjob.cjs, errands-look.cjs, crowd-look.cjs
  and the like) need `&layout=old` now, or the new town's points. Whisper's "where" line still says "down south by
  the sewer grate": with the trainers' directions, below.
- Now due (Kyle confirmed the town): trainers' directions, quest markers, first-time runners (the to-do above).

Claude Opus 5.5

## 2026-11-16: the to-dos done (Kyle: "fix it")

Kyle asked for these, so small edits in Town quests' files (runnerpath.ts) and in squareui.ts and overlay3d.ts.
- **Trainers' directions** follow the town (`LAYOUT.town`; `?layout=old` keeps the old words): Maeve "the hunters'
  lodge east of the square, by the archery butts", Whisper "the back of the Drowned Rat, down the steps in the lower
  quarter", Isolde "the church up on Kirkhill, north of the square"; Cole and Vell unchanged. The Old Quarter panel:
  "...coin by coin, at PUBLIC WORKS down by the millpond." Lore keeper and line editor passed them (one call each).
  `TRAINERS` entries are built by `trainer()` with a real getter (a spread would freeze the text at load).
- **Quest marks:** the targets were already the new town's own spots, doors and people; what was off was the height.
  Flat (scene.ts) and 2.5D (overlay3d.ts) now mark a door, spot or person standing still at their level.
- **First-time runner:** runnerpath.ts changes level only on the steps (`stepOk`, the sim's own rule: a level change
  only on a ramp), in both its straight-line check and its grid search. tests/runnerlevels.test.ts: from every door
  to the board, Public Works and the north gate, never off the steps, most ways going up or down a level; and the
  directions switch with the town. The arrival at the north gate stays as it was.
- docs/design/town-layout.md: the grate and Cobb by the millpond, the works off the square (the lore keeper's notes).
- Full suite 1972 passed.
## 2026-11-16 (evening): `?sharp` on for everyone (Kyle)

- Kyle: "push the fine mode, I actually do like it" (the sharper figures and the meaner knight and goblins). For the
  characters chat: one line in your charpaint.ts, `SHARP` now on unless `?sharp=0`, which shows today's figures as
  they were. Tests run without a page address, so they still see the old figures (full suite 1969 passed).
  Screenshots of the plain game (no street) clean.

Claude Opus 5.5
