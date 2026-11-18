# Your cloth: earned by deeds, made by a tailor, for every class

Kyle, 2026-11-17, on the knight's new cloak: "Or we make it like the shield - you can customize it (and we let all
classes customize theirs)." Then: "Lets make it something you can unlock - also where does it come from? Like doing
x number of things killing goblins, quests, etc let you unlock a new color or effect to a new article of clothing.
Maybe its a new vendor in town."

**Status: slice 1 is in the game (2026-11-17): the rules, the save and sending, the Warrior's cape, and Hester the
tailor between the two stalls on the square. Kyle said yes to the suggested answers at the foot. Slice 2 is in too (the
same day): the Ranger's and the Rogue's hoods and cloaks take a dye and an edge. Slice 3 is in as well: the Mage's
robe and hat, the Healer's tabard (its edge is its metal: edges, hem and Lantern), the friar's habit. All five
classes are done.**

## The idea in three lines

- What you have done in the war earns you the right to a cloth: a colour, an edge, an effect.
- A new tailor in town makes it for you and keeps the list of what you have earned and what is still ahead.
- Looks only. The room never reads it, and it is seen by everyone in town and in your party, as the shield is.

## What there is to earn

Three kinds of thing, each a row on the tailor's page:

| Row | Entries | Who |
| --- | --- | --- |
| Colour | The look's own (as drawn today; every hero starts with it), then six dyes: RED, BLUE, GREEN, BLACK, WHITE, OCHRE (the shield's six, so a cloak can match a shield) | Every class |
| Edge | None (to start), then IRON, SILVER, GOLD | Every class |
| Cut and effect | The look's own, then LINED (the knight's flared cloak, capelined.ts), then RAGGED (a torn hem that flutters; herolife.ts already draws it) | Warrior to begin with |

"The cloth" is the Warrior's cape, the Ranger's hood and cloak, the Rogue's hood and long cloak, the Mage's robe and
hat, and the Healer's tabard. More articles (a helm's crest, a sash) and more effects can be added later as more
rows and entries; none are in this spec.

One thing an effect must never be: red eyes, rising embers or ash. Those are the eye dial's mark (heroeyes.ts) and
tell the party something true about a hero.

## Where it comes from: deeds the game already counts

Every hero already carries a tally for the Roll of the Brave (shared/progress.ts `Stats`), a level, a deepest floor
and a list of quests done. The unlocks read those, so nothing new is counted, and a hero who has already done the
deed has earned the cloth the day this ships.

A first table. The pairings are meant to make sense; the numbers are first guesses for the balance thread to set.

| Earned by | Tally read | Unlocks |
| --- | --- | --- |
| Your first job done | `jobs` 1 | IRON edge (so the first visit to the tailor has something in it) |
| 100 goblins killed | `kills` | RED |
| 10 jobs done | `jobs` | BLUE |
| 10 friends picked up | `raised` | GREEN |
| 5 butchers killed | `butchers` | BLACK |
| 25 people brought home | `saved` | WHITE |
| 500 coin given away | `given` | OCHRE |
| Floor 5 of the Deep | `deepBest` | SILVER edge |
| Every hero quest done | `quests` | GOLD edge |
| 25 jobs done | `jobs` | RAGGED |

LINED is every Warrior's from the start (call 5). Dens burned earns nothing yet: it is free for the next entry.

As built, the table is `DEEDS` in src/shared/clothlook.ts.

## The tailor

One new person in town for all five classes, rather than a button at each trainer. Their page:

- The hero drawn large, facing you and walking away, in whatever is picked.
- The three rows. An entry you have earned is lit and can be worn. One you have not is dimmed and says what earns
  it and how far along you are: "GOBLINS KILLED 62 OF 100".
- Wearing and changing what you have earned is free and instant.

A name, a line of greeting and where they stand are for the lore pass and the town layout: a stall on the square
beside Tobin's pawn stall is the simple place (shared/town.ts).

## How it is kept, sent and drawn

- `src/shared/clothlook.ts` (new): the entries, each with its deed; `earned(profile)` from the tallies; `ClothLook
  { colour, edge, cut }`; `fitCloth` so a saved or heard choice that is unknown falls back to the look's own; a pack
  of three small numbers.
- `Profile.cloth` holds only what is worn. What is earned is worked out from the tallies each time, so there is
  nothing to migrate and nothing to lose.
- `Hero.clothLook` (sim/types.ts, drawing only), set where `shieldLook` is; town presence carries it beside the
  shield and the hound.
- Each look names the two colours its cloth is drawn in. A dye swaps that pair through the look's pixels and through
  what moves (cape, cloak, mantle, hem, tabard) before the sharp painting. `heroLook(cls, look, cloth)` builds a
  dyed look the first time it is asked for and keeps it, as `shieldSprite` does. The 2.5D view follows with no work
  of its own.
- The six dyes are dark-and-gold colours: deep, none brighter than today's red, WHITE a bone white. Each is checked
  under torchlight and at night before it ships.

Honest limits at this size (18 pixels wide): an edge is one pixel, so on the four classes whose cloth is part of the
body it is a hem line and little more. Colour is what reads. Each class keeps its outline, and two Warriors in one
party can at last be told apart.

## Slices

1. **The rules, the deeds, the save and sending, the Warrior's cloth, and the tailor with their page.** Kyle plays.
2. **Ranger and Rogue.**
3. **Mage and Healer.**

Main chat, no builder agent. Slice 1 is a medium change (one system, about a dozen files, most of them a few lines);
2 and 3 are small. New player-facing words go to one lore-keeper call and one line-editor call per slice.

## Whose files

The Art chat owns sprites.ts, herolooks*.ts, lookkit.ts, herolife.ts and actors.ts; the town's map and its people are
the town chats'; types.ts, game.ts and save.ts are shared. So this is built here with Kyle's go-ahead for small edits
in those files (as the knight's cloak was), or handed over with this spec.

## Kyle's calls

1. **Earned by deed and then free, or earned and then bought?** Suggested: earned and free. The deed is the price;
   a coin cost on top is a balance question for that thread.
2. **Deeds already done count?** Suggested: yes. An old hero walks in and finds what they have earned waiting.
3. **One tailor for everyone, on the square by Tobin?** Suggested: yes.
4. **The table of deeds.** Are the pairings right, and is anything missing that you want honoured (fishing, the
   range, dice, a shame cloth for the most times knocked down)?
5. **The knight's cloak.** He wears the lined red-and-gold one today. Suggested: every Warrior keeps LINED from
   the start, so nothing is taken away, and the table's 25 jobs earns something else (RAGGED moves there).
6. **The Healer's robe stays pale, and only the tabard and its edge change?** Suggested: yes. The pale robe is how
   a party finds its healer in a fight.
7. **Who builds it?** Suggested: this chat, slice 1 only, then you play it and say whether the other four classes
   are worth doing.
