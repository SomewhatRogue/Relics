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

Penance thresholds give a relic (section 4): it's how a hero who touched hunger and walked away earns
the church's best.

## 4. Relics: unique, placed, rare

Each relic is **one of a kind and found in one place**. No duplicates, no refinding, no random butcher
drops. A relic found is a moment: its own banner, a line from whoever's near, and it goes into the pack
where you can see and equip it (the earlier complaint: "not clear when you get a relic or how to equip
it").

### How they're got

1. **Placed in the world**: each relic has one home: a hidden cache on one map, a named butcher's first
   kill, or a world event. Very rare to stumble on; worth hunting for. Rumours (Gannet, the board) hint
   at where.
2. **Penance**: the church gives one at penance thresholds, only if you're not corrupt (draft: weight 3,
   8, 15).
3. **Never** from ordinary drops or chests. The "first named-butcher kill always drops a relic" rule
   becomes "each named butcher holds its own relic, once".

**One per hero** (Kyle, 2026-11-08): each hero can find each relic once. The first in the town to find
one is named on the Roll.

### Bigger, and recharged by the clean

- Fewer uses stay (3 to 6), but each use is an ultimate: roughly 2x today's power, and every one gets a
  signature effect.
- Recharge at the church for gold, holy path only. Corrupt: no recharge, ever, until clean. The Tooth
  Ring (kills recharge your relic) stays as the hungry path's one way round it.
- Elemental relics: a third axis, later (section 6).
- Relics never touch the Want (Kyle, 2026-11-08).
- **Relics sour on the corrupt** (Kyle's idea, to try): a relic carried by a corrupt hero slowly turns.
  Each job it's carried corrupt, it may pick up a bad trait (draft: a use costs some health, it calls a
  goblin to you, it sometimes misfires), more over time. Coming clean stops the souring; the church can
  lift a bad trait for gold, clean heroes only. So hunger costs you your relics twice: no recharge, and
  they rot.

### Draft homes for the relics we have *(lore: names and places)*

| Relic | Home (draft) |
| --- | --- |
| Relic Javelin | A cache under the Wickhold Sewers' old outfall |
| Grappling Hook | Hesketh Hall, the roof beams (reach it in the hall's second room) |
| Lodestone | Fennick Ford, the tally wall's foot, found once the Ford is cleared |
| Gall Bomb | Old Spoon's first kill (the Sewers) |
| Wind-Up Bow | Tollan's Farm, the larder's back room |
| Bone Whistle | Sallow Carr, Old Knuckles' first kill |
| Knuckle | Hangman's Wood, the Hempen Man's first kill |
| Net | Fenmere, a drowned boat at the Lantern box's furthest reach |

More to come, one per new place and boss (the Haulier and the Open Cut next). Penance relics are
church-only: two or three that can't be found anywhere else *(lore: what)*.

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
4. Relics: remove random drops, place the eight, the found-a-relic moment and pack slot, uses 2x.
5. Penance relics and the holy shop.
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
