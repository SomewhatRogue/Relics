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
