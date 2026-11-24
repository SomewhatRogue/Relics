# Decisions: the general chat (playtest fixes, tuning, specs)

From 2026-11-11. Earlier decisions are in docs/DECISIONS.md (the archive). Newest at the bottom. Sign each
entry with the model name.

## 2026-11-11 (Claude Opus 5.5)

- Per-chat logs and docs/BOARD.md set up (Kyle: "a pub sub, like a bus"). This chat writes here only.
- Relics come only from great bosses' first kills, each hero once; every hero starts with the javelin;
  five uses each (docs/design/holy-and-hungry.md section 4).
- Trading spec with an item ledger against duplicates; hungry gear and relics can't be traded
  (docs/design/trading.md). Instance spec with Rakehead's bosses and pools (docs/design/instances.md).
- UI look picked: iron and ember, everywhere (Kyle: parchment "not on theme at all"). Style guide in
  docs/design/ui-look.md; waiting on the board for a UI chat. Art pass waits on the size pick. (Claude Opus 5.5)
- Body size picked: **1.5x** (Kyle: "PERFECT"). Props people stand by scale with them; the map, footprints and telegraphs don't. (Claude Opus 5.5)
- Art pass spec: bodies redrawn at 1.5x with whole pixels, props grow, buildings taller on the same footprint, telegraphs unchanged; bosses get shapes and moves (docs/design/art-pass.md). (Claude Opus 5.5)
- Camera stays as it is: 1.5x bodies at today's zoom (12 tiles across on a phone), no tilt (Kyle). (Claude Opus 5.5)
- The wood's block lesson: 3 blocks, not 5 (Healer 3, not 4) (Kyle: "just blocking 3 is absolutely fine"). A fresh hero gets no relics until the Stoker falls, checked in a fresh browser; Kyle's flood not reproduced yet. (Claude Opus 5.5)
- The wood's talk (Hew waking you, Orla on the road) and the first-blow calls are strips that stop nothing; a tap skips one; on a phone under the top bar. Only a lesson's own card, and the relic card, stop the world (Kyle: lines that stop you get in the way). (Claude Opus 5.5)
- Relic moments are cleared when you switch heroes: a brand-new Warrior was shown a LODESTONE in the wood, queued by the hero the game loaded behind the title. Root of the queueing itself not found (not reproduced in a clean browser). (Claude Opus 5.5)
- The wood teaches the Bitter: your first hit (Hew alive) stops the world on his card with one Bitter and the POTION button; drink it and he hands two more in passing. Only the Bitter drops or sells now: the Brandy is dormant, a saved one turns to Bitter, Gannet sells nothing (Kyle). Lines through the lore keeper and line editor; the bible notes Wickhold pays Hew in Bitter. (Claude Opus 5.5)
- Walking: Rangers just under Rogues (longbow 0.98, shortbow 1.04, crossbow 0.96); Mages slower (wand 0.79, staff 0.78, spellblade 0.8; 0.78 is as slow as a kit goes, the kegs are timed to it). The shortbow's dodge is SPRINT: each press runs you 1.55x for 1.6 s for 24 stamina, steered, no dodging through blows. Your own hound never puts up a PET prompt (it covered the view); USE still pets. From Kyle's friend's playtest. (Claude Opus 5.5)
- TRY THE <class> on a class's page (client/trial.ts): a scratch hero of that class in the Training Yard, never saved (store skips a trial save), with its starting skill, a javelin that never runs dry and three Bitters; a bar spawns goblins (3 at most) and a butcher (1 at most), CLEAR, DONE back to the class page. From Kyle's friend; Kyle set the caps. (Claude Opus 5.5)
- The trial starts in an empty yard with no relics, and empties the relic news on the way in. Any relic is announced at most once a session (game.ts unannounced), whatever keeps finding it new: Kyle's account still floods with them, root not found. (Claude Opus 5.5)
- The freed run for the way out on their own (2.8 a second, a goblin 3.1), round what's in the way: out in the open to where the party came in, and they count there; in a house to its door, to come out with the party. Goblins go for one nearer them than any hero (by 2 tiles), and their blows land on the freed; one within 1.6 tiles and the freed freeze, cowering, so a goblin on them gets them unless a hero steps in (Kyle: escorting was tedious). (Claude Opus 5.5)
- Nettle says nothing after each sale (the line got in the way of selling a pack's worth); the sale just goes through and his table refreshes. (Claude Opus 5.5)
- Town quests spec (docs/design/town-quests.md): first errands for a new hero (refill the relic, see your trainer) brought by a runner, quest marks only on people with something for you, the trainer's list by level and a quest when a new skill opens. Waiting on the board for its own chat. (Claude Opus 5.5)
- In the wood, any tap on the scene (or Enter) skips a line of the strip, not only a tap on the strip (Kyle: Orla's lines after the Stoker went too slowly). Town quests: the javelin reaches Wickhold partly broken and a Sister mends it (Kyle). (Claude Opus 5.5)
- Hero names are held on the server, one hero each (api/names.ts, api/_names.ts: relic:name:<NAME> SET NX; shared/names.ts; client/names.ts). The class page suggests a free name from a 72-name pool (shared/namepool.ts, the lore keeper's), NEW NAME rolls another free one, BEGIN claims it first (taken: 'Someone has that name. Try another.'), retiring gives it back, heroes made before take theirs on load where free; no server (the solo build) and any name goes (Kyle). Note for the Deep chat: d1697a6 made client/world.ts import sumpdraw.ts, which loads sprites.ts, so tests importing world.ts (raise, rats, recapboard, runux, wading) fail in Node with 'document is not defined'. (Claude Opus 5.5)
- A hero whose name another hero already holds (found on load) is flagged (Profile.rename) and asked for a new one when picked on the title: a free name suggested, NEW NAME, KEEP THIS NAME claims it (Kyle). (Claude Opus 5.5)
- Walking: Rogues and Rangers all 1.1; Warriors, Mages and Clerics all 0.8, every weapon (Kyle). Pickup ids now always run past any lying in the room (sim/pickups.ts pid), so a host who took over can't reuse one; the handover test compares rooms with sorted keys and without pickup ids (labels). (Claude Opus 5.5)
- The pack's KNACKS opens a knacks-only screen (treeui.ts): a waiting pick's two side by side with OR and TAKE on each (a look on a job), then the TAKEN list, RESET; no trainer tabs from the pack (Kyle). The trainer keeps its tabbed screen. (Claude Opus 5.5)
- The shortbow's SPRINT is gone (Kyle: "dumb"): it jumps again, further back than the longbow (3.4 tiles, RANGER_LONG_JUMP). The crossbow winds 20% longer (draw 0.6 to 0.72). (Claude Opus 5.5)
- One hero of each class, five at most (was three of anything): the class pick shows a class you have already as YOURS and can't be picked; NEW HERO goes once you have all five; heroes already made are never touched (Kyle). (Claude Opus 5.5)
- Economy spec (docs/design/economy.md, Kyle approved): copper, silver, gold at 100 to 1; less income, mostly from the job's pay; prices set by time against measured income; fewer, bigger stat ranks; existing heroes kept, their purse at the same buying power. Waiting on the board for its own chat. (Claude Opus 5.5)
- The streak, slice 1 (shared/streak.ts, sim/streak.ts): hits, kills, blocks and dodges add while they come (within 3 s); anything that gets through to your health ends it; a quiet spell halves it. Steps at 10 (+8% damage), 25 (+5% pace, +20% stamina refill), 50 (+8% crit, +8% damage), through statsOf; power only, no pay (Kyle). Counted from score.ts's counts, settled once a room step, on a job only. (Claude Opus 5.5)
- The streak, slices 2 and 3: STREAK n under the hero card's bars from 3 up, coloured by step, a flare at each step, struck red for a moment when broken (streakhud.ts, streak.css); a ring at a step and a crack at a break, your own only. The job's best streak is a recap row (BEST STREAK) and a call (LONGEST STREAK), and goes on BEST IN WICKHOLD (LONGEST STREAK ON A JOB: each hero once at their best, top ten; api/_world.ts keeps a whole number under 10,000). (Claude Opus 5.5)
- Relics spec (docs/design/relics.md, Kyle approved): relics from church quests and great bosses' first kills only, one of each, no rolls; carry one, chosen in town, no swap on a job; the fanfare; existing heroes keep only the javelin (re-earn). Takes over holy-and-hungry section 4, built first. Waiting on the board. (Claude Opus 5.5)
- Relics spec: relic quests are rare, one at a time, offered only now and then (a level milestone or a long stretch of days); a reliquary at the church shows every relic you have and the ones still to win (dark), and is where you choose which to carry; the Keeping Room gets the same shelf for corrupt heroes (Kyle). (Claude Opus 5.5)

## 2026-11-16: the staff and the spear reworked (Kyle: "spear is pretty lame ... ditto mage staff")

- **Focus staff**: the wand's spells, much harder, rooted (Kyle: "you can't attack and move but all attacks
  are MUCH more impactful and powerful"). Tap: a heavy shot (22, bursts 0.9, knock 4, 0.76 s); hold: the
  wand's fireball, cold blast and sky strike, 1.35x across (shared/spellbook.ts STAFF_SIZE), 24 to 56. No
  castWalk, chargeSpeed 0. Taps do about 1.8x the wand's a second; in the clear bot it clears rooms about
  37% faster than the wand (the bot never pays for standing still). The old fire wall, nova and rings are
  unrouted (sim/firewall.ts, staffrings.ts kept for a ward later); firewall.test.ts gone.
- **Spear and shield**: the sword's guard (170, cost 1). Three thrusts at 2.3; the third PRECISE (goes past
  a shield board). Hold: thrown on its chain (sim/spearchain.ts, via sim/hook.ts): a goblin of weight 1 or
  less is reeled in and knocked down, anything heavier pulls you to it; range 6, 8 on the flash
  (shared/warrior.ts SPEAR_CHAIN). The lunge through three is gone.
- Follow-up: the hand is drawn empty while the spear is out (Hero.chainOut, both views), and the spear and
  shield now shows the sword's shield (it never had one drawn). No thrusts while the spear is out, shield
  only (Kyle: "risk reward").

Claude Opus 5.5

## 2026-11-16: the wand trimmed (Kyle: "too strong ... more timing based to hit a perfect")

- Its flash is 0.12 s (Weapon.flashWindow; other kits keep RELEASE.perfect 0.25). Let go on it, a hold costs
  half its magic (WAND.flashCost). Hold damage 10 to 18 (was 24), under the staff's 24 to 56.
- The storm stream tops out at 2.25x (was 2.5), and fully built you walk at 0.6 of your pace while it's on
  (STREAM.topWalk, in sim/walkspeed.ts so the client predicts it too).

Claude Opus 5.5

## 2026-11-16: the staff again (Kyle: "left click is just a quick swing that knocks back")

- Tap: a sweep again (12, range 2, arc 160, knock 9), the element on it as before (TAPS.staff back to
  0.65/1.05/1.05). Still rooted. Hold fire: the wand's fireball 1.35x. Hold storm: CHAIN_BOLT (sim/
  staffholds.ts), the aimed goblin then 4 jumps (7 on the flash) up to 4 tiles each, 1.6x the hold falling
  0.85 a jump, small ones stunned. Hold frost: ICE_DOME, r 2.6 (3.2) for 4 s (5.5) round where you cast:
  goblins at its edge or inside frozen and set outside, none come in, and no goblin blow from outside lands
  on anyone inside (combat.ts hitHero, shelteredFrom). Kept on Hero.dome; drawn in spellground.ts.

Claude Opus 5.5

## 2026-11-16: the blink trap; the shadow to the Rogue (Kyle)

- The Mage's trainer lesson at level 5 is TRAP ON THE BLINK (was IMAGE ON THE BLINK): a blink leaves a
  trap of the Mage's element (sim/blinktrap.ts, zone kind 'trap', BLINK_TRAP in shared/ladder.ts): r 0.6,
  springs on the first goblin, 30 and the element to all within 1.6 (fire burns, frost freezes, storm
  stuns small ones 1 s); 12 s, two at most, one per 4 s. LONG TRAP (was LONG IMAGE) adds 6 s.
- The image goes to the Rogue: SHADOW ON THE DASH, the same lesson; any Rogue dash leaves the decoy.

Claude Opus 5.5

## 2026-11-16: the Ranger's jump shoots, no snare (Kyle: "a quick shot WHILE it jumps back - not a trap")

- The lesson is SHOT ON THE JUMP (sim/ladderranger.ts jumpShot, JUMP_SHOT in shared/ladder.ts): 0.06 s into
  the jump an arrow at half draw, at the nearest goblin in reach, once per 2.5 s. The jump no longer lays a
  snare (room.ts; laySnare kept, unused). Ids kept, words changed: QUICK SHOT (r_snare, sooner), HARD SHOT
  (r_hold, +25%), TWIN SHOT (r_three, +1 arrow), ladder TWO SHOTS (twinsnare, +1 arrow), technique
  PIERCING JUMP (trapper, the jump shot pierces). JUMP SHOT (a tap mid-jump) is unchanged.
- feel/recapboard tests keep the shot out with snareReady 99 (they're about the dodge); the snare answer to
  the shield-bearer is gone (the net and the hound stay).

Claude Opus 5.5

## 2026-11-16: today's lines through the lore keeper and line editor; a look at the new pieces

- Renamed: the Ranger's lesson LEAP SHOT (fires by itself; the ladder's JUMP SHOT is the tap mid-jump), knack
  chain LEAP SHOT, EXTRA ARROW (was TWIN SHOT), rung TWO ARROWS, technique PIERCING SHOT. Lines shortened
  (drills.ts, perks.ts, ladder.ts, techniques.ts, kitlines.ts).
- Screenshots (phone, flat and 2.5D): the dome read as a pool of light on the floor, so it has arcs over the
  top now; the storm trap was faint, brighter now; the spear and shield shows its shield. No page errors.
- For the bible (lore keeper): the Mage's trap replaces the image (not beside it); the Ranger's leap shot
  replaces the snare on the jump; the staff's tap is a sweep and its storm hold chain lightning.
- Board: the new town layout in the normal look added to Waiting (Kyle likes the layout, not the street look).

Claude Opus 5.5

## 2026-11-16: the testers' fresh start (Kyle: "reset all characters and classes and the best of board and the status")

- Saves: client/save.ts FRESH = 2. A save read from this browser or from a recovery code (`fromStored`, in load()
  and recovery.ts) from before it keeps only ASHE the Mage (Kyle's level 9, for testing), with that save's town;
  with nobody kept, the town starts over too. store() stamps every save kept since. `fromJson` (the fill-ins,
  and the tests of them) is untouched. The one-hero v1 save is no longer carried over.
- Server: the world, Best in Wickhold, the counts and the Roll under `rl:e2:` (api/_world.ts), names under
  `relic:name2:` (api/_names.ts). The old keys are left in Redis, unread, so nothing is deleted. Every hero's
  name is claimed again as a save loads (main.ts), so Ashe has his back.
- Not reset: the trade ledger and owed runs (keyed by item and hero; the old heroes' simply go unused), saves
  under recovery codes on the server (reset as they're read). To do it again: raise FRESH and the two prefixes.

Claude Opus 5.5

## 2026-11-16: the new town's playtest bugs (Kyle: stuck at the Coopers, friends half-drawn, side doors)

- **Stuck coming out of a house:** game.ts `leave()` and `doorOf()` put you at the door spot + 0.5 down, right
  only for a door you push up into. Rescue Row's home:1, 3, 5 and 7 (the Coopers is home:1) face S in the new
  town, so you came out 0.37 tiles inside the house. Now `doorOut(b, 0.5)`, facing away from the door.
  tests/layout.test.ts: every door's way out is open ground (small edit in the Town layout chat's test file).
- **Friends half-drawn, floating:** other players in town (`others`) were drawn at the ground's height on the
  raised levels, the level's face over their legs. Lifted by `levelAt` in the flat view (scene.ts), cards3d.ts
  and chars3d.ts; hounds in the flat view too.
- **Where the door is:** client/doorsteps.ts, every door's step in both views: a warm patch and a double chevron
  pointing the way in, brighter and bobbing within 5 tiles. In 2.5D it's on the overlay, so a door hidden behind
  the next building shows its mark over that roof.
- **For the Town layout chat:** side-door buildings (the barracks `hall`, the counting house `bank`, the
  infirmary) still draw their door on the front between the pillars while the way in is the side; the forge's
  door sits behind the roof of the building in front. Worth a door drawn on the side face, and a wider gap.

Claude Opus 5.5

## 2026-11-16: firebolt and fireball (Kyle: "smaller and quicker for the wand, bigger and slower aoe for the staff")

- shared/spellbook.ts: FIREBOLT (the wand's fire hold) bursts 0.8 (1.2 on the flash) and flies 1.4x the hold's
  speed; FIREBALL (the staff's) bursts 2.4 (3.2) and flies 0.6x. STAFF_SIZE gone. The wand fills in 0.5 s (was
  0.6). Card: the wand's hold is "Heavy firebolt, small burst". Wand tests read its draw, not fixed times.

Claude Opus 5.5
- Follow-up (Kyle: "a lot smaller than the staff's"): a held spell's ball is drawn sized by its burst
  (`ballSize`, shared/spellbook.ts) in both views (spelldraw.ts, three/shots3d.ts): the staff's fireball full,
  the wand's firebolt 0.4 of it (0.5 on the flash).

## 2026-11-16: slow is slow; RECALL for BLINK THROUGH (Kyle: "the wizard is wayyyy too fast"; "shouldn't be any perks or skills around move speed")

- Pace: the slow three walk the same in their own armour now (the Mage's leathers didn't slow it, plate does a
  Warrior): Mage weapons 0.7, Cleric 0.74 (mail 0.95), Warrior 0.8 (plate 0.88): all about 3.1. tests/pace.test.ts.
- No knack for speed: QUICK FEET is LIGHT FEET (dodge 10% cheaper) for the Ranger and Rogue, SECOND WIND
  (stamina 15% faster) for the Warrior (he blocks, no dodge). Ids kept. SPEED on gear capped at 10% (was 25%).
  The bone bell's quickening stays (a relic). Keg and pouncer tests count armour now, at 65% of the fuse.
- RECALL (rung id `blinkthrough`, Kyle's pick): for 3 s after a blink, a dodge press snaps you back where it
  began, at once, for nothing, once (sim/laddermage.ts, RECALL in shared/ladder.ts). BLINK THROUGH is gone.

Claude Opus 5.5
- Correction (Kyle: "Rogues and rangers and clerics etc can get speed perks just not mages"): QUICK FEET back
  for the Warrior, Ranger and Rogue, SPEED gear back to 25%. A Mage alone is held: gear, the trainer's SPEED
  rank and the streak together at most 10% faster (MAGE_PACE in shared/mage.ts, sim/gearstats.ts statsOf).
- Gear (Kyle: "never have things that help magic recharge or ability also be on something that increases
  speed"): shared/mods.ts rollMods: SPEED never on a piece with SKILL RECHARGE, STAMINA RECOVERY (a Mage's
  magic), SPELL power or CHEAPER SPELLS (NOT_WITH_SPEED), for every class; the draw order kept, so pieces the
  rule doesn't touch roll as before; a piece that lost a pick shares its whole worth among what it got.
- Storm held swapped (Kyle: "staff charge to be lightning bolt and big damage, charged lightning wand can be
  chain lightning but less damage but more range than its little shock"): the staff calls the strike down
  (sim/skystrike.ts, its 24 to 56 hold), the wand throws CHAIN_BOLT: range 9 (the stream's 5), 3 jumps (5 on
  the flash), 0.9 of the hold falling 0.85 a jump. Cards and the storm, worldfx and spellbook tests follow.

## 2026-11-19: the wand's stream costs; no SPEED at the Mage's trainer (Kyle)

- The storm stream drains STREAM.drain (4) magic a second while it's up and holds magic regen (staminaAt kept
  at now, so the usual wait starts when it's down); run dry, it stops (sim/stream.ts stepStreams).
- The trainer offers a Mage no SPEED rank (shared/trainrows.ts), and a rank a Mage bought before does nothing
  (sim/gearstats.ts); the price isn't refunded.

Claude Opus 5.5

## 2026-11-19: hungry pieces get hungrier (spec only)

- docs/design/holy-and-hungry.md section 2b: hungry gear rolls far above the rest, but each piece's own bite
  grows with jobs worn, 5% to 50%, then it gains a second; its count stays in the piece. Not built.

Claude Opus 5.5
- Section 5b: holy pieces grow with clean jobs worn, from PRE-WAR's strength to a cap under a fresh hungry
  piece (above PRE-WAR and the uniques); corruption pauses it, never takes it back. Spec only.
- Section 5b, the crossroads (Kyle loved it): a holy piece at its cap ripens; on next return to town you must
  choose: give it up (big penance, a fresh holy piece, stay clean) or fall (it turns hungry at about 1.2x a
  fresh hungry piece, bites start, you're corrupt). Spec only.

## 2026-11-20: guards look the way they walk (Kyle: "STILL walking looking left but walking right")

- The side-on townsfolk (npcside.ts): headwear sat flat on the crown, so under it the back of the head was bare
  skin, more of it than the face, and read as the face. Headwear now comes down over the nape (a helm's neck
  guard, a hood) in its own colour: guards, the ranger and rogue hoods, the soldier's cap. Both views use it.
  Checked: Watchman Hob on his patrol, close up.

Claude Opus 5.5

## 2026-11-23: the Rogue pass, and the chain sickle in the rapier's place (Kyle, talking through the Rogue)

- VANISH: you move 1.3x while vanished, and the first blow out of it is an ambush (2.2x and the 1.2 s stun,
  HARD AMBUSH counts). Its smoke at your feet is `soft`: goblins in it are blind but never swing blind.
- KNIFE FAN, a shotgun: 7 knives, a 0.3 rad cone, 4.5 tiles; 10 within 1.5 tiles falling to 4 at the end
  (Bolt.fall). Point blank a big goblin takes several.
- SMOKE: a goblin in smoke now sees no one, even close: it stumbles (1.4 tiles/s, turning every 0.7 s), drops
  anything aimed, and a big one (weight 2 up) swings a blind cleave where it faces every 3 s. No damage bonus
  for attacking out of it (there never was; what Kyle saw was backstabs).
- KNIFEWORK stacks: one a backstab, up to 5, each past the first ticks 0.6 of a skewer's more.
- QUICK RETURN replaces SLIP AWAY (id 'slip' kept): a backstab kill takes 3 s off the skill's wait.
- Dash rung 2: SHADOW SMOKE replaces DASH THROUGH (id 'underlegs' kept): the dash's shadow (it gives one even
  without the lesson) bursts into smoke 1.8 tiles round for 3 s as it fades. Shake Off unchanged.
- SHARP RETURN replaces QUIET FEET (id 'g_quiet' kept): the first blow after Vanish or from smoke +20%,
  stacking with the ambush.
- The chain sickle (docs/design/chain-sickle.md) in the rapier's place, its id 'rapier' kept: cuts close (two
  or three a swing, 0.85x head on, 1.75x behind); held, the chain spins (3 to 6 every 0.3 s within 2.8 tiles,
  a 2 s bleed, walk 0.55, caught by a wall within 1.2); let go it flies on the hook (6 tiles, 8 on the flash);
  fully spun it snags a wall (you're pulled there), a big goblin (you're pulled behind it) or a small one
  (yanked). On the flash what it snags bleeds 3 s. Drawn: the spin in client/sicklespin.ts; the flying sickle
  as the hook's claw (one condition in relicsdraw.ts, the Art chat's file). The sickle in the hand is still
  the rapier's drawing (heldkits.ts, the Art chat's): asked on the board.
- Writing: the skill, technique, rung and knack lines through the lore keeper and line editor. The sickle's
  card labels reuse approved words.
- tests/perfparity.sim.golden.json recorded again: the rules changed on purpose.

Claude Opus 5.5

## 2026-11-23: the chain sickle's look (Kyle: "change all of it, like a rope dart chain thing")

- Drawn in my own client/sickledraw.ts: a short dark haft, a hooked steel blade off its head (bright back, dark
  inner edge, an unlit glint), a chain from the butt hanging in a loop to a little weight at rest, trailing behind
  a cut; spinning or thrown, only the chain runs out of the fist. In flight, the hook's line ends in the sickle.
- The spin (client/sicklespin.ts): the chain out to the blade, a fading arc behind it, a faint ring on the floor.
- One-line hooks in the Art chat's files, with Kyle's say-so: heldkits.ts (draw call, a spinning charge pose, the
  charge glow 8 long), relicsdraw.ts (the sickle head in flight), cloaklife.ts (a coil of chain at the hip for the
  scabbard), itemicons.ts (the icon), weaponmarks.ts (marks along the blade), three/kits3d.ts (the box figure).
  Sound: its hits slash, not pierce (weaponsfx.ts); each spin cut a swing, the chain caught a wall-hit
  (soundscape.ts); sparks for both (fxladder.ts). The board's ask to the Art chat is withdrawn.
- Checked on the phone in 2.5D: at rest and spinning.

Claude Opus 5.5

## 2026-11-23: the chain sickle tuned down (Kyle: "way too good... better in a one v one than daggers from behind")

- Taps 8, 8, 12 to 6, 6, 9, a little slower; head on 0.85x to 0.75x. Per second on one goblin:
  head on about 12 (daggers about 19), behind about 29 (daggers about 78). (Behind stays 1.75x: every Rogue kit's
  floor, tests/rogue-back.test.ts.)
- Spin every 0.3 s to 0.5 s, 3 to 6 down to 2 to 4, the bleed only once the spin is full, full at 1.5 s (was 1.1);
  walk 0.5 while spinning. Drawn turning slower too. Throw 10/24 to 8/18.
- tests/sickle.test.ts guards it under the daggers from behind and head on.

Claude Opus 5.5

- Then (Kyle: "dagger straight on was pretty weak, it can be equivalent... closer to 10 per rotate... about the same
  kill speed on the AoE, a lot worse single target"): taps 7, 7, 10 at 1x head on (about 19 a second, the daggers'
  head on), behind about 33; the full spin's cut 7, so a turn is about 10 with the bleed. Four goblins in the spin
  die about as fast as one behind the daggers. The guard test says so. Claude Opus 5.5

## 2026-11-23: the Ranger talk, first changes (Kyle)

- Every class skill waits 1.5x as long (shared/magic.ts SKILL_WAIT, on the 15 trainer skills only; found relics and
  the class's own button keep theirs): "pretty big hits", and so the recharge drill, knacks and QUICK RETURN matter.
  Vanish 27 s, Knife Fan 18, Smoke 24, Net 30, Volley 27, Shield Charge 15, and so on.
- The bows reordered: shortbow least (draw 0.4 to 0.5, 22 to 13, recover 0.22 to 0.28: about 15 a second), crossbow a
  lot more (60 to 66 a bolt: about 30), longbow a little more again (55 to 75 full: about 34). tests/bows.test.ts.
- Sic (Send the Hound) to go; its replacement still to pick.
- A paper table of every weapon's damage a second (scratch script, not kept) showed the Warrior's and Cleric's taps
  (29 to 34 a second, over an arc) well above the Rogue's head on (19, one goblin) and the Mage's wand (15): for the
  class-by-class talk.

Claude Opus 5.5
- Then (Kyle): the greatsword slower and heavier a hit (32 and 44 a sweep, was 26 and 36, longer wind-ups and
  recoveries: about the same a second, about 32), its overhead 45 to 90; its block kept but REALLY dear (guardCost
  1.3 to 3). Sword 12, 12, 22 to 11, 11, 19 and spear 11, 11, 20 to 10, 10, 18: about 30 a second each, still the most.
- HEARTSEEKER in Send the Hound's place (id 'sic' kept; sim/heartseeker.ts, sim/sic.ts gone): aim 0.8 s standing
  still, then one arrow of 120 out to 14 tiles through a shield; 20 s base (30 with SKILL_WAIT).
- Jump Shot folded into the LEAP SHOT lesson (the lesson gives the mid-jump tap shot). The jump rungs now: HARD
  LANDING (5), TWO ARROWS (10), FULL DRAW (15, the leap shot fully drawn, in Jump Shot's old id). Full Draw is my
  stand-in for the freed slot; Kyle may swap it.
- Writing through the lore keeper and line editor. The story bible (docs/lore/story-bible.md) still lists Send the Hound and the snare on the jump for Maeve: flagged to Kyle, not mine to edit. Claude Opus 5.5

## 2026-11-23: pictures and effects for the reworks (Kyle: "make sure we have animations and graphics for all of it")

- HEARTSEEKER: its own icon (a heavy arrow through a red heart; the hound picture kept for the hound knacks as
  'hound'); the bow drawn through the aim (one line in held.ts, the Art chat's); a gold sighting line out to the
  arrow's reach, white when ready (client/skillmarks.ts, both views); a snap and flash on the loose, and its sound.
- Goblins lost in a smoke bomb's smoke wear a turning swirl overhead (skillmarks.ts); not in a vanish's.
- QUICK RETURN: says so in gold with a ring, a chime (it said GONE, Slip Away's).
- Upgrade tiles: Quick Return an hourglass, Shadow Smoke the smoke pot, Sharp Return the vanish picture.
- Checked on the phone in 2.5D. Claude Opus 5.5
- Then (Kyle, the "get up to speed" felt odd): not yet full, the spin's first cut that lands stops it (one cut, then
  start again), so you spin up at a distance and walk in. The whirl now turns round the chain hand (weapon side, arm
  height), not the body's middle; the floor ring of its reach stays on the Rogue. Claude Opus 5.5
- An early spin stopped says TOO SLOW over the Rogue, with a clank and a drop of links ('chainstop'). Claude Opus 5.5
- The sickle's point now leads: in the spin it hooks forward round the turn, and on a cut it points the way the swing goes (the swings alternate with the combo). Claude Opus 5.5
- The spin no longer shoves (no stagger); the throw goes out only fully spun (short of it, TOO SLOW and nothing, in sim/hero.ts's release); the spin-up time is the weapon's draw, so QUICK DRAW and draw gear speed it. Claude Opus 5.5
- The spin's start shows one blade: no trail till it's moving, and no second chain drawn from the fist; it winds up smoothly from slow (1.5 a second) to fast (9), summed over the spin so it never jumps (client/sicklespin.ts spinAngle, also the hand's pose). Claude Opus 5.5

## 2026-11-23: bosses scarier (Kyle: "bosses, even mission bosses, much scarier: faster, more health, bigger, more destructive, destroying trees")

- shared/fury.ts FURY, sim/fury.ts. A named boss (a hunt's, a story's, a camp's: a butcher with a name, not a boss of
  the kit) in its fury: 1.6x health, hits 1.25x, wind-ups 0.85x and rests 0.8x (through Enemy.edge, as the Deep's
  edge goes), walks 1.3x, 1.25x as broad, drawn 1.3x as big (client/foes.ts, one branch). Its landed blows and its
  charge smash props under them (80 a blow) and fell any fellable tree they reach (sim/felling.ts fell, as a
  Warrior's heavy does: the trunk goes over, lands on whatever's under, lies there, burns).
- A boss of the kit (the Doorkeepers, Hempen, the Haulier, the Listener, the Leechman) 1.4x health (sim/room.ts
  fromFoe). Their own moves untouched: those live in their files.
- (Named "fury" because shared/tuning.ts already has DREAD, the corruption dread: I first wrote sim/dread.ts over it
  and put it back.)
- tests/fury.test.ts; parity recorded again. Checked the size on the phone in 2.5D. Claude Opus 5.5
- Then (Kyle: the sickle "still too OP... slash damage high, backstabs great; it should be a pseudo-AoE and a
  displacement weapon"): taps 5, 5, 7 (about 13 a second head on), backstab 1.2x (about 16 from behind; the one Rogue
  kit under the old 1.75 floor, tests/rogue-back.test.ts says so). The spin and the pull unchanged: those are its job.
- Hempen is made as a named butcher, so it gets the full fury (1.6x health, quicker, bigger, smashing), not just 1.4x: tests/hempen.test.ts updated. Claude Opus 5.5

## 2026-11-23: a chain throw landed twice (Kyle: "my charged sickle blade does like 100 at range", on touched gear)

- Not the touched piece: a full chain throw (the sickle's and the spear's) hit once through its hook AND again as a
  melee blow down its whole reach (the heavy swing's range, 6), so a full throw did 36, not 18, and perfects, crits
  and traits doubled with it. sim/hero.ts now skips the melee pass for a swing with `chain`. tests/sickle.test.ts
  guards it. Measured: a low-level touched sickle's damage line is the same +9% as forged; its pull is three
  modifiers, a trait and a cost. Touched pieces don't sour on their own today; they grow the Want a job at a time,
  and become VOWED in the Holy and hungry chat's slice 6. Claude Opus 5.5
