# Balance: the bench

Spec, 2026-11-16 (Kyle and Claude Opus 5.5). Not built; Kyle's yes on the slices before building.

## Why

Kyle: "High level you should blow up small goblins but also get harder and tougher quests and enemies with
better rewards. Can still do lower level ones but lesser rewards. I want to make sure across all characters and
weapons things are relatively even, even across all a wizard's elements, also knowing there are instances with
harder elite enemies. Find the zone between blowing things up skillfully and being OP or too easy. Some things
have more to do with skill, like a Rogue's backstab, or how a wizard is super high damage and AoE but very little
HP and armour."

Today's reworks (spear, staff, wand, the slow classes' pace) were each found wrong by playing. The bench is so
the numbers show it first.

## 1. What "even" means

Not the same numbers: the same **outcome for the same skill**, each class getting there its own way.

- **Kill speed** (a room cleared, a boss down) and **risk** (damage taken, how often you'd go down) are
  measured together. A Mage clears fastest and takes hits worst; a Warrior the reverse; both land in the band.
- **Skill moves you through the band, not out of it.** Each kit is measured at three skill levels:
  - *Plain:* taps, no perfects, no positioning, dodges nothing.
  - *Good:* perfect releases most of the time, dodges telegraphs.
  - *Sharp:* the kit's own skill play: a Rogue's backstabs, a wand's tight flash, a staff placing a dome,
    a spear's chain into a big one.
  Sharp should beat plain by a lot, roughly 1.5 to 2.5 times, but plain must still finish what its level is
  meant for.
- **Elements:** a Mage's fire, frost and storm in the same band for each kit (fire's burn and frost's freeze count).

## 2. Levels, tiers and rewards

- Each job has a danger (shared/jobs.ts `danger`, 1 to 5). The bench sets a **target level for each danger**,
  and checks a hero at that level and kit in the band there.
- **Over-levelled** (danger well under you): goblins fall in a hit or two. Pay and drops fall off with the gap,
  so farming low jobs is quick but not worth it (ties in docs/design/economy.md).
- **Under-levelled** (danger over you): possible with sharp play, risky with plain; more pay to match.
- **Instances and elites** (docs/design/instances.md, the Deep): a step above the board at the same level;
  the bench runs them as their own tier.

## 3. The bench (what's built)

A script, run by hand or by a chat, never in the normal test run (it's slow):

- **Every kit x element x skill level x level x tier**, a few seeds each, on real job rooms and instance rooms,
  built on tests/clearbot.ts (made to take hits, not ghosted) and scripts/incomebot.ts (for pay).
- **Out:** clear time, damage taken, downs, pay per minute; each kit's spread against the band. Flags anything
  out of band: too easy, too hard, one element or kit far off, skill not mattering, a level gap that doesn't
  show.
- **A report Kyle reads:** a Dashboard artifact (one page): a heat map of kit by tier, coloured by how far from
  the band; click a cell for the numbers. Republished at the same link each run, so it's a running record.
- **Guard tests:** once a band is agreed, a few cheap tests hold the worst offenders inside it (as threat.test.ts
  does for daggers and the wand).

## 4. Class identity it must keep (Kyle's words, the bench checks them)

- Mage: very high damage and area, very little health and armour; wand quick and timing-based, staff slow,
  big and rooted.
- Rogue: skill-heavy; backstabs make it, and plain play should feel it lacking.
- Warrior: tough, holds the line; spear and shield reach and pulls.
- Ranger: quick, at range; the leap shot and the jump.
- Cleric: keeps a party up; its own damage the lowest.
- Slow three walk alike, the quick two alike (tests/pace.test.ts).

## Build order (slices)

1. The bench's bones: clearbot taking hits, a skill dial (plain, good, sharp per kit), the runner over kits,
   elements, levels and tiers; a table printed.
2. The report as a Dashboard artifact, republished each run.
3. Kyle reads the first report and agrees the band; the target level per danger set.
4. Tuning passes, a kit or two at a time (main chat or a builder each), the bench re-run each time.
5. Level gap: pay, drops and goblin toughness scaled by the gap (with the economy spec's numbers).
6. Guard tests for what tuning settled.

## Notes

- Costs: the runs are long; run them in the background, one at a time, and keep the matrix small at first
  (a level or two, the board's tiers), growing it once the numbers look right.
- Shared files: weapons.ts, spellbook.ts, tuning.ts are touched by tuning passes: small edits, pulled just before.
