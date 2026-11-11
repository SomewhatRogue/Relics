# Holy and Hungry: gear paths, the Want, and relics

Spec, 2026-11-08 (Kyle and Claude Opus 5.5). Not built yet. Names marked *(lore)* still need the lore
keeper and line editor before they go on screen.

## Why

Right now there is no reason not to take everything:

- Hungry gear is the best gear, never runs out, and stacks with every forge plus and knack.
- The Want, its cost, is mostly cosmetic: eyes at 15, a few town lines at 30, a dread tint.
- Giving a hungry piece up only lowers the Want, so it pays nothing.
- Relics hold 3 to 6 uses at about the old power, so they feel rationed, not big. They also drop
  from butchers often enough to feel ordinary, and finding one isn't clearly signalled.

The goal: two clear paths with real trade-offs, while every piece in either still feels exciting to find.

## 1. Two paths, never both

- **Hungry**: pieces off butchers (as now). Raw power that grows with the Want.
- **Holy** *(lore: name)*: pieces from the church side. Steadier power, built for the party, and it
  carries the relics.
- **Exclusive**: wear any hungry piece and every holy piece you wear goes dim (no stats, no gift)
  until the hunger is off you. A holy piece won't go on while a hungry one is on.
- **Corrupt** = wearing hungry gear, or a Want at or above `WANT.noticed` (30). Corrupt heroes:
  - can't recharge relics (Isolde won't touch them; "give up a utility to use hunger");
  - get no church light, no church shop, no turn-in rewards;
  - are served by Nettle and a back-room dealer *(lore: who)* instead; Tobin already refuses them.
- Every class gets standout named pieces on both sides, one per slot at least, so finds stay exciting
  and the question becomes "which side is this hero on?", not "is this better?".

## 2. The Want bites

The Want rises as now (each hungry piece worn per job, kills in hungry gear, gold given). It becomes the
real price, scaling both ways:

| Want | Hungry gift | Cost |
| --- | --- | --- |
| 0 to 14 | base | none |
| 15 to 29 (eyes) | +10% | goblins notice you sooner |
| 30 to 59 (noticed) | +20% | corrupt; named butchers come for you first; prices up 25%; healers in town turn you away |
| 60+ (turning) | +35% | the party sees it on you; heals from others do half; something in a later chapter |

Shown as a **bar** on the character panel and in the pack (Kyle, 2026-11-08), banded at 15, 30 and 60.

## 3. Turning hunger in pays

Leaving a hungry piece on the step (or giving it to Isolde):

- drops the Want by `WANT.giveUp` (30), as now;
- adds the piece's weight to the hero's **penance** *(lore: word)*, kept for good;
- gives a guaranteed holy piece for that slot, rolled for the hero's class, **if the hero is not corrupt
  after the give** (so you can cash one in to come clean, then get paid from the next).

Penance thresholds pay in the church's best holy pieces (relics now come only from great bosses, section 4).

## 4. Relics: one from each great boss (Kyle, 2026-11-11)

Every hero starts with **the Relic Javelin**. Every other relic comes from **one place only: the end boss of
a big quest** (an instance's final boss, a zone's climax). Beat that boss and, if you don't have its relic
yet, it's yours, every time, no roll. It's **the only way to get relics**: no caches, no chests, no named
butchers' drops, no church gifts. So each relic says where you got it, and each big quest is worth doing.

- **One of each per hero** (2026-11-08). The first in the town to win one is named on the Roll; the relic's
  card says where it came from ("From the Haulier, the Open Cut").
- **Five uses** each before it needs recharging (was 3 to 6). Because the set is fixed and each comes from
  one boss, each can be tuned on its own: big, signature effects, roughly 2x today's.
- A relic won is a moment: its own banner, a line from whoever's near, and it goes straight into a visible
  relic slot in the pack (the earlier complaint: "not clear when you get a relic or how to equip it").
- **Recharge at the church for gold, holy path only.** Corrupt: no recharge, ever, until clean; the Keeping
  Room's trough is the corrupt hero's only way (section 7). The Tooth Ring (kills recharge) stays too.
- Relics never touch the Want (2026-11-08), can't be traded (2026-11-11), and **sour on the corrupt**:
  each job carried corrupt it may pick up a bad trait (a use costs some health, it calls a goblin to you,
  it sometimes misfires); three at most, a fourth and it goes dark for good; the church lifts traits for
  clean heroes while it has fewer than three. Isolde and Dorcas both warn of it.
- Elemental relics: later (section 6).

### Draft: which boss gives which *(lore keeper to settle; one per great boss, more as bosses come)*

