# Bosses you beat by skill, and rooms that breathe (design only)

† = new name, needs lore-keeper (then line-editor). Attack labels are design words, never on screen.

Kyle (2026-11-05): "Bosses you have to be skillful against. Not just butchers." And "fun splatting a lot of small guys ... tactical and work together on bigger boys ... without feeling overwhelmed by mobs."

## 0. After parry

Warrior and Cleric **block**. Rogue, Ranger and Mage **dodge**.

| Floor | Blockers | Dodgers |
|---|---|---|
| Red | hold block, facing it | dash, jump or blink through |
| Striped edge | walk out | walk or dodge out |
| Gold | ours only | ours only |

- **The white flash means "now".** A dodge through it is LAST SECOND (the stagger that exists). A block works for the whole wind-up.
- **Punish windows are the boss's own recovery,** fixed per attack, so anyone can use them.
- **BRACED†:** a held block of a boss's big red rebounds it for 0.8 s. It's untimed: a blocker's skill is facing, stamina and where they stand.
- **Fallout:**
  - The gaffer's hook and Hempen's noose SNAP on a block.
  - The ironhide's guard breaks on a charged blow, a perfect, storm, or BRACED.
  - The drill PARRY THE HEAVY becomes HOLD THE HEAVY.

## 1. Rules

**Patterns.** Each boss has 4 or 5 named attacks in a set rotation per phase, with one seeded swap. Each attack gives three tells, in order: a pose (0.2 s), a sound, then the floor telegraph. Its recover is the punish window, 0.7 to 2.5 s, and the longest comes after its biggest blow. There are two or three phases by health. Each phase change is a 2 s roar with nothing landing, and pips on the boss plate.

**POISE.** Bosses ignore ordinary stuns. Charged blows, perfects, ambushes, backstabs and BRACED fill a POISE bar. When it's full the boss is STAGGERED† for 2.5 s: the party's shared payoff. Relics stay sure: their stuns land in full and fill half the bar.

**The arena.** It fits an upright phone, boss and telegraphs both. It has 2 or 3 features that matter: cover that stops a charge (the boss is stunned 2 to 2.5 s), something to set alight, and something for an element or a relic. The doors shut behind you and open at the kill.

**Roles.** The boss faces whoever hurt it most in the last 4 s. A taunt, or a block held within 2.5 tiles of its face, keeps it.

| Role | Who | Job |
|---|---|---|
| Holder | Warrior, Cleric | its face, the reds, BRACED |
| Flank | Rogue, a Ranger's blade | punish from behind, fill POISE |
| Range | Ranger, Mage | weak points, interrupts, elements |

**One clock a hero.** Only one boss wind-up is aimed at a hero at a time, and adds within 3 tiles of that hero hold their blows while it winds up.

**Scaling** (health is the existing `PARTY.boss`, +0.4 a player):

| Party | Health | POISE | Added |
|---|---|---|---|
| 1 | 1x | 1x | nothing |
| 2 | 1.4x | 1.3x | a split attack on a second hero, 0.6 s later |
| 3 | 1.8x | 1.6x | adds each phase, from the budget (§3) |
| 4 | 2.2x | 1.9x | one more attack in the rotation |

Wind-ups never get shorter with a bigger party.

