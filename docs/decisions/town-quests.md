# Decisions: the town quests chat

From 2026-11-12. Spec: docs/design/town-quests.md. Newest at the bottom. Sign each entry with the model name.

## 2026-11-12 (Claude Opus 5.5)

- Board row claimed. Kyle's answers to the spec's two open questions didn't come through (the brief said
  "[paste them]"); asked him. Slices 1 to 3 don't depend on them.
- Reading of "see your trainer": the errand is done by talking to your class's trainer. The first skill
  stays a level 3 lesson (2026-11-02); at level 1 the trainer's list shows no skills yet, and the
  level-up quest (slice 5) brings the hero back at level 3. (Claude Opus 5.5)
- Kyle's answers (2026-11-12): the javelin **reaches town spent**, so the church errand is a real refill
  (the first one free). The runner **depends on your class**: a priest for a Healer, a guard for a
  Warrior, an urchin for a Rogue, and for a Ranger a dog that runs up and leaves a note. The Mage's not
  named: the lore keeper picks. (Claude Opus 5.5)
- Lines: one lore-keeper pass, then one line-editor pass. The lore keeper picked the runners from the
  town's own people: WAT (a recruit, Cole's) for a Warrior, VERGER OSWIN for a Healer (not a priest:
  Odric is the only one, so Oswin is the church's own instead), TAM (a boy from the families, sent by
  Whisper) for a Rogue, APPRENTICE LIS for a Mage, and for a Ranger Maeve's own hound (never the
  Ranger's dog) with a note signed "M.". The tracker says RECHARGE, as the church's button does. All in
  `src/client/errandwords.ts`. (Claude Opus 5.5)
- **Slice 1 in:** `shared/errands.ts` (the hero's `errands` record: told, relic, trainer, and the level
  the trainer last saw you at). New heroes get one; a saved hero without one has done them all
  (`fitErrands` in save.ts), so old heroes never get the first two. The town's goal line shows the two
  as rows (each DONE as it's done) once the runner has told you, in the street and inside the halls;
  the folded line is the next one to do. Both done: the line is the town's own again (WICKHOLD, DAY n).
  `tests/errands.test.ts`. (Claude Opus 5.5)
- **Slice 2 in:** the small gold mark over everyone you could talk to is gone (Art's `npcs.ts`, those
  lines only, and the `?figs=3d` tags in `three/tags3d.ts`); names still show when you're close, and
  TALK works as before. In town the gold diamond of `questmarks.ts` goes over whoever has an open
  errand (`client/errandmarks.ts`): inside their hall, the person (`folk`); out in the street, their
  hall's door (`hall`, set lower than a job's house door so it sits over the doorway). The edge point
  toward the nearest when none is on screen comes with it, in both views. (Claude Opus 5.5)
- For the Deep chat, not mine to fix: from d1697a6 (the Haulier's tracks in the 3D view) five suites
  fail in Node with "document is not defined" from `client/sprites.ts` (raise, rats, recapboard, runux,
  wading). Checked: they pass at a2c4ad1 and fail at d1697a6, with or without this chat's work. (Claude Opus 5.5)
- **Slice 3 in:** `client/runner.ts`. Three seconds into a new hero's first time in the street (not
  while a panel or the road's greeting is up) their runner comes, says the line on the wood's strip
  (a tap ends it; nothing stops), and goes. Saying it is what gives the hero the two errands (`told`),
  so walking into a hall first just means they come next time. Someone who already stands in the
  street (Wat at his whetstone, Tam in the square) is gone from their spot while they run, and comes
  from it if it's near (about 11 tiles); otherwise from a clear spot about 9 tiles off. A Ranger's is
  Maeve's brindled hound, drawn in both views (one line each in `scene.ts` and Art's `three/cards3d.ts`),
  sitting while the note is read. The goal line's rows wait till the strip is done. Puppetry on this
  player's screen only. Tests in `tests/errands.test.ts`. (Claude Opus 5.5)
