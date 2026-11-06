# Relic atlas: fewer, bigger, curated places (proposal, 2026-11-05)

Design only; no repo files were edited. † marks a new name. Each one needs the lore-keeper's check, then the line-editor's.

---

## 1. Principles: diversity without the generic

- **One signature moment per zone, used nowhere else.** `nodes.ts signatureOf` already keeps some pieces to one place's heart. Extend it to scenes, so a zone's moment never turns up as a random roll elsewhere.
- **Its own palette and three props** that no other zone gets.
- **A trace of the story.** One plain thing tied to a named person or an open thread in the bible.
- **A fixed spine with seeded details.** The landmarks, their order and the set pieces are placed by hand. Seeds only shuffle cover, which goblins are in a pack, chests, weather and which captive.
- **You arrive mid-scene.** The hungry are busy at something, and what they're doing shows what they want from this place.
- **The hungry here have a reason that fits the war.** The valley works as one economy: Copperdeep ore and Greyhollow charcoal go to Coldscar's forge, and captives go everywhere.
- **Each zone has its own cast of hungry and its own hazard**, sitting on top of the common roster.
- **Cut what another place already owns.** I left out a market town fallen mid-fair: a hiring fair puts people up for sale in a square, and that is the Tally Market's idea for chapter 4. I left out a mill village because Fennick Ford is the old mill town, also chapter 4. I left out a charcoal-burners' camp because Hew owns that, the arcs doc already flags the Blacktongue echo, and the Coppice and Clamps biome covers the clamps.

## 2. What a zone is

A zone is the expedition kit (`expedmap.ts`, nodes 24 tiles square) made by hand around one spine:

- several landmarks you can see from a distance;
- 1 to 3 side pockets you can skip;
- **a mid-point checkpoint**: the run saves there and anyone down gets up there. This is new.
- a climax or a named butcher;
- the beacon-style hold for the way out where it fits.

The sizes and times below are rough. Anything over about 9 minutes is split into two jobs.