**Fair under lag** (the leader's browser runs the room):
- Red wind-ups are at least 0.9 s. Striped ones are at least 1.1 s, and a hero at the centre can walk out in 60% of it.
- Aim locks at 70% of the wind-up.
- A guard or dodge pressed up to 0.15 s late, by the guest's press tick, still counts.
- Nothing hits without a telegraph. Thrown things fly visibly, at most 12 tiles a second. Nothing comes from off screen or from behind.

**On a phone:**
- Lanes are at least 0.6 tiles wide.
- At most 2 boss telegraphs show at once.
- Weak points are real objects (a strap, a horn, a cart) and crack the way the ironhide's guard does.

**The payoff:** a new `awardRelic` source, `boss`. Every drop is rolled per hero on their own seed, from the chained chest that opens at the kill (exists).

| Boss | Sure, each hero | Relic |
|---|---|---|
| Not a butcher | one Forged or better (Pre-war 15%), plus 80 to 120 gold | 15%, found in its hoard, left by a hero who didn't come back |
| Named butcher | one Forged or better (Pre-war 20%, Touched 4%, Turning 1.5%, its own hungry piece 5%), and a censer crumb | sure on a hero's first kill, then 20% |
| Zone climax | as a named butcher | the zone's sure relic (exists) |

## 2. Six bosses

### The Doorkeepers† (Latch† and Hasp†): the shield pair

Barrowfields, the great barn at Lowfurrow Fields; a hunt from late in chapter 1. Two big shield goblins carrying the barn's own doors, 320 health each. There's no butcher in them, so no hungry gear drops.

*Arena:* the threshing floor. Two hay stacks stop a charge and burn in 6 s. There's a lamp-oil barrel.

| Attack | Floor | Answer | Punish |
|---|---|---|---|
| Door Wall (Latch) | none: its front takes nothing | get behind it | its back, while Hasp is away |
| Door Sweep (Hasp) | red 120°, 1.1 s | block, dodge | 1.0 s |
| Door Charge (Hasp) | striped lane 8, 1.3 s | walk out | 2.5 s if it hits a stack or wall |
| Locked Doors (both) | striped shove 3 wide, 1.4 s | split them first | 1.5 s |

- **Together:** they swap jobs every 20 s. Within 2.5 tiles of each other they lock doors. More than 7 tiles apart for 4 s, the far one walks back to its partner with its back open for 3 s.
- **Phase 2:** the survivor carries both doors and does a Door Spin (a striped ring of 2.4, 1.5 s, then dizzy 2 s).
- **The skill check:** prise them apart, and read which one is the mover.
- **Roles:** the holder keeps Hasp at one end, dodgers bait its charge into a stack, and range cuts Latch's straps (DOOR DOWN† for 4 s).
- **Loot:** shields and plate.

### The Haulier†: the non-butcher heavy

Copperdeep, the Open Cut at Rakehead, chapter 2. The biggest of the ironhides, in plate from the smelt mill, hauling ore for Coldscar. 700 health; the plate takes a fifth until broken.

*Arena:* a rail of ore carts, the headframe (a rod), a sluice pool.

| Attack | Floor | Answer | Punish |
|---|---|---|---|
| Pick Swing | big red 100°, 1.0 s | block (BRACED), dodge | 0.9 s |
| Overhead | striped circle 1.8, 1.4 s | walk out | 2.2 s, the pick stuck |
| Cart Shove | striped lane down the rail, 1.2 s | walk out | 1.0 s |
| Chain Drag (phase 2) | striped ring 2.6, 1.5 s | walk out | 1.5 s |

- **Breaking the plates:** a charged blow, a perfect, storm while it's under the headframe or in the pool, or a cart sent down at it (GRAB at the top), which knocks it down for 2 s.
- **Phase 2** at 50%: the plates are off, it moves 15% faster, and two small ones come out of the adit every 15 s.
- **The skill check:** the holder's stamina, and leading it under the headframe.
- **Roles:** the holder in front; dodgers bait the Overhead; the Mage brings storm at the rod.
- **Loot:** maces and plate.

### Antlers†: the mobile skirmisher

Greyhollow, the Old Park, chapter 2 or 3. A lean named butcher in an antlered skull, quick rather than big. 520 health.

*Arena:* a glade with three hunting stands and oaks.

| Attack | Floor | Answer | Punish |
|---|---|---|---|
| Thrown Spear (from a stand) | red lane, 1.0 s, three in a row | block, jump, blink | when it climbs down |
| Horn | horn raised 1.5 s | any hit breaks it; else 3 wolves come | 1.2 s if broken |
| Antler Rush | striped lane 9, 1.2 s | walk out | 2.0 s if it hits a tree or stand |
| Gore | red wedge, 0.8 s | block, dodge | 0.7 s |

- **Phase 1:** it runs from stand to stand. A GRAB at a stand's foot topples it and throws Antlers down, stunned 1.5 s.
- **Phase 2:** the stands are down and it fights on the ground with whatever wolves are left, 15% faster.
- **The skill check:** switching targets, and breaking the horn.
- **Roles:** range duels it; the holder walks in front of the spears to shield a friend; the Rogue topples stands.
- **Loot:** bows and spears.

### Turnkey†: the arena boss (portcullis, braziers)

Copperdeep, Coldscar's keep top, chapter 3 (the atlas's climax). A named butcher wearing the castle's key-ring. 650 health.

*Arena:* the unlit beacon cresset (a pillar), two braziers, the stair-head portcullis and its winch, and the ladders the Garrison climbs.

