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

Open: shown as a bar or number, or felt only (eyes, voices, prices)? Leaning: a small mark on the
portrait, no number.

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

Open: unique per hero (each hero can find each once; friendly to co-op) or unique per town (only one
hero in Wickhold holds it until it's given back; a big deal, but harsh)? Leaning: per hero, with the
first finder in the town named on the Roll.

### Bigger, and recharged by the clean

- Fewer uses stay (3 to 6), but each use is an ultimate: roughly 2x today's power, and every one gets a
  signature effect.
- Recharge at the church for gold, holy path only. Corrupt: no recharge, ever, until clean. The Tooth
  Ring (kills recharge your relic) stays as the hungry path's one way round it.
- Elemental relics: a third axis, later (section 6).

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

## Build order (when we code)

1. Corrupt flag and exclusivity: dim holy on hungry, block recharge and church services when corrupt.
2. The Want tiers (section 2 table) wired into the fight and the town.
3. Penance and paid turn-ins (section 3), with the first holy pieces.
4. Relics: remove random drops, place the eight, the found-a-relic moment and pack slot, uses 2x.
5. Penance relics and the holy shop.
6. Elements.

## Questions for Kyle

1. Relics unique per hero or per town?
2. The Want as a visible bar, a mark, or felt only?
3. How hard should the town turn on a corrupt hero in co-op (prices and refusals, or only flavour)?
4. Does carrying a relic, or leaving one on the step, touch the Want? (Already open in the story bible.)