| Zone | Region | Map | Time | Jobs |
|---|---|---|---|---|
| Coldscar† (castle) | Copperdeep | 96x72, then 72x72 | 9 + 8 min | 2 |
| Rakehead† (miners' village) | Copperdeep | 96x72 | 9 | 1, checkpoint |
| The Bell† at Four Lane Ends† (inn) | Barrowfields, at the edge of Copperdeep | 48x48 | 5 to 6 | 1 |
| Sallow Priory† | Greyhollow, at the fen's edge | 72x72 | 8 | 1, checkpoint |
| Hangman's Wood (exists, made curated) | Greyhollow | 72x48 | 6 to 7 | 1 |
| The Corpse Road† (drowned wood) | Greyhollow, running to Sallow | 48x96 | 7 | 1 |
| The Old Park† (deer park) | Greyhollow | 96x72 | 8 | 1, checkpoint |

**How a cast of hungry bleeds in.** This uses `shared/debut.ts` as the chalker does:

1. **Staged:** the cast appears only in its zone's arrival scene.
2. **Rare:** one member a job, in the home zone.
3. **Common:** a chapter later, in the home zone. After that, single members may also turn up in packs elsewhere in the same region.

Telegraphs follow the house rules: a red floor telegraph can be blocked, a striped edge means walk out, and gold is only ever ours.

---

## 3. The flagship: Coldscar Castle†

**Its place in the bible.** Coldscar was a king's castle on a crag over the Copperdeep ore road. It fell in the war's first year, like Ketterby. It must not read as a second Wick: no heirloom, no lord who barred himself in. Its garrison died at the gate. Wick hid in his keep; Coldscar's people stood and fought. That contrast is the point when it opens in **chapter 3**, just before the Barred Keep's vote.

**What the hungry use it for now.** It's their engine yard. Castle roof beams become siege-engine arms, Greyhollow charcoal feeds the forge, and Copperdeep ore comes in on carts. This is the arcs doc's "show the Hungry King failing before chapter 5": burning the engines sets him back.

**Ties to the story, each one Kyle's call:**

- The garrison broke Brokenbridge to slow the hungry and cut off their own retreat. This answers the bible's open "who broke it".
- Master Cole's name is on the chapel wall with a line through it: counted dead, and he lived.
- The chapel's bell lies at the bottom of the well. It's a plant for chapter 5, seen but never rung.

**Coldscar's own hazards.** Portcullises that drop, murder holes that pour, oil, and heights.

### Job 1: The Outer Ward (96x72)

- **The Gatehouse.**
  - *What you see:* the gate passage, with the portcullis jammed half-up by a wedge, and rusted helms in the dry ditch.
  - *What happened:* the garrison held the passage while the hungry came over the wall behind them.
  - *The scene you walk in on:* roped captives hauling a cart of charcoal through the gate.
  - *Your job:* free the haulers, then knock out the wedge.
  - *Hazards:* the portcullis drops on a striped lane and crushes whatever is under it. Scalders† pour oil through the murder holes.
  - *Signature moment:* the portcullis slams down behind the party. The pack following you and your way home are both cut off, so you leave by the keep.
- **The Bailey (the mid-point).**
  - *What you see:* a half-built engine, the forge roaring, ore carts and the well's windlass.
  - *The scene:* a sapper drives chained diggers hauling a beam, while a drummer keeps their time.
  - *Your job:* smash or burn the engine (the expedition's siege-engine job), and free the diggers.
  - *Hazards:* oil barrels beside the engine; an ironhide working at the forge.
  - *Signature moment:* the engine's arm burns against the night and every goblin in the castle looks up.
  - *The well:* lower a lamp and the bell shows in the water.
- **The Kitchens and Cellars (a side pocket, one of the zone's landmark interiors).**
  - *Upstairs:* a hearth you could stand in, and the hungry's cookpot. Poison it (the expedition job).
  - *Downstairs:* the larder racks, cages, and a chalker at a board counting heads only.
  - *The skimmer†* pours oil into the kitchen gutter, lights it, and a river of fire runs down the cellar stairs onto you. Frost pins the skimmer.
- **The Walls.**
  - A wall-walk ring with towers. Gaffers† hook heroes off the walk down to the bailey: you fall a level, you don't die.
  - Kick down the ladders as a wave climbs them.
  - Storm picks out the towers.
  - *Signature moment:* the only light in the whole dark valley is Wickhold's Lantern, a single warm point on the horizon.
- **The climax.** Turn the hungry's own ram (a log-carrier's log) on the inner gate, and hold the gate until it gives.

### Job 2: The Inner Ward (72x72)

- **The Great Hall (a landmark interior with a minstrels' gallery).**
  - *What you see:* thirty years of dry rushes on the floor, the garrison's shields still on the walls, a war band feasting, a butcher in the high seat, and captives hung from the beams.
  - *The choice:* fire in the rushes runs across the whole floor in seconds. Burn the hall and the hung captives are lost. Fight through it the slow way and they live.
  - *Foes:* archers in the gallery, a FED butcher.
- **The Chapel (the mid-point, a landmark interior with a crypt).**
  - *What you see:* no roof, the bell frame empty, the rope cut. The hungry are levering up the floor slabs to dig for what people gave there.
  - *Your job:* hold the ring while one of you copies the names scratched by the door for Odric's count (the "hold to copy" from Read the Wall).
  - *The crypt:* a caller† down there. Under the bible's rules it can never get SOMEONE'S IN THERE.
  - *Signature moment:* the recap reads out the new names, and one of them is crossed out: COLE.
- **The Keep's Top (the climax).**
  - The beacon cresset that was never lit the night Coldscar fell.
  - Kill **Turnkey†**, a butcher wearing the castle's key-ring. You hear it before you see it.
  - Then light the beacon and hold it, and leave down the postern rope on the crag.
  - *In town afterwards:* Orla says she saw a fire on Coldscar.

### The Garrison† (Coldscar's own hungry: looted livery and mail)

| Member | Does | Telegraph | Counter |
|---|---|---|---|
| Loophole† | the castle's crossbows, shot from arrow loops | red lane, slow wind-up | block it; close in under the loop; smoke |
| Scalder† | pours boiling oil through murder holes; leaves a slick | striped circle under the hole | walk out; kill it up top; frost the cauldron |
| Mailcoat† | wears the garrison's mail: arrows glance off, lightning jumps from one mailcoat to the next | none of its own | storm, maces, smites |
| Gaffer | a billhook on a pole drags a hero to its brute | thin red lane | block; a parry snaps the hook |
| Winchman† | drops a portcullis to split the party | the chain rattles, then a striped lane | kill it at the winch; jam the winch with a prop or the javelin |

**Turnkey†.**

- Its key-ring is a flail: a striped spin.
- It locks the stair door behind the party, and the garrison comes up the outside ladders.
- It takes more from frost, as every butcher does.

---

## 4. Towns and villages

### Rakehead† (Copperdeep, chapter 2, the What Lies Under chapter)

- *The story:* the hungry took everyone who could swing a pick, alive. The doors are unbroken, because the miners walked out roped.
- *The spine:* the miners' rows, then the reckoning house (the mid-point), then the ore-washing floor with its sluices, then the hush gully up the hill.
- *Set pieces:*
  1. **The hush:** break the dam at the top of the gully and a wall of water scours it, washing goblins and carts down. Friends standing in it are knocked flat too.
  2. **Runaway ore carts** on the rails.
- *The scene you walk in on:* a fresh line of roped diggers being marched to the adit.
- *Its trace:* a Wickhold watch lamp left at the adit mouth, recently. That plants the chapter 2 traitor.
- *Palette:* copper-green stains, ochre spoil heaps, slate roofs.
- *Its hazards:* floods and the dark in the adits.
- *Its hungry:* the sapper and the snuffer†, plus:
  - **Carter†**, who kicks carts loose down a striped lane;
  - **Damsman†**, who opens the sluices and floods the low ground.
- *Named butcher:* **Slag†**, crusted with slag from the smelt mill. Frost cracks the crust, the way it breaks an ironhide's guard.

### The Bell† at Four Lane Ends† (the crossroads where the drove road meets the ore road; chapter 2)

- *The story:* travellers held the coaching inn for three days in the war's first winter. The coach still lies on its side against the yard gate, and the painted bell has been hacked off the inn sign.
- *The spine:* the coach yard with a gallery round three sides, then the taproom, then the cellars.
- *Set pieces:*
  1. Archers along the gallery, whose stair burns.
  2. A sneak-thief bolts with the strongbox of the last mail coach. Inside it is a letter for Old Wenna, thirty years late. Catch the thief or the letter is lost.
- *Its hazard:* spilled spirit pools that flare, and barrels rolling down the cellar ramp.
- *Its hungry:*
  - **Sot†**, drunk on the inn's spirit: big, wild swings that are easy to parry;
  - **Potboy†**, who throws bottles that burst into fire.
- *Named butcher:* **the Landlord†**, in the innkeeper's apron.

### Sallow Priory† (Greyhollow, at the fen's edge; chapter 3)

- *The story:* the old church's house. It kept the ditches, and when it fell nobody did, so the willow wood went to bog. That is Sallow Carr's existing lore, now with a reason. Hesketh Hall keeps the one dry rise in the fen.
- *What the hungry do here:* dig the graves and the floors for what was given.
- *Its trace:*
  - The lantern niche over the gate is empty and its iron bracket is cut through. Nobody says what burned there; whether that's too strong a hint is Kyle's call.
  - The herb garden has run wild, and its seed is worth bringing home to Widow Perrin, since nothing comes into Wickhold from outside.
- *The spine:* a causeway, then the almonry gate, then the cloister (the mid-point), then the church, then the crypt.
- *Set pieces:*
  1. Incense drifting through the cloister.
  2. The crypt's opened graves, with a caller.
- *Its hazard:* incense that hides and confuses. Inside a cloud you see 2 tiles, the hungry's eyes don't show, and friends' names go dim. The hungry find you by smell.
- *Its hungry:*
  - **Thurifer†** swings a stolen censer and leaves clouds;
  - **Chandler†** pours molten wax, a sticky floor that catches fire;
  - **Gravedigger†** comes up out of the floor on a mound telegraph.
- *Named butcher:* **the Prior†**, in a stolen cope, with the great censer on a chain. It goes for a Cleric carrying a full censer, which fits the censer rule without saying why.

## 5. Forest zones

### Hangman's Wood (Greyhollow, now: it's already on the board)

- *The story:* before the war the valley hanged its felons at a gibbet on a crossroads in this wood. The hungry have taken up the custom.
- The hanging-tree scene stops being a random roll in Greyhollow and becomes this wood's own.
- *Side pocket:* **the Gospel Oak†**, a hollow boundary oak with faded ribbons from the last time the valley walked its bounds. A brood mother nests in the hollow.
- *Set pieces:*
  1. Put fire into the hollow and the oak burns from inside like a chimney, dropping burning wood in a striped ring.
  2. An iron gibbet cage hangs high with someone alive in it. Wind it down by its winch while the others hold.
- *The scene you walk in on:* the hungry are winching a new captive up into the cage.
- *Its trace:* the blaze marks Hew cut into the trees to find his way.
- *Its hazard:* snares.
- *Its hungry:*
  - **Snarer†** sets ankle snares, shown by a faint striped mark. A caught hero is hoisted for 2.5 s until a friend cuts them down (GRAB). This is the larder rule turned on a hero.
  - **Dropper†** swings down from the branches on a rope, onto a shadow circle.
- *Named butcher:* **Hempen†**.

### The Corpse Road† (the drowned wood, running from Greyhollow to Sallow)

- *The story:* the hamlets' sunken coffin road to the priory's burial ground. It flooded knee-deep, and the coffin stones stand out of the water. The last stone carries Ketterby's name.
- *The scene you walk in on:* four of the hungry carrying a living captive on a door like a bier, setting it down at each coffin stone. It plays out like CRIES.
- *Its hazard:* rising water. The goblins open a sluice up the road in stages, the shallows go deep, and the coffin stones become islands. Frost makes ice paths, storm runs through all of it, and the skimmer's oil drifts down lit.
- *Its hungry, slick with mud:*
  - **Wallower†** lies in the water with only its eyes showing, grabs a hero's ankles and drags them under (held, a drowning tick). Counter: hit it, storm it, or a friend pulls you out.
  - **Mudslinger†** throws mud that slows and blinds.
  - **Bier-bearers†**, the four carrying the captive.
  - The skimmer.
- *Named butcher:* **the Mourner†**, in a funeral veil.

### The Old Park† (Greyhollow, chapter 2 or 3)

- *The story:* a pre-war deer park with its fence and keeper's lodge. Maeve's breeding came from these kennels; that needs the lore-keeper. Hound collars still hang on their pegs.
- *The spine:* the deer-leap, then open grass glades with hunting stands, then the lodge and kennel yard (the mid-point).
- *Set pieces:*
  1. **The deer-leap:** a bank and ditch you can drop in by but never climb back out of. The way behind you is shut.
  2. **The kennel gates:** whoever opens them decides when the wolves come out.
- *Its hazard:* the hunt. A horn sounds and beaters drive you toward the stands.
- *Its hungry:* the wolf-keeper and its wolves, plus:
  - **Beater†**, a line of them that shoves you toward the stands;
  - **Stand-archer†**, who shoots from the stands. A Warrior can topple a stand.
  - **Horner†**: while its horn blows, the wolves run faster.
- *Named butcher:* **Antlers†**, wearing an antlered skull.

---

## 6. Fewer doors, bigger insides

**The rule for every job map and every zone:**

1. **One enterable building per room, three per job at most.** A heart room may have two if one of them is the objective. A zone has 1 to 3 named landmark interiors.
2. **Merge, don't delete.** The street still looks like a village. The rest of the houses become *shut*:
   - boarded: pale planks over the door and windows;
   - burnt out: a shell, ash and stubs;
   - *blocked*: fallen in across the door (this fate exists already).

   None of them has light at the door or a woodpile, so nobody goes checking doors. Shut houses can still burn as scenery.
3. **An enterable building shows it from a distance:** firelight in its doorway, its woodpile, and the quest diamond if someone is caged inside.
4. **The promoted house is a big one,** starting from the longhouse, manor and tithe barn that already exist. It has at least two rooms or two floors (ground and cellar, or ground and loft), and at least one of: a captive, a chest, a set piece, or a trace of the story.
5. **The merged houses' captives and chests move into it,** so the job's captive count and pay don't change. On the Barrowfields expedition, the hamlet keeps two enterable houses.

**Inside and outside, linked:**

- **What friends outside see:**
  - the names over the door (this exists already);
  - goblins' shadows passing the lit windows;
  - muffled blows through the wall when you're near;
  - smoke from the window of whichever room is burning.
- **Fire spreads room by room** from the woodpile's side to the far end, so a friend inside sees it come through the doorways.
- **Every big house has a second way out:** a back door, a cellar hatch into the yard, or a drop from the loft door. The roof falls one room at a time instead of throwing everyone out at once. A captive is still lost when their room falls.

## 7. How they come into the game, in order

Each zone is posted on the board like THE BARROWFIELDS. Coldscar is posted as a story-weight deep job. One flagship at a time, built in slices:

0. **The doors rule on the existing village, farm and town maps.** It's small, and it's Kyle's ask.
1. **Hangman's Wood**, the pilot for the zone format: snares, the gibbet winch, the oak fire, its cast, and the checkpoint.
2. **Coldscar, the Outer Ward:**
   1. the map and the portcullis;
   2. the Garrison;
   3. the engine and the walls;
   4. the cellars.
3. **Coldscar, the Inner Ward:** the rush fire, the chapel's names, then the beacon and Turnkey.
4. **The Corpse Road:** it needs the skimmer from the biome plan, plus rising water.
5. **The Bell at Four Lane Ends.**
6. **Rakehead**, together with the Open Cut biome.
7. **Sallow Priory**, together with the Fen.
8. **The Old Park.**

## 8. Code reuse

| Reused | Where |
|---|---|
| Expedition kit: big map, nodes, jobs, pressure, beacon hold, horns | every zone |
| Layout 4 staged scenes and tasks: escort, kindle, haul, patrol | every arrival scene |
| Fire: catching, houseburn, oil, ash | hall rushes, cellar stairs, the oak, the inn |
| Water: water bodies, pools, ice, steam, wet | Corpse Road, Rakehead, priory |
| Captives, cages, the false cage | everywhere |
| Ledges and side rooms | walls, gallery, stands |
| Log-carriers, sapper, thief, drummer, wolf-keeper, nests, chalker | as placed above |
| `debut.ts` | how each cast bleeds in |
| The big houses, per-player rooms, door marks | the landmark interiors |

**Genuinely new:**

- Systems: the checkpoint, the portcullis and its winch, murder holes, rushes as floor fuel, the hush flood, rising water, the winch hold, snares and hoisting, the one-way deer-leap.
- Interiors: two-floor interiors, fire that spreads room by room, a second way out, shadows at windows and sound through walls.
- The seven casts and their seven named butchers.
- Art: the castle, the inn, the priory, the hunting stands.

## Calls for Kyle and the lore-keeper

These are not in the bible yet and each needs a yes:

- Cole's name on the chapel wall.
- The garrison breaking Brokenbridge.
- The bell in Coldscar's well.
- The priory's empty lantern niche.
- Maeve's kennels at the Old Park.
- The watch lamp at Rakehead.
- Hew's blaze marks in Hangman's Wood.
- The letter for Wenna.
- Every † name, and the reach of the "one dry rise" and "no second Wick" rules.
