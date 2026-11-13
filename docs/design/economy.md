# The economy: copper, silver and gold, and unlocks that take time

Spec, 2026-11-13 (Kyle and Claude Opus 5.5). Approved by Kyle; not built. Names marked *(lore)* need the lore
keeper and line editor before they go on screen.

## Why

Kyle: "I think you get too much money and things aren't expensive enough. I want economy to mean something
... things to feel like unlocking them took time but was worth it and is impactful."

Measured today: a medium job (about 10 minutes) brings in about 200 gold: about 90 from its pay, about 85
from coins (goblins drop 2 to 8 most of the time), a little from selling drops. Against that a trainer's
stat rank is 70 to 120, the second skill 150 to 400, a FORGED weapon about 180, Halvard's +1 to +3 together
560, a relic charge 18. Nearly everything is a job or two away.

## 1. Three coins

- **Copper, silver, gold**: 100 copper to a silver, 100 silver to a gold. The purse is kept in copper; it
  shows as coins (`3g 4s 20c`, the zero parts left out), each with its own colour and a small coin mark.
- Early on you deal in copper, mid-game in silver; a gold coin is something you earned.
- Every price, reward, pay line and board shows coins the same way (one formatter, `shared/coins.ts`).

## 2. Earning less, and from the right places

- Goblins drop copper; elites and butchers silver; bosses more. Fewer goblin drops overall.
- The job's own pay is most of what you earn, so finishing the job matters more than the kills.
- Tobin pays less for what you bring him (his cut falls); giving to the town works stays the better deal.

## 3. Prices set by time

A medium job is the unit (about 10 minutes). Targets:

| Unlock | Takes |
| --- | --- |
| A Bitter, a relic charge | a part of a job |
| The next stat rank | 1 to 2 jobs early, 4 to 5 late |
| A new skill (the trainer) | an evening: 5 or 6 jobs |
| A FORGED piece / a TOLMOUTH piece | 3 to 4 jobs / a couple of evenings |
| Halvard's +4 and +5, the top tiers | weeks; mostly found or forged, not bought |

Pace: a hero maxed in about 30 hours of play *(assumed; Kyle to confirm)*. Prices are tuned from the
measured income, not guessed: a script plays jobs and reports copper per job by level, and a test holds each
target above.

## 4. Fewer, bigger unlocks

- Trainer stat ranks: fewer and stronger (say 3 ranks of +10% where there were 5 of +5%), each dearer, so a
  rank is felt the moment it's bought.
- Each unlock says plainly what it does and shows the hero's number before and after.

## 5. Worth saving for

Besides gear: LOOK cosmetics (instances.md), a fee to go down into the Deep, Isolde's relic refills (the
javelin arrives broken: town-quests.md), Halvard's top levels.

## 6. Existing heroes

Kept as they are (Kyle, 2026-11-13): levels, gear, knacks, ranks and skills untouched. Their purse carries over
at the same buying power: converted by the ratio the prices moved, so nobody is made poorer or richer by the
change.

## Build order (slices)

1. `shared/coins.ts` (copper in the purse, the formatter, the coin marks) and every place gold is shown.
2. The income measure: a script for copper per job by level; drops and pay retuned to the target.
3. Prices by the table above: trainer, skills, Tobin, Halvard, the vestry, the church; a test per target.
4. Fewer, bigger stat ranks (old ranks carried over at the same total effect).
5. Saves: the purse converted once at the same buying power; a version on the save so it never runs twice.

## Files likely touched

`shared/potions.ts` (COINS), `shared/jobs.ts` (payFor), `shared/prices.ts`, `shared/drills.ts`,
`shared/forgeplus.ts`, `shared/church.ts`, the shop and trainer panels, the HUD's purse, `client/save.ts`.
Check the board: the Deep, Instances and Trading chats price things too (the Deep's fee, instance loot,
trade gold).
