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
- **Slice 4 in: the fanfare.** A relic won (one with `from`, slice 3) has the full-screen moment in place of
  the small pop (`client/relicfanfare.ts`, shown by `relicmoment.ts`, styles in `relicpop.css`), after the
  "A relic won" artboard: A RELIC, the picture big in a gold frame, the name in gold, where it came from,
  its uses and RECHARGE AT THE CHURCH, what it does (the card's USE line), the Roll's line, a line about the
  place, and SEE IT IN THE PACK (opens the pack). It stays until tapped (25 s at most); the fanfare sound
  always plays. Nobody stands near a dead boss but the party, so the "line from whoever's near" is the
  place's own line for now: the lore keeper to say who, if anyone.
  - **The Roll:** `shared/relicroll.ts`. When a won relic reaches the save (game.ts keepNoting), the game
    gives the world `relics: [kind]`; the world keeps the first name per kind for good
    (`WorldState.firstRelics`; `contribute` in `worldsync.ts`; `api/_world.ts clean` passes only relics that
    are won, never the javelin). The moment says whether you're first or who was (by the world as last
    read). The Roll of the Brave panel lists every won relic and its first winner, or Nobody yet
    (`client/relicrollui.ts`, one line in `squareui.ts`, the BRAVE side).
  - It goes straight into the relic slot when nothing is carried (takeRelic, as before).
  - tests/relicfanfare.test.ts. Lines draft until the lore pass. (Claude Opus 5.5)
- **Slice 5 in: the reliquary.** The church's relic panel (Father Odric's RELICS, `churchrelics.ts`) is THE
  RELIQUARY (name draft for the lore keeper): every relic held with where it was won and CARRY THIS ONE (the
  one carried tagged CARRYING), recharge and give-up as before, then STILL TO WIN: each relic not held, dark,
  with a word on where it's said to be (`RELICW.saidToBe`; the church-quest ones "Mother Isolde might, when she
  has word"). The pack now only shows relics: no drag or button carries or puts one away, in town or out
  (`packmoves.ts` relic moves gone; UI's `pack.ts` relic rows say where to choose). The Keeping Room's shelf
  waits for that room (holy-and-hungry section 7). **For the UI chat:** `relicshelf.ts`'s header still says
  "drag it onto RELIC to carry it"; the drop does nothing now. tests/reliquary.test.ts. (Claude Opus 5.5)
- **Slice 6 in: Mother Isolde's relic quests, rare and one at a time.** `shared/relicquests.ts`: at most one
  open (`Profile.rq`); one is offered only at each fifth level reached, or 20 world days after the last was
  taken up or ended (`RELIC_QUEST`, to tune: weeks of play between relics). She sends you for a relic you
  lack whose great boss gives it now (`RELIC_HOMES` `live`: the knuckle and the lodestone; the hook once the
  Instances chat wires the Haulier; the gall bomb, wind-up bow and bone whistle wait for their bosses). The
  relic won ends it (game.ts keepNoting). A level-12 hero from before is offered one at once.
  - Offered in the reliquary (my file): Father Odric says Isolde's been asking, HEAR ISOLDE OUT opens her
    words (where it was last seen and what holds it, per relic), I'LL GO or NOT NOW. Open, the reliquary
    says who sent you for what and where.
  - **For the Town quests chat** (your files, so I haven't touched them): when you can, (1) Isolde's quest mark
    while `questOffered(p, world.day)` is set, and her own talk offering it (the words are `RELICW.questWord`,
    `questHow`, `questGo`, `questLater`; `takeQuest` takes it up), and (2) the goal line while `p.rq.open`:
    pin A RELIC, the line `RELICW.saidToBe[p.rq.open]`, with the edge point at Corporal Brisk for Hangman's
    Wood and the Open Cut, the board for the barn. Then the Odric nudge in the reliquary can go.
  - **For the Instances chat:** with `giveHome('haulier', ...)` wired, set `live: true` on the hook's row in
    `shared/relichomes.ts` and Isolde starts sending heroes for it. tests/relicquests.test.ts. (Claude Opus 5.5)
- **Lines settled:** one lore-keeper call, one line-editor call, over every new line from slices 1 to 6
  (`relicwords.ts`, the deep dive's posting). Applied: "a boss", not "a great boss", on screen; Hempen is "it"
  and never "the Hempen Man"; "Lowfurrow Fields" in full on panels; the fanfare's line is the game's own plain
  narration (only the party stands at a dead boss); the Doorkeepers sit behind the barn's doors and the
  lodestone hangs from its crossbeam; the line editor's three spoken-line edits. THE RELIQUARY stays the name.
  - **The hook's home is the Open Cut's end boss**, not named on screen: docs/design/open-cut-map.md moves the
    hook from the Haulier to the Overman, docs/design/relics.md still says the Haulier. `relichomes.ts` keys
    it `opencut`; the lines say "the bottom of the Open Cut". **For the Instances chat:** call
    `giveHome('opencut', ...)` from whichever boss ends it, and set `live`. **For Kyle / the General chat:**
    relics.md's table should say Hempen (not the Hempen Man) and the Open Cut's end boss for the hook; and if
    Fenmere gets the net, the lore keeper wants it its own relic (an eel net of bone and lead), since the
    Ranger's skill is HUNTER'S NET.
  - **For the story bible** (the lore keeper's notes): relics are won, one of each, never rolled; the
    reliquary is the church's locked case by the step, in Odric's keeping; lost relics "came back to us";
    Isolde "has word" of relic quests and where from stays unsaid; the hook was the church's once; the
    lodestone is from before the war; the knuckle is grown into Hempen's fist (replaces bible line 275's hook);
    the Doorkeepers took the barn's doors off and carry them; the Roll names each relic's first winner.
- **Shots:** `scripts/relics-earned-look.cjs` (phone): the fanfare for Hempen's knuckle, first in Wickhold,
  and the pack's carry slot in town (no carry button; the note says the reliquary chooses). No page errors.
  The solo build not published (the Deep chat's). (Claude Opus 5.5)
- **GIVE IT UP gone (Kyle, 2026-11-15: "get rid of giving up relics").** The reliquary no longer offers to give
  a relic up for the church's light: the button, its confirm, the line above the cards and Odric's two lines
  are gone (`churchrelics.ts`, `relicwords.ts`). That also closes the "won twice" gap from slice 3: a relic
  won is yours for good. A light already burning still counts down and shows. Hungry items left on the step
  (Holy and hungry) are untouched. **For the Economy chat:** `leaveRelic`, `litFor` (and `forge`, `forgeOdds`)
  in your `shared/church.ts` are now unused by any screen; their tests still pass. (Claude Opus 5.5)
- **relics.md brought in line with the code (Kyle, 2026-11-16: "fix it"):** the table says Hempen, not the
  Hempen Man, and gives the hook to the Open Cut's end boss (the Overman, open-cut-map.md), not the Haulier; the
  same in the first-kill line, slice 3 and Coordination. Docs only. (Claude Opus 5.5)
