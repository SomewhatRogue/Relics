# Town quests: a new hero's first errands, quest marks on people, skills by level

Spec, 2026-11-12 (Kyle and Claude Opus 5.5). Not built. Lines marked *(lore)* need the lore keeper and line
editor before they go on screen.

## What Kyle wants

"When you first get to town as a new player, even if you skip the tutorial, have a mission to a) refill your
relic and b) talk to your trainer. You can have a guard come up to you or an orphan or something run up and
say hey, this person wants to see you, and it's marked as a quest marker on the map. Also people shouldn't all
have the icon over them unless they're quests. Also you shouldn't be able to see skills you can't yet get at
your level, and you get a new quest to check in with your guild when you can buy a new one."

## 1. The first errands

- **When:** a hero's first arrival in Wickhold, whether they came through the wood or skipped it (the
  `prologue` flag goes true either way; a new `errands` record on the hero says what's done).
- **Who brings it:** a runner *(lore: who; Kyle suggested a guard or an orphan; the lore keeper picks, the
  town's own people first)* comes up to the hero a few seconds after they arrive, says their line, and runs
  off. It doesn't stop the world (a strip, as the wood's talk now is).
- **The two errands, in either order, both on the goal line and both marked:**
  1. **Refill your relic** at the church: Isolde recharges the javelin, the first one free. *(Open: the
     javelin reaches town full today (the lore keeper, 2026-11-05). For this errand to mean anything it
     must arrive spent, say one throw left from the Stoker fight. Kyle's call.)*
  2. **See your trainer** (the class's trainer in the yard or guild): they teach the starting skill, which
     today is bought or picked there.
- **Done:** each errand ticks off when done; both done, the runner's line is over and the goal line goes
  back to the jobs board.
- A skipped wood gives the same errands; a hero who already did them (an old save) never gets them.

## 2. Quest marks over people, only when they have something for you

- Today some sign floats over every townsperson you can talk to *(find which: a talk mark or a name tag over
  NPCs in town)*. From now on, only someone with an errand or quest for this hero gets a mark: the gold
  diamond of `client/questmarks.ts`, the same mark the jobs use, and the edge arrow when they're off screen.
- Everyone else can still be talked to (the TALK button and the prompt show as you come near).

## 3. Skills by level, and the guild's word when one's ready

- The trainer's list shows only skills the hero can get at their level now (plus those already learned). The
  rest aren't shown at all, not greyed (Kyle: "you shouldn't be able to see skills you can't yet get").
- When a hero reaches a level that opens a new skill, a quest appears: **check in with your trainer**
  (marked as above). Done by talking to them.

## Build order (slices)

1. The hero's `errands` record (save-safe for old heroes) and the goal line in town.
2. The quest-mark rule for townsfolk (marks only on those with something for you), with the edge arrow.
3. The runner: their walk up, their line, then off.
4. The two first errands wired to the church's recharge and the trainer.
5. The trainer's list by level; the level-up quest.

## Files likely touched

Town spots and NPC drawing (`client/town*.ts`, `scene.ts` marks), the trainer and church panels, the goal line,
`shared/progress.ts` (the hero record), `client/save.ts` (fill in for old saves). Not the Deep's, Instances',
Trading's or Art's files: check the board.

## Open

1. The javelin arriving spent (above), or the errand being "have Isolde look at it" with no recharge needed.
2. The runner: a guard, an orphan, a churchboy *(lore keeper)*.
