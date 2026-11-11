# Decisions: the Deep chat (the Deep, boss loot rolls)

From 2026-11-11. Earlier entries, including the Deep's first steps and the loot roll, are at the end of
docs/DECISIONS.md (the archive). New entries go here, newest at the bottom, signed with the model name.


## 2026-11-11: the Deep, step 5: the boards (Kyle: "Go"; Claude Opus 5.5)

- Two boards (`shared/deepboard.ts`): DEEPEST, ALONE and DEEPEST, WITH A PARTY. The deepest floor reached (whatever the end: dying below still counts), the gold taken home as the tiebreak, each hero once at their best, the top ten. Shown at the sewer grate beside the way down and on BEST IN WICKHOLD (`client/deepbest.ts`); its intro names Cobb's ladder now. Words: lore keeper and line editor.
- Checked on the server as far as a whole fight can be: going down sends the run's seed and the world stamps it with its own clock (`deepStart`); a claim counts only for that seed, with at least 30 s of the world's time a floor, and at most 400 gold a floor (DEEP_BOARD). It keeps out a typed-in score and a fast fake; it can't tell a patient forger (a replay of a whole fight isn't possible as the butts' arrows are).
- A run counts as a party's if anyone was with you at any point (`DeepRun.party`).
- Seen: `scripts/town-online.cjs` fails its statue steps with or without this change (the plinth buy); not looked into here.

