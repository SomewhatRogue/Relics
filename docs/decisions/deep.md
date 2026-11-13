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

## 2026-11-12: carts grabbed, aimed and thrown; no stun-locking the Haulier (Opus 5.5)
Kyle's playtest: loved it; "nothing to grab" showed when grabbing a cart (the press wasn't marked as used:
haulcarts now clears grabQueuedAt); stun-locking too easy (cart knockdowns now on e.holdUntil, cart.again 10 s);
wanted grab, aim, throw. sim/haulcarts.ts rewritten: heldBy, wx/wy, free rolls, goblins hit; sim/cartpath.ts the
one path; client/cartaim.ts the arrow; "AIM, THEN GRAB TO THROW" on taking hold (short cue, approved words).
Shove aims at its hero from any cart at rest. haulier.test's cart tests rewritten. 3D view: no aim arrow yet.

## 2026-11-12: the Haulier's gear stays a quiet bonus (Opus 5.5)
Kyle: lightning at the gear only helps storm heroes; carts are his gimmick. Decision: leave the gear rule as is
(a reward for storm users who notice), no cue teaching it. Kept in mind for later: a cart thrown into the gear's
frame drops its bucket on the Haulier below, if the fight grows samey.

## 2026-11-12: quick fixes, phone and 3D (Opus 5.5)
The boss plate over arenas: already handled (bossplate.ts setTopPush lets the camera bring the room's top down
by the plate); the Haulier's gear was simply off screen, its arena taller than a phone. The roll card on a phone
folds to the piece and the buttons (tap the piece for what it does; loot.css, rollcard.ts), below the tracker.
3D: a held cart's aim as a flat gold strip (three/actors3d.ts, sim/cartpath.ts). loot-online.cjs 12 of 12.

## 2026-11-12: the layer bosses, a draft (Opus 5.5)
docs/design/deep-layer-bosses.md (also the project's claude/deep-layer-bosses.md): THE LISTENER, THE LEECHMAN,
THE HEDGER, THE HOUSEBREAKER, one per layer on its fifth floor, each a trick any class can use. Lore keeper
cast them; story bible updated. Waiting on Kyle.

## 2026-11-12: THE LISTENER, floor 10 (Opus 5.5; three Sonnet builder slices)
Built per docs/design/deep-layer-bosses.md: hunting by sound (listennoise.ts: attacks, rolls, running, relics;
creeping is quiet; a Warrior's taunt the loudest), DROP into the cave's holes and RISE under the loudest (can't be
hit while under), ROCK, SWEEP after a rise, CHARGE; dripstone columns anyone can knock onto it (a knockdown with
the cart's 10 s cooldown); BLINDED does nothing (ALREADY BLIND); phase 2 the torches go out and adds climb out of
the holes. Art reviewed from scripts/listen-look.cjs shots: columns faded when someone stands behind (they hid the
hero). Words: lore keeper, line editor. deepdoor.test: floor 10 is the Listener now. 3D view: tsc only.

## 2026-11-12: THE LEECHMAN, floor 15 (Opus 5.5; three Sonnet builder slices)
In THE REED BEDS: wades fast in shallows, slow on dry ground, never in deep water; THE LINE hauls a hero in (block
or roll), the punish after; LEECHES drain till you roll; PEAT BANK's striped lane leaves mud (map.mud; wadeAt honours
it). The windlass: GRAB and turn 4 s, the shallows drain to mud 12 s (map.drained), it crawls and can't use THE
LINE; stuck 20 s after. Phase 2: channels widen (Water.onlyLog; the path grid rebuilds), it lays logs; a blow knocks
a log in, and it with it (a knockdown, holdUntil). Loot: THE BOG-OAK HOOK, FEN-BLACK JERKIN, A STITCHED RING (wax
and tar, never magic). Art reviewed from scripts/leech-look.cjs. 3D: no drained mud or widened channels yet.
haulier.test and deepdoor.test: floor 15 is the Leechman now.

## 2026-11-12: guests on the Deep's boss floors; map changes now reach guests (Opus 5.5)
Kyle: the instances had a guest showing off the map on their own screen; check the Deep. scripts/deepboss-online.cjs
(two browsers, a party down to floors 10 and 15): Sam's map is Kyle's size and Sam's hero is on it, where Kyle's
room has him. Not an issue here. Found instead: a guest that already had the room took only `blaze` from each whole
send, so map changes after the start never reached it (THE LEECHMAN's drained shallows and widened channels, the
peat's mud). client/coop.ts apply: a whole send for the same room now takes the leader's map, keeping the guest's
own blocks (they come piece by piece). Instances chat: a guest that builds its map from the job's seed (the `ms`
big-room path, shared/expedmap.ts) still takes only `blaze`; if your guest's map is built differently from the
leader's there, that would put them off it. deep-online 18 of 18, deepboss-online all, full suite green.

## 2026-11-12: the Haulier's carts on tracks (Opus 5.5; one Sonnet builder)
Kyle: THE LISTENER is one of the coolest bosses; the Haulier's carts seemed to vanish and grab-and-throw didn't
work. Reworked per docs/design/deep-bosses.md "Carts on tracks": tracks with tunnel mouths, warned track carts
(lamps, then a striped lane: sim/trackshape.ts), the pick leaning to the Haulier's track, HURL from sidings; hero
cart grab removed (client/cartaim.ts deleted; cluster.ts GRAB cue incline-only). bodies.ts: running and held carts
skip body separation (they were clamped at the edge). I added each running cart's own light (scene.ts) and a
spark trail (sumpdraw.ts) after the first shots showed carts hard to see. Open Cut's LOADING STAGE: single rail
kept, no track carts (instances chat's room).

## 2026-11-12: the Haulier's tracks in 3D (Opus 5.5)
Kyle: "can we draw the 3d" (2.5D is players' default view). The tracks are painted into paintMap's still floor
when it's for the 3D ground (client/world.ts, sumpdraw.ts paintTracks); the tunnel mouths are timber-framed dark
openings at each track's ends (three/tracks3d.ts, added in three/ground.ts). The warning lane already drew in 3D.
Not done in 3D: each running cart's own light and spark trail (flat view only).

## 2026-11-13: each Deep floor its own size and layout (Opus 5.5)
Kyle: "in between screens in a biome are on theme but not different enough screen to screen; can be much bigger or
different sizes." Every non-boss floor was a 28 by 24 heart room laid out from the place's seed, which a layer shares.
Now shared/deepshapes.ts picks a shape per floor (tight, hall, long, wide, great; never twice running, big ones likelier
deeper) as Job `hall`, which routeports.ts heartAfter builds to; Place `vary` (the floor) goes into sites.ts placeSeed so
each floor is laid out afresh. Goblins scale with area: roombudget.ts, terrain.ts's count, and one fight more in a great
hall (encounter.ts). Small edits in jobs.ts, sites.ts, routeports.ts, terrain.ts, encounter.ts. tests/deepshapes.test.ts;
scripts/deepshape-look.cjs (flat or 3d). Open: a great hall on a fen floor can be sparse in cover.
Also, for the art chat's note: the five Node test files that failed since d1697a6 pass again. paintTracks and mouthsOf
moved to client/trackbed.ts (no sprites), so world.ts no longer loads sumpdraw's sprites.
