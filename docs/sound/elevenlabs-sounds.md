# Relic: sounds to make in ElevenLabs

Every sound in Relic is made in code right now (WebAudio tones and filtered noise, in `src/client/`). This list replaces those sounds with recorded ones from ElevenLabs. Each row names the file to save, the code it replaces, the prompt to paste, and the settings.

**The feel:** a pixel game. Keep sounds punchy, short and dry, close to the mic, with small tails. No cinematic booms on small hits and no trailer whooshes. Cool stone rooms, torches, mud and blood. Goblins should sound clever and nasty, never comic.

**How to read the tables**

- **Sec**: the length to set, in seconds. ElevenLabs won't go under 0.5 s, so short hits are made at 0.5 s and I trim the silence off the end.
- **Inf**: the prompt influence (0 to 1). Higher sticks closer to the words. Lower gives more variety between takes.
- **Loop**: turn the Loop switch on.
- **_1, _2, _3**: separate takes of the same prompt. Generate again and keep the best ones, so a sound heard fifty times a fight doesn't grate. `_1` is your favourite.

---

## 1. Core combat and spells (first batch: 45 sounds, 96 files)

### Melee swings

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/swing_sword_1..3.ogg` | weaponsfx.ts `swingSound` sword, censer, spellblade and any other blade; sfx.ts `swing` | Single quick sword swing whooshing past close to the mic, steel blade cutting air, small dry stone room, short tail, no impact, no music. | 0.5 | 0.6 | no |
| `sfx/swing_heavy_1..2.ogg` | `swingSound` greatsword; sfx.ts `heavy`, `hurl` | Heavy two-handed greatsword swung slowly in a wide arc, deep low whoosh of a long steel blade, close, dry, short tail, no impact. | 0.8 | 0.6 | no |
| `sfx/swing_light_1..3.ogg` | `swingSound` daggers, rapier, poisoner | Two fast light dagger slashes, thin sharp hiss of short blades through air, very close, dry and crisp, no impact, almost no tail. | 0.5 | 0.6 | no |
| `sfx/swing_blunt_1..2.ogg` | `swingSound` mace, staff, flail (and the censer's chain on a heavy) | Iron mace swung hard, low blunt whump of a heavy head moving air with a light chain rattle, close, dry stone room, no impact. | 0.5 | 0.55 | no |
| `sfx/thrust_spear_1..2.ogg` | `swingSound` spear | Quick spear thrust, short sharp whoosh of an ash shaft and steel head jabbing forward, close, dry, tight, no impact, tiny tail. | 0.5 | 0.6 | no |

### Hits on goblins

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/hit_slice_1..3.ogg` | weaponsfx.ts `hitSound` sword and any edge; sfx.ts `hit` | Sword blade slicing into a small creature's body, wet cut with a dull meaty thud underneath, close, dry, short and punchy, no reverb. | 0.5 | 0.65 | no |
| `sfx/hit_cleave_1..2.ogg` | `hitSound` greatsword; heavy hits | Heavy greatsword chopping deep into a body, meaty wet cleave with a low knock of bone, close, dry, punchy, short tail, no boom. | 0.6 | 0.65 | no |
| `sfx/hit_crunch_1..3.ogg` | `hitSound` mace, flail, staff | Iron mace striking a body, blunt crunch of bone with a dull meaty thump and a tiny ring of metal, close, dry, short. | 0.5 | 0.65 | no |
| `sfx/hit_pierce_1..3.ogg` | `hitSound` spear, rapier, daggers, arrow, bolt, thrown knife; sfx.ts `javstick`; events `pin`, `boltline` | Arrow point punching into flesh, fast wet thunk with a small crack of bone, close, dry, very short, nothing before the hit. | 0.5 | 0.65 | no |
| `sfx/hit_bigbody_1..2.ogg` | `hitSound` with `big` (a butcher): laid under the kit's own hit | Blade hitting a huge armoured brute, dull heavy thud into thick hide with a clank of crude iron plates, close, dry, short. | 0.6 | 0.6 | no |
| `sfx/backstab_1..2.ogg` | sfx.ts `backstab`; events `legstab`, `riposte` (with the parry) | Knife driven into a back from behind, quick wet stab and a deep body thump, sharp and nasty, close, dry, short tail. | 0.5 | 0.65 | no |
| `sfx/bodyhit_1..3.ogg` | sfx.ts `bodyhit`; events `shoulder`, `slamburst`, `landing`, `braced`, `hewshot`, `shieldbash` | Shoulder slamming into a body, heavy padded thump of leather and flesh, low and punchy, close, dry, no metal, very short tail. | 0.5 | 0.6 | no |