| Attack | Floor | Answer | Punish |
|---|---|---|---|
| Ring Spin | striped ring 2.2, 1.4 s | walk out | 1.5 s dizzy |
| Ring Lash | red lane 4, 0.9 s | block, dodge | 0.7 s |
| Turn the Key | a chain rattle, then a striped lane under the arch, 1.5 s | walk out | splits the roof for 12 s |
| Locked In (phase 2) | the Garrison up the ladders every 12 s | GRAB a ladder down | |

- **The split:** a GRAB of 1.5 s at the winch lifts the portcullis early. It never strands a hero alone with Turnkey in a party of two or more.
- **Phase 3** at 25%: a knock into a brazier sets Turnkey alight.
- **The skill check:** fighting while split, and using the knockbacks.
- **Roles:** the holder stays on its side, and someone quick goes for the winch.
- **Loot:** the Coldscar pool (exists).

### Hempen, brought into the format

Greyhollow, Hangman's Wood (built). Called "it". 600 health.

*Arena:* its ground. Four trunks stop the noose and the charge. Two snarers.

| Attack | Floor | Answer | Punish |
|---|---|---|---|
| Noose (exists) | thin red lane, every 8 s, on whoever's furthest from a friend | block (SNAPPED), dodge | 0.8 s |
| Haul | red, 1.2 s, at a hoisted hero | CUT FREE, or stand in front and block | 1.0 s |
| Cleave, Slam | the butcher's | block / walk out | 0.9 / 1.1 s |
| Rope Rain (phase 2) | striped circles under the branches, 1.2 s | walk out | 1.5 s when it drops |

- **The skill check:** staying together.
- **Roles:** the holder stands between Hempen and whoever is furthest from the party.
- **Loot:** the grappling hook (exists).

### The Mourner†: the water boss

Greyhollow, the Corpse Road's last coffin stone (atlas). A named butcher in a funeral veil. 650 health.

*Arena:* knee-deep water (0.85 pace), five coffin stones (dry footing, and pillars), the sluice above.

| Attack | Floor | Answer | Punish |
|---|---|---|---|
| Veil Sweep | red 150°, 1.1 s | block, dodge | 0.9 s |
| Go Under | ripples, then a striped circle, 1.4 s | walk out | 1.5 s tangled in its veil |
| Wake | striped lane 3 wide along the water | stand on a stone | |
| Drag (phase 2) | red wedge, 0.9 s | block, dodge; if caught, a friend's GRAB | 1.0 s |

- **The water rises** at 66% and 33%, and the stones become islands.
- **Elements:** storm hits everyone in the water, friends too, so strike when the party is on the stones. Frost makes ice paths, and a surfaced Mourner is FROZEN for 3 s.
- **The skill check:** reading the ripples, and the element play.
- **Roles:** the holder on a stone; the Mage times the storm.
- **Loot:** cloth and rings.

*Next:* the Gnawer at Barrowby's bell (pulling the rope makes it reel; Kyle's call), Slag, the Prior.

## 3. Pacing: splat, then think

**Threat points** (a `THREAT` table by role):

| Tier | Roles | Points |
|---|---|---|
| Chaff | small goblin, wolf, blind hunter | 1 (0.5 in a swarm) |
| Special | archer, hexer, drummer, netter, thief, chalker, snarer, oiler, torch, sapper | 2 (banner 3) |
| Meaty | brute, ironhide, shield, the six below | 4 (logs 5) |
| Heavy | butcher | 8 |
| Elite | base x1.5, +1 an affix | |

**A room's budget** (rooms 1, 2, 3, 4 and on): 14, 20, 26, 30. It's multiplied by:
- the party: 1, 1.4, 1.75, 2.1;
- difficulty: easy 0.8, normal 1, hard 1.2, deep 1.35.

**Caps on screen** (awake within 10 tiles of any hero):

| Party | Threat | Meaty at once | Heavy at once |
|---|---|---|---|
| 1 | 12 | 1 (2 from room 3) | 1 |
| 2 | 16 | 2 | 1 |
| 3 | 20 | 2 | 1 |
| 4 | 24 | 3 | 1 |

**Beats**, laid from the way in:
1. **Splat:** a swarm.
2. **Tactic:** one meaty unit, one backer and some chaff.
3. **Closer** (from room 2): an elite or a heavy.

**Breathing room:**
- A pack that wakes over the cap **holds**: it jeers and bangs at its spot, and comes when the threat on screen drops under 60% of the cap, or after 12 s.
- Coming within 3 tiles of a held pack, or hitting it, frees it at once.
- Holds and the beacon: a wave comes when the threat on screen is under 40% of the cap, or after 12 s. Every third wave is followed by 6 s of quiet, with the horn silent.

