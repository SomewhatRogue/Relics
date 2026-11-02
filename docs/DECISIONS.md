# DECISIONS

Newest first. Each entry says what was decided and why, signed with the model.

## 2026-11-01: the wood, slower and clearer (Claude Opus 5.5)

Kyle, after playing: goblins didn't always come at you; Hew's words were hard to read under threat. He
asked for a pause with praise when you do it right, the control shown for your device, slower and more
readable blows (even a freeze on the flash), and an opening where you lie still while the screen fades in
and Hew walks over, checks you and pulls you up.

- **The opening** (`WAKE` in `sim/wood.ts`): you lie still (no input) as the screen fades up over 2.5 s;
  Hew walks over slowly, says three lines, hauls you up at 11 s. Then a MOVE card; walking a few steps
  starts the first lesson.
- **Holds** (`WoodState.hold`, applied by `Game.holding`): the world stops for a lesson card (Hew's
  line, the move, its control for this device, what it's for; GOT IT, Enter or any action key), for a
  freeze-frame on the first two blows of each lesson just before they land ("NOW: ROLL OUT", "IT FLASHES
  WHITE: NOW", the key; it waits for that move, which then goes through as the world restarts), and for
  about a second of praise when you get it right (first three per lesson). On a phone the button to
  press pulses.
- **Pacing:** every goblin in the wood but the Stoker is drilled: wind-ups half again as long, and only
  the nearest one comes at you (the rest hang back); the one coming is kept coming.
- Laptops: a parry needs you facing the blow, so aim at the goblin with the mouse (phones turn you).

## 2026-11-01: the prologue, the wood in Greyhollow (Claude Opus 5.5)

Kyle: a tutorial before town; woken and saved by an old man after a battle, taught attack, then dodge,
then block, then parry in different areas with different goblins; he's killed in a cutscene by a mini
boss you then kill for your first relic. Plan: the Claude Doc "Relic: The Prologue"; story and lines
from the lore keeper (Hew, the Greyhollow column, the Stoker, the tally stick).

- **The wood** (`shared/wood.ts`): one hand-laid 64 by 40 map, five areas walled by trees, joined by
  ways a fallen log closes until the lesson before it is done; then the road west to Wickhold.
- **The running order** (`sim/wood.ts`, stepped after the room by the game): each area's goblins come
  out when you walk in, its count (dodges, blocks, parries) and its goblins gate the way on, Hew walks
  ahead and says his line, falls are picked up (Hew hauls you up; at the Stoker the fight restarts),
  goblins killed before the lesson took come again.
- **Locked moves:** the game passes only what's been taught (attack; then roll; then block; then
  everything but the skill; the skill at the hut). Phone buttons appear as they're taught.
- **New goblins** (`VARIANTS` in tuning.ts): looters (weak, slow, look up only when you're close),
  lungers (a striped stab from three tiles), the heavy (a blow that breaks any guard: parry it) and
  the Stoker (rake sweep, kiln drop, and the draw: a striped line; caught, you're hauled to its feet).
- **The cutscene:** about ten seconds, bars, input off, the camera eased between you and it; Hew is
  hooked, dragged, gives you the stick and dies behind the cordwood. Skippable once seen.
- **Leaving:** the javelin (first relic; deep jobs now give the hook first), Hew's tally stick for Odric,
  and for a Healer a cold censer (no heals given) until Mother Isolde relights it. Orla greets you at
  the gate. Heroes made before today skip it; a second hero can BEGIN IN WICKHOLD; WOOD on the start
  screen replays it with no rewards. Test links (`?hero=`) skip it unless `&wood=1`.

## 2026-11-01: loot slice 6, hungry gear and the Want (Claude Opus 5.5)

- **Ten hungry pieces** (`shared/hungry.ts`, wired in `sim/hungry.ts`), names and costs from the lore
  keeper: Skarn's Cleaver, the Larder Pike, Spendthrift, Mother Rust's Needles, the Jealous Rod, the
  Keeping Mace, the Butcher's Apron, the Ransom Coat, Someone's Wedding Ring, the Tooth Ring. Each has
  three very large modifiers, a gift and a cost, both shown on the card (green and red). Named butchers
  favour their own piece (Skarn, Mother Rust); no other source drops those two.
- **Where they come from:** 5% of a named butcher's drops and 3% of chest rolls (before danger shifts).
- **Rules:** can't be dropped, melted, traded or upgraded; Someone's Wedding Ring can't come off; all of
  it can only be left on the church step (Odric: "Leave it on the step. I'll see to it.").
- **Gold in a fight:** heroes carry a purse (home gold plus the job's) so Spendthrift and the Ransom
  Coat can spend it; spending takes from the job's gold first.
- **The Want** (`Profile.want`, hidden): +5 per hungry piece worn at a job's end (+15 for the Wedding
  Ring), +0.2 a kill made in hungry gear; -0.1 per gold given at the Lantern, -30 per piece given up.
  It shows sideways: from 15 the hero's eyes glint red in the dark, brighter as it grows; from 30 Agne
  remarks and Gannet pours short. Nobody turns yet; the threshold and turning are for Kyle to decide.

## 2026-11-01: loot slice 5, upgrades (Claude Opus 5.5)

- **Halvard's anvil** (THE ANVIL in his panel): melt packed gear for steel (white 1, green 3, blue 8,
  purple 20; never hungry) and raise a piece a level for gold and steel (+1 30 and 2, +2 60 and 5, +3
  120 and 10, +4 200 and 20, +5 320 and 35), capped by tier (white +2 to purple +5). A level grows its
  modifiers by a sixth and adds 3% weapon damage, 1% less taken on armor, or 2 health on a ring.
- **Ivo** rerolls one modifier on a worn green, blue or purple piece for 40 gold, into another the
  slot can roll, at the same tier.
- Upgrading replaces the piece wherever it is (profile and hero), so the stats cache stays true.

## 2026-11-01: loot slice 3, chests (Claude Opus 5.5)

- **Chests** (`sim/chests.ts`, placed by `planRoom`): 40% of rooms have one, the last room always, and a
  deep job's last room adds a chained chest by the named butcher that opens only once it's dead.
- **Opening:** USE beside it (F on a laptop; a small OPEN button on a phone, out of the way of the fight
  buttons). It takes 1.2 s; walk off, get hurt or go down and it shuts again. Every player in the room
  is rolled for at the start, so the seam light is the true colour of the opener's best piece. Hungry
  light pulses, a heartbeat plays, and goblins within 6 tiles notice.
- **What's inside:** one or two pieces per player (two in a chained chest, one tier up), weapons,
  armor or rings by chest odds, shifted a tier up in places of ruin 3 and on deep jobs; sometimes gold
  and a potion for anyone. Each player's pieces are theirs alone: only they see them, only they can
  take them (`Drop.owner`).

## 2026-11-01: loot slices 2 and 4, tiers, modifiers, armor, rings, the item card (Claude Opus 5.5)

- **Item** (`shared/loot.ts`) gains slot (weapon, armor, ring), tier (plain, fine, forged, tolmouth,
  hungry), modifiers and a level. `shared/gear.ts` has the tiers, the 14 modifiers with their bands,
  rolling by tier, tier odds by source, caps, armor weights and `gearStats`, the one sum the room and
  the card both read (`sim/gearstats.ts` caches it per hero).
- **Where modifiers act:** swing damage, wind-up and recovery, reach and knock (`currentSwing`); time to
  full charge; parry window; chip and breath through a block; damage taken; walking speed; dodge
  cooldown, distance and cost; skill and relic recharge; breath recovery; healing given; health.
  BREATH speeds recovery only (maximum breath stays 100, which half the game assumes).
- **Armor:** light (as before), medium (5% slower, 12% less taken), heavy (12% slower, 25% less taken,
  a 25% shorter dodge costing 30% more breath, no stagger from small goblins). Warriors start in
  plain plate, Healers in a mail shirt, the rest in leathers. Two rings; a third pushes out the older.
- **Drops:** goblins drop by tier (small: white or green; butchers green up, sometimes armor or a ring;
  named blue up). Weapons are any type of the nearest player's class. Halvard sells Fine weapons and
  armor; Dessa Forged weapons and rings (her line no longer says Tolmouth).
- **The card** (`client/card.ts`): tier chip, name, how a different weapon type fights, modifiers and
  traits in words, then every number that would change against what you wear, better or worse. The
  pack shows worn gear, spares with their comparisons, and AS YOU STAND, the hero sheet.
- Old saves: weapons with a trait become Tolmouth; heroes get their class's plain armor.

## 2026-11-01: loot slice 1, gold and potions (Claude Opus 5.5)

Kyle said continue on the loot plan. Defaults taken for the open questions (Kyle can overrule): the old
"no stat sheets" rule goes; any class wears any armor; the Want is built hidden and nobody turns yet;
Dessa keeps her line until the Tolmouth tier lands; a lost job keeps half its gold.

- **Gold on the floor** (`sim/pickups.ts`, `COINS` in `shared/potions.ts`): job goblins drop coins
  (small 70%, 2 to 6; archers 3 to 8; butchers always 15 to 30; named 60 to 100). Walking over it
  splits it evenly across the party, the picker keeping the odd coin. Gold no longer comes straight
  from kills; experience still does. Training-yard goblins drop nothing.
- **Potions** (`sim/flasks.ts`): a belt of three, Q or the POTION button uses the front one, a press in
  the 0.8 s cooldown waits. Sister's Bitter (40 health over 2 s), Wall Brandy (full breath, faster
  for 6 s), Lamp Oil (thrown, fire burst), Frost Flask (thrown, frost burst), Smoke (thrown; goblins
  can't see anyone in it unless within 1.2 tiles). Flasks fly where you aim, or to the nearest goblin
  in range on a phone. Goblins drop them (8% to 35%, named always); Agne sells Bitter, Gannet Brandy and
  Oil, Moll Smoke, Ivo Frost. New heroes start with one Bitter. The pack reorders and pours out.

## 2026-11-01: weapons rarer now; the loot and gear plan (Claude Opus 5.5)

Kyle: weapon drops too high; gold (shared in a party), potions, chests that open with a pause and a
colour by tier; white to purple tiers with modifiers on base stats; armor and rings; upgrades; a way
to see how gear changes attacks and stats; top-tier gear with real drawbacks, "since it's greed".

- **Landed now:** a small goblin drops a weapon 4% of the time (was 35%), a butcher 40% (was always).
- **The plan** is the Claude Doc "Relic: Loot and Gear" (https://claude.ai/artifact/BSET3vmRQ6Dn2BJqr3dVdW):
  tiers Plain (white), Fine (green), Forged (blue), Tolmouth (purple), Hungry (goblin-eye red); weapon
  type = how you attack, modifiers = how well; 13 modifiers with bands by tier; light, medium and heavy
  armor; two rings; a three-potion belt; chests held open 1.2 s with tier light leaking out; Halvard
  levels with gold and steel; ten hungry items with gifts and drawbacks; the Want as a hidden number.
- **Names from the lore keeper:** Tolmouth (pre-war steel nobody makes now), Hungry (the town's word for
  goblins), steel (not "scrap", which clashes with scrappers), Sister's Bitter, Wall Brandy, Lamp Oil.
- **Overrules** the loot code's old "no stat sheets, at most two traits" rule once Kyle agrees (open
  question in the doc). Build order in the doc: gold and potions, weapon tiers and the item card, chests,
  armor and rings, upgrades, hungry gear and the Want.

## 2026-11-01: the Healer's coals (Claude Opus 5.5)

Kyle kept the censer's Lantern coal: "the more they collect the more they heal allies but the more
goblins might seek them out in battle."

- **Coals** (`src/sim/lantern.ts`, `LANTERN` in `shared/magic.ts`): every butcher that dies leaves a
  live coal on the floor for 25 s. A Healer who walks over it feeds the censer, up to 12, kept for
  life (saved on the hero). Nobody else can take one.
- **Each coal:** every heal the Healer gives (Sanctuary's ground, every third mace blow) is 8%
  stronger, nearly double at 12. Goblins judge the Healer 0.35 tiles nearer when picking whom to go
  for (4.2 at 12, so a full censer pulls them past a nearer friend) and notice them 0.25 tiles
  further off.
- **Seen and heard:** the coal on the floor pulses and sheds sparks; the censer's light grows with
  each one; "CENSER FED" and a warm two-note chime on pickup; COALS n / 12 in the pack; a line on
  the Healer's class page; Isolde and Odric each have a line for a Healer.
- **Words from the lore keeper:** "coal", not "ember" (EMBERFORGED is a fire trait already). Code
  says coal too.

## 2026-11-01: the pack, a shorter class pick, one weapon to start (Claude Opus 5.5)

Kyle: start with a weapon type and don't say what the smith has; an inventory for each hero, open any
time without pausing, to equip items and relics; too much text on the class pick (general info first,
tap in for stats); copy through the lore keeper, simpler UI.

- **The pack** (`src/sim/pack.ts`, `src/client/pack.ts`). Each hero has what's in hand, their skill,
  the relic carried, the relics they've won, and up to 8 spare weapons. PACK in the top bar, or I
  (Tab) on a laptop. The world doesn't pause. Changes go to the room as an intent (`gearSeq`,
  `gearOp`, `gearArg`) so a friend's pack works the same online. A change pressed mid-swing waits
  for free hands rather than being lost.
- **One weapon to start.** Every class starts with its first weapon type. Other types of your class
  come as loot (half of drops are the type in hand, half another of your class) or from Halvard, who
  now sells each type into your pack. Taking a drop puts it in the pack; nothing swaps on its own. The
  smith no longer changes kits. The plain starting weapon is always there to go back to.
- **The class pick:** five rows (face, class, one line). Tap one: a one-line pitch, five ratings out
  of five (POWER, GUARD, SPEED, RANGE, SUPPORT, hand-judged from tuning.ts and kept in
  `shared/classes.ts`), weapon, skill, what it can't do, name, begin.
- **Copy** rewritten with the lore keeper (`src/client/copy.ts` and `shared/classes.ts`): "deep job"
  everywhere players see it, never "deep dive"; stamina is "breath"; goblins aren't careless or
  brave, they're patient. Old saves: the weapon in hand stays, other weapons go in the pack.

## 2026-11-01: simpler classes; relics only from deep dives (Claude Opus 5.5)

Kyle: rewrite and simplify what each class has or doesn't; nobody starts with relics, they're found at
the end of deeper dungeon dives.

- **One sheet per class** (`src/shared/classes.ts`, shown on the start screen): weapon, guard, dodge,
  one skill, what only that class does, what it can't do. That file is the source for the copy.
- **One skill each, on the SKILL button (E):** Warrior War Cry, Ranger Hunter's Net, Rogue Shadowstep,
  Mage Lodestone, Healer **Sanctuary** (the blessed ground and the ward in one cast: ground at your
  feet or where you point, and a ward on whoever is most hurt). Two Healer buttons became one, which
  keeps the Healer good alone without a menu.
- **No relics to start.** The javelin and the grappling hook come out of the named butcher at the
  bottom of a **deep dive**: one job on the board each day, five rooms, ruin 3, a hunt, 180 gold. The
  first win gives the javelin, the next the hook; a new one is carried at once. Carry one at a time
  (RELIC button, R); change which at Ivo the relic-wright. Lore fit: the bible already says relics are
  pried out of butchers who ate slivers.
- **The relic wheel is gone** (hold-and-slide, 1 2 3). Two buttons, two keys, nothing to pick
  mid-fight.
- **Elements** fit to the skill or to a found relic; a Mage's spells take the element of what's
  readied. RELIC-WISE now speeds both.
- Old saves: heroes keep their class and level; their relic list starts empty (nothing was "found").

## 2026-11-01: bigger rooms, goblins at rest, archers that run, loot that does what it says (Claude Opus 5.5)

Kyle (after playing as a Mage): each area bigger before moving on; loot that didn't do what it said;
archers he couldn't hit that didn't run when he got close; starting rooms should be more small goblins
that don't all rush you until startled, and bigger ones deeper in.

- **Loot that does what it says.** The bug: a drop rolled for any kit of your class, and taking it
  quietly swapped the kit in your hand (the wand for the staff) for that room only; next room you were
  back on your own kit and the new weapon's trait sat on a kit you weren't using. Now drops and the
  smith's wares are always for the weapon in hand, and taking one never changes your kit (the smith
  does that). The loot card says so for anything else.
- **Shots fly over ledges.** Ledges were walls to anything without a level, including arrows, spells
  and javelins, so a shot from the ground at an archer up top stopped at the ledge's face. Only bodies
  (heroes, goblins, props) are stopped by ledges now.
- **Archers run** when you get close on their own level (up on the ledge too, along it), sidestepping
  as they go so they don't back into a corner, and keep their distance at 4.5 tiles.
- **Rooms are 28 by 24** (were 18 by 16), with more furniture to match. The camera follows.
- **Goblins at rest** (`ALERT`): run goblins start in bands around their fires, milling about. One
  notices you in front of it within 6.5 tiles (2.5 from behind), when a goblin near it is hit or
  killed, or when it's hurt; it cackles, a "!" goes up, and its band (within 5.5) wakes with it. The
  rest of the room keeps resting. Sneaking up from behind is now a real choice (and a Rogue's dream).
- **Who's where:** the first room of a job is only small goblins (5 or more, more where it's worse);
  butchers start in the second room where it's Occupied or worse, and the last room adds another.

## 2026-11-01: automated tests, the shared world and the Roll of the Brave, a living Wickhold (Claude Opus 5.5)

Kyle: automated tests running on this; small groups or individuals impact the world and see a
leaderboard of quests done and people saved; a story individuals shape through action and voting
that changes the world, the quests and the town around them; a town that feels alive (guards on
patrol, more areas, some locked for now, more objects); a trainer for each class somewhere you have
to find; gambling with the rogues at a tavern with a sewer nearby; more to do in the central area;
no fighting in town but movement abilities still work.

- **CI** (`.github/workflows/ci.yml`): every push and pull request runs the type check, every test
  (the relay against a real `redis-server`), the build, and `npm run smoke`: real Chromium on a
  phone-sized and a laptop-sized page makes a hero on the start screen, goes into the forge, takes a
  job and wins its first room, failing on any page error.
- **The shared world** (`api/world.ts`, `api/_world.ts`, `shared/worldsync.ts`, `client/worldlink.ts`).
  Everything a hero does to the world is one contribution (a finished run, a gift, a vote), applied
  in the browser at once and posted to `/api/world`, whose answer is the world you then see. One
  world per code: WICKHOLD is everyone's; a group can play in a world of its own by typing a code at
  the Roll of the Brave. Redis holds each world as one JSON value changed under WATCH (a clash
  retries) plus a sorted set per stat: about a dozen commands per finished run, nothing per tick.
  The server lets through only what a real run or gift could send (capped, never negative, names
  cleaned). Offline (no server yet, or the claude.ai page, which can't reach it) the world is the
  browser's and the Roll shows your own heroes. Shared code now imports with `.js` so the server can
  run it under Node as is.
- **The Roll of the Brave** (a stone in the square): jobs done, people saved, gold given, goblins
  killed, dens burned, the top ten each. Heroes carry their own counts (`Profile.stats`) and an id.
- **The council counts heroes.** Online it decides when four heroes have voted, by majority (a tie
  goes to the choice voted first); you can change your vote until it decides. Alone and offline your
  vote decides.
- **Town works** (`shared/works.ts`), filled by everyone: Man the Walls (400 gold: two more guards on
  patrol), Clear the Old Quarter (600 gold: the rubble in the east lane goes, the Old Quarter opens
  with its barred chapel and Old Merren), Drive Them from Below (six dens burned on jobs, all told:
  the sewer grate opens and sewer jobs go on the board).
- **Wickhold, bigger and alive** (62 by 40): Lantern Square (the job board, the works board, the Roll,
  the well, Rowan the bard, benches, a cart, lamp posts), the church and its graves, the town hall,
  the forge, the mage's tower, the barred keep, the barracks, the hunters' lodge and its archery butts,
  the infirmary, the Drowned Rat, Rescue Row, and the Old Quarter past the rubble. Guards walk rounds
  (`Npc.path`, a pure function of time, so every player sees them in the same place); barrels and
  crates in the streets. Barred doors (the keep, the chapel) and the rubble say what would open them.
- **A trainer per class**, each somewhere of their own: Master Cole in the barracks (Warrior),
  Huntress Maeve at the hunters' lodge (Ranger), Whisper at the back of the Drowned Rat (Rogue),
  Magister Vell in the tower (Mage), Mother Isolde in the church (Healer). Only yours trains you; the
  others tell you where yours is. Each teaches one perk of its class besides the shared ones: Ironhide
  (blocking costs a quarter less), Steady Hand (bows draw a sixth faster), Shadowed (backstabs half as
  hard again), Focus (the blink back a quarter sooner), Devotion (blessed ground wider, the ward
  stronger).
- **The Drowned Rat**: Barkeep Gannet (rumours), Dicer Moll (knucklebones: two dice each, high roll takes
  the pot, ties to the house unless you're a Rogue; seeded per hero), Whisper, a drunk, a card sharp.
  The sewer grate is out the back.
- **In the square**: the works board, the Roll, the well (5 gold: your next job starts blessed), the
  bard (ask for any of the thirty pieces; it plays while you're in the square).
- **No fighting in town**: blows, guard, relics and grabs are held still; rolls, dashes and blinks work
  (the ROLL button shows in town on phones).

## 2026-11-01: music for every place, kits that sound like themselves, goblin voices, a Healer good alone (Claude Opus 5.5)

Kyle: music specific to towns and each kind of area and terrain, a few versions of each; typical
sounds for all weapons, impacts, goblins. Then: the Healer gets an AOE bless that heals allies slowly
and hurts enemies, and a ward that stops damage on self or others and reflects magic and projectiles,
so the Healer is good even solo. Also: tips off unless switched on.

- **Music, made live** (`client/music.ts`, `scores.ts`, `instruments.ts`; no files, nothing to
  download). Ten kinds of place, three pieces each (30 in all): Wickhold, inside a house, the church,
  the yard, villages, farms, fields, forests, mines, and a boss. Each piece is a mode, a chord
  progression and its parts (a drone or organ bass, held strings or organ, a picked lute or harp
  pattern, a flute, bell or horn tune that wanders a little differently every time, frame drums),
  through a shared hall reverb (wetter in mines and the church). Moving between places crossfades;
  the town's piece turns with the day, a run's with its seed and room. Under everything a fight layer
  (low toms and a driving low ostinato) rises with how many goblins are coming for you and falls
  away when they're dead; a named boss brings its own music once it's close or hurt. A note button
  switches the music alone (remembered on the device); SND still silences everything.
- **Every kit sounds like itself** (`client/weaponsfx.ts`). Swing and hit events now carry what made
  them (`src`) and whether it landed on the butcher (`big`). Sword: a ringing slice; greatsword: a long
  low whoosh and a cleave; spear: a thrust and a pierce; daggers: a quick double hiss and a stab; mace:
  a whump and a bone crunch. Bows creak at full draw and twang on release (deeper on the longbow), the
  crossbow thwacks and clicks, wand, staff and rod crackle, hum and zap. Blocks clang on a shield, ring
  on a blade. Wood chops, buildings whoosh alight, crackle while they burn (louder the closer you are)
  and fall in with a rumble; doors creak.
- **Goblin voices** (`client/voices.ts`): a sawtooth through two vowel filters with a rasp. Scrappers
  gibber and cackle as they come (now and then, more with more of them), yelp when cut, shriek when
  they die, hiss before a stab; archers' bows creak as they draw; dens screech when one crawls out.
  The butcher grunts, roars into its cleave and slam, and groans as it falls. Each goblin's pitch comes
  from its id, so a crowd sounds like a crowd.
- **The Healer** (relics now blessed ground, ward, war horn; `sim/relics.ts`, `BLESSING` and `WARD`).
  Blessed ground: a 2.4-tile circle of light at your feet (or where you point on a laptop) for 6 s;
  allies in it mend 3 every half second and are blessed (hit harder, take less) while they stand in
  it; goblins in it take 4 every half second, and the relic's element if one is fitted. Ward: a shell
  on the most hurt ally in reach, yourself included (or the one you point at), for 5 s: it soaks up to
  50 damage of blows, and an archer's arrow bounces straight back for 1.5x its damage and stuns the
  archer. Goblin spells will bounce the same way when there are goblin casters. Solo, the Healer
  stands in her own light behind her own ward. (This settles the open solo-Healer question.)
- Tips are off unless TIPS in the corner is on. On phones the HUD is narrower so the five corner
  buttons fit beside it.

## 2026-11-01: heights and forks (Claude Opus 5.5)

Kyle: multiple heights and paths within missions that make heroes choose how to move together or
attack threats.

- **Two levels to start: the ground and up on a ledge** (`Ledge` in `shared/arena.ts`). A ledge is a
  rock shelf (mines, forests) or a timber wall walk (villages, farms) along the back of a room. From
  the ground its edge is a wall; from on top you can step off it (a drop: you land, no harm). A ramp
  overlaps its edge: inside the ramp you take the level of where you stand, so stairs are just a place
  the wall isn't. All of it is in `collide`, so heroes, goblins and the tests share one rule. Bodies
  carry `z` (0 or 1); a prop has none and stays on the ground.
- **What height changes:** a blade only reaches your own level (up top you're out of reach of the
  ground, and they of you); grabs too. Arrows, bolts, spells, javelins, hooks and nets reach up and
  down. Shots from up on a ledge hit 1.25x (`HEIGHT.shot`). A goblin knocked off a ledge fast (thrown,
  hooked, blasted) takes the fall: 12 damage and a stun; one that steps off just lands.
- **Archers** (`ARCHER`): a scrapper with a bow. It keeps its distance on the ground and holds its
  perch up high, draws on you for a full second with a thin sightline telegraph, and looses: block it,
  parry it (the archer is stunned where it stands), or roll. Goblins with blades go round by the ramp
  to reach you up high; archers don't come down.
- **Forks:** the middle room of a three-room job has two ways out instead of one: THE HIGH ROAD (the
  next room has a ledge with three archers on it and two fewer goblins below) or THE LOW ROAD (one
  more goblin below and someone caged to free, even in the last room). The run remembers the road
  (`Run.roads`), so the same job can play two ways.
- **The way on takes the whole party.** Every exit, and each road at a fork, opens only when every
  player in the room stands in it (`Game.together`); solo that's you. Online this is how the party
  chooses a road together: walk into it as a group. Splitting at a fork (the leader running both
  rooms) is possible with the multi-room host, and saved for later.
- Not yet: more than two levels, ledges out in the middle of a room (they draw against the back wall
  for now), rooftops you climb by ladder, a lever up top that opens a gate below. Recorded in the atlas.

## 2026-11-01: heroes for life, every building enterable, buildings that burn, Come Bye's online lessons (Claude Opus 5.5)

Kyle: pick your class at the start when you first load in, with its own level, and no changing it in
a game; every building enterable with things inside and people to talk to for upgrades; mission
buildings that can be burned out and destroyed, visibly, or entered. Then: this will be online and
offline; Come Bye's team wrote up joining and moving between servers; build towards it early without
paying much.

- **The start screen** (`client/title.ts`): your heroes, up to three, each with a name, a class for
  life, its own level, gold, perks, kit and fitted elements; play one, make one, retire one (asks
  twice). The world (town, chapter, votes) is shared by all of them. Saves are v2 (`relic.save.v2`:
  heroes, current, world); a v1 save's hero comes across as HERO, its class from its weapon.
- **No class, kit or element changes in play.** The CLASS, WEAPON and AUGMENT buttons and the C, Q, T
  keys are gone, and `Game.step` holds those press counters still in every mode. Kits change at the
  smith (within the class); the relic-wright fits fire, frost or storm to a relic for 45 gold (free to
  take out), kept on the hero. HEROES in the corner opens the start screen (not mid-job).
  `?hero=MAGE` skips the start screen for the scripts.
- **Every Wickhold building has a door and people** (`shared/interiors.ts`, `client/npcs.ts`). Walk up
  into the door (or ENTER on a phone); walk out the bottom to stand back at the door. The forge
  (Halvard the smith, Ivo the relic-wright), the church (Father Odric, Marta), the training hall
  (Master Cole, and Squire Pell who takes you to the yard), the infirmary (Sister Agne and up to three
  patients), a new town hall where the council table was (Reeve Hollis and two councillors), the
  granary (Farmer Jos) and every lit house on Rescue Row (a family of two, with rumours that hint at
  places and tactics). Old Wenna and Tam stand in the square; Dessa the trader at the market once the
  traders are in. A gold mark over anyone you can talk to, their name when you're close.
- **Buildings on a job** (`sim/buildings.ts`, tuning `BLAZE` and `WOOD` in `shared/props.ts`).
  Cottages and barns, fences and goblin dens are wood with health. Blows chip them (half damage),
  blasts knock at them; oil fire, fire blasts and burning goblins set them alight; fire burns them
  down in about six seconds, spreads to wood within a tile after 2.5 s, and catches goblins standing
  close. Burned down, a building is ash and stubs you walk over (it stops colliding). Drawn charred
  under half health, with flames, smoke and window glow while burning, embers after; a fire lights
  the street. Town buildings have no health and never burn.
- **Cottages and barns can be entered** on a job: turned over inside, one to four goblins, a cage
  with someone in it on rescue jobs (a third of cottages and half of barns otherwise), a butcher in
  some barns where it's bad. The inside stays as you left it for that room; a burning or burned
  building can't be entered.
- **A new job: Burn out the dens.** The last room holds three dens, each with an oil barrel by it;
  a standing den sends out a scrapper every 9 s (up to six goblins about). The room is done when the
  dens are ash.
- **Online, from Come Bye's write-up** (`docs/ONLINE.md` here, the full one in Comearound): copied
  their newer relay and its tests (publish through Redis only while another instance has players:
  about 100 hours of play a month on the free plan instead of 3; dead hosts can't hold a room; a
  Redis hiccup can't kill an instance). What it changes for us now: the room is plain data the leader
  can save every 2 s; the room outside a building keeps running while you're in (the leader will run
  every room someone is in, so a party can split); seats come back by hero name; the shared world is
  written per run, never per tick.

## 2026-11-01: the town and the loop, terrain, the story mission and the council (Claude Opus 5.5)

Kyle: get to work on the town and the gameplay loops; other terrain types and how maps and
scenarios are made; bigger story missions and decisions the group votes on that change the world
and the town.

- **The game starts in Wickhold** (`shared/town.ts`), built from the shared world's state: Lantern
  Square (the Last Lantern, the job board, the council table), the Church, the Forge, the Training
  Yard, Market Row, the Infirmary, Rescue Row (a lit house per two people brought home), the north
  gate. Walk up to a spot and USE it (E or F on a laptop; a USE button on a phone, where the combat
  buttons hide in town). The training room is now the Training Yard; walk out the bottom to leave.
- **Maps are data** (`shared/arena.ts`): size, blocks (buildings, rock walls, fences: footprints you
  walk behind), round things (pillars, trees, pines, rocks, hay, wells, supports, the Lantern),
  braziers, torches, the way out, and a theme (floor, back wall, ambient light, moonlight). One map
  is in use at a time (the room sets it), so collision never needs it passed around.
- **Run rooms are laid out from the job's seed** (`shared/terrain.ts`): village (cottages, a well),
  farm (barn, fences, hay), fields (standing wheat, hay), forest (trees, pines), mine (rock walls,
  pit props, oil, dark: heroes carry a lantern). Objective first, then buildings, round things,
  furniture, a goblin campfire, goblins in the top half; spawn, exit and the middle lane stay clear.
  Ruin and the room's place set the goblin count; a butcher joins at ruin 2.
- **Jobs** (`shared/jobs.ts`): three a day from seven places across four regions. Objectives:
  rescue (break the cages), hunt (a named butcher), larder (smash the racks). Twist: night. Three
  rooms; clear each to open the way out at the top; the last holds the job. Run goblins stay dead.
  Three downs and you're driven back with half the gold and nobody saved.
- **Progress** (`shared/progress.ts`, saved in this browser for now): gold and experience from kills
  (scrapper 4 and 10, butcher 30 and 60, a named one 80 and 150), 25 experience per person freed, 50
  and the job's pay for finishing. Levels at 100, 300, 600... (cap 10 in chapter 1); each level is a
  pick of one of two perks at the trainer (tough, endurance, relic sworn, footwork, guard, second
  wind). The smith sells a fine weapon (60), the trader a forged one (160, once the market opens).
  Gold given at the church feeds the Lantern (the Want comes later).
- **Chapter 1** (`shared/story.ts`): bring 6 people home and finish the story mission, Barrowby's
  Bell (four rooms at night, the Gnawer in the church, three cages). Then the council table opens:
  farm the north fields (jobs pay 25% more, a granary goes up) or take in the refugees (four more on
  Rescue Row, the trader opens). A council needs 4; in this solo demo you can decide alone. The vote
  is recorded with its voters and day; chapter 2 is written at the review.

## 2026-10-31 (late): props to smash, lift and throw (Claude Opus 5.5)

Kyle: pick up and throw barrels and tables (and broken pieces) if you're a big enough character,
like the knight or a barbarian; the rogue and ranger can't.

- **Props are bodies** (`shared/props.ts`, `sim/props.ts`): barrels (2.5), an oil barrel, crates (3)
  and a table (4) stand in the training room. Blows, shots, blasts, wall slams and flying goblins
  push and break them; they break into staves and planks (lighter pieces that fade after 25 s).
  Big ones come back after 20 s in the training room. Shots stop on them.
- **Only strong classes lift** (`STRONG`: the Warrior now; a Barbarian when the Warrior forks into
  Knight or Barbarian). GRAB takes a goblin first if one is earned, else the nearest prop. Overhead
  you walk at 70% (56% for a crate or table); ATTACK slams it down (28 to goblins within 1.3 tiles,
  it breaks); GRAB throws it at 14 tiles a second. A thrown prop hits like its weight (0.8 per tile
  a second times weight, up to 45) and breaks on any goblin it hits at speed.
- **The oil barrel** bursts into flame when broken: everything within 1.8 tiles burns.
- **Goblin grabs stay for every class** (they're earned by skill, not strength); lifting furniture is
  the strong classes' extra.

## 2026-10-31 (after midnight): grab, slam, throw, and deaths by the blow (Claude Opus 5.5)

Kyle: more dynamic hits and deaths: slam a goblin into the ground and pound its head off so it
bursts, or chop it off; pick a unit up and throw it at another.

- **Grab is earned** (`sim/grab.ts`): only a small goblin (weight 1 or less) you've stunned, netted,
  frozen, staggered or got behind, within 1.3 tiles. G on a laptop; on a phone a GRAB button shows up
  only when there's something to grab. Overhead you walk at 60%; ATTACK (now SLAM) drives it into the
  ground (30, crater, stunned 1.5 s, a kill pounds its head in); GRAB again (THROW) hurls it 16 tiles a
  second, airborne 0.35 s. It wriggles free after 3 s; being hit or rolling drops it.
- **Bodies hit bodies** (`sim/impacts.ts`): anything driving into another goblin at 6 tiles a second
  or more hurts both (1.5 per tile a second, up to 25) and passes momentum on by weight. Thrown,
  blasted, smitten or greatsworded goblins bowl their friends over; the butcher barely moves. Frozen
  ones shatter. Only a body actually closing on the other counts, so a pair never re-hits.
- **Deaths by the killing blow** (`kill(e, ev, how)`): blades take the head (it flies, eyes still
  lit, a fountain from the neck); maces, slams, blasts, smites, wall splats, body hits and any kill
  20 or more past the life left burst the body into pieces; fire leaves a charred body; ice
  shatters; thrusts and arrows drop them. Pieces fly with height and land as stains that stay.
- Headless and charred bodies stay until the respawn; burst and shattered ones leave only the floor.

## 2026-10-31 (midnight): loot that rewards execution (Claude Opus 5.5)

Kyle: weapons with modifiers so each fight drops loot and unlocks things as you progress, without
drowning in stats and meta-gaming; and more skill-based execution throughout.

- **A weapon is its kit plus at most two traits, in words.** Fine: one skill trait. Forged: a skill
  trait plus an element (named for it: EMBERFORGED GREATSWORD). One weapon per kit, so no inventory:
  stand on a drop, read the card, TAKE (F) swaps it in and leaves your old one on the floor.
- **Every trait pays off only on execution** (`shared/loot.ts`): RIPOSTE (counters x1.4 on top),
  TEMPO (dodge through a blow: next hit x2), BULWARK (a parry refills stamina), DEADEYE (a perfect
  release x1.6), CRUSHING (goblins you throw into walls take x3 slam), BRUTAL (held-fast goblins take
  x1.5 more), REAPER (a backstab or counter kill heals 10). Forged elements land only on charged
  hits (70%+), counters, full draws and crossbow bolts, never on taps.
- **Draws have a sweet spot for everyone:** release within 0.25 s of the white flash for a perfect
  shot; hold more than 0.8 s past it and the bow shakes and the shot drops to 75% (no pierce).
- **Drops:** scrappers 35% (20% forged), the butcher always (60% forged), rolled for the nearest
  player's class on a separate seeded stream (`lootRng`), fading after 45 s.
- **Progression stays sideways:** loot changes how a weapon plays, not a number that climbs. Vertical
  power comes from town (new kits, relics and augments unlocked at the smith and relic-wright; levels
  that open ability choices). No gear score.

## 2026-10-31 (late night): class kits by draw time, slower classes, class relics (Claude Opus 5.5)

Kyle after trying slice 2d: no three-shot pattern on the bow; the long pullback is great; different
bows with different draw times and damage; Mage spells the same way (a quick one, a long charge one);
every class too mobile, only the Rogue should be; keep the mage's teleport but trade it off; no blast
flask; the horn only as an ally buff for Warrior and Healer; Healer smites big, keeps the third-hit
heal, targets allies to heal and buff; different relics per class.

- **Ranged and spells are one shot per press** (`combo` of one) and a hold draws or casts; each kit
  has its own `draw` time. Longbow 1.4 s to 55 that pierces the line (only at a full draw);
  shortbow 0.55 s to 22, walk at 70% while drawing; crossbow fires on the press (`noCharge`), 34 that
  hurls light goblins, 1.15 s reload. Wand 0.6 s, staff 1.6 s to a 65 orb that bursts 2.2 wide, rod
  1 s to a piercing lance. Spells take the equipped relic's element; arrows and bolts don't.
- **Mobility:** only the Rogue walks faster than base (1.15); everyone else 0.78 to 0.92, with shorter
  rolls (1.9 to 2.4 tiles) and longer recharges (0.65 to 1 s). The blink keeps its 3.4 tiles but costs
  40 stamina and recharges in 1.6 s.
- **Healer:** third mace blow heals everyone within 3 tiles for 8; the hold (1.2 s) calls a holy smite
  onto the goblin faced (up to 6 tiles; where you point on a laptop): 70, stuns 1.2 s.
- **Relics by class** (`CLASS_RELICS`; racks and the L key are gone): Warrior javelin, hook, war
  horn. Ranger hunter's net (snares small goblins flat, slows big ones), hook. Rogue shadowstep
  (behind the goblin you face), hook. Mage lodestone (lobbed; drags goblins inward 1.8 s, then
  bursts). Healer blessing (heals 20, then 1.3x damage dealt and 0.75x taken for 8 s; most hurt ally
  on a phone, nearest to where you point on a laptop), war horn. Horn: allies within 6 refill
  stamina, regenerate it twice as fast and block at half cost for 6 s.
- **A squire** stands by the swing dummy taking hits, so the Healer has someone to heal and bless.
- Gale horn (as a knockback) and blast flask removed.

## 2026-10-31 (night, last): classes, magic augments, new relics, the world atlas (Claude Opus 5.5)

Kyle: weapon types for the other classes, more relic types and magic augments, a class button for the
demo, and start mapping the town, quests, scenarios and locations (fields, farms, towns, cities,
mines, forests; some places more wrecked than others).

- **Classes for the demo:** C or CLASS cycles Warrior (sword and shield, greatsword), Ranger (longbow,
  spear), Rogue (twin daggers), Mage (focus staff), Healer (mace and censer). Q or WEAPON swaps within
  the class (`CLASS_KITS`). Each class has its own sprite colours and hood.
- **Longbow:** taps loose arrows (stop in the first body, stick in walls); a held draw pierces every
  goblin in a line and knocks them into walls. **Focus staff:** sparks, a burst on the third, a held
  orb that bursts and throws; it casts with the equipped relic's augment (the focus relic from the
  kickoff); its dodge is a blink. **Mace and censer:** every third blow heals heroes within 3 tiles
  for 6, the held blessing hits all round and heals 10 to 30. Shots live in `sim/bolts.ts`.
- **New relics:** the gale horn (a cone that throws goblins by weight) and the blast flask (lobbed to
  where you point, or the goblin you face on a phone; bursts and throws everyone outward). A hero
  carries a rack of three (`LOADOUTS`); L or RELICS takes the next rack until the town's armoury exists.
- **Magic augments** (T or AUGMENT, on the equipped relic; `sim/elements.ts`): fire burns 4 every
  0.5 s for 3 s and spreads by touch; frost chills (half speed and turn), a second frost freezes
  solid for 2.2 s; storm arcs to the 2 nearest goblins within 3.2 tiles and to any goblin with a
  javelin stuck in it within 6 (lightning rods). Together: fire and frost make steam (cancels both,
  10 damage, stuns everything near); storm, a heavy blow, a heavy shot or a wall slam shatters the
  frozen (30); storm on the burning flares (12 and a throw). Bows shoot plain arrows for now.
- **World atlas** (Docs artifact, link in PLAN): Wickhold as the proposed town name, its districts and
  gates, five regions, ruin levels 0 to 4, eleven kinds of place, twelve objectives, ten twists.
  Proposals for Kyle to cut or change.

## 2026-10-31 (night, latest): the relic wheel (Claude Opus 5.5)

Kyle: switching relics on a phone was too slow; hold the relic button and quick-select, with only a
few relics equippable.

- Heroes carry a relic **loadout** of at most 3 (`RELIC_SLOTS`; chosen in town later). Tap RELIC to
  use the equipped one; **hold** it (0.26 s) and the carried relics fan out up and to the left of the
  thumb with their recharge shown; slide onto one and let go to equip it, let go elsewhere to cancel.
  The button shows the equipped relic's name. The fight doesn't pause (it's shared online).
- Laptop: 1, 2, 3 pick a slot directly; R still cycles; E uses. The top RELIC chip is gone.

## 2026-10-31 (night, later): kits guard and dodge differently (Claude Opus 5.5)

Kyle: sword and shield should block easiest and best; greatsword and spear need more timing; classes
should differ in speed, dodge recharge, dodge range and direction. Until classes exist, each weapon
kit carries these (`Weapon` in tuning) and they move to the class later.

| Kit | Parry window | Guard arc | Block cost | Speed | Dodge |
| --- | --- | --- | --- | --- | --- |
| Sword and shield | 0.36 s | 170 deg | 1x | 1.0 | roll 3 tiles, 0.5 s recharge |
| Greatsword | 0.20 s | 110 deg | 1.5x | 0.85 | heavy roll 2.3 tiles, 0.8 s |
| Spear | 0.24 s | 120 deg | 1.3x | 0.95 | backstep 2.4 tiles away from facing, keeps facing, 0.45 s |
| Twin daggers | 0.20 s | 100 deg | 1.8x | 1.15 | dash 3.6 tiles, 0.3 s |

- The telegraph's white parry cue uses the player's own kit window, so it always tells the truth.
- Class mapping to carry over later: Warrior (sword and shield or greatsword), Ranger (spear-like
  backstep, then Rogue's dash), Mage (a blink), Healer (to decide).

## 2026-10-31 (night): corpses ride the javelin, backstabs (Claude Opus 5.5)

Kyle: the javelin should carry the body back even when the throw kills; some classes (a rogue,
maybe a Ranger upgrade) should do more from behind, so they want to roll behind an enemy and attack.

- **Corpses ride the javelin:** a light enemy killed by the throw (or by the pin) is carried to the
  wall and hangs there (`Enemy.corpse`), fading just before it respawns.
- **Backstabs:** any blow from behind does 1.25x (`GUARD.rearMult`); behind means standing where the
  target's facing points away (dot below -0.35). No extra knockback (Kyle's Old Gods flanking rule).
- **Twin daggers** (the rogue's kit, fourth weapon on Q for now): fast 4-hit combo, weak block, 2.5x
  from behind. With daggers in hand each goblin's back shows as a purple arc, bright when you're in it.
- **Enemies turn at their own pace** (butcher 2.4 rad/s, scrapper 7) and only attack once they face
  you, so rolling past the butcher (rolls pass through) leaves his back open for a moment.
- **Design:** Ranger's subclass fork becomes Sharpshooter or Rogue (backstabs), per Kyle.

## 2026-10-31 (late): parry that lands, weapons, heavies, knockback, relics (Claude Opus 5.5)

Kyle after his first play: parrying was hard to pull off and should stun; wants animation with the
telegraphs; collision with enemies and knockback by type; combos per weapon and hold for a heavy; a
rechargeable javelin relic that pins small enemies to walls; grappling hooks; physics impacts on the
world; elemental modifiers later, all as relics.

- **Parry:** window 0.18 s to 0.30 s before the hit; the telegraph turns white for exactly that
  window (the cue is the judged window); a parry **stuns** (butcher 2.2 s, scrapper 1.8 s) with
  "STUNNED", stars and a slump; stunned or pinned enemies take 1.5x; counter window 1.1 to 1.6 s.
- **Weapons** (`WEAPONS` in tuning, Q or the WEAPON chip): sword and shield (3 slashes, best block),
  greatsword (2 wide slow sweeps, big knockback, weak block), spear (4 quick thrusts, long reach).
- **Hold to charge:** a tap swings on release; holding past 0.18 s charges (slower walk, gold glow,
  white ring at full charge at 0.9 s); release for the weapon's heavy, damage and knockback scaling
  with charge. A strong heavy (70%+) flinches the butcher out of his wind-up.
- **Bodies and knockback** (`sim/bodies.ts`): nobody walks through anybody (lighter one gives way;
  rolls pass through); every blow pushes by its knock divided by weight (scrapper 0.6, hero 1,
  butcher 3.5, dummies immovable); a fast slide into a wall or pillar is a wall slam for 6 and a crack.
- **Goblin scrappers** (two): small, quick stab with a short telegraph, flinch on any hit.
- **Animation with every telegraph:** the butcher hauls the cleaver back, trembles, chops with a smear;
  for the slam he leaps, hangs, comes down squashed with a crater, debris and a shockwave. Scrappers pull
  the knife back and lunge. Swing dummy winds its club up.
- **Relics** (E or RELIC, R or the RELIC chip to swap; each recharges): the **relic javelin** carries
  anything weight 1 or lighter to the first wall or pillar and **pins** it there (2.6 s, +12), sticks
  into heavier bodies, stays in the world 9 s; the **grappling hook** yanks light enemies to you
  (arriving stunned) or pulls you to walls, pillars and heavy enemies. Phones auto-aim relics at the
  nearest goblin in the relic's range.
- **Marks on the world:** slam craters, wall cracks and blood stay on the floor and walls.
- **Next for relics (Kyle):** elemental modifiers that play off one another; keep relics data-driven.

## 2026-10-31: slices 1 and 2, the training room (Claude Opus 5.5)

- **Kyle's calls carried in from the kickoff doc:** Relic; three-quarter view; click or tap to
  attack; one button to block (hold) or parry (tap on time); parries open a counter; dodge roll;
  big enemies telegraph on the floor, some unblockable; the lit pixel look from the style mock.
- **No Phaser for now.** The approved look is per-pixel stepped lighting with dither. A small custom
  renderer does it directly: paint the scene flat at low resolution with Canvas 2D, then one WebGL2
  pass lights it and lays the glowing layer on top. About 40 KB of script, nothing to fight. Phaser
  (or Tiled tooling) can come back when maps need it.
- **Timings (first pass, `src/shared/tuning.ts`):** parry window 0.18 s before the hit (re-presses
  within 0.35 s don't reopen it), counter window 1.1 s at 2.5x, roll 3 tiles in 0.32 s untouchable
  from 0.04 to 0.26 s, block chip 15% at 1.4 stamina per point, butcher cleave wind-up 1.0 s, slam
  1.3 s (unblockable, striped edge, "!" over his head). Each hero has a `lenience` for online ping.
- **Phones aim for you:** with no mouse, an attack or a block turns the hero to the nearest enemy
  in reach, so a parry faces the right way.
- **Relay copied from Come Bye** with its keys renamed (`rl:`); its 16 tests pass here. Not wired to
  the client until slice 3.

## 2026-11-01: talk, not lines (Claude Opus 5.5)
Kyle: the writing read like Claude, too direct, every sentence a punchline. Read the books' excerpts and
wrote prose-notes.md (long wandering sentences, hedging, detail before name, jokes last, short lines rare).
Added .claude/agents/line-editor.md as a second pass after the lore keeper. In the wood, dialogue that
can freeze the world waits for a tap (Kyle's ask); a card goes on with a tap anywhere, because the card
covered the stick and the move card never let go on a phone. Captions now stay up a third of a second a word.

## 2026-11-01: lines that speak (Claude Opus 5.5)
Kyle asked for typing with little sounds and emphasis that moves and colours. speech.ts types every
spoken line (wood dialogue, captions, town panels' quoted lines, Orla) a letter at a time with a per-speaker
voice blip, and reads a small markup: *bold*, ~sway~, ^good^ (green-gold), _bad_ (red, trembling). A tap,
click, Enter or action key finishes a line before it goes on. A panel redrawn in the same sitting doesn't
retype. Found while testing: the first frame could step time backwards and skip Hew's waking; the loop now
never steps below zero.

## 2026-11-01: daylight, dodges, and a wood for each class (Claude Opus 5.5)
The wood is in daylight (Theme.day: no moon pool or hero lanterns). A roll out of a blow's reach during its
wind-up now counts as a dodge (judged from where the roll started); a roll through it as it lands staggers
a close attacker for 0.6 of a parry's stun (DODGE.stun; not archers) and shows LAST SECOND. The wood's
lessons are per class (lessonsFor): Warrior and Healer keep block and parry; Rogue learns blows from behind,
Ranger and Mage full draw or charge, and all three the last-second dodge in place of parry, with goblins to
suit. Hew says one line about each class while he looks you over. The light classes can still hold a block
in the game itself; the wood just doesn't teach it (Kyle to decide whether they should lose it).

## 2026-11-01: each class guards its own way (Claude Opus 5.5)
Kyle: Warrior and Healer hold a block and parry; Ranger and Rogue can parry with good timing but never hold
a block; the Mage can neither, and blinks out instead (cooldown 1.6 to 2.6 s, a little further) leaving an
image for 2.5 s that goblins near it go for (DECOY; nearest() hands them a stand-in at the image). The Rogue
is quicker (speed 1.22; dash 4.3 tiles, 0.22 s cooldown, cheaper). CLASS_GUARD in weapons.ts; the class
detail shows a GUARD line; on a phone the block button reads PARRY for Ranger and Rogue and is gone for the Mage.
Later: a Rogue relic that slides behind the goblin instead of a straight dodge (Kyle's idea).

## 2026-11-01: Hew's death staged, the Stoker's charge, the relic found, kills that vary (Claude Opus 5.5)
Kyle: the old ending was weird (Hew teleported, the Stoker spun). The cut is now beat by beat (CUT in
sim/wood.ts): Hew walks round the hut, the ground rumbles, the Stoker rises behind the cordwood, runs him
down, lifts him (Npc.lift), bites (headless pose, blood, shake), throws the body onto its cordwood pile (kept,
not wasted, so "this one I keep" still reads two ways), turns and bellows (big shake, roar). The Stoker gains a
charge: a broad striped lane, unblockable, and no blow flinches it; it stuns itself on a wall or tree. Killing it
stops everything for a relic card (FOUND / RELIC JAVELIN) with the javelin held up in a ring of light and a
rising run of notes; then a gold arrow points to the road. Blade kills now vary: cut down (most light blows),
cut in two at the waist (most heavy blows), and only now and then the head. The Rogue's knives do half head on
(front: 0.5) unless the goblin is held fast. Ranger and Rogue holding block get "CAN'T BLOCK: TAP TO PARRY";
a Mage pressing it gets "NO GUARD: ROLL"; the HUD kit line says so too. In town, a panel stops the world.

## 2026-11-01: the pack by dragging; goblins in each other's way; the Warrior's throw (Claude Opus 5.5)
The pack (I, Tab, PACK) is now slots: WORN (hand, armor, two rings, relic), SPARES (8 and a DROP square),
the relic shelf and the belt. Drag a piece onto its slot to wear it, into the pack to take it off (armor
too: GEAR.unarm), onto DROP to drop it (or pour a potion); tap one for its card and buttons. Pointer events,
so mouse and finger both (packdrag.ts); the rules live in moveOf (tested). Goblins now hurt their own: an
arrow that misses you takes the first goblin in its line (x1.5), and a butcher's sweep, slam or charge
catches small goblins under it (FRIENDLY). The Warrior's field in the wood adds a grab-and-throw beat with
the second pair of looters. Found while testing: a hero who skipped the wood got a black screen in town
(the wood's fade stayed up); fixed, and the fade only ever shows in the wood.

## 2026-11-01: the field the day after; fire (Claude Opus 5.5)
Kyle: more evidence of a battle when you wake, the looters already eating rather than appearing, and fire
that looks like fire. The field now has the column's dead lying where they fell and in heaps (FIELD_DEAD,
drawn as corpses: on their backs or sides, blood under them, now and then an arrow still in them), dead
goblins among them (GOBLIN_DEAD, cut down, in two, beheaded), and the field's looters crouched at the heaps
(Enemy.feeding: they stay put, head down, and don't look up until you come close or the lesson starts).
The three wagons burn for show (Block.smoulder) and are drawn as wagons (plank bed, hoops, spoked wheels,
charred). Fire is redrawn everywhere: tapering tongues white to red, licks tearing loose, embers, a thick
rolling smoke column.

## 2026-11-01: the hook is the first relic; in town only the one you talk to stops (Claude Opus 5.5)
Kyle: the Stoker hauls you in with a hook, so its relic is the grappling hook, not the javelin (the javelin is
the next found). The hook pulls by weight: a small goblin comes to you; anything heavier, or a wall, pulls you
to it (a second dodge for the light classes); a Warrior or Healer can haul in up to a butcher (HOOK.heavyYank),
which arrives angry rather than reeling. The town no longer pauses for a panel (the town is shared online);
instead whoever you're talking to stops their round (Npc.heldAt/lag) and picks it up after.

## 2026-11-01: the Ranger gets its own (Claude Opus 5.5)
Kyle picked the hound and snares. The Ranger taps for a short sword (RANGER_BLADE, two quick cuts) and holds
to draw the bow (all three bows, the crossbow included, now draw on a hold). Its dodge is a jump back
(RANGER_JUMP) that leaves a snare where it stood (SNARE: one every 7 s, two down at most, holds a small
goblin, slows a butcher). A hound runs at its heel (sim/ranger.ts): now and then it goes for what you've
been hitting (or the nearest small goblin), bites a few times and comes back; nothing can hurt it, but a
butcher winding up near it sends it off for 14 s. No hound in the wood. The class pick shows a HOUND line.

## 2026-11-01: the javelin again; the Stoker calls twice; goblins at the dead on jobs (Claude Opus 5.5)
Kyle: back to the javelin as the Stoker's relic (the hook is the next found; its weight rule stays). The
Stoker bellows for help twice, at two thirds and one third of its health (STOKER_CALLS; the second wave is
bigger, with a lunger). Out on jobs, most rooms (60%) have a heap of the dead (one or two bodies, dressed for
the place) with one to three goblins at it, feeding: facing the body, leaning in, tearing a piece back, red
flicking off, wet chewing you can hear within 8 tiles. They see you at half the usual distance while they eat.

## 2026-11-01: a Rogue earns it; dodges cost more; skills on 20 s (Claude Opus 5.5)
Kyle: the Rogue's knives find one goblin a blow (the nearest in reach: Weapon.single), and a head-on blow
doesn't knock anything off balance (only from behind). Every dodge costs half again its stamina for now
(DODGE.cost 1.5; the Rogue's dash 18 before that), so there's something to grow into: perks, gear and levels
will bring it down. Class skills (War Cry, Hunter's Net, Shadowstep, Lodestone, Sanctuary) are on 20 s
cooldowns while heroes are low level; shorter cooldowns and new abilities come with levels later. Relics
(javelin 6 s, hook 4 s) unchanged for now.

## 2026-11-01: relics on 10 s; the Mage channels; sound on a silenced iPhone (Claude Opus 5.5)
Relics recharge in 10 s (javelin, hook). The Mage's class skill is Elemental Channel (CHANNEL; Lodestone stays a
relic): it stands still 2 s (anything that hurts it breaks the channel), then its spells turn to the next element,
fire, frost, storm, round again, kept from room to room (profile.augments.channel). Fire: the tap is a firebolt,
the hold a fireball that bursts and sets them burning. Frost: the tap is three icicles in a fan, the hold a burst
that freezes solid. Storm: every spell jumps to the next goblin. A rod's lance keeps piercing (its element rides
the line, no burst). The HUD kit line shows the element. Kyle heard no sound on his phone: iPhones play web audio
on the ringer channel, so the silent switch mutes it; the first tap now loops a silent clip on a media element,
which moves the page to the media channel.

## 2026-11-01: hosting plan (Opus 5.5)

- `api/room.ts` maxDuration is 300 s, not 800: Vercel Hobby refuses a deploy that asks for more
  than 300, and sockets swap every 4 minutes anyway, so 300 works on Hobby and Pro alike.
- Start on Vercel Hobby plus Upstash Redis on pay as you go with a monthly budget cap (rate limited
  at the cap, never billed past it). Move to Vercel Pro ($20 a month, $20 of usage included) only
  when real players arrive; Hobby is non-commercial and pauses when over its limits.

## 2026-11-01: Ranger playtest fixes (Opus 5.5)

- The hound is with a Ranger from the waking in Greyhollow on (Kyle's call; overrides the bible's
  "joins at the north gate").
- Hew creeps in at the waking: out of the trees west of you, round behind the feeding looters,
  crouched (drawn squashed, slower bob) until he hauls you up. Hew's start moved to the west edge.
- A dodge that clears the blow (a Ranger's jump back, or any roll out of range) staggers the attacker
  when it started within the dodge's i-frame span of the blow landing, same as rolling through.
- Netted, the Stoker can't start a charge or a hook throw, and loses one it was winding up.
- Functions run in sfo1 (San Francisco), next to Kyle and his friends; the Upstash database goes in the
  matching west region so each publish is a short hop.
- Vercel project `relic` created on the SomwhatRogue team, linked to SomewhatRogue/Relics; every push
  to main deploys.
- Relic shares Come Bye's Upstash database for now (upstash-kv-amethyst-compass, sfo1, Free plan,
  which allows one database per account). Relic's keys all start `rl:`, so the two never collide;
  they do share the 500K commands a month. Moving to pay as you go (budget capped) is the step when
  either game gets regular players.

## 2026-11-01: the shared town (Opus 5.5)

- Online shape (Kyle): no join codes. Wickhold is one shared hub; parties form at the board; a job
  is a shared instance run by the party leader's browser; world quests need 3+ in town.
- The town has no host. Each browser runs Wickhold (its people walk on the clock), and each player
  only says where their own hero is, through a peer room on the relay (`want=peer`, room
  WICKHOLD1). Nobody leaving can break the town. `src/client/townfolk.ts`; `src/client/relay.ts`
  is Come Bye's reconnecting socket (heartbeat, visibility check, 4-minute swap).
- At most 4 messages a second while moving, one every 3 s standing; silent 12 s means gone.
- Online is on only in the Vercel build (`VITE_ONLINE=1`) or with `?relay=`; the one-file artifact
  build stays offline. `npm run test:online` runs three real browsers against a local two-instance
  relay (`scripts/online-server.ts`).
