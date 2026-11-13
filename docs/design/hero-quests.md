# Hero quests: a level's quest on the board that opens the next of the world

Spec, 2026-11-13 (Kyle and Claude Opus 5.5), from the town quests chat. **Not built.** Follows on from
docs/design/town-quests.md (the errands, the trainer's word on a new skill, quest marks).

## What Kyle wants

"Tie in town quests based on level to specific quests on the board, eventually unlocking raids and
instances. You'd get a quest, then see that it's a quest on the board, and be able to do a specific
thing." And: "The biggest issue will be determining what the quests are and having our writing not be
shit. Less is more: fetch quests or kill quests or burn X number quests." Shape agreed 2026-11-13.

## The rule: the quests are the jobs we already have, with a count

A quest is one of the board's own objectives (hunt, burn, larder, rescue) with a target the game can
count: kill this butcher, burn three dens, bring out four people. **Fetch** (pick up one named thing in a
room and carry it out) is the one new kind, and waits till the rest are in.

## How it runs

1. **A level opens a quest, and your trainer gives it.** It rides on the level-up visit that's already
   there (town-quests.md section 4): the gold mark on your trainer, A NEW SKILL or A JOB FOR YOU on the
   goal line. Talking to them hands it over.
2. **Your board gets a job of your own.** Seeded from your hero and the quest, so it doesn't change with
   the day; tagged QUEST, with the gold mark on it, and a mark on the board itself out in the street
   (the halls' marks, `client/errandmarks.ts`). It's yours: on everyone else's board it isn't there.
3. **The job asks for its one thing**, said on the goal line in the game's plain voice ("Burn 3 dens at
   Sallow Carr"), with a count where there's one ("DENS 1 OF 3"). Finishing the job without it doesn't do.
4. **Done, the quest opens the next of the world** on your board (below), and says so once.

## The ladder (first draft: dull on purpose)

Levels come at about 3 jobs for level 3 and 9 for level 5 (progress.ts), up to the cap at 10.

| Level | Quest | Kind | Opens |
| --- | --- | --- | --- |
| 3 | Kill a named butcher on a short job | hunt | (the first: shows how quests work) |
| 4 | Burn 3 dens in Greyhollow | burn | Hangman's Wood |
| 5 | Bring out 4 people from Fennick Ford | rescue | the expeditions (Fenmere) |
| 7 | Kill the butcher at the bottom of a deep dive | hunt | the Deep |
| 9 | Kill THE HAULIER | hunt | the Open Cut |

**What each opens is Kyle's call**, and the levels are guesses until a few heroes have been through it.
Raids on the town aren't something you enter today (shared/raids.ts), so "unlocking raids" needs saying
what a raid is first; not in this draft.

## Writing: as little as can be

- **The goal and the board tag are the game's plain voice:** "Kill MAWL", "Burn 3 dens at Sallow
  Carr", QUEST. No writing pass needed beyond the usual for new labels.
- **Each trainer has one line, used every time:** "there's a job on the board with your name on it", in
  their own voice. Five lines, written once.
- **Each quest's posting is one or two sentences**, in the voice the board's jobs already have.
- So five quests come to about ten new lines, hand-written in one batch, through ONE lore-keeper call and
  ONE line-editor call. No generated quest text, no line from each trainer for each quest.

## Open: Kyle's calls

1. **What's locked: hidden or shown?** Skills a hero can't get aren't shown at all (2026-11-12). The same
   here would leave Hangman's Wood, the expeditions, the Deep and the Open Cut off your board till their
   quest's done. Or shown, with a line saying which quest opens them.
2. **Co-op.** Proposed: you need it open to **start** a run; anyone can **join** a friend's. Does a run
   joined count toward your own quest (friends can carry you up), or does each walk it themselves?
3. **Old heroes.** Proposed, as with the errands: everything open up to their level, no quest they've
   outgrown.
4. **The Sewers** open today when the town's works are mended (the whole world's). Keep that as it is
   (the world's gate) and put the hero's gate only on what's in the table?

## Who it touches

The board (`src/shared/jobs.ts`, `client/boardui.ts`: Art's and the UI chat's screens), the instances'
postings (Instances chat), the deep dive and the Deep (Deep chat), the trainer's visit and marks (town
quests chat). Small edits in each, asked first on the board; the quest record goes with the errands
(`shared/errands.ts`).

## Build order (once it's a yes)

1. The quest record and the trainer handing it over (no board yet: a goal line only).
2. Your own job on the board, tagged and marked; the board's mark in the street.
3. Counting inside the job (dens, people, the named kill) and the goal line's count.
4. The gates: what each quest opens, hidden or shown per call 1; old heroes per call 3.
5. The ten lines, one writing pass. Then the ladder's numbers after a playtest.