### Guarding, getting hurt, dying

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/block_shield_1..3.ogg` | weaponsfx.ts `blockSound` shield, staff and board; sfx.ts `block`; events `deflect`, `ironfeet`, `snag` | Blow landing on a wooden round shield, hard hollow knock of planks with an iron rim clank, close, dry, short, no ringing tail. | 0.5 | 0.65 | no |
| `sfx/block_blade_1..2.ogg` | `blockSound` sword, greatsword, spear, daggers, rapier, censer, spellblade | Steel blade catching another blade on guard, bright short clang with a quick metallic ring, close, dry room, tail under half a second. | 0.6 | 0.6 | no |
| `sfx/parry_ring_1..3.ogg` | sfx.ts `parry`; event `riposte` | Perfect sword parry, sharp bright clash of steel that rings clean and high for a moment, a small low thump under it, close, dry. | 1.0 | 0.6 | no |
| `sfx/guard_break_1..2.ogg` | sfx.ts `guardbreak` | Shield guard smashed open by a huge blow, splintering crack of wood and a heavy iron clang, close, dry, punchy, no voice. | 0.8 | 0.6 | no |
| `sfx/hero_hurt_1..3.ogg` | sfx.ts `hurt` (a hero hit); event `survivorhit` | Crude blade hitting a fighter in leather and mail, dull thud with a rattle of iron rings, close, dry, short, no voice. | 0.5 | 0.6 | no |
| `sfx/roll_1..2.ogg` | sfx.ts `roll`, `dodge` (the Rogue's dash, the Ranger's jump) | Fighter diving into a quick roll on stone and grit, cloth and leather scuffing, gear rattling softly, close, dry, short. | 0.6 | 0.5 | no |
| `sfx/death_fall_1..2.ogg` | sfx.ts `death('fall')` | Small body collapsing onto a stone floor, limp heavy thud with a scrape of crude armour, close, dry, short tail, no voice. | 0.8 | 0.6 | no |
| `sfx/death_gore_1..2.ogg` | `death('behead' / 'halve' / 'opened')` | Blade cutting clean through a neck, quick sharp slice and a wet spatter onto stone, close, dry, short, grim, not cartoonish. | 0.7 | 0.6 | no |
| `sfx/death_burst_1.ogg` | `death('burst')`; event `torn` | Small creature bursting open under a huge impact, thick wet pop and spatter with a low thump under it, close, dry, short tail. | 0.7 | 0.6 | no |

### Bows, crossbows, throws, relics

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/bow_draw_1..2.ogg` | weaponsfx.ts `chargedSound` bows; voices.ts `goblin.draw` | Wooden longbow drawn slowly to full, creaking limbs and a tightening string, close, quiet, dry, no release. | 1.0 | 0.6 | no |
| `sfx/bow_loose_long_1..2.ogg` | `shotSound('arrow')` longbow | Longbow released, deep thrumming string twang and the arrow hissing away, close, outdoors, dry, short tail. | 0.6 | 0.6 | no |
| `sfx/bow_loose_short_1..2.ogg` | `shotSound('arrow')` shortbow and goblin archers; sfx.ts `arrow`; event `arrowfall` | Small shortbow loosed, quick light high snap of the string and a thin arrow hiss, close, outdoors, dry, short. | 0.5 | 0.6 | no |
| `sfx/crossbow_shot_1..2.ogg` | `shotSound('bolt')`; sfx.ts `bolt` | Heavy wooden crossbow firing, hard mechanical thwack of the prod and string, the bolt whipping away, a tiny latch click after, close, dry. | 0.6 | 0.6 | no |
| `sfx/crossbow_wind_1.ogg` | sfx.ts `latch`; events `wind`, `loaded`, `glint`, `quicknock`, `airshot`, `twinsnare`, `hunted`; sfxtown.ts `empty` (the last click alone) | Crossbow being cranked, three quick iron ratchet clicks and then a solid latch catching, close, dry, quiet room. | 0.8 | 0.7 | no |
| `sfx/throw_whoosh_1..2.ogg` | sfx.ts `throw`; events `volleyshot`, `knives`, `sentry`, goblin `lob` wind-up | Object thrown hard overhand, fast rising whoosh of something heavy spinning through the air, close, dry, no impact. | 0.5 | 0.55 | no |
| `sfx/javelin_pin_1..2.ogg` | sfx.ts `pinned`, `javwall`; event `houndpin` | Iron javelin slamming into a wooden wall, deep wooden thunk and the shaft quivering with a short humming wobble, close, dry. | 0.8 | 0.65 | no |
| `sfx/hook_chain_1.ogg` | sfx.ts `hookfire`, `yank`; events `chainpull`, `hookprop` | Grappling hook thrown on a chain, fast clatter of iron links paying out, ending in a sharp metal bite, close, dry. | 0.8 | 0.6 | no |
| `sfx/ground_slam_1..2.ogg` | sfx.ts `slam`, `boom`, `rumble`; events `quake`, `stamp`, `knuckle`, goblin `erupt` | Huge iron cleaver slammed into packed earth, heavy dull thump with dirt and stones scattering, close, short tail, no cinematic boom. | 0.8 | 0.6 | no |

### Mage

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/spell_hum_1.ogg` | sfx.ts `channeled`; `chargedSound` staff, wand, spellblade; events `magic`, `manaup`, `grasp` | Magic gathering in a wooden staff, low rising hum swelling into a soft bright tone, close, dry, short, no music. | 0.8 | 0.5 | no |
| `sfx/fire_cast_1..3.ogg` | magesfx.ts fire cast; `shotSound('spark')`; sfx.ts `ignite`, `spark`; event `slash` fire | Small fire spell flicked from a wand, quick roaring whoosh of flame with tiny pops and crackles, close, dry, very short. | 0.5 | 0.6 | no |
| `sfx/fire_burst_1..2.ogg` | spellsound.ts fire (held spell), `wallup`, `firewall`; sfx.ts `flare`, `oilfire`; events `coalflare`, `firering` | Fireball bursting on impact, deep rushing whoosh of flame with sharp crackles and a soft low thump, close, dry, short tail. | 1.0 | 0.6 | no |
| `sfx/frost_cast_1..3.ogg` | magesfx.ts frost cast and land; sfx.ts `chill`; event `slash` frost | Frost spell flicked from a wand, sharp icy hiss with a tiny glassy tink and crackling frost, close, dry, very short. | 0.5 | 0.6 | no |
| `sfx/frost_burst_1..2.ogg` | spellsound.ts `coldblast`, `nova`; sfx.ts `freeze`; icesound.ts `fling` | Burst of freezing cold, harsh hiss of frost spreading over stone with high glassy chimes of ice forming, close, dry, short tail. | 1.0 | 0.6 | no |
| `sfx/ice_shatter_1..2.ogg` | sfx.ts `shatter`; icesound.ts `icecrash` | Frozen body shattering, sharp crack of thick ice breaking and glassy shards scattering across stone, close, dry, short. | 0.7 | 0.65 | no |
| `sfx/storm_cast_1..3.ogg` | magesfx.ts storm cast and land; sfx.ts `shock`; spellsound.ts `dash`, `stormring`; events `tetherzap`, `interrupt`, `slash` storm | Small lightning spell, quick electric zap with sharp crackling snaps, close, dry, very short, no thunder. | 0.5 | 0.6 | no |
| `sfx/thunder_strike_1..2.ogg` | spellsound.ts `skystrike` (and `strike` gathering, from its first half) | Lightning bolt striking the ground right here, hard sharp crack and sizzle, then a short low roll of thunder, outdoors, no music. | 2.0 | 0.6 | no |
| `sfx/storm_stream_loop.ogg` | streamsound.ts (the wand's storm stream; code still raises its pitch per step) | Continuous crackling electric arc, steady buzzing hum of lightning with irregular sharp snaps, close, dry, even level throughout. | 4.0 | 0.5 | yes |
| `sfx/blink_1..2.ogg` | sfx.ts `blink`; events `halfblink`, `blinkthrough`, `spellthief` | Magical blink, quick airy whoosh sucked inward then a soft pop as something vanishes, close, dry, very short, no chime. | 0.5 | 0.55 | no |

### Cleric and Rogue

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/smite_1..2.ogg` | sfx.ts `smite`; `hitSound('smite')`; events `holysmite`, `judged`, `lanternlight`, `bell` | Holy mace smite, deep heavy thump into a body with a bright bell-like ring blooming over it, close, short tail, no choir. | 1.0 | 0.6 | no |
| `sfx/heal_1..2.ogg` | sfx.ts `heal`, `blessed`, `bless`, `coal`, `hallow`; events `mended`, `mending`, `sanctstep`, `parrymend`, `coverfor`, `coalburst` | Gentle healing glow, soft warm rising shimmer like breath over embers with one faint bright chime, close, quiet, short, no music. | 1.0 | 0.5 | no |
| `sfx/ward_ring_1..2.ogg` | sfx.ts `ward`, `warded`, `reflect`; events `holyshield`, `shieldsoak`, `manaward` | Blow glancing off a shield of light, bright glassy ring with a soft hum underneath, close, dry, short tail. | 0.6 | 0.6 | no |
| `sfx/ward_break_1.ogg` | sfx.ts `wardbreak`; events `shieldgone`, `manabreak`, ironhide `cracked` | Shield of light breaking apart, crisp glassy crack and small shards tinkling away, close, dry, short. | 0.8 | 0.6 | no |
| `sfx/smoke_puff_1..2.ogg` | sfx.ts `smoke`, `shadow`; events `vanish`, `smokebomb`, `slipaway` | Powder smoke bomb bursting, soft muffled pop then a thick rushing hiss of smoke spilling out, close, dry, short tail. | 0.8 | 0.55 | no |

