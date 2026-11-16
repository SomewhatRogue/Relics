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
