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

## 2026-11-11: bosses can't be locked down, boss-threat step 2 (Opus 5.5)
BOSS_HOLD (shared/holdtune.ts) and sim/bosshold.ts: a boss or BIG ONE freezes for at most 1 s, then not again for
10 s after; a relic's stun on one (and any ordinary stun on a BIG ONE) lasts half, then nobody's lands for 8 s.
POISE staggers, forced knockdowns (`sure`, e.g. instances' brake.ts) and the last-second dodge stagger untouched.
A hold shrugged off doesn't spend the hero's stun-cap turn. A pale turning ring at its feet while it can't be
held (client/status.ts); SHRUG as before. Instances chat: your bosses get this for free through stuns.ts.

## 2026-11-11: the Haulier threatens, boss-threat step 3 part 1 (Opus 5.5)
LEAP (furthest hero, at least 3.5 away, else passed over; lands at the end of the wind-up, sim/haulbook.ts
leapLand), CRANK (sparkSpots under each hero, plus two either side for one or two heroes; the room judges and
both views draw sim/sparkshape.ts; each spot becomes a lit slick for 4 s via OWN_KIT.slicks), and phase 2's
WRENCH after the overhead (overhead's stuck time 0.35 s; the wrench keeps its 0.45 s wind-up, not quickened).
Phase 2 chains: 0.1 s after a leap or an overhead. Art: crouch, flight with a lifted body over its shadow, slam;
chain to the gear, the wheel spun hard, spark streams; dust and spark bursts, sounds. Shots via
scripts/haulthreat-look.cjs; my first lights washed it out, halved.

## 2026-11-11: the Doorkeepers threaten, boss-threat step 3 part 2 (Opus 5.5)
VAULT (mover, furthest hero at least 3.5 off, else passed over; sim/bossleap.ts lands it, the Haulier's leap
moved there too), BASH after each sweep (sweep aside 0, bash 0.7; enraged floor the jab's 0.55), QUAKE when
ENRAGED (sim/quakeshape.ts, judged in doorpair.ts, its own attack radius 0 so only the three circles show).
Rotations: phase 1 jab, sweep, bash, jab, vault, jab, charge, jab, sweep, bash, jab, charge; phase 2 sixteen
long, seven jabs, Door Spin 5 of 9 big ones (doorrage.test's rules). Touches the Great Barn fight too. Bots:
daggers 91 s, staff 142 s (534 health lost), sword 86 s, all win. doorrage.test's aside check moved to the bash.

## 2026-11-11: harder bosses, the layers, the checkpoint's cards and votes, Cobb at the grate (Opus 5.5)
Kyle: "attack more often, faster tells". Haulier rest 0.35 (0.7), wind-ups about a seventh shorter, the chain
after a leap or overhead in both phases. Doorkeepers' rest 0.08 (0.2), wall jabs every 1.4 s (2.2), big wind-ups
shorter; enraged floors 0.75 red, 0.95 striped (0.9, 1.1); a quickened wind-up never longer than its base. The
bash's reach 3.1 so it catches a hero the sweep just threw. Layers: shared/deeplayers.ts (lore keeper: sunk
places, nobody's). Checkpoint: Panel buttons can be cards (`card`); Hero.deepVote from Intent.deep in
sim/deepmarks.ts so every screen lists who chose what; the panel closes itself once the floor changes. Each way
also gives a boon (WAYS). Cobb: an NPC (`digger`) at the grate whose talk is the grate's panel. deep-online.cjs:
two more steps (Kyle sees Sam's GO DEEPER; Sam waits, sees Kyle choosing). Words: lore keeper, line editor.
Also (Kyle, same night): no named-butcher hunt and no BIG ONE on the floor straight after a boss (shared/deep.ts,
roombudget.ts bigRooms); hunts now first on floor 9. A Doorkeeper going berserk gets DOORKEEPERS.enrage.heal
(a quarter) of its health back, with a heal number over it (sim/doorpair.ts phaseTwo).

## 2026-11-12: Cobb sits at the ladder (Opus 5.5)
Kyle: "ya draw it". Npc work `ladder` (shared/arena.ts): client/cobbdraw.ts draws his crate behind him, lifts him
onto it (COBB_SIT), the slate on his knee and a lit lamp beside him; the lamp lights the flags (scene.ts town
lights). scripts/cobb-look.cjs for a phone shot (world.dens 99 opens the grate).

## 2026-11-12: the gate, level 9 or Cobb's word (Opus 5.5)
Kyle: Deep only from level 9, with a passphrase level-9 heroes get to pass on. shared/deepgate.ts: DEEP_GATE
.level 9; a word a week from DEEP_WORDS_LIST (by the player's clock, the same for everyone that week);
mayGoDown. The grate (client/squareui.ts): under 9, Cobb turns you back with a box for the word (kept on the
profile as deepSaid while it's the week's); 9 and up, he tells you the word. A party goes with its leader, so
only the leader is asked. Words and lines: lore keeper (story bible: Cobb's word, the layers), line editor.