---

## 2. Goblins and beasts (33 sounds, 68 files)

Goblins are made in **Sound Effects**, not Voice Design: they are creature sounds with no words. They should sound clever, cruel and close, never silly (Relic's voice rule: "never comic grunts"). The code already gives each goblin its own pitch, so a few takes is enough for a crowd.

### Goblins (scrappers)

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/gob_jabber_1..4.ogg` | voices.ts `goblin.chatter` (goblins talking as they come) | Small vicious goblin creature muttering fast nonsense gibberish to another, raspy nasal throaty syllables, no real words, close, dry, not cartoonish. | 1.5 | 0.5 | no |
| `sfx/gob_cackle_1..3.ogg` | `goblin.cackle` (spotted, a grab, a theft, an escape) | Small goblin creature giving a short nasty wheezing cackle, raspy and cruel, close, dry, no words, not cartoonish. | 1.0 | 0.55 | no |
| `sfx/gob_snarl_1..3.ogg` | `goblin.hiss` (the stab wind-up); event `listen` | Small goblin creature sucking a sharp hissing snarl through its teeth just before it lunges, raspy and tense, close, dry. | 0.6 | 0.55 | no |
| `sfx/gob_grunt_1..3.ogg` | New: a goblin's own blow (silent today) | Small goblin creature grunting with effort as it swings a blade, short raspy throaty bark, close, dry, no words. | 0.5 | 0.55 | no |
| `sfx/gob_hurt_1..3.ogg` | `goblin.yelp` (cut); event `routed` | Small goblin creature yelping in pain when cut, short sharp raspy squeal, close, dry, no words. | 0.5 | 0.55 | no |
| `sfx/gob_death_1..3.ogg` | `goblin.shriek` (death); event `rooffall` | Small goblin creature's dying shriek, high raspy scream falling away into a wet gurgle, close, dry, short tail, no words. | 0.8 | 0.55 | no |
| `sfx/gob_screech_1..2.ogg` | `goblin.screech`; events `denspawn`, `flushed`, `unearthed`, `rush` | Goblin creature screeching an alarm from a dark den, piercing raspy shriek, a little room echo, close, no words. | 0.8 | 0.55 | no |
| `sfx/gob_chant_1..2.ogg` | `goblin.chant` (the hexer's wind-up) | Goblin shaman droning a low guttural chant, the same few raspy nonsense syllables over and over, close, dry, menacing, no real words. | 2.0 | 0.5 | no |
| `sfx/gob_hex_burst_1.ogg` | `goblin.hexBurst` | Ground bursting open under a curse, wet crack of earth and a sizzling hiss of something burning, close, short tail. | 0.8 | 0.6 | no |
| `sfx/gob_retch_1..2.ogg` | event `puke` (a poisoned goblin RETCHING) | Small goblin creature retching and heaving up, wet choking gag and a splash, close, dry, unpleasant, not comic. | 1.0 | 0.6 | no |
| `sfx/gob_gnaw_1..3.ogg` | sfx.ts `gnaw` (goblins at the dead); event `dig` (the sapper) | Small creature tearing and chewing raw meat, wet ripping and slow crunching bites, close, quiet, dry, unsettling. | 1.0 | 0.6 | no |
| `sfx/gob_drum_1..2.ogg` | `goblin.drum` (drummers, and drums down a fork). `_1` low beat, `_2` higher off-beat | Single beat on a large goblin hide drum, deep loose skin thump, outdoors, a little distance, short natural tail. | 0.6 | 0.7 | no |
| `sfx/gob_whistle_1..2.ogg` | New, optional: the hungry whistling over the north wall at night; the bone whistle relic | Goblin whistling through its fingers over a wall at night, thin wavering two-note whistle, distant, outdoors, eerie. | 1.5 | 0.6 | no |
| `sfx/gob_blowpipe_1.ogg` | event `shoot` dart (the blowpipe; borrows the spider hiss today) | Short sharp puff of breath through a hollow reed blowpipe, a tiny dart whipping out, close, dry, very short. | 0.5 | 0.65 | no |
| `sfx/gob_net_1.ogg` | sfx.ts `net`, `snareset`, `grab`; events `netted`, `whip`; the Ranger's net | Weighted rope net whirled and thrown, swishing rope then a soft heavy flop as it lands, close, dry. | 1.0 | 0.6 | no |

### The butcher (and the Stoker)

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/butcher_grunt_1..3.ogg` | voices.ts `butcher.grunt` (hit) | Huge brutish creature grunting when struck, deep chesty growl cut short, close, dry, no words. | 0.5 | 0.55 | no |
| `sfx/butcher_roar_1..2.ogg` | `butcher.roar(false)` (cleave wind-up, spotted); sfx.ts `growl` | Huge brutish creature roaring as it winds up a cleaver swing, deep ragged throaty roar, close, dry, short tail, no words. | 1.0 | 0.55 | no |
| `sfx/butcher_roar_slam_1..2.ogg` | `butcher.roar(true)` (slam and charge wind-ups); sfx.ts `growl(true)` | Huge brutish creature bellowing long and furious as it heaves a weapon overhead, deep ragged roar rising then cut off, close. | 1.5 | 0.55 | no |
| `sfx/butcher_bellow_1.ogg` | event `bellow` (the Stoker calling its kin out of the trees) | Giant brute bellowing to call its kin out of the woods, long deep furious roar, outdoors, echoing off trees, no words. | 2.5 | 0.55 | no |
| `sfx/butcher_death_1..2.ogg` | `butcher.groan` (death); event `bannerfall` | Huge brutish creature dying, long deep groan sinking into a wet rattling breath, close, dry, no words. | 1.5 | 0.55 | no |

### Spiders

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/spider_skitter_1..3.ogg` | spidersfx.ts `skitter` | Many small hard spider legs skittering fast across stone, dry clicking patter, close, short. | 0.5 | 0.65 | no |
| `sfx/spider_hiss_1..2.ogg` | `hiss` (pounce and bite wind-ups, spotted) | Large spider hissing as it rears to pounce, dry rasping hiss, close, short. | 0.6 | 0.6 | no |
| `sfx/spider_bite_1..2.ogg` | `wetbite`; event `skewer` | Large spider biting, quick wet crunch of fangs into flesh, close, dry, short. | 0.5 | 0.6 | no |
| `sfx/spider_hatch_1.ogg` | `hatch` | Egg sacs tearing open, wet membranes splitting and many tiny legs scrabbling out, close, dry, short. | 1.0 | 0.6 | no |
| `sfx/spider_spit_1.ogg` | `spit` (the brood mother) | Bloated brood spider gurgling up and spitting a glob of venom, thick wet gurgle then a spit, close, dry. | 0.8 | 0.6 | no |
| `sfx/spider_splat_1..2.ogg` | `splat`; events `slick`, goblin `lob` landing | Glob of thick venom splatting onto stone, wet heavy splat with a small spatter, close, dry, short. | 0.5 | 0.6 | no |

### Rats, crows, wolves, the hound

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/rats_scatter_1..2.ogg` | sfxtown.ts `rats` (rats scattering from the blood) | A few rats squeaking and scattering across stone, thin squeaks and a quick patter of tiny feet, close, quiet. | 1.0 | 0.6 | no |
| `sfx/crow_caw_1..3.ogg` | New: the gallows crow in the square; crows on jobs | Single crow cawing harshly nearby, one or two hoarse caws, outdoors, still air, short natural tail. | 1.0 | 0.6 | no |
| `sfx/crows_flock_1.ogg` | event `crows` (uses the fire flare today) | Flock of crows bursting up off the ground, loud flapping wings and angry cawing, outdoors, close then moving away. | 2.0 | 0.6 | no |
| `sfx/wolf_howl_1..2.ogg` | event `howl` (uses the hound's bark today) | Wolf howling in a dark wood, long rising mournful howl, middle distance, cold night air, natural tail. | 3.0 | 0.6 | no |
| `sfx/wolf_yelp_1.ogg` | event `scatter` (wolves running off) | Wolf yelping as it scatters, sharp pained yips running away, outdoors, close. | 0.8 | 0.6 | no |
| `sfx/hound_bark_1..2.ogg` | sfx.ts `bark` (the Ranger's wolfhound giving tongue) | Large rough wolfhound giving two deep barks, outdoors, close, dry. | 0.8 | 0.6 | no |
| `sfx/hound_yelp_1.ogg` | sfx.ts `yelp` (the hound bolting from a butcher's swing) | Large wolfhound giving one sharp startled yelp and bolting away, outdoors, close. | 0.6 | 0.6 | no |

---

## 3. World and town ambience (14 beds, 21 one-shots, 49 files)

Nothing plays a bed today: the world is silent between events apart from fire crackle and drums. These are new loops for under the music. Sound Effects goes up to 30 s, so beds are 20 to 30 s with Loop on. Prompt influence is kept low (0.35 to 0.45) so they sound natural.

### Loopable beds

| File | Plays | Prompt | Sec (loop length) | Inf | Loop |
|---|---|---|---|---|---|
| `amb/town_day_loop.ogg` | Lantern Square by day | Small walled medieval market town by day, distant murmuring voices with no clear words, a cart creaking, hens, a far hammer on an anvil, light breeze, no music. | 30 | 0.4 | yes |
| `amb/town_night_loop.ogg` | Wickhold by night | Walled medieval town square at night, a torch flame fluttering close by, wind along stone walls, a distant dog, crickets, no voices, no music. | 30 | 0.4 | yes |
| `amb/wood_night_loop.ogg` | Greyhollow and the forest jobs | Dark pine wood at night, cold wind in the branches, creaking trunks, an owl far off, small things moving in dead leaves, no music. | 30 | 0.4 | yes |
| `amb/rain_stone_loop.ogg` | Rain over any outdoor map | Steady rain on stone flagstones and a slate roof, gutters dripping and running over, no thunder, close, even level, no music. | 30 | 0.4 | yes |
| `amb/river_loop.ogg` | River jobs, the Sheepwash | Shallow river running over stones, steady babble and gurgle, a light breeze in the reeds, outdoors, even level, no birds, no music. | 30 | 0.4 | yes |
| `amb/fire_hearth_loop.ogg` | Inside houses, the Drowned Rat, the forge | Wood fire burning in a stone hearth, soft steady crackle and pop, now and then a log shifting, quiet room, close, no music. | 20 | 0.4 | yes |
| `amb/house_fire_loop.ogg` | A building alight (replaces weaponsfx.ts `woodSounds.crackle`) | Timber house burning fiercely, roaring flames, loud crackling and snapping beams, embers hissing, outdoors, close, even level. | 20 | 0.45 | yes |
| `amb/war_camp_loop.ogg` | Far off on a big map; a fork's "drums" way (soundscape.ts) | Distant goblin war camp at night across a valley, slow heavy hide drums beating, faint harsh shouting with no words, crackling fires, wind. | 30 | 0.4 | yes |
| `amb/den_loop.ogg` | Inside a den or larder | Inside a low windowless hut, water dripping, a cookpot bubbling, flies buzzing, chains clinking far off, close and stuffy, no voices. | 30 | 0.4 | yes |
| `amb/church_loop.ogg` | The church | Inside a cold stone church, deep quiet, candles guttering, faint wind at the door, slow footsteps far off, a long soft echo, no music. | 30 | 0.4 | yes |
| `amb/tavern_loop.ogg` | The Drowned Rat | Small low-beamed tavern, murmured talk with no clear words, mugs knocked on wood, a fire crackling, a chair scraping, no music. | 30 | 0.4 | yes |
| `amb/mine_loop.ogg` | Copperdeep shafts | Deep old copper mine tunnel, slow water drips echoing, creaking timber props, a far low rumble, cold still air, no music. | 30 | 0.4 | yes |
| `amb/fen_loop.ogg` | Marsh, the Peat Cuts, Sallow Carr | Marsh at dusk, frogs croaking, reeds rustling, slow bubbling mud, a far wading bird calling, damp still air, no music. | 30 | 0.4 | yes |
| `amb/dread_drone_loop.ogg` | Out of bounds (replaces dreadsound.ts drone; code swells it) | Deep low droning hum heavy with dread, a slow far heartbeat underneath, dark and thick, no melody, even level. | 20 | 0.4 | yes |

### Town and world one-shots

| File | Replaces | Prompt | Sec | Inf | Loop |
|---|---|---|---|---|---|
| `sfx/coins_1..3.ogg` | sfxtown.ts `coins`; sfx.ts `gold`; events `cutpurse`, `stolen`, `recovered`, `caltrops` | Two or three small coins dropped into a palm, bright clinks over a soft rattle, close, dry, short. | 0.5 | 0.6 | no |
| `sfx/anvil_1..2.ogg` | sfxtown.ts `anvil` (Halvard) | Smith's hammer striking an anvil twice, a hard ringing strike of steel and a softer second blow, close, small stone forge. | 1.5 | 0.65 | no |
| `sfx/door_1..2.ogg` | weaponsfx.ts `woodSounds.door` (in and out of buildings) | Heavy old wooden door creaking open on iron hinges and thudding shut, close, small stone room. | 1.0 | 0.6 | no |
| `sfx/chest_open_1..2.ogg` | sfx.ts `chestSound` opening and open (the tier notes stay on top) | Old wooden chest lid creaking open on rusty hinges, then a soft thump as it falls back, close, dry. | 1.0 | 0.6 | no |
| `sfx/chest_hungry_1.ogg` | `chestSound` hungry tier (the heartbeat) | Slow heavy heartbeat thumping three times from inside a creaking wooden chest, close, dark, wrong, no music. | 2.0 | 0.6 | no |
| `sfx/dice_shake_1.ogg` | sfx.ts `dice('shake')` (Dicer Moll) | Knucklebones rattling in a wooden cup, dry bony clatter, close, quiet tavern table. | 1.0 | 0.6 | no |
| `sfx/dice_land_1..2.ogg` | `dice('land')` | A single knucklebone landing on a wooden table, small dry bony clack and roll, close. | 0.5 | 0.65 | no |
| `sfx/drink_1..2.ogg` | sfx.ts `drink`, `potion` (Sister's Bitter, Wall Brandy) | Drinking from a small flask in three quick gulps, then a cork pushed back in, close, dry, no voice. | 1.0 | 0.6 | no |
| `sfx/wood_chop_1..3.ogg` | `woodSounds.chop`; events `prophit`, `charred` | Blade biting into a wooden wall plank, solid dry chop of wood, close, dry, short. | 0.5 | 0.65 | no |
| `sfx/prop_break_1..2.ogg` | sfx.ts `propbreak`; events `cutfree`, `netfree` | Wooden crate smashed apart, planks splintering and small pieces clattering on stone, close, dry, short. | 0.6 | 0.6 | no |
| `sfx/fire_catch_1.ogg` | `woodSounds.blaze`; events `torched`, `oilup`, `oilwarn`, goblin `torch` | Oil-soaked woodpile catching fire, sudden whoosh of flame flaring up and building crackle, close, outdoors. | 1.5 | 0.6 | no |
| `sfx/house_collapse_1..2.ogg` | `woodSounds.collapse`; events `rafter`, `housefall` | Burning timber roof collapsing, heavy beams cracking and crashing down, debris tumbling, outdoors, close, short tail. | 2.5 | 0.6 | no |
| `sfx/land_1..2.ogg` | sfx.ts `land`, `lift`; event `struggle` | Body dropping onto packed earth from a short height, soft heavy thud with a scuff of dirt, close, dry. | 0.5 | 0.6 | no |
| `sfx/cry_muffled_1..2.ogg` | kindlecue.ts `muffledCry` (SOMEONE'S IN THERE; the "cries" way) | A person crying out in pain from inside a closed wooden house, muffled through the wall, no clear words, a little distant. | 1.5 | 0.6 | no |
| `sfx/cry_burning_1..2.ogg` | `muffledCry` loud, under the captive's shouts from a burning house | A person screaming in pain from inside a burning house, partly muffled by walls and roaring fire, no clear words. | 1.5 | 0.6 | no |
| `sfx/dread_heartbeat_1.ogg` | dreadsound.ts heartbeat (the code speeds it up) | One slow human heartbeat, deep lub-dub thump, close and inside the head, dry. | 0.8 | 0.65 | no |
| `sfx/dread_breath_1.ogg` | dreadsound.ts `breath` | Something enormous breathing far off in the dark, one long slow breath in and out, low and airy. | 3.0 | 0.55 | no |
| `sfx/dread_whisper_1.ogg` | dreadsound.ts `whisper` | Whispering just out of hearing, many hissing sibilants and a low murmur, no words, close, eerie. | 2.0 | 0.55 | no |
| `sfx/dread_rise_1.ogg` | dreadsound.ts the thing rising (wild places) | Something vast rising out of the ground, deep grinding rumble of earth and stone heaving upward, outdoors. | 2.0 | 0.55 | no |
| `sfx/dread_crush_1.ogg` | dreadsound.ts the crush | Enormous weight slamming down onto the ground, deep heavy crunch of earth cracking, short tail, no cinematic boom. | 1.0 | 0.6 | no |
| `sfx/dread_swarm_1.ogg` | dreadsound.ts the hungry pouring in (settled places) | Many small clawed feet rushing out of the dark across stone, rising raspy chittering, close, no words. | 2.0 | 0.55 | no |

---

## 4. Voices (5 townsfolk, 19 lines)

The bible doesn't set accents. My suggestion is one country with different valleys: rural northern and western English, tired farmers and soldiers, no posh voices and no fantasy flourish. Change any of them. Each description puts the language and accent first (ElevenLabs works best that way) and imitates no one.

The lines are the game's own words, from `src/shared/` (Hew, Orla, Judd) and `src/client/copy.ts` and `townui.ts` (Odric, Isolde). The emphasis marks are taken out. **Leans on** is the word the game marks for weight.

### Hew (the charcoal burner in the wood; the prologue)

**Voice Design:** English, with a thick rural Yorkshire Dales accent. An old man in his sixties, good quality recording. A charcoal burner who lives alone in the woods: warm, gravelly, a little wheezy, smoke in his throat. Kind and wry, and he runs on. Relaxed rambling pace, like he's talking to you over a fire.

| File | Line | From | Leans on |
|---|---|---|---|
| `vo/hew_waking_1.ogg` | Oh, you're breathing. That's one, then, out of the whole field, and I've been round every one of them since first light. Give me a moment getting down, these knees pop like green wood in a kiln. | shared/wood.ts `waking` | breathing (warm), one |
| `vo/hew_up_1.ogg` | Up you get, and spit that dirt out. | wood.ts `up` | |
| `vo/hew_praise_1.ogg` | That's it, that's the way. | wood.ts `praise` | |
| `vo/hew_praise_2.ogg` | Hah, you'll keep, stray, I think. | wood.ts `praise` | keep (warm) |
| `vo/hew_round_1.ogg` | Wait here, stray, I'll go round the back. | wood.ts `round` | |
| `vo/hew_hut_1.ogg` | That's home, kettle's older than you are. Hang on, I didn't leave that door open. | wood.ts `hut` | home, didn't |
| `vo/hew_shot_1.ogg` | Aah! In the leg, the little sod! Never mind me, stray, see to them first! | shared/woodsigns.ts `hewHit` | leg |

### Orla of the watch (meets you at Hew's hut)

**Voice Design:** English, with a slight Cumbrian accent. A woman in her late twenties, good quality recording. A town watchwoman, underpaid and tired: plain, steady, a little husky, says what she sees and no more. Even, unhurried pace, quiet and matter-of-fact.

| File | Line | From | Leans on |
|---|---|---|---|
| `vo/orla_meet_1.ogg` | I saw the smoke from the road and came to look. | shared/orla.ts `meet` | |
| `vo/orla_meet_2.ogg` | Those are Hew's boots you've got on, so that's him by the hut. Poor old Hew. | orla.ts `meet` | |
| `vo/orla_meet_3.ogg` | And you lived through the field? Nobody else from the column's come back. | orla.ts `meet` | |
| `vo/orla_meet_4.ogg` | Come with me to Wickhold. I'll take his tally of the dead to Father Odric. | orla.ts `meet` | |

### Father Odric (the church)

**Voice Design:** English, with a soft northern English accent, educated but plainly provincial. A man in his late fifties, good quality recording. A village priest, kind and worn thin, keeping a secret he hates: gentle, low, slightly hoarse, never preachy. Slow, measured pace with small pauses.

| File | Line | From | Leans on |
|---|---|---|---|
| `vo/odric_tally_1.ogg` | Orla brought me Hew's tally of the dead, and I've cut a notch on it for him. | client/copy.ts `TALLY.odric` | |
| `vo/odric_give_1.ogg` | Give what you can spare to the Lantern. It keeps the light burning, and it does the giver good, more than you'd think. | client/townui.ts | |
| `vo/odric_coal_1.ogg` | Lit from the Lantern, like every one before it. Feed it the coals the butchers leave. Have you eaten today? You look thin. | copy.ts `COAL.odric` | |

### Mother Isolde (the church; Cleric trainer)

**Voice Design:** English, with a thick Lancashire accent. A woman in her late forties, good quality recording. A field surgeon who swears like a sergeant and prays like one too: low, rough, husky, brisk and firm, warm under it. Quick, clipped pace, used to being obeyed.

| File | Line | From | Leans on |
|---|---|---|---|
| `vo/isolde_censer_1.ogg` | You've been feeding that censer. Your heals are stronger for it, but the goblins will come for you sooner. Keep your back to a wall. | client/copy.ts `COAL.isolde` | |
| `vo/isolde_relit_1.ogg` | Your censer went cold on the field, and a cold censer can't heal. It's lit again, so your heals work. | copy.ts `TALLY.isolde` | |
| `vo/isolde_calf_1.ogg` | Hold still, you great calf. There. Now go and get somebody else's blood on you. | docs/lore/voice.md (not in the game yet) | |

### Foreman Judd (the public works stall)

**Voice Design:** English, with a broad rural West Country accent. A man in his forties, good quality recording. A foreman of a sweeping and hauling crew: cheerful but gruff, chesty, a bit long-suffering, a laugh never far off. Easy conversational pace, a little drawl.

| File | Line | From | Leans on |
|---|---|---|---|
| `vo/judd_work_1.ogg` | I don't pick the work, mind, the town does, with its coin. Hollis writes down every coin and every den burned, so don't round up. | shared/mendlines.ts `FOREMAN` | |
| `vo/judd_crew_1.ogg` | My lot sweep and haul, or that's the idea, and anyone you catch leaning on a broom will swear they're thinking. They aren't. | mendlines.ts `FOREMAN` | |

Note for later: the game types every line with a voice blip (`speech.ts`). Recorded lines would play over that, so short barks like these sit best. Long speeches can stay text.

---

## 5. Music (5 tracks)

Relic's music today is written in code from recorded orchestral samples (strings, harp, flute, horn, tuba, timpani, frame drums, organ, choir, gong): 30 pieces across 10 places, and a fight layer that rises when goblins come for you. Your brief for it was "almost biblical or epic, with more gentle themes for dark woods or town". These five prompts follow that brief and keep to the instruments already in the game. Make them all **instrumental**. The raid pair shares a key and tempo so the code can fade the fight layer in over the calm one.

| File | For | Prompt | Length |
|---|---|---|---|
| `mus/town_lantern_square.ogg` | Wickhold, the square (like "Lantern Square") | Instrumental, no vocals. Gentle medieval folk waltz in 3/4 at 76 BPM in D major, for a tired walled town at dusk. Plucked harp and lute pattern, warm soft strings, a wandering wooden flute tune, a low cello drone. Intimate, a little melancholy but kind. No drums, no big build. End on the opening chord so it loops. | 2:00 |
| `mus/wood_under_the_pines.ogg` | The Greyhollow wood, forests | Instrumental, no vocals. Sparse dark folk ambient for a pine wood at night, D Dorian, slow 52 BPM. Low string drone, lonely solo cello phrases, harp notes far apart, a breathy low flute, a faint frame-drum pulse like a heartbeat. Cold, watchful, lots of space. No climax. Loops cleanly. | 2:00 |
| `mus/raid_calm.ogg` | A raid before the fight (villages, farms, ruins) | Instrumental, no vocals. Tense low-fantasy music for creeping through a burned village held by goblins, A minor, 96 BPM. Muted low strings, pizzicato double bass, distant frame drums, a sparse harp, a held horn now and then. Grim and quiet, slow dread, no heroic brass. Even level, loops. | 2:00 |
| `mus/raid_fight_layer.ogg` | The fight layer over `raid_calm` | Instrumental, no vocals. Battle percussion and strings layer, A minor, 96 BPM, steady from start to end. Driving low string ostinato, pounding timpani, bass drum and low toms, short stabbing cellos. No melody, no choir, no intro or ending. Loops cleanly. | 1:00 |
| `mus/boss_the_butcher_comes.ogg` | A named butcher (like "The Butcher Comes") | Instrumental with a wordless male choir. Brutal dark epic battle music for a giant butcher boss, D harmonic minor, 112 BPM. Opens with a bass drum, a gong and a low horn, then driving low strings, pounding timpani and frame drums, blaring low horns and tuba, the choir chanting "ah". Almost biblical, relentless. No guitars, no synths. Loops. | 2:30 |

---

## 6. How to make them

### Where everything is

- **Use the website for everything you keep**: elevenlabs.io, signed in, in your laptop browser or your phone's browser. On a phone, tap the menu button at the top left to open the sidebar. The sidebar has **Sound Effects**, **Music**, **Voices** and **Text to Speech**. Names move a little between updates.
- **The ElevenLabs phone app** is for voiceovers: Text to Speech with your saved voices, synced from the web. It's handy for section 4 once the voices exist. Voice Design itself is on the website.
- **The ElevenMusic phone app** makes songs and sound effects too, but how you get full tracks out of it is unclear. Make the keepers on the website.

### Sound effects (sections 1, 2 and 3)

1. Open **Sound Effects** and paste the prompt.
2. Open the settings. Set **Duration** to the Sec value (turn off automatic length). Set **Prompt influence** to the Inf value. Turn **Loop** on only where the table says yes. If it offers a model choice, take the newest.
3. Generate. It gives you a few takes. Download the best as `_1`, the next as `_2`, and so on. If none of them fit, generate again; small changes to the prompt help more than big ones.
4. Don't worry about silence at the end of short sounds. I'll trim it.

### Voices (section 4)

1. **Voices**, then **My Voices**, then **Add a new voice**, then **Voice Design**.
2. Paste the character's Voice Design text. For the sample text, paste their longest line from the table, or let it write one.
3. Leave **Loudness** in the middle. Set **Guidance scale** fairly high so it follows the description. Generate: you get three options. Pick the one that sounds most like a person in a cold town, and save it as `Relic Hew`, `Relic Orla`, and so on (each one uses a voice slot).
4. Open **Text to Speech** (website or phone app). Pick the saved voice and the newest model (Eleven v3 or later). Paste one line at a time, exactly as written. To put weight on the "leans on" word, add a comma before it or write it in capitals. You can put a mood tag in front, like `[tired]` or `[wry]`. Make 2 or 3 takes and download the best.

### Music (section 5)

1. Open **Music**, paste the prompt, and set the length.
2. Choose instrumental (no lyrics). Generate, listen to the end of the track, and regenerate if it fades out or swells at the end, since it has to loop.
3. Download the MP3.

### Export format

- **MP3 at 44.1 kHz, 128 kbps** (the default) is fine for everything. I'll convert to small OGG and Opus.
- **For the loops** (`amb/` and `storm_stream_loop`), take **WAV** if your plan offers it. MP3 adds a sliver of silence at the start that clicks when a sound loops. If you only have MP3, send it anyway and I'll trim and crossfade.
- Sound Effects and Music are cleared for use in games on paid plans. Check that your plan covers commercial use before Relic goes public.

### Naming and sending back

- Use the file names in the tables exactly: lowercase with underscores, numbered takes `_1`, `_2`, `_3`, and the extension you downloaded (`.mp3` or `.wav` is fine). For example, `parry_ring_2.mp3`.
- Put them in four folders: `sfx/`, `amb/`, `vo/`, `mus/`.
- Zip the four folders as `relic-sounds.zip` and drop it into a chat with me. Or put the folders in a Google Drive folder called `Relic sounds` and send me the link.
- Add a one-line note for anything that didn't come out right, so I keep the synthesized sound for it for now.

### Leave these synthesized (for now)

These are tuned notes rather than real-world sounds. They're tiny and crisp in code, and they read as game UI:

- sfx.ts: `levelup`, `fanfare` (relic found), `relic`, `weapon`, `drop`, `loot`, `perfect`, `tempo`, `charged`, `stunned`, `well`, `rally`, `blip` (speech)
- sfxtown.ts: `chime`, `dull`
- spidersfx.ts: `weak`, `resist`
- the chest's rising tier notes
- music.ts's boss sting, which is already played on recorded samples

---

## Appendix: every sound the game plays today

What each code sound does and which new file covers it. "Synth" means it stays in code.

| Code (file: sound) | What fires it | New file |
|---|---|---|
| sfx.ts `swing` / weaponsfx.ts `swingSound` by kit | A melee blow swung | `swing_sword`, `swing_heavy`, `swing_light`, `swing_blunt`, `thrust_spear` |
| weaponsfx.ts `hitSound` by kit (+ `big`) | A blow or shot landing on a goblin | `hit_slice`, `hit_cleave`, `hit_crunch`, `hit_pierce`, `hit_bigbody`, `smite`, the element `_cast` sounds |
| weaponsfx.ts `shotSound` arrow, bolt, spark, orb, lance | A ranged kit or spell loosed | `bow_loose_long`, `bow_loose_short`, `crossbow_shot`, `fire_cast`, `spell_hum` (orb, lance) |
| weaponsfx.ts `chargedSound` | Bow at full draw, spell gathered | `bow_draw`, `spell_hum` |
| weaponsfx.ts `blockSound` | Hit on your guard; `deflect` | `block_shield`, `block_blade` |
| weaponsfx.ts `woodSounds` chop, blaze, collapse, crackle, door | Walls hit, houses catching, falling, burning; doors | `wood_chop`, `fire_catch`, `house_collapse`, `house_fire_loop`, `door` |
| sfx.ts `hit`, `hurt`, `block`, `parry`, `guardbreak`, `backstab`, `bodyhit` | The core fight | Section 1 rows of the same names |
| sfx.ts `roll`, `dodge`, `land`, `lift` | Rolls, dashes, jumps, being lifted | `roll`, `land` |
| sfx.ts `death(how)` | A goblin dying: fall, behead, halve, opened, burst | `death_fall`, `death_gore`, `death_burst` |
| sfx.ts `throw`, `hurl`, `heavy`, `grab` | Throws and grabs | `throw_whoosh`, `swing_heavy`, `gob_net` |
| sfx.ts `pinned`, `javwall`, `javstick` | The Relic Javelin | `javelin_pin`, `hit_pierce` |
| sfx.ts `hookfire`, `latch`, `yank` | The grappling hook; crossbow latch | `hook_chain`, `crossbow_wind` |
| sfx.ts `slam`, `boom`, `rumble`, `thud`, `bite`, `wallhit` | Slams, quakes, the cutscene, a fizzle | `ground_slam`, `bodyhit`, `spider_bite`, `block_shield` |
| sfx.ts `growl` | A butcher's wind-up | `butcher_roar`, `butcher_roar_slam` |
| sfx.ts `arrow`, `bolt`, `spark`, `orb`, `lance` | Skill and relic shots | Section 1 bow, crossbow and spell rows |
| sfx.ts `ignite`, `flare`, `oilfire`, `steam`, `burst` | Fire, oil, coals | `fire_cast`, `fire_burst`, `fire_catch`, `death_burst` |
| sfx.ts `chill`, `freeze`, `shatter`, `shock`, `channeled`, `blink` | Mage elements and movement | `frost_cast`, `frost_burst`, `ice_shatter`, `storm_cast`, `spell_hum`, `blink` |
| sfx.ts `smite`, `heal`, `bless`, `blessed`, `hallow`, `coal`, `ward`, `warded`, `reflect`, `wardbreak` | Cleric | `smite`, `heal`, `ward_ring`, `ward_break` |
| sfx.ts `smoke`, `shadow` | Rogue smoke and shadowstep | `smoke_puff` |
| sfx.ts `net`, `snareset` | Nets and snares | `gob_net` |
| sfx.ts `bark`, `yelp` | The hound; wolves | `hound_bark`, `hound_yelp`, `wolf_howl`, `wolf_yelp` |
| sfx.ts `gnaw` | Goblins at the dead; sappers digging | `gob_gnaw` |
| sfx.ts `gold`, `potion`, `drink`, `dice`, `propbreak` | Coins, potions, knucklebones, crates | `coins`, `drink`, `dice_shake`, `dice_land`, `prop_break` |
| sfx.ts `chestSound` | Chests opening, by tier | `chest_open`, `chest_hungry` (tier notes: synth) |
| sfx.ts `levelup`, `fanfare`, `relic`, `weapon`, `drop`, `loot`, `perfect`, `tempo`, `charged`, `stunned`, `well`, `rally`, `blip` | UI and tuned cues | Synth |
| sfx.ts `wriggle`, `snared` | (Silent already) | None |
| sfxtown.ts `coins`, `anvil`, `chime`, `dull`, `empty`, `rats` | Town stalls, Halvard, objectives, an empty crossbow, rats | `coins`, `anvil`, synth, synth, `crossbow_wind` (last click), `rats_scatter` |
| magesfx.ts cast and land by element | A Mage's quick cast | `fire_cast`, `frost_cast`, `storm_cast` |
| spellsound.ts fire, frost, storm, thunder, `grasp`, `wallup`, `firewall` | Held spells and GRASP | `fire_burst`, `frost_burst`, `storm_cast`, `thunder_strike`, `spell_hum` |
| streamsound.ts | The wand's storm stream | `storm_stream_loop` |
| icesound.ts `fling`, `icecrash` | A frozen goblin skidding and crashing | `frost_burst`, `ice_shatter` |
| foesounds.ts (net, grab, lob, torch, erupt, netted, stolen, bannerfall, routed, rooffall, whip, howl, scatter, dig, surface, unearthed, slick, oil, crows, listen, rush, cracked) | The newer goblins | Section 2 rows, `fire_catch`, `ground_slam`, `ward_break`, `crows_flock` |
| spidersfx.ts `skitter`, `hiss`, `wetbite`, `hatch`, `spit`, `splat`, `weak`, `resist` | Spiders, the blowpipe, retching | Section 2 spider rows, `gob_blowpipe`, `gob_retch`; weak and resist: synth |
| voices.ts `goblin.*` (chatter, cackle, yelp, shriek, hiss, draw, chant, hexBurst, drum, screech) | Goblin voices | Section 2 goblin rows, `bow_draw` |
| voices.ts `butcher.*` (grunt, roar, groan) | Butcher voices | Section 2 butcher rows |
| kindlecue.ts `muffledCry` | A captive behind a wall or in a burning house; the "cries" way | `cry_muffled`, `cry_burning` |
| dreadsound.ts drone, heartbeat, breath, whisper, rise, crush, swarm, set back | Out of bounds | `dread_drone_loop`, `dread_*` one-shots; set back: `land` |
| soundscape.ts per-frame: doors, gnawing, drummers, fork drums and cries, spider legs, goblin chatter, fire crackle | Ambient events | `door`, `gob_gnaw`, `gob_drum`, `war_camp_loop`, `cry_muffled`, `spider_skitter`, `gob_jabber`, `house_fire_loop` |
| music.ts, scores-*.ts | 30 pieces over 10 places (town, inside, church, yard, village, farm, field, forest, mine, boss), a fight layer, a boss sting | Section 5 (a start; the code-written score stays for the rest) |
