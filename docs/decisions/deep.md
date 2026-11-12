# Decisions: the Deep chat (the Deep, boss loot rolls)

From 2026-11-11. Earlier entries, including the Deep's first steps and the loot roll, are at the end of
docs/DECISIONS.md (the archive). New entries go here, newest at the bottom, signed with the model name.


## 2026-11-11: the Deep, step 5: the boards (Kyle: "Go"; Claude Opus 5.5)

- Two boards (`shared/deepboard.ts`): DEEPEST, ALONE and DEEPEST, WITH A PARTY. The deepest floor reached (whatever the end: dying below still counts), the gold taken home as the tiebreak, each hero once at their best, the top ten. Shown at the sewer grate beside the way down and on BEST IN WICKHOLD (`client/deepbest.ts`); its intro names Cobb's ladder now. Words: lore keeper and line editor.
- Checked on the server as far as a whole fight can be: going down sends the run's seed and the world stamps it with its own clock (`deepStart`); a claim counts only for that seed, with at least 30 s of the world's time a floor, and at most 400 gold a floor (DEEP_BOARD). It keeps out a typed-in score and a fast fake; it can't tell a patient forger (a replay of a whole fight isn't possible as the butts' arrows are).
- A run counts as a party's if anyone was with you at any point (`DeepRun.party`).
- Seen: `scripts/town-online.cjs` fails its statue steps with or without this change (the plinth buy); not looked into here.


## 2026-11-11: the Deep, step 6: curses at the forks, blessings on the ledge (Kyle: "Continue"; Claude Opus 5.5)

- Every fifth floor's end the way on forks three ways, each with a curse; going deeper there is taking one (plain GO DEEPER won't). Every tenth, first a blessing, one of three things on the ledge. Both stack and end with the run (`DeepRun.marks`). The three offered come from the run's seed and the floor (`shared/deepmarks.ts`), the same after a reload.
- Curses: THE RUSTED WAY (6% less damage), THE WET WAY (6% slower), THE COLD WAY (10 less health), THE LOW WAY (stamina 12% slower), THE DARK WAY (relics recharge 12% slower), THE LOUD WAY (goblins notice you from further off, 15%). Blessings: A WHETSTONE (+8% damage), A PADDED COAT (+15 health), A WATERSKIN (stamina 15% faster), AN OILED RAG (recharge 15% faster), SOMEONE'S PACK (your relic gets a use back each floor). Words: lore keeper (no flask, no candles, no giver) and line editor.
- Each player takes their own. Their marks ride on their input (`Intent.marks`); the room puts them on the hero (`sim/deepmarks.ts`), into its numbers (`sim/gearstats.ts`) and how far goblins notice it (`sim/enemies.ts`); they carry to the next floor's heroes at once. `deep-online` checks a follower's curse lands on their hero in the leader's room: 16 of 16.
- Flag (lore keeper): STAMINA lines read oddly for a Mage, whose bar says MAGIC. Left as the stat's own name for now.

## 2026-11-11: the bar's own word on curses and blessings (Opus 5.5)
Kyle: each bar keeps its own name, FAITH for a Cleric. The checkpoint's curse and blessing lines now go through
`barWords` with the hero's class (client/deepui.ts), like cards and the trainer: "Faith comes back 12% slower" for a
Cleric, "Magic comes back..." for a Mage, "Stamina..." for the rest. No new words, so no lore pass.

## 2026-11-11: the Deep's edge, hard by how it hits (Opus 5.5)
Kyle: too easy to dodge everything, and slow boss fights felt like self punishment. Each band now has an `edge`
(shared/deepbands.ts, sim/deepedge.ts): health 0.9 to 1, damage 1.25 / 1.4 / 1.55 / 1.7, wind-ups 0.9 to 0.7
(never under 0.4 s red, 0.8 s striped) and rests between blows 0.85 to 0.6. A boss keeps its own wind-ups and its
health (Kyle, a minute later: big numbers, bigger health; a first cut of boss health was taken back). Past fifteen, each floor +3% health and +5% damage (was +8% / +4%).
Rough feel: a floor-16 butcher's slam about 84 of 100. Global dodge (i-frames, roll) untouched: not this chat's.

## 2026-11-11: big numbers, boss-threat step 1 (Opus 5.5)
Kyle approved docs/design/boss-threat.md. Step 1 is a display scale: `shared/shown.ts` (SHOWN 10). Every hit,
heal and health or damage figure on screen goes through `shown`: the popups (fx, fxvenom, fxmagic, strawman),
card rows and the health modifier, the forge, drills, the frail cost, potions, perk/ladder/sign/loot lines with
numbers, the Deep's two health marks, the recap's damage and heal counts. The fight is unchanged. Other chats:
any new player-facing health or damage number goes through `shown`.