| Relic | From (draft) |
| --- | --- |
| Relic Javelin | Every hero starts with it |
| Grappling Hook | The Haulier, the Open Cut (Rakehead's end) |
| Knuckle | The Hempen Man, Hangman's Wood |
| Lodestone | The Doorkeepers, Lowfurrow |
| Net | Fenmere's end boss |
| Gall Bomb, Wind-Up Bow, Bone Whistle | Held for the next great bosses (Coldscar's Turnkey, the Old Park, the Corpse Road) |

Retired by this: relics placed in caches, penance relics, and "a hero's first named-butcher kill always
drops a relic". Penance (section 3) pays in holy pieces instead.

## 5. Holy gear

- Same tiers and slots as hungry; one named holy piece per class per slot to start.
- Gifts lean to the party: heals that carry, shields on friends, faith or stamina back to others,
  relic charge saved.
- Costs are small and fair (holy pieces aren't free power): slower, heavier, or a vow (no gambling at
  Moll's while worn, say) *(lore)*.
- Got from: turning hunger in (section 3), rare church-side spoils, and the church shop for clean heroes.

## 6. Later: elements

Both paths can carry an element (fire, frost, storm), each bending it: holy fire heals what it touches
of friends, hungry fire feeds you. Elemental relics stay non-rechargeable. After sections 1 to 5 land.

## 7. The Keeping Room: the hungry path's church (Kyle, 2026-11-08; lore keeper's proposal)

The inverse of the church, hidden in the Wickhold Sewers. Kept strictly a **shop and a hoard**, never a
shrine: no altar, no prayers, no rites, no god, no sun imagery (a hidden cult under the town is the
Blacktongue thieves' guild; we don't go there).

**What it is.** In the siege Wickhold melted its bells and gave its metal. Some didn't: they hid pewter,
rings and plate in the old cistern off the culvert. It's hidden because it proves the town didn't give
everything. Gold is kept or given; this is the kept half. (For the bible only: a relic is hunger, so set
a given thing in front of it and it eats. Nothing else in the room is magic.)

**Who's there.**
- **Dorcas**: the church's verger before Oswin. She carried the Lantern box in the siege, kept some of
  it, and was put out. Warm, chatty, calls you "duck", tells you exactly what a thing costs and does and
  never why. Honest and wrong, the mirror of a church that's "not wrong but not honest".
- **Nettle** carries holy pieces down to her (unsaid on screen). Isolde won't say Dorcas's name; Odric
  still counts her among his own and changes the subject.

**Finding it.** Only for a corrupt hero, or one carrying a soured relic. Near a bricked arch in the
Sewers' cistern node the soured relic goes warm; scratches at hand height catch the eyeshine (clean eyes
see nothing). At the iron slot Dorcas looks at your eyes; if they shine, the bolt goes back. A clean hero
just sees brick.

**What it does.**
- **Feed a relic**: lay holy pieces in the trough with the relic on top; it eats them and fills. This is
  the corrupt hero's only recharge. It can't lift a sour trait (that stays the church's, clean only).
  Elemental relics still can't be filled.
- **Giving holy pieces to Dorcas raises the Want** (it's keeping).
- Dorcas trades in what the town hid (draft: hungry-side odds and ends, never relics).

**The map** (three-quarter, one small node off the Sewers):

```
  culvert walkway
  ==============+
                |  THE DRY ARCH: walkway's end, iron door with a slot.
             [ D ]  No light but yours, and the shine on the scratches.
                |
   +------------+-------------+
   | shelves  shelves  shelves|  THE CISTERN: drained, shelved all round with
   |   .      (cradle)    .   |  the hoard; tallow stubs on every shelf; a
   |  cot  brazier+kettle  .  |  cradle among it; Dorcas's cot, brazier, kettle.
   +------------+-------------+
                |
           ( trough )           THE TROUGH: a stone basin under a drip. The relic
                                laid on the holy pieces is the light: gold waking
                                to sick green as the pieces under it go dull.
```

**The yellow and gold tiers become holy.** TOUCHED (yellow) becomes **VOWED** (or GIVEN) and TURNING
(gold) becomes **HALLOWED**. "Celestial" is never a word on screen: their stat lines show gold with a small
candle-flame mark, each saying what it does (relic power, a relic use saved, heals that carry to a friend,
shields on friends). No sun, no stars. They can use relics; they stay below HUNGRY in raw power.

This breaks (to change when built): the bible's rare-tiers entry (touched and turning as hungry gear
caught partway, growing the Want); `TIER_WANT` and `COST_POINTS` in costs.ts; "the vestry never stocks
touched or turning"; Tobin's fear of yellow and orange (new reason: "that's the church's, not mine to
buy"); butcher drop tables in gear.ts (a butcher's fist can't hold holy steel); the Want band named
"turning" at 60+ (rename).

New lore for the bible: the Keeping Room, Dorcas, Nettle's route down, the siege hoard. Optional seed for
chapter 5 (Kyle's call): a small bell someone kept from the melting, on her shelf.

## Build order (when we code)

1. Corrupt flag and exclusivity: dim holy on hungry, block recharge and church services when corrupt.
2. The Want tiers (section 2 table) wired into the fight and the town.
3. Penance and paid turn-ins (section 3), with the first holy pieces.
4. Relics: only from great bosses' first kills (each hero once), start with the javelin, five uses, the
   won-a-relic moment and pack slot, power up.
5. Penance rewards and the holy shop.
6. VOWED and HALLOWED tiers replace TOUCHED and TURNING.
7. The Keeping Room and Dorcas.
8. Elements.

## Questions for Kyle

Answered 2026-11-08: one relic per hero; the Want is a bar on the character panel and pack; relics never
touch the Want, but they sour on a corrupt hero (above).

The town's treatment is real and per hero (Kyle, 2026-11-08: "it's about the individual hero, not who you
party with"): a corrupt hero is refused by Isolde and the healers and pays more, whoever they came in with;
their clean friends are served as normal.

Souring (Kyle, 2026-11-11): a relic holds **at most three** bad traits. A fourth and it goes dark for
good. The church lifts traits (clean heroes, for gold) only while it has fewer than three. Isolde says so
at the church, and Dorcas in the Keeping Room, each in their own way: the player must be told before it
happens, not after.

Still open: the kept bell on Dorcas's shelf (chapter 5 seed), VOWED or GIVEN for yellow.
