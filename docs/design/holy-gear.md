# Holy gear: penance and the first holy pieces

Approved by Kyle 2026-11-19 (his answers at the foot). Written by Claude Opus 5.5. The detail of docs/design/holy-and-hungry.md sections 1,
3 and 5, built as slice 4 (docs/decisions/holy-and-hungry.md). Section 5b (holy pieces grow) and the crossroads
are slices 5 and 6, on top of this. Names and words are the lore keeper's (2026-11-19), for Kyle to pass.

## What a holy piece is

The bible's root: the Lantern isn't holy, it's *given up*. Hungry gear is steel the hunger took. A holy piece is
the other thing: steel someone **gave** (to the Lantern, at the step, in a vow), and the church kept it, so it
carries a little of what was given. It isn't magic in itself; it helps the people around you, the way giving does.

- **Steadier, and for the party.** Each piece's gift leans to friends: heals that carry, a ward on someone else,
  stamina or magic back to others, a relic use saved.
- **Costs small and fair:** slower, heavier, or a vow kept while it's worn (no dice at Moll's, say).
- **Strength now:** PRE-WAR's (tier step 3), two modifiers at PRE-WAR's budget, plus its gift and its cost. It
  grows toward HALLOWED's top in slice 5.
- **Never with hunger:** wear any hungry piece and every holy piece you wear goes dim (no modifiers, no gift) until
  it's off; a holy piece won't go on while a hungry one is worn. The card says DIM when it is.
- **Can't be melted or upgraded by Halvard,** like hungry gear (its growth is its upgrade). It **can** be traded,
  count and all (holy-and-hungry 5b).

## The first set: nine, the mirror of hungry's ten

One weapon a class, on one of its kits; two body pieces; two rings. No legs yet (hungry has none either).

| Slot | Class, kit | Gift (draft) | Cost (draft) | Name (lore keeper) |
| --- | --- | --- | --- | --- |
| Weapon | Warrior, sword | A blow you block gives the nearest friend some stamina back. | You move 5% slower. | THE WIDOW'S SWORD (a woman left her man's blade at the step) |
| Weapon | Ranger, longbow | A full draw that hits heals the nearest friend a little. | Draws take 10% longer. | KETTERBY'S BOW (from the hamlet burned in the war's first year) |
| Weapon | Rogue, daggers | A backstab: friends near you take 10% less damage for 4 s. | Each dodge costs 10% more stamina. | THE RETURNED PAIR (stolen, then brought back) |
| Weapon | Mage, staff | A kill with a spell gives the nearest friend magic or stamina back. | Your skill recharges 10% slower. | THE APPRENTICE'S STAFF (someone who didn't come back from a job) |
| Weapon | Cleric, censer | Your heals carry to a second friend at half. | Heals on yourself do half. | THE INFIRMARY CENSER |
| Body | heavy, any class | Friends near you take 10% less damage. | You move 8% slower. | THE BREACH MAIL (worn on the north wall) |
| Body | light, any class | You raise a fallen friend twice as fast. | You take 5% more damage. | THE CART-HAND'S COAT (from Odric's burial cart) |
| Ring | any class | Your relic holds one more use. | No dice at Moll's while you wear it (she shrugs, no lecture). | THE SWORN-OFF RING (someone swore off the dice) |
| Ring | any class | Each relic use heals friends near you a little. | Coin from kills counts 10% less. | THE TITHE RING |

Every gift goes through something the fight already has (blocks, full draws, backstabs, spell kills, heals, the
ward, raising, relic charge), so each is a hook, not a new system.

## Getting one: penance and the turn-in (holy-and-hungry section 3)

Leaving a hungry piece on the step, or giving it to Isolde:

- the Want falls by 30, as now;
- the hero's **penance** (on screen **AMENDS**: penance implies a sin, and the Want isn't one) grows by the piece's weight, kept for good: 1, plus 1 for every 12 jobs it
  was worn (shared/hunger.ts's count), so an old, sour piece given up is worth more than a fresh one;
- **if the hero is clean after the give** (no hungry piece left on, the Want under 30), Isolde, or Odric at the step,
  hands back a holy piece for that slot, for their class (not Oswin: the vestry hangs only maces, flails and robes). So you can give one up to come clean, then get paid for the next.
- Penance's thresholds paying in the church's best pieces, and the holy shop, are slice 7.

Penance is a number on the profile. Shown? A draft: no number, a line from Odric when it crosses a step ("that's amends
made", small, and he changes the subject; Isolde may say more), as the Want is never a number either. Kyle's call.

## How it shows

- A holy piece's card: its name, a **GIVEN** chip with a small candle-flame mark in warm white (gold would clash with
  relics and the Cleric's light), its GIFT and COST rows as hungry gear's, then DIM if it's dimmed.
- The card only ever says what a piece does: never holy, blessed, the Lantern, or that the steel is anything more.
- Tobin and Nettle won't take a given piece (the church kept it).
- In hand and on the floor: drawn as its kit's PRE-WAR look for now; its own looks with gear-looks later (Art).

## Whose files

Mine (new): `shared/holygear.ts` (the nine, rolling one), `shared/penance.ts`, `sim/holygear.ts` (the gifts and
costs in the fight), `client/holywords.ts`, tests. Small edits: `client/game.ts` (`giveUp`), `sim/gearstats.ts`
(dim), the equip paths. Asked: Gear (`loot.ts`, an `Item.holy` field; `card.ts`, the rows and DIM; `gear.ts`, a
holy piece can't be melted or upgraded), UI (the chip's look), Trading (`cleanItem` keeps `holy` and the count).

## The lore keeper's calls (2026-11-19)

- **The path's word: GIVEN.** HOLY on screen would tell players the Lantern is holy (it isn't; the bible's first
  secret) and collides with the Cleric's "holy warrior". GIVEN is the bible's own word, and it sits opposite
  HUNGRY: taken against given. VOWED second.
- **HALLOWED, the top the pieces grow toward (holy-and-hungry section 7), is HOLY by another door:** rename it
  before slice 5 (STEADFAST, say; not "kept", the Keeping Room's word).
- Two of the costs (the sword's, the mail's) are flat percentages where hungry's read as small stories; one could be
  a vow instead.
- New lore for the bible if this lands: given steel carries a little of what was given, never magic, the Lantern
  never named; AMENDS as a hidden number; the pieces' origins; the church hands back given steel for hungry given up.

## Questions for Kyle

1. **The path's word on screen:** GIVEN (the lore keeper's), HOLY, or VOWED? And HALLOWED renamed (STEADFAST)?
2. **Nine to start,** mirroring hungry, or one per class per slot (twenty with legs) as section 5 first said?
3. **AMENDS shown** as a number, a bar like the Want's, or only Odric's line at each step?
4. **The gifts and costs above:** any to swap?

## Kyle's answers (2026-11-19)

1. **VOWED** is the path's word on screen (over the lore keeper's GIVEN). The chip reads VOWED. HALLOWED's rename waits
   for slice 8 (the tiers), asked then.
2. **Nine** to start.
3. **AMENDS: Odric's line only,** no number, no bar.
4. **The costs as drafted.**

## Slice 7: amends pay out, and Odric's shelf (Kyle's yes, 2026-11-20)

Holy-and-hungry section 3: "Penance thresholds pay in the church's best holy pieces"; section 5: holy pieces from
"the church shop for clean heroes". No new names: both use the nine, so nothing new to learn.

**Amends pay out.** At each amends step (3, 8, 15, 25), as well as Odric's line, he hands the hero a vowed piece
for a slot they pick, already part grown: a quarter, a half, three quarters, then nine tenths (never ripe, so
the crossroads stays the hero's own doing). "The church's best" is the most grown it lends. Only to a clean
hero; reached while corrupt, it waits for them on the shelf until they're clean.

**Odric's shelf.** At the church, beside the step, the vowed pieces nobody is carrying: three at a time, for the
hero's class, changing with the shops' window. Clean heroes only (holy-and-hungry section 1: no church shop for
the corrupt). Fresh, not grown. Its price is Kyle's call (question 2). Its own file, `shared/shelf.ts` (the vestry is
the Gear chat's and Oswin's, and the bible keeps it to maces, flails and robes).

### Questions for Kyle
1. **Payout:** a part-grown vowed piece of your choice of slot at each step, as above?
2. **The shelf's price:** gold like any shop (about a strong PRE-WAR piece), or a gift at the Lantern (the gold goes
   in the box, so it lowers the Want too; the bible's own currency for the church)?
3. **The shelf at all:** three for your class a window, or leave vowed pieces to the turn-in and amends only?

**Kyle's answers (2026-11-20):** part-grown pieces at each step, as drafted; the shelf's price is a gift at the
Lantern (its gold goes in the box and lowers the Want).