- **Slice 4 in:** a new hero's javelin reaches town with one throw left (`giveWood` in game.ts, only
  for a hero whose runner hasn't come yet, so replays and old heroes are untouched). At the church's
  step the first recharge is free while the errand's open (RECHARGE: FREE, then Isolde's line) and
  that ticks it; with nothing to fill (given up, or full) opening the step ticks it too, so it can't
  stick. Your own trainer ticks theirs on talking (a Healer's cold censer included) and says their
  first-visit line that once. Two tests that expected a full javelin on arrival now expect the spent
  one (`tests/wood.test.ts`, `tests/relicchurch.test.ts`). (Claude Opus 5.5)
- **Slice 5 in:** the trainer's SKILLS track (and the knack tree's, away from the trainer) shows only the
  skills a hero could learn at their level now, and those they know; the rest aren't shown at all. The
  track's line still says when the next opens (NEXT AT LEVEL n), and CARRY ONE only shows over two or
  more. Filtered in `client/upgrades.ts` (the screen), not `shared/trainrows.ts` (the rows stay whole
  for the rules). The level-up quest was in from slice 1: a level that opens a class skill you don't
  know puts A NEW SKILL on the goal line and the mark on your trainer (or their hall's door) till you
  talk to them. Moves and stats rows are as they were (the spec says skills). (Claude Opus 5.5)

## 2026-11-13 (Claude Opus 5.5)

- Kyle's playtest: no mark for the javelin's errand; and he wants the arrival as a scene.
- **The missing mark:** the church is in the far top-left, and the flat view only pointed at the edge
  when no mark at all was on screen (the barracks door was), so nothing pointed to it; and a mark under
  the top HUD counted as seen. Now in town (`scene.markEach`) every errand out of sight gets its own
  gold point at the edge, and under the top HUD counts as out of sight (`questmarks.ts`). The 2.5D
  view already pointed to each; its points are now held below the top HUD on a phone (`overlay3d.ts`).
- **The arrival scene** (`client/runner.ts`, the way round buildings in `runnerpath.ts`): the first
  time a new hero stands in the street (after the road panel, for a wood finisher), the cutscene look
  comes on (letterbox, no HUD: the wood's `body.cutscene`). The frame holds 0.9 s on them in the north
  gateway, then they walk in a couple of tiles at a walk (their own steps, through `game.walkOverride`;
  no rolls). Then a hard cut (`focus.snap`, both views) to their trainer's hall: the runner comes out
  of its door, and the camera follows them running round the buildings to the hero, then frames the two
  for the line. The line said, it's the player's again and the runner goes back in the way they came.
  "Freeze frame" read as that held moment in the gateway, with the bars in; say if you meant a true
  still. A hero not at the gate (back in later, the runner never seen) skips the walk in. On a screen
  that doesn't run the room (a joiner) the hero isn't moved into the gateway. (Claude Opus 5.5)
- Kyle: the scene freezes nothing for anyone else in town; they just see the runner, and can't talk
  to them. The scene was already this screen's alone (camera, bars, the stick); now the others in the
  street **see the runner**. It goes out in the presence word (`townfolk.ts` `Me.r`, from
  `runner.word`): the class, where they stop, the phase (in, saying it, home) and how long into it.
  It's in the gist without its age, so it goes once at the start and once at each change of phase,
  nothing in between (the test counts one word for the whole run in), and a newcomer's hello carries
  it mid-run. Each other screen plays it along the same way (`runnerpath.ts` `runnerWay`, the same
  path for the same map; `client/runnerecho.ts`): out of the hall, round to the hero, standing through
  the line, home, as a mute figure (no TALK) or Maeve's hound, both views. Someone standing in the
  street (Wat, Tam) is away from their spot on their screens too. A word that doesn't parse is dropped
  whole. Tested on a fake relay (`tests/runnerecho.test.ts`); no live two-browser run. (Claude Opus 5.5)
- Kyle: tie level-based town quests to quests on the board that open the world (expeditions, the
  Deep, instances); keep the quests simple (kill, burn X, fetch) and the writing small. Spec written:
  `docs/design/hero-quests.md` (quests are the board's own objectives with a count; your trainer hands
  each over on the level-up visit; your board gets a job of your own, tagged and marked; one line per
  trainer used every time and a sentence or two per posting, about ten lines in all; a first ladder at
  levels 3, 4, 5, 7, 9). Not built; four calls open for Kyle. (Claude Opus 5.5)
- Hero quests, Kyle's calls: locked content is off your board; a joined run counts toward your own
  quest; old heroes get everything up to their level. He asked whether the Sewers are the Deep: no, the
  Sewers are the town's work (the grate opens for everyone), the Deep is entered from them; default
  written in that the Deep needs both the town's Sewers and your level 7 quest. In the spec. (Claude Opus 5.5)
