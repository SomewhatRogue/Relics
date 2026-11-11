# Instances: dungeons with a story, a route and a chain of bosses

Spec, 2026-11-11 (Kyle and Claude Opus 5.5). Not built. Names marked *(lore)* need the lore keeper and line
editor. Build after the Deep (it brings the party loot rolls); in a fresh chat.

## What Kyle wants

"Smaller mobs in a direction and a sort of mini story to play through, with bigger thematic mini bosses
and a final end boss or bosses", in the spirit of the Deadmines, Shadowfang Keep, Scarlet Monastery and
Blackrock Depths; later some "huge, where you can choose to skip bosses or miss them". Every boss, mini
bosses too, has a pool of unique items, one item per boss for the whole party, given out by a roll or a
bid (the Deep chat is building that). Big but not laggy, and the party should want to stay together.

## What the four models teach

| Model | What makes it work | Relic shape |
| --- | --- | --- |
| Deadmines | The story starts in town and pays off inside; one line through very different spaces; a themed boss in each; a reveal at the end | Small: 20 to 30 min, 4 to 5 bosses |
| Shadowfang Keep | A climb through one building; prisoners freed at the start; the building is the story | Small to medium |
| Scarlet Monastery | One place in short wings, each a run of its own, harder in turn; a famous paired final | Wings of 15 to 25 min |
| Blackrock Depths | A city: non-linear, 15+ bosses, many optional; set pieces (an arena, a bar); keys and quests open parts; groups run sections | Huge, later |

## The format

- **A lead-in from town:** a job, a rumour or someone to free, so the story starts before the door.
- **A route of areas,** each its own look, cast of goblins and hazard. Packs stand somewhere doing
  something (the atlas rule: you arrive mid-scene) and the way runs in a direction.
- **A themed mini-boss in each area,** with its own fight and loot pool.
- **An end boss or pair** with a real fight (the boss kit: POISE, rotations, the plate), and its own
  pool.
- **Checkpoints** at area gates: the party saves there, the fallen get up there.
- **Big ones:** side wings and optional bosses you can skip or miss entirely.

## Big without lag

The host's browser runs the fight and sends changes 20 times a second: lag comes from how much is awake
and changing at once, not from map size.

1. **Areas, not one map.** Each area loads when the party gets there; only the current area runs and is
   sent. Areas behind are kept as saved state. (Jobs already go room to room; this is bigger rooms with a
   route.)
