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