**Where the budget goes:**

| | Chaff | Specials | Meaty, heavy |
|---|---|---|---|
| Easy | 70% | 15% | 15% |
| Normal | 60% | 15% | 25% |
| Hard, deep | 50% | 20% | 30% |
| Party of 3 or 4 | +5% | same | up to the cap |

### Elites (existing goblins, 1 to 3 affixes)

The chance is 10% for a meaty goblin from room 2, plus 5% a point of ruin. At most one elite a room, or two on a deep job. Each affix shows on the body.

| Affix† | You see | It does | Counter |
|---|---|---|---|
| Plated | grey plates | the ironhide rule | charged blow, perfect, storm |
| Quick | dust at its heels | 1.25x pace, 0.85x wind-ups (never under the floors) | keep a guard up |
| Oil-soaked | a dark sheen | bursts (striped, 1.0 s) if set alight | burn it inside its own pack |
| Hornblower | a horn at its belt | calls 3 chaff at half health | burst it down, or interrupt the horn |
| Gorging | blood to the chin | eats a body in 2 s to heal 30% | burn the dead |
| Smouldering | embers | a striped ring 1.2 s after it dies | walk out after the kill |

### Six new meaty units

| Unit† | Health | Its one thing | Floor | Answer |
|---|---|---|---|---|
| Doorman | 120 | a barn door: its front takes nothing | red bash, 1.0 s | flank it |
| Swingle | 100 | spins a flail, then reels 1.5 s | striped ring, 1.3 s | walk out, then punish |
| Forker | 90 | pitchfork reach, pushes you off | red lane 3, 0.9 s | get inside 1.2 tiles |
| Kegman | 70 | an oil keg on its back | striped burst 1.0 s after it dies | shoot the keg inside its pack |
| Pouncer | 80 | leaps from 5 tiles | striped circle 1.2 s, then red | walk out; 1.0 s stuck on landing |
| Gorger | 110 | eats your kills: +20% size, health and damage, up to 3 times | a body pulled in for 1.5 s | burn the bodies, or kill it first |

The Gorger makes splatting chaff a choice.

### What changes in the composer

- **`shared/encounters.ts`:**
  - `THREAT` and `TIER` by role.
  - Templates gain `beat` ('splat', 'tactic' or 'closer') and an `elite` chance.
  - Six new templates.
  - In `ENCOUNTER`, `specials` becomes `budget`, plus `party`, `difficulty`, `onScreen`, `meaty` and `share`.
- **`shared/encounter.ts composeRoom`:**
  - `left` counts threat, not specials.
  - Bands get beats in order from the way in.
  - `fits` filters by beat, the meaty cap and the threat left.
  - `lay` fills chaff to the beat's share.
  - Elites roll on their own stream.
- **`sim/packs.ts scalePacks`:** extra chaff comes from the party's budget, not a flat 0.5. The centrepiece's +35% stays. `more` joins only under the meaty cap.
- **New `sim/pacing.ts`:** the threat on screen each tick, and a `held` field on goblins over the cap, sent as a patch.
- **`sim/expedwave.ts`:** waves are sized by threat, with the 40% rule and the quiet.
- **Measuring:**
  - `scripts/encounters/measure.ts` adds threat on screen (mean, p90, max) and seconds over the cap, before and after.
  - The tests cover the caps, the beats, and a held pack freed by a hit.
  - The layout-3 and expedition pins move: re-pin after checking that only goblins changed.

## 4. Rollout, smallest high-value first

1. **The pacing budget**, plus the parry fallout. Measure before and after.
2. **The boss kit, and the Doorkeepers:**
   - POISE and BRACED;
   - the boss plate and its pips;
   - one clock a hero, and the 0.15 s grace;
   - the `boss` relic source and the sure chest;
   - the barn, as a hunt.
3. **Elites:** Plated, Quick and Gorging, then the rest.
4. **Meaty units:** the Doorman, Swingle and Forker, then the Kegman, Pouncer and Gorger, each through `debut.ts`.
5. **Hempen into the format** (cheap: the zone exists).
6. **The Haulier**, with the Open Cut.
7. **Turnkey**, with Coldscar's Inner Ward.
8. **Antlers** with the Old Park, then **the Mourner** with the Corpse Road.

*For Kyle:* BRACED; the 0.15 s grace; a sure relic on a hero's first kill of a named butcher; the Gnawer's bell; every † name.