2. **Packs asleep until near** (as big maps' dens already are).
3. **The cap on goblins fighting at once stays** (`sim/pacing.ts`): packs over it wait their turn.
4. **Only send what's near a hero.**
5. **A split party is the costly case** (two areas live at once), so gates wait for everyone (below).

## Wanting to stay together

1. **Alone is dangerous, not forbidden.** Some goblins go for whoever is furthest from a friend
   (netters, hamstringers, draggers). Near a friend (a few tiles) you take a little less; alone you're
   noticed sooner.
2. **Fights that need two jobs at once:** a shield goblin held in front while someone goes behind;
   paired mini-bosses where one raises the other; a hexer behind its guards; doors with two plates.
3. **Only friends get you up.** RAISE exists; die alone and you walk back from the last checkpoint.
4. **Gates wait for everyone:** the next area opens when the whole party is at the gate.
5. **Loot needs you there:** a roll on a boss's item only for heroes near it when it died.
6. **Solo where it says so.** Early areas and side pockets can be soloed; marked group areas and bosses
   are tuned for three heroes and get harder for a fourth (more health and harder hits, not more goblins,
   Kyle 2026-11-05), never easier below three.

## Loot

- Every boss and mini-boss has a pool of unique items (named, per class where it fits), one item per
  boss for the party, by the Deep chat's roll/bid system. Instances only.
- The boss board shows what each can drop, so people replay for a piece.
- Ties to holy and hungry later: a hungry piece in a pool can be claimed only by a hero already carrying
  hunger, a holy one only by the clean *(to decide)*.

## The first one: the miners' village into the Open Cut (Deadmines-sized)

From the atlas and the boss plan (`claude/atlas.md`, `claude/bosses.md`): Rakehead *(lore)* the miners'
village in Copperdeep, down into the Open Cut, ending at the Haulier (it, as with Hempen). Draft route:

1. **The village square: THE DROVER.** It walks a rope line of captive miners to the adit (you arrive
   on that scene). Free the line and it has nothing to stand behind.
2. **The workings: THE BRAKESMAN.** It rides the brake at the top of the incline and lets the carts go;
   plain carters below kick them loose.
3. **The washing floor: THE RAKER and THE SLUICER.** The Sluicer floods the floor; when it goes down in
   the water the Raker drags it out with a long rake and stands it up again (no magic). Kill both close
   together.
4. **The Open Cut: THE HAULIER**, its ropes and loads (a second of its kind, never the Deep's Haulier).

None of them are butchers: named butchers keep the relics and hungry gear (Slag stays on the board).

## Boss loot (Kyle, 2026-11-11; items proposed by the lore keeper, gift lines still to line-edit)

**The rules**
- **One drop per boss per run** for the party, every run. Picked from that boss's pool, weighted to the
  classes in the party: a class piece nobody present can use is re-picked once. Cosmetics come up about a
  quarter of the time from a mini-boss, about one in six from the end boss.
- **Need, Greed or Pass,** decided by the host's dice. NEED: a piece your class can use that you don't
  already own. GREED: anyone. **Cosmetics are Greed only**, and a hero who owns one sits that roll out.
  Twenty seconds to choose; no choice, or disconnected, is PASS. Need beats Greed; ties re-roll.
- **Bad-luck protection:** lose a roll on a boss and your next Need roll on that boss's pool gets +10
  (up to +30); it resets when you win a piece from it.
- **Drops are minted through the item ledger** (docs/design/trading.md), keyed by run and boss, so a
  reconnect or a host handover can't make a second.
- **The end boss also gives its relic** to every hero present who doesn't have it yet, no roll (relics come
  only from great bosses: docs/design/holy-and-hungry.md section 4). The Haulier's draft: the Grappling Hook.
- **One of each** named piece per hero. The boss board shows each boss's pool and who first won what.
- Instance pieces are the place's own goods, shown with the place on the chip (RAKEHEAD), not a tier word.
  **No Want, no cost line.** Open: does Tobin buy them, and does Halvard forge and melt them?

**Cosmetics: the LOOK slot**
- A separate slot, worn in town and on jobs, shown on the sprite, the hero card and the boss board. No
  stats, no upgrades, never touches the Want, any class: purely fashion (Kyle, 2026-11-11).
- Things a valley person would own and keep: hoods, felt caps, cloaks, scarves, boots muddy to the knee,
  a stained sleeve, a plain lamp at the belt (a "lamp", never a "lantern": that word is the square's).
  Nothing new: every piece used to be somebody's.
- A lamp or candle glows on the glow layer only and lights nothing the fight uses: the dark stays a hazard.

**Rakehead's pools**

| Boss | Piece | For | Gift |
| --- | --- | --- | --- |
| The Drover | ROPE KNIVES | Rogue, daggers | Freeing a captive takes no time and refills your stamina. |
| | THE RECKONING WEIGHT | Cleric, mace | SMITE knocks small goblins flat. |
| | CANDLE CAP | look, any | A miner's felt cap, a lit candle stub stuck to the brim in clay. |
| The Brakesman | THE SPRAG | Warrior, spear | A spear hit stops a charge or a rolling cart dead. |
| | THE BRAKE POLE | Mage, staff | Goblins slowed by your frost stay slowed twice as long. |
| | SPOIL BOOTS | look, any | Ochre mud to the knee. |
| The Raker and the Sluicer | THE WINDLASS | Ranger, crossbow | Winds a third faster. |
| | THE OILSKIN | light armor (Ranger, Rogue, Mage) | Water doesn't slow you; hooked and knocked flat last half as long. |
| | WASHER'S HOOD | look, any | Oilskin, always dripping. |
| The Haulier | MILL PLATE | Warrior, heavy armor | Nothing shoves you or knocks you flat. |
| | THE PLATE-SPLITTER | Ranger, longbow | Full draws do double damage to plate and POISE. |
| | BLUE VITRIOL | Rogue, poisoner | Poisoned goblins take 15% more damage from everyone. |
| | THE SUMP WAND | Mage, wand | Storm spells jump to every goblin standing in water. |
| | THE HAUL ROPE | Cleric, flail | SNAGGED pulls small goblins to your feet and big ones a step. |
| | THE ROPED RING | ring, any | Within 3 tiles of a friend, you and they take 10% less damage. |
| | THE MILL CLOAK | look, any | Scorched at the hem. |

Lore notes: blue vitriol is the copper mine's salt; no gift ever ties copper to magic (the Sump Wand's
jump comes from water). "Hamstringers" in the togetherness rules hunt heroes only, never captives on screen.

## Build order

1. The instance frame: areas that load in turn, gates that wait for the party, checkpoints, packs asleep
   until near.
2. The first instance's areas with packs and its lead-in job.
3. Its mini-bosses, one at a time, then the Haulier.
4. Boss loot pools wired to the party roll; the LOOK slot and its first four cosmetics.
5. Togetherness: the lone-hero hunters, the near-a-friend edge, loot only for those present.
6. Later: a wing-based one (Sallow Priory, after the lore keeper's call), then a huge one.

Decided (Kyle, 2026-11-11): boss loot drops **every run** (unique pieces rare, with bad-luck protection,
so replay is the point); party cap stays **4** for now.

**Who it's for (Kyle, 2026-11-11):** tuned for **three**. It gets harder with each hero over that (a
fourth adds health and harder hits, as the scaling rule above). It does **not** get easier below three: two
well-geared heroes can *just about* beat it, one can't. So the floor sits at three heroes' worth of
toughness, and group areas and bosses never scale under it.

## Open

1. Sallow Priory as the wing model: a fanatic order risks echoing our own church and the Blacktongue
   books *(lore keeper first)*.
