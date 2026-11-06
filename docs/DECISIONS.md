# DECISIONS

Newest first. Each entry says what was decided and why, signed with the model.

## 2026-11-06: more town pastimes: arm-wrestling and knives at the Drowned Rat, and striking at Halvard's anvil (Claude Opus 5.5)

The next three from `docs/plans/town-activities.md`, built exactly as the first pastimes (below): a game runs only in
your browser, two presence words a game, nothing a tick, outcomes from seeded per-hero counters a refresh can't roll
again. Phone first (one button: a finger anywhere), with the mouse, Space or Enter on a laptop, Escape the way out.

**Parked in a hall** (`shared/pastimes.ts`). The `pastime` mode now takes `arm`, `knives` and `anvil` besides `fish`
and `range`, each with its place (`placeOf`): `Game.enterPastime` works only in that place (the square, THE DROWNED
RAT, THE FORGE; not the wrong hall, not the yard), so the parked word's `at` is the hall's and only those in it see
you. The parked idles (`client/parkedrat.ts`, through `parked.ts`, `idlepose.ts` and `idledraw.ts` as before): at the
table, sat with an elbow down and your hand locked in the regular's, rocking (3.2 s); at the knife board, side-on,
knife up, a throw that streaks off up to the board, the next in hand (2.4 s); at the anvil, the hammer up, down on a
glowing piece in sparks (1.2 s). One-button games share `client/pastimeloop.ts` (`OneButton`: the park, the overlay
`pastimehud.ts`, presses counted so a tap is never lost, fixed steps, the card, getting up).

**The Rat** (`shared/townhalls.ts`): widened from 15 to 18 tiles, everything that was there where it was. Past
Whisper's booth, the **knife board** hangs on the back wall (a `knifeboard` hang: a round of elm, painted rings, a few
knives in it, chalk tallies) with a chalk line under it; **A CARD SHARP** (already in the Rat) now keeps it (talk
`knives`; his old line about Whisper is gone). By the door, the **arm-wrestling table** (a new `armtable` piece,
flat and 2.5D), with **A WATCHMAN OFF DUTY** at it (talk `arm`; the watch drink at the Rat, story bible). No new
names: the regulars are the drunk, the card sharp and Gannet, who are in the Rat already, and one of the watch.

**Bets** (`shared/stakes.ts`): the dice's own (`Game.dice`): 10, 25 or 50, never more than you have, even money. A bout
takes longer than a throw of the bones, so the stake leaves the purse as the bout starts (saved with the bout's
count) and comes back doubled only for that bout, once (`settleStake` matches the game and the bout's number, then
clears it). A refresh mid-bout: the stake's gone and nothing pays; a stake left lying is replaced (lost) when the next
goes down. Every game also has a way to play for nothing (FOR NOTHING, JUST THROW).

**Arm-wrestling** (`shared/armwrestle.ts`, `armtune.ts`; `client/armmode.ts`, `armview.ts`). The bar up the right
edge is your grip: hold and it climbs (1.3 a second), let go and it sinks (1.1). The sweet spot is a band that drifts
on the seed (`wave`, no Math.sin); in it you push their arm over (their `give` a second, half again in its middle
share), out of it they push yours (`push`). Now and then they heave: 0.6 s of tell (the band goes red, HE'S GOING
FOR IT), then 0.9 s shoving the band away at 1.8 times the push. From 16 s they tire of it and push 8% harder a
second, and 45 s is the most a bout goes, so it always ends. The band never moves faster than a grip can follow
(tested). Four regulars, weakest first, each with the most they'll bet:

| | band (half) | drift, speed | push | give | heaves every | bet up to |
|---|---|---|---|---|---|---|
| A DRUNK | 0.15 | 0.22, 0.14 | 0.10 | 0.15 | 5 to 8 s | 10 |
| A CARD SHARP | 0.12 | 0.26, 0.26 | 0.14 | 0.14 | 3 to 5 s | 25 |
| A WATCHMAN OFF DUTY | 0.11 | 0.26, 0.20 | 0.20 | 0.13 | 3.2 to 5.5 s | 50 |
| BARKEEP GANNET | 0.10 | 0.27, 0.23 | 0.24 | 0.12 | 2.6 to 4.4 s | 50 |

A bot that holds under the band and lets go over it, seeing it 0.15 s late, beats all four (Gannet in about 9 s);
0.23 s late it beats the drunk, the sharp and the watchman and Gannet a quarter of the time; 0.33 s late the
drunk and the sharp, the watchman half the time, Gannet never. The card: who went down, the money, time in the band,
bouts and wins (`Profile.arm`: bouts seed the next, wins, who you've beaten).

**Knives** (`shared/knives.ts`, `knifetune.ts`, `knifeboard.ts`; `client/knifemode.ts`, `knifeview.ts`). Nine knives
at a board of radius 24 (rings 10, 8, 6, 4, 2 from the bull). The knife's point sways with your hand (two `wave`s
each way, 30 px); the longer you hold a knife the wider (22% a second, up to twice), and each knife of the round a
little quicker. Throw (a tap) and it lands where the point was, give or take a small seeded wobble; 0.7 s to the next.
**A Rogue's sway and wobble are 0.62 of anyone else's** (tested: the same thrower scores more as a Rogue), as a
Ranger's sight is at the butts. With a bet, the card sharp throws first (`houseScore`, 44 to 72, from the round's seed
on a stream of its own) and you beat it; a tie is his, as Moll's are. A bot that waits for the point to come over the
middle and lets go 0.1 s off scores about 63 as anyone else and 77 as a Rogue; one that throws on the moment beats
him more than six times in ten (as anyone else), a careless one less. The best is on the hero (`Profile.knives`). **The town's board**, cheaply, as the butts': at
the end of a whole round that beats your line, one contribution (`knives: { n, throws: frames[] }`), replayed from
the hero's seed by `contribute` (`replayKnives`: exactly nine, in order, each when a knife was in hand, within ten
minutes) onto `WorldState.knives` (each hero once at their best, the top ten); on the server it takes the range's
short path (`api/_world.ts`: WATCH, GET, MULTI, SET, EXEC). STOP before the ninth posts nothing and loses any bet.

**The anvil** (`shared/forgestrike.ts`; `client/anvilmode.ts`, `anvilview.ts`; the forge as it was in `stores.ts`).
Kyle said the forge is decent, so it's the same: a worn piece's card has UPGRADE TO +N (Halvard does it) and, beside
it, STRIKE IT YOURSELF TO +N, the same price. Striking pays and makes the upgrade first (`Game.levelUp`, exactly what
UPGRADE does), so handing the hammer back early, or a refresh, leaves you with the plain upgrade. Then at the anvil:
the piece glows up and fades six times (peaks 0.95 to 1.35 s apart, seeded); strike as it's brightest, three times.
Within 0.08 s of a peak is CLEAN, within 0.17 NEAR ENOUGH (half), else TOO COLD; one strike a glow. What it adds is
the piece's **temper** (`Item.temper`, in levels, `shared/gear.ts`): quality times `TEMPER.max` (0.2 of a level)
times a draw from 0.75 to 1 on the strike's seed (the hero and their count of strikes, `Profile.strikes`, counted
before the first blow). So a perfect set adds 0.15 to 0.2 of a level, a cold one nothing; a piece struck perfectly
at every level to +5 has at most one level's worth more, and `temperOf` caps any save at 0.2 a level. `gearStats`
counts it as level (mods, damage, toughness, ring health), so the room fights with it online too, and the card says
WELL STRUCK: its upgrades count for N% more.

**Art** (in code, lit by the town's hour through `light.ts`: `PastimeCanvas` takes an indoor ambient, a little
brighter by day): the regular across the table (their own skin, hair, coat; the face screws up as you push), the
locked forearms tipping, a candle, the bar with the band; the knife board on its planks, the knives stuck in it, the
sway's little cross, your hand at the foot, the knives left; the forge's mouth and coals, the anvil, the piece in
Halvard's tongs from the left glowing dull red to near white exactly as `glowAt` says, your hammer, sparks, three
notches. **Sounds** (the existing kit): coins for a bet and a payout, a growl at a tell, the heavy thud of a heave,
the slam and fanfare or drop at the end; the throw, a stick, the perfect chime for a bull, a thud
wide; the anvil's ring, the chime for a clean strike, the dull knock for a cold one, steam at the end.

**Words** (`client/pastimewords.ts`: ARMW, KNIFEW, ANVILW; none through the lore keeper or line editor yet): the
watchman's offer and his line on each regular, the hints, the tell, the cards, the bets; the card sharp's offer and
his line to a Rogue, the board, the cards; Halvard's three short lines, the forge's choice and the card's WELL STRUCK.

Tests: `tests/ratgames.test.ts` (letting go or holding on regardless loses; in the band you push; a careful player
beats all four and each is harder than the last; the tell, the heave, tiring, every bout ends; the band never outruns
a grip; the same seed the same bout; the rings; nine knives, one in hand at a time; the sway widens held and a Rogue's
is smaller and scores more; a round replays exactly and made-up ones don't; his round from the seed and in range; the
board takes only replayed scores, once; the bets' limits, even money, never paid twice or for another bout, a stake
left by a refresh lost), `tests/forgestrike.test.ts` (glows peak and fade; clean, near enough, too cold, one strike a
glow; the edge at most a fifth of a level and at least three quarters of that for a clean set, nothing cold, the same
from the same seed; to the cap still under a level; a save can't claim more; skipping is the old upgrade exactly; the
worn piece gets it and the hero fights with it), `tests/ratpresence.test.ts` (each of the three: one word to sit,
none in five minutes of play, one to get up, the friend in the hall sees it drawn; each only in its own hall; the
table, board and anvil laid out, the spots clear and near who keeps them, everyone who was in the Rat still there).
Full suite 1402 passed; tsc clean. town-online passes with the new steps (Sam at the table and Ava at the board seen
by Kyle in the Rat, one word each to sit, none in eight seconds of play, one to get up; Sam at the anvil seen in the
forge, one word, none while striking, one to hand it back); party-online 28 of 28 (two runs before that each
flaked one different guest-feel frame check, as noted under "elites"; nothing in the party or fight code changed).
Shots: `node scripts/ratgames-look.cjs <url> shots/ratgames` (phone and laptop, each game mid-play and its card, the
panels, the Rat inside, the forge's choice); friends parked at the Rat and the anvil from `scripts/town-online.cjs`
(`shots/ratgames/rat-parked-phone.png`, `forge-parked-phone.png`).

## 2026-11-06: elites, and the first new meaty goblins: the Planker, the Swingle, the Forker (Claude Opus 5.5)

Kyle: "things that take a few hits", "a mix of splatting and tactical", "harder kiting", and "I donlike [sic] moments of
being able to plan attacks and strategic elements but also sometimes you just get swarmed". Items 3 and 4 of the
rollout in `docs/plans/bosses.md` (section 3: elites, the six new meaty units, the composer). Built: three affixes
and three units. **Not built:** Oil-soaked, Hornblower and Smouldering (each wants a new delayed hazard or a spawn
in the room; left for the next pass), and the Kegman, Pouncer and Gorger.

**Elites** (numbers `shared/elites.ts`, rolled `shared/eliteroll.ts`, played `sim/elite.ts`, drawn `client/elitedraw.ts`):
- *Chance and caps*: each meaty goblin of a pack (brute, ironhide, shield, and the three new sorts; never the
  log-carriers or a BIG ONE) from a job's second room, 10% plus 5% a point of ruin; one a room, two on a deep job.
  One or two affixes (a second 15% plus 5% a point of ruin), a third only on a deep job (25% of those with two).
  Rolled on a stream of its own as the composer picks each band's template, so the room plans for it.
- *Threat*: its sort's points times 1.5, plus 1 an affix (`foeThreat` reads `elite`, so the on-screen caps count it
  too). An elite is laid only if the room can still pay for it (a small one kept for every band) and its pack stays
  within a lone hero's screen; what's spent on it comes off what the room lays after it. Over days 1 to 40 of the
  board about 70% of the rolls that hit land (a shield wall, or a brute with an ironhide, already fills the screen):
  31 elites in 520 rooms past the first, about one room in seventeen.
- *Plated* (grey plates, the ironhide's own, askew and cracked gold once broken): the ironhide rule (`armoured` in
  `sim/ironhide.ts`): a fifth of anything until a charged blow, a perfect, or storm (a jolt, a rod: a Plated elite
  draws lightning as an ironhide does) breaks the plates for 3 s.
- *Quick* (dust at its heels, unlit): 1.25 times its pace; wind-ups 0.85 as long but never under 0.9 s (red) or
  1.1 s (striped), and never longer than they were; locked in `begin`, so the telegraph is the one judged. A pack
  rush keeps the rush's own clock.
- *Gorging* (blood to the chin, dripping): eats a small one's body as a butcher does (`sim/meal.ts`, the same red
  ring round the body, GORGED), in 2 s, healing 30% (no FED). A hero within 1.5 tiles keeps it off; burn the dead
  (ash feeds nothing) or hit it hard off its meal.
- *Loot*: drops a piece 35% of the time (a small goblin 2%), rolled 2 levels up the party's level curve
  (`leanOdds`), the item's own level as the party's.

**The three units** (numbers `shared/meaty.ts`, rules `sim/meaty.ts`, kits `client/meatydraw.ts`, sprites
`client/meatysprites.ts`; drawn 1.2 times a small goblin, in its greens with the glowing eyes; the 2.5D box figures
in `three/goblins3d.ts`). Each 4 threat (meaty), a template of its own with `beats: ['tactic', 'closer']`, never in
a rush (its own trick), burns half as long, and no quick blow breaks its wind-up (`small` leaves them out).
- **The Planker** (proposal; was "the Doorman", renamed at the lore keeper's flag so it doesn't crowd the
  Doorkeepers and Turnkey): 120 health, a barn door on its arm. Its front (within about 70 degrees either side)
  takes nothing at all: blades, a charged blow, a perfect, any shot (lightning too). Bursts and fire go round it,
  and it's open when stunned, frozen, netted or caught unaware. It turns at 1.6 radians a second (a small goblin's
  7) and not at all through its bash (a red 110-degree wedge, 1.0 s, 14, knock 9) and the 1.3 s after it.
  Answer: block it or dodge it, then step to its side and hit it in full.
- **The Swingle** (proposal): 100 health, a threshing flail. A hero within 2.1: it spins (a striped ring of 2.3
  round itself, 1.3 s, 16, knock 10), then reels, stunned for 1.5 s, so blows land 1.5 times as hard (the stunned
  rule). Answer: walk out (Warrior, Healer) or dodge out (Ranger, Rogue, Mage), then punish.
- **The Forker** (proposal): 90 health, a pitchfork. From 3.2 tiles it jabs a red lane (0.9 s, 12, knock 13: it
  pushes you well off). The lane starts at its tines (1.2 tiles plus your body's width out), so inside 1.2 tiles it
  can't touch you; it backs off at 0.6 of its pace, slower than you walk. Answer: block the jab and walk in, or
  dodge in through it.
- *Fair*: every blow telegraphed (red for the bash and the jab, striped edge for the spin) and begun only within
  3.7 tiles of its hero, so never from off screen.

**How they bleed in** (`shared/debut.ts`; board days, the live world about day 60): staged, then rare (home region
only, one room a job, weight 0.6), then common (weight 1.5, anywhere a fight or a closer fits):

| | staged until | rare | common from | staged in |
|---|---|---|---|---|
| Planker | 61 | 62 to 64 | 65 | Barrowfields DRUMS: before the war band, two small ones with it |
| Swingle | 63 | 64 to 66 | 67 | Barrowfields SMOKE: before the house that's catching, two small ones with it |
| Forker | 65 | 66 to 68 | 69 | Barrowfields CRIES: along the captives' track, one of their guards (as the chalker) |

The staged ones are placed with no dice (`shared/meatystage.ts`); the composer leaves their packs be, counts them
in the room's specials and budget, and in such a room keeps back a small one for every band.

**Online**: nothing new a tick. `elite` is set once as the goblin is made; a Swingle's `spinAt` and `reelAt` once a
spin. The door, the tines and the quick wind-ups are worked out in the room; the client reads the attack it's sent.

**Measured** (`npx tsx scripts/encounters/clear.ts [days] [first day] [off]`, now with a first day and a switch; the
bot now plays the Planker's and the Forker's answers, as a player who knows them would, and still dodges nothing):

| 48 rooms | daggers: s a room, health lost | staff: s a room, health lost | daggers / staff time, health |
|---|---|---|---|
| days 1 to 6, off | 43.4, 304 | 46.4, 275 | 0.94, 1.11 |
| days 1 to 6, on | 44.0, 306 | 47.1, 280 | 0.93, 1.09 |
| days 70 to 75, off | 38.0, 267 | 48.9, 361 | 0.78, 0.74 |
| days 70 to 75, on | 38.3, 243 | 50.1, 371 | 0.76, 0.65 |

"Off" on days 1 to 6 is exactly the pacing entry's "after", so nothing else moved. The gap that pacing closed (the
daggers losing more than the staff) stays closed; on the later days the staff now loses a little more (it stands at
1.7 tiles, on the Forker's lane, and in the Swingle's ring: it doesn't walk out). Kyle's play is the real measure.

**Pins**, re-pinned only after the switch-off check: with `ELITE.on` and `MEATY_ON.on` false the layout-3 pin is
still 2459865809 and the layout-4 pin 1775586545. On: layout 3 is 2219083919 (15 of 388 rooms moved, goblins only:
hashed without goblins 1177230441 either way); layout 4 is 104248273 (17 of 280 moved: 15 in goblins only, 2 with
an elite where the chest moved too, the composer's goblins falling back on the room's own spot finder a different
number of times, as with pacing).

Tests: `tests/elites.test.ts` (none in the first room, the chance against what lands, one a room and two deep, the
switch, threat and the budget, Plated's fifth and its three breakers, Quick's wind-ups and floors and pace and a
block of it, Gorging's meal and heal and the burned body that feeds nothing, the loot bump, `elite` sent once, the
same rooms and fight twice); `tests/meaty.test.ts` (each unit's blow landed, blocked by sword and mace, dodged by
daggers, longbow and wand; the Planker's front and side, shots, the flank after a block and after a dodge, the slow
turn; the Swingle's ring, walked out of, the reel and its punish; the Forker's lane, the push, inside the tines, it
never jabs there; 4 points and the beats; debut days one after another; staged in DRUMS, SMOKE, CRIES in the
Barrowfields only; none in the packs while staged, some once common; nothing begun from off screen; determinism).
`noparry.test.ts` picks up the spin as a striped blow every dodge class slips. Full suite 1288 passed; town, party
and expedition online scripts pass. Shots: `node scripts/elites-look.cjs [url] [dir]` (phone: each unit winding up,
each affix, all of them; flat and 2.5D).

**Beside the boss kit** (merged with main after the Doorkeepers): a boss is never an elite (its arena is planned
on its own, with no composer and no pacing; `packOnto` and the composer drop an elite on anything with `boss`; Quick
never touches a boss's wind-up, so its tell pose is always added in full). The Planker's barn door
(`sim/meaty.ts plankFaces`, keyed on the variant, its door shut through its own bash) and a Doorkeeper's
(`sim/doorwall.ts`, keyed on `boss`, swung aside while its blow lands) share no code and never read each other: one
is a goblin to get round, the other a boss's job with straps and POISE (tests in `tests/elites.test.ts`). The
threat budget doesn't reach the barn. Pins after the merge: unchanged (switched off, main's 2459865809 and
1775586545). Full suite 1347 passed; town, party (one guest-feel frame check flaked once, then 28 of 28), expedition
and Florida online pass.

**New words** (for the lore keeper, then the line editor; code and docs only for now, nothing on screen names a sort
or an affix): Planker, Swingle, Forker; Plated, Quick, Gorging; the templates' plain words "a planker behind its barn
door, and a few small ones", "a swingle with its flail, and a few small ones", "a forker with its pitchfork, and a
few small ones". On screen only what was there: BLOCKED over a blow the barn door takes, GORGED when an elite eats.
## 2026-11-06: the first town pastimes: fishing at the millpond, and the archery butts (Kyle; Claude Opus 5.5)

Kyle: "All mini games will happen locally on their own computer, not in town too, but in town you can see their
character sitting and fishing or something, even if they're not moving beyond an idle animation, till they rejoin
the town and then it checks again." Plan: `docs/plans/town-activities.md` (fishing; the lodge's archery range).

**Parked in the shared town** (`shared/pastimes.ts`, `client/townpresence.ts`, `townfolk.ts`, `parked.ts`). A new
Game mode, `pastime` (`Game.enterPastime`, `leavePastime`): only from the open town, the hero goes to the pastime's
spot facing its water or targets. The town socket stays open (closing it would make the relay say `left` and you'd
vanish), and the `me` word carries `g: 'fish' | 'range'`: it's in what the others last heard (`gist`), so it goes
once; while parked the 2-minute keep-alive beat is off too, so nothing more goes out however long you play. A
newcomer's `hi` still gets its one answer (with `g`), so they see you parked. Getting up clears `g`: one more word.
So a game costs two words. Others mark a parked hero (`setPark`, a WeakMap, nothing on the Hero type) and keep them
an hour without a word (`PARKED`, not the usual 5 minutes); a real goodbye from the relay still takes them at once.
Drawn by `idlepose.ts` and `idledraw.ts` through `parked.ts`: fishing, sat on the bank (crouched as low as the legs
fold), the rod out over the pond, a sagging line to a red and white float that bobs and every 5.5 s dips with rings,
a creel beside them, the weapon laid down behind; at the butts, side-on with the range's bow up toward the targets,
draw, hold, loose (an arrow streaks off), nock, every 3 s, staggered by id. Only this screen's clock; tested against
a counting socket: ten minutes of fishing sends nothing, a newcomer gets one answer, getting up one word. Online
(town-online.cjs): Kyle saw Sam parked fishing and Ava parked at the butts; one word each to sit down, none in eight
seconds of play, one each to get up.

**Where** (`shared/town.ts`). There was no water in Wickhold: a **millpond under the east wall** where the mill
stream comes in (deep water 49.6 to 53 across, 30.4 to 36.8 down, reeds round it), between Rescue Row and the wall.
**Old Pennock** (elder) stands on its bank and lends rods (talk `fish`). The **archery butts** are the three targets
already in front of the hunters' lodge; **Corin** (ranger look, Maeve's) keeps them (talk `range`). Both open a
panel with the way in; CLOSE or walking off is the way out, and each game has its own button back to town (PUT THE
ROD BACK, STOP then BACK TO TOWN; Escape on a laptop).

**Fishing** (`shared/fishing.ts`, `fishtune.ts`; `client/fishmode.ts`, `fishview.ts`, `fishart.ts`). Just for fun:
no pay, no board. One button (a finger anywhere, the mouse, Space). Hold to swing the cast meter (empty to full and
back in 1.4 s), let go: the cast goes as far as it showed. The float flies 0.6 s and lands; the bite comes 2.5 to 7 s
later, plus up to 4 s on a long cast, with up to three nibbles (0.35 s twitches) first. Tap while it's under (1 s):
on. Tap on a nibble or on nothing: too soon. Miss the second: it's gone. Then hold to reel and let go when it runs:
tension moves at 1.1 a second toward 0.5 reeling or 0.08 not, plus 0.65 times the fish's pull while it runs; 1 snaps
the line, under 0.2 for 2.2 s and it throws the hook. Reeling brings it in 2.2 m/s at rest, 0.3 of that while it
runs; let run, it takes line. Runs and rests come on the fish's own clock, with a 0.45 s warning (IT'S ABOUT TO RUN).
A small fish can be reeled straight in; a big pike can't. The tension gauge across the top shows SLACK, green and
SNAP. Eight kinds (ROACH, RUDD, PERCH, EEL, TENCH, BREAM, CARP, PIKE), each with a size range in ounces and where it
bites: close in mostly roach, rudd and perch; far out bream, carp, pike. Sizes skew small. A landed fish shows on a
card with its picture, and goes back in. **The biggest catch** is kept on the hero (`Profile.fishing`: casts, fish
landed, the biggest of each kind and of all), said on the card (first of a kind, biggest of a kind, biggest ever) and
by Pennock's panel.

**The archery butts** (`shared/range.ts`, `rangetune.ts`, `rangeboard.ts`; `client/rangemode.ts`, `rangeview.ts`).
Any class. A 60 s round in fixed 1/60 s steps. Targets come up in three lanes (far, mid, near: rings x3, x2, x1),
three at once at most, each up 4.5 to 9 s or until hit, then another in 0.5 to 1.1 s; posts from the start, slides
on a rail from 6 s, swings on a rope from a beam from 18 s, the far lane from 10 s. Rings 10, 8, 6, 4, 2 from the
gold out. An arrow flies 0.28 s and is judged where it lands, the nearest lane first, so moving targets need leading;
0.4 s to nock. The sight wanders 2.6 px; **a Ranger's 0.55 of that**, the steadiness edge (tested: a careless archer
scores more as a Ranger). Aimed as on the wall (`watchinput.ts`): drag and lift on a phone, the mouse and a click on a
laptop. The card: score, arrows, hits, golds, most in a row, your best. The best is on the hero (`Profile.range`).

**Seeded, and not forged by a refresh.** A cast's seed is the hero's id and their cast count (`seedOf`), the count
saved as the cast goes out; a round's is the id and the round count, saved as the round starts. Everything about the
fish is drawn when the cast lands, so a refresh can't roll it again; the next cast is just the next one. The range's
rules use no Math.sin or Math.random (`wave` is sine from plain arithmetic, within 0.0012), so every engine agrees.

**The town's board, synced once** (`shared/rangeboard.ts`, `worldsync.ts`, `api/_world.ts`). At the bell, if the
round beats your line on the board, the round goes to the shared world as one contribution: its number and its
arrows (`range: { n, shots: [frame, x tenths, y tenths][] }`), not a score. `contribute` replays it from the seed
(`replayRange`; arrows between nocks, out of order, after the bell or too many make it no round) and puts the score it
really makes on `WorldState.range`: each hero once at their best, the top ten. It rides the world's usual look, so
no new read. On the server a range-only write skips the Roll's pipeline and recompute: WATCH, GET, MULTI, SET, EXEC,
5 commands (a job's is about two dozen). Ending early with STOP posts nothing. Corin's panel shows the board (offline,
only your own rounds).

**Sounds** (the existing kit): the cast swish, a plop for the float and the bite, the strike's yank, a guard-break for a
snapped line, a drop for a lost fish, loot or a fanfare for a catch; at the butts the arrow, an arrow sticking, the
perfect chime for a gold, a thud for a miss, loot or a fanfare at the end.

**Art** (in code, the game's style): the pond from the bank (far bank and the wall's culvert, stepped water with
dither, reeds, a lantern) and the range from the line (the lodge's thatch and planks, turf banks and beams, mown
stripes, chalk lines), both lit by the town's hour through `light.ts`; the eight fish a pixel at a time; straw bosses
with painted rings that rise, slide, swing and drop with the arrows stuck in; the rod, line and float; the bow.

**Words** (`client/pastimewords.ts`; none through the lore keeper or line editor yet). Pennock's offer, his record
lines, the fish names, every hint and cue, the lost-fish lines, the catch card; Corin's offer and his line to a
Ranger, the board, the hints, the card. Names new to the town: OLD PENNOCK, CORIN, the millpond.

Tests: `tests/fishing.test.ts` (the bite on the seed's time with nibbles before it; too soon, too slow, in time; the
cast as far as the meter showed and one seed a cast; a careful reeler lands over 95% near and far; holding through a
big run snaps, a small one reels straight in, slack throws the hook; runs with a warning; every kind and size in range,
small near and big far, every kind somewhere, big ones rarer; the same cast the same fish; the biggest kept and fitted
from a save), `tests/range.test.ts` (wave; posts, slides and swings move as the numbers say; lanes and kinds open up on
time; rings and lanes score; leading beats aiming where it is; the Ranger's wander is 0.55 and scores more; a round
replays exactly and a made-up one doesn't; the board takes the replayed score, once, the best, the top ten; the server
cleans a claim, and a score with no arrows doesn't get on), `tests/pastimes.test.ts` (sitting down one word, ten
minutes nothing, getting up one; the friend sees the hero parked at the spot and drawn at it, the hero unchanged; at the
butts the same, and a newcomer told once; the pond, Pennock and Corin on the map, the spots dry and walkable; only from
the open town). Shots: `node scripts/pastime-look.cjs <url> shots/pastimes`; the town with friends parked from
`scripts/town-online.cjs` (`shots/pastimes/town-parked-phone.png`).

## 2026-11-06: who hosts: the best connection runs the room, and a hidden host hands it on (Kyle; Claude Opus 5.5)

Kyle approved both today (the two left open in "the join storm" and "the guest feel"): "best connection hosts"
and "a hidden host hands over". Numbers in `shared/hostpick.ts` (`HOSTPICK`, `HIDE`); the rule there, tested in
Node (`tests/hostpick.test.ts`).

**1. Who hosts.** Every player's traffic goes through the one relay in `sfo1`, so a friend's delay to the host
is about half the host's trip to the relay plus half their own. On the Florida night, Kyle hosting would have
given each Florida friend about 80 ms one way, against LIACOR hosting's 80 for Kyle and 140 for the other
Florida friend (220 ms between them down to 160).
- **The pick** (`pickHost`): each member's score is their trip to the relay (`RelaySocket.rtt` on the town
  socket, the heartbeat's own ping and pong, in ms) plus a small lean for a struggling page: half of each ms of
  average frame time over 20, at most 10 (`linkScore`: a phone at 40 ms a frame costs 10, a laptop at 16
  nothing). The lowest score hosts, but only if the leader's is **25 ms or more** worse; else the leader. A trip
  not yet measured (0, before the first heartbeat answers) never wins, and a leader with none keeps it. The
  frame lean alone can never move the room (10 is under the 25), so a laptop beats a phone at the same trip
  among the others, and a phone leader at the same trip as a laptop keeps hosting.
- **No new traffic.** A member's link rides on the party's own join word (`{k:'join', n, q:[rtt, frame]}`),
  which they already send asking in; once in, they say it again only when it's first known or has moved (10 ms
  of trip or 8 of frame time), at most every 5 s and at least every 60 (`sayAgain`): a few words a party. The
  leader's own comes from its own socket. A report older than 90 s isn't used. The frame time is kept from
  drawn frames (`client/netq.ts`).
- **Picked once, at setting out** (`Parties.setOut`): the `go` word carries `h`, the host. The host starts the
  room as a leader would (`Game.setOut` with the word as told); everyone else, the party's leader included,
  follows them as a guest through the same paths a friend always took (`startRemote`, `want=join`: joiners
  never claim). The party leader stays the leader for everything social: the card, invites, the job, and the
  beat's own line ("X is leading the party out to Y"). Nothing picks again mid-job: the host keeps it unless they
  leave or the hidden rule fires.
- `?pick=lead`: the leader always hosts. The stress kit and the party, chat, lobby, exped and budget scripts use
  it so each knows whose page runs the room (on the local relay everyone's trip is the same, give or take a
  busy frame); `florida-online.cjs` uses the pick (and `LEAD_HOSTS=1` for the night as it was played).

**2. A hidden host hands it on** (`client/hidehost.ts`, `handNow`). A host with a friend still in the job (heard
from in the last 5 s) whose page goes out of sight hands the room to the friend first in line: a desktop
after **2.5 s** out of sight (a timer, and the hidden loop's once-a-second tick), a phone or touch device at
once (`visibilitychange` hidden; it freezes timers), and any page going away (`pagehide`) at once. Alone,
nothing changes: the room runs on the hidden loop as before.
- `CoopHost.handOver(true)`: the whole job to everyone, then `{bye, stay, to}` naming the friend first in line
  (the one the 2 s save already goes to), and the socket closed at once, not after 1.5 s, so the relay frees
  the room now (a phone would freeze before the timer fired). The named friend takes it the moment the relay
  says the host's gone (`left`), or 2.5 s after the goodbye if that word is slow; the rest follow in their
  order after them. `stay`: the old host's hero stays in the job.
- Back in sight, the old host opens no socket while hidden and then follows whoever has it as a guest
  (`Game.backAsGuest`); a reload meanwhile follows them too (the session names the new host).
- A guest's `heardLead` now uses the clock, not the last frame's time: a page out of sight draws no frames but
  still hears, and back in sight used to think the leader quiet all that while and try to take the job on.

**Two bugs found on the way, in every takeover since the pacing merge** (the determinism test across a
handover): the pack rushes' clocks are Maps, which the job's JSON wrote as `{}`, so a friend taking a job on
mid-fight stopped dead on the next tick (`s.due.has is not a function`); and JSON has no Infinity, so every
barrel and oil jar (`fadeAt: Infinity`) loaded as `null` and was gone a tick later. `saveRoom` sends the rushes
as lists, `jobJson` writes Infinity as a word, and `loadRoom` brings both back. A street handed on is now the
same fight tick for tick with the ids swapped as a takeover swaps them; an expedition's save is to the
centimetre by design (`bigsave.ts`), and from it the same fight on any page.

**Measured.** `florida-online.cjs` (the leader 70 ms away each way and Kyle near the relay): trips 213 ms and
29 ms, Kyle hosts with LIACOR leading; LIACOR in Kyle's job 4.5 s after setting out (the dead SUBSCRIBE's 2.5 s
included), one job join, at most 3 sockets, the host drawn stalled on 9.3% of frames while walking, Redis 19
commands a minute (the same as before: nothing new on the wire). `LEAD_HOSTS=1`: as before, 4.6 s, 11.1%, 19.
With two players the guest pays both legs either way (0.31 s against 0.29); the gain is a third and fourth
player. Stress (`scripts/stress-online.cjs`, local relay, LAG_MS 120): scene 4 now expects the hand-on (Sam
takes the job 2.9 s after Kyle's page goes out of sight, leads all 25 s, Kyle back follows him, they finish);
**4m**, the leader muted and hidden: Sam has it in 2.9 s and runs it at 0.99 room seconds a second, every one
of 50 looks a tenth of a second apart seeing it move (a hidden host sent about a patch a second); **4p**, a
phone leader: handed on the moment it hides.

**New words, for the lore keeper and the line editor** (`client/partywords.ts`): under the setting-out beat when
someone other than the leader hosts, "X has the best connection, so the job runs on their device." (to
everyone else) and "You have the best connection, so the job runs on your device." (to the host); over your hero
when the job moves mid-way, "X IS HOSTING NOW", and to whoever takes it, "YOU ARE HOSTING NOW" (a takeover of
any kind now says this).

Tests: `tests/hostpick.test.ts` (the pick: lowest trip, the frame tie-break and its cap, the margin, unmeasured
trips; when a link is said again; the parties on a fake town: the link on the join word, the `go` word's host,
the leader on a near tie, a link known late said once, no new pick after setting out; the hidden rule: desktop
not at 2.4 s and at 2.5, back within it nothing, touch at once, `pagehide` at once, alone never, back in sight a
guest; the host's goodbye and its closed socket; the named friend first, at once on `left`; LEAVE as it was; a
guest hidden 20 s not thinking the leader quiet; the room across a handover, a street and an expedition of
three). Full vitest (1,285) and `tsc` pass. Online, one at a time: town, party, chat, lobby, exped, florida (both
ways) and the full stress run (31 scenes, in four parts) pass, but for party-online's lag-feel steps: its dodge
jerk and the stab "within what the cap allows" are on the edge at headless Chromium's 0.47 to 0.49 s lag against
the 0.35 s cap (the press reaches the host about 7 ms before the cap), and fail on untouched main too (that run:
the block and the dodge). Stress scene 1's 2 s step failed once and passed on the rerun.

Not built: a host picked again mid-job (Kyle: no ping-pong); a host that comes back taking its room back.
## 2026-11-06: the boss kit, and the Doorkeepers in the great barn (Kyle; Claude Opus 5.5)

Kyle (2026-11-05): "shield goblins or a pair ... arena ... good loot ... mix between splatting and tactical", moments
to plan an attack, bosses that hit hard and aren't easy to kite. `docs/plans/bosses.md` rollout item 2. Every number
in `shared/bosstune.ts` (exported through tuning); every word in `shared/bosswords.ts`.

**The kit, for every later boss** (`sim/bosskit.ts`, `poise.ts`, `bossgrace.ts`, `bosschest.ts`, `bossplate.ts`):
- **A boss's state** on the goblin (`Enemy.boss`: POISE, phase, job, door, its rotation) goes out only when one of
  those changes; the room's own notes (`ArenaRoom.bosses`: who hurt it lately, the pair's clocks, each phase's seeded
  swap) are saved with the room and never sent. Measured: at their post nothing about them goes out; in 10 s of
  fighting the boss field is in under a tenth of the patches.
- **POISE**: bosses shrug every ordinary stun (`stuns.ts mayStun`, and no flinch, no LAST SECOND reel). Charged
  blows 18, perfects 22, ambushes 30, backstabs 14, BRACED 30, a last-second dodge through its blow 18 (the dodge
  classes' perfect) fill a 100-point bar (1, 1.3, 1.6, 1.9 times for one to four players). Full: STAGGERED 2.5 s,
  held fast (the stunned bonus), its door aside, the bar empty. A relic's stun lands in full and fills half the bar.
  A blow its door stops still fills POISE: a holder's charged blows into the door are their part.
- **Patterns**: a 0.2 s pose before the floor shows (the floor's own time is the plan's; telegraphs in both views
  wait for it), aim turning with its hero until 70% of the wind-up, then locked. A move it can't get to within 3 s
  is passed over, so hugging it can't stall a charge.
- **Whom it faces**: a taunt, else a block held within 2.5 tiles of its face, else whoever hurt it most in the last
  4 s, else the nearest.
- **One clock a hero**: one boss wind-up aimed at a hero at a time (the other boss picks another hero or waits), and
  the hungry within 3 tiles of that hero hold their blows while it winds up (`enemies.ts begin`, only in a boss's room).
- **Phases**: a 2 s roar with nothing landing either way (it strikes nothing and takes nothing), pips on the plate.
- **Scaling**: health by PARTY.boss as every named one (1, 1.4, 1.8, 2.2); POISE as above; two players, the other
  boss swings at the second hero 0.6 s after the first blow begins; three, 3 small ones in at the side doors each
  phase (four: 4); four, one more sweep in the rotation. Wind-ups never shorten.
- **The plate** (`#boss`, `client/bossplate.ts`): the name with its phase pips, a bar each (the pair side by side,
  LATCH and HASP under), a thin POISE bar under each that flashes while STAGGERED. Any other named goblin: as before.
- **The sure chest**: the arena's chained chest opens at the kill (both dead). Each hero in the room rolls on their
  own seed (the chest's and their id): one Forged piece, PRE-WAR 15% (plate half the time), and 15% a relic through
  `awardRelic(.., 'boss')`, the new source, straight into their found relics, so the relic moment comes as it does
  for a pickup (a guest's too, through their hero's patch). 80 to 120 gold in one pile, the party's pot. Bosses
  leave nothing on the floor (no hungry gear: there's no butcher in them).
- **The arena rule**: the way in is shut until the kill (the goal needs every named one dead now; "are dead" for a pair).

**Open with Kyle, each behind one flag (`BOSS_FLAGS`):**
- **BRACED**, default `'boss'`: a blocked boss blow doesn't shove the blocker back, and a boss's blocked red blow
  rebounds it 0.8 s (shoved back a little) and fills POISE 30; IRON STANCE gives way to it on a boss's blow.
  `'all'`: no shove from any blocked blow (the rebound stays a boss's). `'off'`: as before.
- **The grace**, default on, boss blows only: a guard or dodge pressed up to 0.15 s after the blow lands, by the
  hero's own screen, counts (a plain dodge, or a block). How it sits with lag compensation (LAGCOMP.cap 0.35):
  the leader's own hero is judged at once when its room would save it anyway; a blow that would land waits 0.15 s
  for a late press. A lagged friend is judged by their own screen as before, and a press up to 0.15 s late by that
  screen counts too, but the room never holds a boss blow more than min(lag + 0.15, max(0.35, 0.15)): for lag up to
  0.2 s the whole grace is theirs, then it shrinks to 0.35 - lag, and from 0.35 s it's only the lag compensation.
  The two never add up past the cap, on anyone's screen.
- **A hero's first named-butcher kill always dropping a relic**: not touched.

**The Doorkeepers** (`shared/barnarena.ts`, `bossjobs.ts`, `sim/doorkeepers.ts`, `doorpair.ts`, `doorwall.ts`,
`arenaroom.ts`): **Latch** and **Hasp**, two big goblins (the butcher's body a size up) with the barn's doors, 320
health each, in the great barn at Lowfurrow Fields: a 12 by 14 threshing floor that fits an upright phone, two hay
stacks (stop a charge; burn down in 6 s: `haystack`, a new wooden block), four roof posts, a barrel of lamp oil, the
chained chest at the back. They stand at their post facing the back wall until they see you or hear you within 4.5
(creeping, only sight: an ambush to open with). Posted as a hunt (`barnHunt`) from 3 brought home or the bell rung:
two rooms, the fields then the barn (`Job.arena`; `?hero=WARRIOR&barn=1`, or `barn=arena` straight into the barn).
- **The door**: shut, a blade or shot from within 70 degrees of its facing is stopped dead (BLOCKED, sparks).
  Swung aside during its own blow and recovery, stunned, staggered, rebounding, after a lock, and while DOWN.
  Bursts, burning and storm go round it. A shot into a shut door cuts a strap (a charged or perfect one two): three
  and it's DOOR DOWN 4 s (lying beside it).
- **Jobs**: one is the WALL (walks its hero down at 1.5, stands 1.5 off, turns at 1.4 radians a second, so a
  flanker gets round it; no blow of its own but the split and the lock), the other the MOVER (2.4 pace, rotation
  sweep, charge, sweep, sweep, charge with one seeded swap). They swap every 20 s. Drawn: the wall's door square in
  front, the mover's carried at its side (the read), swung out flat while open.
- **Moves**: Door Sweep, red 120 degrees, range 2.6, 1.1 s, 24, punish 1.0 s. Door Charge, a striped lane 8 long
  1.6 wide, 1.3 s, 30 (it backs off to 3 to get it; 11.4 tiles a second); into a stack, post or wall it's stuck 2.5 s.
  Locked Doors (within 2.5 of each other, every 9 s at most): a striped shove 3 wide from between them, 1.4 s, 22,
  the partner carried along; both stand open 1.5 s after. Door Spin (phase 2): a striped ring 2.4 round itself,
  1.5 s, 26, then dizzy 2 s. A hero at the middle of any striped one walks out in 60% of it at the slowest kit's pace.
- **Together**: more than 7 apart for 4 s, the mover walks back to its partner, back to you, 3 s (or till it's
  there). One down: phase 2, the roar, the survivor the mover for good, carrying both doors.
- Their charge meets their own small goblins as a butcher's does; they never hurt each other, and a carried partner
  stopped by a wall isn't hurt by it.

**Measured** (`tests/bossbot.ts`: a hero who can't go down, walking on its own feet by Intent, reading each floor:
walks out of striped, a blocker blocks red, a dodger dodges at the last moment; goes for a back or an open front):

| The barn alone, days 3 / 4 / 5 | seconds | health lost | staggers |
|---|---|---|---|
| twin daggers (Rogue) | 45.9 / 96.6 / 82.4 | 30 / 0 / 0 | 2 / 3 / 3 |
| focus staff (Mage) | 47.6 / 104.5 / 69.1 | 190 / 276 / 146 | 0 / 2 / 1 |
| sword (Warrior) | 54.3 / 54.5 / 46.1 | 30 / 60 / 22 | 5 / 5 / 4 |

Two (sword, daggers) 25.9 s; three (sword, staff, daggers) 31.7 s. All won. The staff bot takes the most because it
can't block and stands in to slash; its spells go round the doors.

**Shared files, small edits**: `tuning.ts` (re-export), `types.ts` (`Enemy.boss`; `EnemyAttack.boss`, `tell`, `mid`;
five events), `enemies.ts` (`OWN_KIT.bosses`, the clock in `begin`, the hook to `stepKeeper`, aim tracking, a boss's
charge stuck), `terrain.ts` (`Foe.boss`), `jobs.ts` (`Job.arena`), `arena.ts` + `props.ts` (`haystack`), `combat.ts`
(the door, POISE, BRACED, the grace), `damage.ts`, `bolts.ts`, `stuns.ts`, `impacts.ts`, `latelist.ts`, `lagcomp.ts`,
`chests.ts`, `pickups.ts`, `loot.ts`, `goal.ts`, `targets.ts`, `room.ts`, `run.ts`; client `main.ts` (the plate, `?barn`),
`game.ts` (the posting), `foes.ts` + `three/teleg3d.ts` (the pose before the floor), `strawman.ts`, `fx.ts`,
`soundscape.ts`, `blocklook.ts`, `pieces.ts`, `hud.css`. No pin moved.

**New words** (lore keeper, then line editor): THE DOORKEEPERS, LATCH, HASP (plan proposals, kept); STAGGERED;
BRACED; DOOR DOWN; the posting "Hunt the Doorkeepers" / "Two of the hungry have taken the doors off the great barn
at Lowfurrow Fields and carry them about like shields. They've shut themselves in there with whatever was stored. Go
in and put them down."; THE GREAT BARN (exists); "Kill THE DOORKEEPERS" / "THE DOORKEEPERS are dead. Way home: ..."
(built from the job's boss, "are" for a pair). Reused: BLOCKED (a door stops it), SHRUGS IT OFF, A CHAINED CHEST.

Tests: `tests/boss.test.ts` (POISE by party, what fills it, the stagger, shrugged stuns and a relic's; the plate for
the pair and for any named one; BRACED on, off and 'all'; the grace for the leader and for a friend at 0.15 and 0.3 s
of lag, and never past the cap at lags to 0.9; the sure chest chained, per hero, its odds, the gold, a relic and its
moment; no traffic a tick) and `tests/doorkeepers.test.ts` (each move landed, blocked or not, dodged and walked out
of; Locked Doors; the door, the straps, a charge stuck in a stack and the stack burning; the swap, walking back,
phase 2, the split; one clock a hero; the floors' times, the pose, the aim lock, the barn on a phone; the posting;
clear times for daggers, staff and sword; the same fight twice). Full vitest 140 files, 1298 tests; tsc; town and
exped online pass; party online 25 to 27 of 28 over three runs, only the guest-feel frame and lag-stab checks
(a clean main checkout passed once and then failed one of the same checks: flaky under the container's load, and
the party script never meets a boss). Shots: `node scripts/boss-look.cjs [url] [outdir]` (phone: the barn with the plate, Locked Doors'
lane held part way, the sure chest open with the PRE-WAR piece).
Open: Kyle's play on every number and both flags; a Blender pass on the pair (they're the butcher's body with a door
drawn on); real sounds for the rebound and the roar (from the kit we have now); the hay stacks are box lumps.

## 2026-11-06: the guest feel: your own acts at once, one walk rule, and a blow judged by your own screen (Claude Opus 5.5)

Kyle's goal: online lag as low as possible. A friend (a guest) felt their own dodge, block and swing a whole trip
late (to the leader and back, plus the playout's wait), walking with a block held or creeping rubber-banded, and
they were hit after dodging on time by their own screen. Five pieces, each tested before the next:

**1. One walk-speed rule** (`sim/walkspeed.ts`, `client/ownwalk.ts`). `walkSpeed(hero, intent, now, pace)` is the
room's pace (the kit, gear, creeping under STEALTH.slow, the shallows, Wall Brandy, the bell's QUICK) and `actPace`
the act's own (a block held: the kit's blockSpeed; drawing: chargeSpeed; a wand's cast walk). The room's walk and
the guest's own hero both use them, with the same swept `travel`, the oil's slip (`slipIntent` now a rate:
identical to the tick's numbers at dt = TICK) and a body with a footing (the old guess was a bare point: it walked
through deep water and up ledges, and ignored creeping, the block's pace, wading and QUICK, and scaled by the
stick's length, which the room doesn't). Lockstep in Node, tick by tick: no difference at all, in every case.
The guest's own hero no longer moves in 20 Hz steps when the leader's room is moving it (`prev` was set to the
same point every frame): it follows the leader's word between patches.

**2. Your own acts at once** (`client/ownhero.ts`). A dodge press starts the dodge on your screen the same frame
(the room's reach, pace and whole ticks, its dust and sound), gated by the last word on your breath, being winded
and the dodge's cooldown, and only when the room would let it go (free, drawing, or a blow's recovery). A held
block raises the guard at once (a kit with a full guard). A tap let go (a crossbow on the press) starts the blow's
swing, lunge and whoosh, and a press during it goes on the combo as the room's would. When the leader's patch shows
the act it's carried on from: its steps here count on top of the leader's word for as far as the leader's room has
still to go with it, by its own progress in the patch (`lastRollAt`, `actT`), so a dodge never wobbles. If the
leader has had the press a while (an ack past it, plus INPUT_BUFFER) and the act never came, it's taken back and
your hero eases back. The leader's own event for an act shown here (`roll`, `blink`, `swing`) isn't shown twice.
Hits, damage, kills and the slip's stagger stay the leader's: the guest only draws. Walking: the stick setting off
and stopping goes to the leader at once (not at the stick's 10 a second), the frame's walk is split at the moment
the stick changed, the leader's word plus your walking since the trip before its latest patch is the target (it
used to slide every frame between patches), and standing still the last of it settles gently.

**3. A blow judged by your own screen** (`sim/latelist.ts`, `sim/lagcomp.ts`, `combat.ts hitHero`). Each Intent
carries `vt`, the leader's room time the guest's screen was showing (the drawing is between the last two patches,
so that's exact). The leader keeps each friend's `lag` on their hero (its room's time less their `vt` as their
input comes, smoothed); the leader's own hero has none. A blow that covers a hero with lag goes on the room's
`late` list (plain data: hero, goblin, when, the blow, the shove's way and the guard's) and is judged once an Intent
of theirs with `vt >= at` has come, or at `at + min(lag, LAGCOMP.cap)`: a dodge whose i-frames covered `at` by its
press's `vt` is a dodge through it (the goblin reels); one begun in the wind-up that had carried them out of it by
`at` is a dodge; a block up by `at` and not yet down, facing it, holds; anything else lands (a dodge pressed too
late by their own screen doesn't count, though the leader's room has them rolling by then). Room state stepped on
ticks: the same Intents, the same fight; it saves and loads with the room (a takeover mid-wait judges the same).

**4. Small timing cuts.** A press goes from the input event itself (`input.ts onPress`), not the next frame. On
the leader, a friend's press that a tick has used sends their patch at once (not marked urgent, so a split
party's relay still batches it: no new Redis traffic; Florida harness 19 commands a minute before and after).

**5. Telegraph timing.** netfix's playout paced patches but left a goblin's `actT` and its blow's `t` at the newest
patch while bodies were drawn between the last two. Now every frame the guest works both out from `a0` and `t0` at
the drawn time (`vt`), so the red fill and the goblin's body share one time, and it's the time sent as `vt`.

**Measured**, `scripts/party-online.cjs` (LAG_MS=150 each way; headless Chromium at 25 to 45 ms a frame, so the
trip is about 0.40 to 0.43 s and the leader's lag reading for Sam 0.44 to 0.46 s), before (8ee93cc) and after:

| On Sam's own screen | Before | After |
|---|---|---|
| His dodge shows after the press | 17 frames, 456 ms, then in 20 Hz steps | 1 frame, 6 ms; 0 jerks back in 38 frames |
| His block's pose | 17 frames, 516 ms | 1 frame, 13 ms |
| Walking with a block held: frames pulled back over 0.04 tiles (the stop included) | 13 (about 0.9 tiles back after stopping) | 0 |
| Creeping (Shift) | 0 | 0 |
| A stab, jumped 0.1 to 0.15 s before it lands on his screen | hit | hit (at his 0.46 s lag the 0.15 s cap needs the jump 0.31 s ahead) |
| The same with the cap at his lag | hit | dodged |

How early before a blow lands on your own screen a press must come to save you (Node, the room itself, a stab
with a 0.9 s wind-up, `vt` sent as the guest would):

| | No lag | 0.31 s lag (150 ms each way, a quick page): before / after / cap at the lag | 0.46 s (the headless run) |
|---|---|---|---|
| Ranger's jump | 70 ms | 380 / 180 / 20 ms | 530 / 330 / 30 ms |
| Mage's blink (wand) | 40 ms | 350 / 180 / 10 ms | 500 / 330 / 30 ms |
| Warrior's block | 40 ms | 350 / 180 / 10 ms | 500 / 330 / 30 ms |

**Kyle's call: the cap.** `LAGCOMP.cap` is 0.15 s as planned: a blow on a laggy friend never hangs more than 0.15 s
past its telegraph, on anyone's screen. At a real 150 ms each way that halves how early you must press (380 to 180
ms) but doesn't make "on time by my screen" true; a cap near the lag (0.35) does, for a blow on that friend landing
up to 0.35 s late everywhere. One number in `shared/tuning.ts`.

Not built (waiting on Kyle, or not asked): who leads by latency; handing a hidden leader's room on; regions and
transport; a drawn charge (a hold shows a trip late, and the heavy it lets go); skills and relics drawn ahead; the
room's push out of props and other bodies (`separate`) on your own walk (eased in); walking out of a blow by your
own screen (only a dodge or a block is judged by `vt`). `Hero.lenience` is still never set; lag compensation is
what it was for.

No new player-facing words. Tests: `tests/feel.test.ts` (walk parity tick by tick: plain, creeping, half a stick,
blocking with two kits, in and out of the shallows, QUICK, brandy, oil, and frame by frame on oil; the block and
creep paces; a dodge on time by their screen saved and not without it; too late; a block in time and too late;
the leader's own hero judged at once; the cap, and an Intent past the blow judging it sooner; determinism, and a
waiting blow through saveRoom and loadRoom). `scripts/party-online.cjs` gained the block, block-walk, creep, dodge
and stab steps (LAG_MS=150), with what the lag is made of in `report.feel`. All online scripts pass (town, party,
chat, lobby, exped, florida); the full vitest run and `tsc` too.

## 2026-11-05: pacing: a threat budget, beats, packs held back, toughness for a party, no easy kiting, BIG ONEs (Kyle; Claude Opus 5.5)

Kyle: "sometimes you just get swarmed. Now it feels more like swarms over other things, so AoE abilities are
over-necessary"; "Mini bosses also work. Things that require a few hits. Not necessarily more enemies if lots of
players, but more health on enemies, and they hit harder etc. Sometimes mobs are still fun for splatting though";
"it's a bit too easy to kite right now". Then: small fry cost half a point, and goblins (and loot) go by the
party's average level too. The first pacing slice of `docs/plans/bosses.md` section 3. Every number is in
`shared/threat.ts` (exported through tuning).

- **Threat** (`THREAT`, `THREAT_TIER`): chaff (small goblins, wolves, blind hunters) **0.5**, specials 2 (banner 3),
  meaty 4 (brute, ironhide, shield; logs 5), a butcher 8, a BIG ONE twice its sort.
- **A room's budget** (`BUDGET`, rules `shared/roombudget.ts`): 8, 13, 17, 20 by room, times easy 0.8 (ruin 1),
  normal 1, hard 1.2 (ruin 3), deep 1.35. Sized for chaff at half a point so a room has about the goblins it had
  (9.0 alone before, 9.4 now), as fewer swarms and more fights. Anyone a scene already has at something, and the
  ledge archers, come off it first. A party's budget is 1, 1.15, 1.3, 1.45 times it (the few more small ones).
- **On screen** (`SCREEN`: awake within 10 tiles of a hero, not held): threat 10, 12, 14, 16 by party size; meaty
  1, 2, 2, 3 (a lone hero 2 from the third room); one heavy. No pack alone is laid over a lone hero's screen.
- **Beats** (`Template.beats`, `beatsFor`): the bands take beats in order from the way in. The first room: a swarm,
  then a fight. Later rooms end on a **closer** (a butcher, a brute and ironhide, a drum, the logs, a sapper, an
  ironhide, or a BIG ONE); a room of two opens on a swarm half the time, a room of three three times in five, so
  the splatting stays but no longer fills every room. The templates are picked first (each by its beat and its
  share), then the small ones are shared out by beat (a swarm gets twice its share, and may run one over its
  template), trimmed if the room is over, never under one a pack. The swarm's own template is still the splat:
  its small ones have 22 health.
- **Held back** (`sim/pacing.ts`, `HOLD`): a pack that wakes while the screen would go over a cap holds at its spot
  (`Enemy.held`, the room time, sent once each way), jeering: it faces the nearest hero and strikes nothing; drawn
  hopping, its blade banging a spark on the beat (`client/pacedraw.ts`), and not counted in N CHASING. It comes when the screen drops under 60%
  of the cap (the oldest first, one pack a tick), after 12 s, or at once if a hero comes within 3 tiles or hits
  one of it. A pack is never held from an empty screen. On an expedition the hold-point waves wait until the
  screen near you is under 40% of the cap (12 s at most), and after every third, 6 s of quiet.
- **A party by toughness** (`PARTY_TOUGH`, `sim/packs.ts scalePacks`): by party size every goblin of a pack has
  1, 1.35, 1.65, 1.95 times its health and hits 1, 1.15, 1.25, 1.35 times as hard (`Enemy.harm`, locked into the
  blow in `begin`, so the telegraph and the hurt agree); 0.12 more small ones a pack a player past the first (was
  0.5), and the pack's one `more` special from three players, all within the party's budget and the meaty cap.
  The old flat +35% centrepiece is folded into the table. An expedition's packs the same (`EXPED_PACKS.party`
  0.3 to 0.12), its waves tougher by the same table and half a goblin more a friend (was one). Goblins a room,
  20 days of the board: alone 9.0 to 9.4; two 12.7 to 9.9; four 19.6 to 12.1.
- **The party's level** (`LEVEL_SCALE`, `levelHp`, `levelHarm`): the host takes the heroes' average level when the
  job starts (`Run.level`, `partyLevel`, kept for the whole job, sent with the run) and every goblin, butchers,
  named ones and BIG ONEs too, the room's spawns and an expedition's waves, gets +6% health and +4% damage a
  level past the first, on top of the party's size, capped at +45% and +30% (level 8 to 9): L3 1.12 / 1.08, L5
  1.24 / 1.16, L7 1.36 / 1.24, L9 and up 1.45 / 1.30. Counts never change.
- **Loot by level** (`shared/lootlevel.ts leanOdds`, through `rollTier(.., lv)`): a level past the first, plain
  6% less likely, Forged and PRE-WAR 4% more, the rare three 3% more, Fine takes up the rest (to level 10). A
  named butcher's: Fine 36 / 26 / 13%, Forged 50 / 58 / 68%, PRE-WAR 9 / 10.4 / 12.2%, the rare three 5 / 5.6 /
  6.4% at levels 1, 5 and 10. A chest's plain 45 / 34 / 21%. A piece dropped, from a chest, a BIG ONE or the
  treasure comes +1 from level 5 and +2 from level 9 (never a hungry piece). A level-1 party rolls exactly as before.
- **Kiting** (`sim/chase.ts`, only in a job's or an expedition's rooms: `ArenaRoom.pace`):
  - *The sprint* (`SPRINT`): chasing the same hero 3 s without getting into reach, a goblin leans for 0.4 s at
    0.3 of its pace with dust kicked out at its feet (the tell, drawn unlit so it reads at night), then bursts at twice its pace for 1.3 s, from within
    7 tiles; then it's winded 3 s more. Clocks are room times set when they change (`chaseAt`, `sprintAt`).
  - *Gap-closers*: a lunger on a hero running from it (moving, facing away) leaps 4.6 tiles from past 2.6 (a red
    lane, blockable, `LEAP`); wolves stop circling a hero who runs and run them down for the dart.
  - *Flankers* (`FLANK`): in a pack chasing one hero with three or more, every second goblin by id goes wide, 1.1
    radians round from the pack's line and 2.2 tiles ahead of a running hero, till it's within 2.2 of them.
  - *Ranged pressure* (`RANGED`): archers, netters and oil throwers count a hero running in the open (nothing solid
    within 1.6 tiles) 3 tiles nearer when they choose whom to aim at. Nothing new reaches past what it did.
- **BIG ONEs** (`BIG`, `sim/bigone.ts`): one a job of three rooms or fewer, two in a longer one (`bigRooms`, never
  the first room, nor a last room with a named butcher), the closer of its room when the budget affords it: a
  brute (or from ruin 2 an ironhide) with 2.5 times the health, 1.3 times the size, 1.2 times the blow, its own
  moves and the stomp (a striped ring 1.8 round itself, 1.25 s, every 7 s with a hero within 2.2). Drawn bigger,
  a goblin skull on a stake over its shoulder, BIG ONE over its head. It always drops a piece (rolled as a
  butcher's, at the party's level) and 15 to 25 gold.
- **Online**: nothing new a tick. New goblin fields go out once or when they change (`harm`, `big`, `held`,
  `chaseOn`, `chaseAt`, `sprintAt`, `stompAt`); the flankers are worked out each tick from what's sent.

**Measured.** `npx tsx scripts/encounters/clear.ts 6` (48 rooms of the board's ordinary jobs, one hero who can't be
hurt but whose every lost point is counted, walking at the nearest awake goblin and fighting by Intent: twin
daggers tapping; a focus staff slashing, and holding for its spell with three or more about):

| 48 rooms | daggers: s a room (worst) | staff: s a room (worst) | daggers / staff time | health lost a room, daggers / staff | ratio |
|---|---|---|---|---|---|
| before | 38.6 (97.5) | 39.1 (89.6) | 0.99 | 274 / 216 | 1.27 |
| after | 43.4 (132.6) | 46.4 (180, one room not cleared) | 0.94 | 304 / 275 | 1.11 |

On the ten rooms the test runs (`tests/threat.test.ts`): before, the daggers lost 2.13 times what the staff did
(370 / 174) and took 1.08 times as long; after, 0.92 (421 / 456) and 0.89. So the gap between a single-target kit
and an area kit, which was in how much the swarms hurt the one that can't sweep, has mostly closed; rooms take a few
seconds longer for both (the BIG ONEs, the tougher closers), and both lose a bit more health (harder blows, sprints).
The staff's uncleared room (d6-2, room 0, a swarm and a brute) is the bot standing in a crowd it never blinks out
of (it doesn't dodge); the daggers clear it.

`npx tsx scripts/encounters/measure.ts 20`: goblins a room above; the biggest group to wake at once alone 3.9 to
4.1, at four 9.5 to 5.6; wake groups with three or more specials 5% to 2%.

**Pins**: the layout-3 pin re-pinned to 1139809545 after checking: the same 388 rooms hashed with their goblins taken
out are 713718104 before and after, so only goblins (counts, roles, health, placements, beats) moved. The layout-4
pin (`tests/variety.test.ts`) to 3805258017: in 268 of its 280 rooms only goblins moved; in 12 the chest did too,
because the composer's goblins fall back on the room's own spot finder (which shares its stream with the chests)
a different number of times: placed elsewhere in 10, and in 2 a room's one chest is there or isn't (one each way).

Tests: `tests/threat.test.ts` (chaff at half a point; budgets and caps for one to four; swarms still worth
splatting; beats in order; held, freed by a step near, a hit, the wait, never from an empty screen; toughness
and the set count; harder blows in the room; the level curve, its cap, the loot leaning up; the sprint's time and
tell; flankers spread; BIG ONEs placed, sized and dropping; the same fight twice; daggers against the staff).
Shots: `node scripts/pacing-look.cjs` (phone: a swarm with one leaning into a sprint, a brute and a BIG ONE
winding up its stomp, a held pack jeering at the top of the screen). New words for the lore keeper: **BIG ONE**.
Open: Kyle's play on all the numbers; a sound for the jeer, the lean and the stomp; elites and the six new meaty
sorts (the plan's next steps).
## 2026-11-05: relics you can see, and the trainer and knacks as one screen of tiles (Kyle; Claude Opus 5.5)

Kyle: "Jesus the UX/UI of the upgrades is really confusing, we should have it be screens and more visual",
"Forge is actually decent. I mean knacks and buying upgrades from the trainer", and "it's not clear when you
get a relic right now, or how to equip it, since it's not in your inventory pack".

- **The moment a relic is yours** (`client/relicnews.ts`, `client/relicmoment.ts`). Every relic a hero gains
  is marked NEW on their save (`Profile.relicNew`, ids) and makes one moment: a gold-framed pop at the top of
  the screen with its picture, NEW RELIC, its name, its uses as pips, and one line: "It's on your RELIC
  button." or "It's in your pack. Open the pack and tap it to carry it." The first relic a hero ever gets
  (`Profile.relicTip`) adds the tip on the RELIC button (R on a laptop), that each use spends one, and that
  the church recharges it (or won't, for an elemental one). A tap closes it; it goes by itself after 6 s (9
  with the tip); several wait their turn; it waits while a panel is up, so at a job's end it comes after the
  recap. The fanfare (`sfx.fanfare`) plays with it, unless the room's pickup rang it already.
  - **How it's caught, for every source and every player.** Two paths, both on the player's own game: a
    job's end (`finish`: a zone's climax, a story job, the beacon, a deep dive, `wonRelics`, each player's
    own), and the room's word on the hero's kit reaching their save (`keepKitNoting`, which wraps
    `keepKit`): a named butcher's drop picked up in your own room, or, for a guest, in the leader's (the
    `found` field already comes in the hero's patch, so no new traffic, per tick or otherwise). The wood's
    javelin doesn't make one (the wood stages its own). The church's two for one doesn't either (the forge
    is its moment).
  - **The recap** draws every relic that came home under the RELICS row: picture, NEW RELIC, name, pips
    (`Recap.relicIds` for those picked up on the way).
- **Relics in the pack** (`client/relicshelf.ts`). A row of their own under the doll and the pack: RELICS
  and a count, the RELIC slot with the one carried, then a shelf of every other relic owned, each a square
  with its picture, its uses as pips, and NEW (gold, blinking) until it's looked at. Tap one for its card and
  CARRY (the old one goes back on the shelf); drag one onto RELIC to carry it, or the carried one onto the
  shelf to put it away (`packmoves.ts`, the same GEAR.carry the room already judged). Nothing carried and a
  relic owned: the empty slot glows gold, pulsing, and says TAP; tapped, it lists CARRY for each. Looking at
  one (a tap on it, or on RELIC) clears its NEW. The RELIC slot moved out of the doll into this row (the doll
  is SKILL, HAND, BODY, the rings and the belt now); a relic kind carried with no item (very old) keeps its
  square in the doll.
- **The trainer and the knacks as one screen** (`client/upgrades.ts` what's on it, `upgradeview.ts` drawn,
  `upgradeui.ts` wired, `upicons.ts` / `upiconkeys.ts` pictures, `upgradewords.ts` words). Your level, a bar
  to the next, your gold and "N KNACKS TO PICK" stay at the top while the rest scrolls, with four tabs, each
  with a gold count of what's ready in it:
  - **SKILLS**: the class's three skills as a fork, CARRY ONE (a bracket over three tiles side by side), the
    one carried in gold with CARRYING; then the skill's recharge ranks.
  - **MOVES**: TECHNIQUE (what the dodge leaves, for a Ranger or Mage, then the three techniques) and the
    movement ladder (titled JUMP, BLINK, DASH, GUARD or TAUNT), each a track down the screen, steps joined by
    a line that turns gold once the step above is yours.
  - **RANKS**: the five base stats side by side, each with its pips.
  - **KNACKS**: the two on offer as a fork, PICK ONE, then each chain across in three.
  - Every tile: a picture (the HUD's and skills' icons, and eight new ones drawn in the same pixel letters:
    sword, boot, star, breath, hourglass, plate, crossed blades, a drop of blood; a knack's picture is by what
    it moves), the name, one line, and a state you can read at a glance: LEARNED or TAKEN (gold), its cost
    (green, can buy), its cost and NOT ENOUGH (red), NEEDS LEVEL N or NEEDS X FIRST (dashed and dim), MAX,
    ON OFFER (green, pulsing), NEXT LEVEL UP. Tapping a tile opens it: the whole effect, NOW and AFTER side by
    side (for a knack, what its chain gives now and with it), every rank with its level and price, and one
    button (RANK N: X GOLD, LEARN, TAKE, CARRY, or why not). From the pack's KNACKS it's the same screen,
    titled TRAINING: knacks are taken there in Wickhold as before; the trainer's tabs are a look, with
    "Master Cole teaches this, at ...". The tab last open is remembered on this device. Phone first: every
    tile, tab and button at least 44 px, nothing on hover.
  - **Presentation only**: every state, price and gain comes from `trainrows.ts` and `chains.ts` as before;
    the buttons call the same `Game` methods. `trainsections.ts` is gone.
  - **Room for the guard upgrades**: a track is a list of steps; a step of two or more tiles is a fork.
    `markFork(tiles, chosen, permanent)` marks the choice CHOSEN and, for a once-only choice, the others NOT
    CHOSEN. Warrior TAUNT GUARD or IRON STANCE is one more step on the TAUNT track; the Cleric's holy shield
    and its upgrade to cover an ally are steps on GUARD. Not built yet.
- New words for the lore keeper and line editor: in `relicwords.ts` NEW RELIC, "It's in your pack. Open the
  pack and tap it to carry it.", the first-relic tip (two forms), TAP TO CLOSE, RELICS, NEW, TAP, "Nothing
  carried. Tap a relic to carry it, or drag it onto RELIC.", "Tap a relic to see it, or drag it onto RELIC to
  carry it."; all of `upgradewords.ts` (TRAINING, SKILLS, MOVES, RANKS, KNACKS, N GOLD, N KNACKS TO PICK, NO
  KNACKS TO PICK, CARRY ONE, PICK ONE, CHOOSE ONE, LEARNED, CARRYING, CHOSEN, MAX, TAKEN, ON OFFER, NEXT
  LEVEL UP, NEEDS LEVEL N, NEEDS X FIRST, NOT CHOSEN, N GOLD, NOT ENOUGH, NOW, AFTER, "Not learned yet.",
  "Nothing yet.", RANKS, CARRY, TAKE, BACK, "X teaches this, at Y.", the next-knack line, the carry note).
- Tests: `tests/relicnews.test.ts` (an award is NEW and makes a moment, the tip once; a pickup reaches the
  save as NEW with a moment queued; the pack's row has every relic with pips and NEW, the empty slot pulses;
  CARRY or a drag from the shelf swaps; a guest's pickup in the leader's room, through the encoder, is NEW in
  their save with its moment), `tests/upgrades.test.ts` (each state per tile, technique and snare locks, the
  skills fork, the knack fork taken only out of a fight, a permanent fork drawn as one, the detail's now and
  after and button, reading changes nothing). Shots: `node scripts/upgradeui-look.cjs` (phone).

## 2026-11-05: your hound: a real dog drawn, four breeds to choose with Maeve, and its name (Kyle; Claude Opus 5.5)

Kyle: "The hound of Ranger could use work, and maybe let people choose which dog is theirs." "Doesn't affect
stats." Approved plan: the choice lives with Maeve at the hunters' lodge, and you can pick and name your dog.
Drawing and saving only; the room's hound (`sim/ranger.ts`, `sim/sic.ts`) is untouched.

**The art** (`client/houndbody.ts`, `houndgrid.ts`, `houndshapes.ts`, `houndposes.ts`, `hound.ts`). The old
fillRect dog is gone. A hound is now a pixel map built from its breed's build (leg, body length, chest depth, tuck at
the loin, skull and muzzle, ears, tail and how it's carried, a wiry coat or a ruff) and a pose, then shaded and
outlined by `sprites.ts` exactly as the heroes are, and cached per breed, coat, white and pose. Facing right, flipped
for left. Everything sits in one 26 by 16 box with its feet on the same row (`HOUND_BOX`), whatever the breed.
- **Gaits**, four frames each, legs from where each foot is in its stride: a walk (one foot at a time), a trot
  (diagonals together, a bob), a run (gather and stretch, a moment off the ground, tail streaming, ears back).
  Which one comes from how fast it's actually going (`houndidle.ts`: under 2.8 tiles a second a walk, under 5.4
  a trot, past that a run), so it walks beside a creeping Ranger, trots at heel and runs when it goes in. An idle's
  runs pick theirs from their own distance (out after the stick at a run, back to heel at a trot).
- **Its own idles** (`houndidle.ts`): stood at heel 3 to 5 s with nothing else on, one every 5 to 9 s: nose down
  working the ground, a hind foot at its ear, a shake from nose to tail with a few drops flung, or lying down with
  its head on its paws (lifting it now and then) until its Ranger moves. Seeded from the Ranger's id, so a party's
  hounds never idle in step. A Ranger's own idle with it (fetch, ruffle, the tackle, now with a proper play bow) or
  a pet takes over and the wait starts again.
- **The fight**, from the room's hound: a lunge as it sets off and as it strikes, the bite (jaws open, then shut,
  a tooth showing), the latch when SEND THE HOUND pins (sat back, front feet braced, shaking its head), bolting
  from a butcher at a run with its tail tucked and ears back.
- Sitting, lying, the stick, the tongue, the happy blink and the lean all carry on as before, now hung off the
  head wherever the pose puts it. Flat and 2.5D both draw through `drawHound`, so they always agree.

**Breeds and coats, looks only** (`shared/houndlook.ts`, `client/houndcoats.ts`). WOLFHOUND (the rough grey one of
the story bible: grey, wheaten, brindle), LURCHER (blue, fawn, brindle), HILL HOUND (black and tan, liver and tan,
red), COLLIE (black and white, red and white, merle). Markings: NONE, BLAZE, SOCKS, BLAZE AND SOCKS. Brindle is
striped and merle patched over the coat. Maeve's own by the fire is drawn as one of her wolfhounds, brindled with a
blaze, and still has no name.

**Choosing** (`client/houndui.ts`, `houndpreview.ts`, `hound.css`). Maeve's trainer panel has a YOUR HOUND button
for a Ranger. Her line, then a live look at the dog (trotting, sitting with the tail going, nose down, a shake, a run,
lying down, its name over it), a row of buttons each for BREED, COAT and MARKINGS that change the look in place, and a
NAME field (10 letters, the pixel font's letters, a space, an apostrophe or a hyphen). DONE saves it
(`Game.chooseHound`) and Maeve says her second line; BACK goes back to her training. A name the chat filter would
star (`shared/chatfilter.ts`, word by word and with the letters run together), or a slur on travellers that chat
lets by (gyp, gyppo, gypsy, pikey and spellings: the hound's filter only), is refused with "Not that name.
Choose another." A new Ranger starts with the wolfhound and an old plain dog name picked from their hero id (BRAN,
FLY, MOSS, JESS, BRACKEN, RUSS, SORREL, MEG, TESS, SLOE, CORRIE, TIPPER: none a Wickhold person's name or anything
from the books we keep clear of; MEG and TESS replaced GYP, from a slur, and FENN, too near Fenmere, on the lore
keeper's pass, and a hound still carrying GYP or FENN as the auto name it was given gets the new one, while one its
player typed stays), and can change it any time at the lodge.

**Saved and sent** (`Profile.hound`, `Hero.houndLook`). On the hero's profile; `save.ts` gives an old Ranger the
default and drops one from anyone else; anything odd in a save or off the relay goes through `fitHound`. In town it
rides the `me` word packed small (`[breed, coat, white, name]`) and goes once: to everyone when it's new or
changed, to each newcomer in their answer, and never in the words after (the others keep what they heard). In a
party the hero's `houndLook` goes in the first full patch and then only if it changes (`snap.ts` sends a field
when it changes). Nothing per tick.

**The name shows** (`client/houndname.ts`) over the hound, in warm letters on the glow layer: when you're stood
within reach of it and it's at heel, when the mouse is over it (main.ts passes where it points), and all through
fetch, a ruffle, the tackle and a pet. Another player's hound shows its name the same way.

**Words** (`client/houndwords.ts`; through the lore keeper, whose fixes are in: "that name" in Maeve's second line,
MARKINGS for WHITE, DONE for KEEP since "keep" is a loaded word here, a shorter looks-only line; the line editor's
pass is still to do).
- Maeve, offering: "Let me see the dog. Not you, I've seen you. One of mine, that, or out of one of mine, I'd know
  those feet anywhere, and somebody's been feeding it off their own plate. Go on, what is it, and what do you call
  it?"
- Maeve, once it's chosen: "There. It'll come to that name if you say it like you mean it, which you won't, not at
  first."
- Labels: YOUR HOUND, BREED, COAT, MARKINGS, NAME, DONE, BACK; "Up to 10 letters."; "Not that name. Choose
  another."; "Give it a name."; "Looks only. Every hound fights the same."
- Breeds and coats as above.
- Lore recorded (story bible, hound entry): Maeve's lodge breeds lurchers and hill hounds as well as the
  wolfhound, and the collie sort is a farm dog; a Ranger's dog has their own name now (the old "no name on screen
  yet" marked superseded).

**Cost.** One sprite per breed, coat, white and pose seen, made once; a hound a frame is one blit and a few pixels.
Nothing new in the room.

Tests: `tests/hound.test.ts` (every breed, coat and white in every gait, idle and fight frame inside the one box,
no glowing pixel, standing ones on the ground row; four outlines, three coats a breed, the white shows; names tidied
and filtered (the traveller slurs too, not Pike); old saves default and odd ones are fitted, GYP and FENN given as
auto names become MEG and TESS and typed ones stay, a chosen hound saves and loads and the hero shows it, a
Warrior has none; in town a friend hears breed, coat and name once and not in ten seconds of walking, a new choice
once more; in a party the friend's copy has it and no patch after the first carries it; the same seeded fight with a
wolfhound and with a collie is identical, the hound having joined in; the name shows near, while playing, never
unnamed). Sheet and phone shots: `node scripts/hound-look.cjs <url> <outdir>` (the four breeds, every coat and one
row each with blaze and socks, in each gait, idle and fight move at 4x; Maeve's panel with the preview; fetch in
the square with the new hound).
## 2026-11-05: no parry: the Warrior and Healer block, the Ranger, Rogue and Mage dodge (Kyle; Claude Opus 5.5)

Kyle, after playing with friends: "Parry in general is getting pushback as noisy, confusing, and hard to land with
a lot of enemies at once and latency." Asked which way, he chose to **remove parry entirely**: the Warrior and
Cleric (Healer) BLOCK only; the Rogue, Mage and Ranger DODGE only. No perfect-block window either: there was none
to remove (the only "perfect" on a guard was the spellblade's perfect parry, gone with the rest).

**The guard** (`shared/weapons.ts`):
- `CLASS_GUARD`: WARRIOR 'full', HEALER 'full', RANGER 'none', ROGUE 'none', MAGE 'none'; the kind is `'full' | 'none'`
  (`GuardKind`) and `guardOf(kit)` is simply its class's. `parryWindow`, `parryOnly` and `ripostes` are gone from every
  kit; `GUARD.parryRepress`, `HITSTOP.parry` (now `HITSTOP.counter`, the same 0.18), `RUSH.parryStun`, `RIPOSTE`,
  `MANA_SHIELD.parry/perfect/perfectIn` and `GAFFER.snapped` too. The hero has no `parryOpenAt` or `parriedAt`.
- **The greatsword** holds a plain block like the sword and spear, kept ponderous: the narrowest Warrior arc (110),
  the slowest walk while blocking (0.35), the most through a block (0.3), and dear on stamina (`guardCost` 1.3, the
  spear's; 1.5 broke the guard on every butcher cleave). GUARD on its card: LOW, BLOCK.
- **The spellblade** is dodge-only like the rest of the Mage. A near-miss dodge does exist (the last-second dodge:
  `slipped`, LAST SECOND), so I chose **"a dodge through a blow refills magic"**: a blink through a blow (in its
  i-frames, or out from under it at the last moment) gives back `MANA_SHIELD.slip` (25), once an instant (a pack
  rush blinked through is one refill) (`sim/manashield.ts slipRefills`). "Hits take magic" stays as it was.
- **The guard button** shows only for a Warrior or Healer (`cluster.ts`); a Ranger, Rogue or Mage has none, and
  the phone cluster closes up as it did for a Rogue (shot below).

**Block stays simple** (`sim/combat.ts hitHero`): hold to block in the kit's arc, no health lost, stamina spent
(`GUARD.staminaPerDmg` x the kit's cost), guard break when it runs out, as before. No timing bonus at all. Feel: the
blow holds a beat on both (the goblin `HITSTOP.light` too now), a short ring and more sparks where it met the guard,
a jolt of 2 (was 1), and the small push back as ever (`fx.ts block`). The heavy's crushing blow (`crush`), which used
to break any guard outright ("parry it instead"), is now blockable: `GUARD.crushCost` 1.25 the stamina, the heavy
hitstop, and `GUARD.crushShove` 0.8 of its knock. The parry ring sample is kept, unplayed (`sfxroutes.ts`, `sfx.parry`).

**Every feature that used parry, old and new:**
- **The counter**: was the first blow within 1.6 s of a parry, x2.5. Now the first blow within 1.6 s of a **block
  that holds** (no timing), **x1.5** (`GUARD.counterMult`; easier to earn, so less). Kept because HARD COUNTER, LONG
  COUNTER, COUNTERSTROKE, STAMINA ON COUNTER, REAPER and the forged elements all ride it. COUNTER shows as before.
- **RIPOSTE** (the sword's bonus: a counter within 0.5 s of the parry, x2): **removed**, with its event, callout,
  gold flash and sound, and the sword's ALSO row ("Riposte after a parry").
- **Knack WIDE PARRY** (Warrior and Healer, "Parry window 0.04 s longer") -> **WIDE GUARD** ("Your block covers 20
  degrees more", fx `guardArc`), ids `w_wide`, `h_wide` on the same step; old `w_parry`/`h_parry` map onto them.
- **Knack HARD COUNTER** (Warrior): "Counters after a parry do 25% more damage" -> "Counters after a block do 25% more damage".
- **Knack LONG COUNTER** (Healer): "Counter window after a parry 0.6 s longer" -> "Counter window after a block 0.6 s longer".
- **Ladder rung HEALING PARRY** (Healer, "A parry heals friends within 3 tiles for 8") -> **HEALING BLOCK** ("Each
  blow you block heals friends within 3 tiles for 5"; 5, since a block is far easier than a parry was; once a rush).
  Rung id `blockmend` (rungs are saved as a count, so nothing to convert).
- **Trait RIPOSTE** ("Counters after a parry do 40% more damage") -> **COUNTERSTROKE** ("Counters after a block do
  40% more damage"); id `riposte` kept so saves keep it.
- **Trait STAMINA ON PARRY** ("Parry refills stamina") -> **STAMINA ON COUNTER** ("A counter after a block refills
  stamina"); id `bulwark` kept. Both now roll only for a class that blocks (they rolled for the Ranger before).
- **Mod PARRY** (weapons that parried, rings): **gone**. Old pieces load with BLOCK (a Warrior's or Healer's) or
  DODGE (a Ranger's, Rogue's or Mage's), worth the same points, merged into one of that kind already there; a weapon
  goes by its kit's class, armor and rings by the hero (`shared/oldparry.ts`, run in `save.ts`). The card's PARRY
  WINDOW row is gone. An unknown mod id now can't break a card or a price.
- **The Ranger's wood PARRY step** (after the path's dodges, Hew's card, one swinger): **removed**: the Ranger goes
  from its two dodges straight to KILL THE GOBLINS, as everyone does (`sim/woodsteps.ts`; `PARRY_FOE`, `PARRY_BEAT`,
  `guardTaught` gone). Hew's Ranger parry line and the PARRY how-lines and freeze prompts are gone.
- **The stream's PARRY lesson** (Warrior and Healer, three parries on a heavy): **removed**; they already have the
  clearing's block lesson, so the stream is walked straight past (`shared/wood.ts onBy`: no goblins, no card, its gate
  opens as you get there). Everyone keeps two dodges on the path. The light classes' stream (LAST SECOND) is unchanged.
- **Drill PARRY THE HEAVY** -> **BLOCK THE HEAVY** (Warrior, Healer: "BLOCKED 8 OF 10") or **DODGE THE HEAVY**
  (Ranger, Rogue, Mage: "DODGED 8 OF 10"); a guard break or a rush's later blows don't count.
- **The gaffer's hook** ("block it; a parry snaps the hook") -> block it, or dodge out of the lane; nothing snaps it
  now (SNAPPED, `hooksnap`, the stub of pole and its jab gone). **Hempen's noose**: the same.
- **The ironhide**: a parry of its blow no longer breaks its guard; a charged blow or a perfect still does.
- **Pack rushes**: one block still takes every blow; ALL PARRIED and `rushparried` gone; nothing is stunned by a block.
- **Telegraphs**: the "red flashes white" parry cue is gone from the 2D floor, the 2.5D shader, the spider's pounce
  lane, the gaffer's lane and the rush link. The red telegraph and the striped unblockable edge stay.
- **Recap**: PARRIES and PERFECT PARRIES (and MOST PARRIES, MOST PERFECT PARRIES) gone; BLOCKS moves up beside DODGES
  in the six rows shown. An old board's parries are ignored.
- **Words**: class cards (Warrior "Holds a block over a large area. Blocking a blow sets up a counter."; Ranger
  "Jumps back to dodge. No block."; spellblade "Blink through a blow to refill it."), GUARD areas (BLOCK or NONE; was
  BLOCK AND PARRY / PARRY ONLY), the class picker's GUARD bars (Ranger 1 -> 0), BUTTONS (the BLOCK row; the PARRY
  row gone; the spellblade's line moves to its BLINK row), the unlock flash (always BLOCK), the kit rows, the "CAN'T
  BLOCK: TAP TO PARRY" call gone (a dodge class hears the old "CAN'T BLOCK: JUMP/DASH/BLINK"), a town tip, the
  BLOCK icon kept and the buckler PARRY icon gone. The yard tip now waits for three blocks or dodges.
- **Voice and effort**: there were no parry-specific voice hooks; the riposte's ring and MENDING PARRY's chime went
  to HEALING BLOCK. The MARK test needed nothing (no parry in it).
- **Online**: the Intent never had a parry field (a parry was a `blockSeq` tap; `blockSeq` stays for the netter's
  mash and the block press); an old guest's extra fields are ignored. Events `parry`, `rushparried`, `riposte`,
  `hooksnap`, `noblock` and `parrymend` are gone; an old guest's are simply not drawn.

**Lore**: the story bible's lines on the parry-only greatsword, RIPOSTE and the parrying spellblade are rewritten;
prose-notes' "the red flashes white" is retired.

Tests: `tests/noparry.test.ts` (no class can parry, every kit; no parry fields anywhere; each class's guard; a held
block for the blockers only, the counter opened; the crushing blow; old saves' PARRY to BLOCK or DODGE in every place
a piece can be, worth the same, WIDE PARRY to WIDE GUARD; the gaffer's hook and Hempen's noose, landed, blocked and
dodged; every striped attack spec in the tuning dodged by each dodge class and walked out of by the blockers; the
heavy's and butcher's blows dodgeable by every dodge class; an old guest's intent; a determinism run), and the parry
tests rewritten as block and dodge tests in `fight`, `warrior`, `manashield`, `magekit`, `rush`, `ironhide`,
`staithe`, `ladder`, `recapboard`, `practice` (both drills, and a real block on the yard's heavy), `woodfix` (the
wood per class: the Ranger straight to the goblins, the heavy classes past the stream), `wood`, `woodsign`,
`woodelement`, `knacks`, `knackfx`, `kitwords`, `shops`, `kits`. Shots: `shots/noparry-*.png`
(`node scripts/noparry-look.cjs`: a Warrior blocking the yard's heavy, a Ranger's controls, the Ranger's card).
Look scripts updated: `rush-look.cjs` (the block, not the parry), `moments.cjs`, `straw-look.cjs`, `shops.cjs`.

New and changed lines (for the lore keeper, then the line editor): WIDE GUARD / "Your block covers 20 degrees more" /
"block +20 degrees"; "Counters after a block do 25% more damage"; "Counter window after a block 0.6 s longer";
HEALING BLOCK / "Each blow you block heals friends within 3 tiles for 5."; COUNTERSTROKE / "Counters after a block do
40% more damage"; STAMINA ON COUNTER / "A counter after a block refills stamina"; BLOCK THE HEAVY / "Ten swings from a
heavy. Block as many as you can." / "BLOCKED n OF 10"; DODGE THE HEAVY / "Ten swings from a heavy. Dodge as many as
you can." / "DODGED n OF 10"; "Holds a block over a large area. Blocking a blow sets up a counter."; "Jumps back to
dodge. No block."; "Spellblade: hits drain your magic before your health. Blink through a blow to refill it."; BUTTONS
BLOCK "Hold to block. Your next blow after a block is a counter and hits harder."; spellblade ALSO "Hits drain, blink
through refills"; GUARD area "BLOCK"; tip "Most item traits pay off when you counter after a block, dodge or hit a
PERFECT". Not changed (records, not shown): `docs/copy-inventory.csv` and the copy-pass notes still list the old lines.
## 2026-11-05: the join storm on the Florida night, a deaf instance healed, and smoother friends (Kyle; Claude Opus 5.5)

Kyle (San Francisco) joined two friends in Florida (LIACOR led): "I kept losing connection, and lag was kinda
rough in general." The production logs (05:20 to 05:31 UTC on Nov 6, the evening of Nov 5 in California):

- **The leader's instance was deaf to the job's room all night.** At 05:20:57.128 Kyle's first socket to
  `PICWGD6HX` landed on instance `69845e` and logged `join` but never `decide`: the relay was waiting on its
  SUBSCRIBE, which Redis never answered (the instance's subscriber connection had gone half-open; GET and
  PUBLISH on the other connection still worked: the leader's `decide` 4 ms after its `join`). The room's set
  was already made, so the leader and the third friend joined it without subscribing. Everyone was on
  `69845e`, so it played; but that instance never heard the room's channel again. Its meter line at 05:27:56:
  `pub 20, kept 11,216`: every message stayed home for five minutes.
- **Then Kyle's 4-minute swap moved him** (05:25:02.199, to `6n38a3`). Nothing from the leader could reach him
  now. Five seconds of silence and his page rejoined (`coop.ts` REJOIN); each rejoin reset the hops, and each
  socket landing away from the leader hopped again at once, so every 5 s came four joins within 0.3 s (one on
  `6n38a3`, three on `6o09e6`), each socket closed 10 s later (`gone newest:false`), so eight or more open at once,
  for 80 s until the job was lost, plus one try at taking the job on (05:25:16, refused: the leader was fine). No errors were logged.
- **A third bug on the way:** a player's last socket leaving a room as another arrives could leave the room
  unsubscribed (the UNSUBSCRIBE landing after the newcomer's SUBSCRIBE), or subscribed twice (each message
  delivered twice).

**The fix, server** (`api/_subs.ts`, `api/_relay.ts`, `api/_backends.ts`):
- A SUBSCRIBE not answered in 2.5 s means the subscriber connection is dead: the relay opens a fresh one
  (`bus.reset`) and subscribes again to every room it has players in, then says `here` in each so the
  others answer. A player never waits on it longer than that.
- Each instance hears its own `here` come back on the room's channel (free: it goes out anyway). Not back
  in 5 s, and the connection is reset the same way. At most one reset in 10 s.
- Subscribing and unsubscribing a room go one at a time, in order; a room is only unsubscribed (and `away`
  said) if nobody's in it by then; one listener per room, so a double subscription can't deliver twice.

**The fix, client** (`src/client/relay.ts`, `backoff.ts`, `coop.ts`, `game.ts`):
- One socket per room and player: a second RelaySocket for the same room closes the first; a page holds its
  current connection and, during a swap, the one it replaces, never more; the old one closes the moment the
  new one talks (it used to wait for its own next message, or 10 s).
- Never more than one connection opening: a rejoin while one is opening is dropped; one asked for a moment
  after the last opened waits out a backoff. Failures back off 0.25 to 15 s, doubling, half of each wait
  jittered; a connection that stayed up 30 s starts the count over.
- Hops (to land beside the leader): one at a time, about 1.5 s apart, three in each 4-minute rotation; a
  rejoin no longer hands out fresh ones.
- Rejoin when the leader's quiet: 10 s before the first whole room (a leader across the country, a slow
  page), 5 s after; each rejoin in a row waits twice as long, to 30 s, jittered; hearing the leader starts it over.
- Starting a job (leading or following) closes any job socket still open from before.
- The Come Bye rules stand: heartbeat every 4 s (it now also times the trip to the relay, `rtt`), a swap
  every 4 minutes (new socket first), only the newest connection says goodbye, joiners never claim.

**Lag** (`src/client/playout.ts`). The path for a split party: Kyle to `sfo1` (about 10 ms), Redis (1 ms), the
leader's instance, out to Florida (about 70 to 85 ms through the `iad1` edge), and back the same way, plus up to
0.1 s at each relay waiting for its batch (a button skips it), plus the leader's send every 0.05 s. Kyle's own
hero is already predicted (walks at once); others and goblins came in pairs a tenth apart when split, so each
pair drew its second patch at once and then stood still. Now a friend's page plays the leader's patches at the
pace they were made: each waits only as much as it came early against the last two seconds, never over 0.1 s.
Hits and sounds in a patch don't wait. Inputs: a button at once (urgent), the stick at most 10 a second; left as
they were. The split batch stays 0.1 s (Kyle wants low lag).

**Measured** (`scripts/florida-online.cjs`: real redis-server, the two local relay instances, the leader 70 ms
away each way on instance 1, whose subscriber connection is half-open for job rooms as `69845e`'s was, Kyle in
with them at first and every later connection on instance 0; 60 s of both walking; headless Chromium, so
low frame rates):

| | Before | After |
|---|---|---|
| Kyle's job joins, first 30 s after setting out | 25 (at most 9 sockets open; never got in; job lost at 35 s) | 1 (at most 3 open: town, chat, job) |
| Setting out to Kyle in the leader's room | never | 4.4 s (2.5 of it the dead SUBSCRIBE) |
| The connection unhealable (`NORESET=1`) and Kyle always on the other instance: client alone | (as above) | 6 joins in 35 s, 3 open at once; can't get in, as expected |
| Redis commands a minute | 18 (the leader's instance kept everything home) | 19 with the party together; 1,173 split, as Nov 5's 1,165: nothing new per message |
| Leader drawn standing still while walking, on Kyle's screen, split (`PLAYOUT=0` is the old way) | 27.5% of frames | 11.3% |
| Same, together on one instance | 13.4% | 9.3% |
| Input to leader and back (Kyle's `trip`), split | 0.29 s | 0.37 s (the playout's ~50 ms included; hits and sounds don't wait) |

The online scripts all pass (town, party, chat, lobby, exped, florida). `npm run test:stress` fails 17 of
29 scenes, the same 17 on the untouched base commit (the LEAVE button not clickable, heroes stopped at 27.7 on
the new maps: the atlas and UI merges, not the wire), so nothing here changed it.

Unit tests: `tests/relaysocket.test.ts` (one socket per room; a deaf instance rejoined every 5 s for a minute
opens at most 16 sockets, 2 at once: the old client opened 51; no second socket while one opens; backoff;
the swap), `tests/relaysubs.test.ts` (a SUBSCRIBE never answered; a connection that answers but delivers
nothing; a leaving player and an arriving one with a slow UNSUBSCRIBE: the old relay fails all three),
`tests/playout.test.ts`. The local server (`scripts/online-server.ts`) gained `BUS_LAG_MS`, `DEAF`/`NORESET`,
`FAR_MS` and the `/api/room/f1` route.

**The swarm on the wire** (Kyle: the lag was worst on the big expedition map, with lots of goblins on screen).
Measured in Node (`scripts/bigmap/swarm.ts`: the Barrowfields, a leader and three friends together, N goblins
awake on them and kept up, each friend's messages exactly as `bigsend.ts` makes them, at the leader's pace of
about 17 a second here). What filled them: a goblin's blow in progress, 56 to 61% of every byte. Its own clock
`t` ticked every tick, so the whole blow (twenty fields) went again in every patch for every goblin swinging,
and again when `done` flipped as it landed. Now (`client/interest.ts`, for every room, not only big ones):

- the blow goes with `t0`, when it began, and a friend works `t` out (`loud`), as a goblin's act clock already did;
- what a blow does when it lands (damage, knockback, recovery, its target, `done`) stays the leader's;
- `smokedUntil` (refreshed every tick in smoke, read only by the leader's room) stays home;
- facing to a tenth; knockback to a tenth and none under 1 (the long tail of a slide; dust and tumbles look at 1.5 up);
- friends' periodic whole rooms go at least a second apart (they'd all started together, so every 4 s three
  40 KB fulls left the leader at once), and a friend who needs one now still gets it at once;
- the whole-job save (37 to 80 KB on an expedition, in parts) goes to the friend first in line to take the job
  on every 2 s and to everyone every 8 (it went to everyone every 2 s, and sat ahead of their next patch), and
  never in a frame that sends a patch (it waits up to 0.2 s for a frame without one; on a slow page, where every
  frame has one, the patch waits a frame instead: the first version waited forever there, and stress scene 7,
  a leader reloading, came back to no save of the job).

| Awake on the party (in a friend's ring; on a phone screen) | Bytes a message, mean / p95: before | after | KB/s to each friend: before | after |
|---|---|---|---|---|
| 40 (66; 36) | 7,260 / 10,175 | 3,836 / 7,660 | 122.5 | 64.6 |
| 50 (69; 42) | 8,571 / 12,180 | 4,669 / 8,899 | 146.9 | 79.7 |
| 60 (72; 55) | 9,786 / 14,982 | 5,617 / 11,461 | 167.7 | 96.3 |

All three friends together, the leader's upload at 60 awake went from 503 to 289 KB/s (about 4 to 2.3 Mbit/s),
before the saves (now about a third of what they were for friends second and third in line). Not done, as the
numbers didn't call for it: a narrower ring or a byte budget dropping far idle goblins (the 17 or so in the ring
but off a phone screen are mostly still, and a still goblin costs nothing in a patch); the send rate is as it was
(every 0.05 s from the leader, 0.1 s batches between split instances). The next big cut, if it's needed: friends
standing together share one message (now each gets their own from the same goblins, three times the upload).
Tests: `tests/swarmsend.test.ts`.

**Redis is beside the functions.** The live logs show a guest's `join` to `decide` (one GET) in 2 ms and a
host's (two or three commands) in 4 ms: Redis is in `sfo1` with them (across the country is 60 ms or more a
trip). Each instance now logs `{ev: 'inst', redisMs, region}` from its first command, so it's on record every
deploy, and `decide` lines carry `far: 1` when a friend lands away from the leader (that night: every one of
Kyle's joins after his swap, about 65 between 05:25:02 and 05:26:23, when the job was lost and he was back
in town). Upstash is billed pay as you go now (4 cents this month so far).
The Outbox still holds a split party's ordinary messages up to 0.1 s (`api/_outbox.ts`), by Kyle's choice; a
button press, a join, a leave, a new host and `here` go at once.

**Not built: a leader whose tab is hidden.** Out of sight, the leader's room runs on `setInterval(100)`
(`main.ts`), which Chrome holds to about once a second for a hidden tab (and once a minute after five minutes),
so friends get about a patch a second; a phone that freezes the page stops it outright. Proposed: hidden over
2 to 3 s with friends in the job, the leader hands the job to the friend first in line (`handOver`: the whole
job to everyone, then goodbye) and follows them when back (`stepDown` already does that half). Smaller, for
desktop only: drive the hidden ticks from a Worker's timer, which Chrome doesn't hold back the same way. Either
changes what stress scene 4 ("the leader's page hidden 30 s": the room runs on, nobody takes over) expects, so
it's Kyle's call.

**Regions: leave `vercel.json` at `sfo1`.** Redis is in `sfo1` and can't move. Functions in `iad1` (or `cle1`)
would put every Redis command across the country (about 65 ms each way), so a split party's every patch would
cross it twice more, and the coast-to-coast trip between Kyle and a Florida leader is about the same either
way (the relay sits between them wherever it is). Both regions would put every coast-to-coast party on two
instances by design: split, about 70K commands an hour, and each Florida message through Redis in `sfo1` anyway.
**Who should lead:** with the relay in `sfo1`, every friend's trip is their way to `sfo1` plus the leader's. On
the Florida night Kyle leading would have given each Florida friend about 80 ms one way and Kyle none; LIACOR
leading gave Kyle about 80 and the other Florida friend about 140 (Florida to San Francisco and back). So the
best leader is the player nearest the relay (smallest `rtt`). Not built: it changes who leads the party (the
party card), so it's Kyle's call; `RelaySocket.rtt` is there for it.

## 2026-11-05: the atlas, slices 0 and 1: fewer doors with bigger insides, and Hangman's Wood as the first curated zone (Kyle; Claude Opus 5.5)

Kyle approved `docs/plans/atlas.md` today, with notes on top: "each place has a story, and it should have smaller
paths and scenes as you approach all the bigger areas, so it's not just one big hall to the next big scene"; "doing
bigger quests like this can get you relics, which right now don't drop often"; earlier, "bigger insides and houses,
but less of them". Numbers in `shared/hangtune.ts` (HANGWOOD, SNARER, HOIST, DROPPER, HEMPEN, WINCH, OAK, CHECK;
re-exported by tuning.ts); every word in `shared/hangwords.ts`.

**Slice 0, the doors rule** (`shared/doors.ts`, run at the end of `houses.ts settle`):
- **One house to go into a street.** Of a room's houses with a door, one is kept: standing before half fallen in
  before smouldering, a cottage before a barn, the bigger first. Layout 4's SMOKE house (`cottage:held`) is the
  room's objective and is kept besides (the plan's "a heart room may have two if one is the objective"). Over 30
  board days, both roads, every room: at most one ordinary door a room and **three a job** (the most found; a job
  with a SMOKE house can show four doors, the fourth being that scene's). The Barrowfields' hamlet keeps **two**.
- **The rest are shut**: `shut: 'boarded'` (pale planks over the door and both windows) or `'burnt'` (soot, the roof
  open, a black doorway), 60/40 by the house's seed, a smouldering one always burnt. No door, so no woodpile
  (`kindling` needs one), no lit window, no chimney smoke. They still burn as scenery. Fallen-in (blocked) houses
  are as they were.
- **Merge, don't delete.** The kept house's door names the houses it took in (`cottage:big:0c.3c.9c`): it becomes
  one of the big ones (longhouse or hall house for a cottage, the great barn for a barn: `big` on the block too, so
  it burns slower), and its inside (`inside.ts movedIn`) lays out the cages and chests that **each** of those
  houses, itself included, had in its own plan, on a stream of its own (the first cage in the layout's tucked-away
  spot). So a room's captives and chests are exactly what they were: checked over 60 days, both roads, 461 house
  rooms, against main: every room's cage and chest counts equal, and with door, shut and big stripped every plan
  byte for byte the same.
- **Seen from a distance**: firelight moving in the kept house's doorway (flat glow, a warm pane in 2.5D, a light
  in both views: `client/shutdraw.ts doorLights`), its woodpile, and the gold diamond over it whenever its plan has
  someone caged (`sim/goal.ts houseCaptives` now counts every unvisited house from its plan, not only on a
  rescue's last room; the banner says "1 more in the houses").
- **Pins re-pinned** only after checking: with the rule switched off (an env switch, since removed) the variety,
  layout-3, layout-2 and old-job pins were exactly their old values. New: variety 3136210020, layout 3 3987024697,
  route (old jobs) 1304300190, layout 2 356891114. Tests that are about going in and out of houses, not about
  which open, put the doors back first (`tests/undoors.ts`: split, runux, grim's fire test).

**Slice 1, Hangman's Wood** (`shared/hangwood.ts` the spine, `hangscenes.ts` the scenes; `sim/woodzone.ts`,
`snares.ts`, `dropper.ts`, `hempen.ts`, `hangfire.ts`; drawn by `client/wooddraw.ts`, `woodpieces.ts`, `fxwood.ts`,
`shutdraw.ts`). An expedition (`job.exped: 'hangmans'`) on the expedition kit, 72 by 48, posted on the board every
day after THE BARROWFIELDS, in Greyhollow (`expedjob.ts hangmansWood`; `?hero=WARRIOR&wood=1` to go straight in).
- **The fixed spine.** Way in (5, 44); the snare line (13, 39); the body by the waymark (21, 33); the gibbet
  crossroads (31, 26), its dead roads west and south; the pair with the sack (40, 31); the fork up the oak's own
  path to the Gospel Oak (43, 12), a side pocket; the fire, the mid-point (50, 23); Hew's blaze marks (56, 16);
  Hempen's ground (62, 9); out by the north path (66, 0). The seed only bends the trails between scenes (up to 1.6
  tiles), and places the trees (about 500, walling the trails to 2 to 3 tiles wide), the knots of goblins along
  the trails (about 40 goblins placed in all, plus the expedition's waves), one or two chests from four spots, and
  the sky. Every scene, job, the fire and the way out are walkable from the way in (tested on three days).
- **The approach, small paths and little scenes.** Each a few seconds of story or a small fight, said once over
  the first hero to reach it (a beat): the snarer kneeling at the last of its three snares, two dozing by; a body
  at a waymark with crows and a dropper in the branches over him; at the gibbet two winding someone up into the
  cage and the rest at their fire; two dragging a sack of charcoal up the path (their drag mark behind); Hew's axe
  marks on the trunks by the path (four trees nearest it); Hempen's hanging tree with its stock. Knots of 2 to 4
  between.
- **The gibbet's winch** (`winch`, a pinned job): stand in its ring (1.8) **24 s**, with any hold's grace and
  waves (`expedpressure.ts` treats it as the shrine). The cage comes down on its chain as you go (drawn from the
  job's progress, which a friend already gets); at the bottom it's a cage on the ground to break open like any.
- **The Gospel Oak** (`oak`, a side job: the brood mother dead): a wooden block (480), lamp oil by the path up to
  it. Any fire that reaches its wood lights it (`catching.ts`, unchanged). Alight, every **1.2 s** burning wood comes
  down 1.6 to 3.6 from the trunk on a striped circle (0.85 round, **1.1 s** warning): **14** to heroes, goblins hurt
  and set alight. The brood mother in the hollow burns **30 a second** and wakes. Falls are on the block
  (`falls`, `nextFall`), rolled on the room's fire stream.
- **The mid-point's fire** (`CHECK`): stand by it **1.5 s** to light it. Then the run is saved there: alone, your
  three downs start again from nothing (`run.ts`), and you get up by the fire; in a party, anyone down **8 s** with
  nobody at them, or out, gets up by it at half health, so a party that all goes down after the fire hasn't lost.
- **The snarer** (variant `snarer`, **30** health, a backer): keeps **3.4** off, every **6 s** kneels and lays a
  snare **1.4** in front of whoever it's after, between you and it; at most 5 out; each lives **45 s**, live after
  **0.6 s**, catches within **0.42**. The room's `nooses` (a new patch collection: a snare goes when it's laid or
  sprung, never per tick). Caught: **hoisted** by the ankle (the net's hold, `hoisted` on the hero, no struggling
  out) **2.5 s**, or a friend's GRAB within 1.3 (CUT FREE) cuts you down at once; left to drop, **4** damage.
- **The dropper** (a perch task at level 1, out of a blade's reach): a hero within **3.4** and it lets go onto
  where they stood, a shadow circle with a striped edge (**1.0** round, **1.0 s**); landing **12** and a knock to
  whoever stayed in it, then it's down **0.6 s** and fights. All on its task (`at`, `tx`, `ty`), so a friend draws
  the same circle. Three: at the waymark, by Hew's marks, over the way into Hempen's ground.
- **Hempen** (named butcher, **600** health): a butcher as any, and every **8 s**, with you **2.2** to **6** off,
  its noose down a thin red lane (the gaffer's hook's lane: block it, or parry and the rope's SNAPPED for a while);
  landed, you're hoisted as in a snare. With two snarers and a band.
- **The relic** (after merging main's relic rework, d98dfee): the posting carries `zone: 'hangman'`, so a won wood
  gives its relic once at the job's end through `awardRelic` (`shared/relicaward.ts`: the grappling hook first,
  then the wood's pool; one a job, the zone over the beacon). Hempen is `zoned`: it never drops one on the floor
  too (`pickups.ts dropRelic`), so it's never awarded twice. The posting says so.
- **The way out.** No beacon to hold (the plan's "where it fits": it didn't, at 6 to 7 minutes): once the winch
  is done and Hempen is dead it's straight out by the north path. Pays as the Barrowfields does (15% of the posting a
  job, 10% a side job; posting `payFor(4, 2, night, 'medium') + 40`).
- **How the cast bleeds in** (`shared/debut.ts`, a new `zone` on Debut): the snarer's template `snare` (a snarer
  behind 3 or 4 small ones) is staged in the wood until day 67, then rare in Greyhollow, then common from day 88
  (`from` 60, as the chalker's); the dropper has its Debut for the record but no pack yet, so it's the wood's only.
  The template at weight 0 while staged moved no pin (checked).
- **Drawn, flat and 2.5D, one source.** Pieces (`pieces.ts` hands to `woodpieces.ts`): the gibbet (post, arm,
  winch drum), the waymark stone, the Gospel Oak (trunk, hollow, ribbons, crown; a black stump once burnt). On the
  ground (flat glow, the 2.5D overlay): snares faint striped, the dropper's shadow darkening, the oak's falls
  striped red, the fire's ring of gold dots. Stood up (flat items, 2.5D cards): the cage on its chain with someone
  waving in it, the axe marks, the fire pit. With the body: a dropper's rope, the snarer's coil and stake, a hoisted
  hero lifted on a rope, the sack. The fire's light in both. The map screen titles itself by the map and pins the
  fire (FIRE).

**Online.** The room decides everything with its seeded streams; nothing new rolls on a guest (the map is built
from the seed on every screen). Deltas only: the snares come and go in `nooses`, perches and the oak's falls are
fields on the goblin and the block, the fire and beats in the expedition's view. A test encodes ticks with snares
lying still and droppers waiting: no snare, block or task field goes. `scripts/exped-online.cjs` takes `ZONE=hangmans`:
Kyle on a laptop and Sam on a phone in the wood, 120 ms lag: same map on both screens, Sam got 20.4 KB/s (16.7
messages a second, biggest 17.7 KB), saw 9 goblins of 43, had the snare line and the winch from the leader.

**Tests**: `tests/doors.test.ts` (5: one door a room, three a job; the rest shut, no door, no woodpile, both looks;
the kept house big and holding every cage and chest; a rescue's captives all in it; the hamlet's two),
`tests/hangwood.test.ts` (12: the spine fixed and the details seeded; walkable; the beats in order and once; the
fire alone and in a party; the winch, its grace and the cage; the oak's ring and the brood mother; snares hoist,
no mashing out, cut down, the drop; the snarer lays them; the dropper's circle; Hempen's noose and the relic on
three days, with no relic on the floor; the wood's relic once at the job's end, the hook first; the same fight
twice; a friend's patches). Shots: `node scripts/atlas-look.cjs [url] [outdir]`
(targets `npx tsx scripts/atlas/find.ts`).

**New names and lines, lore keeper's pass applied** (`shared/hangwords.ts`; the line editor's still to come):
Hangman's Wood (exists), the Gospel Oak, the snarer, the dropper, Hempen (as `HEMPEN`), the north path. Posting:
"The hungry have put the old gibbet at the crossroads in Hangman's Wood back to use, and there's somebody alive in
the cage. Get them down, and kill the one they call Hempen."; "One wood, about 7 minutes"; "{n} gold and a relic off
Hempen, more for each job done. Half if you don't get out". Pins and jobs: GIBBET "Wind the gibbet cage down: stand
at the winch" / "The cage is down"; OAK "Side job: burn the brood mother out of the Gospel Oak" / "The Gospel Oak is
burnt out"; HEMPEN "Kill Hempen" / "Hempen is dead"; FIRE (map). Banner: "Light the fire in the clearing"; "Hempen is
dead. Out by the north path"; "The fire's lit. Anyone who goes down gets up by it now"; "Your jobs are on the MAP.
Keep to the paths." Beats: "Snares on the path, and they're hard to see. Watch your feet."; "The crows got to him
first. Mind the branches over him."; "They're winching the cage up, and there's somebody in it."; "That's a sack of
charcoal they're dragging, and they're taking it out of the wood."; "Old axe marks on the trees. Hew's, I'd bet,
nobody else worked this deep."; "The Gospel Oak. Something's living in the hollow."; "There's rope on every branch,
and most of it's in use. This is where Hempen keeps them." Callouts: SNARED, CUT FREE (the net's word: one word for
one thing), LOOK UP (SNAPPED as the gaffer's). Recorded in docs/lore/story-bible.md ("Hangman's Wood"): the pre-war
gibbet (who hanged anyone there never said), Hew's old blazes running north, the Gospel Oak (the bounds, faded
ribbons, no god named), spiders in Greyhollow, charcoal carried out (where to, unsaid), ankle-hoisting, the snarer
and the dropper, Hempen among the named butchers (called "it"), the north path coming round to the Wickhold road.

**Open for Kyle**: the numbers once he's played (24 s at the winch, 8 s for the fire's get-up, 6 s a snare, 2.5 s
hoisted, the oak's 1.2 s, Hempen's 600 and 8 s); the Gospel Oak and gibbet are box pieces, and the oak reads as a
wide brown trunk more than a tree, worth a Blender pass; the hanging-tree scene is still also a random roll in
Greyhollow (taking it out of the roll would move the layout-4 pin, so it's left for its own slice); the wood is
fewer goblins than asked of the knots (about 40 placed) since the scenes leave little trail between them.
## 2026-11-05: relics made sure, with few uses; the big jobs give them (Kyle; Claude Opus 5.5)

Kyle: "Doing bigger quests like this can get you relics, which right now don't drop often, like the spear or
the grappling hook. We should also increase the power of those items (e.g. always skewers and shoves etc) but
limited uses."

- **Every relic is sure.** Nothing a relic does is left to weight, a goblin's striped blow or the stun cap:
  its stuns go through `relicStun` (`sim/stuns.ts`), never capped or shrugged off. Every relic still spares
  friends (gold telegraphs, SPARED, the existing tests plus new ones).
  - **Relic Javelin** (4 uses): skewers every goblin in its line, a butcher as much as a scrapper, carries
    them all on the shaft (`Javelin.held`, tip first), and pins the lot to the first wall for 3 s (+12 each);
    at the end of its range it comes down and pins them to the ground. One that can't be moved (a dummy, one
    on a roof) is pinned where it stands and the javelin goes through. A friend it passes is SPARED. Cooldown 4 s.
  - **Grappling hook** (4 uses): any goblin it reaches, whatever it weighs and whoever throws it, is dragged
    to your feet and lands knocked down 1.3 s (it used to be a Warrior's or Healer's job to haul a big one,
    and a butcher arrived angry, not reeling). It catches a goblin 0.45 off its line. A pinned or immovable
    goblin, a wall, a pillar or a heavy prop pulls you to it. A blow to you no longer drops a goblin mid-yank.
  - **Butcher's knuckle**, the shove relic (4 uses): a line 6 long, 1.1 wide; every goblin in it knocked
    down 1.4 s and thrown 20 as if it weighed what a scrapper does, 18 damage, MARKED.
  - **Gall bomb** (4 uses): bursts 2.6 across, 22, every goblin knocked down 1.3 s and thrown as hard.
  - **Lodestone** (3 uses): every goblin within 3.6 of where it lands is taken (held, drawn in at 3.5 tiles a
    second, not by weight) for 1.2 s, then the burst (1.8, 18) knocks them all down 1.2 s.
  - **Wind-up bow** (3 uses): 9 s, a bolt every 0.45 s that flies at its goblin all the way (`Bolt.seek`), so
    it never misses; 8 damage, slowed to 35% for 2 s.
  - **Bone whistle** (4 uses): every goblin within 4 drops its blow, striped ones too, and reels (1.6 s small,
    1 s big); friends quickened as before.
- **Few uses, and fading.** Uses by kind (`RELIC_USES`, 3 to 4); an elemental one holds one more, a LOUD one
  two (so 3 to 6). Every use spends one. The relic fades by stages (`relicStage`): full, used, half or less,
  LAST USE, dark. The icon is drawn a step greyer each stage (`client/relicicons.ts`) and the card dims with it
  (`.rcard.fade1..3`), tagged FADING then LAST USE. The RELIC button carries the uses as 2x2 pips along its foot
  (lit for each left, hollow for each spent: gold, amber below half, red-brown at the last); the card shows pips
  and "3 USES LEFT"; the laptop line shows pips too. The last use says its short name and DARK over the hero
  ("JAVELIN DARK", the `faded` event). The wood's practice throws are free (the javelin is topped up every step
  there), so every hero reaches Wickhold with it full.
- **Spent: kept as a dull keepsake, not gone.** The lore already decides it: relics "fade with use and go dark",
  Isolde relights plain ones for gold, Odric takes any of them on the step, Ivo hears a dark one as silence. So a
  spent relic stays in the pack, DARK, grey on the button (a press says DARK), and the church is where it goes
  next: recharged (plain), given up for the light, or two for one. Its price per use is now 18 gold, so a dark
  javelin still costs 72 to relight.
- **Old saves**: an item without `v: 2` was counted out of 24 / 36 / 48; `fitRelic` keeps the same share in
  uses, rounded, never below one unless it was dark (12 of 24 on a javelin is 2 of 4; full stays full, dark stays
  dark), then marks it `v: 2` so it's never scaled twice.
- **Where relics come from** (`shared/relicaward.ts`): `awardRelic(run, rng, source, owned?, kinds?)` is the one
  path. It rolls on the caller's seeded stream, notes `{ item, from }` on `run.relicsWon` (new on `Run`) and
  returns the item. Sources: a curated zone's climax (`{ zone: 'hangman' }`), a story job, the expedition's beacon
  held, a deep dive's butcher, a named butcher's drop. A zone names a relic or a pool (`ZONE_RELICS`): Hangman's
  Wood gives the **grappling hook** (a hook on a rope out of Hempen at the gibbet; the bible already says the hook
  is the next relic found after the javelin), then one of hook, wind-up bow, javelin; Coldscar's pool (later) is
  knuckle, bomb, whistle. Each source prefers a kind you lack (plain, full), then rolls; story jobs, the beacon and
  zones roll elemental more often than a drop. At a job's end (`game.ts finish`) each player takes home what the run
  already holds (a zone's climax, copied) and the job's own sure relic (`wonRelics`: one a job, zone over beacon
  over story over deep), seeded per player so each gets their own. `deepRelic` keeps its signature and goes through
  `awardRelic`. A named butcher's drop is now 4 in 100 (was 12).
- **The recap**: the RELICS row lists every relic gained, picked up or awarded, with its uses: "GRAPPLING HOOK (4
  USES)". A relic from a job with no butcher to cut it out of says "You bring the X home." instead.
- The lore keeper's pass is applied (javelin and bomb USE, the elemental lines, the empty step, the legend, the
  wood, "uses" for "charge" throughout, the bible's notes on spent relics, where sure relics are found, and
  Hempen pending Kyle). Words for the line editor still: the seven USE lines in `relicwords.ts`;
  "3 USES LEFT" / "1 USE LEFT"; USES (row); FADING; LAST USE; "4 uses, and it dims a little with each one. The
  church can recharge it."; "... It holds more, but it can't be recharged."; "Nothing left in it. The church can
  recharge it." (and the can't-be-recharged one); "GRAPPLING HOOK (4 USES)"; "You bring the X home."; the empty
  step's line; the legend's RELIC line; the wood's RELIC lesson line (it said the javelin comes back to your hand).
- Tests: `tests/relicpower.test.ts` (each relic sure against weight and the stun cap; friends spared; a use spends
  one; stages and dark; old saves; drop rate; the zone award; awards seeded; a guest sees the skewer, the pins and
  the charge through deltas; determinism), and the older relic, hook, fight, wood and deep dive tests moved to the
  new numbers. Shots: `node scripts/relics3-look.cjs` (phone: the button's pips as the javelin skewers a line; a
  card at its last use).

## 2026-11-05: the Staithe: NETS on layout 4, the gaffer and the skimmer, and the Staithe on the Barrowfields (Kyle; Claude Opus 5.5)

Kyle approved the biomes proposal ("continue all approved"), section 2 and rollout items 4 and 5, and asked
for "the river in the middle should have maybe a fishing village in the center sometimes" and more scenarios.
Every number in `shared/staithetune.ts` (STAITHE, GAFFER, SKIMMER; re-exported by tuning.ts); every word in
`shared/staithewords.ts` and `shared/ways.ts` (NETS).

**The Staithe** (`shared/staithe.ts` lays it; `sim/staithe.ts`, `staithebits.ts` the rules). Eel-catchers on their
jetty over deep water, the hungry at it as you come in. Laid in the river's own terms (along it, across it from
the near bank), so a river across the room and one down it are the same scene.
- **The ground.** A NETS room is a ford room whose river is **5.8** wide with **one** ford near an end
  (`frame3.ts`). The jetty (**5.2** long, **2.3** deep) stands **1.3** off the near bank: its footprint is cut
  out of the water (you stand on it), the gap to it is a deep `span` box only a laid log crosses (`arena.ts`
  `solid`, `spanned`; `pathgrid.ts`, `roomreach.ts` read the same). Blocks: `jetty` and `gangway` (boards: `deck`),
  `smokehouse`, `dryrack`, `hungnet` (`soft`: never collided); props `punt` (cover; a Warrior lifts it) and
  `lamp`. Growth is cleared off the bank first; the smokehouse is never put behind the landing.
- **1. The log.** Log-carriers at the bank are laying their log across, **35%** of the way as you come in, across
  in **14 s** more while they keep at it (a red ring of dots at their feet filling: a clock, not a blow). A hero
  within **2.6** or a blow takes them off it. Across, they set it down, become two goblins and go over it, the band
  after them; a goblin on the jetty takes someone off it every **4 s** (LOST). **Kill the carriers first, or SHOVE
  it**: GRAB within **1.3** of its bank end (the button says SHOVE) and it's in the river, goblins on it with it.
  Its clock is two times on the gangway block (`layAt` while it's laid, `layLeft` while it isn't), set when the
  carriers start or stop, never ticked: a friend's screen works it out.
- **2. The netted.** One in a net on the bank as you come in, and the gaffer hooks another off the jetty's end
  every **7 s** until it's pulled off its work. GRAB within **1.25** (the button says CUT FREE): they stand and follow.
- **3. The hold.** With the log dealt with, stand in the ring on the bank by the gap (**2.6** round) and hold it
  **45 s** while the punt goes over and back in **3** trips; **1.5 s** of grace stepping out, then it pauses. Each
  trip takes its share of the folk on the jetty and everyone you've freed standing by the ring over the water:
  saved (`survivorhome`, counted to the room). **2** goblins come along the bank from each side at each trip's
  turn; with nobody left standing the punt goes **4x** quicker. Over when the last trip lands, or nobody's left
  on the jetty, in a net or by the ring. The way on opens once the goblins are down and the Staithe's over.
- **Pay**: NETS pays **+10%** of the job's pay for each one saved (`waypay.ts` reads the room's count, as SMOKE
  and CRIES). The recap's LOST row says "**n taken from the jetty**" (taken, killed where they waited, or left too
  long); someone left in the smokehouse is "to the fire" as any house's.
- **Hung nets**: walk into one and you're held **1 s** (a netter's net: struggle, or a friend's CUT FREE), not
  again for **2.5 s**; a goblin is held the same. Wood with **12** health: fire takes them in half a second.
- **A broken lamp** spills its oil on the water a step from its post, unlit; it drifts downstream (below).
- **The smokehouse**: two torch-bearers get it going as a house in layout 4's SMOKE scene (the same machinery);
  alight it **smokes 40 s** (one of the room's smokes: goblins can't see through it) while its timbers burn away
  (**960** health at the usual 24 a second), and the one inside cries out (their own lines) until pulled out of
  its door (stand still **1.6 s**, as ever) or it falls in on them.
- **Racks** are wood (**40**): fire takes them. **Punts** are props (**70**, weight **5**): cover, and a Warrior
  lifts and throws one.
- **A jetty burnt through** (**300** health) throws everyone on it to the bank by the ring, hurt **6** and held
  **0.8 s**; the folk on it land there too (then follow), goblins on it go in the river.

**Oil on water** (`sim/drift.ts`; the newest world effects entry's "oil on water"). A slick on a river drifts
downstream at **0.42** tiles a second (`shared/waterbody.ts flowAt`: the same rule the painted water runs by),
on under the jetty's boards. Lit, it burns **12 s** as it goes (rain shortens it as any oil), and lights wood
it passes (the jetty, its nets, racks) and any oil it touches. A goblin standing in burning oil on the water
isn't put out by the water (`steam.ts onOil`). Its place goes to friends in **0.3**-tile steps, not every tick;
both views ease it along between them (`staithedraw.ts driftAt`).

**The gaffer** (`sim/gaffer.ts`; a squad goblin, only at the Staithe for now). A pole with an iron hook. From up
to **4** tiles it throws the hook down a **thin red lane** (blockable; white while a parry would land, as every
telegraph): **blocked**, nothing; **parried**, the hook snaps (**8 s** of only a jab) and it's stunned as any
parried goblin; **landed** (**6**), you're hauled across to the nearest brute within **8** (its own feet if none),
held **0.6 s**, the brute ready to swing. Keeps **2.4** off. **34** health.

**The skimmer** (`sim/skimmer.ts`; a world-effect goblin). It stands at the water up the bank, and every **9 s**
while it's awake pours its pot on the water and puts a light to it: a **striped** circle (**1.1** round, nothing
to block) on the water, then burning oil drifting down onto the jetty. Back to its post if moved, off if you
come within **3.5**. **Frost pins it** (any chill or freeze): **4 s** of nothing, its pour spilt. **22** health.

**The Staithe on the Barrowfields** (`shared/expedstaithe.ts`). Rolled on **45%** of maps from the map's seed on
its own stream; laid where it fits (between the fords, at least **9.5** clear of each, off any camp, chest, cage,
job or building, **16** from the way in), so **about 1 map in 3** has it (30 of the first 90 days). Laid **last**:
the river broadened to **5.8** for **13** tiles round it, its ground cleared of growth, fences and carts there
knocked flat, anyone standing there moved down the bank, and its goblins taking the place of as many scattered
knots (the map holds 150). So **a map without it is byte for byte what it was, and a map with it is the same
everywhere else** (a test builds both). **Half** pin it in the last job's place (2 or 3 jobs still); else it's a
side job. It's done when the punt's over (paid as any job); **left alone it plays out**: at **ALARM 3** the
smokehouse catches, at **ALARM 5** everyone on the jetty, netted or shut in is lost and it's over (done, so the
beacon can open, but nothing paid: "Too late for the folk at the Staithe.").

**Online.** The room decides everything; nothing new rolls (the Staithe's place and the folk come from the
seed and the map; the gaffer's and skimmer's clocks are the room's time). What a friend needs is on the blocks
(sent as patches when they change: the log's and the hold's clocks as times, never deleted, so a stop reaches
them too), the survivors (`stay`, `netted`) and the slicks; no new collection and **nothing sent every tick**
(a test encodes two seconds of laying and finds no change to the log's block).

**Drawn, flat and 2.5D, one source** (`client/staithebox.ts` boxes through `pieces.ts`, as the braziers and fences
parity work): the jetty on its piles (charred stumps once burnt through), the log with planks lashed over it,
the smokehouse with its louvre, racks of eels, nets on poles; punts and lamps as props in both. Boards are painted
under everyone standing on them in the flat view. The log's clock, the jetty's ring, the punt going over and back
with its punter and folk, a net over the netted (`staithedraw.ts`); the gaffer's pole and hook, the skimmer's pot
and taper, rimed while pinned (`staithekit.ts`); the hook lane (flat `foes.ts`, 2.5D `teleg3d.ts` as a 0.07 lane),
the pour's oil and catching flames (`telegraph2.ts`); lamp and burning-oil light in both (`roomlights.ts`); the
NETS cue past its gap (two lamps on posts, a net between them, water). The smokehouse's catching ring at its wall
and its pull ring at the door in both.

**Tests** (`tests/staithe.test.ts`, 21): the NETS way appears at a fork and leads into the Staithe (and pays 10%
each); the folk; the carriers lay it unless killed, and across, goblins board and take folk; killed first, it's
never laid; SHOVE; CUT FREE; the hold's trips, saved and pay; the pause after grace; nets catch and burn; a lamp's
oil and the skimmer's drift downstream (not across) and light the jetty; a jetty burnt through; the smokehouse's
40 s, cries and loss; the hook blocked, snapped by a parry, and hauling to the brute; frost pins the skimmer; the
Barrowfields' placement (1 in 3, middle row between the fords, deterministic, foes capped), the rest of the map
unchanged, and ALARM 3 and 5; a friend's patches carry it and two runs agree; the log's clock sends nothing while
it ticks. `tests/scenes4.test.ts`: the well's test now takes a room where the well found ground (the reshuffle met
one too crowded, which falls back to a fire as designed). **The layout-4 pin re-pinned** to 2866841078: with NETS
left out of `waysFor` it was still 47426855, so NETS joining the ways is all that moved. Layout 2 and 3 pins
unchanged. Shots: `node scripts/staithe-look.cjs [url] [outdir]` (targets: `npx tsx scripts/staithe/find.ts`).

**Lore keeper's pass (applied the same day; the line editor's still to come):** eel-folk is **eel-catchers**
everywhere on screen. The way: "NETS: eel-catchers holding out on their jetty, the hungry laying a log across. +10%
pay for each one you save". Banners: "The hungry are laying a log across to the jetty. Kill the carriers, or shove
the log in the river once it's across"; "The log's across. GRAB at its end to shove it in the river before they take
everyone on the jetty". Callouts **IN THE RIVER**, **HOOKED** (the hung net), **PUNT ACROSS**, **FROZEN** (the
skimmer; PINNED is the spear's). Recap "n taken from the jetty". Calls: "Get a knife to it, please!", "The racks have
caught, it's on my arm!", "That's the last of them, push off". Big map: "Get the eel-catchers off the Staithe: deal
with the log, cut the netted free, hold the ring for the punt". The rest stand as written (shared/staithewords.ts):
the Staithe, Withy Staithe, NETS, the gaffer, the skimmer, STAITHE, SHOVE, CUT FREE, "The log's across!", TAKEN,
SNAPPED, the other banner and call lines. The gaffer's pole is a fishing gaff taken off the eel-catchers, never a
billhook (drawn as a pole with a plain hook). Recorded in docs/lore/story-bible.md: Withy Staithe, the eel-catchers
(unwalled, boards up at night, never trade with Wickhold, the saved go to Wickhold, Maud), the hungry don't cross deep
water (never said why, never a weakness the town uses), the gaff and the hoard's lamp oil, HOOKED and FROZEN. Pay
stays 10% each; the gaffer and skimmer stay at the Staithe only for now.

**Open for Kyle**: the numbers once he's played (14 s for the log, 45 s and 3 trips for the hold, the gaffer's 4
tiles, the skimmer's 9 s); the NETS pay is 10% each as asked (the proposal's layout-4 line said 15%); the
smokehouse finds ground in about 92% of NETS rooms (the rest go without it, never without the jetty, log, gaffer
or skimmer); the gaffer and skimmer debut only at the Staithe (no encounter template yet, as the proposal's
bleed-in says).
## 2026-11-05: the first recorded voices: the townsfolk in a made-up tongue, heroes' grunts, Clerics' prayers (Kyle; Claude Opus 5.5)

Kyle approved batch 2 today: "I like it being a Germanic inspired but fake language with real voices."
The words on screen stay the game's own English; the recorded voice only carries the tone.

- **The tongue** is `docs/sound/voice-tongue.md`: hard consonants, round vowels, -en/-och/-ach/-eth
  endings, a small word bank (häldan hello, tovach goodbye, drölle stray, saivren mercy, ölmeth holy,
  kraudt strike, ämmek coin, ötti no) and each person's lines. Real German, Dutch, English and
  Scandinavian words were kept out, and anything near heil, sieg or kampf; tummen, orren, rukke and
  trakk turned out to be real Swedish or Norwegian words and were changed. It never shows on screen.
- **Made** in ElevenLabs on one flow, "Relic voices batch 2". Ten townsfolk were designed with Voice
  Design (eleven_ttv_v3) from section 4 of the sounds list and new descriptions for Tobin, Edda, Maeve,
  Nettle and Brisk (English regional accents speaking the tongue), and saved as "Relic Hew" and so on.
  That filled the workspace's ten custom-voice slots, so the eight hero voices use ElevenLabs' built-in
  voices instead (they only grunt, gasp and pray): Harry, Callum, Matilda, Sarah, Liam, Lily, Bill,
  George. Eight hero voices were designed too but couldn't be saved; their preview ids are kept in
  `Relic Sounds/batch2/tools/` if Kyle frees slots. Lines are Eleven v4 speech, two takes each: 86
  lines, 172 takes. The preview to keep for each designed voice was picked by measured pitch and pace
  (nobody listened), so Kyle should audition them on the flow.
- **Processed** on Kyle's machine like batch 1 (`Relic Sounds/batch2/`: `raw/`, `game/`, `tools/` with
  qc.txt and measure.txt): silence trimmed, levelled by RMS to about -19 dBFS with the peak under -3 dB,
  mono 44.1 kHz MP3 at 64 kbps. Efforts came back as two or three bursts per take ("Hhrah!" grunted
  more than once), so each keeps only its strongest burst: grunts, gasps, cries and breaths are 0.4 to
  1.3 s. The townsfolk's lines are longer than asked (1.3 to 4.4 s, most 2.5 to 3.5 s); nothing was
  cut mid-word. In the game at `public/sfx/voice/` (2.7 MB).
- **Played** through the sample player, made bank-agnostic (`sfxplayer.ts` createSamplePlayer; the
  effects keep warming their whole bank, voices load only when wanted: a person's lines as you come up
  to them, a hero's set when first seen). Voices have their own bus under the effects bus
  (`voicebus.ts`), so SOUND silences them and the new VOICES switch in the options box mutes only
  them, remembered on this device.
- **Townsfolk** (`townvoice.ts`, wired in main.ts): a greeting when their panel opens and a goodbye
  when it closes, each at most once every 20 s per person. Hew, Orla, Odric, Judd, Tobin, Edda, Brisk
  at their spots; Maeve and Isolde at their trainer's spot; Nettle at his table. Tobin panics instead
  of greeting while you carry hungry gear; Nettle says his hushed line on SELL QUIETLY; Odric prays
  quietly when you give to the Lantern and whispers when hungry gear is left on the step. While a
  recorded line plays the typed letters don't blip; with VOICES off, a file missing or not loaded,
  the blip types on as before. A greeting still loading plays as soon as it lands if the panel is open.
- **Heroes** (`herovoice.ts`, from the soundscape's events): a grunt on a heavy swing (at most every
  1.2 s per hero), a gasp when hurt (0.9 s), a cry when downed, a breath on getting up, a laugh when
  the hound bowls a Ranger over (r_tackle, through a hook in idlepose.ts so posing stays sound-free).
  A Cleric near a heal murmurs a prayer (3 s), and says one hard on a smite (2 s). Voices follow the
  look (`voicebank.ts` LOOK_VOICE): every class has three looks on three voices, and the three Cleric
  looks have the three praying voices. Your own hero is heard full, the others a little back.
- **The one-file build** inlines `public/sfx/voice` too (`voicesrc.solo.ts`): 9.36 MB, under the 16 MB
  cap, so the solo page keeps its voices.
- Not voiced yet: Cole, Whisper, Vell and the other trainers and vendors, Hew in the wood's cutscenes.
## 2026-11-05: the Night Watch upright on a phone: they run at you (Kyle; Claude Opus 5.5)

Kyle, having played it: "Left to right on mobile sucks. Let's do top to bottom defence and they run
towards you. Can't get headshots as easily, but more accuracy and range is required." This replaces the
`tall` field (the steep side-on hill) of the earlier entry. Laptops and phones on their side keep side-on.

- **The view** (`client/deepview.ts`, `deepland.ts`, `deepgobs.ts`, `deepfx.ts`): from behind and above
  the hero on the wall walk, the parapet with its merlons and two torches across the bottom, the hero
  from behind at twice size, the fields running up the screen in perspective (furrows meeting at the
  horizon, darker in steps the further out) to hills and pines near the top, the sky a strip with the
  moon. Chosen when a shift starts if the screen is taller than 1.2x its width.
- **The geometry** (`shared/deeptune.ts`), in metres: goblins come in 55 m out (`DEEP.far`), anywhere
  14 m either side, and run for a spot on the wall within 1.5 m of you; 1 m out (`reach`) they're in under
  the parapet: THE WATCH HAVE IT. The eye is 8 m back from the wall's foot and 6.7 m up; a thing d m out is
  drawn at f / (d + 8) pixels a metre, f set so the ground 1 m out meets the parapet. On a 390-wide phone
  (6x): a goblin's head is 28 CSS px across at the wall, 20 at 5 m, 14 at 10 m, 9 at 20 m, 5 at 40 m,
  4 at the far edge. (With the eye 2.3 m back, as first tried, half the screen was the last 4 m and far
  goblins were dots in a strip at the top; 8 m spreads the depth down the screen.)
- **Pace:** 0.27 m/s for each px/s of side-on pace: a plain goblin runs 3.5 m/s (about 15 s to the wall),
  a runner 8 m/s and zigs 0.6 m either way every 5 m.
- **The bow** (`DEEP_BOW`): the arrow leaves the eye along the sight at 22 m/s (tap) to 45 m/s (full draw)
  and drops at 2.5 m/s2: a full draw takes about 1.1 s to 40 m and drops about 1.4 m, so far goblins need
  holding over and leading (a crossing goblin can move a metre in that time); a tap barely reaches.
  Spread 2.5 degrees either way on a tap, 0.25 at a full draw: at 30 m that's over a metre against under
  0.2 m. The draw, nock and damage numbers are the side-on ones (`BOW`).
- **Hit zones** (`DEEP_SHAPES`, `sim/deepzones.ts`): head, body and legs in metres facing you, plus the
  shield (it faces you, so it's hit first; the head over the rim is still a target) and the torch held up
  at the side. An arrow is judged where it crosses a goblin's plane; the drawing fills every pixel whose
  middle falls in a zone projected at that distance, the same test, so the pixels you aim at are the
  pixels judged (tested near and far). A goblin too far to fill a pixel is drawn as one dot.
- **Everything else is shared** with side-on: the clock, spawning, kinds, helmets, shield breaking, torches,
  archers (they stop 18 to 28 m out and shoot up at the wall; a near miss shakes the sight 0.03 for
  0.7 s), cloud over the moon, scoring, streaks, the card and the pay. What an arrow does when it lands is
  now one file for both (`sim/watchhit.ts`). Fog: distance dims goblins (none to 18 m, up to 70% at the far
  edge), and the night's banks roll in from 62 m out at 1.2 to 2.2 m/s, 8 to 14 m deep, 2.2 m high.
- **The best** is kept apart: `Profile.watch.deep` upright, `best` side-on (`bestOf` in
  `shared/watchpay.ts`); one pay cap a night across both. Brisk tells you the best for the view your
  screen gets.
- **Laptops** stay side-on: the mouse's sight is exact there and the wide screen suits the long field.

## 2026-11-05: the chalker, and how a new sort bleeds in (Kyle; Claude Opus 5.5)

Item 6 of the biome and enemy rollout Kyle approved today. Numbers in `shared/chalk.ts` (CHALKER, re-exported by
tuning.ts); the room's rules in `sim/chalker.ts`; the bleed-in in `shared/debut.ts`; its staging in
`shared/chalkstage.ts`; drawn by `client/chalkdraw.ts`, its moments and sounds in `client/chalkfx.ts`.

- **What it does.** A squad goblin (a backer: `BACK_ROLES`) with a lump of chalk and a tally board on its back,
  **28** health. It keeps behind its pack (**3** tiles), runs from anyone closer than **4.2**, and jabs with the
  chalk hand if cornered (4 damage). It picks the nearest hero it sees and keeps them, and chalks a stroke on
  them **1 s** after it first sees them, then one every **2 s**, its clock running only while it sees them
  (within **10** tiles, not hidden by smoke or Vanish, not blinded by smoke itself, not stunned, frozen, netted
  or mid-blow). The strokes are the hero's own field (`chalk`), so every screen draws them over that hero.
- **At five** every goblin of its pack within **14** tiles of that hero turns on them for **8 s** (`turnedOn`,
  `turnedUntil`): `nearest()` gives them that hero after a Warrior's taunt and a war cry (so a Warrior can still
  pull them off), and their blows on that hero land **1.3x** (`hitHero`'s `taken`); on anyone else as ever.
  Then the chalk is spent: the strokes go and the chalker, having rested its chalk for the turn, starts again on
  whoever is nearest.
- **Counters.** Kill it and no new strokes go on (the ones there fade **6 s** after the last, with no chalker at
  them; the same takes them off a hero who went on into the next room). **Vanish** (and SLIP AWAY, by the vanish
  rule), **smoke** (a smoke bomb, Vanish's, a flask's, steam: anything that hides you) and **blessed ground**
  (SANCTUARY, and walking SANCTUARY STEP ground, wherever it has moved to) wipe the strokes and call off a turn
  already on. It's fragile and keeps to the back: a Rogue's step and stab or a Ranger's arrows, by design.
- **The stun cap** doesn't come into it: the chalker stuns nobody, and a stun on it (capped as any) stops its
  clock while it lasts.
- **Seen.** Red strokes over the hero in a tally (four and the fifth across), outlined so they read in any light;
  the newest white for a moment, and the chalker's hand up with a fleck of chalk as it goes on. At the fifth a red
  flash, a burst, a shake, CHALKED, then the five pulse and a red sight turns at the hero's feet, blinking in its
  last second. Wiped: a puff of chalk dust and CHALK WIPED. Flat and 2.5D alike (the strokes on the 2.5D overlay
  beside MARK; the body and its kit are the flat figure on the card). Red, the goblins' colour: a blow coming.
- **Where and when** (`debut` on a template, `shared/debut.ts`, small and general so the gaffer and skimmer can
  use it): **staged**, **rare**, **common** by the job's board day. The chapter system can't say "a week later"
  (the chapter is always 1 and nothing in a job carries it), so it's a **job count**: the board's day, which is
  one finished job on the shared world's clock (`WorldState.day`), read off the job's id (`d12-0` is day 12; the
  story mission and old saves count as staged). The chalker's: staged from day `from` (**1**), rare from day 8
  (`rare` 7 days on), common from day 29 (`common` 28 days on, standing in for "a chapter later").
  - *Staged* (`stageDebuts`, called by `planRoom` for a layout-4 room reached by a fork way, after the chests are
    down): in the **CRIES** way's room in its home region (**Barrowfields**) it stands at a tally board near where
    the captives are led off, chalking them up (ten and the ones on the rope), one of the guards' pack (82), so it
    wakes with them and turns its chalk on you. A task (`tally`, `sim/tasks.ts`) holds it facing the board till
    it sees you; the board is drawn from the task in both views. Not one of the room's specials (it's the scene's,
    as the guards are). No dice: the room's stream is untouched. It stays in that scene in every stage.
  - *Rare*: the `chalk` template (a chalker behind 3 to 5 small ones, room 2 on) at weight **0.5**, in the
    Barrowfields only, and only in one room of a job (`rareRoom`, from the job's seed), so one a job at most.
  - *Common*: the template's own weight, **1.5**, anywhere it fits. Kept off the expedition (its packs are listed
    by id).
- **For Kyle:** a world already past day 29 meets it common at once. To give the live world a real debut, set
  `CHALKER.debut.from` to its day when this ships. The numbers above once he's played (2 s a stroke may be quick).
- **Online.** Nothing new is sent but the fields: the hero's `chalk`, `chalkAt`, `chalkedUntil` and the goblins'
  `quarry`, `chalkT`, `chalkAt`, `turnedOn`, `turnedUntil`, as changed fields in the usual patch. Cleared values are
  written as 0, '' or -9 (a patch never removes a key). Hero times ride `rebase` between rooms.
- **New words** (for the lore keeper, then the line editor): the name **CHALKER** (code and docs only for now:
  nothing on screen names sorts); callouts **CHALKED** (over the hero at the fifth) and **CHALK WIPED** (when
  Vanish, smoke or blessed ground takes the strokes off); the template's plain words "a chalker behind a crowd,
  chalking one of you" (never on screen). Lore to record or reject: the hungry keep tallies of what they take in
  chalk, in fives, and a chalker marks whoever the pack is to have next.

Tests: `tests/chalker.test.ts` (strokes on cadence while it sees, none while blinded by smoke or once it's dead,
then they fade; at five its pack turns, the turned goblin comes for that hero past a nearer one, 1.3x on them and
1x on another, ended after the turn; Vanish, smoke and SANCTUARY each wipe the strokes and call off a turn; a
guest's decoded room has the strokes, sent as changed fields; the same fight twice; staged in Barrowfields CRIES
rooms at its tally with the guards' pack and not elsewhere; the stages by day and the weights; in the packs none
while staged, at most one a job and only in the Barrowfields while rare, more and further afield once common).
`tests/variety.test.ts` re-pinned: the only change in its 280 rooms is the staged chalker added in five
Barrowfields CRIES rooms (no other foe, chest or block moved; checked by diffing every plan with and without it).
Shots: `node scripts/chalk-look.cjs [url] [outdir]` (a Rogue chalked three strokes in, and the pack turning, on a
phone, flat and 2.5D).

## 2026-11-05: heroes idle, three ways a class and a rare one; a Ranger plays with the hound, and hounds are petted in the lodge (Kyle; Claude Opus 5.5)

Kyle: "Let's work on custom class-specific idle animations. Three per class, with one extra hidden one with a one
in fifty chance of playing. I want Ranger to play with his dog a lot. Also can pet his dog in the hunter lodge."
Then: "Keep in mind different weapon types change the sprites if they're touching a blade etc." Drawing only.

**When** (`client/idles.ts`). Stood still 4 to 6 s (a range, per hero), an idle; then one every 6 to 10 s start to
start, with at least 1.5 s between. Only standing still out of a fight: not moving, turning, blocking, carrying,
stooped or mid-act, and no goblin awake (`alert !== false`, not dead) within 8 tiles. Any of those, a hit (health
dropping), or any input from this player (the stick, the aim, any press: `client/idlepoke.ts`, called from
`main.ts`) stops it at once and the wait starts over. Each hero's rolls come from a seed of their id and the clock,
so a party never idles in step. Each screen decides from what it sees, so other players' heroes idle too
(townfolk's heroes and a party's), with nothing new sent: tested against the real Game and Townfolk on a counting
socket, an hour of idling and petting sends exactly what standing still does.

**What, fitted to the weapon in hand.** Three a kit, and the rare one at 1 pick in 50 (tested over 50,000 seeded
picks a kit). An idle that needs something the hero isn't holding is never picked (`IdleDef.kits`, tested for
every class and kit).
- **Warrior**: rolls the neck and shoulders (any); thumb along the edge (sword, greatsword only: a blade); the
  shield planted on its rim and leaned on (sword only: the shield); the greatsword planted point down or the
  spear's butt grounded and leaned on (greatsword, spear); the spear rested back over the shoulder, drawn behind
  the body, a foot tapping (spear). Sword: stretch, edge, shield. Greatsword: stretch, edge, plant. Spear:
  stretch, plant, shoulder. Rare: a huge yawn, arms up, then a flex with a glint off the arm.
- **Ranger** (any bow or the crossbow, let hang for the throw): fetch (weight 3: a stick thrown out 2.4 tiles to
  whichever side has open ground, else the other, else a ruffle; the hound sits watching, runs it down, picks it
  up, brings it back, sits with it; the Ranger kneels to take it); a ruffle (weight 2: the hound comes to lean in,
  the Ranger kneels and rubs its head, a heart); a hand over the brow one way then the other, then over the
  shoulder to settle the fletching (weight 1). The hound five picks in six. Rare: the hound play-bows, runs and
  leaps, the Ranger goes flat on their back laughing with the hound standing on them licking, then up, still
  laughing. Without a hound free at heel, only the scan.
- **Rogue**: a knife flipped twice and caught (twin daggers: the one in the weapon hand goes up and held.ts leaves
  it out meanwhile, `Pose.hide`; a rapier or the poisoner's short sword stays in hand and a spare comes off the
  belt into the other); a coin thumbed up twice; over one shoulder, then turned right round to look behind. Rare:
  the flip comes off the fingers, bounces and is snatched low, a look round to see who saw, red in the cheeks.
- **Mage**: a small book held open in front, a page turned (the wand or spellblade lowered, the staff kept upright);
  sparks of the element in hand flicked off the wand's tip, the staff's head or the spellblade three times; a hand
  at the hat brim, tugging it. Rare: the brim flops down over the eyes, a blind wobble, pushed back up.
- **Cleric** (every Cleric kit carries the censer, heldkits.ts): the censer swung gently, its smoke thicker and
  curling; a prayer, eyes shut, hands together, a little light going up; a cloth on the mace's head, the flail's
  hanging head, or along the censer-bearer's sword, then a shine. Rare: the smoke drifts into the face, a squint,
  and a sneeze.
- The weapon is always drawn at the posed hand (`held.ts` with the idle's angle; `idlepose.ts`), never floating.
  Looking the other way for a moment draws the weapon as if facing it.

**The hound** (`client/idlehound.ts`, `hound.ts`). Where the hound is drawn during an idle or a pet is worked out
in tiles from where the room has it, so FLAT and 2.5D put it in the same place; the room's hound never moves for
it. `drawHound` takes a mood: tail wagging, sitting up, a stick in its jaws, head down to the ground, tongue out,
leaning in, up off the ground. Another player's Ranger in town now has a hound at heel too (this screen walks it,
nothing sent: the town only says where players stand), so their fetches show.

**Petting** (`client/petting.ts`). Only in the hunters' lodge. The lodge had no dog of its own, but Maeve already
says she has "a dog with better manners waiting", so **Maeve's hound now lies by the lodge's fire** (9.5, 2.25,
beside the brazier), and anyone can pet it: walk up and USE (E on a laptop). A Ranger can also pet their own;
being always at heel, it's offered only when nothing else is in reach, so it never gets in the way of talking to
Maeve or Tems. The hero kneels and reaches; the hound gets up (Maeve's from lying), comes to lean on them, wags
with its tongue out, and two hearts float up; then it goes back (Maeve's lies down again). 2.6 s, again after 1 s
more, ends at a step. Cosmetic and this screen's own (other players in the lodge see you standing, not petting).

**Words** (for the lore keeper, then the line editor): **PET** on the touch button; **PET YOUR HOUND** and
**PET MAEVE'S HOUND** on the prompt. Maeve's hound is unnamed.

**Cost.** One small record a hero (positions, a seed), checked once a frame; the goblin scan only for heroes
already standing still. A few fillRects for what's in hand. Nothing at all while walking or fighting.

Tests: `tests/idles.test.ts` (an idle only after standing still and again now and then; none while walking or
swinging; none with a goblin awake within 8 tiles, one waking ends it; a poke, a hit, a step or a turn ends it;
three a kit and the rare one about 1 in 50; every pick fits the weapon in hand, all three of each kit come up; a
Ranger's picks mostly the hound and none without it; drawing an idle leaves the hero and the room's hound as they
were; petting offered in the lodge for Maeve's hound and a Ranger's own, not for a Warrior's, nowhere in the other
halls, the yard or the square; the wait; a step ends it; Maeve's hound gets up and lies down again; an hour of
idles and petting sends nothing a still hero wouldn't). Sheet and phone shots: `node scripts/idles-look.cjs <url>
<outdir>` (every idle and rare at 4x, eight frames each, with the weapon variants; fetch in the square; petting
your own hound and Maeve's in the lodge).

## 2026-11-05: the budget checked again; the yard is this browser's alone, with straw men to practise on (Kyle; Claude Opus 5.5)

Kyle: "We should always double check, or at least once a day after big working days and pushes, to make sure
there's not more ways to save budget. Right now only town runs commands and you can't spam attacks etc except
in the training room. Maybe we make the training room local to just one person and it runs in their computer
to save inputs?" Then: "Should add to the training area then. Always set up, lets you try different scenarios
including spawning different enemy types to fight. Can say they're captive or something."

**What was sending traffic.** The yard sent nothing already: `main.ts` told the town where you stood only in
`town` mode, so walking into the yard closed the town's socket, and its fights ran in this browser. Measured
(real Chromium, a real redis-server, `scripts/budget-online.cjs`, which now also counts the page's own
WebSocket frames): 40 s of swinging nonstop in the yard, 0 frames and 0 commands. The wood and a job alone are
the same. What did cost was inside the town: every hall (a shop, the vault, the barracks, a house) is a place
in Wickhold, and your walking there went to everyone in town, though only someone in the same hall can see it.
And every patch of a job carried the run, the banner, the names and the houses' counts whole, 20 times a
second (bandwidth, not commands: a patch is one message either way).

Today's merges, audited: the recap board rides only in the end message and the saves (`lean` in `coop.ts`
holds); `signSeq` is a button, so it goes once a press, marked urgent, like every other press (the stick and
aim at most 10 a second); the fire wall is plain data (its middle is worked out from where it stops and when),
so a rolling wall is no delta at all; frozen goblins skidding are positions, as before; the vendors' 10-minute
stock is rolled from the clock on each device (`shared/vendors.ts` `stockWindow`), and their countdown is a
local timer, no request; the world effects (in progress on its own branch) add one collection, `ices`, to the
delta patch. Nothing new polls or sends per tick.

**Changed.**
- **The yard and its straw men are named as local** (`client/townpresence.ts`): only Wickhold is shared; out of it
  (the yard, the wood) the town's socket closes, and coming back opens it and says `hi` once. Closing beats
  idling: a close and an open cost the relay about 8 commands (close 5, open 3, measured on the real relay), an
  open quiet socket about 90 an hour (a presence beat a minute and a rejoin each 4-minute swap). So any stay
  over about 5 minutes is cheaper closed, and the Come Bye rules (newest connection says goodbye, swaps,
  tokens) are untouched. Going to the yard still lets go of a party you're gathering, as before.
- **In town, only the place you're in hears you walk** (`client/townfolk.ts`): alone in a hall you say only
  that you came or went (and your party, if you post one); the moment someone else is in the same place, you
  tell them where you stand at once. Two players on two instances, one in a hall: 87 commands a minute became 34.
- **Patches carry the slow parts only when they change** (`client/coop.ts`), as big rooms already did
  (`bigsend.ts`); a whole room (every 4 s, or for anyone new) carries all of it.
- **The daily check** (`scripts/budget-check.cjs`): `tests/townbudget.test.ts` in seconds (the page's real
  Game and Townfolk on a counting socket, the relay's real open, close and swap costs), `--live` for the
  browser runs, `--url` for the month's meter and its pace, each run kept in `docs/budget-history.jsonl` and
  compared with the last.

| Commands (budget-online.cjs, 40 s a scenario; parties pinned to two instances, so split and unable to hop) | Before | After |
|---|---|---|
| One idle tab in town (alone on its instance, inside the 1-minute beat) | 0 a minute | 0 |
| An idle tab past 3 minutes (out of the room) | 0 | 0 |
| A tab in the yard swinging nonstop (frames the page sent) | 0 (0 frames) | 0 (0 frames, with practice too) |
| Two players walking the square, two instances | 78 a minute (4.7K an hour) | 77 (4.6K) |
| Two players in town, one in a hall, two instances | 87 (5.2K) | 34 (2.0K) |
| A 2-player job, split, can't hop (worst case) | 1,115 (67K) | 1,165 (70K; ran at 54 fps against 23) |
| A 4-player Barrowfields job, split, can't hop | 1,210 (73K) | 1,216 (73K) |

An hour, from the test (one player alone on their instance): an idle town tab 12 commands (3 minutes in the
room, then it leaves), a tab in the yard 5 (the town room left on the way in), limits 30 and 12 that fail the
test if passed. A party that lands together (the hop) costs about 26 a minute, as on Nov 4. A split party that
can't hop is still the one big cost: about 70K an hour, at most 10 PUBLISHes a second each way. Halving it
would mean batching every 0.2 s instead of 0.1 s for split parties only (50 ms more lag for them); not done
without Kyle.

**The straw men** (`shared/practice.ts`, `sim/practice.ts`, `client/practiceui.ts`, drawn by `client/rackdraw.ts`,
`client/strawman.ts` and `client/three/rack3d.ts`). First built as live goblins penned at the yard; the lore
keeper said no to live goblins inside Wickhold (now in the bible), so they're straw men in hungry kit, worked on
ropes and poles by Corporal Brisk's watch, with Squire Pell on the board. In the yard's top left corner a frame of
poles with a bar across, straw men in scraps of hungry kit hanging from it on ropes or propped against it, two of
the watch with ropes run out to it, and a post with the board beside it (USE, or E: THE STRAW MEN). Pell has
them set going whatever the hero has met: thirteen sorts one at a time (scrapper, archer, looter, lunger, shield,
heavy, hexer, drummer, netter, ironhide, blind hunter, spider, butcher), four small packs (a shield and two
archers, a pack of five, a hexer behind three, a butcher and two scrappers), and drills: PARRY THE HEAVY (ten
swings, "PARRIED 8 OF 10"), BREAK A SHIELD LINE ("SHIELDS DOWN 1 OF 3", "BROKE THE LINE IN 23 S"), BURN A PACK
for a Mage ("BURNED 4 OF 5 IN 14 S") and HOLD FOR A MINUTE (two more every 10 s, an archer every other wave,
never more than 8 up: "HOLDING 31 S", "HELD 60 S"). The line shows on the banner. GO AGAIN starts the last one
over, CLEAR puts it all back on the rack and the yard's own sacking butcher and straw men out again. Fewer wait
on the rack while some are out.
- Each fights by the same specs as the goblin it plays (`newEnemy`, `VARIANTS`, `shapeFoe`), placed off the room's
  own seeded Rng and run by the room, and keeps that goblin's silhouette, so practice reads as a real fight. Only
  the drawing says straw (`strawman.ts`, both views: the flat scene and the 2.5D cards call `drawFoe`): straw out
  of the head, the hands and the feet; painted eyes, never glowing (the glow over the head is cleared); a downed
  one a slumped heap of straw with its rag and hood on top. A hit throws straw that lies on the floor a while,
  never blood (`strawFx`, in the yard only). Every goblin-shaped thing in the yard is straw now, the standing
  sacking butcher and the two straw men included.
- All in this browser: nothing goes to the relay (tested).
- Met: each hero keeps the sorts they've seen within 9 tiles on a job or in the wood (`Profile.met`, checked once a
  second); everyone has the scrapper, the wood gives looter, lunger and heavy, and a hero with a job behind them
  already has archer, shield and butcher. Sorts that need a job's ground (logs, roofers, torch throwers, oilers,
  sappers, wolves, banners, keepers) aren't played; a thief would take real gold.
- Nothing pays: anything dropped in the yard is gone before it can be taken (`stepPractice` clears drops and
  pickups; before this the yard's respawning goblins could leave a weapon), no XP or gold, and the board says so
  once. A fall doesn't count: once you're up the same fight starts over ("YOU'RE DOWN. STARTING OVER"; the hold
  says how long you lasted).
- Two fixes found on the way: the yard stands still while Pell's board (or the title) is up, so the sacking butcher
  can't hit you while you choose (`main.ts`; the yard is this browser's alone, so pausing it touches no one); and
  you leave the yard only by walking out of its gate (pushing down into it, not hurt or stunned), never by being
  knocked into it (`game.ts`).

**Words** (the lore keeper's, `client/practicewords.ts`; names in `shared/practice.ts`): Pell, "Them? Straw, the lot,
in hungry kit, with Corporal Brisk's watch on the ropes behind. Pick what you want and they'll set it going. Only
what you've met out there, mind, since there's no sense learning a thing off straw you've never seen move, and
anyway Brisk does a heavy better than I'd say to his face."; "Nothing here pays: no gold, no XP, nothing they
drop. If you go down, you get up and it starts over."; "Fight a new kind on a job and it's added here."; THE
STRAW MEN, ONE AT A TIME, A FEW TOGETHER, DRILLS, GO AGAIN, CLEAR; the sort, pack and drill names and the drills'
how-lines (BREAK A SHIELD LINE: "Three shields side by side. Put all three down."); the result lines above and
"YOU'RE DOWN. STARTING OVER". Pell's old yard line ("Straw men, a butcher made of sacking on a chain, and me")
still stands and now fits.

Tests: `tests/townbudget.test.ts` (an hour in the yard swinging, drills and heavies set going, sends nothing and
opens nothing; knocked into the gate you stay, walking out of it opens the town and says `hi` once; alone in a hall walking says
nothing, someone walking in is told at once; an idle tab and the yard under their limits), `tests/practice.test.ts`
(every sort from the board as a job makes it, packs whole, CLEAR, GO AGAIN, what's offered by what's met, met
kept from a job, each drill's count, a fall starting it over, nothing paid). Phone screenshots of the board, the
rack and a fight, flat and 2.5D: `scripts/straw-look.cjs`.
## 2026-11-05: the wood: two dodges, a done count flashes gold, the Ranger learns PARRY, Hew keeps out of the trees (Kyle; Claude Opus 5.5)

Kyle: "In training the Ranger is never taught how to parry. They should learn the parry after they dodge
perfectly timed twice, then they can parry once and kill the enemies. Also only have them train dodging
twice for the earlier part, for all characters. Once dodging is done, highlight it as a quest complete and
update the quest to kill the goblins. Also Hew walks through trees."

- **Two dodges** on the path for every class (`LESSONS[1].need` 3 to 2; the Warrior's and Healer's WALK OUT
  inherits it). A dodge counts as it did: the `dodge` event (out of the striped blow in time).
- **A count done is a quest done** (`sim/woodsteps.ts`). On the path, the clearing and the stream, once the
  lesson's count is made: `WoodState.passed` goes up and a `passed` event fires; the tracker's gold flash
  (`client/objflash.ts`, as for a lesson passed) now watches stage plus `passed`, so "DODGES 2 / 2" flashes
  gold and holds. Then the goal is **KILL THE GOBLINS, KILLED n / m** (the lesson's goblins, dead of all)
  until they're down and the way opens (which flashes again). This holds for every counted lesson there
  (blocks, parries, full shots, backstabs, last-second dodges), since each had the same stale "5 / 5" goal
  while goblins were still up. The field (stage 0) and the hut are unchanged. Once a count is made the
  lesson's freeze-frames stop.
- **The Ranger's PARRY.** The Ranger's kits are parry-only (`CLASS_GUARD.RANGER` 'parry': no held block,
  a tap of the guard button parries with the short blade), and its wood taught FULL DRAW, MARK and the last
  second dodge but never the guard; the button stayed hidden all through the wood. Now the Ranger's path
  (`lesson.then: 'parry'`) goes on after its two dodges: a 1 s beat for the gold flash, then Hew's card with
  PARRY (the `.tb.block` button is given and pulses gold, labelled PARRY by `unlockflash.ts`; `Game.taught()`
  gains `block` from then on, via `guardTaught`), and one plain goblin that swings (`PARRY_FOE`; a lunger's
  stab is unblockable). It comes at you first (one at a time prefers it); the first swings freeze on
  NOW: TAP PARRY. One parry: flashes done, then KILL THE GOBLINS. Cleared without a parry, the swinger
  comes again. The card's key on a phone says PARRY for a parry-only kit.
- **Other classes**: none has the same gap. Warrior and Healer (full guard) are taught BLOCK in the clearing
  and PARRY at the stream. Rogue and Mage have no guard at all (`'none'`; a spellblade Mage parries, but the
  wood doesn't vary by kit, so a spellblade's parry is untaught in the wood as before: worth a look).
- **Hew walks round things** (`sim/hewwalk.ts`). Every walk of his (the waking, lesson to lesson, round the
  hut to the cordwood) uses the goblins' way-finding (`sim/pathing.ts` `wayTo`, a grid for his 0.3 body)
  and then `collide`, the hero's own blocking: trees, the thicket, kilns, carts, the hut, closed gates.
  Before, he slid in a straight line, so lesson 1 to 2 went through the thicket between the path and the
  clearing. He started the waking inside the edge trees at (0.6, 35.2); now at `HEW_START` (1.6, 35.2),
  just clear of them. The goblins' path grid no longer marks Hew as a fixed obstacle (`pathgrid.ts`): it was
  built once with him wherever he stood then, which blocked his own way afterward. The spots he's put at
  (the Healer's arrow scene, `HEW_AT`; the hut's door) were checked clear.
- **Tests** (`tests/woodfix.test.ts`): two dodges complete the lesson for every class; the goal turns to
  KILL THE GOBLINS with the `passed` event and count; the Ranger gets PARRY after the dodges and one parry
  (fed, and a real one in the room off the freeze) completes it; Hew sampled every step of the waking, all
  four walks lesson to lesson and round the hut is never sunk into a tree, brazier or block, and arrives.
  The three end-to-end runs (`wood`, `woodsign`, `woodelement`) wait out the Ranger's parry card.

New lines, not yet through the lore keeper or the line editor:
- Hew, the Ranger's PARRY card: "Here's one that only swings, not like those crouching ones. You've that
  short blade on you as well as the bow, so knock its swing aside with it, *just* as it comes, and it'll
  stagger."
- Card how-line: "You can't hold a block. Tap PARRY while the red flashes white. A parry staggers the goblin,
  and your next blow does extra damage."
- Freeze: "NOW: TAP PARRY". Goal: "PARRY: TAP PARRY WHILE THE RED FLASHES WHITE" (phone) / "PARRY: TAP RIGHT
  CLICK WHILE THE RED FLASHES WHITE" (laptop), "PARRIES 0 / 1"; "KILL THE GOBLINS", "KILLED 0 / 3".
## 2026-11-05: the Night Watch, slices 1 and 2: a shift on the wall (Kyle; Claude Opus 5.5)

Kyle: "A minigame only available at night. You run around the walls and have a ranged weapon ... see how
many you can get in a time limit of 3 minutes, with high scores. Head shots are double damage, but some
goblins have head protection that has to come off first, or shields you have to try to break ... like the
flash game The Last Stand." Plan: `docs/plans/town-activities.md` (approved 2026-11-05).

- **Lore** (lore keeper, 2026-11-05; in the bible under "The Night Watch"): the barracks has a stair out
  the back up onto the north wall; the watch pays heroes by the head for a night shift with a bow, capped
  per night, wages that never touch the Want; anyone is handed a bow; Brisk hands out the watch's pay but
  isn't one of the watch. Brisk's two lines and the lost line are the lore keeper's wording.
- **Where.** Corporal Brisk in the barracks now stands at "the stair out the back" up to the wall
  (`townhalls.ts`: his talk is `watch`, not `chat`). At night he offers TAKE A SHIFT ON THE WALL; in the
  day he says his usual line and to come back after dark. Night is Wickhold's shared clock
  (`townclock.ts`): daylight under 0.15 (`WATCH_DARK`), about 45% of each 40-minute day. A shift begun
  before dawn runs to its end. There's no outdoor wall stair in the town map yet; Brisk is the stair.
- **Leaving town.** `Game.enterWatch` sets the mode to `watch`, so the town's room drops you exactly as
  the yard does (`main.ts` sends no presence when the mode isn't `town`), the hero holds still, and the
  town isn't drawn under the overlay. DOWN THE STAIR puts the mode back; you're where you stood, by Brisk.
  Later (slice 4 and the shared-town plan): your hero shows parked on the wall for everyone else.
- **Local only.** The shift runs in this browser in fixed 1/60 s steps from its own seed (`sim/watch.ts`,
  seeded per run from the clock); no watch file imports the relay, and a test runs a whole shift with
  `fetch` and `WebSocket` stubbed and counts no calls.
- **The view** (`watchview.ts`), two fields (`FIELDS`), chosen when the shift starts by the screen's
  shape. `wide` (laptops, a phone on its side): the whole field, 232 by 174 pixels, scaled by the biggest
  whole number that fits, the sky and fields carried on round it. `tall` (a phone held upright, taller than
  1.2x its width): the whole-field picture left the goblins tiny in a thin band between empty sky and dirt,
  so upright the field starts at x 90 over the brow of a steep hill (ground from about y 84 down to the
  ditch at 170, the ditch to the wall's foot at 196), goblins walk it at 0.8x pace, archers stop 100 to 128
  out. The view runs from the field's edge to just past the hero (130 px) and is scaled to that width: 9x
  on a 390-wide phone at 3x, 3 CSS px a pixel, a goblin's head (7 px) 21 CSS px across. The sky is a strip
  with the moon, and the slope runs through the middle of the screen. Same wall, bow, goblins and numbers;
  scores on the two fields aren't quite alike, so the town board (slice 4) should keep them apart. Painted flat, then the game's own lighting pass (`light.ts`):
  three wall torches, goblins' torches, the moon as a wide soft light. The hero is `drawHero` in their own
  class look, facing the fields, with the watch bow drawn over them turned to the sight.
- **The bow** (`BOW` in `shared/watchtune.ts`). Everyone's the same. Full draw 0.5 s; 0.22 s to nock.
  A tap flies at 170 px/s with up to 2.4 degrees of wobble; a full draw at 330 px/s, dead straight.
  Gravity 70 px/s2, so at the far edge a full draw drops about 15 px and a tap a great deal more. At 85%
  draw or more a body hit does 2, else 1; a head hit doubles it; a leg hit does 1 and the goblin limps at
  45% pace for good. Arrows stick where they land (in goblins, shields and the ground) and fall with them.
- **Hit zones** (`SHAPES`): a head disc, a body box and a legs box from the goblin's feet, plus a shield
  box in front or a torch box held up. `watchgobs.ts` paints every goblin from those numbers (the disc in
  the same whole pixels the arrow test uses, the bob of a step in both), so what you see is what's judged.
  The first zone along the arrow's path wins: a shield in front takes the arrow before the body behind it.
- **Goblins**, bled in (`GOBS`; each kind's first comes the moment it's due, then by weight): plain
  (2 hp, 13 px/s, 10 pts, from 0 s), helmeted (15 pts, from 14 s: the first head hit knocks the helmet off
  spinning and the arrow glances, then the head counts), runners (1 hp, 30 px/s, low and small, 15 pts,
  from 38 s), shield-bearers (9 px/s, 20 pts, from 58 s: 3 arrows splinter then break the shield; the head
  over the rim and the legs under it can still be hit), torch-bearers (15 pts, from 80 s: hit the torch and
  it drops and they burn, running 1.7x, dead in 1.6 s, +10 pts), archers (20 pts, from 100 s: they stop
  55 to 110 px out, loose 3 arrows at the wall 3.2 s apart, then walk on; each one lands near you and shakes
  the sight 5 px for 0.7 s, the shake added in the sim so the shot follows what you see). A goblin every
  3 s at the start, every 1 s by the end, a third either way; none in the last 4 s.
- **The night** (`NIGHT`): three passes of cloud over the moon, 12 to 20 s each, darkening the field's
  light by up to 75% (stars and moon go too; eyes and torches still show); fog banks drift in at 30, 75 and
  120 s, 50 to 90 px wide, hugging the ground up to 24 px, dimming goblin eyes inside them.
- **At the wall.** Past x 177 (both fields) a goblin drops into the ditch out of sight: THE WATCH HAVE IT. Its points
  are never yours and the streak breaks. No fail state but the clock: 180 s.
- **Score** (`SCORE`): a kill is its points, x2 if the killing hit was the head, times the streak (+0.5 every
  3 hits in a row, up to x3). Every arrow that finds a goblin, helmet, shield or torch adds to the streak; a
  miss breaks it. At the end an accuracy bonus: 5 points a hit, scaled by the share that hit.
- **The card** (`watchcard.ts`, the usual panel): kills, headshots, best streak, accuracy, the bonus, the
  score, and your best (NEW BEST when it is). The best and tonight's pay live on the hero
  (`Profile.watch`, `shared/watchpay.ts`). Pay: a gold piece a 50 points, at most 30 gold a night (a night
  counts from noon to noon on the town clock). No server board yet (slice 4).
- **Not in this slice:** the three posts and the run between them (slice 3), the boards (slice 4),
  sappers with ladders and rams. Brisk's lines and the lost line are through the lore keeper; the rest of
  `watchwords.ts` isn't yet, and none of it through the line editor.

## 2026-11-05: the first recorded sound effects: combat, spells, goblins and beasts (Kyle; Claude Opus 5.5)

Kyle approved batch 1 of `docs/sound/elevenlabs-sounds.md`: sections 1 and 2 (45 + 33 sounds). Ambience,
voices and music wait for later batches.

- **Made.** ElevenLabs Sound Effects v2 (`eleven_text_to_sound_v2`) on one flow, "Relic sounds batch 1",
  with each row's own Sec (duration) and Inf (prompt influence) and the take count it gives (gob_jabber
  has 4). The parry reuses the earlier test run (3 of its 4 takes; the 5 s one is left out). 78 sounds,
  164 takes in the game. Raw takes and the processed set are on Kyle's machine in `Relic Sounds/batch1/`
  (`raw/`, `game/`, and `tools/qc.txt` with every file's length and levels).
- **Processed** (ffmpeg): silence trimmed from both ends, cut to the row's length with a short fade
  out, mono 44.1 kHz MP3 at 64 kbps (plays on iPhone Safari). Levels are set per take to about -18 dBFS
  RMS with the peak held under -2 dB, not loudnorm: loudnorm needs about 3 s to measure and most of
  these are half a second. Sharp transient sounds (gnawing, ice, spider legs, a splat) stop at the peak
  limit and sit a few dB quieter; `sfxbank.ts` carries a level per sound for the rest of the balancing.
  The storm stream loop is cut but not faded, and the code loops it from 0.06 s in from each end to skip
  the MP3 padding.
- **Played.** `public/sfx/*.mp3`, served from our own site. `sfxbank.ts` lists the sounds and takes,
  `sfxplayer.ts` decodes a sound's takes the first time it is wanted and then warms up the rest two at
  a time, picks a take at random (never the one just heard), and wobbles pitch (4%) and level a little.
  It plays on the effects bus, so the sound switch mutes it. Until a sound has loaded, or if it fails,
  `play` says no and the synthesized sound plays as before; nothing is ever silent.
- **Routed.** `sfxroutes.ts` wraps the named sounds of `sfx`, `goblin`, `butcher`, `spiderSounds` and
  `sfxTown` (sample first, synth if not ready); `weaponsfx.ts`, `magesfx.ts`, `spellsound.ts`,
  `icesound.ts` and `streamsound.ts` pick their sample by kit and element; `sfxevents.ts` gives the
  events the list names their own recording (wolf howl, crows, the Stoker's bellow, the blowpipe, the
  retch, and a goblin's grunt on its own blow, which was silent). A goblin's sample keeps its voice
  pitch from its id, narrowed.
- **Stays synthesized.** The UI and tuned notes (level up, relic fanfare, loot, drop, perfect, tempo,
  charged, stunned, well, rally, the speech blip, weak and resist, the stall chime and dull knock, the
  chest's tier notes), and everything section 3 will cover (coins, anvil, chests, dice, drink, land,
  prop breaks, wood, doors, fire catching, the dread). The Mage's fire landing keeps its synth crackle.
  `gob_whistle` and `crow_caw` are made but not played: nothing in the game calls for them yet.
- **The one-file build** inlines `public/sfx` the way it inlines the music (`sfxsrc.solo.ts`, aliased
  in `vite.solo.config.ts`), so the solo page has the recordings too.

## 2026-11-05: world effects, slices 1 to 3: rods and pools, burn the dead, ice and steam (Kyle; Claude Opus 5.5)

Kyle approved the world effects proposal's first three rollout items: he loves the blood clouding in water
and the lightning, and wants more elemental and world effects like them. Every number in
`shared/worldfx.ts` (ROD, POOL, MEAL, ICE, STEAM_CLOUD, re-exported by tuning.ts); bodies of water in
`shared/waterbody.ts`; the room's rules in `sim/rods.ts`, `pools.ts`, `meal.ts`, `ice.ts`, `steam.ts`,
`worldfire.ts`; drawn by `client/worlddraw.ts`, `fxworld.ts`, `remainsdraw.ts`, heard in `worldsound.ts`.

**1. Rods and pools.**
- **Rods** (`sim/rods.ts`). An ironhide's iron draws lightning from **4 tiles** (`ROD.reach`, to the edge of its
  body). The wand's lightning strike aimed within 4 of one is called onto it instead (the gold mark is drawn
  on it, so you see it move before it falls); the sky's own strike looks for ironhides as for a banner pole
  (weight 3) and anything it picks within 4 of one goes to the iron; the storm stream, taking a new goblin,
  takes an ironhide within 4 of that one and in the stream's reach. Lightning drawn in bends into it from where
  it was going (a bolt from above through a midpoint, a flash), it's struck wherever it has stepped to, and
  its **guard breaks** (`crack`, the usual 3 s, ARMOR BROKEN). A storm **jolt** (a wet jump or a pool jolt,
  even a stream tick's) breaks it too. While lightning is in it, it crackles for 1.6 s (`rodAt`).
- **Pools** (`sim/pools.ts`). Storm landing on a goblin standing in water jolts everyone in that same body of
  water: water boxes touching or overlapping are one body (`bodyAt`), shallow and deep together. Nearest
  first, **8 bodies at most** (`POOL.cap`, friends counted), within **12 tiles** (`POOL.reach`, so the
  Barrowfields' river doesn't jolt goblins dozing at the far end of the map). Goblins take what a wet jump
  takes (half the blow, at least 6, then 1.5x as they're wet), once a cast. This replaces the 3-tile wet jump
  inside water; the 3-tile jump still runs for goblins wet from the rain.
- **The friend rule: none from a friend's storm.** The wand's strike already spares friends (SPARED), the iced
  skid spares them, and on a phone you can't see who's wading the far end of a ford; a jolt that cost a
  friend health for standing in water would make storm a thing you hold back from. They're drawn passed by (a
  gold ring at their feet). **The sky's own lightning is on nobody's side**: landing in water (its middle, or a
  goblin it struck standing in it) it jolts goblins **12** and friends **4** (a roll gets you out, the grace on
  coming in holds), the freed too.
- **Seen.** The crackle runs across the water's surface along the body of water the room judged: forks over the
  water round the strike (never over a body standing in it), a bright line to each goblin it reached, flashes
  and sparks on them, a cold light over the water, a fizzing crackle (`pooljolt` event: from where, to whom,
  who was passed by, which body). In 2.5D the crackle and ice are painted on a scratch layer with the bodies
  standing in them cut out, as the wall of fire does.
- `sim/elements.ts` `zap` takes the pool; `sim/skystrike.ts`, `storm.ts`, `stormpick.ts`, `stream.ts` the rods.

**2. Burn the dead** (`sim/meal.ts`).
- **What's a body.** A small goblin's (any scrapper sort) lying whole: not burst, shattered, burned, eaten, ash,
  pinned on a javelin, or faded (a body fades over its sort's 5 s, so it's edible while you can see it); or one
  of the freed killed. The lore says the hungry eat people and their own (sold their mothers and ate the
  proceeds); for the lore keeper: does a butcher eating a fallen goblin hold?
- **The meal.** A butcher (not the Stoker, not the wood's drilled ones) with a body within 4 tiles and no hero
  within 1.5 of it walks to the body; within reach it eats for **2 s** (`MEAL.time`): a red ring round the body
  filling clockwise, a clock and not a blow, so no striped edge and nothing to block. Done: it heals **a
  quarter of its health** (65 of 260), the body is gone (a stain and bones), and it's **FED for 15 s**: blows
  **1.25x**, wind-ups **0.85x**, walking **1.2x** (as a drum's rouse, its own numbers). A FED butcher's eyes
  burn red, it drips, a red pulse beats at its feet, and FED rises over it as it comes up.
- **Taken off it.** A heavy hit (anything that would break an ironhide's guard: a charged blow, a perfect, a
  burst, a strike) takes it off, as a stun, a freeze, a net or a grab does; then it waits 5 s before trying
  again. Quick hits don't. A body that goes to ash mid-meal ends it.
- **Fire on the dead** (`sim/worldfire.ts`). Each tick the room gathers where fire is: a goblin set alight or
  burning, a fireball's burst, a flame sweep, the fire ring, a wall of fire rolling or standing, a lit oil
  slick, a flare. A body in it goes to **ash** (a grey heap with embers winking; ASHED event: a puff of ash and
  embers, a fire whoosh) and feeds nothing. A small goblin that dies alight leaves ash too (its death pass,
  `elements.ts` `passFire`). So fire answers the butcher: Hew burned the eleven.

**3. Ice and steam.**
- **Ice** (`sim/ice.ts`). Frost on shallows ices them **6 s**: the cold blast over two circles along its cone,
  the hard frost (the staff's nova) over its own ring, and any freeze or chill landing on a goblin standing in
  shallows (the wand's icicles, the staff's frost sweep, the spellblade's frost cuts, a flask, ATTUNED) a patch
  0.9 round it. Only where the water is shallow: deep water and the bank inside the same circle stay as they
  were (judged by `iceUnder`, drawn clipped to the shallows the same way). 12 patches at most; a patch inside
  one already there keeps that one going. Goblins wading it are **held: 0.35 of their wading pace** (`walk`
  reads `onIce`). A frozen goblin skidding across it slows at **0.4** of the rate (`ICE.slip`), so it goes about
  2.5 times as far (tests: past 8 tiles where plain water gives 5.5). Friends walk it as plain shallows: the
  frost is theirs. Drawn pale and stepped with a dither, white at its edge, two cracks; in 2.5D the held ones
  get a rim of ice in front of their feet.
- **Steam** (`sim/steam.ts`). Fire on ice melts that patch to a **steam cloud 4 s** (1.4 round, or the patch's
  size). **Fire on a goblin standing in water goes out as it lands**: no burn, a cloud instead (and the ice
  under it melts); a burning goblin wading in is put out the same way. Judgment: the water's answer to fire,
  as storm owns the water; fire on a ford now buys cover instead of a burn. Open for Kyle: if it's too hard on
  fire, the douse is one call in `afflict`. The cloud is one of the room's smokes with `steam` set, so the
  smoke's rules hide whoever's in it from goblins (they see nobody beyond arm's reach, and blows across its
  edge are dropped), and it **scalds every 1 s: goblins 3, friends 1**. A cloud near another keeps that one
  going; 6 at most. The old STEAM burst (fire meeting frost on a goblin) is unchanged. Drawn white and a little
  thicker than smoke in flat; small white wisps in 2.5D (gaps between, so you still see whoever's inside).
- `sim/frostholds.ts` (the blast and nova ice), `sim/iceslide.ts` (one line: the slip), `sim/enemies.ts` (the
  meal hook, FED, the held pace), `sim/damage.ts` (a heavy hit off the meal).

**Determinism and online.** All of it is the room's: ice is a list on the room (`ices`, sent to guests as a
collection), steam is in `smokes`, the meal, FED, ash and eaten are fields on the goblins and the freed, and
every event is the room's. Nothing new uses Math.random in the sim. A guest sees the same.

**New player-facing words** (for the lore keeper, then the line editor): **FED** (the callout over a butcher
that has eaten). No other new words: ARMOR BROKEN, SPARED and STEAM's look are as before. Placeholders the lore
keeper may want to name later: rods, pools, ash, steam (code and docs only, nothing on screen).

Tests: `tests/worldfx.test.ts` (the wand's strike falls on an ironhide within reach and breaks its guard, and
where it was aimed with none near; the sky's strike drawn onto an ironhide; the stream drawn onto one; the
pool jolt reaches near and far in the same water, never the pond apart or the bank; friends in it take
nothing and are drawn passed by; the cap, nearest first, friends counted; an ironhide jolted through water
broken; the sky's lightning in water nips a friend; the butcher eats, heals and is FED, its blows quicker and
harder; fire leaves ash it can't eat; a goblin dying alight leaves ash; a heavy hit interrupts and a light one
doesn't; a hero right on it gets the blow; frost ices shallows only, never deep water or dry ground; a tap and
the nova ice; waders held; the skid goes further on ice; fire on ice makes steam; fire on a goblin in water
steams and on the bank burns; steam hides you and scalds; two runs agree; ice and FED ride the patch).
`tests/storm.test.ts` updated: the far wet goblin in the same pool is jolted now. `node scripts/world-look.cjs
[url] [outdir]` shoots a jolt across Barrowby's ford, a FED butcher beside one at its meal, iced shallows with
goblins held, and a steam cloud, on a phone, flat and 2.5D.
## 2026-11-05: heroes are people: faces, outlines, cloth that moves, and the eye dial drawn (Kyle; Claude Opus 5.5)

Kyle: "They sort of look weirdly like robots and not very unique from one style to the next. I'd prefer
some more dynamic elements and visualizations for each class." Then, on the eyes: "We were going to have
eyes glow good or evil depending on what you did in the world, or angelic / demonic qualities as the
hunger takes you or not." Drawing only; the room is untouched.

- **Faces, not visors.** Every hero shows skin and a face with plain dark eyes (glowing eyes stay the
  goblins' mark). Skin runs fair to deep across the fifteen looks; hair and beards where they fit.
  The looks are pixel maps now (`client/herolooks.ts`, `herolooks2.ts`, built by `lookkit.ts`), one
  letter a colour, so a look can be read and changed by eye. `sprites.ts` builds them as before.
- **Told apart by outline** (a test holds that the five first looks have five outlines):
  - **Warrior**: the widest shoulders (pauldrons out to the sprite's edge), a tabard, a cape. Knight:
    open-faced helm, red plume, blue and gold, red cape. Sellsword: bare-headed, black hair and beard,
    dented steel, a ragged brown cape. Blackiron: long pale hair, a scar, black plate, a cape like old blood.
  - **Ranger**: a peaked hood a row taller, a cloak to the calves, the quiver's fletching over the
    shoulder, a short sword's hilt. Green with an auburn fringe; a brown trapper with a fur edge and a
    black beard; a grey-blue hill warden.
  - **Rogue**: lowest and widest-legged (a crouch), a scarf up over the nose with the eyes showing, a
    sash, knives at the hips. Plum scarf; the red-scarfed cutpurse; Night, all black and a bone mask.
  - **Mage**: the tallest, a wide-brimmed pointed hat, a robe that flares to the ground. Violet with a
    grey beard; the ember in red with a black beard; frost in pale blue with long white hair.
  - **Cleric**: mail and a long tabard with the Lantern on it (gold thread, not light), the censer as
    before. Mail coif and white; the friar's brown habit, tonsure and rope belt; a red cap and red tabard.
- **Life, cosmetic** (`client/herolife.ts`): capes hang behind and fly out behind when walking (the
  sellsword's hem notched); the plume nods and streams; long hair sways; a Ranger's cloak edges
  flutter; a Rogue's scarf tail streams from the knot and the sash end swings; a robe's hem flares and
  kicks; a hat's tip nods; the tabard's foot flicks. Each hero sways on a phase from their id, so a party
  never moves in step and a hero always moves the same way. Walking now steps (a foot up a pixel,
  `figure.ts` LAYOUT.step) as well as bobbing. **Idle breathing is back** (the 2026-11-01 "no idle
  breathing" is overruled): a pixel's rise for part of a slow breath, the head and body only, never
  while blocking or mid-act. Lit layer only: none of it is light.
- **Living details on what's carried** (`client/wisps.ts`): motes of the element drift up off a Mage's
  wand or staff (glow, it's light); smoke curls off the Cleric's censer coal (lit layer, it's matter).
- **The eye dial, drawn, not ruled** (`client/heroeyes.ts`, `herodial.ts`; PLAN.md "red eyes and gold
  eyes"). `Hero.dial`, -1 red to +1 gold, unset is 0: plain eyes, as every hero today. Near the middle,
  a faint tint. Toward red the eyes burn and flicker, smoke curls off them at the far end, a red
  under-glow pools at the feet and lights the figure's lower edges, embers and ash rise, and the cape
  or cloak darkens and frays. Toward gold a warm glow in the eyes, then the top and left edges catch a
  gold rim, a halo glints over the head, motes of light rise. Light on the glow layer, smoke and ash on
  the lit. Drawn by drawHero, so it shows in FLAT and 2.5D and to the whole party. Nothing sets the dial
  yet: what moves it, and its rewards, are the next job. The Want's old red glint still shows in the
  eyes at its threshold, now at each look's own eyes.
- **Kept**: three looks a class and their order (saved heroes keep their look), facing, every pose
  (attack, charge, roll, block, hurt, down), the gear in hand, flashes and afterimages. Robes now hide
  all but the feet row. Armor tiers don't show on the body (they never did). 2.5D uses the same
  drawHero, so it changed with FLAT; the box figures behind `?figs=3d` (`three/heroes3d.ts`) are untouched.
- **Faces in the UI**: the pick screen and hero slots show each look on one 18 by 24 card at the same
  scale (`heroPortrait`); the HUD face crops from just above each look's eyes.
- **Cost**: a hero's cloth is a handful of fillRects a frame (outline, cloth, a glow erase); the dial
  draws nothing at 0. The rim is a cached canvas per sprite.
- **Checks**: `tests/herolooks.test.ts` (no glowing pixel on any hero, dark eyes where each look says,
  five outlines, three looks that differ; no dial draws plain, red and gold draw differently). Sheets by
  `scripts/heroes-look.cjs` (`window.__heroArt`, `client/heroart.ts`, draws one hero by drawHero).

## 2026-11-05: the staff's fire hold is a wall of fire rolled at a goblin (Kyle; Claude Opus 5.5)

Kyle: "Wizard staff fire, hold down to make a wall of fire that moves towards the targeted enemy and stays
up for a few seconds. That way we have lightning cage for AOE close, fire for range, and ice for close
AOE." The fire pit (the entry below) is retired: `sim/firepit.ts`, `client/firepitdraw.ts` and
`tests/firepit.test.ts` are gone. Numbers in `shared/spellbook.ts` FIRE_WALL, the room's rules in
`sim/firewall.ts`, drawn by `client/firewalldraw.ts`.

- **What it rolls at** (the pit's targeting kept): the nearest goblin within 6 tiles inside a 90 degree
  cone in front, else the nearest within 6 anywhere, else a spot **4** tiles ahead (short of a wall). The
  Mage turns to it. No line-of-sight check, as before.
- **The wall.** A line 3 tiles long (4 on a perfect; WIDE BURST lengthens it as any area), 0.7 deep, square
  to the way it goes. It rises 1 tile in front of the Mage at the release and rolls at 5 tiles a second
  to where the goblin stood (it doesn't follow it), stopping short at a wall (0.3 off it) or at the 6 tile
  reach. There it stands and burns 3 s (4.5 on a perfect); rain shortens that by the weather's burn share
  (`burnFor`, 0.6): 1.8 s, 2.7 on a perfect. The zone is plain data: `tx, ty` its stop, `ax, ay` its way,
  `r` half its length, `at` the moment it stands (`fell` once it has), and its middle is worked out from
  those each tick (`wallAt`), so where it is never drifts.
- **What it does.** Each goblin it touches, rolled over or stood on, takes 3 (times the hero's damage) and
  is set alight at once, then again every 0.5 s while it stays in it. Each target keeps its own half-second
  (`hit` on the zone), so a goblin it rolls through between two beats is never missed; what it rolled over
  this tick counts as touched. Friends in it, the Mage and the freed too, take a third of what a goblin
  loses a tick there (the wall's 3 and a burn's 4): **2 a tick**, on the same terms as the pit (a roll, the
  grace on coming in and SHAKE IT OFF keep you out of it). Oil slicks it touches go up (`oil.ts`
  `lightNear`, along its line each tick); wood it touches is tried once a wall (`catching.ts` `ignite` at
  the fire ring's odds, so a house isn't rolled for every tick it stands against it).
- **Balance, measured** (`tests/spellbook.test.ts`, one plain hold of 30 magic, everything in the 4 s
  after the release with fire's burn counted): one goblin, wall of fire **45**, charged ring 40, hard frost
  12 (and frozen); a pack of four, **158**, 160, 48. The pack in the test is now three where the wall stands
  and one beside its path that it rolls through (out of the cone, so not the target): what the wall is
  for. At 2 a beat the wall came to 38 on one and 136 on that pack (one rolled through takes a single
  beat), so it's 3 a beat. Within 15% of the ring on both.
- **Seen, both views, from the room's zone** (`client/firewalldraw.ts`, called by `spellground.ts` for the
  flat glow layer and the 2.5D overlay). The pit's style along a line: the band filled #f2622a with a
  #ff8c32 / #ffb050 flicker in a shifting dither and dark flecks, the striped edge (#ffd040 / #2a1408)
  all the way round, embers, and tall tongues of flame standing up along it in two rows (about a tile
  high, shorter at the ends, leaning back while it rolls) so it reads as a wall. In 2.5D bodies in it are
  cut out of the overlay as with the pit. Light: three warm lights along it. The raise throws fire up
  along the line and forward; standing (`wallup` event) throws it up all along it with a flash and a
  shake. Sounds: the pit's soft whoosh on the raise, fire's whoosh and the flare when it stands.
- **Online**: it's a zone (`kind: 'firewall'`), so it rides the patch, rolling and standing; a guest's
  hold raises it on the leader's room.
- **Words** (`client/kitlines.ts`, as Kyle's brief gave them): staff HOLD "Wall of fire rolls at a goblin",
  PERFECT "Wider, burns longer", the book row "Tap flame sweep, hold wall of fire", fire's ALSO kept "Burns
  you and friends too", the book card's ALSO "Wall of fire burns you and friends too". The HOLD is seven
  words where the kit rows keep to five; `kitwords.test.ts` allows that one row. The class card's SPELLS
  note ends "Wand far, staff round you (its fire rolls out at range), spellblade up close"
  (`shared/classes.ts`). Not yet through the lore keeper and the line editor.

Tests: `tests/firewall.test.ts` (the goblin in front though one behind is nearer, the cone's edge and the
reach, the fallbacks; rolling at its speed and standing where the goblin stood for its life; stopping
short at a fence and the fence catching; an oil slick going up; the perfect wider and longer, catching a
goblin the plain one misses; a goblin rolled over set alight, the one stood on burned each beat, one past
it untouched; a friend taking about a third and nothing once out, the Mage in its own wall; rain; a
guest's hold and the same wall on the guest's screen rolling and standing), `spellbook.test.ts` (the staff's
fire hold, the balance), `magekit.test.ts`, `kitwords.test.ts`. Seen on a phone, flat and 2.5D, rolling,
standing and a perfect.
## 2026-11-05: frozen goblins are a set-up for heavy hits: they skid off and crash (Kyle; Claude Opus 5.5)

Kyle: "I'd also like smaller goblins frozen to stay frozen longer, and to be hittable by the wizard and
other units with heavier weapons: thrown by the warrior, or a greatsword wielder, smacked by a cleric mace
or by the wizard's staff. Hit frozen enemies fly backwards sliding and crash into other units or walls and
shatter, damaging what's around them." Numbers in `shared/magic.ts` (`FROST.small`, `FLING`), the room's
rules in `sim/iceslide.ts`.

- **A longer freeze for the small.** A goblin of weight 1 or less stays frozen `FROST.small` (1.8) times as
  long: 3.96 s, not 2.2 (every freeze goes through `elements.ts` `afflict`, so the cold blast, the nova,
  a flask's second splash and ATTUNED's third chill all get it). Big ones are unchanged.
- **The stun cap, honestly.** A freeze stays outside the cap, as decided on 2026-11-04: it's built over two
  frost hits or bought with a hold's magic, and now it usually ends in the goblin's death, not a turn
  handed back. What the crash does to another goblin is a turn taken: the knockdown goes through
  `daze()` with the hitter's id, so the same hero can't knock the same goblin flat twice inside 6 s (it
  shrugs, and still takes the damage); a friend's crash can. The skid itself isn't a stun: the goblin
  it happens to dies at the end of it.
- **Heavy hits send it skidding** (`heavyHit`, `fling`): every greatsword blow, every mace blow, the
  staff's taps (all three elements; the tap's element doesn't land on it, so fire doesn't steam it free),
  any charged melee blow (a held swing of any melee kit: the sword's bash, the spear's and rapier's
  lunges, the flail's and censer's spins, the greatsword's overhead), a mace's smite (`bolts.ts` blast),
  and a Warrior's throw of a frozen goblin (`grab.ts`). Quick blows from the light kits (daggers,
  rapier, the sword's taps, the flail's taps, the spellblade's cuts) chip it as before; the sword's third
  cut and other heavy blows that aren't on the list still shatter it where it stands. Big goblins, named
  ones and dummies never skid. It goes away from the hitter (from the hitter to the goblin, nudged half a
  step along the hitter's facing), from the smite's centre, or along a throw: 11 tiles a second for 5.5
  tiles, or 15 for 7 when charged (held 70% or more), a smite or a throw, slowing evenly like ice. It
  waits out the blow's hitstop first, and stays frozen for the whole slide.
- **The crash** (`stepSleds`): while it skids it's a missile. A wall (the sweep stops it), a prop, a goblin
  or a hero it's closing on, and it crashes: it shatters and dies (`kill(..., 'shatter')`), goblins
  within 1.5 tiles take 20 and are chilled, the one it ploughed into takes 28, is knocked down 1.2 s (a
  big one 0.6 s) and shoved on along the slide; another frozen one in reach shatters too (the old 30);
  props in reach take 30 and are thrown. Slid its whole length without meeting anything, it shatters
  there for less: 1 tile round, 10, a chill, props 15.
- **Friends take nothing, by judgment.** Where it goes is set by where it stood when it was hit, not
  aimed, and on a phone in a scrum a friend in its path is never the hitter's mistake; the crash is a
  reward for a set-up, so it shouldn't cost a friend health. So heroes and the freed are left out of the
  burst entirely (not even chilled), and a hero in the way still stops it: a friend can stand as the wall.
- **Seen and heard, both views** (`client/fxice.ts`, `client/icesound.ts`): sent off, a puff of frost and
  a streak the way it's going with a whoosh and an icy hiss; skidding, a pale streak laid on the floor
  behind it the whole way and glitter kicked off it (`iceTrails`, each frame, from the room's `sled`);
  the crash, a fan of shards sprayed on along the slide, a white ring at the burst's own reach, a cold
  flash, rime left on the floor and a screen shake (8, or 5 for the end-of-slide one), with a thud and a
  big glassy crack; the existing SHATTER callout and sound come with the 'shatter' event. All of it is in
  world pixels, so the 2.5D overlay draws the same. No new player-facing words.
- **Determinism**: the room decides it all; the slide is `Enemy.sled` (who, velocity, slowing, charged),
  which a guest gets in the patch like any field, and `fling` and `icecrash` events.
- Where in shared files: `shared/magic.ts` (FROST.small, FLING), `sim/types.ts` (Enemy.sled, the two
  events), `sim/elements.ts` (one line: the freeze time), `sim/combat.ts` (one line in `hitEnemy`, before
  the old shatter), `sim/bolts.ts` (one line in `blast` for the smite), `sim/grab.ts` (one line in the
  throw), `sim/spellblade.ts` (`bladeStruck` skips a skidding one), `sim/room.ts` (`stepSleds(w)` after the
  goblins step), `client/fx.ts`, `client/main.ts` and `client/soundscape.ts` (one hook each).
- Tests: `tests/iceslide.test.ts` (the longer freeze for the small only; each heavy kind sends one off and
  light taps don't; a big one still shatters in place; the staff's fire tap doesn't steam it; the smite
  and the throw; it stops on a wall and shatters; it ploughs into a goblin, knocks it down, hurts it most
  and chills the ones beside; friends untouched; the full-length slide; the stun cap on the knockdown;
  determinism). `tests/techmage.test.ts`: ATTUNED's freeze on a scrapper is the small one's now.
  `node scripts/frozen-look.cjs [url] [outdir]` shoots a greatsword sending one up the yard and the crash.
## 2026-11-05: every class has its own button: SHADOW STEP, MARK, MEND, each taught in the wood; SMOKE BOMB (Kyle; Claude Opus 5.5)

Kyle: the Warrior (GRAB) and the Mage (ELEMENT) had a built-in button and the Rogue, Ranger and Healer
didn't; give each of those three one and teach it in the tutorial. Numbers in `shared/signs.ts`, the room's
rules in `sim/signature.ts` (the press), `sim/mark.ts`, `sim/healtap.ts`, and `sim/relics.ts` (the step,
unchanged); the wood's steps in `sim/woodsign.ts`, `sim/woodheal.ts`, their goblins and lines in
`shared/woodsigns.ts`.

- **One button a hero, one counter.** `Intent.signSeq` (optional, so an older guest's intent still reads),
  `Hero.seen.sign`, kept `INPUT_BUFFER` s; a guest's press goes off on the leader's room. Laptop key **V**
  for all three (one hero has one; V sits by the Mage's X and the crossbow's C; E, R, Q, G, C, F, I, M, X,
  J, K, Tab and Space were taken). Its cooldown is `Hero.signReady`. A press that finds nothing to do (no
  goblin in reach, nobody hurt, no breath) is spent, costs nothing and says so over your own hero
  (NOTHING TO MARK, NOBODY HURT, NOT ENOUGH STAMINA, `owncues.ts`). Stripped in town, and in the wood
  until taught, as ELEMENT is (`Game.taught()` gains `sign`).
- **The button** (`cluster.ts`, `.tb.sign`): ELEMENT's spot by ATTACK (a Mage never has both), its name
  over it, its icon (`skillicons.ts`: the shadow's, a gold sight for MARK, a gold cross for MEND), the
  cooldown as a sweep and the seconds on its face. Once it's given, a Ranger's PARRY and a Healer's BLOCK
  step out to the spot a spellblade's PARRY uses for ELEMENT (`body[data-sign]`). Hidden in the wood until
  its step, then the usual gold pulse and label (`unlockflash.ts`; the button's own name steps aside under
  the label, ELEMENT's too). BUTTONS has a row (`SIGN_WORDS`), the laptop's skill line leads with it
  ("V MARK 4.2"), the class card a row over SKILL (`ClassSheet.sign`).
- **SHADOW STEP (Rogue)**: as it was, 20 s, no cost, the same 0.06 s wind-up and 0.12 s recovery (run as the
  act `throw` with `Hero.signing`), turned to the goblin faced first. It left the trainer.
- **MARK (Ranger)**: the goblin nearest the pointer (laptop), or the nearest faced within 0.8 rad (phone),
  else the nearest, within **9** tiles, for **8 s**, on a **10 s** wait. It takes **15%** more from everyone,
  ticks too (`damage()`). This Ranger's arrows and bolts turn toward it at up to **0.6 rad/s** while it's
  within **0.35 rad** (20 degrees) of their path: over a 9 tile shot that's about 15 degrees at most, an aim
  assist, not homing. The hound runs at it at once, and picks it first after. One mark a Ranger (the old one
  is cleared, not deleted, so the patch carries it). Drawn from the goblin's own `markedBy`/`markedUntil`
  on every screen (`signdraw.ts`, flat and the 2.5D overlay): a gold chevron bobbing over its head and a
  turning gold sight round its feet, blinking in its last second. Gold, not the goblins' red. MARKED said
  on it with a ring.
- **MEND (Healer)**: **25** health (times the Healer's heal multiplier) to the nearest hurt friend within
  **4** tiles, or to the Healer when no friend near is hurt or the Healer is the worst off (Kyle: "I like
  that healer mend can self heal too"); **12 s** wait, **20 stamina**. A friend is a hero on their feet or an
  Npc with health (Hew in the wood). Never a goblin: it never looks at them (Divine Savior unchanged). It's
  the Healer's hands, not the censer, so a cold censer doesn't stop it; the Cleaver and the Keeping Mace still
  have their say on a hero. A gold line to them, a ring, motes rising, a warm flash, the heal number.
  Words: in the code it's `heal` (Kyle's word; the town works own "mend"); **MEND is the Healer's button
  word**. If the lore pass objects, it becomes HEAL (`SIGNS.heal.name` and `lesson.ts`).
- **SMOKE BOMB (Rogue's third skill)**: the Rogue's three are now Vanish (level 3, the first lesson),
  Knife Fan (5), Smoke Bomb (7, 400 gold). Thrown up to **6** tiles (the pointer, else the goblin faced, else
  3.5 ahead), lands in 0.45 s, smokes **2.4** round for **5 s**, **16 s** wait, no cost. The smoke rules
  (`sim/smokebomb.ts`, on top of `flasks.ts`): anyone in smoke is hidden from goblins unless close (1.2
  tiles, POTION.seen); a goblin standing in smoke sees nobody further than that (`smokedUntil`); a blow
  wound up across the edge is dropped, an archer's shot included. These hold for every smoke (Vanish's too).
- **Save**: a Rogue who carried Shadow Step (picked, or the first by default once taught; old heroes know
  everything) gets **Smoke Bomb, taught and carried**: the kinder choice over an empty slot. What was
  fitted to Shadow Step goes on it. Done once (`Profile.signs`, `shared/oldskills.ts`, called from
  `save.ts`). Knowing the first lesson now means knowing Vanish. A Rogue never taught gets nothing.
- **The wood**: each a single step in Hew's clearing after its lesson, as the Mage's element step.
  - Rogue: two goblins (24 health, looters' short sight) put across the clearing from you, five tiles off,
    backs turned, picking at Hew's things. The card (a tap goes on: a step pressed there would find nobody
    in reach) gives SHADOW STEP. Done when a stab in the back of one lands within 3 s of a step; in the wood
    the step is back in 2 s so a miss can be tried again. The way opens once both are down.
  - Ranger: two from the trees on the far side; the card gives MARK and its press marks as the world
    restarts. Done when one dies marked.
  - Healer: a goblin archer at the clearing's west edge looses at Hew (the real telegraph: anyone in its line
    takes it). He takes it in the leg (down to 20 of 100), goes down on one knee with the arrow showing
    (flat and 2.5D), and calls out; two more come. He can't die of it: the shot is scripted, and if the
    archer's killed first he's hit all the same. Once all three are down the card gives MEND, naming the
    self-heal, and a MEND that reaches him finishes it: he's up, the arrow out. Worse off than him, the MEND
    is yours and the step waits (the archer's scratches show it). Hew is put at his spot if he's somehow
    not there yet.
  - Warrior and Mage: unchanged.
- **Lines** (not yet through the lore keeper or the line editor; for that pass):
  - Hew, Rogue card: "See those two at the back, going through my sacks with their backs to us? You'll not
    get across to them without one turning round, so go through the *dark* instead and come out behind one."
  - Hew, Ranger card: "Two more out of the trees, and that hound of yours keeps looking at me for orders.
    Pick one out for it, and put your arrows where it's looking."
  - Hew, shot: "Aah! In the _leg_, the little sod! Never mind me, stray, see to them first!"
  - Hew, Healer card: "That's the last of them, and I'll not get far on this leg. Come and see to it, would
    you, and pull it out ~straight~."
  - Hew, mended: "Oh, that's ^better^. I'll not ask what you did, I'll just thank you for it."
  - Card how-lines: "SHADOW STEP puts you behind the goblin you face, and it's stunned for a second. Stab it
    from there." / "MARK the goblin you aim at. It takes 15% more damage from everyone, your arrows bend
    toward it, and your hound goes for it." / "MEND heals the nearest hurt friend for 25. If nobody near you
    is hurt, or you're worse off than they are, it heals you."
  - Goals: "SHADOW STEP: TAP SHADOW STEP" / "SHADOW STEP: V", "STEP BEHIND ONE, STAB IT 0 / 1"; "MARK: TAP
    MARK" / "MARK: V", "MARKED KILL 0 / 1"; "HEW IS HIT", "Kill them", "MEND: TAP MEND" / "MEND: V",
    "MEND HEW"; "Clear them" after the count.
  - Unlocks: "SHADOW STEP: V", "MARK: V", "MEND: V". Over the hero: NOTHING TO MARK, NOBODY HURT, NOT ENOUGH
    STAMINA, MARKED.
  - BUTTONS rows: "Step out of the dark behind the goblin you face. It's stunned for a second." / "Mark the
    goblin you aim at for 8 s. It takes 15% more damage from everyone, your arrows bend toward it, and your
    hound goes for it." / "Heal the nearest hurt friend for 25, or yourself if nobody near is hurt or you're
    the worst off. Costs 20 stamina."
  - Class card: SHADOW STEP "Enter the shadows and appear behind an enemy, stunning them briefly."; MARK
    "Mark a goblin. It takes more damage from everyone, your arrows bend toward it, and your hound goes for
    it."; MEND "Heal the nearest hurt friend, or yourself."; the Rogue's SKILL "Vanish: Smoke at your feet.
    Goblins lose you until you attack."
  - Smoke Bomb's skill line: "Throw smoke on the ground for 5 s. Goblins can't see anyone in it, or out of it
    from inside, unless they're close."

Tests: `tests/signature.test.ts` (each move works, its wait, a guest's press; Mark's 15% and its ticks, the
bend toward one's own mark only and within the cone, one mark a Ranger, the hound; Mend's friend, self when
none is hurt or when worst off, nobody hurt and no breath cost nothing, never a goblin, Hew healed; the
smoke bomb's throw, size and time, a goblin in smoke blind past arm's reach, an archer's shot dropped),
`tests/woodsign.test.ts` (hidden and its press ignored before its step; each step completing, the Rogue's
with a real step and stab; the Healer's shot, kneel and card; the wood end to end to Wickhold for all five;
old Rogues brought over once). Updated: `magic.test.ts`, `trainer.test.ts`, `wood.test.ts`,
`woodelement.test.ts` (Shadow Step off the trainer, the extra step). Shots: `node scripts/signlook.cjs`.
## 2026-11-05: 2.5D up to FLAT, second pass: braziers, palisades, fences, hurdles, stones, graves, the beacon (Kyle; Claude Opus 5.5)

Kyle: "Some maps don't seem 2.5D, with braziers or goblin post-fence walls etc." Since the first parity
pass the camps, layout 4's rooms and scenes and the Barrowfields had landed, and a few of their pieces
were still a painting on a plane or a box where FLAT draws them properly.

**The audit** (every country's job room, every layout-4 room kind and staged scene, the Barrowfields'
camps, jobs and beacon; shot flat and 2.5D side by side; drawn properly in FLAT, flat or a box in 2.5D):

- **The palisade back wall** (village, farm, green and farmstead rooms): FLAT paints rammed logs with
  pointed tops; 2.5D showed that painting on a flat plane, a box behind it and small cones on top.
  This was the "goblin post-fence wall".
- **Braziers** (the camps' fires, the war band's long fire at DRUMS, the larder's pot fire, the town's):
  FLAT has an iron bowl on a stem with coals in it; 2.5D had a post with a box on it.
- **Fences** (fields, yards, the palisade across a lane where a village stops): FLAT paints posts close
  together, a hand apart; 2.5D had three posts and two rails to a block, a low rail fence.
- **Hurdles** (THE FORD's archers, the Barrowfields' cages, the siege): FLAT weaves withies between
  stakes; 2.5D had stakes with plain rails.
- **Boulders, standing stones, bushes, hay, charcoal clamps**: FLAT's are rounded (a boulder's ellipse,
  a standing stone taller than wide with a rounded top, a bush's three clumps, a bale, a turfed mound);
  2.5D built them as cubes. A churchyard's wall of boulders and every hedge (a row of bushes) read as
  stacked boxes; the Barrowfields' and the barrows' standing stones were squat cubes.
- **Graves and barrows** (the `mound` mark: churchyards, the Barrowfields' barrows): FLAT heaps the
  earth and stands the stick cross at its head; 2.5D had only the floor painting.
- **The well's rope** (THE WELL scene's cache, every well): FLAT has the rope down from the beam; 2.5D
  had none.
- **The Barrowfields' beacon**: a log pile and its fire painted on the flat layer, and no light at all
  in 2.5D once lit.
- Already standing, left alone: the stakes ring (sharpened, with its gaps), the headframe, the mill and
  its wheel, the fallen tree, the hanging tree, headstones, apple trees, the wrecked cart, the burning
  house's woodpile, tents, shacks and dens, the cookpot, cages, the siege engine (a cart in both views:
  FLAT draws no arm on it either), cookfires, reeds, stumps, pillars, the water's banks (water3d.ts);
  the drag trail, the oil slick and the rest painted on the floor are painted in FLAT too.

**How** (drawing only; nothing in the room changes):

- **One source.** Each piece is built from what FLAT paints it from: the map's `braziers`, its `fence`,
  `hurdle` blocks and round things, the `mound` marks, the theme's `back`, the expedition's `zone` and
  `phase`; in FLAT's colours and spacing (the brazier sprite's iron, bowl, rim and coals; a log every 6
  pixels in the palisade's three browns with its dark seam; a fence post every 5 pixels; a stake every 7
  in a hurdle; the beacon's four courses of 18, 14, 10 and 6 pixels).
- **Files.** `three/brazier3d.ts` (a flared iron bowl in three courses on three splayed legs, its rim and
  coals; flames in the bowl; light from the room's lamps as before, a camp's always), `three/palisade3d.ts`
  (the palisade back wall as logs, each sharpened, a dark backing behind; the painted plane is gone for
  this theme), `three/fence3d.ts` (posts a hand apart on two rails; chained blocks make one wall with
  the map's gaps), `three/siege3d.ts` (the hurdle woven: each withy in front of one stake and behind the
  next, the row above the other way), `three/nature3d.ts` (boulders, standing stones, bushes, bales and
  clamps rounded), `three/mounds3d.ts` (graves and barrows heaped, the marker standing),
  `three/beacon3d.ts` (the log pile, and once lit its fire and FLAT's light: reach 11 tiles, warm);
  `rounds3d.ts` hands the rounded ones over and gives the well its rope and bucket; `ground.ts` takes the
  brazier, palisade and mounds; `view3d.ts` the beacon; `overlay3d.ts` no longer paints it flat.
- **Light for a phone.** Everything is still merged into the map's one mesh (the beacon is one mesh of
  its own), so draw calls don't move. Measured headless on phone (390x844 at 3x, software GL, `?perf=1`
  counts both hero passes; before -> after):

  | scene | draw calls | triangles |
  | --- | --- | --- |
  | a Barrowfields camp (the busiest: tents, shacks, the brazier, cookfire, the band) | 56 -> 56 | 26,548 -> 33,304 |
  | the Barrowfields by the cages and hurdle | 45 -> 45 | 27,614 -> 34,370 |
  | the Barrowfields' beacon lit | 32 -> 33 | 23,478 -> 30,438 |
  | DRUMS (layout 4: the war band in its stakes, two braziers) | 47 -> 47 | 5,616 -> 7,148 |
  | a churchyard (layout 4: graves, headstones, the boulder wall) | 32 -> 32 | 9,630 -> 11,162 |
  | Tollan's Farm (palisade wall, fences, bales) | 31 -> 30 | 8,742 -> 13,108 |

  The Barrowfields is one big merged mesh, so every boulder and bush on its whole map counts: about
  7,000 triangles more, three passes over. Frame times are within the noise of the shared box.
- **Seen side by side.** `scripts/parity-look.cjs` now also takes layout 4's rooms and scenes (targets
  from `npx tsx scripts/parity2/find.ts > scripts/parity2/targets.json`, one of each room kind and staged
  scene, stood by its piece) and the Barrowfields at a camp, each job and the beacon (lit for the shot);
  FLAT gets 1.5 s to settle its camera before its shot.
- **Left as they were.** The trees back wall (its face is still the painted treeline under 3D crowns);
  the low side walls (dark boxes, as FLAT's dark bands); tents (cloth slopes, plain like FLAT's); a
  shack's roof is shingles in the sailcloth's colour, not patched cloth.
- Tests: `tests/parity3d.test.ts` (every block in layout 4's rooms and the Barrowfields builds as itself,
  never the plain box; a fence's posts by FLAT's spacing; the hurdle woven both sides; the brazier's legs,
  flames in the bowl and its light; the palisade's logs and points; rocks, bushes, bales, clamps rounded
  and the standing stone upright; graves heaped with the marker standing; the beacon's four courses; the
  same every time). `walls3d.ts` takes `LOOK` from `blocklook.ts` so it loads in Node. No new
  player-facing words.
## 2026-11-05: the shops reworked: seeded vendors in each class's place, the pawn sells, seven tiers, modifiers that do a weapon's job (Kyle; Claude Opus 5.5)

Kyle: "Pawn should sell random items and you can sell anything to, also sells the bag upgrades. Specific
class weapons should be sold by a vendor in the associated class area like the tavern and wizard tower and
be randomized in what it is and traits every ten minutes real life. Chance for some really good things but
priced appropriately. We also need to re-look at stats on items ... light armor high level can and should be
just as good as heavy, and stats and bonuses rolled as attributes need to be related and not class
specific." Then: "Wtf is tolmouth btw. Not clear. Maybe we also have yellow in there; orange, yellow and red
are really good but rare and dangerous." Then: "buying and selling is noisy ... compare ... should be a
toggle", an upgrade offered when you picked something to melt, and scrolling past stats to SELL.

- **Seven tiers** (`shared/gear.ts` TIERS, TIER_ORDER; ids unchanged so every save loads): PLAIN white,
  FINE green, FORGED blue, **PRE-WAR** purple (id `tolmouth`: the old name meant nothing on a chip; Tolmouth
  stays the lore of where that steel came from), then the rare and dangerous three, each stronger and rarer
  than the last: **TOUCHED** yellow (new, id `touched`), **TURNING** orange (new, id `turning`), HUNGRY red.
  Touched and turning are hungry gear caught partway: steel near the hunger a short while, then most of the
  way. Each has one COST row the fight feels (`shared/costs.ts`: more damage taken, slower stamina, slower
  walk, less health or slower recharge; 8 points on TOUCHED, 14 on TURNING) and grows the Want by 1 or 2 a
  job worn. HUNGRY keeps its named gift and cost, the church, and is still the top: biggest modifiers, the
  chip filled dark red with a glow; the rare chips are filled in their colour.
- **Modifiers are worth points** (`shared/mods.ts`): one point is about 1% less damage taken. A tier gives
  each modifier its share (Fine 5, Forged 8, PRE-WAR 12, TOUCHED 14, TURNING 17, HUNGRY 20) and a roll lands
  within a fifth of it. Counts: 0, 1, 2 (or 1 and an element), 2 and a trait, 3 and a trait and a cost, 3 and a
  trait and a cost, 3 and the gift and cost.
- **Weapons do their own job better**, never a flat DAMAGE pile: QUICKNESS, REACH, CHARGE on every kit;
  SWEEP (wider arcs, swung kits only), FINISHER (the combo's last blow), KNOCKBACK (Warrior, Healer, the
  big ones, the crossbow), BACKSTAB (Rogue kits), CRIT (Ranger and Rogue), PARRY (kits that parry), BLOCK
  (kits that hold a block), HEALING (Healer), SPELL POWER and SPELL COST (Mage). Wired in the room:
  `sim/hero.ts` currentSwing (sweep, finisher), `sim/combat.ts` and `backshot.ts` (backstab),
  `sim/gearstats.ts` (gear crit with the drill's), `sim/spells.ts` (spell cost, never below 1), `sim/room.ts`
  (spell power on the hold). DAMAGE stays on rings, and on old pieces that have it.
- **The relevance rule:** a weapon rolls only for its own kit; armor rolls its weight's list (heavy BLOCK,
  TOUGHNESS, HEALTH; medium HEALTH, TOUGHNESS, STAMINA, SPEED; light DODGE, STAMINA, SPEED, CRIT), never
  PARRY; rings what anyone uses plus, rolled for a class, its own. Rolled for a class (drops, the class
  vendors), nothing it can't use. Rolled for nobody (Tobin's table), armor keeps its weight's whole list, and
  on the card a modifier the wearer can't use is dim with "no use to you".
- **Light against heavy** (`shared/budget.ts`): heavy's frame (25% less taken, 12% slower, a shorter dearer
  dodge, standing fast) is worth 9 points, medium's 7, light's 0, so from Fine up light gets 9 points back in
  its modifiers and medium 2. Every weight adds up the same at every tier (test prints the table); plain plate
  is the better plain piece.
- **Prices** (`shared/prices.ts`): a middling piece is 25, 70, 180, 480, 1200, 2600 gold by tier (hungry
  never sold), times the roll's quality squared (0.64 to 1.44), +10% a trait, armor 0.9, rings 0.8. A strong
  TURNING weapon runs to about 3700, beside the 3600 pack. Tobin pays 30% of that, +8 a level.
- **Vendors** (`shared/vendors.ts`, `client/vendorui.ts`, words in `client/vendorwords.ts`): a person at a
  counter in each class's place: Quartermaster Prue (the barracks; first written Nell), Bowyer Tems (the hunters' lodge), Nettle
  (a table at the back of the Drowned Rat, by Whisper), Apprentice Lis (at the desk in Vell's tower), Verger
  Oswin (the church's vestry). Five pieces each (three of the class's weapons, an armor, a ring), rolled from
  `floor(now / 10 min)` and the vendor: the same for every player and device in that window, "Fresh stock in
  7 min." ticking on the panel. Odds a piece: Plain 8%, Fine 42%, Forged 35%, PRE-WAR 12%, TOUCHED 2.2%,
  TURNING 0.8%; 12% of pieces roll strong (the top of the band, priced to match). Oswin's vestry never
  stocks the rare three (the church won't hang up anything the hunger touched); its best is a strong PRE-WAR
  piece (15%). A bought piece is gone for you until the stock turns (`Profile.bought`, this window only).
  Anyone may look; a weapon only sells to its class.
- **Tobin** sells six random pieces of any class from the same clock (Plain 35%, Fine 40%, Forged 19%,
  PRE-WAR 6%; was PRE-WAR 5%, TOUCHED 1% until the rules below), the bigger packs (prices kept: 400, 1000,
  2000, 3600) and the buyback; and buys anything but the rare three (below).
- **Halvard's rack is gone** (class vendors sell the gear now); the forge is two lists: UPGRADE WHAT YOU WEAR
  (tap one: only UPGRADE) and MELT DOWN FROM YOUR PACK (tap one: only MELT DOWN).
- **The shop card** (`client/shopui.ts` itemPop, every shop, store and vendor): the thing tapped and its stats
  (no guard and dodge pictures), COMPARE off by default and remembered on the device (the changed rows only,
  better and worse marked), and a bar at the foot that never scrolls away with only that piece's actions, the
  price on the button.
- **Drop odds:** a butcher 1% TOUCHED; a named butcher (and a hard job's treasure) TOUCHED 2.5%, TURNING
  1.5%, HUNGRY 1% (was 2%); a chest 1%, 0.6%, 0.4% (hungry was 1%). Danger never lifts a roll into them.
- **Words:** every new line went through the lore keeper's and the line editor's checklists (no agent tool
  in this session, so done by hand against their files; see the report). For Kyle: whether Tobin should
  take hungry gear after all ("you can sell anything to"); Dessa still sells Forged class weapons and rings
  when the market's open; the hungry drop odds halved so red is rarest; Healers have no rare tier at a vendor.

### Later the same day: who buys the rare three, and the lore keeper's fixes (Kyle; Claude Opus 5.5)

Kyle: "Tobin can't buy anything Yellow, Orange or Red, he freaks out. You can sell to a shady guy in the
tavern though, but it's very hush hush. Actually, let's make it so if you have a red item at all (equipped
or otherwise) you can't sell ANYTHING to him unless it's in the bank or donated to the church, and he
panics when you talk to him." Rules in `shared/fence.ts`; Tobin's stall `client/stores.ts`; Nettle's tab
`client/fenceui.ts`; tests `tests/fence.test.ts`.

- **Tobin won't touch TOUCHED, TURNING or HUNGRY.** `pawn()` refuses them (`tobinWont`). In his sell grid
  they sit dim (dotted, faded, "NO" where the price goes) with "Tobin won't buy touched, turning or hungry
  gear." under the grid and on the card, where he says his old line ("No, put that away, I'm not touching it
  at any price. I've a family."). TOUCHED is out of his stock odds, so he never stocks the rare three.
- **Hungry gear on you shuts his stall.** Any hungry piece worn, in a hand (held or not) or in the pack:
  Tobin buys nothing, sells nothing and sells nothing back (`pawn` and `redeem` refuse; `carriesHungry`).
  Chosen: he won't trade at all, not just won't buy, since Kyle said he panics. His panel is only his panic
  line and the plain rule ("Tobin won't trade while you carry hungry gear. Leave it in the vault or give it
  to the church."); no stock, no packs, no buyback. What he holds for you keeps its usual time, so a
  buyback can run out while you carry red.
- **The vault takes hungry gear now** (a change: it never did). Kyle's "unless it's in the bank" needs it,
  or the vault case can't happen. Edda's refusal became a grudging yes on the piece's card. Stored, a piece
  is off you for Tobin's sake; it is not given up, so the Want doesn't fall. Only the church gives it up.
- **Nettle is the shady guy.** He already keeps the Rogue's table at the back of the Drowned Rat and his
  greeting is about not asking, so no new person: his table gets a second tab, UNDER THE TABLE, beside FOR
  SALE (open to any class). He buys TOUCHED and TURNING only, at 20% of the piece's price (+8 a level),
  under Tobin's 30%, and it's gone (no buyback). Selling shows his quiet line. **Not HUNGRY**: the bible's
  church rule stands (giving it up is what feeds the Lantern and lowers the Want; a fence would skip that),
  so a hungry piece is dim there with "Only the church takes hungry gear." Nettle doesn't panic: he trades
  with a hero carrying red. Selling to him never touches the Want.
- **The lore keeper's fixes:** Quartermaster Nell is now QUARTERMASTER PRUE; Lis's cupboard is "Wands,
  staves and a blade or two, in a cupboard under Vell's stair."; the vestry is "The church's vestry, maces
  and flails hung up beside the robes."; the vestry's takings never go in the Lantern box (bible). Mods:
  CHARGE is QUICK HOLD ("held attacks and bow draws build faster"), SPELL COST is CHEAPER SPELLS (its text
  kept), CRIT's text is "chance a hit does 50% more damage". Costs: winded reads "Magic refills n% slower."
  for a Mage and "Stamina refills n% slower." for everyone else (`costText(cost, cls)`); slow reads "You
  move n% slower." "Turning" is used on screen only as the tier's name, never of a hero (checked).
- **Words for the lore keeper and line editor** (written here without the agents): Tobin's panic, the plain
  rule under it, the dim reason and "NO", Edda's hungry line, the tab name, what Nettle buys, his sold line,
  and his two dim reasons. All in `client/storewords.ts` (PAWN, BANK) and `client/vendorwords.ts` (FENCE).
- **Fixed on the way:** a keeper's line on a shop card (Tobin's, Edda's or Halvard's line about a hungry
  piece, Nettle's sold line) came up empty, because spoken lines only typed in on panels. The card now types
  them too (`client/shopui.ts` `open`), with the action bar visible from the start.
- Phone shots (one build, `vite preview`): Tobin panicking, UNDER THE TABLE, Nettle's sold line, Tobin's dim
  grid and refusal card. For the lore keeper: Tobin's greeting still says "I'll buy it, whatever it is",
  which is no longer true.

## 2026-11-05: the staff's fire hold is a fire pit dropped on a goblin (Kyle; Claude Opus 5.5)

Kyle: "The wall of fire from staff is still not great. I don't know what to do with it, it's just super
hard to aim. Maybe it is a circle on the enemy or something? Like a filled-in AOE? Allies gotta run from
it but ya." The ring of fire round the Mage (a band you had to make goblins cross, awkward up close) is
gone; the staff's frost and storm holds (hard frost, the charged ring) stay centred on the Mage. Numbers
in `shared/spellbook.ts` FIRE_PIT, the room's rules in `sim/firepit.ts`.

- **No aiming.** At the release it drops on the nearest goblin within 6 tiles inside a 90 degree cone
  (45 either side of where the Mage faces), else the nearest goblin within 6 tiles anywhere, else a spot
  3 tiles ahead (short of a wall, the bolt's own wall check). The Mage turns to it. It lands where the
  goblin stood; it doesn't follow it. Judgment: no line-of-sight check, as nothing else on the staff has one.
- **The pit.** 1.8 tiles round (2.4 on a perfect; WIDE BURST widens it as any area). It catches for
  0.35 s (drawn as the circle filling), then burns 4 s (6 on a perfect). Every 0.5 s each goblin in it
  takes 2 (times the hero's damage: primed, blessed) and is set alight (ATTUNED's longer burn counts). Each
  friend in it takes a third of what a goblin loses a tick there (the pit's 2 and a burn's 4): **2 a tick,
  4 a second**, so 16 over a whole pit, 24 over a perfect's; the Mage's own pit burns the Mage on the same
  terms, and the freed too. Heroes have no burning status, so it stops the moment you step out. A roll,
  the grace on coming in and SHAKE IT OFF keep you out of it, as on a lit slick. When it catches, wood in
  reach may catch and an oil slick in it goes up (`oil.ts` `lightNear`: the old `firering` event check ran
  before skills were cast each tick, so the pit lights slicks directly).
- **Rain** shortens it by the weather's burn share (`shared/sky.ts` `burnFor`, 0.6): 2.4 s, 3.6 on a perfect.
- **Balance, measured** (`tests/spellbook.test.ts`, one plain hold of 30 magic, everything in the 4 s
  after the release with fire's burn counted, the convention of the spellbook table): one goblin in it,
  fire pit **38**, charged ring 40, hard frost 12 (and frozen); a pack of four, **152**, 160, 48. The test
  holds the pit within 15% of the charged ring on one and on four, and frost under half (it trades damage
  for freezing). Honest about the tail: a goblin that stood in the pit the whole time keeps burning 3 s
  after it, so over 8 s it's 64 on one (256 on four) against the ring's 40; the ring pays it back in a
  flinch every half second. Goblins seldom stand in it that long.
- **Seen, both views, from the room's zone** (`client/firepitdraw.ts`, called by `spellground.ts` for the
  flat glow layer and the 2.5D overlay). Filled in a warm orange-red (#f2622a, a hotter #ff8c32 flicker
  in a shifting dither, dark scorch flecks, a few #ffb050 tongues and embers): not the goblins' red
  (#e23a30) and not gold. Its edge is the striped telegraph's (#ffd040 / #2a1408) all the way round
  from the drop, the game's sign for "this hurts you, get out". While it catches the faint whole circle
  shows and the fill grows from the middle. In 2.5D the overlay lies over the bodies, so the pit is
  painted on a scratch canvas and each body on it cut out (as the flat view's sprites erase the glow), so a
  goblin burning in it stays in sight. Its light: a low glow as it catches, then warm. The drop is a fall of
  embers onto the spot and a ring; the catch (`pitup` event) fire thrown up all over it, a ring, a flash,
  a shake; sounds a soft whoosh, then fire's whoosh and the flare. The 3D gold blessed-ground ring and the
  skill lights skip it.
- **Online**: the pit is a zone (`kind: 'firepit'`, `at` the moment it catches), so it rides the patch;
  a guest's hold drops it on the leader's room.
- **Words** (placeholders until the lore keeper and line editor, `client/kitlines.ts`): staff HOLD "Fire
  pit on a goblin", PERFECT "Bigger, burns longer", the fire ALSO row "Burns friends too, keep clear", the
  book card's FIRE row "Tap flame sweep, hold fire pit" and its ALSO row "The fire pit burns friends too,
  so keep clear of it" (said once a card; not on frost or storm). Left for the lore pass: the class card's
  SPELLS note still ends "Wand far, staff round you, spellblade up close" (`shared/classes.ts`), now true
  of frost and storm only.

Tests: `tests/firepit.test.ts` (the goblin in front though one behind is nearer, the cone's edge and the
reach, the fallbacks to the nearest anywhere and to a spot ahead, short of a wall; the perfect's size and
life; the catch, then goblins burned and alight, one outside untouched; a friend taking about a third and
nothing once out, the Mage in its own pit; rain; a guest's hold and the same pit decoded from the patch),
`spellbook.test.ts` (the staff's fire hold, the holds' balance), `magekit.test.ts` (the centred-ring tests
now on storm), `kitwords.test.ts` (the new lines, the friends line once and only on fire).
## 2026-11-05: the Mage's elements taught in the wood (Kyle; Claude Opus 5.5)

Kyle: "We should have the Mage tutorial explain the elements in the full charge place. Have enemies that are
weak and resistant to each type, and just explain you can cycle your elements and to watch out for that."

- **Where:** Hew's clearing, after the Mage's FULL CHARGE (its count made and its four looters down). One
  more step there, the Mage's only (`sim/woodelement.ts`, called from `stepWood`; `wantsElement` is
  `cls === 'MAGE'` at stage 2). Every other class's wood is as it was.
- **The card:** Hew's line, the move ELEMENT with its control (X on a laptop, ELEMENT on a phone), the plain
  how line. On a phone the ELEMENT button is lit gold (`.hint`), as the stick is for the first walk. It
  waits for a press of ELEMENT (`Hold.need: 'element'`), which goes on and switches as the world restarts; a
  tap on the card or Enter still goes on. The ELEMENT button is now one of the wood's taught buttons: hidden
  and its press ignored until this step (`taught()` gains `element`, `elementTaught`), then given with the
  usual gold pulse and label (`unlockflash.ts`). Before today a Mage could switch from the first field.
- **The goblins** (`shared/wood.ts ELEMENT_FOES`, close round the middle of the clearing so all three are in
  sight on a phone): small drilled goblins like the lesson's others (24 health, one comes at a time), each
  a lesson-only variant with a row in the weakness table (`shared/weakness.ts`, `VARIANTS` in tuning.ts,
  `FoeVariant` in terrain.ts). Normal goblins' rows are untouched.
  - `soaked`, wet through from Hew's water butt: wet by the wet rule (`sim/wet.ts`: a soaked goblin is wet
    wherever it stands, so it's real wet: storm 1.5x and jumps), fire 0.5.
  - `aproned`, in a bark apron: fire 1.6, frost 0.6.
  - `kilnhot`, off the kiln: frost 1.6, fire 0.5 (the Stoker's shape).
  Drawn over the small goblin's body by `client/lessonfoes.ts` (flat, and 2.5D through its cards): the soaked
  one blue-streaked, dripping, in a puddle with rings spreading; the aproned one in a pale ribbed apron on a
  strap; the kiln-hot one with embers glowing in its skin, coals at its feet and smoke off its head.
- **Feedback:** the existing WEAK (bright, in the element's colour, sparks) and RESIST (small, grey) callouts.
  One change outside the lesson: **storm on a wet goblin now says WEAK** everywhere (`damage()`: the wet 1.5x
  counts toward the callout, as the table's weaknesses do), so the rule the class card states shows when it
  happens. A tick still says nothing; the wand's storm stream held on the soaked goblin says WEAK in the lesson
  (throttled as ever) so the stream counts there too.
- **Done:** the count is a weak hit on each of the three in its own element (a WEAK over it in that element,
  or the storm stream held on the wet one): WEAK HITS n / 3, Hew's word on the first. Each needs a different
  element, so it can't be done without switching. Judgment: the way on opens once the three are down, as in
  every other lesson ("clear them"); and if they're all killed before the count is made (the fallback), it
  opens anyway rather than sending them again. A weak hit nearly always kills at 24 health, so the two mostly
  land together; survivors walking after you to the stream lesson would have been worse.
- **Words** (for the lore keeper and the line editor; not yet run, no agent to call from here):
  `LINES.teach.element` (Hew) "Now these three aren't alike, see, and you'll want to mind which is which.
  That one's wet through, it's been at my water butt again, and that one's got my old bark apron on, which
  goes up like *tinder*, I've lost two that way. And the one by the kiln's been sat on it so long it's hot as a
  hob, you'd not set fire to that one if you stood there all day."; `LINES.how.element` "ELEMENT switches
  between fire, frost and storm. Some goblins take extra from one (WEAK) and shrug off another (RESIST). Watch
  for it."; the goal "ELEMENT: TAP ELEMENT" / "ELEMENT: X", "WEAK HITS n / 3"; the unlock "ELEMENT: X".

Tests: `tests/woodelement.test.ts` (a Mage gets the step and the ELEMENT button, no other class does; the
card waits for ELEMENT and the press switches; before the step the press does nothing; each goblin's weakness
and resistance and the wet storm WEAK; plain goblins unchanged; done by weak hits, done by the fallback; the
wood end to end to Wickhold for all five classes). `tests/wood.test.ts` unchanged and passing.

## 2026-11-05: the storm wand's stream runs itself and builds by taps; its hold calls lightning down (Kyle; Claude Opus 5.5)

Kyle: "The quick attack of the lightning wand is really bad" (holding attack charges the hold, so a stream
kept on by mashing felt poor). He picked a self-running stream: "Self-running stream is cool, building to a
point if you tap three times, and it doesn't slow down your walk speed as much as cold and fire quick
casts." And the hold: "I want the charge to call down a lightning strike in an AOE after a brief delay,
similar to smite but quicker, and have a thunder crack with it."

- **The tap: a stream that runs itself** (`sim/stream.ts`, STREAM in `shared/spellbook.ts`). One tap starts
  it for 1.5 s (`keep`) on the goblin in front, latched and held by the same rules as before (5 tiles and
  20 degrees to take one, 5.5 and 50 to keep it). Each tap while it's on adds a step of build, three at
  most: 1x, 1.75x, 2.5x (`steps`), and starts the 1.5 s again. It ends 1.5 s after the last tap. If its
  goblin dies or gets away it takes the next one in reach, keeping its build; with none in reach it
  crackles from the hand until it runs out. The build no longer climbs with time on one goblin; the hero
  carries `stream.step`, so a guest draws the same step.
- **Walking**: the 0.4 pace while it's on is gone. A wand tap of any element walks at the wand's castWalk
  (0.9) for its swing, the storm tap's swing is the shortest (0.24 s against 0.54 s), and between taps the
  stream runs at your own pace. One fix for every wand: the tick a tap's swing started didn't walk at all
  (`sim/hero.ts`), so a quick tap tripped the step; a kit that casts walking now walks that tick too.
  Measured, tapping every 0.3 s while walking for 1.5 s: storm 5.11 tiles, fire and frost 5.11, no taps
  5.68 (storm 0.90 of free walking); with the stream on and no taps, the full pace.
- **Balance** (one goblin, held still; `tests/storm.test.ts`, `tests/spellbook.test.ts`): `tick` 0.12 to
  0.105 of the spark (8), so a step is 8.4, 14.7 and 21.0 a second (measured 9.0, 15.0 and 21.0 over a
  second). Kept at three steps with a tap a second: 21.0 a second, against fire 18.3 and frost 20.0 mashed
  (1.10x their mean: level with them, plus a little for keeping it built). Mashed for 6 s from cold, as the
  spellbook test measures every tap: 20.0 (fire 18.3, frost 20.0, within 15%). The storm test keeps the
  kept stream between 1.02x and 1.25x of the other wand taps.
- **The hold: lightning from the sky** (`sim/skystrike.ts`, SKY_STRIKE; `sim/thunderbolt.ts` and THUNDERBOLT
  deleted). Let go, it marks a spot: the aim turned onto a goblin within 12 degrees, as far as you aim (to
  the mouse, else the goblin faced, else 4.5 tiles; 8 at most), then onto the goblin nearest that spot
  within 1 tile of its edge, kept inside the room. 0.3 s later (`delay`; the Cleric's smite takes 0.35)
  lightning falls on a circle 1.4 round (1.9 on the white flash): 1.75 of the hold to everything in it
  (17 to 42; the bolt was 2.5 of the hold, but on one goblin), shields or no; small goblins stunned 0.8 s
  (1.4 s on the flash; the stun cap holds); a butcher hurt, not stunned. Wet ones take 1.5x and it jumps
  on to wet ones outside the circle (every goblin in it counts as reached by the cast, so none is jumped
  to twice). It spares friends (they're told SPARED, as a relic's do) and the freed. WIDE BURST widens it.
  It's a zone of kind `skystrike` in the room's own list (x, y, r, the second it falls, `fell`), so a guest
  is sent the same circle at the same second; `inSkyStrike` is what the room judges and what both views
  draw. Judgment on the damage: the brief said "the storm hold's damage"; at the bolt's 2.5x on a whole
  circle with a stun it would out-damage the fireball on a pack (60 a goblin against 44 with its burn), so
  it lands 1.75x: 42 a goblin at a full hold, level with the fireball's 44, trading the burn for the stun.
  One number to change if Kyle wants it harder.
- **Seen and heard** (`client/skystrikedraw.ts`, called from spellground.ts, scene.ts and view3d.ts, both
  views from one projection): while it's coming, the mark in the friendly gold (never the goblins' red: it
  spares friends), an unbroken ring at the circle judged, a second ring closing in from it to the middle,
  a dithered gold wash and sparks gathering; as it falls, a white-blue bolt down out of the sky with two
  forks (over everyone), the circle flashing white-blue and fading, the whole screen lit a beat (the same
  lighting lift as a weather strike: `skyFlash`, in the flat lighting pass and the 2.5D sky light), and a
  crater, earth and cold sparks (`client/fxspells.ts`). Sound (`client/spellsound.ts`): a rising crackle
  as it's called, then a hard crack with the thunder straight after (louder on the flash). The stream
  (`client/streamdraw.ts`, `streamsound.ts`) is thicker and brighter at each step (a halo of one, two,
  three pixels; a white core from the second), with more forks, a flare and a rising zip as a tap adds a
  step, and its crackle a step higher in pitch and louder each time.
- **Words** (`client/kitlines.ts`; waiting on the lore keeper and the line editor, no agents were at hand in
  this session): wand storm TAP "Lightning stream, tap to build", HOLD "Lightning strike, stuns", PERFECT
  "Bigger, longer stun", ALSO "Ignores shields, spares friends" (was "Walk slowly while it's on", no
  longer true); the unheld card's storm row "Tap lightning stream, hold lightning strike".

Tests: `tests/storm.test.ts` (one tap runs about 1.5 s alone and stops; three taps reach 2.5x and five go no
further; the build kept on the next goblin; walking no slower than a fire or frost tap and full pace
between taps; the kept stream's balance; the strike falls after its delay on just the circle shown, onto
the aim point with no goblin near; spares a friend and stuns a small goblin, not a butcher; the perfect is
bigger and stuns longer; a guest is sent the same circle and it's the one judged; shields and the wet rule
through the strike), `spellbook.test.ts`, `kitwords.test.ts` updated. `node scripts/storm2-look.cjs`
shoots the stream at one and three steps and the strike's mark and landing, FLAT and 2.5D, on a phone.
## 2026-11-04: the movement ladder, five classes; the Mage's ATTUNED and SPELLTHIEF (Kyle; Claude Opus 5.5)

Kyle: "pure upgrades, not just choosing". Every class gets every rung of a three-rung ladder on its dodge
(or, with none, what stands in for it), taught by its own trainer one at a time at levels 5, 10 and 15
for the `ladder` drill's next rank (250, 760, 1450 gold). The save keeps `drills.ladder` as the count:
an old hero has none. Rungs and every number in `shared/ladder.ts` (re-exported by tuning.ts), the
room's rules in `sim/ladder.ts` (the per-tick step), `ladderranger.ts`, `laddermage.ts`,
`ladderrogue.ts`, `ladderhealer.ts`, `taunt.ts`. Names are placeholders for the lore keeper.

- **The trainer** (`shared/steprows.ts`, used by techniques and rungs alike; `client/trainerui.ts`): a
  section of its own after TECHNIQUE, titled by what it climbs (JUMP, BLINK, DASH, GUARD, TAUNT), three
  rows with EFFECT and COST, tagged LEARNED, LEARN, LEVEL n or NEEDS; "1 OF 3 · NEXT AT LEVEL 15".
  Chapter 1's level cap is 10, so the third rung shows LEVEL 15 until the council lifts it.
- **Ranger, the jump.** JUMP SHOT: an attack press mid-jump looses the bow at once at 60% of a full draw
  (a crossbow its bolt, if one is on), once a jump. TWO SNARES (Kyle's "catches two" was already
  TRAPPER, so this is the step up): the jump leaves a pair of snares 1.1 tiles apart across it, and
  twice as many can be down; it waits on the SNARE lesson. HARD LANDING: landing knocks small goblins
  within 1.3 tiles down 0.8 s (the stun cap), shoved outward.
- **Mage, the blink.** BLINK BURST: where you blinked from, a burst 1.4 tiles round, 10 damage and your
  element (fire sets alight, frost chills, storm hits and stops), judged at once and drawn at that size
  for 0.35 s. BLINK THROUGH: a goblin within 0.5 tiles of the blink's line and in its reach is gone
  through; you come out 0.15 tiles past its back (up to 1 tile past the blink's own reach), facing it.
  PERFECT BLINK: a blink within 2 s of a PERFECT hold costs half (BLINK's cost on the phone shows it).
- **Rogue, the dash** (the button says DASH). CALTROPS: dropped where the dash began, at most every 5 s,
  0.9 tiles round, 6 s, two down at once; goblins on them move at half speed and bleed 3 s (a skewer's
  ticks). THROUGH THE LEGS: dash through a goblin (the dash's swept line within its radius) and your
  next hit within 2 s, blade or thrown, is a backstab with all its techniques. SHAKE IT OFF: a dash
  clears all your poison, and for 1 s fire underfoot (a lit oil slick, a burning house's floor) can't
  burn you. Heroes don't carry a burning status, so "shakes off burning" is that.
- **Healer, the guard** (no dodge). SHELTER: friends within 2 tiles of a Healer holding a block take 70%
  of a blow. MENDING PARRY: a parry heals friends within 3 tiles for 8 (as any of the Healer's heals,
  so it also eases poison). COVER: a Healer blocking within 1.3 tiles of a friend, facing the blow,
  takes it on the guard (breath as their own block, a guard break if it runs out) and the friend takes
  nothing; never a striped blow or a Stoker's draw. `hitHero` now takes the room's heroes for these.
- **Warrior, TAUNT** (no dodge). TAUNT sits on the dodge: the same press (Intent `rollSeq`, a counter,
  so a guest's press reaches the leader's room), the dodge's slot on a phone (a diamond with the War
  Cry's icon, its cooldown as a sweep and seconds, TAUNT under it; the context slot moves back to its
  own place) and SPACE on a laptop (in BUTTONS too). A roar: goblins within 5 tiles come for you for 4 s
  (before anyone else, even a war cry), again in 10 s; the roar's red ring is drawn at its reach.
  STAND FAST: taunted goblins' blows land at 70% (block costs too), and while the roar lasts nothing
  shoves or staggers you (as IRON FEET; dust and a red ring, no words). COWING ROAR: small goblins in
  reach stagger 0.7 s (the stun cap). A different thing from the WAR CRY skill (9 tiles, 18 s).
- **Seen as judged**: the caltrops, the burst and the roar are zones (`kind` caltrops, blinkburst,
  taunt) drawn by `client/ladderground.ts` from the room's own numbers, in FLAT and 2.5D alike (called
  from spellground.ts with each view's projection). Tells in `client/fxladder.ts`, sounds in
  soundscape.ts, all reused bursts, rings and lines; one callout only, +N MAGIC for SPELLTHIEF.
- **The Mage's techniques** (`shared/techniques.ts`, `sim/techmage.ts`), taught as the others' at levels
  4, 7 and 10 (the Mage's were 5, 8, 10) for 180, 545, 1045. PRIMED SPELLS (its old ranked bump, the
  name on screen, kept first so a Mage with ranks keeps it): a primed spell's x1.5 becomes x1.8.
  ATTUNED: a Mage's fire burns 1.5 times as long (4.5 s, not 3); chilling hits on a goblin already
  chilled build up and the third freezes it (a wand tap's three icicles count as one); storm's wet bonus
  is x1.75, not x1.5 (Kyle changed storm to jump only to wet goblins; that code is in wt-storm, so
  `wetMult(h, base)` in techmage.ts is the hook it should read, and `ATTUNED.wet` the number). SPELLTHIEF:
  a hold let go on the flash gives back half its cost (wand 10, staff 15); a spellblade's perfect is free
  already, so it gives back half of what that hold would have cost. The Mage's TECHNIQUE bump table and
  `technique()` are gone.
- New words (for the lore keeper and line editor): the fifteen rung names and EFFECT lines (RUNG_WORDS),
  the five section titles, TAUNT under the button and its BUTTONS line (TAUNT_BUTTON), the three Mage
  technique names and lines, the +N MAGIC callout.
- Tests: `tests/ladder.test.ts` (levels and prices, rows, buying, old saves, the snare wait, each rung
  firing and not without it, a guest's taunt), `tests/techmage.test.ts` (each Mage technique, and not
  without it), `tests/techniques.test.ts` and `tests/trainer.test.ts` updated for the Mage's three.
  `node scripts/ladder-look.cjs` shoots the trainer, the TAUNT button and roar, caltrops, a blink burst
  and two snares.
## 2026-11-04: storm reworked (a stream, a bolt, shields and water); fire passes on only at death (Kyle; Claude Opus 5.5)

Kyle, after playing the spellbooks: "Fire is too strong" (he loves it spreading through the world but
wonders why anyone would use storm); ice already freezes butchers, so storm needn't; he likes storm
answering shields and wants it better on water; the storm hold should be "a lightning bolt, not a chain
lightning"; the storm tap "a continuous stream of lightning from the hand that builds the longer it stays
on, but you can't move fast while using it". On top of the lead's burn change the same day (BURN.dmg 4,
BURN.tough 0.5; wand fire tap 0.9, staff fire tap 0.65).

- **Fire spreads less** (`sim/elements.ts`, `sim/damage.ts` `kill`). A burning goblin no longer sets
  others alight by touch or by the tick: only when it dies, burning, does it pass the fire to every goblin
  within BURN.spread of its body (spiders further, as before). Fire spells still set alight what they hit.
  Houses, slicks, the blaze, the freed catching from a burning goblin, and a nest set alight catching
  the spiders on it by touch (the world's fire, sim/torch.ts): unchanged.
- **Storm's rules, every storm** (`shared/magic.ts` STORM, `sim/wet.ts`, `sim/elements.ts` `zap`): it
  ignores shields (a shield-bearer's board from the front, so a shield wall too; shots already went round
  it, now the staff's sweep and the spellblade's cuts do: `sim/combat.ts`, `stormCut`). Dry, it jumps
  nowhere. **Wet** is a goblin standing in the room's water (any of the map's `water`: fords, shallows,
  the fen's pools, what `wadeAt` slows) or any goblin while it rains on the room. On a wet goblin storm
  lands **1.5x** (`STORM.wet`, in `damage()`, so every storm source counts it) and jumps to every other
  wet goblin within **3 tiles** (`STORM.reach`), each taking 0.5 of the blow (`STORM.share`, at least 6,
  then 1.5x as it's wet), **once each a cast** (`Enemy.jolted` holds the cast: a tap, a shot, a swing, a
  ring's pulse, a dash, one tick of the stream). A javelin in a body is still a lightning rod. The storm
  tether (a Mage skill) follows the same rule. Judgment: the rule is the element's, not only the Mage
  weapons', so the card can say it once and it stays true for relics in storm too.
- **Wet and the weather** (`sim/wet.ts` `raining`): on main the weather is still paint on the room's theme
  (`theme.rain`, `theme.storm`), so that's what `raining` reads now. It's the one marked WEATHER HOOK:
  when the room's weather becomes a rule (`theme.sky`, `shared/sky.ts` on the weather branch), it becomes
  `return wet(room.theme)` and every storm rule follows.
- **Wand storm tap: the stream** (`sim/stream.ts`, `shared/spellbook.ts` STREAM). Each tap (a quick swing:
  0.08 s up, 0.12 s back, so a mash keeps up) keeps it on 0.35 s more. It latches on the nearest goblin
  within 5 tiles and 20 degrees either side of your aim and holds it within 5.5 tiles and 50 degrees (on
  a phone the Mage stays turned to it). Every 0.1 s it deals 0.12 of the spark (0.96, so 9.6 a second)
  times its build, which climbs from 1x to 2.5x over 2 s on the same goblin (24 a second), and starts
  again if it breaks off or the goblin dies (it then takes the next). While it's on you walk at 0.4 of
  your pace. Wet, every tick lands 1.5x and jumps. It doesn't break blows (the other wand taps still do),
  so the storm wand's ALSO row says what it does instead. No bolt is loosed and no `shoot` event; the hero
  carries `stream`, so a guest draws the same line on the same goblin at the same build.
- **Wand storm hold: a lightning bolt** (`sim/thunderbolt.ts`, THUNDERBOLT). Thrown at the release, at
  once, straight from the hand along the aim (turned onto a goblin within 12 degrees of it), 9 tiles at
  most, a wall stops it, 0.3 either side of its line: the first goblin takes 2.5x the hold (10 to 24, so
  25 to 60), shield or no shield; a bolt into a wind-up breaks that blow. On the flash it runs through
  every goblin on the line and breaks off whatever each was doing. It no longer falls from the sky after a
  delay, and doesn't stun: the red striped strike mark is gone (STRIKE and the `strike` bolt retired). The
  `spell` event carries how far it went (`r`), so both views draw the line that was judged.
- **Staff and spellblade storm** keep their spells (crackling sweep, charged ring, cuts, lightning rush)
  under the new rules: shields ignored, jumps only between wet goblins.
- **Balance, measured** (one goblin held still, tapping as fast as the kit lets you for 6 s, burns
  counted; `tests/spellbook.test.ts` keeps each kit within 15%, `tests/storm.test.ts` keeps the stream's
  full build between 1.1x and 1.4x the other wand taps):

  | dmg a second | fire | frost | storm |
  |---|---|---|---|
  | wand, one goblin | 18.3 | 20.0 | 21.3 (stream: 15.0 over its first 2 s, 24.0 built) |
  | staff, one goblin | 19.0 | 18.7 | 18.7 |
  | spellblade, one goblin | 25.7 | 30.0 | 30.0 |
  | pack of four, dry (wand, staff, blade) | 18, 76, 101 | 20, 75, 118 | 21, 75, 118 |
  | storm, pack of four in water (wand, staff, blade) | | | 80, 154, 253 |
  | storm, one goblin in water | | | 32, 28, 45 |

  (The goblins in these never die, so fire passing on at death isn't in the pack numbers.) Holds, a full
  hold: the fireball 44 on each of a pack of four (176); the bolt 60 on one, 60 on each of a line on the
  flash; in water 90 on the first and 45 jumped to each wet one near, 90 then 135 on each of a wet line
  on the flash. Charged ring over 4 s: 40 each dry, 64 and 136 in water; the dash 18 each dry, 27 and 41
  in water. Storm now hits one goblin hardest, answers shields and owns the water; dry, it no longer
  out-damages fire on a pack.
- **Seen and heard** (both views): `client/streamdraw.ts` draws the stream as a jagged, flickering line
  from the wand's tip to the goblin, with a halo, a white core once it's built, and more forks as it
  builds (a short crackle from the hand when nothing's in reach), and its light; `client/streamsound.ts`
  a sustained crackle and buzz whose pitch and loudness rise with the build, snaps over the top;
  `client/fxspells.ts` the bolt as a thick jagged line to where it stopped, sparks and a flash; storm
  ticks show yellow sparks and some of their numbers.
- **Words** (for the lore keeper and the line editor, `client/kitlines.ts`, `shared/classes.ts`,
  `shared/skillwords.ts`): wand storm TAP "Lightning stream, builds up", HOLD "Lightning bolt, ignores
  shields", PERFECT "Whole line, interrupts any blow", ALSO "Walk slowly while it's on"; staff storm TAP
  "Crackling sweep, ignores shields"; spellblade storm TAP "Cuts ignore shields"; the unheld cards "Tap
  lightning stream, hold lightning bolt", "Cuts ignore shields, hold lightning rush"; the class card's
  SPELLS note (where "wet" is said, once): "Your element is your spellbook: switch it with ELEMENT. Fire
  burns, and spreads when a burning goblin dies. Frost chills (slows) and freezes. Storm ignores shields.
  Wet goblins (in water, or out in the rain) take 1.5x from storm, and it jumps between them. Wand far,
  staff round you, spellblade up close."; STORM TETHER "Lightning ties you to one goblin and jumps to wet
  ones near it."

Tests: `tests/storm.test.ts` (fire passes on only at death; storm through a shield's board and a shield
wall; no jump dry, jumps in water and in the rain, 1.5x, once a cast; the stream builds, restarts on the
next goblin, goes off without taps and slows the walk; the stream's balance; the bolt's first goblin and
the perfect's line), `spellbook.test.ts`, `elements.test.ts`, `magic.test.ts`, `skills.test.ts`,
`kitwords.test.ts` updated.
## 2026-11-04: Redis on a budget: the town quiet, parties batched and brought together, a meter, and a clean fallback when the month is used up (Kyle; Claude Opus 5.5)

Kyle's Upstash database showed 345K of the free plan's 500K commands a month after a few sessions, and
he asked how he'd know if he hit the limit with friends. Every player on the site sits in the shared town
automatically, so steady costs (a tab left open, a phone in a pocket) count as much as play.

**Measured first** (`scripts/budget-online.cjs`): a real redis-server, the dev server's two relay
instances on it, `/api/world`, `/api/save` and `/api/owed` on it too, each page pinned to an instance in
turn (`?relay=.../api/room/i0`, so a party really is split), real Chromium driven for 60 s a scenario, and
Redis's own `INFO commandstats` as the meter. Commands a minute:

| Scenario | Before | After |
|---|---|---|
| One player idle in town | 30 | 2 |
| An idle tab past 3 minutes | 30 | 0 |
| A hidden tab | 4 | 0 |
| Two players walking about town, on two instances | 218 | 81 |
| Party of 2 on a job, split, the friend hops to the leader | 3,843 | 26 |
| Party of 2 on a job, split and can't hop (worst case) | 3,843 | 1,162 |
| Party of 4 on the Barrowfields, split, friends hop | 4,976 | 26 |
| Party of 4 on the Barrowfields, split and can't hop | 4,976 | 1,216 |
| A solo job on the site | 0 | 0 (the window's 2 a minute were the instances' meters adding up the scenario before) |

An hour: a tab left in town idle, 1,800 before and about 6 after (3 minutes as an idle player, then
nothing); a hidden tab, 240 before and about 7 after (a minute, then its goodbye); an hour of 4-player
Barrowfields, 299K before (1.7 hours of play would spend the month) and 1.6K after when the friends land
beside the leader (over 300 hours), 73K (about 7 hours) if they can't. (The 4-page runs ran at 13 to 19 fps here;
real phones at 60 send more, so the real "before" was worse.) What the before was made of: each friend's
input on every frame the mouse or stick moved, the leader's patches 15 to 20 a second, each one PUBLISH
once split; a hosted room's touch (SET + EXPIRE every 2 s, 60 a minute); each player in town looking at the
world every 30 s, 15 commands a look (a sorted set per stat).

- **Batches** (`api/_outbox.ts`): what an instance has for the bus waits up to 0.1 s and goes as one
  PUBLISH, in order, never over 192K characters; the first after a quiet spell goes at once, and a message
  marked urgent (`u: 1`: a button pressed) takes the queue with it at once, so a parry is never held. The
  receiving side unpacks in order. One message alone goes as itself.
- **A friend far from the leader hops** (`client/relay.ts` HOPS, `far` from the relay): a friend whose
  socket landed on another instance than the leader's reconnects, up to 3 times, swapped like a rotation,
  to land beside them; a party together costs Redis only its touch. Found on the way: PUBLISH's count
  marked the room shared under '?', and the other instance's 'away' didn't clear it, so the room stayed on
  the bus 40 s after the hop (`api/_presence.ts`). Whether Vercel spreads a reconnect over its instances is
  for the live logs to show (each join logs its instance).
- **The touch** (`api/_relay.ts`): liveness is judged only by the seen time, so only it is written, one
  SET at most every 7/16 of the stale time (3.5 s of 8; a host saying only its 4 s heartbeat is written on
  each, never more than ~4 s old); the claim keeps 15 minutes and is refreshed by one EXPIRE every 5. A
  live host is still never taken for gone, a dead one still is after 8 s.
- **The town** (`client/townfolk.ts`, `client/reckon.ts`): nothing sent with nobody else in town; dead
  reckoning (each word carries a velocity, the others carry the figure on, a word again only on a start,
  stop, turn or half a tile of drift, at most 5 a second); still, nothing but a word every 2 minutes (in
  case a goodbye went missing; gone after 5 silent minutes, else on the relay's `left`); a socket swapped
  in every 4 minutes doesn't say `hi` again (that drew an answer from everyone). Hidden a minute, or
  untouched 3 minutes and not in a party, the tab leaves the town's room and comes back at a look or a
  touch. The world is looked at every minute, not while idle.
- **A friend's input** (`client/coop.ts`): a button at once and urgent, the stick and aim at most 10 a
  second, rounded to hundredths, and every 2 s regardless (it was every 0.5 s). Presses are counted, so
  none is lost.
- **The world** (`api/_world.ts`): the Roll kept as one value beside the world; a look is one MGET, and an
  instance answers looks from what it read in the last 30 s. **Owed** (`api/_owed.ts`): one HSET a member,
  pipelined (no MULTI/EXEC), an EXPIRE only for a job new to that hero, written every 15 s (was 4).
- **A solo game or the one-file build never touches Redis**: no socket on a job alone (the town's closes);
  the world is told of a finished run once.
- **The meter** (`api/_meter.ts`): every instance counts its commands by kind (a counting decorator on the
  relay's backend, by hand in the world, save and owed stores) and adds them to `rl:meter:YYYY-MM` with one
  INCRBY that counts itself, at most once a minute and only once 200 have built up or 15 minutes have
  passed (under 1% of the budget: 1 in 201, or 4 an hour for an almost idle instance). `/api/room?meter=1`
  answers the month's total and the instance's own; the settings box shows "Online this month: 12,300 of
  500,000" (`client/netline.ts`).
- **The month used up**: Upstash's "max requests limit exceeded" (or any "limit exceeded") on any command
  trips the relay: every player gets `{t:'full'}` and a close with 4429, new sockets are refused without
  trying Redis for 10 minutes, and a plain GET answers 503 `{full: true}`. The client stops reconnecting,
  plays on alone (out of the town's room, no parties; leading a job, the friends are let go; following
  one, it takes the job on from the leader's last whole job), and says once: "Online is full this month.
  You're playing on your own for now." The world, saves and owed already fall back to this device.
- **Tests**: `tests/relaybudget.test.ts` (batches in order with nothing lost and under the limit, a tenth
  as many PUBLISHes; urgent goes at once; `far`; a hop leaves the leader's instance quiet; the slower touch
  keeps a heartbeat-only host and still lets a frozen one go; the limit refusal, at once and mid-game; the
  meter's counts and its own INCRBY), `tests/reckon.test.ts`, and a step in `scripts/town-online.cjs` (the
  dev server's `/__spend` makes Redis refuse as Upstash does: Kyle is told, leaves the town's room, and
  plays a job alone).
- Open: the two new lines through the lore keeper and line editor (no agents were at hand). A town split
  over two instances still costs about 80 a minute while two players walk about; a town hop (to the
  instance with most of the town) would be next if the meter shows it matters.
## 2026-11-04: water that reads as water, blood that clouds in it, rings at feet, goblins that cross the shallows (Kyle; Claude Opus 5.5)

Kyle: "Maps with water look kind of weird, especially when it's bloody. Maybe water can be more 3D",
"I want shallow water to ripple if you walk over it", "Some shallow water seems to really hurt pathing.
It's weird."

- **Why the shallows hurt pathing** (`npx tsx scripts/water/crossing.ts`, which wakes a small goblin and a
  butcher on one side of a stretch of shallows with a hero on the other, or standing in it, on the layout 2
  and 3 river, ford, stream and fen rooms and the Barrowfields). The flow field (`sim/pathing.ts`) was one
  grid for every goblin, each solid thing padded a fixed 0.22 tiles: about a small goblin's size, but a
  butcher is 0.62 across the middle. The banks are where the gaps it can't fit gather: reeds along every
  ford's lip and the river's edge (one a hand from deep water), reed hedges with gaps, the Barrowfields'
  river stepping bank to bank in two-tile strips. The grid called those gaps open, the butcher was aimed
  through one, walked in and stood there for good, often at the mouth of the ford. Wading slowness (0.55)
  didn't wedge anyone but made every crossing a crawl. No goblin went round the shallows (a clear line
  walks straight through water, as before), and a hero walking over every stretch of shallows bank to
  bank was never stopped (780 walks, before and after).
- **Fix** (`sim/pathgrid.ts`, `sim/pathing.ts`): a grid for each size of body (a goblin's radius to the
  hundredth: a handful a room), a cell open only where a body that size, set down at its middle, would stay
  put (what `collide()` stops), laid shape by shape (about 1 ms a room, 20 ms the Barrowfields, once). A
  goal its size can't get to (a hero behind reeds too tight for a butcher) sends it to the nearest spot it
  can reach rather than into the reeds; one knocked somewhere its size can't stand starts from the nearest
  open cell. Wading is 0.7 of dry pace for everyone (was 0.55; Kyle's "a little slower than dry ground"),
  and a wading step costs 1.4 in the field (was 1.8; about what it costs in time). Deep water is still a
  wall to anything with feet. All of it a pure function of the room, the body's size and the goal's cell:
  the same on every replay, no Rng. No map changed (no re-pinning).
- **Measured** (2235 crossings: 1125 from bank to bank, 1110 to a hero in the water):

  | | stuck (never reached the hero in 40 s) | shallows avoided | mean seconds |
  |---|---|---|---|
  | layout 2 river and ford | 0 of 576, now 0 | 0, now 0 | 4.0, now 3.8 |
  | layout 2 stream and fen | 9 of 568, now 0 | 0, now 1 | 3.6, now 3.5 |
  | layout 3 river and ford | 0 of 447, now 0 | 0, now 0 | 4.1, now 3.8 |
  | layout 3 stream and fen | 5 of 548, now 3 | 0, now 2 | 3.6, now 3.3 |
  | the Barrowfields | 13 of 96, now 0 | 7, now 0 | 4.3, now 4.1 |

  27 stuck (26 butchers) now 3, all butchers whose hero stood behind a reed hedge too tight for them: they
  come to the nearest point now and wait there. "Avoided" is a goblin that kept dry where the quickest way
  wades: the old 7 were butchers wedged at the Barrowfields' ford; the new 3 took a dry way all but as
  quick. Walked against the shortest way a body that size can walk: 0.96 mean, under 1.06 for nine in ten.
- **The look, 2.5D** (`client/three/water3d.ts`; the default view). The floor is cut where the water lies;
  shallows sit 0.07 under the bank with the painted bed (sand, pebbles, the ford's stones) showing through,
  cooler as it deepens; deep water 0.22 under, the painting's dark water stepped darker toward the middle
  in four bands with ordered dither (light.ts's look), boards and a beam painted on it still floating. The
  far bank's face (earth, or wet stone where shallows drop to deep) is one merged mesh. The surface moves:
  bands of stepped highlights in two tones, dithered, running with the current (`client/waterfield.ts`: a
  long thin body of water runs east or down the room, as the broken bridge's wreck is carried; pools barely
  stir). Two planes and one shader on them; blood and rings go in as uniforms (16 and 24 at most).
- **The look, flat** (`client/waterpaint.ts`, `client/wetdraw.ts`): the same drop painted, the far bank's
  face a strip of earth along the top of the water (a step of wet stone where shallows meet deep), deep
  water stepped darker toward its middle with the dither; each frame the same moving highlights from a
  tiled 64-pixel sprite clipped to the water, shifted along the current.
- **Blood on water** (`client/wetfx.ts`, `client/gore.ts`, `client/fx.ts`): a stain that would land on water
  never does. Blood becomes a red cloud in the water (drops landing close together join one), drifting
  downstream (0.42 tiles a second in a river, a stir in a pool), spreading and thinning out over 4 to 6.5 s,
  darker in deep water; anything else (a crack, a scorch, a green bit) is lost in it. A chunk landing in
  water doesn't bounce: it goes under with a ring, sinking out of sight in under a second; a head clouds
  more. On the bank stains are as ever (and the rats still only find those).
- **Rings** (`client/wetwatch.ts`): anyone wading the shallows, hero or goblin, leaves a ring at their feet
  about every second step (0.7 tiles; a butcher's 1.7 times as wide, further apart); a roll, dash or
  zip landing in water, a butcher's leap coming down and a body falling in splash: droplets and two rings.
  Client only, Math.random, capped at 24 rings, both views.
- Tests: `tests/wading.test.ts` (the butcher across the Barrowfields' ford that used to wedge, never in
  deep water, the same way every time, wading a little slower; the water's levels and current; blood
  clouding in water, drifting and fading, staining on the bank). `node scripts/water/look.cjs` shoots a
  river room, a ford with blood (at once and 3.6 s on) and a hero wading, phone and laptop, flat and 2.5D.
  No new player-facing lines.
## 2026-11-04: pack rushes, and the ironhide: something to block and parry (Kyle; Claude Opus 5.5)

Kyle: "I love blasting through waves but I also want to have to block sometimes and parry, you know." He
approved both ideas with one rule: "As long as the ones that wind up can all be blocked or parried at
once. Basically it checks to see allies around and joins attacks, so it's more block or dodge at once."

**Pack rushes** (numbers `RUSH` in `shared/tuning.ts`; rules `sim/packrush.ts` and `sim/rushguard.ts`;
drawn by `client/rushdraw.ts` in both views; on the room's own seeded stream, `rushRng`):
- **When.** A pack is fighting while an awake goblin of it is within 8 tiles of a hero. Its first rush
  is due 0.5 to 1.5 s into the fight, then every 6 to 10 s of fighting (seeded). Measured first with 6 to
  10 s from the start, packs were dead before any came due (a bot clears a pack in about 4 to 5 s), so the
  first comes as the pack closes in: a fight now usually opens with one, and a long fight has more.
- **Who.** A free goblin of the pack (awake, on its feet, chasing or only getting its breath back after
  a blow; not stunned, frozen, netted, carried, winding up, routed or blinded) calls it on a hero it isn't
  behind, if two more of the pack are in the fight there. For 1.2 s packmates within 4.5 tiles of it
  join as each comes free, up to 2 or 3 more (seeded). Only blade sorts join: small goblins, lungers,
  shields, brutes, ironhides; never archers, back-liners, wolves or the newer sorts with their own tricks.
- **The fan.** They walk to a fan 1.55 tiles before the hero on the pack's side, 0.42 radians apart (the
  slots follow the hero as he moves). Once all are in place (2.4 s at most) and the fan's middle is in
  front of the hero (cosine 0.55), they begin one 1.3 s wind-up together (a small goblin's is 0.55): a
  9 damage stab each (14 for a brute or ironhide), one shared land time. Fewer than three in place: it
  fizzles and the pack tries again 1.5 s later.
- **Every blow in one instant.** Each blow of a rush keeps the room's clock (`land`), not its own: a
  quick blow's hitstop or frost can't put one out of step. Frozen, netted or stunned in the wind-up, that
  one is out; the rest still come.
- **One guard answers it all.** The guard arc is judged from the fan's middle, so a guard facing it
  covers every blow. One held block takes every blow for the stamina of one (BLOCK on each). One parry in
  the window parries every blow (one press, one window: the rest of the instant's blows read the same
  parry), each goblin stunned at least 2 s so the counter lands on any of them, and ALL PARRIED once. A
  dodge, jump or blink through the instant slips them all (LAST SECOND, each staggered); rolled clear
  before it, every blow misses. A Rogue or Mage (no guard) has the 1.3 s to see it and go.
- **POISE.** A quick blow, or a quick shot's flinch, doesn't break a rush member's wind-up. A charged
  blow or a perfect breaks the one it hits, whatever sort (a brute or ironhide too); the others still come.
- **Never from behind or off screen.** Called only by goblins within 5.5 tiles that aren't behind the
  hero; begun only once the fan's middle is in front of him. A hero with his back to the pack isn't rushed.
- **A party.** One rush on a hero at a time; a second pack's goes to someone else. The hero with most of
  the pack in front of them is picked.
- **What both views draw.** Each goblin's own red sector telegraph, as ever, plus a red line linking
  them across their feet that fills from the ends to the middle with the wind-up and flashes white with
  their telegraphs while a parry would land; a shriek and a rising note as it begins.
- Online: nothing new is sent but the goblins' `rushTo` (where it's walking) and the attack's `rush`,
  `land`, `rcx`, `rcy`, and the hero's `rushGuard`. The room's rush clocks aren't sent; a new leader
  starts them again.

**Measured** (`npx tsx scripts/encounters/rushes.ts [rooms] [swing]`: 60 job rooms from 30 days of the
board, bot heroes with a sword who can't be hurt walk at the nearest goblin that could rush, face it and
swing every 0.6 s (or 1.2 s) within 2 tiles; fighting is the seconds such a goblin is awake within 8
tiles of a hero):

| party | swing | minutes fighting | rushes | a minute | a hero a minute | goblins a rush | most at once | s between rushes on one hero (median) |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.6 s | 12.3 | 16 | 1.3 | 1.3 | 3.1 | 1 | 30.1 |
| 4 | 0.6 s | 12.4 | 52 | 4.2 | 1.0 | 3.5 | 2 | 16.8 |
| 1 | 1.2 s | 15.9 | 33 | 2.1 | 2.1 | 3.2 | 1 | 18.3 |
| 4 | 1.2 s | 15.6 | 68 | 4.4 | 1.1 | 3.4 | 3 | 8.9 |

So about one or two rushes a minute of fighting alone, about one a hero a minute in a party of four
(more goblins a pack, so rushes of 3 or 4). A slower fighter meets more: a pack that lives longer rushes
again. Many calls fizzle (a pack of two or three loses one before it gathers); that's left alone, as
small packs splatter. Tune `RUSH.first` and `RUSH.every` once Kyle has played.

**The ironhide** (`IRONHIDE` in `shared/raiders.ts`, rules `sim/ironhide.ts`, drawn by
`client/ironhidedraw.ts` and `three/goblins3d.ts`; a placeholder name for the lore pass, and it clashes
with the Warrior's and Healer's IRONHIDE perk chain key in `shared/chains.ts`, code only):
- A goblin in iron scraps, 90 health, a middling pace (0.85 of a small goblin's), one heavy, readable
  cleave (0.95 s wind-up, 16 damage, 90 degrees), blockable and parryable; only a big breaker's charged
  blow breaks the wind-up, as a brute's.
- Until its guard is broken it takes a fifth of anything (at least 1): blades, shots, spells, burns. A
  parry of its blow, a charged blow or a perfect breaks it (from the room's other damage, any hit it calls
  heavy: a burst, a crit, a hard-knocking shot), landing in full: ARMOR BROKEN, and for 3 s it takes full damage, more
  from behind as usual. Drawn whole with a cap, a breastplate and a shoulder plate and a maul; broken,
  the plates askew, the breastplate split and a gold and white crack, bright at first and pulsing.
  Plated hits throw grey sparks.
- It burns half as long (`BURN.tough`, with butchers, brutes and shields).
- Packs: two templates, `iron` (an ironhide and 3 or 4 small ones) and `ironback` (a brute with an
  ironhide at its side, ruin 1 and up), both from a job's second room. Over 60 days of the board it's in
  none of the first rooms, 12% of second rooms, 18% of third and 27% of later ones. On the Barrowfields,
  `iron` can be a camp's band and a wave's from ALARM 2.

**New player-facing lines** (for the lore keeper and the line editor; not run here, no way to call them):
ALL PARRIED (a parry that answered a whole rush), ARMOR BROKEN (an ironhide's guard broken). The name
IRONHIDE is code only for now (nothing names sorts on screen).

Tests: `tests/rush.test.ts` (the blows land in one instant, longer wind-up, all in front; one block takes
them all for one blow's stamina; one parry parries them all, each stunned into the counter window, ALL
PARRIED; a Rogue's dash and a Mage's blink escape all of it; a quick blow doesn't break a rush wind-up and
a charged one breaks only that goblin's; none from behind and every rush's middle in front over a 30 s
fight with the hero turning; two packs go after two different heroes; the same fight twice is the same),
`tests/ironhide.test.ts` (a fifth until broken, full for the window, a fifth again after; a quick blade
plated and a perfect breaking it; a parry of its blow breaking it; half the burn; from the second room on
and not in every room). Shots: `node scripts/rush-look.cjs [url] [dir]` (the rush winding up, the parry
on all of them, an ironhide whole and broken; phone and laptop, flat and 2.5D).
## 2026-11-04: layout 4: forks you can tell apart, staged scenes, the rest of the rooms, no repeats (Kyle; Claude Opus 5.5)

Kyle: "We still need more scenarios and map elements, seeds etc. I want better diversity and interesting map
types, and choices between screens, more than just high road, low road." And earlier: scenes "can be staged,
or you arrive as a scene is occurring". New jobs carry **`layout: 4`**; a saved layout-3 job plans exactly as
before (a new pin, `tests/layout3pin.test.ts`, taken before any of this), layout 2 as before.

- **Forks you can tell apart** (`shared/ways.ts`, `route4.ts`): each way out of a fork has a word over its gap,
  lit from the start, and a cue past it in both views (`client/waycues.ts`): SMOKE (smoke rolling up), CRIES
  (heard as you come near), CROWS (wheeling over), DRUMS (firelight and the drum's ripple, heard), QUIET (a few
  moths), THE FORD (water catching the light), WEBS (webs across the gap). The two ways are always two different
  kinds of room with different scenes; each road's room is one of its way's rooms with its way's scene. The fork's
  goal line says each way and what it pays. What it pays is worked out from the job and the roads taken
  (`shared/waypay.ts`), so every player is paid the same, and the recap has a WAY row:

  | Way | The room | Goblins | Pays |
  |---|---|---|---|
  | SMOKE | a house the torch-bearers are burning, someone caged inside | as usual | +15% of the job's pay for each one brought out of that room |
  | CRIES | prisoners led off for the far way out between two guards | 1 fewer | +15% for each one brought out |
  | CROWS | the column's dead, crows on them, a chest | as usual | a chest, +1 treasure |
  | DRUMS | a war band in a ring of stakes round a long fire, a drummer, a chest | 3 more | +25%, a chest, +1 treasure |
  | QUIET | goblins asleep, no chest | 3 fewer | 20% less |
  | THE FORD | a river (or a flooded drift): archers on the far bank behind hurdles | 1 fewer | +15% |
  | WEBS | two spider nests, a chest among them | 2 fewer | a chest, +1 treasure |

  HIGH and LOW are still the run's two branch names (`run.roads`), so nothing new is sent; on layout 4 they no
  longer bring the high road's ledge or the low road's cage: the way does.
- **Scenes you walk in on** (`shared/scenes4.ts`, `scenes4b.ts`; rules `sim/scenes.ts`; goblins' work
  `sim/tasks.ts`; numbers `shared/scenetune.ts` as `SCENE`). Each is mid-way when the room begins:
  - *Burning a house*: two torch-bearers (the existing sort) at a cottage's side walls (one is put up by the
    track if the room has none), someone caged inside (its door is `cottage:held`, so its inside always has
    the cage and stands). The ring at its woodpile is how far it has caught: a third when you come in, full in
    13 s more of a torch-bearer at it, and then it's alight (the house fire, the cries from inside, the goblins
    driven out, as before). Kill them or come within 2.6 tiles and they stop. Once it burns, stand still at its
    door 1.6 s (a green ring) and you pull the one inside out, alight and hurt; the roof coming in costs the
    pay as any lost to fire did. The goal line says so while someone's in there.
  - *Prisoners led off*: two or three roped together walking the room's length for the way on at 0.8 tiles a
    second, a guard in front and one behind. Only in a room you cross straight (in one side, out the other).
    Come within 2.6 of a guard or hit it and it stops to fight; with no guard driving them, they stand. Kill
    both and they're freed: bring them out like anyone freed. Reach the way out and they're gone, with their
    guards (LOST: n led off in the recap).
  - *Dragging a body*: two hauling one of the dead along to their fire, a red trail behind it; they drop it and
    turn when they see you. The body lies where they got it to (drawn from the goblin's `haul`).
  - *The patrol*: three walking a round of four points that crosses the track, as any goblin at rest sees.
  - *The hanging tree*: a big old tree, two hung by the ankles from its limb (the larder rule), blood under them,
    crows; their fire beyond. Not underground or on the bare rock.
  - *A fallen tree*: a trunk across the track, the way round its short end kept clear (checked walkable when it's
    put down), two crouched behind it.
  - *The well*: a well with its cache hauled up on the rope and left at its lip (a chest), two at it.
  - *The wrecked cart* (layout 3's) now spills its oil under it on layout 4 (a slick from the start: a fire
    trap) with two of them at it.
- **The rest of the rooms** (slice 4's list): deep wood, glade, reed bed (`sitewood4.ts`); flooded drift,
  collapse, worked-out chamber, cave (`siteunder4.ts`); stackyard, watermill, orchard (`sitefarm4.ts`);
  churchyard, barrows (`sitechurch.ts`), each with two layouts, its water (`water4.ts`) and its own light
  (`nodes4.ts NODE_LIGHT`: the deep wood at 0.6 of the wood's light and little moon, the cave at half and no
  torches, the churchyard and the barrows under a bigger moon). Woodedge, coppice, causeway and the mine head
  were already built as transitions; a layout-4 mine head has the headframe. A mill, a churchyard and a mine head
  always show their mill, church and headframe (put down beside the track, growth cleared, if the plan found no
  room by its water: `room4.ts ensure4`). The sewers under Wickhold take only
  the drift and the collapse (no caves under the town).
- **New pieces, one source for both views** (`client/pieces.ts`): the headframe, a fallen log, the mill and its
  wheel, a fence of sharpened stakes, the hanging tree, headstones, apple trees, each a list of boxes; the flat
  view paints it in three-quarter view (`piecedraw.ts`), the 2.5D view builds the same boxes (`three/pieces3d.ts`).
  The log and the stakes are wood: they smash and burn.
- **No repeats**: on a layout-4 job no two rooms on a path share a room kind (layout 3 only said not twice running),
  a layout, a landmark or a scene, and a well's cache counts as the job's well. The next day's job to the same
  place never has the same approach room for room: the route rolls again if it would (it looks at the day
  before's board, from the job's id).
- **Seeds**: all of it from the route's stream and the room's seed, as layout 3; the scenes' goblins carry their
  work (`task`) and the prisoners' rope is on the map, so a friend's game draws the same. Tests:
  `tests/variety.test.ts` (forks, pay and recap, no repeats, the next day, a cloned job, walkability of every new
  room and scene, a layout-4 pin), `tests/scenes4.test.ts` (each scene sets up; prisoners led off unless stopped;
  freed when the guards die; the house catches unless stopped; pulled out of the door; the patrol; the haul).
  Shots: `node scripts/variety-look.cjs` (targets from `npx tsx scripts/variety/find.ts`).
- **Open for the lore keeper and line editor** (not run here: this session couldn't call them): the seven words,
  their seven goal lines and "Pick a way, together", "Someone's inside the burning house. Stand at its door to
  pull them out", the recap's WAY row and its lines ("DRUMS: +25% pay, +1 treasure", "SMOKE: 1 saved, +15% pay",
  "nothing more"), "n led off". New lore to record or reject: the valley churchyard (its belfry empty like the
  rest), the barrows, the hanging tree as the hungry's larder tree, the watermill in Barrowfields.
- **Open for Kyle**: the numbers above once he's played (the pay, how far along the house is, how fast the
  prisoners walk); whether QUIET should also be a shorter way (it's a calmer room, not fewer rooms).

## 2026-11-04: the element is the Mage's spellbook; switching gets its own button; GRASP (Kyle; Claude Opus 5.5)

Kyle agreed the design: today every Mage weapon casts the same spell in every element, just tinted, and
switching element is the Mage's biggest choice. So the element becomes the spellbook: switching changes
what the tap and the hold are. The weapon decides the range (wand far, staff all round you, spellblade up
close); the element decides the spell. Numbers in `shared/spellbook.ts` (re-exported by tuning.ts), the
room's rules in `sim/spellbook.ts` (taps), `sim/holds.ts` (the hold for each kit and element),
`sim/frostholds.ts`, `sim/staffrings.ts`, `sim/rush.ts` and `sim/grasp.ts`.

| | Wand (aimed, at range) | Staff (centred on you) | Spellblade (melee) |
|---|---|---|---|
| Fire | Tap: firebolt that sets alight (0.45 of the spark, 4). Hold: fireball, bursts 1.8 round and sets all of it alight (10 to 24). | Tap: flame sweep, sets alight (0.4 of the slash, 6). Hold: ring of fire 2.2 to 2.8 round you, 0.7 deep, 4 s: anything in it scorched 6 and set alight, again when its burn is out. | Cuts set alight (0.6: 6, 6, 10). Hold: burning lunge 3.2 tiles in 0.22 s, 14 to 22 and alight to each goblin within 0.9 of the path. |
| Frost | Tap: three icicles 0.12 rad apart (0.45 each, 4), each only chills. Hold: cold blast, a cone 4 tiles by 70 degrees, 0.6 of the hold (6 to 14), a shove, frozen solid. | Tap: frost slash, chills (slows feet and wind-ups; 1.05, 16). Hold: frost nova, 2.2 to 2.8 round you, 0.6 of the hold (7 to 12), frozen solid. | Cuts chill (1.0). Hold: shatter, 2 round you: frozen 40, chilled 24, anything else 0.6 of the hold and chilled. |
| Storm | Tap: arc (1.35, 11) that jumps on to 2 more (0.7 of it, at least 6). Hold: lightning where you aim (8 at most), lands 0.55 s later in a red circle with a striped edge, 1.2 round, 1.25 of the hold (12 to 30), stuns 1 s (a butcher 0.5), jumps nowhere. | Tap: crackling sweep (1.05, 16), jumps to 1 more. Hold: charged ring 2.2 to 2.8 round, 4 s: everything inside zapped 5 every 0.5 s and flinches. | Cuts arc to the nearest goblin (1.0). Hold: lightning dash 4 tiles in 0.16 s, untouchable, 0.8 of the hold (11 to 18) and a flinch to each within 0.9. |

- **Perfects are still the hold let go on the white flash**, each one its bigger self: the fireball 2.6
  across, the cold blast 5.2 by 100 degrees, the strike 1.6 round with a 1.6 s stun (all three wand
  perfects still break off whatever a goblin is doing, striped blows too, INTERRUPTED); the staff's rings
  and nova 3.4 round, the rings lasting 6 s and the charged ring's zaps stunning 0.6 s (under the stun
  cap); the spellblade's lunge 4.4, dash 5.5 (its zaps stun 0.8 s), shatter 2.8, and every one free,
  the blade's charge kept. The wand's tap into a wind-up still breaks the blow (a bonus).
- **The staff never aims** (Kyle: "wall of fire seems hard to aim and cast"): every staff hold is centred
  where the Mage stands. The raised wall is gone (`sim/staffwall.ts`, `client/walldraw.ts` deleted).
- **The spellblade**: wreathing is gone; every cut carries the element. Its charge (0.15 a hit, full on
  a parry, CAUGHT unchanged) now pays for its holds: 35 magic times what's left to fill, and a hold spends
  the charge. A full blade casts for nothing.
- **Costs** (`SPELL`): wand 20, staff 30, spellblade 35 a hold, any element. Taps free. MAGIC as before
  (14 a second, a 2 s wait after a cast). A hold you can't pay for fizzles, NOT ENOUGH MAGIC.
- **A tap never freezes**: frost taps only chill (`elements.ts` `chill`, moved there from the wall).
  Freezing is the frost holds' job. Combos unchanged: fire on frost is steam, storm or a heavy blow
  shatters the frozen, storm on the burning flares (the strike, the charged ring and the dash all do).
  Judgment: a sweep or cut that hits a crowd jumps on only from the first goblin it lands on, or storm's
  melee taps outdid the others three to one on a pack.
- **Balance, measured** (one goblin, tapping as fast as the kit lets you for 6 s, fire's burn counted;
  `tests/spellbook.test.ts` holds each kit within 15%): wand fire 18.3, frost 20.0, storm 18.3 a second;
  staff 19.8, 18.7, 18.7; spellblade 31.2, 30.0, 30.0. On a pack of four, fire spreads and storm jumps:
  wand 50, 20, 45; staff 78, 72, 85; spellblade 119, 110, 131. The holds on a pack of four over 4 s:
  fireball 275 (everything alight), cold blast 74 and all four frozen 2.2 s, strike 153 and all stunned 1 s,
  ring of fire 174 (on those crossing it), nova 48 and all frozen, charged ring 160 and constant flinching,
  lunge 256 (alight), shatter 82 on the unfrozen (40 each on the frozen), dash 72 and a flinch each.
  Fire does the most to crowds, frost trades damage for freezing, storm trades area for the stun.
- **Switching gets its own button** (Kyle): ELEMENT, a small ring next to ATTACK where a guard would be,
  ringed in the element's colour with FIRE, FROST or STORM over it and the switch's 1 s cooldown as a
  sweep. Laptop: **X** (free; E, R, Q, G, C, F, I and M were taken). A spellblade's PARRY steps out to the
  reload spot for it on a phone. The switch, its cooldown and the primed first spell (x1.5, FIRST SPELL
  on top) are unchanged; a press inside the cooldown now waits for it rather than being lost. It's every
  Mage's from the start (the element is the spellbook), so FIRST SPELL no longer waits on the skill
  lesson. Online it's an Intent counter (`elementSeq`), so a guest switches on the leader's room.
- **GRASP** (placeholder name until the lore pass) takes the class skill slot: every goblin in a cone 5
  tiles by 70 degrees in front is towed (swept, so not through a wall) at 14 a second to a spot 1.5 tiles
  ahead, stopped a body short, and staggers 0.6 s (a big one mid a striped blow keeps swinging). A butcher
  or a shield-bearer comes 0.15 of the way (`GRASP.heavy`). 25 magic, 9 s cooldown; short of magic it
  fizzles and nothing is spent. Taught by Vell where the channel was: anyone who knew the class skill
  knows GRASP (save: `skill: 'channel'` becomes `'grasp'`; the element stays in `augments.channel`).
  The knack chain CHANNEL is called ELEMENT now; WIDE BURST widens every spell's area.
- **Seen and heard, both views**: `client/spellground.ts` draws the ring of fire, the charged ring and the
  strike's red mark from the room's own zones and bolts (flat glow layer and the 2.5D overlay), with their
  light; `client/fxspells.ts` the casts (a fan of frost, a nova ring, lightning out of the sky with forks,
  rings flaring up, a shard burst, a trail of embers or crackle, violet streaks for GRASP);
  `client/spellsound.ts` fire's whoosh and crackle, frost's hiss and chime, storm's snap and crack. The
  blade's edge burns in its element with the charge up its length (`client/blademark.ts`).
- **Words** (for the lore keeper and the line editor): the TAP / HOLD / PERFECT rows for each element of
  each kit and the COST row (`client/kitlines.ts`); a weapon card with no element shows a row per element
  ("Tap firebolt, hold fireball"); the ELEMENT legend line; GRASP's skill line; the class card's skill and
  SPELLS lines (`shared/classes.ts`); ELEMENT as the knack chain's name; WIDE BURST's text.

Tests: `tests/spellbook.test.ts` (each element's tap and hold on each kit, the perfects that go further,
the balance), `tests/magebuttons.test.ts` (the ELEMENT button, its wait and priming, GRASP's drag, the
heavy ones, the fizzle, old saves), `tests/magekit.test.ts` (costs, the staff rooted and centred, the
blade's charge paying), `elements.test.ts`, `magic.test.ts`, `skills.test.ts`, `kitwords.test.ts` updated.
## 2026-11-04: 2.5D up to FLAT: every hall's furniture, the streets' dressing (Kyle; Claude Opus 5.5)

Kyle: "The flat world is more full in some cases. Like the wizard's tower: in flat it has books and
stairs; in 2.5D it just doesn't. Let's get to parity at least." The cause was one line: every piece of
furniture in 2.5D fell through to a plain box in its two colours (`three/walls3d.ts`), whatever the flat
view painted on it. Floors, marks (rugs, chalk, rushes, soot) and what hangs on the back wall were
already the flat painting itself, so they matched; the solid pieces didn't.

**The audit** (drawn in FLAT, missing or a blank box in 2.5D before this; all built now):

- **The tower** (Vell): two bookcases (a plain brown box each), the stone stair curling up into the
  dark (a dark box), the desk of open books and jars (a box), the stand of three candles (a grey post
  with one orange flame), the coloured fire (an orange flame, no light; FLAT lights the room violet,
  green and blue), the coloured smoke off its flue outside.
- **The barracks** (Cole): the weapon racks (drawn as cordwood logs), both bunks, the map table with
  the river and the pins, the straw dummy.
- **The church** (Isolde): the altar's cloth and gilt cross, the pews' legs and backs, the cot's
  pillow and blanket, the four candle stands.
- **The Drowned Rat** (Whisper): the shelf of bottles, the bar's top and panels, the casks, the dice
  table (dice, cup, coins), Whisper's curtained booth, the benches; outside, the hanging rat sign.
- **The forge**: the anvil (face and horn), the bellows, the quench tub with its water, the sacks;
  outside, the smoke and sparks off the stack.
- **The hunters' lodge** (Maeve): the bow rack, the skinning bench with its hide and knife, the sacks.
- **The counting house**: the counter, the shelf, the sacks (the rubble was already built).
- **The town hall**: the council's long desk of ledgers and jars.
- **The infirmary**: four beds, the desk, the basin, the candles.
- **Rescue Row and the granary**: beds, benches, sacks.
- **Wickhold's streets**: the Roll of the Brave (names cut in rows, a gilt band: a blank box), the
  benches' legs, the Last Lantern's brass housing (a bare pole), the wagons' bare hoops and the one
  laden with the dead under sacking, the weapon rack by the barracks (cordwood), the town's lit windows
  after dark (always dark in 2.5D), the breach still on the worn fronts (soot up the walls, a window
  boarded, a shutter hanging, holes in the roof), the forge's smoke and the tower's coloured smoke.
- **Job rooms, every country** (village, fields, wood, fen, rock, under, side rooms and the
  Barrowfields share these): cottages in their own roof and wall colours from the house's seed (2.5D
  gave every cottage one thatch or one shingle), the lean-to, every cottage's chimney (thatched ones
  had none) and its smoke while the fire's going, a roof stove in, a den's dark mouth and the eyes in
  it (a den was a closed box), the wayside shrine (a stone post) and the fountain's basin and water.
- **Inside a cottage or barn**: the hearth's mouth, lintel, ash and hearthstone, the fire burning in
  the mouth (2.5D hung it as a wall torch above the hearth), the embers of a lit one, shelves of pots,
  the loom with its warp and cloth, beds, sacks, the cottage's inner timbered walls, a barn's stalls of
  straw (drawn as a fence), the turned-over house's smashed furniture and splinters, someone caged
  waving through the bars and calling out.
- Already matching, left alone: floors and everything painted on them, the back wall's hangs, trees,
  rocks, wells, posts, braziers and torches, tents, stalls, fences, carts, gallows and hurdles, the
  larder's hung and the cook-pot, chests, drops, the map's people and the goblins (FLAT's own sprites on
  cards), the expedition's ground marks and beacons.

**How** (drawing only; nothing in the room changes):

- **One source.** Each piece is built from the same block the flat view paints (`shared/townhalls.ts`,
  `layouts.ts`, `halls.ts`, `town.ts`) and in its colours: `LOOK` (blocks.ts), the book and jar colours
  now exported from `hallsdraw.ts` (`BOOKS`, `JARS`), the hearth's `mouth`, a cottage's
  `houseColours`, `leanW` and `chimneyOf` (cottage.ts, shared by both views now), the witchfire's
  `witchColour`, the flues' `smoke` (exterior.ts). Positions on a piece are the flat painting's pixels
  (one is 1/16 of a tile), so a desk's books or the map table's river sit where FLAT has them.
- **Files.** `three/furnish3d.ts` (house furniture: bed, shelf, counter, anvil, altar, pew, bench,
  hearth, sacks, the Roll, partition, loom, a barn's stall; smashed ones splintered),
  `three/hallfurn3d.ts` (the halls' own: bookcases, stair, dummy, map and dice tables, skinning bench,
  desk, tub, bellows, booth, bunk, casks, weapon rack), `three/witch3d.ts` (the coloured fire and its
  light), `three/smoke3d.ts` (smoke off flues on the flat layer, painted by FLAT's own `smoke`).
  `walls3d.ts` hands furniture to the two builders (the cordwood rack keeps its logs); `houses3d.ts`
  takes the cottage colours, lean-to, chimney, worn fronts, den mouths and lamplit town windows;
  `rounds3d.ts` the candle stand, the witchfire's bowl, the Lantern, the shrine and the fountain;
  `halls3d.ts` the tower's flue and the Rat's sign; `ground.ts` puts a hearth's fire in its mouth;
  `cards3d.ts` adds the caged one's wave and call.
- **Light for a phone.** Everything still merges into each block's one mesh (`Boxes`), as before, so
  a hall full of furniture costs draw calls only for its glowing bits; the coloured fire's licks are
  two instanced draws.
  Measured headless (software GL; `?perf=1` counts both hero passes; laptop / phone, before -> after):

  | scene | draw calls | triangles |
  | --- | --- | --- |
  | the tower (busiest hall) | 25 -> 27 / 25 -> 27 | 1,342 -> 4,090 / 1,342 -> 4,090 |
  | the church | 31 -> 31 / 30 -> 30 | 2,242 -> 4,606 / 2,218 -> 4,558 |
  | the Drowned Rat | 36 -> 36 / 34 -> 34 | 1,810 -> 3,670 / 1,762 -> 2,782 |
  | the square at night | 51 -> 51 / 45 -> 45 | 17,110 -> 18,166 / 16,444 -> 17,428 |
  | by the forge and the tower | 52 -> 50 / 38 -> 37 | 28,012 -> 28,612 / 24,598 -> 25,210 |
  | the barracks and the counting house (busiest street) | 41 -> 41 / 49 -> 49 | 48,856 -> 50,872 / 43,018 -> 44,902 |
  | Barrowby (a job street) | 46 -> 46 / 38 -> 38 | 16,182 -> 16,154 / 10,060 -> 9,984 |

  A full hall is a few thousand triangles more and at most two draws more (the tower's coloured fire);
  streets change by a few percent. Frame times are within the noise of the shared box.
- **Seen side by side.** `scripts/parity-look.cjs` holds the room still and flips VIEW live, so FLAT
  and 2.5D are the same moment: each hall inside, the yard, the square by night and day, three
  streets, a cottage inside, a job room in each country and the Barrowfields, phone and laptop.
- **Left as they were.** The 2.5D brazier is bigger than FLAT's; the tower's flue and the forge's
  stack stay up when you walk behind them and the roof lifts (they're part of the walls); the cage
  still holds a box figure, with FLAT's waving arm and call now on a card in front of it.
- Tests: `tests/furnish3d.test.ts` (every piece in every hall builds as itself, never the plain box;
  the tower's bookcases and nine steps; the same every time). `LOOK` moved to `client/blocklook.ts` so
  the builders load in Node without the sprite sheet. No new player-facing words.


## 2026-11-04: the Barrowfields tuned: packs and the new sorts, bigger hold rings, less gold (Kyle; Claude Opus 5.5)

Kyle played the expedition on his phone ("really really fun"): "I didn't see too many enemy types, just
big guys and little guys"; "A tonnnn of gold drop, maybe too much"; "It feels like it's hard to hold a
position if you're not the tank ... I want the area you can hold to be larger so you can be agile".

**Measured** (`npx tsx scripts/bigmap/expedtour.ts [days] [party]`, new: a hero who can't be hurt walks
each job, side job, camp and stretch of the map nearest first, then lights and holds the beacon, fighting
what's awake near them with real blows by Intent; walking is ghosted so the tour never sticks; the room
does the rest. "Sorts met": any goblin awake within 10 tiles, by its sort; "specials near": specials awake
within 10 tiles while fighting, each second):

| | minutes | kills | piles | coins on the floor (kills / chests / other) | coins a kill | coins a pile | pay | sorts met (past the small one; fewest) | specials near mean / p90 / max |
|---|---|---|---|---|---|---|---|---|---|
| alone, before (8 runs) | 6.2 | 155 | 103 | 526 (491 / 13 / 22) | 3.2 | 5.1 | 242 | 6.8 (5.1; 5) | 1.3 / 3 / 9 |
| alone, after (8 runs) | 9.6 | 183 | 30 | 308 (290 / 12 / 6) | 1.7 | 10.7 | 242 | 12.1 (9.5; 8) | 1.3 / 2 / 6 |
| four, before (3 runs) | 4.5 | 163 | 108 | 526 (509 / 5 / 11) | 3.1 | 4.9 | 250 | 7 (5.3; 5) | 1.2 / 3 / 8 |
| four, after (3 runs) | 4.3 | 196 | 33 | 319 (309 / 5 / 5) | 1.6 | 9.6 | 250 | 14.3 (11.7; 11) | 0.8 / 2 / 3 |

Before, the sorts met were archer, butcher, heavy, lunger and shield (with a drummer or the named one):
`vary` turned some of every band into lungers, shields and brutes. Gold came 93% from kills (a pile for two
goblins in three), against 242 of pay from the jobs.

- **Packs on the big map** (`shared/expedpacks.ts`, tuning `EXPED_PACKS`): each camp's band at the fire,
  each stretch's set piece and each road patrol is one pack from the templates, laid by the job rooms' own
  `lay` (now exported), on its own seeded stream after the ground is laid. What a band may be comes from its
  ground: the open fields, banks and wood's edge draw wolves and a keeper, a netter's swarm, a swarm, a brute,
  a thief's crowd; the hamlet roof archers, an oil and torch crew, a banner-bearer, a thief; the camps a
  banner-bearer, an oil crew, a butcher, the shield wall, a drum, a hexer, a brute; the north road (where the
  drove road leaves it) the log-carriers; the other roads a swarm, brute, netter, wolves or wall. One of each
  before any twice. A camp keeps its whole band (the ones past the template stay on as small ones) and its
  job's guards join its pack; a named butcher's camp takes no second big one. No blind hunters here. No pack
  is laid within 14 tiles of the way in (so none is left a special without its pack). Specials: 3 a camp, 2 a
  set piece or patrol.
- **Carrion crows** on the dead out in the open and on the dead soldier by the chained chest: a body 75%, one
  flock a stretch, three at most (`map.flocks`, built from the seed on every screen; the flock's state is
  sent near only, as any collection is).
- **Waves and hunting parties are packs** (`sim/expedwave.ts`): a template for the ALARM (`EXPED_PACKS.waves`:
  swarms, brutes and netters at first; wolves and thieves from ALARM 1; banners and oil crews from 2; sappers
  and log-carriers from 3; butchers, the wall and a drum late), its size as before (one more a friend).
  Specials: 1, 1, 2, 2, 2, 3 a wave by ALARM, and none past 3 already awake within 14 tiles of who it's
  coming for or still on their way from an earlier wave (a hold's waves come close together: before this the
  tour saw 12 specials round the shrine at once). Each wave its own pack number (from 1000).
- **A party** (`expedRoom`): `scalePacks` with 0.3 more small ones a pack a player past the first (a job
  takes 0.5; a phone hosts this map), the centrepiece 35% tougher and the template's `more` from three; a
  wave's centrepiece tougher too. Four players start with about 30 more goblins.
- **Hold rings** (`EXPED.holdR`, `extractR`: 3.4 and 4 to 6 tiles; `grace` 1.5 s): one size for drawing and
  judging (`shared/expedrings.ts ringOf`, used by `sim/exped.ts` and `client/expeddraw.ts`; the beacon's hold
  was judged half a tile wider than drawn, now not). The shrine and the beacon's hold go on 1.5 s after the
  last one steps out, then stop; they never start with nobody in the ring (tests: progress at the ring's
  edge, through a step out, stopped after the grace). The beacon stands further down the drove road so all
  its ring is on the map. A hold's waves come for anyone within 2 tiles of the ring's edge. The big rings
  have closer dots, two in three of the unlit shown, so they read at night. On a phone held upright the
  ring is a little wider than the screen.
- **Less gold** (`EXPED_COINS`, used by `dropPickups` on an expedition's room): a small goblin a pile one
  time in five, 6 to 11 (was 85%, 2 to 6); an archer a quarter, 6 to 12; a butcher half the time, 15 to 30;
  a named one as ever; wolves none. About half the coins in under a third of the piles. Chests, a burnt
  house's handful and the jobs' pay are unchanged.
- **Online**: nothing new is sent but a goblin's `pack` and `role` (once, on the first patch) and the crows,
  all near only. `npx tsx scripts/bigmap/expedmeasure.ts 10` (a party of four, now with its extra goblins;
  another agent building on the same box): together, 150: 28.7 KB/s a friend (worst 34.1), biggest 36.6 KB,
  compact save 43 KB; spread, 300: 52.1 (65.5), 43.2 KB, 80 KB in 5 parts. No message over the limit.

Tests: `tests/exped.test.ts` (packs and caps, the new sorts where they belong and none blind, a roof archer
on a roof, five or more kinds of special on every map, crows; a party's extra; waves as packs, sappers only
late, no specials past the near cap; ring sizes, one source, the beacon's ring on the map; the grace; the
coin budget against a job's table and in an expedition room; the beacon test now waits out the grace).
Shots: phone and laptop, `?hero=ROGUE&exped=4` (the shrine's ring, the wolves and keeper, a banner's camp,
an oil crew, the log-carriers, a netter, a thief's crowd, the beacon's ring). No new player-facing lines.
Open: Kyle's play on the ring size (6 could go to 7) and the gold; roof archers only where a pack lands by
a house, so not every run meets one.

## 2026-11-04: encounters as packs, and ten new sorts of the hungry (Kyle; Claude Opus 5.5)

Kyle: "Too much chaos on the screen reads messy. I'd rather have more impactful battles, but splattering
little goblins is also fun", then of the ten new enemies, "I like them all, let's make them".

**Measured first** (`npx tsx scripts/encounters/measure.ts`, 60 days of the board, 1,080 rooms, placement
as planned; "wake group" is goblins within a shout of each other, and of one pack where there are packs):

| party | goblins a room (mean/p90) | biggest wake group (mean/p90/max) | specials a room | kinds of special a room | rooms with 3+ kinds | wake group with 3+ specials |
|---|---|---|---|---|---|---|
| 1, before | 8.0 / 12 | 5.0 / 8 / 13 | 6.1 | 3.5 | 65% | 62% |
| 1, after | 9.2 / 14 | 4.1 / 5 / 13 | 2.1 | 1.7 | 22% | 4% |
| 4, before | 22.6 / 34 | 15.3 / 25 / 39 | 17.0 | 3.8 | 76% | 89% |
| 4, after | 20.6 / 32 | 10.1 / 13 / 29 | 2.6 | 2.1 | 40% | 3% |

Before, every small goblin rolled to be a lunger, shield or brute (about 78% of them deeper in), hexers and
drummers on top, butchers by rule, and a party copied the whole room again, specials and all. After:

- **Packs from templates** (`shared/encounters.ts` the table, `shared/encounter.ts` the rules, layout 3
  only; layout 2 and old jobs plan exactly as before): the set piece's bands become two or three fights a
  room, each one template: at most one centrepiece (a brute, a banner-bearer, a butcher, two shields, the
  log-carriers, an oil thrower, a wolf-keeper, roof archers), at most one kind backing it, and small ones.
  Picked by room (no butcher, banner or logs in a first room; the first fight is a swarm, a brute, a netter's
  swarm, wolves, a thief's crowd or the blind hunters), place (wolves in the open, logs where there are
  fields and lanes, roof archers where a house stands, the blind hunters only down a mine), ruin, and a cap
  on specials a room (2, 3, 3, 4 by room; one more on a deep job or at ruin 3; ledge archers count).
- **One fight at a time**: a pack's shout wakes only its own pack, and a fight in another pack is heard only
  from 2.2 tiles (`sim/packs.ts`). Spiders and an old job's goblins wake as before.
- **A party** meets half again as many small ones a player past the first in each pack, a centrepiece 35%
  tougher a player, and from three players one more special a pack (the template's `more`), never copies
  of the specials (`scalePacks`).
- **Splattering**: a swarm's small ones have 22 health (a blow or two); a small goblin killed by a blow
  slides on along it, the blow holds a beat (0.07 s, more for each more killed by the same swing), and a
  bunch cut down together sprays wider and shakes harder (`SPLAT`, `client/gore.ts bunch`).

**The ten** (numbers `shared/raiders.ts`, `shared/prowlers.ts`; rules one file each in `sim/`; hooked in by
`sim/ownfoes.ts`; drawn in `client/foekits.ts`, `foekits2.ts`, `foedraw.ts`, `beastdraw.ts`,
`telegraph2.ts`, the 2.5D view using the same figures and `three/foes3d.ts`; sounds from the kit,
`client/foesounds.ts`). Each has a telegraph we already use and a counter the player already has.

1. **Netter**: throws at whoever's furthest from a friend; a striped circle where they stood. Caught, held
   4 s; each attack, dodge or guard press takes 0.45 s off, a swing of the stick 0.15 s; a friend's GRAB
   within 1.5 tiles cuts them out at once (CUT FREE on the button). Goblins go for a netted hero first.
2. **Sapper**: digs in from 9 tiles, goes under (nothing reaches it; it's held as a carried goblin is),
   a mound and a trail of dirt, comes up 1.6 tiles behind its quarry in a striped cracking circle. A heavy
   swing over it, a blast, or fire near forces it up stunned (2.2 s).
3. **Oil thrower and torch-bearer**: a pot lobbed where you stand (striped circle) leaves a slick for 22 s;
   on it the stick takes hold at a third (wide turns, sliding on). The torch walks to a slick with someone
   on it and throws: the slick pulses 0.9 s and burns 6 s (12 a second to heroes, sets goblins alight).
   Any fire of ours lights a slick: a fire burst, an oil barrel, a fire ring, a burning goblin walking in.
4. **Banner-bearer**: a hide on a pole hung with what they've taken. Goblins within 5 tiles hit 25% harder
   and 10% sooner and can't be routed; it hangs behind and runs from a blade. Kill it and every goblin within
   7 tiles routs 4.5 s: runs, strikes nothing, takes blows 50% harder.
5. **Wolves and a wolf-keeper**: wolves the hungry keep chained and starved, so they hunt (Kyle asked for
   wolves, dogs or something else: wolves, so no dog is ever killed for a laugh and the Ranger's wolfhound
   stays the only dog). They circle to your side or back at 2.6 tiles and dart in on a short red lane
   (block, parry, dodge). Kill the keeper and they scatter 6 s; any that get 13 tiles from everyone are gone,
   and the rest come back without the circling. Open ground only (fields, farms, forest, river, marsh).
6. **Sneak-thief**: lurks a few seconds, works round behind, grabs (a short wedge: block, parry or step out):
   half your gold (12 to 30) or, carrying under 6, the front potion, and runs for the nearest edge away from
   you. Kill it and it drops what it took; let it reach the edge or 16 tiles off and it's gone with it (the
   job's pot loses the gold).
7. **Roof archer**: up on a house or barn (level 2), never moves, shoots from 9 tiles. No blade reaches
   it; arrows, spells, a thrown barrel do. Set the house alight and it's thrown down into the street, hurt
   and burning.
8. **Log-carriers**: two big goblins with a trunk, one heavy body (170 health, turning 1.1 radians a
   second). From 3 tiles they run a 9-tile striped lane, smash barrels, crates, fences and carts on it,
   knock anyone on it down 1 s, and stun themselves 2.4 s on a wall. After a run they stand 1.8 s and turn
   slowly: hit them then.
9. **Carrion crows**: a flock on the dead (layout 3 rooms in the open, 45% of rooms with the dead). Walk
   within 2.6 tiles (creeping, 1), or fight within 3.5, and they burst up: anyone within 2.2 is lost in them
   1.6 s (drawn on every screen) and every goblin within 10 tiles wakes. They settle again after 30 quiet s.
10. **Blind hunters**: pale, eyeless, down mines only (Copperdeep, the sewers). They hear anyone walking
   (not creeping) within 6.5, a fight within 13, a touch within 1.1; they go to the sound and slash; 3 s of
   quiet and they've lost you.

Tests: `tests/encounters.test.ts` (caps, one fight per pack, where each sort turns up, the first room, the
party, a pack's shout), `tests/foes1.test.ts`, `tests/foes2.test.ts`. Shots: `node scripts/foes-look.cjs`.
Open: every new player-facing word through the lore keeper and line editor (NETTED, TAP TO BREAK FREE, CUT
FREE, POTION STOLEN, N GOLD STOLEN, GOT AWAY); the expedition's camps and waves still roll their goblins
the old way (each camp is its own fight on the big map already); the new sorts don't yet ride in its waves.

## 2026-11-04: terrain nodes slices 2 to 4: ways on by any side, forks that rejoin, side ways, countries that change (Kyle; Claude Opus 5.5)

Kyle: "more nuanced map designs and combining themes", and earlier, jobs "almost always keep going up,
never moving out to the right or left". Built slices 2, 3 and 4 of `docs/terrain-nodes.md` as **layout 3**
(new jobs carry `layout: 3`; a saved `layout: 2` job plans exactly as before, a test holds its hash).

- **Ports** (`shared/ports.ts`): a room is come into and left by any side. The way out is a 0.9-deep strip at
  the edge; leaving by E means the next room is come into by W. A leg straight across from side to side is
  a wider, shorter room, 34 by 20 (Kyle's yes); the rest stay 28 by 24. The spine (`shared/frame3.ts`) runs
  from port to port: a straight leg wanders, a turn curves round its corner, a fork parts mid-room.
- **What follows the way you're going**: the side walls and the 3/4 kerb are cut where a way goes through
  them, posts either side, both views (`client/sidegaps.ts`, `three/ground.ts`); torches and a lit mat with
  the arrow pointing through the wall (`exitmark.ts`, `three/exitmat3d.ts`, the 2.5D stakes turned); fork
  labels beside a side gap; WAY ON: WEST from the room's own exit (unchanged `wayDir`); the party spreads
  down a side way in (`sim/room.ts join`); goblins and the job's spots keep off every way, not just the top
  one; ledges anywhere beside the track. The camera already follows the hero in any size of room.
- **Built-up rooms stay bottom to top** (lane, yard, strips, the village's end, the camp in a village):
  the doc's rule. Open rooms, transitions and mixed rooms take any ports (`shared/nodeports.ts PORTS`).
  Fords and causeways go straight across; a ford on a side-to-side leg has its river running down the room.
- **The route** (`shared/routeports.ts`, from `job.seed * 7919 + 101`, both roads rolled up front): on every
  path no node twice running, no sub-layout twice, one landmark and one set piece a room never repeated, two
  palette steps every room (now strict: the route rolls again if it can't), no third room running out by the
  same side, and a medium or longer job always turns (a fork always has a way on to a side).
- **Forks choose a path, and the roads meet again** (slice 3): the fork's two ways on are on different
  sides; each road is its own room (different nodes); both lead into the same next room (same node, layout,
  set piece) by different sides: the heart, or on a long job an approach room before it. HIGH and LOW keep
  their fights. `planRoom` takes the roads taken so far (`run.roads`), so the room after knows its way in.
- **Side ways** (slice 3): one or two a job, never at a fork or in the heart, on a side nobody comes or goes
  by (E, W, or down through the kerb). A side way is a block with a door at the edge, so the house
  machinery does the rest (`client/jobrooms.ts`): walk into it its way (`arena.ts pushingInto`), friends go in
  on their own, its goblins stay dead, its captives count as a house's do, you come back out where you went
  in. Its door names the dead end (`shared/sideway.ts`), planned in `shared/sideroom.ts`: a glade with its
  spring, the hungry's pens, old workings, a cave pocket; a chest and one more thing (someone caged, a nest,
  a cache of oil, a fouled shrine). The arrow points back out once the cage is open.
- **Countries in order** (slice 4, `shared/countries.ts`): out of the north gate into the fields (or in at
  the sewer door), through the place's region (the wood for Greyhollow, the rock for Copperdeep), to its own
  country; a long job may take a third (a hamlet by the road, the wood before the fen). Never back out
  into a country you left. Every change of country is a transition room (`JOINS`): the wood's edge or a
  coppice (fields to wood), the causeway or a ford spreading into fen (fields to fen), the carr (wood to fen),
  the ore road (fields to rock), the mine's head or a mine head below a hamlet (rock to under, out by the
  adit), the outfall (fields to under, out by the culvert), the village's end (village to fields). The
  transition is dressed half one, half the other, the change at a line across the way (a hedge and stile, a
  line of willows, a palisade): the choke point the fight turns on.
- **Mixed rooms** (`shared/sitemix.ts`): a farm burned out at the wood's edge, a roofless chapel with its graves
  in the fields, a goblin camp built into a village street, a mine head below a hamlet.
- **Nuance**: banks either side of a hollow way (hedged track, the ore road's cutting), a slope at the wood's
  edge, the spoil shelf, rocky rises; all stone, archers on top, the ramp at the end nearer the track
  (`shared/roomledge.ts`). Cover beside the track where the fight is: hurdles, a broken wall, spoil
  (`shared/portkit.ts cover`). Bog water close on a causeway, pools in the carr and the fen (`shared/wetland.ts`).
- **The weather carries across** (`shared/weather.ts`, layout 3): one pattern a job, each country taking it
  its way (the fen holds its fog, the trees keep off some rain); fog never more than a step thicker or
  thinner than the room before, none underground, creeping back in after.
- **Goblins path the new shapes**: `sim/pathing.ts`'s straight-line check now looks a body's half-width
  either side of the line, so a goblin no longer jams on a wall's corner it would graze (test: from every
  goblin to the way in over a spread of rooms). A last pass moves anything the job put on cut-off ground
  (`shared/roomreach.ts`).
- **Measured** (500 board jobs, 1,300 approach rooms): ways on N 842, E 433, W 425; rooms come into by a side
  406 of 1,300, hearts by a side 183 of 500; wide rooms 165; 400 forks, 366 rejoining by different sides; 542
  side ways; 426 of 500 jobs turn (the 74 that don't are short); countries crossed 1 / 2 / 3: 247 / 181 / 72;
  584 transition rooms, 202 mixed. Planning a room: about 4 ms (layout 2: under 1).
- Not yet: true loops back into an earlier room (big map), a side room with two ways back, the vignettes
  that need new behaviour, new art (headframe, headstones, a punt). Open for the lore keeper and line editor:
  the side way names (THE GLADE, THE PENS, THE OLD WORKINGS, THE CAVE, shown as ENTER ...), and "1 more in
  the houses" now also counting a side room's captive.
## 2026-11-04: the first expedition, the Barrowfields, online (Kyle; Claude Opus 5.5)

Kyle: "the much more robust big map raid sort of mode, similar to Helldivers", after the big map's load
test ("VERY fun"). Built as a posting on the board, THE BARROWFIELDS (one a day, a new map by its seed),
taken alone or with a party through the usual lobby and set-out. Try it: `?hero=WARRIOR&exped=4`.

**Online first** (the load test's limits, DECISIONS 2026-11-03):
- **Near only, each friend their own** (`client/bigsend.ts`, `client/interest.ts`, wired into
  `CoopHost.frame` for any room with `sleepFar`): every hero always; goblins, props, chests, bolts and the
  rest within 20 tiles; buildings within 26, sent by their place in the map's list (`b<i>`) and merged into
  the friend's own seed-built list (`mergeBlocks`); events within 30, but an expedition's (a horn, a job
  done) and a friend down go to everyone. One Encoder per friend, so a goblin leaving the ring is dropped.
- **Quiet clocks**: `cooldown` and `home` aren't sent, `actT` goes as `a0` (when the act began) and the
  friend works it out (`loud`). A goblin dead for good stops its clocks after `STILL` (8 s) in the sim.
- **The map is never sent**: a whole message says `ms: 1` and the friend builds `expedPlan(run.job)`.
- The run, banner, names and house counts go only when they change (the run alone was a third of every
  message). The expedition's view (`expedView`) only when it changes (progress in 5% steps, seconds whole).
- **No message over the limit, ever** (`client/split.ts`, in `RelaySocket.send`): anything over 48,000
  characters goes in parts of 22,000 (each under 64 KiB even fully escaped); the far end joins them.
- **Compact save** (`client/bigsave.ts`): the map as a mark plus the buildings that changed; each goblin and
  prop only as it differs from a fresh one; numbers to two places. Taking over or reloading rebuilds it.
- A den on a big map breeds only with a hero within 24 tiles (else the far dens would fill it).

**Measured** (`npx tsx scripts/bigmap/expedmeasure.ts 20`: a leader and three bot friends, KB a second each
friend receives as CoopHost sends it, in the relay's envelope; save every 2 s):

| party | goblins | tick mean / p95 ms | KB/s a friend (worst) | biggest msg KB | save whole KB | save compact KB (parts) |
|---|---|---|---|---|---|---|
| together | 150 | 2.2 / 6.0 | 23.9 (27.2) | 29.7 | 123.7 | 37.4 (1) |
| together | 300 | 2.2 / 5.7 | 39.1 (47.7) | 45.6 | 204.1 | 60.4 (4) |
| spread | 150 | 2.4 / 6.2 | 28.1 (36.8) | 28.9 | 132 | 44.8 (3) |
| spread | 300 | 2.9 / 5.4 | 42.4 (51.1) | 45.8 | 215.9 | 73.7 (5) |

(The bots can't be hurt, so their `safeT` ticks and is about 8% of a patch; real heroes send less.)
**The real run** (`scripts/exped-online.cjs`, now in `npm run test:online`; Kyle on a laptop, Sam on a
phone, 120 ms of lag, the local relay): Sam received 26.7 KB/s, 14.4 messages a second, biggest 33.8 KB
(the save); Kyle sent 26.4 KB/s. Sam's copy held 6 goblins of Kyle's 151; Kyle's camp's horn showed on
Sam's map across the field. Frames (headless, SwiftShader, both browsers on one 2-core box): Kyle 19 fps
(52 / 83 ms), Sam 23 fps. Alone on the same box, flat: the expedition 32 fps laptop and 26 fps phone at
CPU /4, a medium job 56 and 37; the page's own JS is 0.9 ms of room and 4.3 ms of drawing a frame on the
laptop, the rest is SwiftShader's software GPU (the light pass with up to 32 lights). Read against a real
phone before tuning further. The flat view now skips goblins and round things off screen on a big map.

**The map** (`shared/expedmap.ts` and `expedkit.ts`, `expedland.ts`, `expedcamps.ts`, `expedfill.ts`):
96 by 72, 4 by 3 nodes of 24 (each 2 by 2 of the load test's chunks), from the job's seed alone. A river
across the middle with two fords; a cart road on each bank joined by a road over each ford; the way in by
the cart road from the south or at a ford on the map's side; the way out off the top (the drove road), as
far from the way in as the map allows. Nodes: the way in, the way out, the ruined hamlet (cottages on the
road you can go into and set alight: the job-house interiors and houses alight, `settle` gives them their
fates), three or four camps, the barrows, the wood's edge along the top, fields with hedges below the
river, willows and reeds on its banks; groves anywhere. Each filler node gets one of the routed rooms' set
pieces (`shared/vignettes.ts` read as is: at the fire, at the dead, the feast, asleep, a cart looted or
wrecked, the column's dead). 150 goblins placed (`EXPED.goblins`), none within 14 tiles of the way in,
200 alive at most (`EXPED.cap`), dozing on.

**The structure** (`sim/exped.ts`, `expedpressure.ts`, `expedgoal.ts`, `expedroom.ts`; tuning `EXPED`):
- Two or three jobs of six, by the seed: poison the larder's cookpot (stand at it 7 s), wreck the siege
  engine (a wagon-bed with its arm, `look: 4`, smash or burn it), break the prisoners' cages, burn the dens,
  hold the barrow shrine (75 s in its ring, a wave every 9 s while you do), kill the named butcher. Side
  jobs: a chained cache, and a wayside shrine to pray at (3 s; the party blessed 90 s). Each job done pays
  15% of the posting into the pot, a side job 10% and a piece of treasure more; the pot is halved if you
  fail, as ever.
- Pressure: a level every 150 s (to 5); blows, deaths, buildings down and oil fire make noise where they
  happen; past enough of it, once the level's wait is up, a wave comes in from 25 to 28 tiles off (inside
  the wake ring, at least 18 from every hero, never in water or a wall); a camp whose goblins see you blows
  its horn (everyone in it comes, a wave on its heels, and it's known on the map); three patrols walk the
  roads; a hunting party comes in from the edge toward the last noise every 110 s, sooner as it goes on.
- Extraction: once the jobs are done the beacon opens; stand in its ring 2 s to light it, then hold it 60 s
  (paused while nobody's in it, a wave every 7 s), then the watch comes and the way out opens: everyone up
  walks north together. Everyone down and it fails (the party's rules; alone, three downs).
- The map screen (MAP in the corner, M on a laptop; `client/expedmapui.ts`): the ground, dark where nobody's
  been, the pins, the camps you know of (red once their horn has gone), the way in, the beacon once it's
  open, friends by name. In the world: gold rings where you stand to do a job, filling; the beacon's fire;
  a pale point at the screen's edge toward each friend off screen, with their name (both views).

Tests: `tests/exped.test.ts` (same seed same map; every map pins two or three jobs with their parts and
keeps the way in clear; walkable from the way in to every job, the beacon and the way out; every job kind
completes; pay into the pot; the beacon opens, lights, holds, pauses and lets you out; everyone down fails;
the level and the horn; waves out of sight and never past the cap), `tests/expedsend.test.ts` (near only
is exactly the ring; a goblin leaving it is dropped and its clock comes back from `a0`; buildings merge;
no message over the limit at 300 goblins and the map never goes; split and join; the compact save comes
back the same). Screens: `node scripts/bigmap/expedlook.cjs <dir> [day]` (drop-in, map, a job, a horn, the
beacon; phone and laptop, flat and 2.5D).

Words new here are in `shared/expedjob.ts` (GOAL_WORDS, EXTRACT_WORDS, EXPED_SAYS, MAP_WORDS, the posting),
waiting on the lore keeper and the line editor. Lore to check: the siege engine, the barrows and their
shrine, the beacon and the watch coming out for a party (Orla's watch).

## 2026-11-04: copy pass 3: Kyle's style everywhere, and mechanics shown as labelled rows (Kyle; Claude Opus 5.5)

Kyle: "Take my copy changes as general guidance and suggestions, not specific one-to-one approval flows.
We need to work on, in general, how we write and show things." The model is his style (prose-notes
section 4): short, the effect first, a few words, fragments when clear, no flourish or riddles, explain
once. Full list and his questions: `docs/copy-pass-3.md`; every changed row is marked in the `done`
column of `docs/copy-inventory.csv` (regenerated, same ids, 318 rows touched).

- **Showing.** One helper, `labelRows` (`client/card.ts`), draws every "LABEL  a few words" table in the
  weapon card's style: traits as `NAME: effect` and modifiers as `NAME +10%: effect` (Kyle's "STAMINA ON
  PARRY: parry refills stamina"); hungry gear GIFT / COST in red; potions EFFECT / LASTS / USE (shop and
  belt; `LASTS` now covers the Bitter's 2 s heal); skills at the trainer USE / COOLDOWN / COST (cost until
  learned; the old "TAUGHT AT LEVEL" line is gone); relics USE / CHARGE (the LOUD tag dropped, it's in the
  name); job postings WHERE / ROOMS / PAYS; job results GOLD / XP / SAVED / LOST. `.kitrows` is now one
  grid with the label column as wide as its widest label, so COOLDOWN fits on a phone.
- **Writing.** Every knack, trait, modifier, drill, technique, hungry gear line, potion, skill and relic
  line rewritten effect first. Tutorial instructions say DODGE (they said "roll" to a Ranger, Rogue and
  Mage); the FULL SHOT lesson says what a PERFECT is. Legend, tips, pack, shop, vault, pawn, forge, works,
  job board, results, council choices, the well and the title screen cut to the point.
- **Names.** WIDE LAST SECOND is LATE DASH; the KNOCK modifier is KNOCKBACK (as the knack); POWER at the
  trainer is STRENGTH (Kyle's class card word); the spellblade's "wreathe" is "enchant"; HARD THROW says
  darts, not bolts (the poisoner's hold is a dart). The larder job's title said "Burn" but the job is
  smashing racks: now "Smash the larder at X".
- **Explain once.** Tips that repeated the legend or weapon card are gone (parry timing, hold to charge,
  the crossbow glint, the Cleric's Sanctuary). Tobin's buy-back rule and the works' gear value are each
  said once.
- **Dialogue.** Voices kept; lines a first read would miss are cut or made plain (Odric's "the part it
  burns", Hob's "tallyman", the card sharp's riddle, Bram's "somebody with teeth", Pike's lamps, Vell's
  "the relic says so", the well's "coin kept, not given", the hunt notice's proof). Hew's last words name
  the tally stick, so Odric taking "Hew's tally" lands. Kyle's own class card text is untouched.
- **Consistency checked over every string:** stamina / MAGIC, "the red flashes white" for parry, "the white
  flash" only for a hold, PERFECT, "armor", no shard, sliver, crown, Want or mercy on screen.
- **Not run:** the lore-keeper and line-editor passes (no way to call them here). Ten questions for Kyle are
  at the end of `docs/copy-pass-3.md`.
- Tests: `tests/kitwords.test.ts` follows the spellblade's new HOLD row; `npm test`, `npm run check` and the
  online tests pass. Phone shots of the knack panel, item and hungry cards, the trainer, the relic step, a
  shop card and the church.

## 2026-11-04: Kyle's copy notes: the class card rebuilt, TAP / HOLD / PERFECT, GUARD and DODGE areas, two potions (Kyle; Claude Opus 5.5)

Kyle commented on 50 lines of `docs/copy-inventory.csv` (`docs/kyle-copy-notes.txt`) and passed 55
(`docs/kyle-copy-ok.txt`). His notes win over the lore keeper's earlier choices and the story bible where
they clash; the bible records each change as his call. The inventory has a new `done` column saying what
happened to each line he commented on.

- **The class card** (title screen, `client/title.ts`, `shared/classes.ts`): the name with Kyle's tagline
  under it (`CLASS_TAG`), the looks, his line on how it plays, the ratings (POWER is STRENGTH), the GUARD and
  DODGE areas for the class's first kit, his guard line, the class's own rows (the Cleric's DIVINE SAVIOR,
  "Cannot harm allies"; CENSER; HOUND; SPELLS), and SKILL in his words, with one note under it: "Train skills
  at your trainer. You can only have one active skill at a time." The pitch and the "can't" lines are gone
  from the data. Kyle had rewritten four pitches before the cut; kept here in case he wants them back:
  Warrior "When the sword fails you can always throw them against the wall.", Ranger "Forty paces is a long
  way for them to run with an arrow in them.", Rogue "They're only scary if they see you coming", Mage "The
  cleverest thing in the room, until you get a spear in the gut." The title screen now scrolls from the top
  when a card is taller than the phone (it was centred, which cut the top off).
- **What a weapon does is three rows** (Kyle: "Tap: Short sword / Hold: Draw bow / Perfect: Blinds"). One
  table, `client/kitlines.ts` `KIT`: TAP, HOLD, PERFECT, and ALSO for a bonus (riposte, the spear's charge
  pin, the spark into a wind-up, the blade's catch, RELOAD, the daggers' 2.5x from behind). It feeds the item
  card and the shop list (`card.ts` `weaponHow`, replacing the `HOW` paragraphs), the BUTTONS legend's ATTACK
  row, and the HUD hint line ("TAP: ...  HOLD: ...  PERFECT: ..."; the old NO GUARD / PARRY, NO BLOCK tags are
  gone, the card says it). The weapon rows now show on every weapon card, your own kit's too. Facts from the
  sim: every perfect is the hold let go on the white flash, the crossbow's is the glint. Judgment: the
  daggers' throw and the shortbow have no perfect of their own beyond a full-power release (plus the PERFECT
  SHOT knack and DEADEYE), so they say "Full-power throw" and "Full-power shot".
- **GUARD and DODGE as rated areas** (`client/guardarea.ts`), on the weapon card and the class card, one line
  each with pips. GUARD is LOW, MED or HIGH, from the kit's numbers: HIGH needs a guard arc of 150 degrees or
  more, a guard cost of 1.1 or less and chip of 0.2 or less (sword and shield, mace, censer); MED 120, 1.5 and
  0.3 (spear, flail); LOW anything less (greatsword, the bows, the spellblade). Then the kind: BLOCK AND PARRY,
  PARRY ONLY (Ranger, greatsword), CATCH (spellblade) or NONE. DODGE is ROLL, JUMP, DASH, BLINK or NONE from
  `dodgeOf` / `dodgeName`.
- **Armor** on its card is one thing per line, and heavy armor says stamina, not breath. Kyle said "or magic
  if it's a mage"; the bible has one bar called STAMINA for everyone, so it stays stamina.
- **Only Bitter and Brandy** (Kyle: "just have Bitter (healing) and Brandy"). Gannet sells brandy only, Ivo
  sells no flasks, goblins and chests drop only those two (`POTION_ORDER`; the drop weights for the rest are
  0). Lamp Oil, the frost flask and the smoke flask stay in the code, dormant (`DORMANT_POTIONS`), so nothing
  that could still be in a room breaks. A saved belt holding any of them gets Bitter in their place
  (`client/save.ts`). Oil barrels on jobs and setting houses alight are untouched. Lamp Oil going is to be
  confirmed with Kyle. Tips, the legend and the potion button say "drink", not "drink or throw".
- **Church and coal lines**: Gannet's line is at his bar, not the church (reworded, no "short one"); the
  bread line and the ransom line are cut; Odric's tally line drops the beer and says what the stick is;
  Isolde says what she relit and what it does, and what a fed censer does, plainly. The unused COAL help and
  note lines are gone (the class card says it).
- **Kept from the OK list**: everything, except four skill names inside the old trainer sentence (the Censer
  Chain and Light, the Fire Ring, the Storm Tether), which went with the sentence Kyle replaced.
- **Kyle's style is the model** ("see my writing style and how I'm being to the point, and let's emulate
  that"): a few words, the effect first, fragments fine when clear. Now a subsection of
  `docs/lore/prose-notes.md` section 4, quoting his lines. The new lines here were cut to match (Odric,
  Isolde, the armor rows, the legend's HEALTH line); dialogue keeps its voice but says the thing first.
- **Not run**: the lore-keeper and line-editor passes (this pass had no way to call them). Kyle's exact text
  was used where he gave it; the few lines written here (Odric, Isolde, Gannet, the TAP / HOLD / PERFECT
  words) are for them to look at.
- Tests: `tests/kitwords.test.ts` (every weapon has its three rows; the guard ratings and kinds from the
  numbers; each class's dodge; no pitch or can't; drops are only Bitter and Brandy; an old belt's oil and
  smoke come back as Bitter).

## 2026-11-04: class fixes after the new UI: no Warrior step, a crossbow RELOAD, a legend, fat fingers (Kyle; Claude Opus 5.5)

Kyle played the pixel UI ("generally much cleaner") and sent nine notes.

- **The Warrior has no step and no dodge** ("idk why it would say that. The grab should be there").
  `STEP`, `CLASS_STEP`, the `step` act, event, pose, dust, sound and icon are gone; `dodgeOf` now lives in
  `shared/weapons.ts` and is just "a dodging class's own dodge, or nothing". A Warrior's or Healer's dodge
  press does nothing (fight.test.ts). The wood's path lesson for a Warrior is back to walking out of the
  striped blow with no button (as the Healer's always was), and it is now called WALK OUT, not STEP OUT,
  so nothing says "step". On the cluster, a class with no dodge has the context slot in the dodge's
  place (`body[data-dodge='false']`); a Warrior's always shows GRAB, dimmed till there's something to
  take hold of. A Healer's shows only when there's something (to help up, burn or grab), in the same place.
- **NOTHING TO GRAB.** A GRAB press that lapses unused while you're free (nothing to take hold of, throw,
  help up or burn) makes the room say `nograb` to that hero, at most once a second (`toldAt`, shared with
  the other "can't do that" notes). Only that hero's client shows it, over them, with a soft dull knock
  (`client/owncues.ts`).
- **The crossbow's reload is its own button** ("if you try holding down attack without it reloaded it
  asks you to reload"). A new intent field, `reload` held and `reloadSeq` counted (optional, so an older
  guest's intent still reads; works online through the same intent). `sim/crossbow.ts`: RELOAD held while
  empty and standing still winds, in pieces as before (let go or push the stick and the piece ends with
  the wind kept); an unbroken full reload from nothing glints, as before; wound, you're free at once.
  ATTACK held on an empty crossbow winds nothing: the press is spent and the room says `reloadcue` (once
  a second) so the RELOAD button pulses gold and RELOAD is said over you, with a dry click. A tap of
  ATTACK is still the short sword. Phone: a round RELOAD button (gilt while empty, the dark sweep showing
  what's still to wind), only with a crossbow. Laptop: **C** (free: E, R, G, Q, F, J, K, I and Tab are
  taken), on the prompt line while empty, in the kit line, a tip and the weapon card.
- **BUTTONS** in the gear's box opens a framed panel of this hero's buttons, each drawn by the cluster's
  own code (`btnart.ts` with `icons.ts`, `skillicons.ts`, the item and relic icons), its name, a plain
  line, and on a laptop its key: attack, the guard (block, parry or catch), the dodge, RELOAD, the skill,
  the relic, the health orb, and every context word (GRAB, HELP UP, BURN, OPEN, TALK, ENTER, USE).
  `client/legend.ts`.
- **The wood flashes what it gives you.** The first time a lesson gives a move, its button pulses gold
  for 4 s with its name over it (`client/unlockflash.ts`); a laptop says the move and its key over you.
- **Fat fingers.** Every cluster button's hit area is now round (`border-radius` on the invisible button,
  so the art stays square-pixelled), at least 52px (ATTACK 92), and at least 10px from any other on a
  390x844 phone, measured by `scripts/ui-look.cjs`. Respaced round ATTACK; the cluster still stays under
  about 260px. The lesson pointer and the new pulses draw their gold square on a child, since the round
  hit area would round an outline.
- **Hearts under the health bar** ("It's NOT clear what the 3 hearts mean"). The get-ups left (alone, a
  heart each; in a party, your one get-up) moved from the tracker into the unit frame, just under the HP
  bar, as small heart icons; a tap or a hover says "Times you can get back up this job".
- **An objective done flashes gold** (`client/objflash.ts`). When a wood lesson is passed or a job's way
  on opens, the tracker holds the objective it had, counted out ("3 / 3", "(1 left)" dropped), flashes it,
  turns it gold with a shine sweeping across, keeps it 1.8 s, then the next one shows. A small rising chime.
- **Sounds** (`client/sfxtown.ts`, procedural from the kit's `tone` and `burst`): coins whenever gold
  changes hands off a job (`client/purse.ts` listens to the purse, so every stall, the pawn stall, the
  vault, the church's recharge and the job's pay are all heard); a hammer on the anvil when Halvard
  makes, ups or melts a piece (his own buttons in `stores.ts`); the chime; the dull knock; the empty click.

New or changed player-facing lines, for the lore keeper and the line editor: the lesson name WALK OUT and
its freeze NOW: WALK OUT, the goal MOVE BEFORE IT LANDS; NOTHING TO GRAB; RELOAD; C  RELOAD; the crossbow's
kit and card lines and the laptop tip; "Times you can get back up this job"; the unlock labels; every
BUTTONS line (`legend.ts`).

Tests: `tests/warrior.test.ts` (no dodge on any Warrior kit; NOTHING TO GRAB once a second, and not when
the press took hold), `tests/fight.test.ts` (a Warrior or a Healer presses dodge and nothing happens),
`tests/rangerkit.test.ts` (ATTACK held empty winds nothing and cues RELOAD, a tap is still the sword;
RELOAD winds in pieces and keeps the wind; the stick ends a piece; RELOAD on a loaded crossbow does
nothing; a full reload in one go glints). 619 pass; `npm run test:online` passes.

## 2026-11-04: every perfect on your own timing, and a stun cap per hero (Kyle; Claude Opus 5.5)

Kyle, after playing: "it's hard to time a perfect against an enemy attack or an ally about to get hit",
and he wants "a cap on how often each can be stunned per attacker". So every kit's perfect is now its
own hold let go on the white flash (the Cleric's already was), and whatever was timed against a goblin's
blow stays only as a bonus, with its own callout and no PERFECT.

- **One rule, one place.** `sim/hero.ts` now makes any held attack let go inside the flash window a
  perfect (every kit's hold has one), and that release is the only place PERFECT is said, so every
  weapon shows it the same way. The crossbow keeps its glint, set just after. The four bonus events
  (riposte, the spear's catch, a spark into a wind-up, the blade's catch) no longer say PERFECT; they keep
  RIPOSTE, PINNED, INTERRUPTED and CAUGHT.
- **Sword and shield** (`SHIELD_BASH`): on the flash the bash takes every goblin in a 140 degree arc in front
  (`flashBash`, no one-goblin cap) and stuns each 1 s (a butcher half). Held past it, the goblin in front
  only, 0.4 to 0.7 s by charge (was 0.6 to 1.2, which outdid the perfect). Riposte unchanged, a bonus.
- **Spear** (`PIN`): the lunge on the flash pins whatever it runs through (up to three) 1 s, anything but a
  nest. A goblin caught charging or lunging is still pinned, now 1.6 s, as a bonus.
- **Wand**: the burst on the flash breaks off whatever a goblin it hits is doing (`Bolt.breaks`), striped
  blows and charges too, a 0.6 s stagger. A spark landing mid wind-up still does it, as a bonus.
- **Spellblade**: the wreathe on the flash costs nothing and leaves the blade full (so the next is free
  too), with the blade-full ring. The catch on block stays, as a bonus.
- **Checked, already flash-based**: rapier, poisoner (Rogue), greatsword (Warrior), longbow, shortbow
  (Ranger), staff (Mage), every Cleric kit. The crossbow's is the glint, as before. Daggers' thrown knife
  was already a drawn shot.
- **The stun cap** (`shared/stuncap.ts` STUN_CAP, `sim/stuns.ts`): one hero can take the same goblin's turn
  once every 6 s. Inside that the blow lands its damage, but the goblin isn't stopped and says SHRUGS IT
  OFF (grey, quiet, once a second at most). Another hero can stop it at once, so a party chains stuns.
  Every site goes through `stun()` or `mayStun()` with the attacker's id. **In:** daze (shield bash,
  Shadowstep, the poisoner's retch, the flail's flash), the shockwave, both spear pins, the skewer's
  stagger, the wand's interrupt, smites and relic bombs, a stunning bolt, the longbow's blind, the snare
  and the net and the hound's pin (small goblins; a big one only slowed is not capped), the javelin's
  wall pin (shrugged, it drops off), the hook's yank, the slam, the ambush reel, the ward's reflect, the
  shield charge, the stamp, the censer chain and lantern light, the Vanish cough, the war cry's scare,
  the bell, the knuckle, steam (credited to who set it off) and a fall off a ledge (to who knocked it).
  **Out**, by judgment: the plain hit flinch any blow gives a small goblin (0.3 s, and the big weapons'
  wind-up break), body blows, the hound's nip, the volley's 0.2 s ticks, carrying and throwing, a freeze
  (built over two hits, maybe by two heroes), and a parry's or a slip's stun: those answer the goblin's
  own blow, so a goblin that stops swinging is never held by them. The retch keeps its own 10 s cap too.
- Tests: `tests/warrior.test.ts`, `tests/magekit.test.ts` (each new perfect on the flash, each old one a
  bonus without PERFECT, held past the flash does neither), `tests/stuncap.test.ts` (shrugged inside 6 s,
  another hero at once, the same hero after; in the room, a second flash bash still hurts but doesn't
  stun, and a friend's does).
- Words for the lore keeper and the line editor: SHRUGS IT OFF; the sword, spear, wand and spellblade
  cards; their four KIT hints.

## 2026-11-04: the Cleric's weapons rework: mercy, the holy shield, the smite's light, coals, the spun flail (Kyle; Claude Opus 5.5)

The last class through Kyle's weapons rework, which is now complete. The Cleric guards and never dodges
(CLASS_DODGES unchanged). Numbers in `shared/cleric.ts` and the kits (`shared/weapons.ts`, `kits.ts`),
the rules in `sim/mercy.ts`, `sim/holy.ts`, `sim/censer.ts` and `sim/flail.ts`, all judged in the room
and kept on the heroes and the room's coal list, so guests get every bit of it.

- **Mercy, the class perk** (Kyle: "like rogue backstab"). Nothing credited to a Cleric hurts, knocks
  back or sets alight another hero or anyone freed. Gated by the id the harm is credited to
  (`merciful(heroes, by)`): swings on friends (`sweepAllies`) and the freed (`sweepSurvivors`); shots,
  which now pass by friends and the freed; blasts on both; goblins and props a Cleric flung into the
  freed; a Cleric's burning goblins spreading fire to the freed; javelins; the smite already spared
  friends. Censer coals only ever touch goblins. Relics already spared everyone. On the class card
  (title screen, under the ratings) as MERCY. Not gated: a house set alight burns whoever is inside,
  whoever lit it (it's the house, not the Cleric).
- **Every Cleric perfect is your own timing** (Kyle changed it mid-build: timed against a blow or an ally
  being hit was too hard): let a held attack go on the white flash, as with the bows and the rapier, and
  it shields friends. **The holy shield** (`HOLY_SHIELD`): soaks 20 damage, lasts 5 s, the Cleric's own
  included; a fresh one tops an old one up and never stacks. A blow it soaks whole doesn't stagger. Drawn
  on the hero as a gold shell of light with a halo (`client/holyshield.ts`, so both views), and it rings
  as it takes a blow and breaks. The white of a Cleric's charge now goes when the window does.
- **Mace and censer.** Quick: heavy blows kept, the third heals everyone near (8), but the reach is
  short now (1.2, 1.2, 1.35; the sword's is 1.45): the weakness. Hold (kept, Kyle asked after it): the
  smite on the goblin you face (range 6, stuns 1.2 s, 24 to 70), and its light mends every friend in the
  burst 10 (as every heal, grown by the censer's coals). On the flash: 1.5x, and every friend in the light
  and the Cleric are shielded, with a pillar of light where it falls.
- **Sword and censer.** The third blow (the censer's arc) drops three coals along the arc at 0.8 of its
  reach; each burns 6 s and sets alight a goblin standing in it (0.5 tiles); six a Cleric at most, the
  oldest goes out. They live in the room's coal list beside the butchers' slivers (drawn, lit and sent the
  same way), carrying their owner, and no censer feeds on them. Swinging the censer (the arc or the
  whirl) through your own coals, at least 0.4 s old, bursts them: friends within 1.8 of one mend 6, once
  a swing. Hold: the whirl all round, setting alight everything it hits (kept). On the flash: every coal
  of yours within 5 tiles flares (14 and alight, 1.3 round it) and friends near you (3) are shielded.
  Weakness, clumsy in tight spaces: a wall or pillar within the swing snags the chain (SNAGGED): half
  damage, no coals, no burst, a 0.18 s jar.
- **Flail.** Quick: the two slow sweeps (16, 20; the second heals 9) shove a goblin back a little (knock
  5.5, 6.5, so neither counts as heavy), and `overShield` is gone: a shield-bearer's board takes the
  blow as it takes any, and stops the shove. Hold, rooted (no walking at all once the spin begins): the
  flail spun overhead; let go for a long sweep (reach 2.6 against 1.85, arc 240, 22 to 54) that doesn't
  carry you. On the flash: what it hits is stunned 1 s (a butcher 0.5 s; a goblin mid striped blow or
  charge can't be dazed) and friends near you are shielded. Still a breaker: a strong spun blow (70%
  charge) knocks a goblin out of a heavy wind-up; the old held smite never could, being a shot.
- **Seen and heard** (`client/fxcleric.ts`, sounds from the kit): PERFECT as ever, plus the smite's pillar
  of light, coals bursting gold or flaring red-gold, steel sparks on a snag, a ring of stars on the
  flail's stun. Shield: the ward's sounds; snag: a wall knock and a block.
- Tests: `tests/cleric.test.ts` (no friendly fire on every path, the mace's reach, heals and smite, the
  shield soaking and wearing off, the coals, the whirl, the burst, the flare, the snag, the flail's
  rooted spin and reach, the shove and the board, the stun and the breaker); `tests/kits.test.ts` updated
  for the flail.
- Words for the lore keeper and the line editor: the class card's MERCY line, the three weapon cards,
  the three KIT hints, and SNAGGED.
## 2026-11-04: terrain nodes slice 1 and 1b: approach rooms that change, a heart that stays, the broken bridge, goblins that path, weather (Kyle; Claude Opus 5.5)

Kyle: rooms of a job felt like "the same map each time ... 3 maps in 1 quest where it was the SAME map
with a river through the middle". Built slices 1 and 1b of `docs/terrain-nodes.md` with his answers.

- **Reverses 2026-11-01's "the same place is the same every time"** for every room but the last. A job
  now has a route (`shared/route.ts`, from `new Rng(seed * 7919 + 101)`): the **approach** rooms, then the
  **heart** (the place's own room). Approach rooms are new spine-aware nodes (`shared/nodes.ts`): track,
  crossroads, lane, clearing, ford, strips, yard, wood path, each with two or three sub-layouts, dressed
  for the country they're in (fields, wood, fen, rock, under: `shared/siteskin.ts`).
- **The heart** (Kyle: "the theme as well as the central room"): its plan, landmarks and theme come from
  the place's own seed, so the green still has its well and shrine where they always are. It has three
  sub-layouts (a second `dress` stream moves cottages, carts, hay, shacks, reeds), its set piece moves
  job to job, and you come into it from wherever the room before let out (left, middle or right along
  the bottom, a short bend over to its lane). Landmarks are guarded: the job's cages, dens, fires and
  ledges go round them (a test holds them still over objectives, roads and seeds).
- **Rules** (`tests/route.test.ts` over a thousand-odd jobs): no node twice running and no sub-layout
  twice in a job; one landmark a room, never repeated, never the place's signature (Barrowby's well and
  shrine, Hangman's gallows, Hesketh's hall front and so on are the heart's alone); two of floor, back
  wall, ground and light change every room; one set piece a room, never repeated; the way out moves
  along the top (x 7, 14 or 21), never where the last room's was, and the next room starts below it.
- **Set pieces** from behaviour that exists (`shared/vignettes.ts`): at the fire, at the dead, the
  feast (a long fire, the pot, the bones), asleep round a cold fire, looting a cart, the wrecked cart and
  its oil, the column's dead along the road, and the broken bridge (their fire on the far bank).
- **The river room** (Kyle: "make it clear the bridge in the centre is destroyed and the only crossable
  path is through the shallows"): `shared/river.ts`. The bridge's two ends stand out over the water
  (walkable, so you can go and look at the gap), its middle is deep water, snapped boards, posts, a rope
  hanging off the far end, a beam in the river, boards caught downstream, drawn flat
  (`client/bridgepaint.ts`) and stood up in 2.5D (`client/three/bridge3d.ts`). One ford, the only way
  over: paler shallows, stepping stones in a line, white water at its lips, a worn track down to it
  (`client/waterpaint.ts`; water is now painted over the ground's paths so a path stops at the bank).
  Brokenbridge's own heart gets the same bridge and one ford. Judgment call: "up top" read as the ford off
  to one side of the bridge (left or right by the seed), since the river runs across the room.
- **Pathing** (Kyle: "enemies got stuck with the water"): `sim/pathing.ts`. A goblin with a clear line
  walks straight, as before; a blocked one follows a flow field (Dijkstra on a half-tile grid of the room:
  solids, deep water and ledge faces blocked, wading costs 1.8 a step), string-pulled to the farthest
  point it can walk to straight. A field is a pure function of the room and the goal's cell, kept for a
  dozen cells, so it's deterministic and costs one small search when a hero steps into a new cell. All
  rooms, old jobs too. Tuning `PATH` in `shared/tuning.ts`.
- **Weather** (Kyle's answer 3; no light drift, per answer 2): `shared/weather.ts`. One pattern a job from
  its seed and country: drizzle, a storm that builds, breaks over one room with lightning and passes, fog
  that creeps in by no more than 0.18 a room, or clear; none underground. Paint only (on the theme),
  drawn with the mist in both views (`client/weather.ts`).
- **Seeds and old saves**: new jobs carry `layout: 2`; a room is planned from `roomSeed(job, index,
  took)`. A saved job without it plans exactly as before: a test hashes 100-odd old rooms against the
  value taken before this change. For routed rooms only, the back of the pack is rolled after spiders so a
  room never opens with too few blades (spiders thinning the band could break that; old rooms kept as
  they were).
- **Measured** (the doc's script, Jaccard of solid tiles): the same room on another visit 0.87 to 0.98,
  now 0.03 to 0.05; the next room of a job 0.00 to 0.82 (0.46 average), now 0.03 to 0.05; the heart on
  another visit 0.90, now 0.63 (landmarks kept, the rest moves). Ways out: 540 of 690 at the top middle,
  now 149 left, 248 middle, 143 right, 150 forks. Barrowby's well in 96% of its rooms, now 20% (the heart).
- Not yet (slice 2 on): side exits and turning routes, wider rooms for left-to-right legs (Kyle's yes),
  side rooms, transition nodes, the vignettes that need new behaviour (torch-bearers, dragging,
  prisoners led off, the patrol). No new player-facing lines were written.

## 2026-11-04: the Mage's weapons rework: magic costs, the wand on the move, the staff's walls, the spellblade (Kyle; Claude Opus 5.5)

The fourth class through Kyle's weapons rework. The Mage has no guard and blinks rather than rolls; its
big spells now cost magic (the stamina bar). Numbers in `shared/mage.ts` and `shared/weapons.ts`, the
rules in `sim/spells.ts`, `sim/staffwall.ts` and `sim/spellblade.ts`, all judged in the room.

- **Magic** (`SPELL`): the wand's held burst 20, the staff's wall 30, the spellblade's wreathing 35 (less
  the blade's charge: a full blade wreathes for nothing), the blink as before (40 x 1.5 = 60). Quick
  attacks are free. A hold you can't pay for (short of it, or winded) fizzles the moment it would begin:
  nothing is spent, NOT ENOUGH MAGIC in grey smoke and a dull knock. Paid at the release: the bar dips and
  "-30" rises off the hero in violet. The bar carries a violet mark at the held spell's cost for a Mage
  kit, red while you're short of it (`client/main.ts`, `style.css`). Judgment call: the refusal is at the
  start of the hold (a clear "no" at once), checked again at the release.
- **Wand** (Kyle loves it): unchanged numbers (spark 8, burst 10 to 24, 0.6 s), but the quick spark is
  cast walking at 0.9 of your pace (`castWalk`), turning to the aim while it comes up. Its perfect, new: a
  spark (or burst) that lands on a goblin mid wind-up breaks the blow off and staggers it 0.6 s (a butcher
  0.3 s), any blow, striped ones too, PERFECT and INTERRUPTED with a violet star. The white-flash release
  on the held burst is kept as it was.
- **Staff**, reworked. Quick: a slow close slash in your element (15, reach 1.9, arc 150, 0.3 s wind-up,
  0.42 s recover): fire sets alight, frost chills, storm jumps on to one more. Hold (1 s draw), rooted (no
  walking at all while it gathers, nor through the cast): a wall 1.7 tiles ahead across where you face,
  2.4 to 3.6 tiles long by the hold, 0.5 deep, 5 s. Fire: what's in it scorched 5 and set burning every
  0.5 s. Frost: chills (slows) what touches it, and its face is solid to anything no heavier than a scrapper
  (a butcher walks through, chilled). Storm: shocks what's in it for 9 every 0.5 s, a flinch. Perfect (let
  go on the white flash): the big wall, 5.6 long, 0.8 deep, 7 s, taller, with a ring at each end. Walls
  live in the room's zones beside the fire ring (so guests get them), drawn in both views (`client/walldraw.ts`).
- **Spellblade** replaces the lance rod (new id `spellblade`; a saved rod anywhere becomes one, its quality
  and level kept: `shared/oldkits.ts`). Name SPELLBLADE pending the lore keeper. Quick: three plain cuts
  (10, 10, 16); each hit that lands adds 0.15 charge, the edge glowing violet up its length, white when
  full. Hold (0.5 s): pay to wreathe the blade in your element; the release is a cut of its own (14 to 22,
  arc 150) and the first of four wreathed swings (6 s at most): fire burns, frost slows, storm jumps to the
  nearest other goblin within 3 for 60%. The last throws a wave 2.2 tiles ahead across 100 degrees, 14 and
  a shove, in the element. Perfect: block pressed within 0.22 s of a blow landing catches it on the blade:
  nothing taken, no stun on the goblin, the blade full (CAUGHT). Weakness: no range, it eats magic, and a
  Mage with no guard stands in among them. On a phone the block button shows CATCH for it.
- **The Jealous Rod** (hungry) is a wand now: its gift rides a charged spell and the spellblade has none.
  Old saves holding it keep it as a wand. Its name is unchanged (lore keeper).
- **Seen** (`client/fxmage.ts`, one overlay, so both views; `client/blademark.ts` over the hero in both):
  the costs, the fizzle, INTERRUPTED, a slash's arc of its element, a wall going up along its length, the
  blade wreathed (the edge burning in the element, a pip a swing left), the charge ring, CAUGHT, the wave.
  The spellblade has its own look flat and 3D, its icon, and its swing and block sounds (a sword's).
- **Sounds** from the kit: magic spent and a full blade the channel's hum, a fizzle the wall knock, an
  interrupt the perfect chime and a shock, a catch the parry and the chime, a slash, wreathing or wave the
  element's (ignite, chill, shock), a wall going up its element's (flare, freeze, shock), the big one a rumble.
- **Online**: the charge, the wreathing (`bladeCharge`, `wreathe`, `wreatheUntil`, `wreatheEl`) live on the
  hero and the walls in the zones, so guests get them in the snapshot.
- New lines for the lore keeper and line editor: NOT ENOUGH MAGIC, INTERRUPTED, CAUGHT, CATCH (the
  button), SPELLBLADE, the three card lines (`client/card.ts`), the three kit lines and the tip line
  (`client/main.ts`). The class blurb (`shared/classes.ts`) still only names the wand, as it did.

Tests: `tests/magekit.test.ts` (the wand cast walking at near full pace, its interrupt; the burst's cost
and a fizzle that spends nothing; the staff's slash arc in front, not behind or far, in fire; the wall
raised ahead and the hero rooted; the big wall on the flash; fire burns and storm shocks in a wall, frost
holds a scrapper back while a butcher walks through chilled; the spellblade's charge per hit, the
wreathing's cost, its fire, the wave off the last swing, frost slowing and storm jumping, a full blade
free, the catch; the rod save migration and the Jealous Rod to a wand). The old staff-orb and rod-lance
tests went with those spells; `pacing.test.ts` rolls the new kit.
## 2026-11-04: a friend's pack, the wood walled in with scenes past it, and Hew's death made quick (Kyle; Claude Opus 5.5)

- **A friend's pack crashed.** Kyle: "I wasn't able to open inventory; the game would crash when I was
  not hosting." The leader's patches (`client/snap.ts`) left `found` (the relics a hero owns) off every
  hero, so on a friend's screen `hero.found` was undefined and the pack threw reading it the moment it
  drew its relic shelf (`TypeError ... reading 'filter'`), every frame, taking the HUD with it. `found`
  now goes in the patches: the friend's pack lists the same relics, in the same order, that the leader's
  room carries by index, and a charge spent or a relic won on a job now reaches the friend's save
  (keepkit.ts already read `h.found`). The pack also reads any list a patch hasn't brought yet as empty.
  Stress scenario 27 (`scripts/stress/pack.cjs`): the pack in town, then as a guest on a job: a ring on,
  armor swapped, a piece dropped, the belt reordered, two relics carried, all holding on the leader's
  room, the friend's screen and the friend's save; then inside a house (a ring off), and the leader's
  pack in town and indoors. No page errors.
- **The wood is walled in.** Kyle: "too easy to go through trees and get lost off the path." The old
  tree lines followed each clearing's edge and left gaps where two edges met; a flood fill walked out
  into 2300 half-tiles of open wood. Now `shared/woodedge.ts` puts a tree on every tile outside the
  clearings and the ways between that touches one (r 0.6, a tile apart: no gap a body fits through,
  corner to corner included), a second row behind, and the wood thinning out to the map's edge.
  `tests/woodedge.test.ts` flood-fills it: nothing reachable outside the clearings and gates, every
  clearing and the road still reachable, every scene over 2.4 tiles from anywhere you can stand. A worn
  earth path runs gate to gate (`WOOD_PATH`). 596 trees (was about 330).
- **Scenes past the trees** (Kyle: "background goblins fighting or killing things that you can't
  reach"): `shared/woodscenes.ts` says where; `client/vignettes.ts`, `vigshots.ts`, `vigkit.ts` and
  `beasts.ts` play and draw them. Two goblins at each other with knives over a dead ox from the baggage
  train while a third eats (north of the field); two dragging one of the dead off by the arms into the
  trees, a blood trail behind (north of the field); their fire with a carcass turning on the spit, the
  boots they took off the dead in a heap, one asleep (by Hew's clearing); a deer run down and speared
  (south of the stream); the last soldier of the column on his feet with three round him: he cuts one
  down, is stabbed in the side and from behind, kneels, falls, and they're at him (south of the stream).
  The squabble and the fire loop; the rest play once when you first come near and stay as they ended.
  Paint only: never in the room, so nothing can hit, shoot, pin or be hurt by them; drawn by the same
  code as the real goblins, in both views, on the room's clock (held when the world is held). The edge
  in front of each is brambles and rocks you can see over; the wood round each is left open.
- **Hew's death** (Kyle: "have the big monster grab Hew and he starts screaming and dies... his head
  exploded and is thrown against a wall and slides down it, then the monster bellows and attacks you").
  `sim/woodcut.ts` (out of `sim/wood.ts`): grabbed; his last shout (kept: "Get the count to Odric",
  which the tally stick hangs on); a scream; the last cut off; the head burst (the bite's gore, kept);
  thrown into his hut's front wall and down it, a smear left on the wall (`Npc.smear`); the Stoker
  bellows, no words, and comes at once (cooldown 0.4). The Stoker's line is gone from the game. Grab to
  attack is under five seconds.
- **The road out is short** (Kyle: "don't make them walk a huge way away to get to the town"):
  `ROAD_OUT` is now just west of the hut's gate (x 37 to 40), not the far end of the road.
- New player-facing line for the lore keeper and line editor: Hew's scream `LINES.screams[0]`.
## 2026-11-04: the UI redo, steps 1 to 3: one material on the pixel grid, a touch cluster, a unit frame (Kyle; Claude Opus 5.5)

Kyle: the UI reads as "AI slop"; emulate Diablo and Path of Exile, mobile first. Built the first three
steps of `docs/ui-research.md` as one slice. Drawing only: nothing in `src/sim/` or `src/shared/` changed.

- **Two bundled pixel faces, no system monospace.** Display: Jacquard 12 (a pixel blackletter) for panel
  titles, place names and name plates, in title case (a blackletter in capitals can't be read; panel
  titles are title-cased in `panels.ts`, and the three places that matched a title's text now match it
  without regard to case). Body: Tiny5, chosen over Pixelify Sans after looking at both: Pixelify's 5
  reads as S and its C as O at UI sizes, Tiny5's don't. Tiny5 is 8 pixels to the em, so it is used only
  at sizes that land on whole device pixels: 8px, 16px, and a text size of 12px (2x screens) or
  13.33px (3x phones), as tokens (`--fs-s`, `--fs-text`, `--fs`); every older size was mapped onto them.
  No faked bold (`font-synthesis: none`). Both OFL 1.1, copied from npm's `@fontsource` packages into
  `src/client/fonts/` with their licences; credits in `docs/CREDITS.md`. Alagard isn't on npm.
- **Colour tokens** on `:root` (`ui.css`): stone greys, bone, parchment and ink, the way-on gold, blood,
  the goblin green, up and down. The purple-black neutrals and pastel accents across every stylesheet
  were mapped onto the stone ladder (light blue info text to a cool steel grey, mint to the up green,
  salmon to a muted red).
- **Frames drawn in code** (`frames.ts`): stone, iron, gilt, parchment, plus pressed iron and gilt, a sunk
  socket and a dull one, each a tiny 9-slice set on `:root` and shown with `border-image` at `--px` (2 CSS
  pixels, a world pixel on a phone). No radii, no blurred glows anywhere in the UI.
- **One button** (`ui.css`): iron; pressed, it sinks a pixel and its bevel turns over; gilt for the
  primary; dull stone when it can't be used. The eight redefinitions lost their own fills, borders and
  radii; a toggle that is on shows pushed in, not gold, so gold stays rare.
- **The touch cluster** (`cluster.ts`, drawn by `btnart.ts`, placed by `cluster.css`): ATTACK bottom right
  with the held weapon's icon and stamina as ten pips round its top left; a ring of about 100px (the dodge
  low left as a diamond, the guard as a heater shield or, for a parry, a buckler, the skill and the relic
  round); an outer ring for the flask as the health orb (red liquid to your health, green when poisoned,
  pulsing below 30%, the next potion in front, the count on it) and the one gilt context slot (GRAB,
  THROW, HELP UP, BURN, OPEN, with its word under it). Cooldowns are a dark sweep in 16 steps with the
  seconds in the pixel face, and a one-frame white rim when ready. Every class skill has an icon
  (`skillicons.ts`); found relics keep theirs. The input wiring is untouched: the same buttons, classes
  and presses. The stick is a stone ring with an iron knob and a notch where walking turns to creeping;
  its resting ghost goes after three moves.
- **Never over the hero.** The cluster stays below about 300px. On an upright screen both cameras may now
  run past a room's foot, and a room shorter than the screen follows the hero instead of sitting centred
  (`scene.ts`, `three/camera3d.ts`), so your own hero is framed above the buttons. Other heroes can still
  walk under them.
- **The top HUD** (`unitframe.ts`, `hud.css`): your hero's own sprite as the face in an iron socket, the
  level on its corner, a health bar 10 CSS pixels tall with a pale trail that holds the lost chunk for
  0.4 s, a laptop's stamina bar under it, and status marks (poisoned, blessed, warded, mending, brandy,
  smoke, tempo, the church's light). The weapon and kit lines left the always-on HUD: a tap on the face
  shows them; a laptop keeps its skill, relic and belt lines (it has no cluster yet). The corner is CHAT,
  PACK and the gear as icons in one iron group; LEAVE moved into the gear's box on a job, away from the
  pack (it was being clipped). The tracker is one framed box: the place in blackletter with a diamond a
  room (the one you're in gilt), the objective, a coin with the gold, drawn hearts. A low-health edge of
  hard red bands steps in and out.
- Also, since they were in the way: the job board's jobs are parchment notices; the pack's empty places
  are sunk sockets, not dashed boxes; the wood's words and lesson cards are in stone with a gilt button.
- `node scripts/ui-look.cjs [url] [out] [only]` shoots town, a hurt fight with a skill cooling, each
  class, the pack, the board, a talk, the start screen and the gear box, phone and laptop, flat and 2.5D.

## 2026-11-03: the Ranger's weapons rework: the longbow blinds, the crossbow winds and glints (Kyle; Claude Opus 5.5)

The third class through Kyle's weapons rework. The Ranger has the best dodge (the jump back and its
snare, unchanged) and the weakest guard (a parry, never a held block). Every bow is the short sword on a
tap (8 then 10, the `RANGER_BLADE` it already had) and the bow on a hold. Numbers in `shared/ranger.ts`
and `shared/weapons.ts`, the rules in `sim/crossbow.ts` and `sim/rangershots.ts`, all judged in the room.

- **Longbow**: quick, the short sword. Held, the draw: 18 growing to 55 over 1.4 s (the draw it had), the
  arrow piercing a line; walking while drawing stays slow (0.3 of your pace). Perfect: let go on the
  white flash (the same window and flash as before) and the arrow is a sure crit (55 x 1.5 = 83) and
  BLINDS each goblin it strikes for 2 s (a butcher 1 s). A blinded goblin drops whatever blow it had
  going, can't pick out a hero at all, and gropes about at under half its pace, turning every 0.7 s
  (headings from its id and the room's clock, no randomness). Judgment call: a goblin blinded mid charge
  stops too, since it can't see the line it showed you.
- **Shortbow**: unchanged (Kyle loves it). Its perfect (the white flash) already existed but showed only
  PERFECT at the bow; now the arrow strikes with a clean white spark too, so the hit reads. No numbers changed.
- **Crossbow**, reworked. A tap is the short sword. The hold is one state machine (`sim/crossbow.ts`):
  - a bolt on it: the hold raises it to aim (0.3 s to the raised sound), and letting go looses it: 60,
    through three goblins, each shoved hard (12), then a 0.35 s recover. It is empty after.
  - empty: the hold winds instead. You stand to it; 1 s of winding is a full reload. Letting go or pushing
    the stick ends the piece and keeps what's wound, so you can move between pieces. Letting go after a
    wind never looses (a fresh hold aims), so a reload can't fire by accident. A dodge out of it keeps the wind too.
  - glint: a reload wound from nothing to full without letting go or moving glints. The glinted bolt is
    the perfect one: PERFECT, 1.5x damage (90), 1.6x the shove, and it runs through the whole line.
    The glint, not the white flash, is the crossbow's perfect, so its aim shows no white.
  - Phone: hold ATTACK to aim, let go to fire; when it's empty, hold ATTACK and keep your thumb off the
    stick until the star shows. Laptop: the same on the left button; WASD ends a piece of winding.
  - The old crossbow fired on the press with a 1.15 s recover as its reload; that recover is now the wind.
- **Seen** (`client/fxranger.ts`, one overlay, so both views): BLINDED in white with a flash, ring and
  burst; on a blinded goblin a flickering white glare over its eyes and sparks circling its head
  (`client/status.ts`). A shortbow's clean hit: a small white ring and spark. A glinted bolt: a straight
  bright line from where it was loosed to each goblin it ran through, a flash on each. On the hero
  (`client/xbowmark.ts`, flat figures and box figures): over an empty crossbow a grey hollow bolt in a
  ring that fills as it winds (gold while the wind is still clean); a breathing star of light at the hand
  when the bolt glints. The crossbow in hand shows a bolt on it only when it's loaded.
- **Sounds** from the kit: BLINDED the perfect chime and the flare, the clean hit the perfect chime, the
  wind the hook's latch, loaded the latch and a block, the glint the latch and the chime, the glinted bolt's
  line the javelin's stick.
- **Online**: the load (`xbowEmpty`, `xbowWind`, `winding`, `xbowClean`, `xbowGlint`) lives on the hero
  and `blindUntil` on the goblin, so guests get them in the snapshot.
- New lines for the lore keeper and line editor: BLINDED, the longbow and crossbow card lines
  (`client/card.ts`) and their kit lines (`client/main.ts`).

Tests: `tests/rangerkit.test.ts` (the longbow's sword against its draw, damage growing with the hold, the
perfect crit and blind, a blinded goblin never starting a blow until it sees again, a blow stopped mid
swing, a butcher's shorter blind; the shortbow's numbers unchanged and its perfect not blinding; the
crossbow's sword tap, the loaded shot through three and no more with a shove, winding in pieces that
keep and walking between them, no glint from pieces, the stick ending a piece, the glint on an unbroken
reload with the 1.5x bolt through the whole line and the harder shove).

## 2026-11-03: the Warrior's weapons rework: the step, the shield bash and riposte, the shockwave, the pin (Kyle; Claude Opus 5.5)

The second class through Kyle's weapons rework. The Warrior is the tank, and each weapon trades damage
against shielding. Numbers in `shared/warrior.ts` and `shared/weapons.ts`, the rules in `sim/warrior.ts`,
all judged in the room.

- **No roll: a step.** The dodge button is now a short shoulder step for the Warrior (`STEP`): 1.2 tiles
  (the roll is 2.4) in 0.16 s (the roll 0.32), 12 breath, again after 0.55 s. It has no protection at all
  (its own act, `step`, which nothing treats as a roll), and it never counts as a last-second slip; a
  striped blow is still stepped out of on your feet. With no push it steps back from where you face; you keep facing.
  The button shows STEP on a phone (`dodgeName`, `dodgeOf`). The kits keep their old rolls in `dodge`,
  since `CLASS_DODGES.WARRIOR` stays false (no TEMPO trait, no DODGE gear mod, no dodge rows on the card)
  and the fight tests that lend the sword a roll still lend it. The tutorial's STEP OUT lesson now shows the
  STEP button from the path on (it used to hide the dodge for a Warrior for good). No Warrior knack touched
  the roll's distance, so none changed. The Healer still has no dodge.
- **Sword and shield**: quick, the three-cut chain (12, 12, 22), the best guard (unchanged). Held, a shield
  bash: reach 1.35, one goblin, 6 to 12 damage, and it stuns it 0.6 s to 1.2 s at full charge (a butcher
  half as long); it doesn't stop a striped blow or a charge. Perfect: a counter started within 0.5 s of the
  parry is a RIPOSTE, twice the counter (12 x 2.5 x 2 = 60 off the first cut); the plain counter (x2.5
  within 1.6 s) is still there after it. Seen: PERFECT, RIPOSTE in gold, a gold ring and flash.
- **Greatsword**: quick, two wide slow sweeps (arcs 210 and 240, up from 160 and 170). Held, the overhead
  (arc 110, reach 2.4, 38 to 75), still the `breaker`. Perfect: let go on the white flash (the rapier's
  window) and a shockwave lands 1.4 tiles ahead: every goblin within 2.6 takes 12, is shoved and knocked
  flat for 1.2 s (a butcher 0.6 s), losing its wind-up, striped or not; only a charge carries on. Trade-off:
  no held block at all (`parryOnly`); a tap of block is still a parry in its narrow 0.2 s window, and
  holding block says so as the Ranger's does.
- **Spear**: quick, long thrusts (reach 2.5, up from 2.3) with a bigger push (4, 4, 5, then 9). Held, the
  lunge runs through up to three goblins (`hits: 3`), 22 to 42. Perfect: any spear hit on a goblin that is
  charging, pouncing or mid lunger stab stops it dead and pins it for 1 s. Weakness: a quick thrust on a
  goblin inside half its reach does half (the shaft); judgment call, the held lunge is exempt, since the
  lunge carries you in among them and the point is the whole idea of it.
- Sounds from the kit: a step the footfall, the bash the block and body thump, a riposte the parry and the
  backstab sting, the shockwave the slam and rumble, a pin the javelin's stick. Effects in
  `client/fxwarrior.ts` (one overlay, so both views).
- New lines for the lore keeper and line editor: RIPOSTE, PINNED, the STEP button, the three card lines
  (`client/card.ts`) and the three kit lines (`client/main.ts`).

Tests: `tests/warrior.test.ts` (the step's distance and no protection, the bash stun, the riposte doubling
and the late plain counter, the greatsword's held block giving no guard and its parry still working, the
shockwave on a perfect release and none held too long, the spear's three-goblin lunge, the charge pin, the
shaft penalty). `fight.test.ts`: the counter test uses the greatsword (a sword's quick counter is now a
riposte), the charged-heavy test uses the greatsword held past its flash, and "no dodge" is now the
Healer's alone.

## 2026-11-03: the Rogue's weapons rework: Shadowstep stuns, the rapier skewers, the poisoner's kit (Kyle; Claude Opus 5.5)

The first class through Kyle's weapons rework (PLAN "Open: weapons rework"): every weapon a quick attack,
a held attack, a perfect-timed hit that reads, and a trade-off. All of it is decided in the room (seeded,
no `Math.random`), so a guest's goblins bleed and retch exactly as the leader's do.

- **Shadowstep stuns** the goblin you land behind for 1 s (`SHADOWSTEP.stun`, `sim/relics.ts`), for free
  stabs. Judgment call: not a goblin mid striped (unblockable) blow or mid charge, not a nest, not a
  dummy; those carry on (`dazeable` in `sim/venom.ts`, shared by the retch).
- **Daggers**: unchanged; the held attack is still the thrown dagger (tested).
- **Rapier**: the held lunge now has the white flash a bow has (`Swing.skewer`, `sim/hero.ts`). Loosed on
  it, each goblin the lunge runs through is skewered (`SKEWER` in `shared/venom.ts`): a 0.7 s stagger and a
  bleed of 3 every 0.5 s for 3 s (18). There was no bleed or DoT on goblins but the burn, so the bleed is
  new and lives with the poison in `sim/venom.ts`. Seen: a white flash at the tip, a spray of blood,
  SKEWERED, red drips on the goblin, red tick numbers.
- **The poisoner's kit** replaces the hand crossbow (new id `poisoner`; old saves holding a `handbow`
  anywhere, the hand, pack, vault or buyback, are renamed on load: `shared/oldkits.ts`, `client/save.ts`).
  - Quick: a short sword, 7, 7, 10, arc 130 to 150 (daggers 100), catching two goblins a blow (three on the
    last), slower than the daggers (0.35 s a cut against 0.23). Full damage head on (no `front`), backstab x2.
  - Hold (0.6 s draw): the blowgun, a dart to 9 tiles for 4 to 8 that puts on a poison stack: 2 a stack every
    0.5 s for 4 s after the last dart, up to 3 stacks (16 a stack, 48 at three).
  - Perfect release: the goblin retches first, held fast (stunned, so blows land x1.5) for 1 s while the poison
    ticks, and that dose ticks double (`VENOM.hard`).
  - Resistance (`VENOM_TAKES`): butchers, named butchers and the Stoker take half (and retch half as long);
    spiders, the brood mother and nests take none. Both show the existing RESIST.
  - Weakness: the dart barely scratches, the poison is slow, and it is useless on spiders and nests.
  - Poison is drawn sickly green in both views (`client/status.ts` drips, a green light in `scene.ts` and
    `three/roomlights.ts`); the dart, the blowgun and the short sword have their own looks flat and 3D; the
    icon, card, hint line, loot lists and trait pools all know it. Sounds reuse the spider kit: the dart a
    hiss, a skewer the wet bite, a retch the spit and splat.
- Name suggested: SHORTSWORD AND DARTS (needs the lore keeper and line editor, with SKEWERED and RETCHING,
  the card lines and the hint line). The story bible still says "hand crossbows" (line 210) for the lore keeper.

Tests: `tests/rogue-kit.test.ts` (the stun and its striped-blow exception, the skewer bleed and no skewer
when held too long, poison ticks, stacking, the retch and harder ticks, butcher half, spider and nest
immune, the handbow save migration); `poisoner.test.ts` and `kits.test.ts` moved to the new kit.

## 2026-11-03: one big map, measured before it's designed (Kyle; Claude Opus 5.5)

Kyle wants raids on one big, mostly open map, 8 to 12 times a room, with a few buildings and camps; the
fear is lag on whoever hosts (a phone, maybe) and on the relay. Built a test map and measured. Nothing
here is a real job yet; it lives behind `?hero=WARRIOR&bigmap=1` and `scripts/bigmap/`.

**What was built** (test only unless said):
- `shared/bigmap.ts` + `shared/bigchunks.ts`: one seed gives a 96 by 72 map (8 by 6 chunks of 12; a room
  is 28 by 24, so about 10x) of open ground, groves, farms, camps with wild fires, ridges and ruins,
  every solid thing 1.5 tiles off its chunk's edge so the seams are always open, and `n` goblins
  weighted to camps. `sim/bigroom.ts` builds the room; `sim/bots.ts` drives heroes by Intent only.
- **Dozing** (`sim/sleep.ts`, `SLEEP` in tuning, `Enemy.dozing`, `ArenaRoom` option `sleep`): a goblin
  farther than 24 tiles from every hero is not stepped at all (holds where it stands); it wakes inside
  24 and dozes again past 30. The room runs the tick on the awake list and merges the dozers back in
  their order, so bolts, pushes, targeting, drums and elements are all near-only for free. Off unless
  a room asks (no room of today's size could use it: 24 tiles is past any corner of it).
- **Near-only costs in the sim, carried over now** (on only when many bodies or a big map, so today's
  rooms run the old loops): pushing bodies apart checks near pairs only past 80 bodies
  (`sim/pairgrid.ts`, same pairs in the same order); `collide` looks only at the round things, braziers
  and blocks bucketed near it on maps over 3000 square tiles (`shared/mapgrid.ts`, same pushes, tested);
  a resting goblin listens only to the goblins that are fighting, just hit or dead (`noisy` in
  `sim/enemies.ts`, once a tick in a crowd). Before these, 600 goblins cost about 30 ms a tick in Node.
- **Relay fix, carried over now** (`api/room.ts`): a message over the socket's 64 KiB `maxPayload` made
  `ws` emit 'error' on a socket nobody listened to, which threw and took the whole Vercel instance down
  with every room on it (reproduced locally). It now logs and only that socket closes (1009).
- `client/interest.ts` (prototype, not wired in): `stateFor` (each friend: all heroes and buildings,
  everything else within 20 tiles), `eventsFor`, and `quiet` (a goblin's `cooldown` isn't drawn so isn't
  sent; `actT` goes as `a0`, when the act began, which only changes with the act).

**Node, the room's tick** (`npx tsx scripts/bigmap/measure.ts 30`; CPU ms a tick, 30 s of play at
30 Hz, four bots that can't be hurt and swing at what comes close; "spread": one in each quarter;
"together": roaming one quarter as a party; this 2-core box is shared with other agents, so wall time
was noisy and CPU time is what's shown):

| bots | goblins | dozing | tick mean ms | p95 | awake (mean) |
|---|---|---|---|---|---|
| today's village street | 5 | n/a | 0.37 | 1.55 | |
| spread | 100 | off / on | 0.68 / 0.48 | 2.54 / 0.71 | 74 / 67 |
| spread | 300 | off / on | 1.75 / 1.34 | 2.88 / 1.93 | 248 / 226 |
| spread | 600 | off / on | 4.01 / 4.63 | 6.3 / 6.8 | 529 / 503 |
| together | 100 | off / on | 0.50 / 0.31 | 0.64 / 0.42 | 91 / 35 |
| together | 300 | off / on | 2.32 / 1.02 | 4.88 / 1.76 | 277 / 118 |
| together | 600 | off / on | 6.46 / 2.38 | 11.81 / 4.19 | 556 / 222 |

Four heroes spread to the quarters keep almost the whole 96 by 72 awake (four 24-tile rings cover it),
so dozing only pays when the party is together or the map is bigger than four rings. What's left of a
tick is mostly resting goblins looking about (`notice`) and pushing.

**Browser, the leader's frames** (`node scripts/bigmap/browser.cjs perf`, preview on 4220; four heroes
spread, the leader's own walked by a bot; dozing on; headless Chromium with SwiftShader, so the GPU is
software on the same 2 cores: 2.5D numbers are far below a real GPU, read them against today's row):

| goblins | view | device | fps | frame mean / p95 ms | room ms a frame | draw ms a frame (JS) |
|---|---|---|---|---|---|---|
| today's job (5) | flat | laptop | 42.5 | 23.5 / 33.4 | | |
| today's job (5) | flat | phone (CPU /4) | 24.3 | 41.1 / 50.1 | | |
| today's job (5) | 2.5D | laptop | 7.9 | 127 / 150 | | |
| today's job (5) | 2.5D | phone (CPU /4) | 5.7 | 174 / 217 | | |
| 100 | flat | laptop | 52.3 | 19.1 / 33.4 | 0.47 | 3.95 |
| 100 | flat | phone (CPU /4) | 24.2 | 41.3 / 66.7 | 3.1 | 15.1 |
| 100 | 2.5D | laptop | 5.3 | 190 / 233 | 2.3 | 17.3 |
| 100 | 2.5D | phone (CPU /4) | 3.0 | 335 / 517 | 11.6 | 78.7 |
| 300 | flat | laptop | 57.3 | 17.5 / 16.8 | 0.77 | 5.3 |
| 300 | flat | phone (CPU /4) | 17.1 | 58.4 / 83.4 | 10.3 | 25.8 |
| 300 | 2.5D | laptop | 6.5 | 155 / 183 | 5.1 | 21.0 |
| 300 | 2.5D | phone (CPU /4) | 3.5 | 290 / 383 | 19.5 | 94.2 |
| 600 | flat | laptop | 43.4 | 23.1 / 33.4 | 2.4 | 8.9 |
| 600 | flat | phone (CPU /4) | 8.7 | 115 / 150 | 40.3 | 43.5 |
| 600 | 2.5D | laptop | 4.8 | 210 / 317 | 10.5 | 27.4 |
| 600 | 2.5D | phone (CPU /4) | 1.4 | 733 / 883 | 63.7 | 143.4 |

A big map with 100 goblins costs a phone host what today's room does. At 300 (about 230 awake) the
phone's frame is 1.4x today's in flat and the room alone is 10 ms of a 16.7 ms frame; at 600 it's 2.8x
and unplayable. Drawing grows with goblins too: neither view skips what's off screen, and the flat
lighting pass takes the first 32 lights in the list wherever they are (a big map with many camp fires
would lose the ones on screen).

**What the leader sends** (same Node script; patches every 0.05 s, a full one every 4 s, as
`CoopHost.frame` does, each in `RelaySocket.send`'s envelope; KB a second each friend receives; the
relay's ceiling for one message is 64 KiB):

| bots | goblins | whole room, today (KB/s) | biggest msg KB | near only (KB/s, worst friend) | biggest KB | near + quiet clocks (KB/s) | biggest KB | save every 2 s KB |
|---|---|---|---|---|---|---|---|---|
| today's street | 5 | 19.3 | 23.2 | 17 (17) | 14.5 | 13.7 | 14.4 | 24.8 |
| spread | 100 | 123.5 | **82.3** | 33.8 (38.4) | 25.2 | 22.6 | 24.7 | **94.2** |
| spread | 300 | 335.8 | **187** | 72.4 (82.3) | 45.3 | 41.5 | 43.8 | **217** |
| spread | 600 | 662.2 | **342** | 122.2 (146.1) | **71.5** | 65.2 | **68.7** | **396** |
| together | 100 | 76.1 | **80.8** | 38.7 (40.7) | 26.5 | 26.7 | 25.9 | **89.6** |
| together | 300 | 193.4 | **186** | 88.2 (98.8) | 58.3 | 51.0 | 56.5 | **207** |
| together | 600 | 355.1 | **342** | 163.2 (176.2) | **101** | 89.5 | **97.6** | **383** |

(Bold: over the 64 KiB ceiling.) How it travels: the leader sends one message to '*' when everyone's in
one room, so the leader uploads it once and the relay fans it out; per-friend sends mean one upload per
friend. Each message is a Redis PUBLISH only when the party is split over Vercel instances (else kept
local): 20 a second per room either way, whatever their size. Anything over 64 KiB closes the leader's
socket (and, before today's fix, crashed the instance); 64,000 to 65,536 characters are dropped silently
(`MAX_MSG`). Today's whole-room full snapshot carries the whole map (14.8 KB here) every 4 s, and the
handing-on save (the whole room as JSON, about 0.8 KB a goblin) goes every 2 s: at 100 goblins both are
already over the ceiling. What fills a patch: in a 300-goblin patch, `cooldown` 28% and `actT` 20%
(clocks ticking every tick), x and y 7% each; dead goblins keep ticking both forever.

**Recommendation.**
- **Map size**: 96 by 72 (about 10 rooms) is fine. The map itself costs nothing much now (15 KB, and
  collision only looks near); goblins awake near the party are the cost.
- **Goblins**: on a **phone host**, about **150 to 200** on the whole map, placed so no more than about
  60 to 80 are ever within 24 tiles of the party (camps spread out, not one horde), dozing on. On a
  **laptop host**, **300 to 400**; 600 runs (4 to 6 ms a tick) but the sends don't fit. If the leader may
  be a phone, design to the phone numbers.
- **Interest-limited sending is needed**, not optional: the whole-room full snapshot breaks the relay's
  ceiling at 100 goblins. With it plus quiet clocks a friend gets about 23 to 50 KB/s and the biggest
  message stays under 64 KiB up to about 300 goblins. Also needed before a big map ships: the map goes
  as its seed (built on the friend's side), not in every full; the save goes compact (or in parts, or
  only what's near), since it's over the ceiling at 100 goblins.
- **Wake radius 24 tiles, doze at 30** (two screens of a hero; any goblin's sight is 6.5 and an arrow's
  reach 8). Smaller saves little and risks goblins freezing in sight on a laptop's wide screen.

**Carries over** (already on this branch): dozing (`sim/sleep.ts`), near pairs and the map lookup,
`noisy`, the relay's error listener, the seeded chunk generator as a starting point (the real one wants
roads, a goal and doors), and the bots for future load tests. **Still to do for the real build**:
wire `stateFor`/`quiet` into `CoopHost.frame` (an Encoder per friend, the guest's Decoder works out
`actT` from `a0`), map by seed, a compact save, skip off-screen goblins and props in both views, cull
lights to the screen before the 32-light cap, and stop dead goblins' clocks.

Screenshots: `node scripts/bigmap/browser.cjs shots <dir>` (phone and laptop, flat and 2.5D, close by
a hero; an overview of the whole field with the party spread, and one with a hero alone at the way in,
awake goblins green and dozing grey). Tests: `tests/bigmap.test.ts` (same seed same map, every goblin
reachable, the map lookup pushes the same as checking everything, near pairs the same as all pairs,
dozers hold still and wake when a hero comes near, the room keeps its order).

## 2026-11-03: nests come back slower, and burn out up close (Kyle; Claude Opus 5.5)

Kyle: "I love them but they respawn too quickly so it's hard to kill their nest. Nests should have less
HP too; it's hard for a Rogue. Or maybe it has the same HP from range, but if you run up to it you can
light it on fire and it burns out." Done both ways: the waves give you a window, and in that window any
class can run in and torch it. Numbers in `shared/spiders.ts` (NEST), rule in `sim/torch.ts`.

- **Waves** (`sim/spiders.ts`). Before: first wave 1.2 s after it wakes, then every 8 s, cap 7 alive.
  After: first wave 2 s after it wakes, then every 12 s solo, 1 s quicker for each player past the
  first, never under 9 s (`nestGap`); cap 6 alive (still +2 for each extra spider a wave in a party).
  New: when the last spider of its waves dies, the next waits at least 5 s more (`NEST.rest`), so
  killing a wave buys a real run at the nest. Wave size unchanged: 3, +1 a player past the first. The
  gap counts the players in the room now, so it follows someone leaving.
- **Burn it out** (`sim/torch.ts`). GRAB within 1.6 tiles of a nest's middle (it comes after HELP UP,
  before grabbing a goblin or lifting a prop): you crouch, and after 1.2 s of standing still and idle it
  catches. A hit (you stagger), a swing, a dodge, a step or going down stops it and the next try starts
  from nothing, the same rule as getting a friend up. One lighter at a time; a second press while a
  friend is at it does nothing. Alight it burns 3.5 s, its health running down to nothing, then dies as
  'burn' (ash), credited to whoever lit it, and counts like any nest for the room's goal. While alight
  it hatches nothing (a wave swelling in it never comes), nothing puts it out, and its fire spreads to
  spiders on it by the room's ordinary touch rule (the nest's burn tick is off: it burns on its own
  clock). From range nothing changed: fire still 3x, and a fire hit still burns it fast.
- **HP and blades.** 80 to 55. Blades kept at 0.6. The real trouble for a Rogue was the daggers' head-on
  halving (`front: 0.5`) on top of 0.6: 2 a stab. A nest is a mound of web with no front or back, so
  blades now land on it plain (no halving, no backstab; `sim/combat.ts`). Daggers: 4, 4, 5, 8 a chain,
  about 3 chains to kill it, where it was about 8.
- **Drawn from the same state, both views** (`client/nestfire.ts`, called from `client/spiders.ts`, which
  2.5D's cards draw too): a gold ring filling round the nest while it's lit (like the ring for helping
  a friend up), sparks at its foot and a small warm glow; alight, tongues of fire over a mound that chars
  and sinks, a bigger warmer light (70 not 44; 2.5D adds its fire too); after, a grey heap of ash with
  embers going out over 6 s. The lighter crouches (`hero.stoop`, set by the room). The hatch is the
  'oilfire' whoosh with a flash; no new pop (the spiders' own BURNING says enough).
- **Online.** GRAB is the existing grab press, decided by the room; the nest's `lighter`, `lightT`,
  `ashAt` and the hero's `stoop` are plain fields in the patches, so a guest sees all of it.
- **Words**: BURN (the button), G  BURN (the laptop prompt). For the lore keeper and line editor.
- Tests: `tests/torch.test.ts`. Screenshots: `node scripts/nests.cjs [url] [outdir]`.

## 2026-11-03: the lamps keep the hour; 2.5D's night back to FLAT's (Kyle; Claude Opus 5.5)

Kyle: "Town looks a little too bright now, but maybe it's daytime. If there is day and night, we should
turn off fires at night except for the wild burning ones." Read as: the fires people tend are out by
day and lit at dusk and through the night; the wild ones burn whatever the hour.

- **One rule, both views** (`shared/lamps.ts`, `lampAt(theme, x, y)`). Lamps: wall torches, braziers,
  lamp posts (the square's, the lane's, Perrin's garden), a hall's door lamp, lamplit windows (the halls,
  the church, the tavern, a job's cottage with its fire going), the torches either side of an open way
  out, and the heroes' carried lanterns (already off by day). Wild, never put out: a house or wagon on
  fire, embers and smoulder, a goblin camp's fire (job braziers and cottage camps, `wild` on the map),
  the Tulls' brazier inside the gate (they live round it), cookfires, spell and skill fire, a burning
  goblin. Also always lit: the Last Lantern (it never goes out), the forge's fire (worked all day),
  anything indoors, the yard, Hew's wood, underground (lamps are lit whenever anyone's there).
- **When.** In Wickhold by the shared clock: the first lamp is lit at phase 0.71 (daylight about 0.65,
  as dusk starts) and the first put out at 0.285 (about 0.6 after dawn). The lamplighter goes round:
  each lamp has its own place in the round from where it stands, so they come on one by one over 0.012
  of the day (about half a minute) and go out the same way, each flame catching over a few seconds. The
  day only runs forward and a lamp lights at a darker point than it's put out, so nothing flickers (a
  test walks the whole day and counts one lighting and one putting out per lamp). On a job by its hour:
  out in broad day, lit at dawn (not yet put out), dusk and night.
- **Out means out.** A cold brazier is grey ash, a torch a charred head, a post an empty lamp, a door
  lamp and windows dark glass, and none of them give any light, so by day the sun does it all. The
  fires that stay lit count for less under the sun, as on a day job (the town's `torch` now runs from
  1 at night to 0.35 at noon), so the Last Lantern no longer throws a warm pool across the square at noon.
- **2.5D's night** (`three/lights3d.ts`). The moon's blue-silver key was about twice FLAT's moon pool
  across the whole square (FLAT's is a pool over the middle at the theme's strength), which made the
  square cooler and greyer than FLAT. Now `MOON` 0.6 (was 1.3), and the point lights a little stronger
  and further (`POINT` 3.1, was 2.6; `REACH` 1.15), so the lamps carry the night in warm pools.
- **Numbers** (luma, saturation, warmth as mean R minus B; the square at 31,21 where the last entry
  measured, phone): midnight FLAT 63 / 0.32 / 14, 2.5D before 65 / 0.27 / 7, after 60 / 0.31 / 16; on a
  laptop FLAT 60 / 0.31 / 14, 2.5D before 64 / 0.29 / 12, after 59 / 0.33 / 20. A job street at night
  (burning house, goblin fire): FLAT 40, 2.5D before 42, after 41, saturation 0.45 / 0.39 / 0.45. Noon,
  lamps out: FLAT 92 to 76, 2.5D 98 to 86 (still clearly day, a little brighter than FLAT). Dusk (0.74,
  every lamp lit): FLAT 69, 2.5D 70, the warmest of the three.
- **Testing the hour** (`client/townclock.ts`): `?day=0.5` in the address (0 midnight, 0.25 dawn, 0.5
  noon, 0.75 dusk) or `window.__setDay(0.75)`, `__setDay(null)` to give the clock back.

## 2026-11-02: 2.5D figures are FLAT's pixel figures standing in the 3D world (Kyle; Claude Opus 5.5)

Kyle: "In 2.5D the mage looks blocky, so does the big orc. Also when the spearmen are attacking they
sort of project and then hold too long at the end instead of more of a stab ... I really like how the
terrain and land look in 2.5D but the enemies I'm not loving." Decided: the HD-2D way. Keep the 3D
world, draw the characters as the game's own sprites. On the first shot Kyle said "Yes. Love. Do it."

- **One source for how a figure looks.** Every figure in 2.5D is drawn by the flat view's own code
  (`drawHero`, `drawEnemy`, `drawHeld`, `drawStatus`, `drawHound`, `drawSurvivor`, `drawNpc`), so each
  class and look, held kit, pose, wind-up and payoff, hit flash, frozen and burning, death, and the
  goblins' glowing eyes match FLAT exactly and can't drift. Who gets a card is `three/cards3d.ts`.
- **How** (`three/figs3d.ts`). Each frame every figure in sight is drawn into its own 96x96 cell of one
  atlas (a `lit` canvas and a `glow` canvas, ten cells a row, more rows as needed) and shown on a card
  at its feet. The card is folded at the feet: upright above them, lying on the floor below them (a
  blade swung toward you, a ring at the feet, a name under someone stays on the ground, never sunk into
  it). It is sized so one sprite pixel is one pixel of the low-res view (a whole multiple when the view
  is coarser) and snapped to whole pixels, sampled nearest, so it stays crisp under the post pass. At
  HIGH a figure stands as tall against the floor as in FLAT (the view's pixels per tile times cos 36
  degrees is about 17 against FLAT's 16).
- **Lit by the world** (`three/figmat.ts`). The lit layer is a Lambert surface (the same banded light
  and dither as everything else) with a normal facing the camera and a little up, so torches, braziers,
  the moon and spells light it, and the moon's shadow falls on it. The glow layer goes on top unlit and
  blooms (eyes, sparks, flashes, words). Part-covered pixels keep to an ordered dither, never a blend;
  a faint one (a lunge's afterimage) is drawn dimmer. A soft dithered pool on the floor is the shadow
  (FLAT's own shadow is skipped on a card: `draw.ts` `BARE`).
- **Depth and outlines.** Cards sort and hide against walls, roofs and trees by depth like anything
  else; heroes still show as the violet silhouette behind walls, now cut to the sprite's shape. Cards
  are kept out of the outline pass (alpha just under 1): the sprites carry FLAT's one-pixel outline, so
  no double outline.
- **What the cards now carry** (and the overlay no longer draws twice): a goblin's health ring and
  what's on it, the butcher's "!", a downed hero's count, an NPC's mark and name when you're near, a
  swing's smear. Friends' names stay over their heads (the overlay, lower to match the figures).
- **The spearman.** FLAT's lunger already stabs quickly (out for 0.18 s, back over 0.25 s, then
  standing), but its spear was drawn from the feet and never moved, so the lunge read as a body sliding
  with a stick. Now the lunger's spear and the brute's club are in the weapon hand and go with the pose
  (`foes.ts` `kit`): the spear drives out on the stab and comes back with the recover. The lunger no
  longer carries a knife as well. Drawing only; the sim's timings are unchanged.
- **Kept.** The box figures (`heroes3d.ts`, `goblins3d.ts`, `foepose3d.ts`, `folk3d.ts`, `npcs3d.ts`
  and the rest) are untouched behind `?figs=3d`, for when Blender models replace the sprites. Props,
  buildings, chests, bolts, telegraphs and effects stay 3D; the yard's cage still holds a box figure.
- **Cost.** Drawing the cells is under 1 ms for ten figures and about 2.5 ms for the wood's thirteen
  (software GL in headless Chrome, so slower than a phone). Draw calls about halve (82 to 36 in the
  square). Alternating runs of box figures and cards in the square, headless, showed no measurable
  difference in frame time (medians about 48 against 41 ms draw); the 390 ms frame in the first shot
  was load from a parallel run, not the cards. In town on a laptop page, three alternating runs each:
  2.3 to 3.3 frames a second with box figures, 3.0 to 4.0 with cards (software GL on a loaded two-core
  box). Both atlas textures go up every frame something was drawn (960 by 192 pixels each for up to
  twenty figures). Not done: redrawing only the cells whose pose changed (the flat code draws from the
  wall clock too, so there's no cheap test for "unchanged"); worth it only if a phone shows the upload.
- **Online with 2.5D on** (`LOOK=3d`): the party run passes; the chat run's "Kyle hears Sam's world
  line" and the town run's "Sam walked" fail the same way with the box figures (`LOOK='3d&figs=3d'`),
  so they come from 2.5D at three frames a second in software GL, not from the cards; FLAT passes.


## 2026-11-02: 2.5D as bright as FLAT, closer in on phones, trees that aren't voxels (Kyle; Claude Opus 5.5)

Kyle and his friends played both views: "We like the 2.5D, but flat has cleaner, brighter colours. It's
too dark in 2.5D." Then Kyle in the wood on his phone: "It looked like Minecraft from super far back."

- **Measured, not eyed.** `scripts/bright-look.cjs` holds the room still and shoots FLAT then 2.5D at
  the same moment (Wickhold night and day, a job street at night, a den, the butcher's telegraph, and
  the wood: waking, Hew's first card, a drill freeze-frame, the cutscene, the Stoker), phone and laptop;
  `scripts/bright-stats.py` gives mean luma and saturation of the play area and of a box round the hero.
  Before: the square at night and the dens 14 to 30% darker than FLAT, saturation 0.27 against 0.46 in a den, the hero
  about 60% of FLAT's brightness at night (88 against 150 in the square).
- **What made it dark.** The 3D ambient was 1.35 times the theme's where FLAT's pass uses 1.55 with a
  floor (light.ts: nothing goes below 0.19); upright faces (walls, every figure) took the moon or a
  torch only by the cosine of a light slanting down, so people stood darker than the floor they were on;
  indoors (no moon) a blue moonlight was still forced on at 0.35, greying the warm rooms; outlines were
  near black (22% of the colour) on 1-pixel figures. Banding was not the cause: it already bands the
  light's level, not each channel.
- **What changed** (`three/lights3d.ts`, `three/post.ts`). The theme's ambient at FLAT's 1.55, split
  into a fill (75%) and a key from the sky in the ambient's own colour (45%), so a lit floor lands on
  its flat colour and faces still model; the moon adds its blue-silver to the key at night only (none
  indoors); wrapped light (a face turned away still takes 40%), so figures read like FLAT's sprites; the
  same light floor as FLAT; point lights a little stronger (2.6) so torch and brazier pools match FLAT's
  falloff; outlines a darker shade of the thing's own colour (42%, saturation kept) instead of black.
- **After** (luma, flat / old / new): square at night 63 / 50 / 65, a den 33 / 23 / 30 (saturation
  0.46 / 0.27 / 0.39), a job street 29 / 30 / 37, the square by day 92 / 106 / 98. The hero at night
  120 (was 88), never darker than in FLAT on a job. Night is still night: the square is blue-silver
  away from the braziers, the pools warm.
- **Closer in on phones.** The 2.5D view showed 85% of FLAT's width, but tilted it took in 38 rows to
  FLAT's 26 on an upright phone, so everything looked far off. Now it shows as much floor (tiles across
  times down) as FLAT does, and on an upright screen 80% of it (`ZOOM` in view3d.ts): about 8.4 tiles
  across and 31 deep on a phone, 17.5 by 19 on a laptop. The angle stays 36 degrees (the job rooms that
  looked right).
- **Trees** (`three/rounds3d.ts`, `three/boxes.ts`): a pine is three six-sided cones and a leafy tree
  three rounded lumps, in FLAT's own greens (sprites.ts), not stacked boxes; a wood's wall of trees is
  lumps too. Burning wagons burn on top of their bed (the flames were inside the box) and have side
  boards; the cordwood is a stack of logs between posts, not a brown box.
- **The trainer skills in 2.5D** (`three/skills3d.ts`): the rings a Shield Stamp, Fire Ring or Censer
  Light fill while winding up, the Volley's marked spot and its arrows falling, the fire ring burning,
  the Storm Tether's lightning and the Censer Chain's links, from the same room data skillsdraw.ts
  uses, with their light. (Vanish smoke, the knives and the hound were already drawn.)
- **BRIGHT - / +** under QUALITY while 2.5D is on: a gamma in the post pass, -2 to +3, remembered
  (`?b=` wins). For dim phone screens.
- Headless (software GL) frame times are the same as before within noise; triangle counts unchanged
  (the cones and lumps are no more faces than the boxes they replace).

## 2026-11-02: what you pick up on a job is yours, whatever happens to your page (Kyle; Claude Opus 5.5)

Kyle: "What if someone drops and rejoins multiplayer but picked up gold or an item? I want to make sure
they have it when they reload." Then: "Shouldn't be my device, should be whoever started the job."

- **The leader keeps what the job owes.** The room decides, so whoever runs the job (CoopHost, and
  whoever takes it on) writes each member's share to the server (`api/owed.ts`, `api/_owed.ts`: one
  Redis hash per hero, `relic:owed:<heroId>`, a field per job's room code, a week's keeping). Written
  when the pot changed, at most every 4 s, for everyone still with the job (heard in the last 5 s);
  someone gone keeps the share they had when they went. At the end, everyone still with it is written
  the outcome too (`end: won | beaten`), so a page that was hidden at the end is paid as won.
- **Claimed once, on load** (`Game.settle`, from main.ts once a hero is in town and has no job to get
  back into, or when a job turns out to be gone). The pay goes into the save in the same store as the
  job's mark in `profile.paid` (the last 12 jobs), then the server's record is dropped. A record for a
  job already paid is only dropped. So a reload mid-payout, a late write from the leader or a lost
  drop can never pay twice.
- **Each device's own tally** (`client/jobbank.ts`) is only a fallback: paid when the server can't be
  reached, or for a job alone (never on the server). Never both: whichever pays marks the job paid.
- **What each pays.** Won: the pot, the job's pay, the treasure. Driven back (beaten): half the pot.
  Alone, leaving or being cut off loses the job: half, as driven back (so closing the tab never beats
  LEAVE). With a party, going early, by LEAVE or cut off (a crash, a closed tab, the leader gone and
  nobody to take it on), keeps the pot as it was while you were with them, in full, and the experience
  earned, but not the job's pay. LEAVE with a party was half before; it's now the same as a drop. The
  Ransom Coat only bites when it's half. New title for going early: HOME EARLY.
- **A leader back after a reload** leads again from the job as it kept it, but the room waits up to 10 s
  for a friend to answer; nobody does (they finished it, or left), and the job is given up and settled
  from the record, rather than the old leader replaying a stale job alone.
- **Kit is saved the moment the room changes it** (`client/keepkit.ts`), for a friend now too: a weapon
  swapped from the pack, the relic carried, the Mage's element (a friend's weapon swap was lost on
  reload before). **And never rolled back:** a room restored from a whole-job save (a reload, a
  takeover) is dressed from each player's own save (their profile is the newer word on their kit; a
  friend's on their first hello), and a piece already in someone's save isn't left on the floor too.
  The pack's size rule on pickup is the room's (`sim/loot.ts`), unchanged.
- **Stress** (`scripts/stress/keep.cjs`): 22 a friend picks up and reloads, paid what the leader is;
  23 a friend closes the tab, the job ends, he comes back: the ring, the pot as it was, the experience,
  paid once (his device tally wiped first, so it's the leader's record); 24 the leader crashes, a friend
  finishes, the old leader comes back: the ring and his share (device tally wiped too); 25 a friend
  swaps weapon and reloads: still holding it. Scenarios 1, 2, 3 and 20 now expect HOME EARLY.
- **Unsure:** no accounts, as for the world: anyone knowing a hero id could write it gold (capped at 5000
  a job). A friend coming back to a job that ended still waits the 35 s a lost leader takes before
  being paid. A record the leader never got to write (it crashed in its first seconds) pays nothing.

## 2026-11-02: host a job, wander town, set out when ready (Kyle; Claude Opus 5.5)

Kyle: "I would like to be able to host a job and then wander around town, same with others, and start
whenever we're ready, with a little UI notification of who else signed up for the job."

- **GATHER A PARTY posts and lets you go.** The board closes; you walk anywhere in Wickhold (halls,
  shops, the vault) while the party's up. The board still lists parties (`client/partyboard.ts`).
- **A party card on the HUD** (`client/partycard.ts`, `partyhud.css`) in town while you lead or are in
  one, indoors too: the job's kind and name, pips in class colours for who's in plus empty ones for free
  slots, 2/4; opened out, the names (class colours from the weapon each carries in town), the leader
  marked LEADS, and SET OUT (greyed with NEEDS 3 TO SET OUT for a story job short of people) and CANCEL
  for the leader, LEAVE for the rest. A phone shows the one line under the HUD and opens on a tap; a
  laptop shows it all. With a panel up on a phone it drops to the bottom as one line, so the panel reads.
- **Toasts** (`client/partytoast.ts`) under the card: KYLE is gathering for ... (with JOIN on it, and a tap
  elsewhere opens the parties gathering from anywhere), SAM joined your party, SAM left, You're in KYLE's
  party, and why one's gone. One per happening, a soft two-note chime, gone in 4.5 s, three at most.
- **Setting out has a beat** (`client/setout.ts`): the leader's SET OUT closes any panel and the pack, says
  SETTING OUT and where for 1.4 s, then goes. The party is told at the start of the beat (and comes down,
  so nobody joins late), so every member's beat runs alongside the leader's, wherever they are, and they
  arrive about as the leader does (stress scene 14 caught the members a whole beat behind at first).
- **Online, small and steady** (`shared/lobby.ts` pure and tested, `client/parties.ts`): the offer the town
  carries is a tag of the job (id, title, kind, place, size) instead of the whole posting, under 220
  bytes; the whole job goes once, with the set-out word. The party's grace is 20 s (PARTY_GRACE, longer
  than the town's 12 s so a reload through the start screen fits): a member quiet past it is let go, and
  a leader quiet past it ends the party for everyone. Both sides keep their party in localStorage for
  the grace (`client/partykeep.ts`), so a reload on either side comes back to it. A member not yet listed
  asks again every 3 s, so one lost word never strands anyone. Leaving Wickhold (the yard, a job alone)
  takes your party down or leaves the one you're in, said before the town's socket closes.
- **Tests.** `tests/lobby.test.ts`; `scripts/lobby-online.cjs` (in `npm run test:online`): host posts and
  walks into the forge, a friend on a phone joins from the toast, the host's card shows him, the friend
  walks into the counting house and opens the vault, the host sets out from his card, both arrive; a
  member reloads and stays in, then leaves and the host is told; the host reloads with the party intact,
  then cancels; the host goes to the yard; the host's page dies and the party breaks up after the grace.
  The other online scripts and the stress kit now set out from the card.
- Open: every new word (`client/partywords.ts`) through the lore keeper and the line editor.

## 2026-11-02: the 2.5D view everywhere, a quality switch, the hand crossbow (Kyle; Claude Opus 5.5)

Kyle played 2.5D on jobs ("It seemed to run really well") and asked: "No 2.5D in the main hub area?",
"Let's get townsfolk, hanged bodies etc. That stuff is amazing", "Let's do higher quality, but let
someone change the quality themselves", and "I got the hand crossbow as the Rogue and it went OVER my
twin daggers instead of replacing them, which felt weird, and didn't seem to change anything."

- **Everywhere, still a second drawer.** VIEW: 2.5D now draws whatever room the game is in: Wickhold and
  its halls, the training yard, the wood, jobs. No sim, relay or coop change. The "2.5D shows on jobs for
  now" line is gone. What the flat view draws beside the room is drawn too: the map's people
  (`three/npcs3d.ts` in the colours of npcs.ts's looks, `three/work3d.ts` for what they're at: guards'
  spears on their rounds, the gravedigger carrying the dead and digging, the whetstone, the well, the
  column's dead in what they bled, Hew after the bite), other players in town (`three/people3d.ts`, drawn
  only), a Mage's blink image (a dithered violet copy, flickering), and the yard's cage.
- **Words and marks** go on the flat layer as in FLAT (`three/tags3d.ts`): gold marks over anyone to
  talk to, their name when close, other players' names, buildings' names on their fronts. Speech
  bubbles take a height (`tileScreen(x, y, up)`), so they stand over a 3D head as over a sprite.
- **The rest of the flat view's extras** (`three/extras3d.ts`), each from the room or the flat code
  itself so it matches: swing trails from held.ts's own pose (the arc that's judged), status icons
  (status.ts), the hook's line (relicsdraw.ts), drummers' reach and beat, edge marks for the freed,
  the relic held up in the wood, dawn's mist anchored to the ground, crows, the dog, moths and smoke.
- **Grim, within the bible** (`three/grim3d.ts`, "Dens and big houses"): the larder's hung by the
  ankles from a rafter hook, opened, turning and dripping; the cook-pot on its fire with an arm or a
  leg over the rim, steam rising. Grown people only; the rest of the gore is the floor's own painting.
  The gallows and hurdles are `three/siege3d.ts` (a noose, a crow on the beam).
- **Each hall as itself** (`three/halls3d.ts`, after exterior.ts): the tower's bent slate cone and slits
  lit odd colours, the barracks' shields and banner, the lodge's antlers and pelts, the church's belfry
  and round window, the Rat's casks and lamp, the forge's chimney stack, the town hall's notices, the
  infirmary's herbs, the counting house's fallen-in end.
- **Rough edges.** Thatch is laid in courses with a darker cut edge and loose straw, so it reads as rows
  catching the light. Walls have mortar behind the stones and roofs an underlay, so seams show as lines
  rather than holes (at HIGH they had shown as black flecks). The lunger coils back over its wind-up and
  throws itself along the red, and lunges and charges carry chevrons running the way they come. The
  Stoker's cutscene moves the 2.5D camera as it does the flat one.
- **Every kit its own in hand** (`three/kits3d.ts`): sword and shield, greatsword, spear; longbow,
  shortbow, crossbow; twin daggers, the rapier, the hand crossbow with a knife; wand, the staff's crook,
  the banded rod; mace, sword and censer, flail (the censer at every Cleric's belt). A new figure is
  built when the kit changes, so one replaces the other.
- **The hand crossbow.** The room was right: equipping it from the pack makes the hero's weapon the hand
  crossbow, the tap is the knife, the hold is a bolt that dazes (`tests/handbow.test.ts` goes through
  the pack the way PACK does). What was wrong was the drawing: 2.5D gave every Rogue twin daggers
  whatever the kit, and FLAT drew the knife (which looks like a dagger) with the crossbow hanging beside
  it. FLAT now holds the crossbow in hand, the knife sheathed at the belt, out only for a stab.
- **Quality.** HIGH to start on every device. QUALITY: LOW / MID / HIGH sits under VIEW in the gear box
  while 2.5D is on, changes live (the light pool and the moon's shadow are rebuilt, the canvas resized)
  and is remembered; `?q=` still wins. `?perf=1` keeps the readout.
- **Measured headless (software GL, SwiftShader; a real GPU is far quicker).** Wickhold at night, frame
  ms: phone 390x844@3 low 47, mid 138, high 185 (draw 15, 33, 36); laptop 1280x800@2 low 45, mid 135,
  high 184. At HIGH: a hall inside 91, a den 103, the wood 143 (phone), a job street 158. Draw calls 90
  to 170 in town, about 560 in the wood (each of the column's dead is its own figure).
- **Online in 2.5D.** Town presence and chat pass with 2.5D on (scripts take `LOOK=3d`). The party
  run's "Sam's walk is smooth" step fails at HIGH under SwiftShader only (frames near 300 ms, five looks
  in 1.2 s), and passes at LOW and in FLAT; worth watching on Kyle's phone.
- New words (for the lore keeper and line editor): QUALITY: LOW, QUALITY: MID, QUALITY: HIGH.

## 2026-11-02: the 2.5D view (low-res 3D) on jobs, and options under a gear (Kyle; Claude Opus 5.5)

Kyle saw the 2.5D look test (low-res 3D that reads as pixel art) and wants that style. Step 1: a second
renderer for the same room, opt-in, on jobs only. Then: "can we have a button someone can get to from
options to toggle between?", the ? panel had "WAY too much info", and he calls the views FLAT and 2.5D.

- **Same room, second drawer.** `client/three/` (about 30 small files) draws the `ArenaRoom` the pixel
  scene draws, nothing else: no sim change, no relay or coop change. Telegraphs are shaped from the
  enemy's `attack` (circle, sector by `arc`, lane, an arrow's line), so the red you see is the one
  judged; the white edge is the same parry window the 2D scene uses (`parryWindow + lenience`).
  Positions ease between ticks with `room.prev` and `alpha`, as scene.ts does. Online guests draw the
  room they're sent; buildings are keyed by their place in the list, since a guest's blocks are new
  objects on every update.
- **The look** (copied from the look test, three.js r128 there, 0.160.0 bundled here, never a CDN):
  painted at a low resolution and scaled by a whole number with CSS `pixelated`; Lambert light banded
  into five steps with a 4x4 Bayer dither (the 2D pass's bands) and point lights falling off as the 2D
  pass's do (`post.ts` patches three's attenuation); a post pass outlines silhouettes one pixel dark from
  depth and lets glowing things (alpha below 1) bleed; 36 degree orthographic three-quarter camera
  following the hero, snapped to the pixel grid. Colours are hex as painted (colour management off).
- **What's reused rather than redrawn.** The floor and the back wall's face are the 2D painting itself
  (`paintMap`), laid on the ground and the wall, so floors, soil, marks, water and the way out match;
  blood decals are painted into that floor as they're spilled. The effects are Fx's own (sparks,
  rings, lightning, gore, words), each re-projected from where the room put it onto a low-res overlay
  canvas with the 3x5 pixel font, so every event the 2D view shows has a 3D place without new code.
- **Seeing your hero.** Heroes draw last, on their own layer: first as a dithered pale silhouette
  where something nearer hides them, then as themselves, so only hidden parts stay a silhouette. Behind
  a building its roof comes off and its walls drop low.
- **Lazy and live.** three.js and the view are a separate chunk loaded the first time 2.5D is wanted
  (the flat game's bundle grows about 2 KB). Switching is live mid-fight: only which canvas shows
  changes. `?look=3d` (or `2.5d`) starts in 2.5D; the switch is remembered in localStorage. Town and the
  wood stay flat for now, even with 2.5D on.
- **Quality knob** (`three/look.ts`): `?q=low|mid|high`, mid on touch devices, high otherwise. Pixel
  count (40k, 62k, 90k), point lights at once (4, 8, 12, a fixed pool so shaders never rebuild), the
  moon's shadow map (none, 1024, 2048). `?perf=1` shows draw ms, frame ms, size, draw calls.
- **Measured headless (software GL, SwiftShader; real GPUs will be far quicker).** Phone 390x844@3:
  flat 31 ms a frame; 2.5D low 36, mid 106, high 131. Laptop 1280x800@2: flat 17; 2.5D low 37, mid 87,
  high 132. The JavaScript side of a 2.5D frame is 3 to 5 ms; the rest is SwiftShader rasterising
  (shadows and lights dominate). The look test ran at 4.2 ms on Kyle's laptop; phones unknown, so the
  phone default is mid and low is there if it stutters.
- **Options under a gear.** The ? button and its long help panel are gone (removed cleanly; nothing
  read them). A pixel gear (inline SVG) in the corner row opens a small box: VIEW: FLAT / 2.5D, HEROES,
  SOUND, MUSIC, TIPS (moved out of the corner row, same ids and handlers). A tap outside closes it.
  Mouse aim in 2.5D divides the vertical by the floor's foreshortening (`heroScreen` gives a fourth
  number; the flat scene's is unchanged).
- New words (for the lore keeper and line editor): VIEW: FLAT, VIEW: 2.5D, "2.5D shows on jobs for
  now", SOUND, MUSIC.

## 2026-11-02: knacks per class, a free reset, a pick you can't miss (Kyle; Claude Opus 5.5)

Kyle: "Knacks is also sort of hard to see / tell that it's there. It's hard to know that I have a
choice currently." "We should let people reset their knacks whenever, for free." "Knacks should be
different per class. Movement speed, dodge distance, throwing dagger damage, or the window for a
'perfect' attack, etc."

- **Each class its own four chains of three** (`shared/chains.ts`, `shared/perks.ts`); the shared BODY
  and BREATH rows are gone (no one row fit every class). Ids carry the class's letter (w_, r_, g_, m_,
  h_). Warrior: GUARD (parry +0.04 s, block -25% breath, counter +25%), PLATE (+20 health, 8% less
  hurt, +6% speed), HEAVY BLOW (charge 15% faster, full charge +15%, knock +25%), SKILL (skill and
  relic 20% sooner, shield charge and war cry +20% further, +40% longer). Ranger: BOW (draw 15% faster,
  a shot loosed on the white flash +20%, the flash +0.15 s), JUMP (20% sooner, 20% further, +6%
  speed), SNARE (25% sooner, holds 25% longer, three down), HOUND (25% sooner, bite 7 to 9, one more
  bite). Rogue: DASH (20% less breath, 15% further, the last-moment window +0.08 s), BACKSTAB (behind
  from further round, backstab +15%, ambush +25%), KNIVES (6% quicker, held blow +20% at full: the
  thrown dagger, lunge or bolt, held 15% sooner), SHADOW (+6% speed, shadowstep and relic 20% sooner,
  seen creeping 20% later). Mage: BLINK (20% sooner, 20% further, image +1.5 s), CHANNEL (primed
  1.5x to 1.75x, 15 breath back a turn, two primed spells), SPELLS (charge 12% faster, bursts 20%
  wider, +6% damage), BREATH (breath back 25% faster, blink 20% less breath, casts 6% quicker).
  Healer: GUARD (parry +0.04 s, block -25% breath, counter window +0.6 s), MERCY (heals +12%, heal
  reach +20%, the blow before the healing blow heals for half), SMITE (charge 12% faster, smite stun
  +0.4 s, full charge +15%), SANCTUARY (sanctuary and relic 20% sooner, blessing +25%, blessed ground
  and ward +1.5 s). Modest by test: no whole tree moves a share past a third.
- **One source.** Every knack number is read through `sim/knacks.ts` (parry window, counter window,
  release window, dodge reach and breath, last-moment window, behind angle, creeping sight, snare,
  hound, shield charge, war cry, blessing, ward, heal reach and size, burst, smite stun) or the gear
  stats (`sim/gearstats.ts`, which now caches the knack sum). The telegraph's white parry flash
  (`client/scene.ts`) now uses the same `parryWindow` the room judges (it left out gear's PARRY
  before), and a bow's white at full draw (`client/actors.ts`) shows exactly the clean-release window.
  `tests/knackfx.test.ts` runs each of the 60 steps through what the room does and checks it moves.
- **Reset, free, any time out of a fight**: RESET on the knacks screen (with a confirm), wherever it
  was opened from, while in town (`Game.knacksOpen`: mode town; the job's end is shown in town). Every
  knack comes back as a pick. Because of that, picks are taken on the knacks screen itself too, not
  only at the trainer (the trainer's pick rows stay). On a job the screen is a look only and says to
  take it back in Wickhold.
- **A pick you can't miss.** A pulsing gold dot with the count on PACK (any element with
  `data-picks`, set by `client/knackcues.ts`, so it moves with the button) and on KNACKS in the pack;
  "A knack to pick." and a PICK A KNACK button at the job's end; LEVEL N: A KNACK TO PICK once at the
  hero's feet back in town (under them, so the town banner can't cover it); the town banner says
  (A KNACK TO PICK). With picks waiting, the knacks screen opens with the two offers at the top, in
  full, each with TAKE.
- **Old heroes** (`fitPerks`): each old knack lands on the class step that moves the same number
  (a Warrior's guard, ironhide, counter, tough, scarred, fleet, heft, heavy hands, relic-wise; a
  Ranger's steady hand, footwork, fleet; a Rogue's shadowed, quick hands, fleet, relic-wise; a Mage's
  focus or footwork, deep charge, potent, endurance; a Healer's guard, ironhide, devotion, mender,
  relic-wise); anything else, or a second old knack on one step, comes back as a pick; and taken plus
  waiting is never less than the levels gained.
- **New words for the lore keeper and line editor**: every chain and knack name and line in
  `shared/perks.ts` and `shared/chains.ts`; the screen's words in `client/treewords.ts`.

## 2026-11-02: chat, world and near in town, the party on a job (Kyle; Claude Opus 5.5)

Kyle: "in-game chat, local and world (world logs down below for when you're in the world area, local
is just near you), but it needs to work on mobile and desktop."

- **Where it's heard.** WORLD: everyone in Wickhold, in the log. NEAR: only those within 8 tiles in
  the same place (`NEAR` in `client/chat.ts`), as a bubble over the speaker and in the log tagged
  NEAR. On a job with friends: the party, bubbles and log, tagged PARTY. Alone on a job, in the wood
  or the yard, and offline (the one-file build): no chat, and no CHAT button.
- **Carried on what's open.** Town lines ride the town's peer room (WICKHOLD1, `townfolk.ts`; its
  `onWord` is wrapped, so parties still get their words). Every listener decides for itself whether a
  NEAR line is close enough, from where the town says the speaker stands. The party talks in a peer
  room of its own, the job's room code plus CH (`partyRoom`, `client/chatnet.ts`), so coop.ts and the
  job's socket are untouched. Payloads are `{k:'chat', c, n, t}` or a quick line as its number `q`;
  well under the relay's 64 KB MAX_MSG. The relay is unchanged.
- **Safety** (`shared/chatrules.ts`, `shared/chatfilter.ts`): 120 characters of plain text, control,
  zero-width and direction characters stripped; one line per 1.5 s and five per 15 s, held by the
  sender (it says "Slow down a moment.") and dropped by listeners past a slightly looser pace (lines
  bunch in transit); a short filter that stars slurs and the very worst words in their common
  spellings, and leaves Wickhold's own swearing alone (voice.md); MUTE by tapping a name in the log,
  per device, by player id (`relic.mute`). Everything heard is cleaned again on arrival and only ever
  set as textContent.
- **Laptop.** Enter opens a box at the bottom left over the log; Enter says it, Esc shuts, Tab
  switches WORLD and NEAR, 1 to 8 in an empty box say a quick line. The log shows its last six lines,
  fading after 14 s, and all of it while the box is open. CHAT in the corner does the same.
- **Phone.** CHAT sits just under the corner row. In town it opens a panel at the top: the box first
  (so the keyboard doesn't cover it), the quick lines, then the log. Shut, the town shows the last two
  lines faint under the banner; tap them to open the panel. On a job it opens a strip of the eight
  quick lines and TYPE, at the top, away from the thumbs. A dot on CHAT says something new was said.
- The hero stands still while the box or panel is open (`chat.typing` joins the `still` intent in
  main.ts); the world goes on. The quick strip doesn't stop you.
- **Bubbles** (`client/bubbles.ts`) are page elements just after the canvas, so the HUD, banner and
  buttons stay over them, and each one moves aside or under the speaker's feet rather than sit under
  the banner, the HUD or a button.
- LEAVE in the corner now sizes to its word (it spilled into SND on phones and laptops).
- Tests: `tests/chat.test.ts` (filter, pace, cleaning, escaping, the wire). `scripts/chat-online.cjs`
  (two browsers, port 8795): world line heard; typing w, a, s, d never moves the hero; NEAR not heard
  from 14 tiles and heard as a bubble from 2.5; the phone's panel sends; mute holds; on a job the
  phone's quick line and the laptop's number key and typed line reach the other, as bubbles.
- New words, for the lore keeper and line editor: CHAT, WORLD, NEAR, PARTY, SAY, TYPE, X; "Say
  something"; "Slow down a moment."; "... is muted on this device. Tap the name to hear them again.";
  "... can be heard again."; quick lines Help me up! Follow me. Wait. Ready. Thanks. Over here!
  Going in. Behind you!
- Not yet: a typed line isn't spoken aloud or blipped; no chat history across reloads; the filter
  doesn't catch letters spaced out with spaces.

## 2026-11-02: the pack as a paper doll, the vault, Tobin's stall, the forge reworked (Claude Opus 5.5)

Kyle: "redesign how you can access your pack", "spend money to make your pack bigger in town", "clear
what items are on what body part", "easily see and compare items, sort of Castle of the Winds or
Diablo", "a somewhat ruined bank in town", "the forge is for upgrading existing weapons or melting
things down", augments "unavailable or blocked out", "a generic merchant who you can sell things to
and buy things back from for a limited time".

- **The PACK** (`client/pack.ts`, `cells.ts`, `itemicons.ts`): your hero's sprite with a square on
  each part: RELIC and SKILL over HAND and BODY, two RINGs, the three-potion BELT under; the pack
  beside it, one piece a square, its tier's colour on the border, a small pixel picture for what it
  is (blade, bow, staff, mail, ring) drawn in code. Tap a piece (or point at it with a mouse) and its
  card sits beside the card of what you wear in that slot, then every number the room uses, now and
  with it, and the change in green or red. WEAR / DROP (on a job; in town nothing drops, the card
  says where to sell or store it). The SKILL square is shown, not changed. Dragging still works.
  With the pack open the hero stands still (the world doesn't); gear changes still go through as
  intents. Relics found but not carried: CARRY buttons on the RELIC square's card.
- **Pack size** (`shared/bags.ts`): 8 to start, then 12, 16, 20, 24 for 100, 250, 500, 900 gold,
  sold by Tobin. The room checks the hero's own `bagSize`: a full pack can't take loot or a piece
  taken off, and the loot card says "Your pack is full. Drop something to make room." Treasure at a
  job's end that won't fit still sells for 20 as before.
- **The vault** (Keeper Edda, the counting house, west of the square above the infirmary): roof
  fallen in at one end since the siege, the vault under the floor. 16 shelves, then 24, 32, 40 for
  150, 400, 800 gold. Per hero, in the save (and so in the recovery code's copy). Hungry gear can't
  go in (it can't be dropped either).
- **Tobin the pawnbroker** (the far stall on Market Row, always there; Dessa's stall still waits on the
  council): buys any packed piece for `sellValue` (hungry gear never), and holds it for you to buy
  back at what he paid until you come home from your next job (`runs` moves on), the newest eight.
  Halvard no longer buys gear.
- **The forge**: Halvard's anvil is a panel of your worn and packed gear; tap one for UPGRADE (the
  existing `UPGRADE` gold and steel, tier caps) or MELT DOWN (packed only, `STEEL` by tier). His rack
  of Fine gear stays behind a button. Hungry gear: neither. Ivo isn't setting elements for now (one
  greyed button a relic, a line from him); what's already set keeps working; carrying a relic,
  rerolls and frost flasks stay.
- **Old saves** (`fitStores` in `client/save.ts`): an 8-cell pack (what it always held), an empty
  vault, nothing pawned. More than 8 pieces would size the pack up to fit, as far as 24, and the rest
  goes in the vault, however full. Nothing is deleted.
- New words are all in `client/storewords.ts` for the lore keeper and line editor; Edda, Tobin and the
  counting house are new and want lore review.

## 2026-11-02: going indoors on your own (Kyle; Claude Opus 5.5)

Kyle, after a job with friends: going into a house dragged everyone in with you. Now each player is
in whichever room they walked into, the street or a house off it, and goes in and out on their own.

- **Who's where** (`src/client/jobrooms.ts`): on a job the leader's game keeps the street (the job's
  room) and every house anyone's been in. Each hero lives in exactly one of them and is carried
  through a door as it is (health, potions, cooldowns, its clock moved on by `rebase`); a goblin or
  crate held overhead is put down first. The leader's own going in and out is the same move, so the
  old kept-aside outside hero is gone on a job (town buildings still work the old way).
- **Every occupied room runs.** Each tick the leader's game runs the street (always: fires burn,
  dens breed) and every house with a player in it, then its own. Kills in any of them pay. Friends'
  intents go to the room they're in. Friendly fire, HELP UP and the arrival grace need no change:
  each room only has the heroes in it. The grace on a fresh house goes to whoever goes in first.
- **Friends' doors are the leader's to decide**, the way all of the fight is: a friend walking up
  into a door goes in, out the bottom of a house comes out (`Game.friendDoors`, `doorPushed` uses
  the leader's own reach). Phones walk up into doors on a job, as the leader does (there's no ENTER
  button out on a job), so no new intent was needed.
- **Followers:** the goblins after whoever went through follow them, as before. "Big ones can't"
  is now a rule, not luck: only plain goblins (not brutes) and spiders fit through a door
  (`followers.ts small`). Before, an unnamed butcher close behind you could have come in.
- **Ambush:** it was never about the whole party; it comes when someone freed is brought out of a
  door (sim/survivors.ts, the room's door Rng). It still does, per door and per player: whoever
  walks out brings the freed within reach of them, and the street's next tick may bring goblins.
- **The way on** (`together`) waits for everyone: a player indoors on their feet (not gone quiet,
  not down) holds the party. A friend down in a house is carried along, as one down in the street is.
- **Bandwidth** (`coop.ts`): friends are grouped by the room they're in; each room has its own
  encoder and its own "last whole copy", and each group is sent only its room (to `*` when everyone's
  in one room, else to each id). A friend going through a door has a different room number
  (`Game.keyOf`) and gets the whole of the new one. Events are kept per room.
- **Over the door:** the street's patch carries `dm`, who's in each house (name and class). Anyone
  outside sees each name just above that door in the class's colour, under the quest mark's diamond
  (`doormarks.ts`), the leader too (drawn from `Game.doorMarks`). Indoors, nothing extra.
- **Handing the job on:** the whole-job save is now the street plus every house anyone has been in
  (`houses: [blockIndex, saveRoom][]`), not the leader's current room (which, if the leader was
  indoors, used to hand on the house as if it were the street). A friend who takes over stays where
  their hero was, indoors or out; the old leader's hero is let go from whichever room it's in. I
  chose every visited house rather than only occupied ones so dead goblins stay dead after a
  takeover; houses are small.
- **Tests:** `tests/split.test.ts` (7). Stress scenarios 15 to 21 (`scripts/stress/split.cjs`): a
  friend in alone (the leader sees the name over that door, the goblins in there hurt the friend on
  both screens), the leader in alone (the friend keeps walking about outside), leader and friend in
  two houses with a third outside seeing both names, a small goblin follows and a butcher doesn't, a
  friend frees someone and brings them out (counted on both screens), the leader leaves while a
  friend is indoors (the friend takes over, still inside, walks out and finishes), and the way on
  waits for the friend indoors. They set out on a village street through a test hook
  (`window.__villageJob`). The stress, town-online and party-online scripts take a port from
  `STRESS_PORT` / `ONLINE_PORT` so parallel worktrees don't collide.

## 2026-11-02: the friend who froze when a Florida friend led (Claude Opus 5.5)

Kyle played with two friends in Florida. When he led, every job worked; when a Florida friend led,
Kyle loaded in and froze (LEAVE still worked), his hero stood still on the leader's screen, and the
other two played on. Twice. The relay logs and the meter lines say why:

- **Two instances had the same name.** The relay named each instance with `Math.random()`, and
  Vercel starts instances from a snapshot whose Math.random runs the same numbers: the meter line
  (one per instance every 5 minutes) for "evqgzyea" came at 20:45:03 and again at 20:45:49, two
  instances with one name (n0eunt05 too). The "sfo1"/"iad1" in the logs is where a request came in,
  not a separate machine. Kyle's socket landed on one "evqgzyea", the leader's and the other
  friend's on the other; each took the other's messages for its own echo and dropped them. Kyle
  never heard "hosted" or a single patch; the leader never heard Kyle (the still hero was his town
  figure, brought along when the job started). When Kyle led, the instances happened to differ.
  Joining before the leader's claim wasn't the cause: the stress scenario passes that way once the
  names differ.
- **Fix:** each instance is named by Redis `INCR rl:inst` (a crypto suffix on top; crypto and the
  clock if Redis is down), and a connection's nonce is the instance's name and a count, so nothing
  hangs on Math.random (`api/_relay.ts`).
- **The count that kept messages home is gone as a judge.** Publishing only while another instance
  listened leaned on PUBLISH's count; a count that left someone out would keep messages from a friend
  who only listens (only a probe every 2 s got through). Now instances say so themselves
  (`api/_presence.ts`): `here` on a room's channel when one gets its first player there (sending
  everything for half a second meanwhile), an answer to any newcomer, `here` again after 15 s of
  saying nothing else, and `away` when its last player goes. Messages go out while another instance
  was heard in the last 40 s. A count above one can still open a room, never close it. On one
  instance that's one `here` per room every 15 s, fewer commands than the old probe every 2 s.
- **Also:** the relay listens to a socket from its first moment (what a player said while it was
  still being set up was dropped); a room's set is only taken down if it's still that room's set;
  a friend who hasn't heard the leader in 5 s reconnects (`coop.ts`, REJOIN), so a socket stuck on a
  deaf instance gets another go before anyone takes the job on. Backends moved to `api/_backends.ts`.
- **Tests:** `tests/relaybus.test.ts` (instances with the same Math.random, a friend in before the
  claim; a count that leaves out the other instance; a lone room publishes nothing). Both fail on
  the old relay. Stress scenario 14 (`scripts/stress/order.cjs`): a friend's socket there before the
  leader's claim, on the other instance, a third player with the leader. `scripts/online-server.ts`
  now makes its two relays with the same seeded Math.random, as Vercel does, and takes `inst` and
  `hold` on a socket's URL (pick the instance, hold the connection back); scenario 14 froze exactly
  as Kyle did (`info nohost`, never `hosted`) before the fix.

## 2026-11-02: quest marks, so you can see what the job is (Kyle; Claude Opus 5.5)

Kyle, after playing with friends: on a mission it wasn't clear what the objective was, or which things
were objectives; smashing a larder was fun but nobody knew what a larder was. Now every thing the
room's goal is about has a small gold diamond bobbing over it, on the glow layer so it reads in the dark,
with a little gold light under it.

- **One list.** `src/sim/targets.ts` `targets(run, room, houses)` is the room's objective things right
  now: cages out here; the door of any house with someone caged or freed inside; where the freed are
  brought out (the way in, or a house's door from inside); a middle room's spider nests; and in the
  last room, by the job, the larder's racks, the dens, or the named butcher (hunts, the story, a deep
  dive). Chests and plain goblins never. The goal text counts racks, dens and the boss with the same
  helpers (`racksLeft`, `densLeft`, `bossOf`), so a mark never points at something that doesn't count.
- **The mark** (`src/client/questmarks.ts`): gold like the way on (`#ffd860`, dark edge), never the red
  of a telegraph; it goes the moment its thing is done. When none is on screen at all, a gold point
  at the screen's edge toward the nearest, sharing `edgeMark` with the marks for the freed left
  behind (`wayout.ts`). The cage's old yellow "!" is gone: the quest mark replaces it.
- **The banner says what it is**, in a few plain words: "Smash their food store, the larder (3 racks
  left)", "Burn out their huts, the dens (3 left)". New player-facing words: `LARDER_IS` and `DENS_ARE`
  in `sim/goal.ts`, waiting on the lore keeper and line editor.
- **Friends see the same marks.** A friend's game builds the list from what the leader already sends
  (the room, the run, the houses by door); nothing new on the wire.

## 2026-11-02: the party stress test, and what it broke (Kyle; Claude Opus 5.5)

Kyle played online with a friend and things came apart when he died: the relay logs show his page
stopped (hidden while he lay there), the friend asked to take the job on, the relay refused because
his page still pinged, and they ended up in two different jobs. `npm run test:stress`
(`scripts/stress-online.cjs`, helpers in `scripts/stress/`) now plays it out in real browsers against
the local relay (two instances, 120 ms of lag), fresh players each time: a friend leaving, the leader
leaving (with one friend and with two), the leader's page hidden 30 s, suspended outright, closed and
reloaded, a friend reloading and a friend gone over a minute, every way of falling in a party, and
leaving alone. A hidden page runs its timers once a second (as Chrome does); a suspended one runs
nothing till it thaws (timers, frames and the socket's news held, then all at once). It prints a JSON
report and fails on any failed step or page error. What it found, and the fixes:

- **A frozen leader came back to a second job.** A phone that suspends the leader's page outright: the
  friend takes the job on (right), but the leader's page, thawed, kept running its own copy. The relay
  had told it someone else hosts; only a page that had itself taken a job on listened. Now every
  leader does (`Game.stepDown`): told a friend leads, it closes its room and follows them.
- **A leader's reload left the friend stuck.** The reloaded page came back as a follower of nobody
  (its session says "I lead"), while the relay, seeing the same player, gave it the room; the friend's
  takeover was refused, it followed a leader running nothing, and the job was lost 35 s later. Now
  the leader keeps the whole-job save in the browser too (`session.ts keepJob`, every 2 s with the
  one sent to friends), and a reload leads again from it (`Game.resume`, `leadFrom`); if a friend
  already took over, the relay says so and it follows them.
- **Following a new leader read their changes without their room.** With three, the friend second in
  line could hear the new leader's patches before hearing they lead, then apply changes to an empty
  copy (one goblin of nineteen, then a crash). A follower now waits for a whole room after changing
  leader, and a new leader gets their own time before anyone thinks them gone too.
- **A leader who left stood in the way.** Taking a job on from a leader who pressed LEAVE kept their
  hero standing where it was for a minute, and the way on takes the whole party. Now their hero goes
  (`CoopGuest.left`). And a friend not heard from in 5 s (a closed tab, a locked phone) no longer
  holds up the way on (`CoopHost.away`); their hero still comes along to the next room, in case
  they're back.
- **A friend away over a minute came back to nothing.** The leader lets their hero go after a minute;
  back, the friend's page had no hero to draw and stopped with an error every frame. Now it keeps
  drawing its hero where it was and says hello every 2 s till the leader brings it back.

Fine as they were: a friend's LEAVE, the hidden leader's room running on (nobody takes over), the
closed tab taken on, a friend's reload, getting each other up (G, and HELP UP on a phone), getting
yourself up once, out, the way on without the down and out, everyone out, and LEAVE alone (half the
gold). No new player-facing words.

## 2026-11-01: three kits for every class, and the belt turns on a long press (Kyle; Opus 5.5)

Kyle: other weapon types for all the classes (fun without needing many upgrades), and a long press on
the potion button to switch between them. The Rogue and the Cleric had one kit each; now three, with
the class rules kept (a Rogue dashes and never blocks; a Cleric guards, never dodges, heals on a blow,
and carries the censer's coal whatever is in hand). Numbers in `shared/kits.ts`.

- **Rapier** (Rogue): three thrusts at 1.85 to 2 tiles (9, 9, 13), each finding one goblin; 0.8 head
  on and 1.8 from behind (daggers 0.5 and 2.5), so it's the honest one. Held (0.7 s): a 2.6 tile
  lunge, 16 to 36, through at most two in a line (`Swing.hits`). Dash a little shorter (3.8).
- **Hand crossbow** (Rogue): a knife (two stabs and a slash, 8, 8, 12; 0.55 head on, 2.2 behind). Held
  (0.45 s, walk at 0.8 while aiming): a light bolt, 12 to 22, that dazes a small goblin 0.6 s (never a
  butcher), so the knife goes in at full. Keeps the long dash.
- **Sword and censer** (Cleric): two cuts (11, 11), then the censer comes round in a 170 degree arc,
  heals the party 8 and sets goblins burning (`Swing.burn`). The best Cleric guard (12% through, 0.34 s
  parry, 165 degrees). Held (1.1 s): the censer whirled all round, 16 to 36, burning, healing 8 again.
- **Flail** (Cleric): two slow sweeps (200 and 220 degrees, 16 and 20) that come over a shield-bearer's
  board (`overShield`); the second heals 9. Held (1 s): brought down overhead and a smite cracks out
  up to 1.7 tiles ahead, 1.7 wide, 26 to 60, stuns a second. Kills burst, like the mace (`blunt`).
- **Getting them**: as before. `CLASS_KITS` feeds treasure and drops (`rollGear`), Halvard's and
  Dessa's stalls list every kit of your class, traits fit (`traitsFor`). The first kit stays the
  plain one in hand. To switch: the pack, as before, and tapping the hand now shows SWAP TO for each
  kit of your class you carry.
- **The belt turns** (`client/potionpress.ts`, `sim/pack.ts turnBelt`): a tap of the potion button
  (or Q) drinks as before, now on release; held 0.4 s it turns the belt instead (the next kind comes to
  the front, its name pops up, nothing drunk) and keeps turning every 0.45 s while held. Laptop: hold Q.
  It goes to the room as its own press counter (`Intent.beltSeq`, optional so an older guest still
  reads), so two turns in one tick both count and a guest's work the same.
- **Drawn** in `client/heldkits.ts`: a thin rapier with a gilt hilt; the knife in hand and the hand
  crossbow at the off hand, up to the eye on a hold; the sword with the censer at the off hand, the
  censer on its chain throwing coals when it's swung or whirled; the flail's head hanging at rest,
  spinning overhead with light gathering on a hold. Each has its own swing and hit sounds.

## 2026-11-01: the back of the pack: hexers and drummers, and a tougher mix for a bigger party (Kyle; Opus 5.5)

Kyle: enemies harder with more people, and variety (small ones, spears, big ones, ranged, casters,
buffers). Two new small goblins, each with one counter; numbers in `shared/backline.ts`.

- **The hexer** (`sim/backline.ts`): staff with a skull fetish, bone horns. Keeps 4 to 7 tiles off
  (runs when you close, comes in when you're far) and calls the ground up under you: a red circle with
  a striped edge (nothing blocks it) put down where you stood, 1.15 tiles across the radius, that
  bursts after 1.25 s for 16. The circle is the one judged (`attackCovers`), and it stays put. Counter:
  step out or roll; any blow on the hexer breaks the spell (it flinches like any small goblin); 20
  health. Goblins standing in the burst take 0.8 of it. A roll through it doesn't stagger the hexer
  (it's far off). The fetish glows green and lights the hexer through the wind-up; the staff rises.
- **The drummer**: a drum slung at the hip, a bone stick. Hangs about two tiles behind its pack and,
  while it stands and beats, every other goblin on its level within 4.5 tiles is roused: wind-ups at
  0.8 of the time, 1.2 times the pace, 1.2 times the damage (locked into the attack when the wind-up
  starts, so the telegraph never lies). It runs from anyone within 3.5 tiles and the drum stops while
  it runs; it pokes with the stick if cornered; 24 health. Dead, stunned, frozen or netted, the drum
  stops on the next tick (`rouse`, once a tick before anyone moves). You see a faint ring at its reach,
  a ripple out to it on every beat (0.5 s) and a pulse under every roused goblin; you hear the beat,
  louder the closer you are. Counter: kill it first, or rush it so it runs.
- **In jobs** (`shared/roster.ts`, on its own seeded stream so room layouts are unchanged): each small
  goblin with a blade rolls 2% + 4% a room in + 1.5% a point of ruin (+2.5% long job, +2.5% deep) to
  be one. At most 1 in a first room, 2 in the next two, 3 after; always two blades left, and a drummer
  only with three to drum for. Over 200 days of boards: a first room has one about one time in six on
  an easy short job, about half the time on the worst long ones; nearly every fourth or fifth room of
  a long job has one, often two or three. The wood is untouched.
- **A bigger party** (`toughen`, from `scaleFoes`): the count scaling stays. A pair gets no more
  hexers or drummers than the room had (copies of them come plain). Three or more: each plain extra
  goblin has 15% a player past two to come tougher (lunger 3, shield 2, brute 2, hexer 1, drummer 1 by
  weight), with at most one more of the back of the pack than the room had. Run rooms and door
  ambushes are seeded, so a party sees the same goblins.
- **Cost**: the circle telegraphs (slam too) are now drawn in row runs instead of pixel by pixel. A
  yard fight with two hexers and a drummer runs about half a millisecond a frame over the same fight
  with plain goblins on the phone profile (4.0 to 4.6 against 3.6 to 4.0 ms, noisy).
- No new player-facing lines; the kinds are never named on screen.

## 2026-11-01: the sprites posed in parts, and a charge that reads through the weapon (Claude Opus 5.5)

Kyle on the 2x figures: doughy and soft, and the idle bob jumped. He picked the middle way: the same 1x
sprites, posed part by part. And on holding attack: it stretched the character instead of focusing on
the weapon; a charge should draw in, a release knock back a little, and neither touch the face.

- **Cut, not redrawn** (`client/joints.ts`): each sprite's own canvas (same pixels, same one-pixel
  outline and shading) is split by region into the off arm, the legs (left and right), the body, the
  head and the weapon arm. Every pixel goes to one part, so a body at rest is exactly today's sprite
  (a test holds it); a body with nothing moved is still drawn whole, in one call.
- **Posed a whole pixel at a time** (`client/figure.ts`): lean moves the head and the body half as
  much; a crouch lowers the body onto the legs (rising, the legs grow a pixel at most); the weapon arm
  reaches along the blow (`reach`) and lifts (`raise`); the whole shifts for a lunge or a recoil;
  afterimages and flashes as before, flashes part by part. Weapons are drawn at the weapon hand.
- **Heroes, charge and release** (`client/heropose.ts`, `held.ts`): no lean, crouch or stretch while
  winding up or charging, so the head never moves. The weapon arm draws back and the weapon comes up;
  a blade at full shivers in the hand; the charge's motes gather at the hand. Casters: light draws in
  to the wand, staff or rod tip, faster and whiter as it fills, and the tapped spell's half-second cast
  raises the casting arm the same way. Release: the arm snaps through and the body is knocked back one
  or two pixels against the blow or shot; the sword's edge and the shield flash; casters flash at the
  tip. The Rogue's thrown dagger is drawn back over the shoulder and the arm snaps forward on the throw.
- **Goblins and the butcher** (`client/foepose.ts`): lunges reach with the arm instead of stretching;
  the butcher's cleaver goes up as it comes back for the cleave and over his head for the slam; the
  brute lifts its club.
- **No idle breathing.** Standing still is still; walking keeps its one-pixel bob.
- **Cost**: within noise of main (yard fight, three runs each: phone 5.1 against 4.9 ms a frame,
  laptop 4.2 against 4.2; town about the same).

## 2026-11-01: anticipation and payoff in the bodies (Claude Opus 5.5)

Kyle loved the world effects on big blows (the charged magic burst, the butcher's slam) and asked for
the same in the bodies: poses before a blow, a payoff when it lands, better reactions to hits. Drawing
only; the room is untouched and every pose is read from state it already has (act, actT, the swing's
windup/active/recover, the charge, hitstop, the knockback slide, hitAt).

- **Pose data, not pictures** (`client/motion.ts`): every number in one table, by phase (windup,
  charge, release, contact, recover, hit, stagger, land, stun, tumble). A pose is lean (the top of the
  body, in pixels), crouch (negative rises tall), stretch along a direction, a whole-body shift, a
  lift off the ground, a flash and its tint, and an afterimage. Today one sprite is bent by it
  (`draw.ts` `blitPose`: whole-pixel stretch with the feet fixed, the top third shifted by the lean and
  the middle by half); the jointed 2x sprites coming next can read the same pose per part.
- **Heroes** (`client/heropose.ts`): pulled back and dipped in a wind-up (a quick one gets its share);
  crouching deeper and leaning back as a heavy charges, a shiver at full; the release snaps out (a
  step in, stretched along the blow, an afterimage where the body was) and holds through the hitstop,
  where the swing's trail turns white across the whole arc the room judges; shots kick back instead
  (the staff's orb hardest). Hit: white through the hitstop, then a fading red, snapped along the
  push. Heavy armor that doesn't stagger still flashes and flinches (a drop in health says it landed).
  A squash on landing a roll, jump, dash or slam.
- **Goblins and the butcher** (`client/foepose.ts`): wind-ups rear back and coil, scaled to how long
  they are; the lunger coils low and shivers; the butcher rises tall hauling the cleaver back then
  coils before the chop, crouches before his leap, stretches in the air, lands flattened and rises
  again; the Stoker coils and paws before his run. Hit: a white flash and a snap back along the push;
  small goblins hit hard go head over heels once with a hop; the butcher staggers back on his heels;
  the stunned sway.
- **The view** jolts along a blow that hits you and nudges along your heavy as it connects
  (`camKick`, added to the shake in `scene.ts`).
- **Dust** (`client/dust.ts`): puffs at the feet when a roll ends, a heavy steps out of its charge, a
  body turns sharply at speed, a slide from a blow stops, the butcher pushes off, the Stoker sets off.
- **A fix found on the way:** goblins' hit flash, their health ring after a hit, the dummies' wobble
  and the parry glint compared the wall clock to room time, so they almost never showed. Drawing now
  has the room's time (`Ctx.t`) for anything the room stamped.
## 2026-11-01: the music, played on recorded instruments (Opus 5.5)

Kyle: "the music can be more high def and interesting ... almost biblical or epic, with more gentle
themes for dark woods or town." He chose real recorded instruments, a small bundled set, free licence,
and new pieces for each place.

- **The instruments** (`public/music/`, 86 mono MP3s, 2.2 MB, credits in `public/music/CREDITS.txt`):
  VSCO 2 Community Edition (CC0) for the string sections soft and strong, solo double bass, pizzicato,
  short bowed cellos, horn, tuba, harp, flute, timpani, bass drum, glockenspiel and gong; the
  Versilian Community Sample Library (CC0) for the pipe organ, tubular bells and frame drums; and the
  FluidR3 soundfont's Choir Aahs and Voice Oohs (Frank Wen, CC BY 3.0, via midi-js-soundfonts) for
  the choir, the one set that asks for credit. A few notes per instrument (every 5 to 7 semitones,
  pitch-shifted between); held sounds loop. `scripts/make-samples.py` remakes them all from the three
  libraries: trimmed, levelled to one loudness, swells evened out, loops crossfaded where the wave
  matches, a tail past each loop so a browser's MP3 delay can't click; `src/client/samplemap.ts` is
  its output. MP3 because every browser decodes it (Safari and Playwright's Chromium included).
- **Playing them** (`sampler.ts`, `orchestra.ts`): fetched from our own site once sound is unlocked,
  four at a time, the most used first; nearest note, playbackRate, attack and release. An instrument
  plays recorded only when all its notes have loaded; until then (or if any fail) the old synthesized
  instrument stands in, so the music never goes silent. Strings switch to the strong recording at
  velocity 0.75 and up.
- **The pieces** (`score.ts`, `scores-home.ts`, `scores-wild.ts`, `scores-boss.ts`, played by
  `track.ts`): all 30 rewritten, keeping their names (the bard lists them). Each has a written
  8-bar theme over chords that mostly hold two bars, and parts with roles (bass, chord voiced to move
  smoothly, a picked pattern, the theme, an answer or a made-up line, drums, bells). A form of
  sections (opening, theme, theme in other voices, answer, quiet) loops with seeded chance: sections
  swap, long notes get a turn, timing breathes. Town warm (harp, strings, flute), houses small (harp,
  pizzicato, flute), church organ and voices, yard horn and frame drum, villages and farms sad, fields
  and woods a low string drone and one lonely voice, mines tuba, voices and dripping glockenspiel;
  bosses choir, horn and tuba, timpani and driving cellos.
- **The fight layer** is timpani on the strong beats, a bass drum on the one and cellos driving
  eighths on the chord; it comes in lower (0.35) over pieces that have their own timpani. The boss
  sting is a bass drum, timpani, gong, low horn and tuba. A gentle compressor (with its makeup gain
  taken back off) keeps a boss from clipping; overall loudness matches the old music, a boss about
  4 dB above town.
- **The one-file build** carries the recordings inside the page (`samplesrc.solo.ts` swapped in by
  `vite.solo.config.ts`; the page is 3.3 MB of the 16 MB cap), so it sounds the same with no server.
- **Listening**: `node scripts/listen.cjs <dir>` renders a few pieces offline in Chromium to MP3 and
  prints their loudness (`window.__renderMusic`, loaded only when called).

## 2026-11-01: recovery codes (Claude Opus 5.5)

Kyle: friends he sends the link to (no accounts, no login) should be able to get their heroes back on
another device with a short code they can remember.

- **The code** (`shared/recovery.ts`): two words and a number, KILN FERN 47. The first word from 128
  made things and places, the second from 128 things that grow, live or blow through the valley; the
  number 10 to 99 (about 1.5 million codes). Every word is two letters or more from every other (a test
  holds it), so a one-letter slip is read as the word meant and is never someone else's code. Typed in
  any case, with spaces, dashes or nothing between.
- **The keeper** (`api/save.ts`, `api/_save.ts`): one Redis hash per code, `relic:save:<code>` (save,
  token, time), one Lua command per make, pull or push, a year's keeping refreshed on each. Making
  takes an unused code (only if it doesn't exist) and gives back a random token; pushing needs the
  token, and is refused (409) if another device pushed since the copy this one last saw, so a page left
  open elsewhere can't write over newer play. Pulling gives the token too, so the new device can push.
  Over 256 KB is refused. A code gone missing (a year unused, or the store emptied) is made again by
  the next device that pushes it. No rate limit yet.
- **This browser** (`client/recovery.ts`): the code, token, last-seen server time and an unsent flag in
  localStorage. Every `store()` now stamps `savedAt` (it only goes forward) and tells recovery, which
  pushes 20 s after the last change (at most 2 minutes after the first) and at once on pagehide or
  hidden (keepalive). On start it pulls: if another device pushed since, that copy replaces this one,
  but only while the start screen is up; if both changed, the newer `savedAt` wins.
- **The way in** (`client/recoveryui.ts`): RECOVERY CODE on the start screen (heroes and class pick).
  It shows your code (made the first time, once you have a hero) and USE A CODE, which says how many
  heroes the code holds, by name, and asks before they replace this device's. Lines in `copy.ts`
  (RECOVER), waiting on the lore keeper and line editor.
- **Where it's on:** everywhere but the one-file build, which has no server: `vite.solo.config.ts`
  defines `VITE_SOLO` and the panel compiles out. Not tied to `VITE_ONLINE`, so recovery doesn't depend
  on co-op being switched on.

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
- relic-lake.vercel.app is public (Kyle, 2026-11-01): Vercel Authentication now guards preview
  deployments only, so anyone with the link plays without a login.

## 2026-11-01: parties and the shared run (Opus 5.5)

- Parties form over the town's peer room: the one gathering says so with where they stand (`pt`:
  the job and who's in), joiners ask by direct word, SET OUT tells each member the run's room code
  and the job. The job travels with it (each player's world, and so board, can differ).
- The leader's browser runs the job; friends' heroes are dressed from the profile they send.
  Patches of what changed (`snap.ts`) about 12 a second, a full one every 4 s, on a room change and
  for anyone new; average well under 4 KB. Friends swap ids in the text (leader `me` to `@lead`,
  theirs to `me`) so the rest of the game runs unchanged on their copy.
- The run's gold is shared: every pickup counts for the party, and everyone is paid the run.
- Labels checked by the lore keeper (plain board words: GATHER A PARTY, SET OUT, TAKE IT DOWN).
- `npm run test:online` now also runs scripts/party-online.cjs: gather, join, set out, same goblins,
  walking seen, a hurt goblin hurt for both, every room in order, the end paying the friend.

## 2026-11-01: loot and gold (Kyle; Opus 5.5)

- Gear rarely drops on the way now (a small goblin 2%, a butcher 15%); chests stay as they were.
- The treasure at the end of a job won is each player's own (shared/treasure.ts): one piece always,
  35% a second, better for worse places and deep jobs, rolled for that player's class by their own
  browser. What won't fit in the pack sells for 20 gold. Shown on the results panel.
- Gold drops often (85% of small goblins) and goes in one pot for the party: whoever picks it up,
  everyone is paid the whole pot at the end, and spends their own in town.
- A friend's pickups, potions drunk and gear changes in the leader's job come home with them (the
  pack now travels in the snapshots).

## 2026-11-01: less lag for friends (Opus 5.5)

- The leader sends 20 patches a second (was 12).
- A friend's own hero walks the moment they press. Each input carries the friend's clock and the
  leader hands back the newest one it has used, which times the trip there and back; the friend's
  hero is drawn at the leader's position plus the walking done here since then, eased in, snapped
  if more than 1.5 tiles off. Rolls, swings, hits and knockbacks stay the leader's alone.
- scripts/party-online.cjs now runs with 150 ms of lag on every message (LAG_MS on the local
  server): the friend's hero moves within 0.11 s of the press, and never jerks back while walking.

## 2026-11-01: handing the job on, and coming back (Opus 5.5)

- Every 2 s the leader sends the whole job (`saveRoom`: the run and every field of the room, its
  dice included). Leader quiet 9 s: the friend first in line by id takes the room over with
  `want=take` (the next waits 5 s more, in case the first is gone too) and leads; the others hear
  `hosted` and follow. Friends' heroes now move between rooms as they are, not re-dressed.
- A job with friends is kept in this browser (`session.ts`, 15 minutes fresh): a reload goes
  straight back in as a friend, and the old leader coming back follows whoever leads now.
- Known: module id counters (bolts, drops) restart on the new leader, so an id can repeat once.

## 2026-11-01: the board remembers, one voice per device (Opus 5.5)

- A job won is written to the shared world as a deed (title, place, the party's names) by the
  browser that ran it; the board shows the last five under DONE LATELY. The world server cleans it.
- Council votes are cast by the device (`relic-device` in this browser), not the hero, so one
  person's heroes share one voice (Kyle's worry). A second browser is still a second voice; real
  one-per-person needs sign-in, later if it's ever gamed.

## 2026-11-01: places and lengths (Kyle; Opus 5.5)

- Three new kinds of place: river (deep water across the room, two fords to wade, stepping stones
  drawn), marsh (bog pools, two too deep to cross; reeds, drowned trees, mud), ruins (broken walls,
  rubble, pillars, statues). Six new places named by the lore keeper (the Sheepwash, Brokenbridge,
  the Peat Cuts, Sallow Carr, Ketterby, Hesketh Hall). Shallow water slows everyone to 55%; deep
  water stops bodies, never shots.
- Four ordinary jobs a day, each a different kind of place: short (2 rooms, about 5 minutes), two
  medium (3), long (5, about 15), plus the deep dive. Pay = (18 + 9 per ruin, +6 at night) per room,
  x1 / 1.15 / 1.35 by length. Treasure: a piece; a piece, maybe two; two pieces a cut above.
- River and marsh borrow the wood's music, ruins the village's, till they have their own.

## 2026-11-01: drills at the trainer (Kyle; Opus 5.5)

- Your own class's trainer sells drills for gold: POWER (+5% damage a rank), HEALTH (+8), SPEED
  (+3%), CRITICAL (+4% chance a rank for a blow or shot to land 1.5x; shows CRIT), WIND (+8% stamina
  back), SKILL (class skill back 8% sooner a rank, 3 ranks) and the class TECHNIQUE (3 ranks):
  Warrior SLAM, Healer MENDING HANDS, Rogue KNIFEWORK, Ranger TRAPPER, Mage QUICK CHANNEL.
- Price = base x (rank+1)^1.6; a trainer goes one rank further every two levels. Perks on levelling
  stay free picks. Crits roll on the hero's own seeded dice, so the room's dice never shift.

## 2026-11-01: taught at the trainer; a calmer hound in training (Kyle; Opus 5.5)

- A new hero comes out of the wood with their weapon and a plain dodge only (no class skill in the
  wood: Kyle's call; the Stoker's goal no longer mentions it). Their trainer teaches the class skill
  from level 2 (60 gold), and from level 3 (80 gold) a Ranger's snare on the jump and a Mage's image
  on the blink. Heroes made before this (no `learned` list) keep everything they had.
- An untaught skill has no button and its press is spent; the relic button carries the javelin.
- In the wood and the yard the hound joins in a third as often, never goes for a goblin that's
  swinging at you, and never knocks one off its stride: those blows are yours to meet.

## 2026-11-01: playtest batch (Kyle's notes; Opus 5.5)

- Doors: the hero on the far side takes every press so far as seen, and stands still (no repeat of
  the last swing or roll). Goblins after you (awake, within 7 tiles, not named, four at most) come
  through the door a second later, in and out (`followers.ts`).
- The caged call out when you're near (a gold mark over the cage) and, freed, stand where it was and
  thank you (`captives.ts`; drawing only).
- The run banner has a readable backing and shows get-ups as hearts; going down alone says how many.
- The trainer is short: where you stand and a button for each thing; tap one for what it does.
- Sneaking: walk slowly (part-way stick, or Shift) and goblins at rest see you from 45% as far. The
  first blow on one that hasn't seen you is an AMBUSH: 2.2x, and it reels 1.2 s.
- Jobs mix in spear-lungers, brutes and shield-bearers (a plank shield: a quarter from the front
  unless heavy, held fast or unaware), more of them deeper and in worse places.
- Rogue: no parry, dodge only; dash costs more breath (30, x1.5) on a 0.35 s cooldown; feet 1.12.
  Everyone else dodges less often (roll 1.1 s, jump 1.0, heavy 1.4, Healer 1.3). The Mage's taps are
  slower and a little harder. The dodge button says ROLL, JUMP, DASH or BLINK.
- The hound joins in every 3.5 s (5 in training) and, in training, never on a goblin swinging at you.
- Hew: one word of praise a lesson, in passing (the fight doesn't stop), and "more of them" once.
  The dodge freeze-frame doesn't happen if you're already rolling or out of where the blow lands.
- Merged from helpers: panels reveal in reading order (`reveal.ts`), and the dice are thrown on a
  little pixel table (`diceanim.ts`).
## 2026-11-01: every house its own (Kyle's playtest note; Opus 5.5)

- One seed per house (job, room, house) picks its sort, its outside and its fire: the street block
  carries it as `look`, the inside uses the same one, so a lit window outside means a lit hearth in.
- Cottages: one room (hearth, beds, table), a back room behind a wall, a weaver's (looms), a smithy
  (forge, anvil, racked tools), a storehouse (sacks, crates, barrels, oil), or either of the first two
  looted (furniture smashed, the table in pieces, often a body). Barns: stalls with hay, or an open
  threshing floor with bales and a cart. Size, floor (planks, dirt, flagstone) and sides vary; any
  layout may be mirrored.
- Who's in: nobody (about a fifth), one or two asleep (still and half-sighted, like goblins at the
  dead, drawn curled up), some at a body, or a band; a butcher in a barn only at ruin 2 and up, one
  time in five. Light: the hearth lit or cold, moonlight through a stove-in roof, the goblins' fire,
  a lantern post in a barn. Collision sizes outside are unchanged.
- A hiding survivor is a cage tucked in the back (the only rescue the room knows); a free one who
  talks would need new lines and a run-side talk handler.

## 2026-11-01: no dodge for Warriors and Healers (Kyle; Opus 5.5)

- Warriors and Healers can't dodge at all; there's no button for it on a phone. They block, and walk
  out of anything striped. Pressing dodge does nothing (`CLASS_DODGES` in `weapons.ts`).
- Walking out of a striped blow aimed at you counts as a dodge (`EnemyAttack.aimed`; a charge that runs
  its line and misses its mark counts too), so traits and the wood can count it.
- The wood's second lesson for them is STEP OUT: the freeze comes earlier (0.45 s) and the stick
  answers it. Rogue, Ranger and Mage keep the dodge lesson, with their own button's name in prompts.
- The Healer's block stays a little weaker than the shield (mace guard cost 1.1). A sword-and-censer
  Healer kit could come later.
- Hew screams as the Stoker takes him ("No! No, no, n"), cut off at the bite.
- The pixel font now has punctuation, a heart, and draws lowercase as capitals, so captives' words show.

## 2026-11-01: the Warrior's two skills, blocks cost breath, an easier grab (Kyle; Opus 5.5)

- The War Cry no longer helps allies block (they might not block). It now draws every goblin in
  earshot to the Warrior, and nobody else, for 5 s; it wakes the ones at rest. Small goblins right
  beside them flinch.
- New: Shield Charge. A 5-tile run shield first along where you face; small goblins in the way are
  knocked aside and left reeling (so they can be grabbed), big ones stagger, crates and barrels burst,
  a wall stops it (`src/sim/bash.ts`, `BASH` in magic.ts).
- A class can have a choice of skills (`SKILL_CHOICES`): the trainer teaches them together and the hero
  carries one, swapping for free at the trainer (`Profile.skill`). Only the Warrior has two for now.
- A held block costs no health at all, only breath, and a lot of it (2.4 per point of damage; a butcher's
  cleave takes most of a full bar). Weapon `chip` values are unused now.
- Grabbing: a small goblin that is busy (feeding, swinging at someone else, or at the end of a swing)
  can be grabbed as well as one reeling or one you're behind. The wood's field has crates and a barrel
  off the burning carts, and the Warrior's grab lesson teaches throwing those first.
- Hew no longer says "skittles" (it read as the sweets, not the old pin game).

## 2026-11-01: the pick screen, the Cleric, new looks (Kyle; Opus 5.5)

- The pick screen says only RELIC, A NEW CHAPTER, "Choose your destiny." and the five classes by name
  and look. Tapping one shows it fighting (a live loop: blows, a heavy, a dodge or a guard,
  `src/client/preview.ts`), its ratings, a name and BEGIN. No weapon or skill text: Kyle, "less is more".
- The Healer is called the Cleric on screen (`CLASS_NAME`); the id stays HEALER.
- Every class has eyes that glow in the dark. The Mage has a tall pointed hat, a robe, sleeves and a
  beard; the Cleric wears a mail coif and a white tabard with the Lantern on it in gold; the Ranger is
  hooded. Three Warrior looks are drawn for Kyle to choose from (`WARRIOR_LOOKS`: knight, sellsword,
  blackiron). Kyle: three looks for every class, chosen on the pick screen (`LOOKS`, `Profile.look`, `Hero.look`; sent to the town so friends see it).
- Halvard buys packed gear (never hungry); gear given to a town work counts for half again.
## 2026-11-01: Wickhold starts broken, mends with gold, and gets raided (Kyle; Opus 5.5)

Kyle: start the town broken down and bloody, with an unfinished garden, so there's something to put
money towards and watch it clean up; NPCs comment as it gets nicer. Then: bad walls (sticks) that get
better with time, and world events where the town is attacked and bloodied again.

- **The breach.** Wickhold's north wall came down in a recent assault; the stretch either side of the
  gate (tiles 17 to 39) is hurdles, stakes and a cart bed lashed up with rope (`GameMap.breach`,
  painted in `client/breach.ts`). The rest of the wall is the old stone Wenna saw go up, so it is still
  "the last walled town". Blood on the square and at the gate, a drag trail, the dead on a cart by the
  church with crows, burnt carts and rubble in the lanes, scorch, lamp posts down, buildings scorched
  with boarded windows and holed roofs, and Perrin's trampled physic garden with a dead tree.
- **What's broken is data** (`shared/mend.ts`, from the world's works, so the same on every screen):
  paint-only floor marks (`GameMap.marks`, `client/marks.ts`), a `worn` flag on buildings
  (`client/wear.ts`), a laden cart (`look: 3`), and two paint-only round kinds (`crows`, `moths`,
  `client/streetlife.ts`). Wrecks sit clear of doors and patrols (the town reach test covers a fully
  mended town too).
- **New works, all gold, all seen:** Wash the Square 60 (blood, crows and the dead cart go, fresh graves
  by the church), Clear the Lanes 150, Mend the Shutters and Roofs 200, Lanterns along the Lanes 120
  (eight lit posts), the garden in three stages (Clear and Dig 80, Plant the Beds 120, Benches and a
  Lamp 160), the wall in three (Stakes for the Breach 150, A Timber Wall and a Walk 350, Stone for the
  North Wall 800). Stages are separate ids with `after`; a stage opens only when the one before is done.
  Gifts never overshoot what a work still needs. The first three works are unchanged.
- **The TOWN WORKS panel** (`client/worksui.ts`): Hollis, your gold, a dim line of what's done, then one
  button per open work with its progress (mending first; only the next stage of a line). Tap for what it
  is, GIVE 25 / GIVE n, and for the defence works (`arms`: the watch and the three wall stages) GIVE GEAR,
  the gear flow from main moved there.
- **Raids** (`shared/raids.ts`): from day 10, never within 6 days of the last, a 15% chance a day, and
  only once the town has two mended things to lose. A raid always brings the blood back (if the square
  was washed) and pulls down one more (two once five are standing): only the top stage of a line (the
  garden loses its newest stage, the wall drops back one), never the watch, the Old Quarter, the sewers,
  and never stone. Recorded in `world.raids` (newest four).
- **Who decides a raid:** it's rolled in `contribute` as days pass, seeded by the day, so it's the same
  everywhere. For a shared world only the world server rolls it (the browser passes `raids = false` while
  online, and takes the server's world back); off the server, the browser rolls it for its own world.
  Days pass per finished run, as gold does, so a busy world is raided more and mends faster in
  proportion. No server change was needed.
- **The town talks** (`shared/townsays.ts`, lines in `shared/mendlines.ts`): a fresh raid (3 days), then
  a work finished in the last 4 days (`world.mended`, kept in `contribute`), then on two days in three how
  the town stands (broken, mending, mended with the garden in flower), or after any raid, Wenna and Dunn
  remembering it. Old Wenna, Tam, the gate guard, Dunn, Hob, Pike, Orla, Rowan, and Widow Perrin (new, in
  the garden; her line follows its stage, and of an evening once there are benches). The first time you
  see a raided town Dunn tells you (`client/raidnews.ts`, once per raid per device), and the job board's
  DONE LATELY says when it was hit.
- **The garden at dusk:** once the benches are in, a soft lamplit pool over the benches and beds and
  moths round the lamp after dark.
- Not done: barks when walking past a newly finished work (there's no bubble system yet); a raid you
  fight in town.

## 2026-11-01: winded (Kyle; Opus 5.5)
- Run stamina all the way out (a dodge, a block, a guard break) and you're winded: the bar flashes red,
  nothing comes back for a second (`HERO.windedDelay`), and there's no dodge, blink, block or parry until
  the bar is full again.
## 2026-11-01: Wickhold's ground, and a town alive under siege (Kyle; Opus 5.5)

Kyle: the square is too uniform, all cobbles; add gallows and a gravedigger shifting the bodies; make
it seem more alive and under siege. Less is more for new lines.

- **The ground** (`shared/ground.ts`, painted by `client/groundpaint.ts` as more floor marks): old
  flagstones worn into the cobbles round the Lantern and the well; packed earth where carts turn inside
  the gate, by the square's cart, the tavern and the west lane; wheel ruts down the gate road and along
  the lanes; paths worn corner to corner (square to tavern, to barracks, to the forge, to Rescue Row); a
  drain down to the sewer grate and along the north lane; puddles; straw by the stalls and the tavern;
  weeds along the walls and edges. Fixed data, each mark painted from its own seed: the same on every
  screen. Washing the square takes its broken cobbles; clearing the lanes takes the churned mud, the
  lane holes and the spent arrows under the breach. The rest stays when fully mended.
- **Under siege** (`shared/siege.ts`, drawn in `client/siegedraw.ts`): a gallows at the square's east
  edge with an empty noose and a crow on the beam (empty, not a hanged goblin: the bible has Wickhold
  taking nobody and the horror in absences; the lore keeper can change it). Gravedigger Cobb walks
  Odric's cart to the churchyard with the dead over his shoulder, digs a while, goes back; once the
  square is washed he only tends the graves. The Tulls, burned out of the north lane, round a new
  brazier inside the gate till the shutters and roofs are mended (not refugees: those wait outside the
  gate for the council). Goodwife Mab drawing water at the well; Recruit Wat at the whetstone by the
  barracks. Wicker hurdles either side of the gate road till the timber wall is up. Smoke past the north
  wall; a dog nosing along the south lane.
- New NPC fields (paint only): `Npc.work` (what they're busy at) and `Npc.mute` (background people: no
  mark, nobody to talk to). Two block kinds (`gallows`, `hurdle`), two round kinds (`dog`, `smoke`).
  Nothing blocks a door, a spot or a patrol; the reach test covers it.

## 2026-11-01: the ground is mostly earth and mud now (Kyle; Opus 5.5)

The square still read as one cobble grid with a flagstone patch. The ground is now made of materials
in big soft-edged shapes (`GameMap.soil`, `shared/ground.ts` `townSoil`, painted by `client/soil.ts`):
mud everywhere first, packed earth over the square, the gate yard, the market and the lane mouths; the
cobbles survive in islands and strips over that (round the Lantern and the well, along the building
fronts, the old road down from the gate, a spine down each lane); then wear over all of it (a track
worn corner to corner across the square, mud fans where carts turn, wet round the well, straw under
the stalls, ash round the braziers). Edges are broken by seeded value noise; the material is decided
per 4x4 pixels and coloured per 2x2, written straight into the floor's pixels once per map (about
50 ms). Each material has its own colour family, dark for the stepped lighting. Washing the square
sweeps its earth and relays three more cobble islands; clearing the lanes sweeps bands of lane mud,
widens the cobble spines and takes the cart-turn mud fans. The small marks (flagstones, ruts, drains,
puddles, weeds, missing cobbles, arrows) stay on top; the earth, path, mud and straw marks are gone.

## 2026-11-01: the Roll as a leaderboard (Kyle; Opus 5.5)
- Two sides, THE BRAVE and THE UNLUCKY, each a card per tally with a podium of the top three (their
  faces), places four to ten below, and your own count if you're not on it (`src/client/rollui.ts`).
- New tallies, counted per player in a run and kept on the shared Roll online: butchers killed, gold
  earned, friends picked up; and on the unlucky side times knocked down, picked up by friends, friends
  floored. Old heroes start the new tallies at nothing.

## 2026-11-01: back to 1x sprites (Kyle; Opus 5.5)
- The 2x jointed figures were reverted (Kyle: "doughy and soft", and the idle bob jumped about; the 1x
  look was grittier). The work stays on branch `juice` (97ffc72) for reference. The anticipation and
  payoff pass from before the 2x step stays in.
## 2026-11-01: the freed can be hurt, and are only saved once you get them out (Kyle; Opus 5.5)
- Breaking a cage puts its person in the room as a body (`sim/survivors.ts`, tuning `SURVIVOR` in
  `shared/props.ts`): 24 health, they stand a moment, then follow the nearest player at a slow walk a
  gap behind, step out of a hero's way (heroes never push past them), and wait where they are with
  nobody near. Goblins ignore them for now. They're in the room's state, so guests see the same people.
- Everything of the party's that can hurt a friend hurts them, at full weight and solo too
  (`sim/survivorhits.ts`): swings, arrows and spells, blasts, a slammed barrel, the oil going up, a
  javelin, goblins and props flung into them, the shield charge, and fire caught from burning goblins
  and buildings. A holy smite, the net and the hound spare them. The blow that breaks the cage doesn't
  land on whoever's inside. Killed, they fall and stay where they fell.
- Freed is not saved (Kyle: bring them out, don't babysit the whole job): they count as brought home
  (`survivorhome`) once walked out of the house they were caged in, or, caged out in the open, back to
  where the party came into the room. Then they walk off and are gone. A rescue job's goal now waits on
  them. Stepping out of a house with someone, a third of the time 2 or 3 goblins (more for a bigger
  party, at most 5, some lungers or shields) are waiting by the door (`sim/ambush.ts`, the room's own
  seeded stream).
- The Roll: RESCUES STRUCK (blows landed on the freed) and RESCUES KILLED take the place of PICKED UP
  BY FRIENDS on the unlucky side (`carried` is still counted, off the board). Counted per hero id in the
  run so a friend's game reads its own; the job's end now swaps ids for a guest the way patches do.

## 2026-11-01: the Rogue throws a dagger (Kyle; Opus 5.5)
- The daggers' held attack is a thrown dagger instead of the power thrust: 14 damage, 30 at full,
  8 tiles, tumbling in flight and sticking where it lands (`shot: 'knife'`).

## 2026-11-01: the Mage casts (Kyle; Opus 5.5)
- The Mage's tap spell is a cast: about half a second rooted in place (wind-up 0.3 to 0.36 s across the
  three kits). Burning hits harder to make up for it: 7 every half second for 3 s (was 4).

## 2026-11-01: bigger parties, better rewards (Kyle; Opus 5.5)
- Each extra player adds a quarter to a won job's pay and its objective xp (`PARTY.reward`); kill gold
  and xp already grow with the extra goblins. Two or more players each find one more piece of
  treasure; three or more roll it a cut above.

## 2026-11-01: finding your way on a job (Kyle; Opus 5.5)
Kyle: he didn't know how many were left to rescue, the people he freed didn't follow him out of houses,
and he couldn't tell when or where he could leave.
- **The freed came out in the wrong place.** Walking out of a house moved them to the street, but they
  were pushed against the house's map (the map in use at that moment), so they turned up across the
  street, counted as home at once and walked off without being seen. They now come out by the door
  behind you (the street's own tick settles them), with SAVED over them, then walk off toward the way in.
  Tested through the real door, alone and with a friend leading them.
- **The goal counts people** (`sim/goal.ts`, moved out of run.ts): "2 to free, 1 to bring out", plus
  "3 more in the houses" for anyone caged indoors (extra, never needed: on a rescue, every house has
  someone; that would be seven in a village). Anyone freed, indoors or out, has to be brought out
  before a rescue's way home opens. A friend's screen shows the leader's words and count.
- **The way out is plain** (`client/wayout.ts`): a gap painted in the back wall where the way on is;
  stakes across it while it's shut; once open, light in it, a torch either side and gold chevrons
  running into it; a sill, light and chevrons at a house's door. The goal names it ("Way on: north",
  "The larder is ruined. Way home: north"), "WAY ON: NORTH" / "WAY HOME: NORTH" / "PICK A ROAD" rises
  over you the moment it opens, and the wood's gold arrow at your feet points the way on a job
  (`client/wayfind.ts`): the cage, out of the door once someone's freed, back to the way in with
  someone freed out in the open, then the way on. Someone freed and left out of sight gets a pale mark
  at the screen's edge. Every kind of place has its way out at the top middle (forks: two at the top);
  a test floods each from the way in and checks nothing stands in front of it.

## 2026-11-01: the job board, and story missions need a party (Kyle; Opus 5.5)
- The board lists each job on one line: its kind, the place, its length, how hard (five pips:
  ruin, length, night, deep, story) and the pay. Tap one for the rest and the buttons.
- Online, a story mission needs a party of three (`STORY_PARTY`): no GO ALONE, and the party can't set
  out short-handed. Off the shared world (and in the one-file build) it can still be taken alone.
## 2026-11-01: what the goblins do; wrecked, blocked and burning houses (Kyle; Opus 5.5)

- Big houses on long and deep jobs (now and then deeper into a medium one): a longhouse (two or three
  rooms off its hall, each through a doorway), a manor (a hall with a long table and a back wing walled
  off it: a bedroom and a store), a tithe barn (posts, grain bays, bales, a cart). The door and the
  way out stay at the bottom middle.
- What the goblins left, paint only, laid out from the house's seed (shared/grim.ts): bodies torn apart
  with pieces strewn, a body dragged across the floor, one tied up on the back wall and opened, one hung
  by the ankles from a rafter hook, a cook-pot on their fire with a hand or a foot in it, a heap of bones
  and clothes, what's left of the last one by a cage, bloody handprints, a count scratched in fives
  (the rumour about captives' marks). More of it the worse the place and the deeper the job; about a
  third of houses at ruin 1 (still some at the worst) stay quiet. Goblins still at the dead are the
  existing feeding goblins over a corpse.
- Fates on the street, more of them the worse the place: wrecked (a gable end down, the roof caved, beams
  and rubble spilled; inside, rubble heaps and the sky through the roof), blocked (fallen in across the
  door: no door, no prompt), burning (smouldering outside, never spreading). A caged person is only
  ever inside a house you can enter.
- Inside a burning house (HOUSEFIRE in tuning.ts, judged in sim/blaze.ts, drawn from the same plan):
  patches smoke for 3 s then burn whoever stands in them (14 a second, 4 at a time); beams come down
  every 5 to 7 s on a striped circle (1.6 s warning, 22 damage, a roll gets you out); between 52 and
  64 s the roof falls in after 10 s of falling dust: everyone inside is thrown out the door hurt (never
  below 1 health), the freed with them, and anyone still caged is lost (`run.lost`). Fire never touches
  the doorway or the way from the door to the cage. The house is rubble in the street once it falls.

## 2026-11-01: small fixes (Opus 5.5)
- Knock-downs, pick-ups and friends floored are counted per player in a run, so a friend following a
  job gets their own tallies, not the leader's.
- The results say how many were lost to a fire.
- On a job, the banner fades when you're near the top of a room so it doesn't hide the way on.
## 2026-11-01: places with a plan (Kyle; Opus 5.5)

- Every place on the board is one of twelve sorts (shared/sites.ts): Barrowby a village round its
  green (cottages facing the lane, yards and fences, kitchen gardens, the well and a shrine, strip
  fields and hedges at the edges); Tollan's Farm a farmstead; Lowfurrow Fields fields cut by tracks and
  hedgerows; Fennick Ford a better-off street (stone terraces, gutters, a walled garden, a courtyard,
  a fountain or market cross, stalls, a gatehouse); the Charcoal Camps and Brokenbridge shanties
  (shacks and tents along a twisting muddy path, cookfires, washing lines, a latrine ditch; charcoal
  clamps in the wood, the broken bridge by the river); Hesketh Hall a manor's grounds; Ketterby a
  village gone to ruin; Hangman's Wood a wood with its clearing and gallows; the Copperdeep Shafts a
  gallery; the Sheepwash a riverbank with sheep pens; the Peat Cuts water in rows; Sallow Carr a
  willow carr. A place not on the list gets its kind's sort.
- A place's plan is seeded by its name and the room, not the job, so it looks the same every visit;
  the job's seed still places the objective, goblins and chests. The objective is placed first and the
  plan drops whatever would land on it, the way in or out, the forks' roads, raised ground or water,
  or the clear line up the middle.
- The ground comes from soil shapes (grass, ploughed furrows, standing grain, earth, mud, gravel)
  over each place's floor. Enemy rolls, themes' light and torches are untouched.

## 2026-11-01: jobs at any hour, and spiders (Kyle; Opus 5.5)
Kyle: maps don't always have to be night, and other enemy types, like spiders that come in waves and poison.
- **A job's hour** (`shared/timeofday.ts`): dawn, day, dusk or night, rolled from the job's own seed on its
  own stream (the rest of the board is unchanged). Night is still the twist with its extra pay; a quarter
  of the rest are dawn, a quarter dusk, the rest day. The room is lit through the same pass as the town:
  the place's own tint mixed toward the hour's sky as far as the place lets the sky in (a forest less, a
  mine not at all), `torch` scales torches, braziers, posts and lanterns (day 0.35), dusk stretches every
  shadow east, dawn lays mist bands over the ground. The board shows the hour as one word on each line
  (". At night" left the detail). Old saved jobs read as night if they were night jobs, else day.
- **Darkness and stealth**: nothing judged depended on the dark before. Now a resting goblin's sight is
  0.8 of itself at night, 0.9 at dawn and dusk; a censer's glow gives a Healer away half as far by day.
- **Spiders** (`shared/spiders.ts` numbers, `shared/nests.ts` where, `sim/spiders.ts`, `sim/poison.ts`,
  `sim/puddles.ts`): in forests, marshes, mines and ruins only (never villages, farms, fields, rivers or
  under Wickhold), 25% a room plus 12% a room in, 5% a point of ruin, 15% on a deep job. A room with them
  gets a nest (two from the third room, or on a deep job) with two spiders on it, and two fewer plain
  goblins a nest. A nest wakes when a hero comes within 8.5 tiles (or it's hit), hatches 3 spiders 1.2 s
  later and every 8 s after while fewer than 7 of its own live; it counts toward clearing the room ("Clear
  the room (N left)" while spiders are about). A spider: 14 health, fast, zigzags in, circles while it
  gathers itself, pounces 2.4 tiles along a shown lane (blockable, parryable) for 5 and a stack of poison.
  The brood mother (from the third room, the second on a deep job, 40% plus 30% deep): 240 health, slow;
  a bite (14) up close and, from 2.8 to 7 tiles, a lobbed glob at where you stand: a striped circle that
  lands exactly there for 10 and leaves a poison puddle 5 s. She hangs back in spitting range.
- **Poison**: up to 3 stacks, 2 a stack a second, never the last point of health; a stack wears off 5 s
  after the last bite, then one every 1.5 s. A Bitter cures it; a Healer's heal takes a stack off. Green
  cast and drips on the hero, the health bar goes green. Synced to friends on the hero and puddles as a
  collection.
- **Weaknesses** (`WEAK` in shared/spiders.ts, read by `damage()` and melee): spider fire 2.5, storm 1.2;
  brood fire 1.8, blades 0.9; nest fire 3, blades 0.6, frost 0.5, storm 0.8. WEAK pops over a hit on one.
  Fire spreads between spiders half a tile further than between goblins, and a burn tick kills a spider.
  Spiders give xp (3; nest 20; brood 60) but no gold or loot and don't count as goblins killed.
- In a party, nests aren't copied (their waves grow by one a player past the first, and their cap with
  them); the brood mother isn't copied and gets tougher like a named one.

## 2026-11-01: trainer ranks level locked and dearer; a trainer screen you can read (Kyle; Opus 5.5)

Kyle: "trained abilities to be level locked and cost more", and the screen was "a pain to understand".
- Every rank has a level (drills.ts `levels`): power, health, speed, critical and breath at 2, 4, 6,
  8, 10; skill at 4, 7, 10; technique at 5, 8, 10. Prices doubled on the same curve (power 80, 245,
  465, 735, 1050). The whole set is about 17,800 gold, a long road past the chapter's level cap.
- The class skill lesson moves to level 3 for 150 gold; a Ranger's snare and a Mage's image to level 5
  for 250. Class sheets read the levels from drills.ts so they can't drift.
- The rules live in shared/training.ts (`drillState`, `buyDrill`, `learnLesson`); the game only calls
  them, so a buy refuses below the level, without the gold, or before the lesson it needs. Ranks a hero
  already has above the new levels are kept; they buy on once their level catches up.
- The screen (client/trainerui.ts, rows from shared/trainrows.ts): level, an experience bar and gold
  on top; picks waiting first (tap to take); then SKILLS (the lessons, and the Warrior's CARRY choice)
  and TRAINING, one row each with pips (filled, open, hatched for a level not reached), what the next
  rank adds, and a price, LEVEL n, NEEDS SKILL or MAX. Buyable rows are gold-edged; locked ones dim.
  Tap a row for NOW and NEXT, every rank with its level and price, and one buy button.
- The greeting is one line at most: the grown line when picks wait, or Isolde's coal line.


## 2026-11-01: each hall its own place, inside and out (Kyle; Opus 5.5)

Kyle: the wizard tower doesn't look very wizard-towery outside or inside; personalise each hall.

- **Inside** (`shared/townhalls.ts`; `interiors.ts` hands the town's halls to it): the tower has
  bookcases, a star chart, a stair curling up, a desk of books and jars, a chalked circle and a brazier
  of coloured fire, and Magister Vell has a tall hat; the barracks racks, shields and a banner, bunks,
  a map table and a dummy on strewn rushes; the lodge bows, antlers and pelts on the wall, a skinning
  bench, a bear hide, the hounds' bowls; the church candles, a runner up the aisle, coloured windows and
  Mother Isolde's cot; the Drowned Rat casks, the dice table, Whisper's curtained booth, its sign and
  notices, sawdust; the forge bellows, a quench tub, tools and horseshoes, soot; the town hall the
  council desk with its ledgers, the valley map, notices, a rug; the infirmary herbs drying, a basin, a
  candle stand. NPCs stand where they stood (the trainer panels are untouched).
- **New pieces:** twelve furniture kinds (`client/hallsdraw.ts`), two live rounds (`candles`,
  `witchfire`, lit by the scene: candlelight, and fire that drifts violet, green and blue), seven floor
  marks (`client/hallfloor.ts`), and `GameMap.hangs`, things on the back wall (`client/hangs.ts`).
- **Outside** (`client/exterior.ts`, by door, on labelled town buildings): the tower round and shaded,
  a crooked slate cone with a vane, slit windows lit odd colours and coloured smoke from its flue; the
  barracks shields and a banner; the lodge logs, antlers, pelts, a bow; the church a round window and an
  empty belfry (the bell went for arrowheads in the siege); the Drowned Rat casks and a lamp; the forge a
  chimney stack that smokes and sparks, horseshoes, a quench barrel; the town hall notices, its banner,
  worn steps; the infirmary herbs under the eaves and a lamp.
- `tests/halls.test.ts` floods each hall from the door and checks everyone and the way out can be
  reached, and that each is the same every time with its own pieces.

## 2026-11-01: the quick channel, and each element a job (Kyle; Opus 5.5)

Kyle: the channel isn't much fun, and there's no reason to switch element unless goblins resist some
and fall to others. His call: give each element a job.

- **The channel is a quick switch** (`CHANNEL` in `shared/magic.ts`, `sim/channel.ts`): a tap turns
  the spells to the next element at once (fire, frost, storm), a short flourish, back in 1 s. No
  standing still. The reward for committing: the first spell after a turn is **primed**, x1.5 (more
  with the Mage's technique, now **FIRST SPELL**, +20% a rank, was QUICK CHANNEL). The skill button
  reads the element now (FIRE, FROST, STORM) in its colour, and the Mage's casting light and tip glow
  take that colour; a primed Mage has motes circling and a brighter light until the spell goes.
- **Each element's job**: fire burns and jumps further between goblins (`BURN.spread` 0.3 to 0.7),
  for crowds and spiders; frost slows feet and now wind-ups too (`FROST.windup` 0.6, locked in the
  attack's own clock so the telegraph fills at the judged pace), then freezes for a shatter, for the
  big and the quick; storm chains further and to more (3 within 3.8, 0.7 a jump) and goes round a
  shield's board, but a Mage's storm spell lands 0.8 on the first goblin.
- **One table for every foe** (`shared/weakness.ts`, read by `damage()` and the melee path): rows by
  variant, bow, named butcher (boss) or kind. Looters, drummers and spiders burn; lungers, butchers,
  bosses and the Stoker take frost hard (the Stoker shrugs fire, 0.6); brutes resist blades and frost
  a little; hexers and shield goblins fall to storm. Numbers 0.6 to 1.8 (the spiders' older 2.5 and
  the nest's 3 left as they were). **WEAK** pops in the colour of what landed it, **RESIST** small and
  grey, at most one per foe each half second (`WEAK_POP`), never on a burn's tick.
- Steam, shatter and flare unchanged; the three kits keep their shapes (wand sparks, staff orb, rod
  lance); relic augments go through the same table.
- `tests/elements.test.ts`: the switch and its cooldown, the primed spell, every table entry through
  `damage()`, the brute resisting a blade, the pop limit, storm round a shield, fire jumping a gap.

## Going down in a party, and a leader out of sight (2026-11-02, Claude Opus 5.5)
Kyle and a friend's first online job: Kyle died, the Cleric's smite didn't help (it doesn't heal;
every third mace blow does), the friend didn't know how to get him up, then the friend froze.
- Getting someone up is a button now: GRAB by a friend who's down (HELP UP on a phone, G on a
  laptop) kneels you there 2.5 s (a Cleric twice as quick). A hit, a swing or walking off stops it.
  Standing over them alone no longer does it.
- Nobody comes in 20 s: you get yourself up, once a job (`Hero.selfUp`, carried room to room).
  Raised by a friend, it isn't spent. The next time nobody comes, you're out till the job ends and
  the rest carry on (everyone out: the job is lost). The banner's heart in a party is that get-up.
- The freeze: the relay log shows the friend's game trying to take the job over at 2:15 in, refused
  because the leader's page still pinged. The leader's page had stopped drawing (out of sight), and
  the room only ran on drawn frames. Now a leader's room runs on a timer when the page is hidden,
  catching up in 0.1 s steps; and a refused takeover goes back to following the leader instead of
  running a copy of the job alone.
- Laptop grab key is G: the lesson and Hew's card said F.

## 2026-11-02: slower levels and loot, the knacks tree, class-true offers (Kyle; Claude Opus 5.5)

Kyle, after playing with friends: purple loot and levels came too fast; he liked picking one of two
on a level up and wants to see it grow as its own place; a Rogue was offered "on block" and "on parry".

- **Measured first** (a seeded sim of a typical hero's first jobs through the real room plans, bounty,
  drop, chest and treasure code; 40 seeds). Before: solo level 3 after one job, 5 after three, 10 after
  eight; about 24 Tolmouth (purple) pieces in 15 jobs, the first around job 2. A party of three reached
  level 10 in five jobs with 38 purple.
- **Levels** (`shared/progress.ts`): `xpFor` is now 250, 780, 1590, 2680, 4050... (12330 for 10), and
  kill, rescue and objective xp roughly halved. Solo: level 2 after one job, 3 after about four (the
  trainer's skill), 5 after about ten (the leave-behind), 6 at 15, about 9 at 30. Trainer ranks at
  2/4/6/8/10 land every few jobs. Saved heroes keep their level.
- **Parties** (`shared/pace.ts`, `jobXp`): a party fights more goblins and every kill paid everyone in
  full. Now the room's xp is shared for the party's size, plus 15% a player past the first: a party of
  three earns about 1.15 to 1.25 times a solo job. Gold is unchanged.
- **Loot** (`shared/gear.ts`): new odds; danger lifts a roll only as far as Forged (`LIFT_TO`), so
  Tolmouth and Hungry are found, never lifted into. Purple is 2% from chests and butchers, 10% from a
  named butcher (the treasure of long and deep jobs). Solo: about 2 purple in 15 jobs, 4 in 30, the
  first around job 6 or 7; a party of three about 3 in 15. Blue (Forged) is what deep jobs now pour out.
- **The tree** (`shared/perks.ts`, `shared/chains.ts`): four chains of three steps a class, BODY and
  BREATH shared, then its guard or its feet, then its trade. Warrior: GUARD, WEIGHT. Healer: GUARD,
  MERCY. Ranger: FEET (jump, parry, speed), BOW. Rogue: FEET, KNIFE. Mage: BLINK, SPELLS. A level up
  offers the next step of two different chains; 12 steps and 9 picks to level 10, so not everything.
  Every knack is a number the fight already reads: gear-named ones fold into `statsOf` with gear and
  drills; `knack(h, k)` for down, block, rear, bless, counter and winded.
- **Old heroes**: the old perk ids are steps on the chains, so they stay lit. One the class can't use
  (a Rogue's GUARD, a Warrior's FOOTWORK) comes back as a pick (`fitPerks`, run on load).
- **The screen** (`client/treeui.ts`, `tree.css`): KNACKS, the level bar, then a row per chain: taken
  steps gold and linked, the two on offer green and glowing, each chain's next step blue, later steps
  dim and dashed. Tap a step for its words. Opened from the pack (KNACKS, with a ! while a pick waits),
  from a job's end when you've grown (SEE KNACKS), and from the trainer, still the one place a pick is
  taken (my call: the trainer's lines and "find your trainer" stay true; one flag, `take`, to change).
- **Class-true offers** (Kyle: "the Rogue can only dodge"). Filtered, not swapped, for gear: PARRY
  needs a parry, GUARD a held block, DODGE a dodge button (`modFits`, used by rolls, rerolls and hungry
  pieces); RIPOSTE and BULWARK need a parry and SIDESTEP a dodge (`traitsFor`); REAPER reads "A backstab
  that kills heals you" for a class with no parry. Swapped for knacks: FOOTWORK says the class's own
  dodge (Dash, Jump, Blink), and the chains only hold what the class does. The item card and hero sheet
  hide PARRY WINDOW, THROUGH A BLOCK and DODGE EVERY for a class without them; the sword and spear lines
  and the armor lines no longer promise a Warrior a roll. Relics and augments had nothing to fix.
- `tests/knacks.test.ts` walks every class through 40 pick paths to the end of the tree, checking each
  offer is two chains' next steps and nothing the class can't do, and rolls gear, rerolls, hungry
  pieces and treasure for every class, and reads the trainer's rows for every class.
- New words (for the lore keeper and line editor): KNACKS button and title; SEE KNACKS, SEE THE TREE;
  chain names; the new knacks SCARRED, LONG WIND, COUNTERSTROKE, FLEET, SLIPPERY, HEFT, HEAVY HANDS,
  KEEN, LONG SHOT, QUICK HANDS, DEEP CHARGE, POTENT, MENDER with their lines; the tree's notes.

## Level ups, Wall Brandy, and every shop laid out one way (2026-11-02, Claude Opus 5.5)
Kyle: a level up gives full health and a flash in the class's colour; townspeople stop explaining
things they don't sell; shops say what the place is, then the keeper and their lines, then the goods
as a list with a card on tap; Wall Brandy doubles damage and halves speed and stamina.
- **Level up in the room** (`sim/grow.ts`): the player's own game counts levels and sends `levelSeq`
  (a press counter, optional so older guests still read). The room fills that hero's health (not if
  they're down) and pushes a `levelup` event with the class, so the whole party sees it. Levels are
  only paid at a job's end, so on a job a level is lit the moment it's sure (`dueLevels`: what a lost
  job would still pay: the kills and rescues so far, shared for the party); any the job's own pay adds
  are lit back in Wickhold, seen by you only (the town has no shared room; townfolk don't carry it).
- **The flash** (`client/fxlevel.ts`, `LEVEL_GLOW`): rings at the feet and chest, a halo opening slowly,
  sparks, motes rising and a column of light, a light flash and LEVEL UP. Warrior gold and steel,
  Ranger green, Rogue dark violet with smoke-black wisps and a dim light, Mage arcane blue and violet,
  Cleric the Lantern's gold. A short rising chime (`sfx.levelup`).
- **Wall Brandy** (`sim/brandy.ts`, numbers in `POTION`): for its 6 seconds, blows and shots
  (melee in `combat.ts`, shots and spells in `room.loose`) x2, walking x0.5 (the follower's prediction
  too), and breath capped at half (current breath drops to half, comes back to half; winded clears at
  half). It no longer fills breath. Relic and skill damage (javelin, hook, smite zones) is not doubled.
  The card says "breath", not Kyle's "stamina": players never see "stamina" (story bible).
- **Potion lines** short and true: Bitter "Heals 40 over 2 seconds and cures poison." (numbers from
  POTION), Brandy Kyle's line with breath, Oil Kyle's line, Frost "Chills what it splashes. A second
  splash freezes.", Smoke "Hides anyone in it from goblins, unless they're close." The card adds
  "Lasts 6 seconds." for Brandy and "Thrown where you aim." for Frost and Smoke.
- **Moll** plays dice and nothing else; the smoke line and SMOKE button are gone from her table.
  Smoke is now Gannet's, over the bar, with Brandy and Oil (my call: it had to be sold somewhere; the
  belt's empty line now names Agne, Gannet and Ivo). No other panel explained something its keeper
  doesn't deal in; every potion explanation now lives only in that good's card.
- **Shops** (`client/shopui.ts`, `shopwords.ts`, `shopgoods.ts`, `shops.ts`, `stores.ts`): the title
  is the place, then its line, the keeper's name, their lines, FOR SALE as rows (picture, name,
  price), then anything else the place does. Tap a row: a small card with what it does, the price,
  BUY (or why not), and for gear, what you got afterwards. The Drowned Rat, the infirmary, Dessa's
  stall, Ivo's bench (frost flasks and rerolls as goods; relics and the shut elements under it), the
  Counting House (more shelves, then vault and pack), Tobin's stall (buy-backs and a bigger pack as
  goods, then SELL FROM YOUR PACK), the forge (Halvard's rack as goods, then the anvil; the separate
  rack panel is gone). The church sells nothing, so it's unchanged; Moll's dice too.
- `tests/grow.test.ts` (heal, once a level, a friend's level, down stays down, the sure-level rule) and
  a Brandy test in `tests/potions.test.ts` (x2 damage, half walk, half breath, all back after).
  `scripts/shops.cjs` screenshots the shops and both flashes.

## 2026-11-02: three skills a class, and training in sections (Kyle; Claude Opus 5.5)

Kyle: "it sucks that there's only one or two available per class. Let's try to think of 3 per class.
Beyond that, I want training to be its own expandable / collapsible area."

- **The fifteen** (`shared/magic.ts` SKILL_CHOICES, numbers in `shared/skillkit.ts`, lines in
  `shared/skillwords.ts`). Each changes how the class plays and sits at a cooldown like the first's.
  Warrior: SHIELD CHARGE (move), WAR CRY (pull the room to you), SHIELD STAMP (a ring around you, 0.35 s
  windup, 2.6 tiles, 16 damage, small ones flat 1.4 s, big ones stagger, 14 s). Ranger: HUNTER'S NET
  (snare), VOLLEY (a spot up to 8 tiles off; after 0.7 s arrows fall there every 0.3 s for 2.4 s, 5 a
  fall in 2.2 tiles, small ones held flinching, 18 s), SEND THE HOUND (the hound runs 1.8x at the goblin
  you face within 9 and pins it 2.6 s, big ones slowed, 16 s). Rogue: SHADOWSTEP (get behind), VANISH
  (smoke at your feet: no goblin sees you, even close, for 4 s or till you strike; blows wound up at you
  dropped; small ones in 2.2 tiles cough 0.8 s; 18 s), KNIFE FAN (five knives across 1 radian, 11 each,
  12 s). Mage: ELEMENTAL CHANNEL (switch), FIRE RING (2.6 tiles, 12 damage, thrown off and set alight,
  burns on 4 s lighting anyone who walks in, 16 s), STORM TETHER (the goblin faced within 7, struck for 6
  storm every 0.5 s for 4 s, jumping on to those near it, snaps past 9, moves on when it dies, 16 s).
  Carrying the ring or the tether, a Mage's spells are fire (my call: the Channel is what changes them,
  so giving it up is the price). Cleric: SANCTUARY (ground and ward), CENSER CHAIN (hauls the friend
  most hurt within 8, or the one you point at, to your side blessed 3 s; alone, it drags in the small
  goblin you face, reeling 1 s; 14 s), LANTERN LIGHT (0.3 s windup, 3 tiles: 12 damage and 12 mending,
  both growing with coals like every heal, small ones blinded 1 s, 18 s).
- **The room decides**: one dispatcher (`sim/skills.ts`) fires and steps them; one small file each
  (`stamp.ts`, `areas.ts`, `sic.ts`, `rogue.ts`, `tether.ts`, `cleric.ts`, `facing.ts`). What they
  leave lives in lists a friend's screen is sent already: zones (now with a `kind`: volley, fire), bolts
  (knives), smokes (vanish), and fields on heroes and goblins (`tether`, `vanishUntil`, `tow`, the
  hound's `pin`). Rings are drawn (`client/skillsdraw.ts`) from the same numbers, while the hero winds
  up; player rings are never red.
- **Taught one by one** (`shared/skillteach.ts`, `SKILL_STEPS` in drills.ts): the first at level 3 for
  150 (the old `skill` lesson), the second at 5 for 250, the third at 7 for 400. A new skill is carried
  at once; changing which you carry stays free at the trainer. Old heroes keep what they had: a Warrior
  taught before today (no `taught` list yet) still knows the War Cry.
- **The screen** (`client/trainerui.ts`, `client/trainsections.ts`): SKILLS, TECHNIQUE (the class
  technique and the dodge's leave-behind), RANKS and KNACKS, each a header you tap. Closed, a header
  says where you stand (CARRYING WAR CRY, 2 OF 3, NEXT AT LEVEL 7; SLAM 1/3; 6 OF 28) and how many things
  inside are READY. Open on a phone the first time: SKILLS and RANKS; after that as you left them, on
  that device (localStorage). A skill row says CARRYING, CARRY, LEARN, or its level, its line, and
  TAUGHT AT LEVEL n FOR n GOLD. Level-up picks stay above the sections.
- New words (for the lore keeper and line editor): SHIELD STAMP, VOLLEY, SEND THE HOUND, VANISH, KNIFE
  FAN, FIRE RING, STORM TETHER, CENSER CHAIN, LANTERN LIGHT and their buttons (STAMP, VOLLEY, HOUND,
  VANISH, KNIVES, RING, TETHER, CHAIN, LIGHT); all fifteen lines in `skillwords.ts`; the class sheets'
  "Later it teaches..." sentence; callouts STAMP, GONE, FIRE RING, PINNED; headers TECHNIQUE, RANKS;
  CARRYING, CARRY, LEARN, READY, NEXT AT LEVEL, TAUGHT AT LEVEL n FOR n GOLD; the carry note.


## 2026-11-03: setting a house alight (Kyle; Claude Opus 5.5)

Kyle: "Instead of going into a building that's a small house, you can firebomb or light the house on
fire. It goes up over time, smokes, and flushes out or kills things inside ... Con: maybe there are
prisoners in there. You cannot enter a flaming house." Then: "Not right at the door; maybe a spot to
the side that glints a little as you get close, but always the same spot ... Also a Mage can
accidentally burn it down, ditto anyone who throws fire oil."

- **The kindling spot** (`shared/kindling.ts`): every house on a job you could walk into (cottage or
  barn, standing or half fallen in) has one woodpile stacked against a side wall near its front corner,
  side and height from the house's own seed, kept clear of other walls and bushes with room to stand.
  Never at the door. Big houses (longhouse, manor, tithe barn) get one too and are slower: 2.4 s to
  light, 40 s to burn. Dens keep their rules (no spot; fire burns them out as before). Houses already
  burning or fallen in across their door have none.
- **Lighting it** (`sim/kindle.ts`, like a nest: `sim/torch.ts`): within 1.05 tiles GRAB reads BURN (laptop
  G BURN); crouch 1.5 s (a hit, a swing, a dodge or a step puts it out, starting again from nothing).
  State on the block (`lighter`, `lightT`), so a friend's screen has it; the press goes through the grab
  intent, the room decides.
- **By accident** (`sim/catching.ts`, numbers `CATCH` in tuning.ts, rolled on the room's own fire
  stream): a Lamp Oil flask bursting against a house 90% (at its kindling 90%), the oil barrel 90%; a fire
  spell or fire relic's burst against the wall (within 0.4) 75%, the edge of a burst 12%; a spark or fire
  arrow striking the wall 12%; a Fire Ring reaching it 30%; a burning goblin rubbing on it 4% a second; a
  burning neighbour within reach 2% a second. Dens, sheds and fences still catch every time.
- **Burning** (`sim/houseburn.ts`, `HOUSEBURN` in tuning.ts): catches 3 s, burns 24 more (a barn 30, a big
  house 40), the roof comes in: a burnt shell (ruined). Its health falls on that clock, so the flames
  grow (flat and 2.5D; smoke in both). Nobody goes in once it's alight. What's inside comes from the
  leader's game (`client/houseindoors.ts`): a house someone's been in from its room, one nobody has from
  its plan. Goblins choke 2.5 a second until they're out: the awake from 1.6 s, one every 0.9 s; the
  sleeping somewhere in 4 to 14 s (4 to 22 in a big house), so the longer it burns the more die; each
  comes out of the door on fire for 1 s, hurt, alert, into the street (its loot falls there). One the
  smoke has all but killed comes out at 1 health and drops on the doorstep (my call: a body in the
  doorway reads better than a silent count, and its kill and loot land where you can take them).
- **The caged** are lost as the roof comes in: `cagelost`, counted on the run as before, never a failed
  job; each takes 15% off the job's pay (at most 60%), and the result already says "Lost to the fire".
- **Chests in houses** (new, my call: the brief assumed a chest inside could burn, and houses had none):
  20% of cottages, 15% of barns, 6% of looted ones, 40% of big houses have one, on a stream of its own so
  nothing else about the house moved. Burned, it leaves 6 to 14 gold and, half the time, one plain piece
  at the door (`charred`).
- **The warning**: the gold diamond on known captive houses is unchanged; at the kindling of any house
  with someone still caged (`cry` on the block, set by the leader from the plan or the room), a muffled
  cry through the wall and SOMEONE'S INSIDE over the pile, once each time you come up. Accidental fire can
  still take them.
- **A friend inside** (per-player houses): when a house with a room catches, that room burns too (its own
  plan squeezed into the time left: `blazeFrom` in shared/blaze.ts), the smoke hurting 5 a second after a
  4 s grace (it can down you), fire patches and beams as in a burning house; as the roof comes in,
  everyone still in is thrown out into the street (`outOfTheFire` in game.ts). A guest's room is sent
  whole again so the fire shows on their screen (`coop.fresh`).
- New words for the lore keeper and line editor: BURN (button), G BURN (laptop), SOMEONE'S INSIDE
  (`client/kindlecue.ts`). Fx words reused: BURNING.
- Tests: `tests/houseburn.test.ts`; stress scenario 26 (a friend inside when the leader lights the
  house); screenshots `scripts/houseburn.cjs`.
## 2026-11-03: relics fade, the church takes them, and seven kinds to find (Kyle; Claude Opus 5.5)

Kyle: "Relics fade with usage but can be recharged at the church", "We should have more relic types",
elements built into a relic ("rare and more valuable, higher tier, more durable, still fades, but can't
be recharged"), "If you leave a relic higher charged at the church you get something", "Donate two, get
one random one back", relics a rare drop; then "I like relics being interactive with the world also ...
strong based on physics and buff or debuff ... clear that it doesn't have friendly fire".

- **Relics are items** (`shared/relicitems.ts`): id, kind, tier, element or none, charge. Plain tier 1
  holds 24 uses; elemental tier 2 holds 36; LOUD elemental (tier 3) 48. Every use spends one (the room
  spends it as the relic fires, `sim/charge.ts`); at nothing it's DARK: the RELIC button greys, a press
  says DARK and does nothing, and it's kept. The class skill has no charge. Saves migrate: every old kind
  owned becomes a full plain relic, still carried (`fitRelics`, in `client/save.ts`). Ivo's element
  setting stays shut; found relics come with theirs built in.
- **Seven kinds, all sparing friends** (`shared/relickit.ts`, `sim/foundrelics.ts`): JAVELIN (pins),
  GRAPPLING HOOK (now also yanks a barrel, crate or plank back at you, bowling goblins over; heavier
  props pull you), LODESTONE (was an orphan Mage relic; drags goblins in, bursts), GALL BOMB (lobbed,
  2.2 tiles, 16 damage, throws goblins and barrels, small ones dazed 1 s, heavy ones slide less), WIND-UP
  BOW (set down, shoots the nearest goblin in 5.5 tiles every 0.55 s for 7 s, each bolt hobbles: 60% pace
  for 1.6 s), BONE BELL (goblins in 3.4 tiles flinch and drop their swing unless striped, small ones
  pushed back; friends in reach quickened x1.25 for 4 s), BUTCHER'S KNUCKLE (a line 5 long: 12 damage,
  thrown back hard, small ones stunned 0.9 s, every goblin hit MARKED: the next blow from anyone x1.5).
  Each buffs friends or debuffs goblins. Cut from the brief's examples: tooth, cinder, heart (a fire
  patch and a heal didn't act on the world).
- **No friendly fire, and you can see it**: relic shots and blasts carry `relic` (sim/bolts.ts) and never
  hurt a friend or anyone freed; a friend inside a blast or the knuckle's line gets SPARED in warm white
  with a gold flicker; every relic telegraph and area is gold (the lodestone's purple well too), never
  the goblins' red; every relic card says SPARES FRIENDS. Tests prove no damage, no shove.
- **Rarity**: a named butcher drops a relic 12 in 100 (the room's own seeded stream, `relicRng`, so loot
  and goblins don't shift), picked up by whoever walks over it and carried at once if nothing is. A won
  deep dive surely gives one: a kind you lack (plain, full), else any. Any rolled relic is elemental 15
  in 100, and LOUD 30 in 100 of those (about 4.5 overall). The wood still gives the javelin.
- **The church** (THE STEP, from Father Odric's RELICS button; `shared/church.ts`, `client/churchrelics.ts`):
  RECHARGE a plain one, 3 gold a missing charge (a dark plain one 72); Isolde takes it round to the
  Lantern. Elemental ones are refused. LEAVE IT: the relic's gone and you carry the church's light for
  jobs: floor(fill x (3 + tier - 1) + 0.2), so full plain 3, half 1, nearly dark 0, a full elemental 4,
  a full LOUD 5, adding up to at most 6. Lit: blows land x1.15, and goblins judge you 3 tiles nearer and
  notice you 2 further off (the censer coal's rule, `sim/lantern.ts`). One job spent per job, won or not.
  LIT on the HUD; the job result says how many are left.
- **Two for one at the church, not Ivo's** (my call: the step is where things are given up, and the
  one back is "from what's been left before"). Tap two, see "N IN 100 IT COMES BACK WITH AN ELEMENT",
  leave them. Odds: elemental 10 + 30 per elemental put in + 15 per bright one (75% full or more), cap 85;
  LOUD 20 + 30 per LOUD + 10 per bright. The roll is seeded by the hero's id and their forge count, made
  and saved before the light starts: a reload gives the same relic, the next forge a new one. The forge
  (`client/forgeanim.ts`, 2.6 s, a tap skips): the two drawn in, a column of warm light, relic pictures
  flickering past slowing like a wheel, a flash, the new one turning in the light with its name.
- **Online**: charge lives on the hero in the leader's room (`found`, `relicItem`), so the leader's room
  decides uses; each player's own game writes it to their save as it changes (keepkit.ts, like the pack),
  so a drop keeps what was spent. The church's light is set from each player's own save when the room
  dresses them and spent by their own game at the end.
- New words for the lore keeper and line editor: all of `client/relicwords.ts` (each kind's line, SPARES
  FRIENDS, CHARGE n / n, DARK, LOUD, SPARED, QUICK, MARKED, SLOWED, RELIC, THE STEP, RELICS, RECHARGE (n),
  FULL, LEAVE IT (LIGHT FOR n JOBS), LEAVE IT (NO LIGHT), TWO FOR ONE and its lines, LEAVE THE TWO, CARRY
  IT, TAP TO SKIP, LIT, Isolde's and Odric's lines, Ivo's three on how a relic sounds), the names GALL
  BOMB, WIND-UP BOW (button WIND-UP), BONE BELL, BUTCHER'S KNUCKLE, and "FIRE BOMB"/"LOUD STORM WIND-UP
  BOW" style names; BELL on the bell's ring. "Blessed" is not used for the church's light.
- Tests: `tests/relicfight.test.ts` (charge, dark refusal, each kind, friends untouched),
  `tests/relicchurch.test.ts` (recharge, light, two for one, drops, migration, charge kept). Screenshots:
  `scripts/relics.cjs`.

## 2026-11-03: the town hall votes on its walls, giving a relic up is plain, the way out is lit (Kyle; Claude Opus 5.5)

- **The church step.** LEAVE IT is now GIVE IT UP, and a first tap only asks: the card shows "Gone for
  good. You carry the church's light for n jobs: +15% damage, and goblins come for you first." with YES,
  GIVE IT UP and KEEP IT. A line above the cards says the same before anything is tapped. Two for one
  says both are gone for good and gives no light, and asks the same way (GIVE BOTH UP, then YES, GIVE
  BOTH UP). The light's line is built from `LIT.dmg`, so the number can't drift from the fight. The LIT
  badge on the HUD says it on hover or as a note on a tap (`client/litbadge.ts`).
- **One CLOSE.** The tally panels (Odric's first talk, and Isolde's) had their own CLOSE and the panel's;
  they now keep one.
- **The town hall.** Two boards on the wall either side of the valley map (`vote` hangs), one per choice,
  each with its short name (new `Choice.short`: FARM THEM, TAKE THEM IN) and the names of who voted for
  it; across the top, when it closes ("CLOSES AT 4 VOTES: 3 TO GO"; alone, "YOUR VOTE DECIDES"; then
  what the council chose). There's no clock on a vote, so "closes" is the quorum. Names come from the
  world: `WorldState.voters` (voter, a device, to the name of the hero who last voted from it), set in
  `contribute` (so the server keeps it too; names are already cleaned there). One set of rows
  (`client/voteboards.ts`) is drawn by both views: on the flat glow layer, and in 2.5D on the overlay,
  each row placed on the wall's face by projection (a texture on the wall smeared under the 3D post
  pass). The shelves, banner and notices came off that wall; the torches moved between boards and map.
- **Under the boards.** Alder Bram argues for the plough and Goodwife Sell for the camp (existing
  townsfolk; their usual talk returns once the council has chosen). Voting is still at the reeve only.
- **The reeve across his table.** `Npc.reach`: a person can be talked to from that much further off.
  Hollis has 1.4 tiles more, enough from the near side of the table.
- **The way out.** Every way out of a room (`map.exit`, or roads at a fork: what the room judges you
  leaving by) has a lit threshold on the floor with an arrow out, when it's open: `client/exitmark.ts`
  places it and draws the flat one, `three/exitmat3d.ts` the 2.5D one. It replaced the chevrons.
- **Ivo is busy** for now (Kyle): one line, no panel. Relics are still carried from the pack's relic card.
  His old bench stays in `shops.ts` behind `IVO_BUSY`; the town tip no longer sends you to him for relics.
- New words for the lore keeper and line editor: listed in the report for this change (relicwords,
  storewords FORGE.busy, councilwords).

## 2026-11-03: the council sits a week (Kyle; Claude Opus 5.5)

- Kyle: "it shouldn't be playing alone; the server is anyone who comes into the server, and it happens
  that WEEK." The 4-vote quorum is gone. A council vote is open to everyone on the server all week and
  closes at midnight at the end of Sunday, Pacific (`shared/councilweek.ts`: America/Los_Angeles through
  Intl, so daylight saving is followed). A council opening with under a day left sits the next week too.
- At the close the most votes win and the effects land then. **Tie:** the council sits one more night
  (24 hours, once); tied again, Reeve Hollis breaks it for the side that was voted for first. **No votes
  at all:** it sits another week, and again, until somebody votes (nothing the council can decide is
  decided for it).
- **Changing your vote:** yes, until the close. Still one voice per device (all its heroes share it);
  the boards name it by the hero who last voted from it.
- **Lazy, no cron:** `settle(w, now)` (story.ts) runs whenever the world is read or written: in
  `contribute` (after each change), in both world stores' `load` (Redis settles what it read without
  writing it back; the same ballots give the same result, and the next write keeps it), and in the
  browser each frame (`Game.settleCouncil`), which is how a world off the server closes too. Votes after
  the close are refused. `memoryWorldStore` takes a clock for tests.
- The boards' top line: VOTING CLOSES TONIGHT / TOMORROW NIGHT / SUNDAY NIGHT (by the Pacific
  calendar), then THE COUNCIL CHOSE: X. Each board: its count (n VOTES) and up to three names.

## 2026-11-04: Text that explains the game says what it does (Claude Opus 5.5)

Kyle: the explaining text was "too much and too little", with "obscure language instead of saying what
things do" and "short, stilted sentences". The rules are now `docs/lore/prose-notes.md` section 4.
- Knacks, traits, modifiers, drills, hungry gear, potions, relic and skill lines name the effect and the
  number ("Blocking costs 25% less stamina"), not "a fifth" or "a little". Names hint at the effect:
  IRONHIDE is EASY BLOCK, SCARRED is THICK SKIN, BULWARK is STAMINA ON PARRY, the element traits are
  FIREFORGED / FROSTFORGED / STORMFORGED. The longbow trait TRUE RELEASE is DEADEYE, so it no longer
  shares a name with the Ranger knack (now PERFECT SHOT).
- One word per thing: **stamina** everywhere (the BREATH modifier and drill are STAMINA), **block** for the
  button (lessons say "hold block", not "your guard"), **change element** for the Mage's channel.
- "Mercy" is off screen (story bible): the Cleric's WIDE MERCY / EARLY MERCY / MERCY chain are WIDE HEAL,
  EARLY HEAL and HEALING; Rowan's boss tune is "No Quarter at the Bell". Code ids keep `mercy`.
- The well's coin now says what it buys (+30% damage, 25% less taken for the first 20 s of the next job,
  numbers from BLESSING), and stays "luck" on screen: "blessed" is Sanctuary's ground only.
  The "no guard" callout reads CAN'T BLOCK: ROLL / JUMP / DASH / BLINK for every class.
- Every change is listed in `docs/copy-pass.md` for the lore keeper and line editor; the whole game's
  copy is in `docs/copy-inventory.csv` (id, area, what, text) for Kyle's review. Not touched: `card.ts`
  and the KIT lines (another pass).

## 2026-11-04: off the edge of the world: the holes shut, and the dread for anyone who finds another (Kyle; Claude Opus 5.5)

Kyle: a friend "likes trying to break things, like teleport through a wall"; "if you wander off the
path you get a warning and a sense of dread, and if you stay out you get swarmed by goblins ... or a
giant hidden shadow monster thing that crushes you."

- **The holes, found by hunting them** (`scripts/dread/holes.ts`: every job place on two seeds and
  their houses, the town and its halls, the yard and the wood; a hero stood by every wall, tree and
  river tries a far blink, a roll, a shield charge, a shadowstep with nobody to step behind, a hard
  knockback and plain walking). Before: about 5,700 ways out across 134 maps (before walking was tried). After: none, and no false
  alarms (every goblin, chest, door, way out and townsperson stands on walkable ground).
  - A tick is 1/30 s, so a Mage's far blink moves 1.27 tiles a tick, a roll or step most of a tile, a
    shield charge and a 14+ tile/s knockback half a tile. `collide` pushes a body out by the nearest
    side, so past the middle of a fence, a tree of the wood's wall, a river or the keep's 1.6-tile
    wall (into the shut Old Chapel yard) it came out the far side. Now every one of those moves goes in
    steps under a hero's radius (`shared/sweep.ts`, `travel`), sliding along what's in the way.
  - Shadowstep teleported (behind a goblin across a fence, or 3 tiles ahead through anything): now it
    travels there and stops at a wall. So do the hook's zip, the Stoker's draw and a friend brought
    into a room beside you (they were dropped 0.8 tiles off with no collision, into a wall if you stood
    against one).
  - `collide` clamped to the map's edge first and pushed after, so a body squeezed between furniture
    and the wall (the church's bed, 0.3 tiles off it) was pushed out past the edge. It clamps after too.
  - A body could be wedged into a gap narrower than itself (Barrowby plants a hedge 0.46 tiles from a
    cottage), pushed out of one thing into another. A swept step that ends wedged is taken back, so a
    hero stops at the gap. Walking is swept too. (The hedge itself is the terrain's to fix.)
- **Out of bounds** (`shared/reach.ts`): past the map's edge, the middle of a body inside something
  `collide` stops bodies on, or on ground nobody can walk to from the way in. Walkable ground is a
  quarter-tile grid flooded from the way in by the same things collision uses (blocks still standing,
  round things, braziers, deep water; ledges count, joined by their ramps), never cutting a corner
  between two shut cells; rebuilt when the blocks change (a gate opened, a house burned down). A body
  touching walkable ground (within 0.6 tiles) is in, so a squeeze is never a crime. A room can also
  forbid areas outright and add ways in: the wood counts every clearing as ground, gates shut or not,
  so a cutscene that moves you never trips it; past its tree wall is out.
- **The dread** (`sim/dread.ts`, `DREAD` in tuning), judged by the room every tick, so a guest's hero
  is caught by the leader's room. Out of bounds, the dread builds a second a second: the warning at
  once, worse at 4 s, seized at 8 s (held, nothing pressed does anything), and 1.1 s later crushed or
  pulled down where they stand. Back in bounds it drains five times as fast as it came, so stepping
  back in lifts it in a moment and dancing on the line doesn't reset it. The last spot each hero
  stood in bounds is kept every tick; the taken body is put back there, downed.
- **What comes, by place** (`sim/dreadplace.ts`): wild places (Hangman's Wood, the Copperdeep, the
  Sheepwash, the Peat Cuts, Sallow Carr, and the prologue wood) send the shadow, a hand out of the dark
  that crushes them; settled ones (villages, farms, fields, streets, the manor, the burned village,
  the charcoal and river camps) and the inside of any house send the hungry, pouring out of the dark
  and pulling them under. The swarm is drawn, not spawned: nothing to kill, loot or farm.
- **The penalty: down, under the usual rules.** In a party, down and bleeding, a friend can get you
  up, nobody comes and it's your one get-up or out. **Alone, it's one of your three downs** (my call,
  not the whole job: the trick costs a heart and gains nothing, and three of them lose the job as
  usual). A Ransom Coat can't buy it off.
- **Town and the yard** (and Wickhold's halls) never kill: out 1.2 s, a dark flicker, a quiet line,
  and you're back where you last stood in bounds, unhurt.
- **On screen** (`client/dreadfx.ts`, `dreadart.ts`, `dreadsound.ts`), the same over FLAT and 2.5D: a
  low-resolution overlay under the HUD, and a grey layer (`mix-blend-mode: saturation`) that drains the
  colour. Your own hero: the edges darken and close in round you in dithered steps, breathing with a
  heartbeat that quickens (about 1 s, 0.6 s, 0.36 s once seized), a low drone that swells, a breath far
  off at the warning and a whisper at the late stage, and a plain line over you. Late stage: something
  many times a hero's height rises at the edge of the dark, a small skull on a long neck leaning in,
  pinprick eyes (wild); or pairs of sickly green eyes gather in the dark round you, more and more,
  blinking (settled). Taken, on every screen, so a friend sees it: a dark pool under them, pale eyes
  far above, and a hand bigger than a cottage coming down with its fingers spread round them, closing
  at the crush, a heavy impact and a big shake, then rising away; or the hungry running in from all
  round and piling on, then scattering back into the dark. Your own screen goes black for a moment.
- **Online:** `dread`, `dreadBy` and `takenT` ride on the hero in the leader's patches (never set to
  undefined, so the patches carry them); the `dread` events go to each friend with their room's.
- New words for the lore keeper and line editor: all of `client/dreadwords.ts`. **Assumed for the lore
  keeper:** the thing in the wild dark is never named or explained on screen, never called a shard, a
  god, a demon or the Hungry King, and nothing says whether the hungry fear it. It could be what was
  "down there first" at the Copperdeep, or not; that stays for later. It doesn't speak.
- Tests: `tests/dread.test.ts` (the stages at their times, stepping back in, the body put back, town's
  set back, a party's down, a solo heart, wild against settled, the snapshot, a blink and a shadowstep
  at a fence, the bed by the wall). Screenshots: `node scripts/dread-look.cjs`.
## 2026-11-04: Cage hits you can see, and false prisoners (Claude Opus 5.5)

Kyle: "In 2.5D it's not clear when you're hitting the cage (no shake)" and "Sometimes when you rescue a
prisoner, their body gets ripped apart and it's 2 goblins who then attack you (1 in 20 chance)."
- **Hits.** The flat view only flashed a prop for a frame and the 2.5D model did nothing; no event said a
  blow had landed. Now `damageProp` pushes `prophit` when a cage, barrel, oil barrel, crate, table or
  larder rack takes a blow and holds (never planks and staves on the floor). Both views shudder the prop
  on its spot for `PROP.shake` (0.22 s, `client/propshake.ts`, one function for both) and flash it (the
  2.5D model goes a lit pale, not the figures' unlit white, which turned the cage into a white block).
  The shared effects (`client/fxcages.ts`) throw sparks off a cage's bars, splinters and dust, a spatter
  off a larder rack, a small screen jolt; sound is an iron clang plus a thud for a cage, a thud for wood.
  `chop` (a blow on a den or wooden wall) had only its sound in both views: it now throws splinters too.
  Damage state: the flat view shows none for props, so neither does 2.5D; buildings already show theirs
  in both.
- **The roll.** As a cage breaks, `rollFalse` on the room's own `cageRng` (seeded `seed * 2971 + 41`, so it
  never shifts a goblin's, loot's or fire's roll): `FALSE_CAGE.chance` 1 in 20. The stream is handed to
  the World only when `room.falseCages && !room.indoors`; `runRoom` sets `falseCages`, `interiorRoom`
  never does, the yard and town never do. So the cages that can be false: the rescue's and the story
  mission's cages in a job's last room, and the low road's cage in each room. Never a captive in a house
  (the cry at its woodpile, SOMEONE'S IN THERE, is always real), never off a job.
- **The reveal** (`sim/falsecage.ts`): a Survivor with `tearAt` (break + `FALSE_CAGE.lurch`, 0.9 s). It
  stands silent where the cage was and lurches harder and faster (`client/falsedraw.ts`, used by the flat
  view and the 2.5D card; the box figures jerk and swell), splits down the middle and two red eyes show.
  At `tearAt` the room marks it gone, pushes `torn` (gore.ts `torn`: a body coming apart from inside) and
  spawns `FALSE_CAGE.goblins` (2) scrappers, alert, either side, held in a `flinch` of `FALSE_CAGE.beat`
  (0.6 s) so it reads, each with a `spotted` (the "!" and a goblin cackle). Then they come for you.
- **No words.** A false one says none of the captives' lines and never "help me" (the mimic's line, story
  bible); no new player-facing line was written.
- **The goal.** `waiting(s)` (freed, not home, not false) is what the goal, the marks, the way-finding,
  the edge marks and `walkOut` count; a false one is never hurt by the party (`living`), never tallied as
  rescued or killed. A rescue with a false prisoner finishes on the real ones.
- **Online.** Decided in the leader's room; `tearAt` rides in the survivor list friends already get, and
  `torn` and `spotted` with the room's events.
- Fixed on the way: the 2.5D figures' atlas cleared every card drawn earlier in a frame when it grew (a
  canvas resize wipes it), so a hero could blink out the frame new goblins appeared. It now keeps them.
- Tests: `tests/falsecage.test.ts` (the rate over 5000 seeded rolls, the reveal and the beat, the rescue
  finishing, house captives never false, determinism and the online patch), `tests/props.test.ts`
  (`prophit`). Pictures: `scripts/cages.cjs` (Playwright's clock, stepped a frame at a time).


## 2026-11-04: a Mage's bar is MAGIC, and the spellblade parries (Kyle; Claude Opus 5.5)

Kyle: "Change all Mage things to magic." and "Spellblade can perfect parry."

- **MAGIC for a Mage** (`shared/barword.ts`: `barWord(cls)`, `barWords(text, cls)`). Same bar underneath
  (`hero.stamina`); only the word and a soft violet tint change for a Mage. Where it shows: the kit rows
  ("costs magic"), NOT ENOUGH MAGIC on a fizzle, "-40 MAGIC" rising off the hero, the Mage's knacks
  (MAGIC ON CHANGE, QUICK RECOVERY, LIGHT BLINK, the MAGIC chain), the armor lines, MAGIC RECOVERY on
  the sheet and cards, gear mods and traits on a Mage's card, the trainer's rows, Wall Brandy's words.
  The laptop bar gets a MAGIC tooltip and goes violet (`.st.magic`, still red when winded). Every other
  class keeps STAMINA.
- **A Mage's magic on a phone** (Kyle: "it's not clear at all that I have a magic bar ... I don't know how
  I can teleport", then "Oh, it's the pips. Those should just be around the blink, as a cooldown I
  guess."). For a Mage the pips leave ATTACK and ring BLINK, violet, filling as magic comes back
  (`cluster.ts`). Winded, BLINK goes dull stone: it can't fire. With less magic than a blink costs (60,
  less with LIGHT BLINK) the cost shows small in red on its corner: it still fires, but leaves you
  winded (that's the room's rule, `wantsRoll` in `sim/hero.ts`; unchanged). No extra bar under health
  on a phone. Other classes keep their pips round ATTACK.
- **The spellblade parries** (`shared/mage.ts`: `parryOnly`, `spellblade`; `guardOf(kit)` in
  `shared/weapons.ts` says what a kit's block button does). Block in the parry window is a real parry
  (`sim/combat.ts`): the goblin is staggered, the counter window opens, PARRY shows, as for the
  greatsword. On top, `parryFills` (`sim/spellblade.ts`) fills the blade. Holding block says it can't
  (`noblock`), as for any parry-only kit. CATCH, CAUGHT and the `caught` event are gone. On screen: the
  touch button says PARRY, the BUTTONS legend's PARRY row adds "A parry fills your blade", GUARD reads
  PARRY ONLY, the laptop hint says PARRY, the kit row's ALSO is "Parry fills the blade", and the sheet
  shows the PARRY WINDOW. No PERFECT on a parry (none shows for any parry).
- Not changed: trait and mod rolls stay by class, so a spellblade still can't roll RIPOSTE, BULWARK or
  PARRY mods (Kyle's call if he wants them).
- Tests: `tests/magekit.test.ts` (the parry: no damage, PARRY, stagger, counter window, blade full),
  `tests/kitwords.test.ts` (PARRY ONLY, Mage rows say magic).


## 2026-11-04: Orla of the watch meets you in the wood and walks you to Wickhold (Kyle; Claude Opus 5.5)

Kyle: "In the tutorial, remove Hew's warning about getting to Father whatever. Have, to the left, a
guard on patrol come out to meet you, say some stuff and take you to town."

- **Hew's last words are gone** (`LINES.last`). Grabbed, he goes straight to the screams; the cutscene
  is 0.45 s shorter (`CUT` in `sim/woodcut.ts`; `scripts/woodlook.cjs` beats moved to match).
- **The guard is Orla of the watch** (the bible already has her knowing Hew by his boots, and the
  watch complains about boots). `sim/woodguard.ts`, lines in `shared/orla.ts`. Once the Stoker is dead
  and the relic card is gone, and its callers are dead too, she comes along the road from the west,
  out of sight (12 tiles west of you, never past the road out), walks up to you through the gap west of
  the hut and stops a step off. The world holds for her four lines, a tap each (the same `talk` box as
  Hew's waking): she saw the smoke from the road; those are Hew's boots, so that's him by the hut; you
  lived through the field when nobody else from the column did; come with her to Wickhold, she'll take
  his tally of the dead to Odric. Then she stoops by Hew's body a moment for the stick and walks west; THE
  ROAD says "Follow Orla west, to Wickhold" and the arrow points at the road out.
- **The road out** (`ROAD_OUT`, unchanged, a few steps west of the hut) takes you to Wickhold only once
  she's spoken, so nobody leaves the wood before meeting her. Tapping her afterwards repeats her last line.
- **At the gate**: Orla's greeting panel is gone (she isn't introduced twice). The road narration
  (`LINES.road`, unchanged, the wet left heel) shows alone under WICKHOLD, one tap. `greeting` is `'road'`.
- **The tally** (Kyle: "It's not clear that you get a tally stick, or what it means, or that you're
  supposed to go to the church to turn it in. Let's simplify"): the simplest version. Orla takes it
  ("his tally of the dead"); the player never carries or delivers anything, so no tracker objective or
  quest marker. Odric's separate tally scene (the panel with the notches narration) is gone: the first
  time you open the church after the wood, his usual panel starts with one plain line,
  "Orla brought me Hew's tally of the dead. I've cut a notch on it for Hew." (`TALLY.odric`, cleared by
  `profile.tally`). Not changed: a Healer's cold censer still gets no town objective; Isolde relights it
  when the Healer visits their trainer, as before.
- **Facing**: an NPC without a round can now carry `fx`/`fy` (`Npc` in `shared/arena.ts`, read by
  `npcAt`), so Orla faces the way she walks in flat and 3D. Hew is unchanged (he sets neither).
- Story bible's prologue and after-the-wood entries updated.
- Tests: `tests/wood.test.ts` (the hut): no Odric in Hew's words; the road out does nothing before she
  comes; she waits for the callers; she spawns well west, stops beside you, says her four lines; stoops
  and leads west; the road out then reaches town and the road greeting.


## 2026-11-04: Barrowfields and side-way words, lore checked (Claude Opus 5.5)

- Butchers: BLACKNAIL and THE TANNER became SPLITNAIL and THE DROVER (too near the Blacktongue title; tanning points at the books' skin goods).
- The posting is in the town's voice ("The hungry have camps all over the Barrowfields..."), never "goblins" or "one big open map".
- One word per thing: CAPTIVES (not prisoners), the CHAINED CHEST (not cache). The beacon is lit, not opened. The way out has no compass direction.
- Praying at a wayside shrine gives the well's luck, so it reads "Lucky: +30% damage, 25% less damage taken for 90 s". "Blessed" stays Sanctuary's.
- PRESSURE became ALARM: noise brings more of them.
- THE GLADE became THE SPRING: the room shows up in the village, fields and fen too, and every one has its spring.
- New lore to record or reject (Kyle): the barrows are grassed mounds older than the villages, with a shrine whose owner stays unsaid; siege engines in the Barrowfields foreshadow chapter 5 without naming the King; the beacon on the drove road brings the watch (a fire, not a bell; bells stay for chapter 5); horns are never magic; where the cookpot poison comes from stays unsaid, never the church; the chained chest's dead soldier stays unnamed. Open: why the hungry come at whoever holds the shrine.


## 2026-11-04: The new sorts, lore checked (Claude Opus 5.5)

- Words: NETTED, then ATTACK TO BREAK FREE (laptops don't tap; every class has ATTACK). CUT FREE on the button and the popup. `{n} GOLD STOLEN`, BITTER STOLEN or BRANDY STOLEN, THIEF GOT AWAY.
- The banner is a cowhide, never a person's skin, hung with keys, buckles, a spoon and a shoe (no teeth: a Blacktongue detail, and "Teeth" is the town's name for the hungry). A steady iron glint, never pulsing gold. Nothing on it rings: bells stay the town's.
- Log-carriers are drawn as two ordinary goblins under the log, not butchers (a butcher's size comes from the sliver). No person is ever driven before the ram.
- Blind hunters can't be BLINDED: the longbow's perfect still crits. Their sockets stay dark, never lit, so they're never mixed with the cold white eyes past the map's edge.
- A routed goblin scatters; no hands up (too comic).
- Lore to record or reject (Kyle): wolves are ordinary wolves kept chained and starved, no shard, never hurt the hound, no joke over a dead wolf; nets are for taking people alive; crows are ordinary crows that wake the hungry by accident (never big, ridden or feared by goblins); stolen gold never touches the Want. Open: where the blind hunters come from (lean: captives who turned in the dark of the Copperdeep), and whether sappers dig beside the captive diggers.

## 2026-11-04: a recap before the knack, quiet drops, a tracker that folds (Kyle; Claude Opus 5.5)

Kyle, from his phone: "On raid end or mission end it shouldn't immediately hit you with pick a knack; it
should give you a mission recap though", "Items falling take up a TON of space on mobile ... it shouldn't
pop up unless you click on it to pick up", "I want the mission to be smaller in the top left unless you
click it to expand", "Ditto the where you are and what you have to do in the main area", and "Can knacks
be highlighted if you click your inventory and have knacks to spend?"
- **The recap** (`client/recap.ts`, counts in `client/recaptally.ts`, words in `client/recapwords.ts`): every
  job's end, won, lost, left or an expedition, is one framed card in labelled rows: ROOMS (or JOBS and SIDE
  JOBS on the Barrowfields), GOBLINS, DENS, DOWNED, TIME, a rule, then GOLD, XP, SAVED, LOST, FOUND (gear
  picked up off the floor), TREASURE, RELIC. One button: NEXT: PICK A KNACK when a pick waits (it opens the
  knacks), else BACK TO WICKHOLD. Each player's own: the run is the leader's, the downs and what was found
  are this player's (what they carry now against what they carried when the job began). `Run.goals` counts
  the pinned jobs done; `Run.began` is the leader's clock at setting out, for TIME only (never the fight).
- **Drops stay quiet** (`client/lootcard.ts`): on the floor a drop is its sprite, glint and the LOOT or
  FORGED word as it falls, nothing more. Its card (with the comparison) opens on LOOK in the phone's
  context slot, a tap on the drop, or F on a laptop (the prompt reads F LOOK); TAKE or F again takes it,
  CLOSE or walking off shuts it. Gold, potions and relics are picked up by walking over them and never had
  a card.
- **The tracker folds** (`client/bannerfold.ts`, pieces in `client/tracker.ts`), on phone and laptop, on a
  job, in town and in the halls: one short line (the room diamonds and the objective; on an expedition
  N OF M JOBS LEFT until they're done; WICKHOLD, DAY N in town), a + to show it opens. A tap opens it (an
  expedition's opened tracker lists every pinned and side job, done or what to do), another tap folds it.
  It opens by itself for 3 s when the objective or the place changes (a count going down isn't a change)
  and while an objective's done flash plays. The wood's lessons never fold.
- **Knacks waiting in the pack**: the pack's KNACKS button turns gilt with a slow pulse and reads
  KNACKS 1 TO PICK (`KNW.packPick`); the gold count on PACK stays.
- New lines, waiting on the lore keeper and line editor: ROOMS, JOBS, SIDE JOBS, GOBLINS, DENS, DOWNED,
  TIME, FOUND, TREASURE, RELIC, "2 of 3", NEXT: PICK A KNACK, LOOK, F LOOK, CLOSE (loot card),
  N OF M JOBS LEFT, DONE, WICKHOLD, DAY N, N TO PICK.

## 2026-11-04: PUBLIC WORKS, Foreman Judd and his crew; rats on the blood (Kyle; Claude Opus 5.5)

Kyle: "Should rename works to public works and have it be a foreman and people working around him
tidying etc." and "when there's blood and rats I want them to scurry away if you walk near them, then
come back later."

- **PUBLIC WORKS** is the on-screen name everywhere the player sees it: the spot, the stall (widened to
  3.4 tiles so the label fits), the board's title, the Old Quarter rubble's text, the sewer grate's,
  Dunn's line. Internal ids stay `works`.
- **Foreman Judd** (`shared/publicworks.ts`, look `foreman` in `client/npcs.ts`) stands just west of the
  works stall by its board; talking to him opens the board (`talk: 'works'`), as the spot still does.
  He takes the board's spoken lines (they were Reeve Hollis's): Hollis keeps the book, and Judd points
  at it. His two lines (`FOREMAN` in `shared/mendlines.ts`), one each time the board opens, in turn:
  "I don't pick what gets done, mind, the town does that with its coin and whoever turns up with a
  shovel, and I just point. Hollis writes it all in his book, every coin and every den burned, so don't
  go telling him you gave more than you did." and "My lot sweep and haul and fill the barrow, or that's
  the idea, and whoever you catch leaning on a broom will swear they're ~thinking~. They aren't."
  He never chooses what gets done (the bible: the town chooses with its gold and its feet).
- **His crew** (mute, in the background): a sweeper round the front of the stall, a hauler taking planks
  off the cart in the square up to the stall, and, while the rubble stands, a digger shovelling it into
  a barrow and tipping it a few steps back (gone once the Old Quarter is cleared). Each walks a short
  loop and stops at its corners to work: `Npc.stops` (`shared/npcstops.ts`, pure; `npcAt` returns
  `still` while they stand). Drawn by `client/crewdraw.ts` over their sprite, in the flat view and the
  2.5D view's cards (box figures, `?figs=3d`, walk and stand but carry no tools).
- **Same spot on every screen**: the crew carry `clock: true` and walk on Wickhold's wall clock
  (`townclock.ts` `onClock`, run each step in town), not the room's time (which starts at 0 each time
  you come into town). Screens agree to within their own clocks. The other townsfolk are unchanged.
- **Rats** (`client/rats.ts`, `ratspots.ts`, `ratdraw.ts`): on a job they gather at blood stains (the
  floor's stains read a little at a time and gathered into spots worth a rat) and at bodies left whole;
  in Wickhold by the sewer grate behind the Drowned Rat, in the alley between it and the infirmary, and
  behind its barrels. A hero within 2.5 tiles (1.2 creeping, `sneaking`) sends them bolting, long, low
  and zigzagging, away from that hero to the first wall, edge or solid thing that way (or into the dark
  a few tiles off), where they're gone. After 15 to 25 s with nobody within 4 tiles of the spot they
  come back one at a time, 1.5 to 3.5 s apart. At most 8 at once, the nearest spots first, none past 18
  tiles. A quiet squeak and a patter on scattering (`sfxTown.rats`, set up by the soundscape).
- **Cosmetic, and each screen's own**: the room never knows about rats, they never wake a goblin (that
  stays the crows', which are in the room), Math.random is used, and a friend sees their own rats.
  Drawn on the lit layer (dark body, a pink tail tip, a pale eye glint, never green, never glowing); in
  the 2.5D view on its flat layer at the floor, as its crows and slicks are (so, like them, not hidden
  behind a wall in front).
- Lore: Judd and his lines were checked against the story bible and voice guide in the lore keeper's
  terms and then the line editor's (this session had no agent tool to hand them to, so the same
  checklists were applied here). From the drafts: a line about the rubble was dropped so his lines
  still hold once the Old Quarter is cleared; "if you catch one of them, he'll tell you" became
  "whoever you catch ... they're" (the crew is anybody); both now run on with commas and a hedge
  ("mind", "or that's the idea") and end on the joke about a person, with one mark (`~thinking~`).
  New lore for Kyle to record or reject: the name Judd, and that the works have a foreman at all.
- Tests: `tests/publicworks.test.ts` (labels, Judd opens the board, the crew's loops and stops, the
  digger gone with the rubble, `stopsAt`), `tests/rats.test.ts` (they come once it's quiet, scatter at
  2.5 and not 3, closer creeping, come back one at a time, the cap, the room untouched, the town's
  spots clear of walls). Pictures: the scratchpad script `town3-look.cjs` (not in the repo).

## 2026-11-04: techniques are moves, three a class (Kyle; Claude Opus 5.5)

Kyle: "I want more techniques", and they should be "pure upgrades, not just choosing". Each class but
the Mage now learns three techniques at its trainer instead of three ranks of a bump. Each is a move or
a new rule, always on once learned, with any of the class's weapons. Names are placeholders for the
lore keeper.

- **Taught in order** (`shared/techniques.ts` TECHS, TECH_WORDS and every number; `drills.ts`
  TECH_LEVELS): levels 4, 7 and 10, at the technique drill's prices (180, 545, 1045). The save keeps
  `drills.technique` as the count: a hero with rank n knows the first n of their class
  (`knowsTech(h, id)`, by the class of the weapon in hand). The old bumps (+25% slam, +25% backstab,
  +20% snare time, +16% heals) are gone with them. A Ranger's first still waits on the SNARE lesson.
- **The Mage is untouched**: its one row of ranks (PRIMED SPELLS, levels 5, 8, 10) stays as it was
  while its spells are rewritten; ATTUNED and SPELLTHIEF come after.
- **Warrior** (`sim/techwarrior.ts`). SLAM: a slammed goblin bursts up to 4 small goblins within
  1.3 tiles of it. SHOULDER CHARGE: 1 s on the stick within about 25 degrees of one way readies it (a
  kick of dust); the next swing, begun within 0.4 s of stopping, knocks the first goblin it hits down
  1 s (a butcher 0.5 s), shoved on, through the stun cap. IRON FEET: holding an attack, a blow lands but
  doesn't shove, stagger or (a log) knock you down; IRON FEET over you when it saves you.
- **Rogue** (`sim/techrogue.ts`), on any backstab by blade, thrown knife or dart. KNIFEWORK: it bleeds
  3 s (the skewer's ticks). SLIP AWAY (Kyle's VANISH; renamed so it isn't the skill's name): a backstab
  kill hides you 2 s by the vanish rule, and a blow wound up at you is dropped; GONE over you.
  CUTPURSE: once a goblin, a 25% chance of 1 to 3 gold on the floor, on its own seeded stream
  (`purseRng`), never off a training goblin. At most half a coin a goblin, next to the 1.7 an
  expedition kill leaves now.
- **Ranger** (`sim/techranger.ts`). TRAPPER: a snare stays set after its first goblin and catches a
  second. QUICK NOCK: a perfect bow shot ends at once (no recover), and a draw begun within 1.2 s
  starts 40% drawn; a crossbow's perfect (glinted) bolt loads the next at once, plain. STEADY: a new
  rule underneath it: an arrow or bolt loosed on the move sways off the aim, up to 0.05 rad (about 3
  degrees) either way, by the room's clock (no dice); STEADY takes the sway away. `drift(h, moving,
  now, wind)` is the hook for the weather's wind later. Tune `AIM_DRIFT.most` (0 turns it off).
- **Cleric** (`sim/techcleric.ts`). MENDING HANDS: a friend comes up 1.5x as fast (on top of a Cleric's
  2x). SANCTUARY STEP: blessed ground (the SANCTUARY skill and any other) moves with its Cleric for 3 s
  after the cast, kept where it was cast from them. JUDGEMENT: a Cleric's blow (mace, censer or flail)
  on a goblin whose blow is aimed at a friend stuns it 1 s (a butcher 0.5 s), through the stun cap; a
  striped blow or a charge carries on, as with every daze. The mace's smite already stuns everything.
- **Tells** (`client/fxtech.ts`, sounds in `soundscape.ts`): a ring and stone for SLAM's bursts; dust
  for the shoulder ready and landing (the stun says STUNNED); IRON FEET; blood for KNIFEWORK; GONE and
  smoke for SLIP AWAY; a spill of coins for CUTPURSE; a glint on the string for QUICK NOCK; a faint one
  for STEADY on the move; a gold ring on the friend for MENDING HANDS; gold motes for SANCTUARY STEP; a
  gold flash for JUDGEMENT (STUNNED from the stun). Words only for IRON FEET and GONE.
- **The trainer** (`shared/trainrows.ts` techRows, `client/trainerui.ts` techRow): under TECHNIQUE,
  three rows with EFFECT and, until learned, COST ("545 gold, level 7", "after SNARE"); tagged LEARNED,
  LEARN, LEVEL n or NEEDS; the header says "1 OF 3 · NEXT AT LEVEL 10". A tap opens the row with one
  LEARN button (the technique drill's next rank).
- New words (for the lore keeper and line editor): the twelve names and EFFECT lines in TECH_WORDS;
  callouts IRON FEET and GONE (reused); labels EFFECT and COST on the trainer's technique rows.
- Tests: `tests/techniques.test.ts` (levels and prices, save ranks, rows, the Ranger's snare wait, each
  technique firing and not firing without it, the stun cap on JUDGEMENT, CUTPURSE seeded and once a
  goblin); `tests/trainer.test.ts` reads the Warrior's three rows.

## 2026-11-04: the hero never under a button on a phone (Kyle; Claude Opus 5.5)

Kyle: "Your potion and things can cover your character while in game and it's annoying on mobile."
- **The band** (`client/phoneband.ts`): on an upright screen both cameras keep the hero's feet between
  150 CSS px from the top (the unit frame and the folded tracker, then the hero's height) and 312 px from
  the bottom (the cluster's top with a little air), running past the room's edge when they must. Flat:
  `scene.ts` after its room clamp; 2.5D: `camera3d.ts` `follow(..., keep)` from `view3d.ts`. A cutscene's
  focus is left alone. Laptops and a phone on its side are unchanged.
- **The health orb moved** out of the middle of the screen's foot to the right edge over the relic
  (centre 40, 262 from the bottom right); the context slot sits beside it (112, 262). Every gap is still
  8 px or more (cluster.css has the numbers).
- **The fallback** (`client/underbtn.ts`): any touch button the hero or a red telegraph passes under goes
  to 35% (`.tb.under`), so the fight shows through it.

## 2026-11-04: weather changes the fight (Kyle; Claude Opus 5.5)

Kyle: "Let's do some weather and forget about wind affecting shots for now." And, earlier, his hero
"randomly seems slowed": so no weather ever touches a hero's pace, and nothing touches a shot's flight.
- **The posting's sky** (`shared/weather.ts` `skyOfJob`): CLEAR, RAIN, FOG or STORM from the job's seed.
  Odds by country: fen and river fog 0.45, rain 0.2, clear 0.25, storm 0.1; wood rain 0.35, fog 0.2,
  clear 0.35, storm 0.1; fields, farms, villages, ruins rain 0.3, clear 0.45, fog 0.12, storm 0.13; at
  night 0.12 more fog out of the clear. The board's row shows an icon and the word (a moon for a clear
  night); the card has a WEATHER row. Rooms keep the old shape (fog creeping in a step a room, a storm
  peaking over one room), but a storm job now rains and strikes in every outdoor room (never below 0.3).
- **A rule on the theme** (`shared/sky.ts`): each outdoor room's theme carries `sky` (none indoors or
  underground). The room reads it; every screen builds the same rooms from the job, so a party has the
  same weather. Numbers in `shared/tuning.ts` WEATHER and LIGHTNING.
- **Rain** (and a storm): a goblin's burn (and a freed person's) lasts 0.6 as long; a lit oil slick
  burns 0.6 as long (the slick carries its own `burn`, and the flat view draws from it); fire jumps
  between goblins at 0.35 of its reach; goblins notice you from 0.7 as far. Fire spells still set alight.
  Houses alight are unchanged.
- **Fog**: goblins (and spiders) see and wake at 0.6 of the distance; archers shoot from, keep off and
  come in at 0.6 of their reach and the shot's telegraph is as short; roof archers likewise. Drawn in
  both views as bands of fog thickening from 3 tiles round your hero to its thickest at 10, 4 steps with
  the ordered dither, in one shader line each (`client/light.ts`, `three/post.ts`; colour and
  thickness `client/skyfx.ts`), so it costs a phone nothing. Glowing things (eyes, telegraphs) show
  through. The old screen-wide veil is gone.
- **Storm** (`sim/storm.ts`, `sim/stormpick.ts`, `sim/stormshape.ts`): every 8 to 14 s on the room's
  own sky stream, lightning picks something tall or metal in the open within 14 tiles of a hero: a lone
  tree (no other within 2.5), a banner pole, a siege engine (weight 3 each), a goblin 3 tiles clear of
  any wall (1), a hero likewise (0.15); with none, bare open ground 3 to 7 tiles from someone. Its
  circle (1.3 tiles, red, the striped edge: no block) shows 1 s ahead with a crackle. Landing: 30 to each
  goblin touching it, small ones stunned 1.2 s (the storm is one stunner under the 6 s cap), 20 to a
  hero (a roll gets out of it, the grace on coming in holds), 20 to a freed person, 60 off a siege
  engine, all thrown out. Never indoors or underground. One shape: `strikeShape` is what both views draw
  and `inStrike` what the room judges, the same (x, y, r) and second. The flash lifts the ambient in the
  flat lighting pass and the 2.5D sky light for a quarter second, with a bolt down onto the spot and a
  cold light; the thunder rolls in 0.35 to 0.75 s later (`client/fxstorm.ts`). The old random sky
  flashes are gone: a flash always means a strike. Strikes go to friends in the patch (`strikes`).
- **The Barrowfields** (`shared/expedsky.ts`): sets out under its posting's sky and, 6 times in 10, turns
  once between 4 and 10 minutes in: clear to rain, rain to a storm, or the fog lifting (a storm holds).
  Seeded from the job; the room makes the turn and says it to everyone; a friend's screen follows from
  the expedition's state (`wx`). One line over your hero.
- **Words** (Kyle's style, effect first; open: the lore keeper and line editor, no agents were at hand
  in this session): CLEAR, RAIN, FOG, STORM; WEATHER; "Clear"; "Rain: burns are shorter, goblins hear you
  less"; "Fog: goblins and their archers see less far"; "Storm: rain, and lightning strikes things in the
  open"; turns: "Rain. Burns are shorter, goblins hear you less.", "Storm. Lightning hits things in the
  open.", "The fog is lifting. Goblins can see further."
- Tests: `tests/weather.test.ts`. The layout 2 hash in `tests/routeports.test.ts` re-pinned: only the
  theme changed (checked with the theme stripped, identical). `node scripts/weather-look.cjs` shoots the
  board, rain, fog, and a strike's circle and flash, FLAT and 2.5D, phone and laptop.
## 2026-11-04: the job board as a list and a card (Kyle; Claude Opus 5.5)

Kyle: "Mission selection is weird formatting now. Hard-to-read white text and complex. Maybe it pops out
when you select one, and you can read it in more detail, more clearly, and decide to go alone, or group,
or pass."
- **The list** (`client/boardui.ts`, `client/board.css`): one dark row a job, a stripe down its left in the
  kind's colour. The title in gold, then the kind as a coloured chip (HUNT, RESCUE, DENS, LARDER, STORY,
  EXPEDITION, and DEEP beside it), the length, the hour and the weather in the dim face; the danger pips
  and the pay on the right. The weather is the worst on the job's way (STORM, RAIN or FOG; clear says
  nothing), from `shared/weather.ts`, so it's what he'll meet.
- **The card**: a tap pops the job out, framed and centred over the list: its chip, the title in the
  blackletter (names in capitals set in title case so it can be read), the posting in full in parchment,
  then WHERE, ROOMS (MAP on the expedition), TIME, WEATHER, BOSS (only when the title doesn't name it),
  DANGER, NEEDS (a story mission online: "A party of 3", and GO ALONE greyed) and PAYS, and three
  buttons: GO ALONE (TAKE THE JOB offline), GATHER A PARTY, BACK. A tap on the dark round it is BACK too.
  A fresh visit starts at the list; a redraw (a party gathering, joining) keeps the card open.
- The buttons keep their hooks (`data-open`, `data-job`, `data-gather`), so the party flow, the lobby,
  online joining and the online tests work as before. The parties gathering and DONE LATELY sit over the
  list unchanged.
- New words (`client/boardwords.ts`), waiting on the lore keeper and line editor: TIME, WEATHER, DANGER,
  BOSS, NEEDS, DEEP, "A party of 3", RAIN, STORM, FOG, BACK on the card. WHERE, ROOMS, MAP, PAYS, GO
  ALONE, TAKE THE JOB, GATHER A PARTY, JOBS and DONE LATELY were already on the board.


## 2026-11-05: the spellblade's magic is its shield (Kyle; Claude Opus 5.5)

Kyle found the blade's charge ring unclear and chose "Magic is your shield": with the spellblade in hand,
hits drain your MAGIC before your health, parries refill it, and below a spell's cost you can't cast it, so
getting hit costs your spells. The ring over the hero shows the shield. The room decides it
(`sim/manashield.ts`, numbers `MANA_SHIELD` in `shared/mage.ts`), and it lives on the hero (`stamina`,
`wardAt`, `wardBrokeAt`), so a guest's screen draws the same ward.

- **Hits drain magic first**: 1 magic a point of damage (`perDmg`; 1.25 and 1.5 measured no better, see
  below). Only what magic can't cover reaches health. It takes blows and shots (`hitHero`, after a Cleric's
  holy shield, which goes first so its gift isn't wasted) and fire underfoot (a burning oil slick,
  `sim/oil.ts`; a burning house's floor, `sim/blaze.ts`). Judgment calls: striped (unblockable) blows go
  straight to health, the Stoker's hook included; so do falling beams, smoke, poison ticks, weather
  lightning and a friend's blows. A blow the shield takes whole doesn't stagger (a small shove, like a
  block); one that breaks through staggers as any hit. A shield hit starts the refill wait over
  (HERO.magicDelay, 2 s), as a cast does.
- **Running dry doesn't wind you** (judgment): an empty bar winds a Mage until it is full again (no blink,
  no parry for about 8 s), which would take away the parry that refills it. So the shield leaves a sliver
  (`keep`, 0.01) and the hit that runs it out passes the rest to health.
- **Parries refill it** (replaces filling the blade): a parry gives back 25 magic, a perfect one 40. A
  perfect parry is new: the blow lands within 0.08 s of the press (the spellblade's whole window is 0.22 s),
  so it's the late, tight one. One pack rush parried gives it once, not a blow at a time. Never past a full
  bar. Shown as "+25 MAGIC" in violet, "+40 MAGIC" in white with a bigger ring (no PERFECT word, as no parry
  shows one).
- **Spells cost magic as normal**: the holds cost their listed 35 (no more free holds off a full blade);
  short of it, the hold fizzles with NOT ENOUGH MAGIC as before. Kept: a hold let go on the white flash is
  still free (the perfect's own reward, and SPELLTHIEF counts on it); you still need the 35 to start it.
  `bladeCharge`, `BLADE`, `buildCharge`, `parryFills` and the `bladefull` event are gone; an old snapshot or
  save carrying `bladeCharge` loads and the field is ignored.
- **The ward** (`client/blademark.ts`, called from `actors.ts` flat and `three/extras3d.ts` 2.5D, so both
  views): a shell of light round the hero and a circle at its feet in the element's colour, full and bright
  with an inner shell when magic is high; as it drains its light thins out evenly (dots go dark in a fixed
  scatter, so it doesn't empty round like a meter). A hit that takes magic cracks it: white jagged cracks
  and the shell flashing white for 0.35 s, "-12 MAGIC" in violet and a flash of light (`fxmage.ts`, the
  ward's ring sound). Running out breaks it: shards flying off for 0.6 s and the ward-break sound. The
  blade's edge in hand glows by the magic too.
- **Balance, measured** (a bot in the arena, 90 s against five scrappers at 3x health,
  then four at 3x with a butcher; it taps, holds a spell (released past the flash, so it pays) whenever it
  can, and in parry mode parries every blockable blow it sees coming, pressing 0.04 to 0.2 s early):

  | | parried (perfect) | hits on the shield (magic) | magic back | hits to health (damage) | spells | downs |
  |---|---|---|---|---|---|---|
  | Scrappers, old rule, no parry | 0 | 0 | 0 | 91 (728) | 6 | 7 |
  | Scrappers, old rule, parry | 27 | 0 | 0 | 63 (504) | 8 | 4 |
  | Scrappers, shield, no parry | 0 | 46 (263) | 0 | 68 (473) | 2 | 4 |
  | Scrappers, shield, parry | 32 (15) | 43 (344) | 730 | 0 (0) | 19 | 0 |
  | Butcher, old rule, no parry | 0 | 0 | 0 | 72 (1258) | 9 | 11 |
  | Butcher, old rule, parry | 21 | 0 | 0 | 51 (938) | 8 | 8 |
  | Butcher, shield, no parry | 0 | 39 (339) | 0 | 53 (845) | 3 | 7 |
  | Butcher, shield, parry | 23 (7) | 24 (271) | 526 | 21 (491) | 16 | 4 |

  It's still the parry Mage: parrying keeps the shield up and the spells going (19 and 16 holds, against 2
  and 3 for a Mage who eats every blow), and halves what reaches health. Standing and taking it, the shield
  soaks a third of the damage but spells all but stop. At 1.25 and 1.5 magic a point the no-parry runs took
  about the same health (458 and 506 on the scrappers) and the parry runs still kept it near nothing (0 and
  15): the bar runs dry either way and the refill is the limit, so 1 stays (Kyle's number). The parrying
  bot is better than a person: read the parry rows as the ceiling. (The bot is a scratch script, not in
  the repo: a spellblade Mage stepping the room tick by tick, run once on main and once on this branch.)
- **Words** (open: the lore keeper and line editor, no agents were at hand in this session): the kit's ALSO
  row "Hits drain magic, parry refills" (was "Parry fills the blade"); its COST row "35 magic a hold" (was
  "35 magic a hold, less as the blade fills"), both on the weapon card and the BUTTONS legend's ATTACK row;
  "Spellblade: hits drain your magic before your health. Parry to refill it." (`SHIELD_LINE` in
  `shared/classes.ts`) on the class card after "Blinks away to dodge." and on the BUTTONS legend's PARRY row
  (was "A parry fills your blade."); callouts "-N MAGIC" (as a cast's) and "+N MAGIC" (as SPELLTHIEF's).
- Tests: `tests/manashield.test.ts` (a blow and a shot drain magic before health; the refill wait restarts;
  an empty shield passes the rest to health, breaks and doesn't wind; striped blows go to health; fire
  underfoot burns magic first; the wand and staff take hits as before; a parry gives 25, a perfect one 40,
  never past full; a hold below its cost fizzles; an old `bladeCharge` is ignored and an old save loads; a
  guest's decoded snapshot carries the magic, the crack and the break). `tests/magekit.test.ts` (holds cost
  35 every time, the flash is free, the parry refills magic), `tests/techmage.test.ts` and
  `tests/kitwords.test.ts` follow. The spellbook balance test counts taps only, so it was unchanged.

## 2026-11-05: no knack at a job's end; the whole party side by side in the recap (Kyle; Claude Opus 5.5)

Kyle: "Shouldn't have knack picking after a mission, just let them return home and show them a recap of
how they and all players did in that mission. Numbers killed, dodges, damage done etc."

- **No knack pick at a job's end.** The recap's one button is BACK TO WICKHOLD, always (NEXT: PICK A
  KNACK is gone, and recap.ts no longer opens the knacks screen). Knack points are banked on the hero as
  before (`gainXp` adds `picks`); nothing is spent or lost. With one waiting, the card says "A knack to
  pick: open your PACK." and back in town the cues from 2026-11-02 and 2026-11-04 do the rest: the gold
  count on PACK (`data-picks`, knackcues.ts), LEVEL N: A KNACK TO PICK at the hero's feet once, and the
  pack's gilt KNACKS N TO PICK button.
- **The room counts each hero** (`sim/score.ts`). While a job's room steps it hands its `board` in
  (`useBoard`, like `useMap`), and each count is made where the thing happens, keyed by hero id: KILLS
  in `kill()` (goblins only, to `lastBy`, as the run counts them), DAMAGE in `damage()`, `hitEnemy`, a
  wall and a javelin (what went into health, not the overkill), BIGGEST HIT (one blow, never a tick),
  DAMAGE TAKEN at every place a hero loses health, DODGES at every `dodge` event (rolled, jumped or
  blinked out of, or stepped out of a striped blow), PARRIES (one a blow; a rush's later blows not
  again) and PERFECT PARRIES (the blow lands within `MANA_SHIELD.perfectIn`, 0.08 s, of the press),
  BLOCKS (a held block or a Healer's COVER), HEALING GIVEN to friends only (lantern light, mend, blessed
  ground). DOWNED and HELPED UP come off the `down` and `pickedup` events in `run.ts tally`, which folds
  each room's board into `run.board` after every step and gives every player a line with their class.
  No dice anywhere; the same fight counts the same. Rooms that aren't a job's (town, the yard, the wood)
  keep no board.
- **The same numbers for everyone.** `run.board` rides whole in the end message and the saves; a
  friend's game swaps the ids as for any word from the leader (`client/asguest.ts`, now what coop.ts uses
  for `d.end`), so their own column is `me`. The leader names everyone on it at the end (`nameBoard`:
  their own name and class, each friend as the party knows them). Patches (20 a second) carry the run
  without the board (`lean` in coop.ts).
- **The recap** (`client/recapparty.ts`, `recap.css`): after ROOMS, GOBLINS and TIME, a dark sheet with
  a column per hero (this player first, name in their class colour and underlined, the class under it),
  six rows (KILLS, DAMAGE, DAMAGE TAKEN, DODGES, PARRIES, DOWNED) in 16px bone numbers, and + MORE for
  BLOCKS, PERFECT PARRIES, HELPED UP, HEALING GIVEN, BIGGEST HIT. A number is gilt where that hero led.
  With three or four heroes the labels narrow to their longest word so four columns fit a phone. The
  top DOWNED row goes when the columns have it. GOLD, XP, SAVED, FOUND, TREASURE, RELICS and the lines
  under them are as they were. An old run with no board shows the card as before.
- **Callouts** (`client/recapcalls.ts`): one per hero, only for a real lead (more than anyone else, not
  tied, more than nothing; a party of one leads nobody), the first they led at in this order: MOST
  KILLS, MOST DAMAGE, MOST HEALING, HELPED FRIENDS UP, MOST PARRIES, MOST PERFECT PARRIES, MOST DODGES,
  MOST BLOCKS, BIGGEST HIT, NEVER WENT DOWN (the only one not downed when everyone else was). Nothing
  for damage taken or downs.
- **Words.** Kept in Kyle's style (effect first, plain), the game's own words reused: DAMAGE, HEALING
  GIVEN (the item card's), HELPED UP (the HELP UP button), PERFECT, friends. "KEPT EVERYONE UP" became
  MOST HEALING: it isn't true when a friend went down, and its long word didn't fit four columns. The
  lore-keeper and line-editor agents couldn't be run from this session (no agent tool), so their
  checklists were applied by hand; the new lines still want their pass: KILLS, DAMAGE, DAMAGE TAKEN,
  DODGES, PARRIES, BLOCKS, PERFECT PARRIES, HELPED UP, HEALING GIVEN, BIGGEST HIT, MORE, LESS, the ten
  callouts above, and "A knack to pick: open your PACK." / "N knacks to pick: open your PACK."
- Tests: `tests/recapboard.test.ts` (a scripted fight: two parries, one perfect, a block, a kill counting
  3 into a butcher on 3 health, a Ranger's dodge, a blow taken and a down, each under its own hero; the
  same twice; no board outside a job; a friend's recap reads the same numbers, their column first;
  callouts only for a real lead; one button home, the knack banked and named on the card, PACK carrying
  the count).

## 2026-11-05: queued for a job, the card stays up top (Kyle; Claude Opus 5.5)

Kyle, playing with friends on a phone: "When you queue up for a job it shows it at the bottom, so it's hard
to exit and walk around while leaving the quest up."
- **JOIN closes the panel** (`client/partyboard.ts`), on the board and on the parties panel alike, as
  GATHER A PARTY already did: you're free to walk off at once, the party on the HUD card. LEAVE and
  CANCEL still redraw the panel. (The board staying up was the trouble: on a phone the card then dropped
  to the bottom of the screen, right over the board's CLOSE, with the toasts stacked above it.)
- **With a panel up on a phone the card goes to the top, not the bottom** (`client/partyhud.css`): it
  rises into the HUD's row (the portrait and health are dimmed under the panel anyway), one line, and
  the panel starts below it (`body.touch.panel-up.in-party #panel` gets the room), so neither covers the
  other and the panel's buttons, the stick and the fight buttons stay clear. Its toasts sit under it as
  in town, for their few seconds.
- A panel opening on a phone shuts the card to its line (`client/partycard.ts`); a tap still opens it
  out over the panel with SET OUT or LEAVE, and shuts it again. A laptop is unchanged.
- No new words.

## 2026-11-06: the guard grows (Kyle; Claude Opus 5.5)

Kyle chose guard upgrades next, and for the Warrior "Replace the roar ladder" (TAUNT GUARD at 5 and IRON STANCE
at 10 take the roar rungs' places). Built on top of parry's removal (the entry above; this session first built
its own parry removal in parallel, saw the other land on main, and dropped it for that one).
- **The Warrior's ladder** (GUARD, was TAUNT; `sim/taunt.ts`, `shared/ladder.ts` TAUNT_GUARD, IRON_STANCE,
  STAND_FAST): TAUNT GUARD (5): while the block is held, goblins within 4 tiles come for you, and stay on you
  1 s after; its red ring shows as the block goes up (at most once a second). IRON STANCE (10): a blocked blow
  costs a flat 22 stamina however hard it hits, the goblin is thrown back and flinches 0.5 s (inside the stun
  cap), and nothing lands on you for 0.5 s; no timing; the counter opens as from any block. STAND FAST (15,
  moved from 10): goblins your TAUNT GUARD draws hit 30% softer, and a block shoves you nowhere. The roar, its
  button, its cooldown and COWING ROAR are gone; a Warrior's dodge slot is GRAB again. A save's ladder count
  carries over rung for rung (a Warrior with one rung knows TAUNT GUARD now).
- **The Cleric's guard is a holy ward** (`sim/holyguard.ts`; Kyle: "a ward round you, like the Mage's magic
  shield, that soaks hits and is fed by the censer's coals"): the same block, stamina for what it stops, but it
  meets a blow from any side. Standing within a tile of one of your own censer coals while holding it gives back
  25 stamina a second (`HOLY_GUARD`). Drawn as a gold shell and a circle at the feet (`client/holyguardmark.ts`).
  The BUTTONS row says so for a Cleric.
- **The Cleric's ladder**: SHELTER (5, kept), SHARED WARD (10, took COVER's place; Kyle: "you AND an ally, the
  ally for free but again stamina drain"): the nearest friend within 3 tiles takes nothing from a blow the guard
  could stop (not a striped one), and the Cleric drains 8 stamina a second while covering someone (`wardFor` on
  the Cleric, so a guest sees the same); HEALING BLOCK (moved to 15).
- **Words**: through the lore keeper and the line editor (this session had both agents), on the earlier draft
  that also removed parry; their changes for these lines are in (IRON STANCE's "The goblin is thrown back",
  STAND FAST naming TAUNT GUARD, SHARED WARD's "Covering them drains your stamina"). The lore keeper's note for
  the story bible: "ward" now means the Cleric's guard too (the bible gives it to Sanctuary); Kyle's call.
- Tests: `tests/ladder.test.ts` (the ward from behind; SHELTER; SHARED WARD covering, not a striped blow, and its
  drain in the room; HEALING BLOCK at 15; TAUNT GUARD's pull, ring and linger; the dodge press does nothing; IRON
  STANCE's flat cost, throw and untouchable moment; STAND FAST); `scripts/ladder-look.cjs` holds BLOCK for the
  ring.
