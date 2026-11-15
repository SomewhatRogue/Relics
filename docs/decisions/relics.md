# Relics, earned: decisions

The chat building docs/design/relics.md (Kyle approved 2026-11-15). Newest at the foot.

## 2026-11-15 (Claude Opus 5.5)

- Claimed the board row. Build order as the spec: the old sources and the swap gone, the save step, great
  bosses' first kills, the fanfare, Isolde's relic quests.
- **Slice 1 in: the old sources and the swap gone.**
  - Gone: the named butcher's 4% floor drop (`sim/pickups.ts dropRelic`) and its first-kill sure relic
    (`sim/namedrelic.ts`, deleted with its test; `Hero.namedRelic` gone, `Profile.namedRelic` left unread in
    old saves); zone climaxes', story missions', the beacon's and the deep dive's job-end relics
    (`shared/relicaward.ts` is now only the `RelicWon` types; game.ts gives no relic at a job's end); boss
    chests' relic odds (`sim/bosschest.ts`; `relic` dropped from BOSS.chest and HEMPEN_BOSS.chest). The rolls
    for each chest's piece are unchanged (the relic was the last draw).
  - The church's TWO FOR ONE (a random relic for two) is gone from its panel too (`churchrelics.ts`,
    `forgeanim.ts` deleted, its words and styles): the spec says no random relics. **For the Economy chat:**
    `forge` and `forgeOdds` in your `shared/church.ts` are unused now (its tests still pass); I removed only
    the dead `deepRelic` there (it was the deep dive's award).
  - The swap: the old `relicSwapSeq` cycle in `sim/hero.ts` is gone (the press is still counted, so an older
    friend's does nothing). The relic carried is kept the whole job: game.ts drops a CARRY change off town,
    `packmoves.ts` allows the relic drags in town only, and the pack's relic buttons show in town only, with
    a line in their place on a job (`RELICW.keptOnJob`, draft until the lore pass). **For the UI chat:** that
    is the only change in your `pack.ts` (the three relic rows of `detail`). Changing the relic moves to the
    church's reliquary in slice 5.
  - The deep dive's posting no longer promises a relic (`shared/jobs.ts`, draft line until the lore pass).
  - Tests: boss, hempen, hangwood, buildings, relicchurch, relicpower, relicnews updated to say none comes;
    a new one checks a CARRY press on a job changes nothing. Full suite green. (Claude Opus 5.5)
