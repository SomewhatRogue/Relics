# Territories: decisions

The chat planning and building docs/design/territories.md (Kyle, 2026-11-17). Newest at the foot.

## 2026-11-17 (Claude Fable 5.2)

- **Kyle's ask:** the quest maps bigger and tailored, each with a theme that carries through; more bigger
  hand-laid maps, each with a story; multiplayer, with gates or screens between zones, bigger territories
  and scapes between, and a more linear feel, like an instance.
- **Where the quest maps stood:** the five postings in `shared/heroquests.ts` run the ordinary board
  generator (two to five random rooms of 28 by 24). Nothing of a quest's map was its own.
- **The spec** (docs/design/territories.md), not built: a territory is one hand-laid map on the expedition
  kit (as Hangman's Wood and Fenmere) with the Open Cut's stretches, gates and checkpoints. Zones with a
  story, scapes between them, a gate or a screen at each join, one way on. Five quest territories laid out
  zone by zone, five more sketched, a build order of nine slices.
- **The thread proposed:** the Lowfurrow line (fourteen gleaners, five brought out on the first job, nine
  roped and walked on, found along the five places). Kyle's call; nothing goes in the bible until he says.
- **Claimed a board row.** No code touched. Edits I will ask for when slice 1 starts: `shared/jobs.ts`
  (`Job.land`), `sim/run.ts` and `sim/goal.ts` (stretches and checkpoints step only for `job.instance`
  today), then `heroquests.ts` and `gatedraw.ts` later.
- **Lore keeper, one call on the whole spec: NEEDS WORK, all folded in.** The rulings:
  - Odric keeps the count of the dead only: he speaks of the burned and the dead at the face, never of
    those walked over the ford. Who came home is the recap's.
  - Tollan's barn stands or it doesn't; nobody goes back out to live; Tollan never blames a hero for a
    burned barn. Tollan with a line is new cast and needs a register in voice.md.
  - MAWL and GUTCHAIN are "it" on screen (jobs.ts "Kill it"). **For the Town quests chat:** questwords.ts
    says "Kill him" of both.
  - The Shafts: the miners stay gone and unexplained; the four at the face are field hands. The raw cut
    never points at Wickhold. The hungry's own planks over the deep on the drowned level. The boarded hole
    is rough rock and miners' timber, kept unlike the Deep and the Sealed Door. The Deep's opening is told
    in town, never beside the hole.
  - Sallow Carr's sluices drain a floor for the party and never flood or strand the hungry.
  - The gleaners: all grown, gone of their own accord, each hero's own and undated like the prologue. Rye,
    wild oat and thistle, not barley over head height. The way through the valley stays unnamed.
  - The dog: a scruffy collie sort, no name, an ordinary dog, goes only where a farm dog would. The lame man
    went lame on the road, never cut.
  - The ford: no board or written count on the near bank; the chalker only chalks over heads. The wall far
    off with nobody at it. A pack's worth of bundles and boots at the tenter field, cloth and leather only.
  - "The fold yard", not "the threshing yard"; "the end chamber", not "the sump chamber".
  - Sketches: Barrowby's bell as the bible has the hungry leave; Brokenbridge's ferry for heroes only;
    Hesketh as written; the Charcoal Camps are the hungry's burning, built last, after Kyle answers "does
    anyone ever burn Hew?".
  - Names held for the nine if ever needed: Dickon, Emmot, Sib.
- **For the bible, noted by the lore keeper:** "the Deep opens at level 9" is stale (q7 opens it at 7). The
  arcs doc's draft posting "Lowfurrow, nine in the pens" should change its number or become this thread.
- **Waiting on Kyle:** the eight calls at the foot of the spec.
