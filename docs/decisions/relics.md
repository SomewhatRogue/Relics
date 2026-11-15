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
- **Slice 2 in: the save step.** `shared/relicreset.ts` `fitEarned`, run from `client/save.ts` right after
  `fitRelics`: a hero saved before this (`relicsV` missing) keeps one Relic Javelin (the carried one, else a
  plain one, else the first) and nothing else; carried, if anything was carried; NEW marks of the others
  cleared. `relicsV: 1` on the hero marks it done (new heroes start with it, so a relic won is never
  touched). How many went waits in `relicsGone` until told: the first time in Wickhold, after any raid news,
  a card (`client/relicgone.ts`, from main.ts's raid-news spot) says so once, then it's saved. Words draft
  until the lore pass (`RELICW.goneTitle`, `goneLine`, `goneIsolde`). Small edits: `progress.ts` (the two
  fields, `relicsV: 1` in newProfile), `save.ts`, `main.ts`. tests/relicreset.test.ts. (Claude Opus 5.5)
- **Slice 3 in: great bosses' first kills.** `shared/relichomes.ts` holds each relic's one home (draft table
  from the spec: javelin the start; hook the Haulier; knuckle Hempen; lodestone the Doorkeepers; net
  Fenmere's end boss; bomb, wind-up bow, bone whistle church quests). `sim/relicboss.ts`: the room's death
  step (one line in room.ts, its own seeded stream `homeRng`) gives a beaten great boss's relic to every
  hero there without one of that kind, through `takeRelic` (the found moment; carried if nothing is), marked
  `from` on the item (a new optional `RelicItem.from`, for the fanfare and the reliquary). Hempen (BossOn
  `hempen`) gives the knuckle; the Doorkeepers, when both Latch and Hasp are down and not on a Deep floor
  (their home is the great barn), the lodestone. A friend in the leader's room gets theirs home through
  keepKit as any pickup.
  - **For the Instances chat:** the Haulier's hook is yours to give at the Open Cut's end: call
    `giveHome('haulier', room.heroes, rng, room.events)` (sim/relicboss.ts) where the instance is won, on a
    stream of your own. It's idempotent (nobody gets a second hook). Nothing of yours is touched; the Deep's
    Haulier gives none.
  - Open for Kyle: giving a relic up at the church (GIVE IT UP, for the light) and beating its boss again
    gives it again. "Never twice" would want a list of relics ever won; say if so.
  - Open for the lore keeper: the net is also the Ranger's class skill (HUNTER'S NET), so Fenmere's relic may
    want to be something else. Fenmere's end boss isn't built yet.
  - tests/relicboss.test.ts (the pair in the barn, Hempen in the wood, the Deep floor, giveHome). (Claude Opus 5.5)
