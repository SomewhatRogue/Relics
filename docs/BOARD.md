# The board: who is working on what

Every chat reads this at the start of a session and before every push, and keeps its own row current.
It's the bus between chats (see CLAUDE.md section 2). Keep each row to a few lines; the detail lives in
each chat's own log under `docs/decisions/`.

## Rules

- **Your own log only.** Each chat writes its decisions to `docs/decisions/<topic>.md` and nowhere else.
  `docs/DECISIONS.md` is the archive up to 2026-11-11: read it, never add to it.
- **Read before you work:** this board, then whatever is new in the other logs since your last pull
  (`git log -p <last-seen>..origin/main -- docs/decisions docs/BOARD.md`).
- **Claim before you edit.** Files and folders a chat owns are listed in its row. Another chat doesn't edit
  them; if it must, it says so in its own log and asks Kyle. Shared files (tuning.ts, types.ts, game.ts,
  main.ts) take small, separate edits only, pulled just before.
- **Small pushes, often.** Pull, test what you touched, push. Rerun the full suite after merging another
  chat's work in.
- **One chat publishes the solo build**, named below. The others only push code.
- **Done means removed.** When a chat finishes, it moves its row to Finished with one line on where it ended.

## Solo build publisher

The Deep chat, until it finishes (then the general chat).

## Active

| Chat | Working on | Owns | Log | Status |
| --- | --- | --- | --- | --- |
| Instances | Instances (docs/design/instances.md): the frame, then Rakehead's Open Cut | `docs/design/open-cut-map.md`, `src/shared/instances.ts`, `instancetune.ts`, `cut*.ts` (with `cutmap.ts`), `stressmap.ts`, `src/sim/stretches.ts`, `src/sim/fork.ts`, `docs/design/open-cut-arc.md`, `src/client/gatedraw.ts`, `opencutwords.ts`, `src/sim/instanceroom.ts`, `checkpoint.ts`, `src/client/checknotes.ts`, `src/sim/drover.ts`, `brake.ts`, `pairfall.ts`, `src/client/brakedraw.ts`, `pairdraw.ts`, `tests/instances.test.ts`, `tests/stress.test.ts`, `tests/stretches.test.ts` | docs/decisions/instances.md | Steps 1 and 2 in; Rakehead's four mini-bosses in; now the Open Cut as one map (docs/design/open-cut-map.md): steps 0 and 1 in; the Open Cut in acts with a fork vote (docs/design/open-cut-arc.md step 1); next act 1's reckoning house |
| Deep | The Deep (docs/design/the-deep.md) and boss loot rolls | `src/*/deep*.ts`, `src/shared/uniques.ts`, `uniquenames.ts`, `haultune.ts`, `sumparena.ts`, `sealarena.ts`, `src/sim/uniquedrop.ts`, `lootroll.ts`, `haulier.ts`, `haulbook.ts`, `haulcarts.ts`, `src/client/rollcard.ts`, `uniquelook.ts`, `lootwords.ts`, `loot.css`, `haul*.ts`, `sumpdraw.ts`, `sealdraw.ts`, `fxhaul.ts`, `scripts/loot-online.cjs`, `deep-online.cjs`, `docs/design/boss-threat.md`, `src/shared/shown.ts` | docs/decisions/deep.md | The Deep's build order done (steps 1 to 6), boss floors and loot rolls in; the Deep's edge (quicker, harder goblins) in; boss-threat step 1 (×10 shown numbers) in, step 2 (bosses resist freeze and stuns) next; open: one-of-each not enforced, the loot rules against instances.md, Kyle's playtest
| Trading | Trading and the item ledger (docs/design/trading.md) | `api/ledger*`, `api/_ledger.ts`, `src/shared/ledger.ts`, `src/shared/trade.ts`, `src/client/ledger*.ts`, `src/client/trade*.ts`, `tests/ledger*.test.ts` | docs/decisions/trading.md | Steps 1, 2 and 3 in town in (ledger, boss drops minted, trading in Wickhold). Small edits in game.ts, main.ts, cluster.ts, save.ts. Open for Deep: disconnect counts as PASS (lootroll.ts). Next: trading in a party on a job |
| Art | The art pass (docs/design/art-pass.md): lineup page, then heroes, goblins, props, bosses at 1.5x | `src/client/lineup*.ts`, `scripts/lineup-look.cjs`, `heroscale.ts`, `sprites.ts`, `heroart.ts`, `herolooks*.ts`, `lookkit.ts`, `heropose.ts`, `idlepose.ts`, `idledraw*.ts`, `idlekit.ts`, `actors.ts`, `held.ts`, `heldkits.ts`, `herolife.ts`, `cloaklife.ts`, `herodial.ts`, `figure.ts`, `joints.ts`, `foes.ts`, `foepose.ts`, `foedraw.ts`, `foekits*.ts`, the `*draw.ts` files that draw bodies and props (not `deep*.ts`, not the Instances chat's `brakedraw.ts`, `pairdraw.ts`), `spidersprites.ts`, `meatysprites*.ts`, `houndbody.ts`, `bodysize.ts`, `three/goblins3d.ts`, `three/foepose3d.ts`, `three/cards3d.ts` | docs/decisions/art.md | Slices 1 (lineup page) and 2 (heroes at 1.5x, core) in; idle props next, then goblins. Small edits in main.ts (`?lineup`), scene.ts and unitframe.ts (no stretch for heroes, the HUD face), style.css and pack.css (hero picture sizes) |
| General | Playtest fixes, tuning, specs (instances, trading, holy and hungry) | `docs/design/` except the-deep.md | docs/decisions/general.md | Specs written; no code claimed |

## Waiting (specs ready, no chat yet)

- **UI look: iron and ember** (docs/design/ui-look.md). CSS and markup only; starts with the job board.
- **Holy and hungry** (docs/design/holy-and-hungry.md). Last: it changes loot everything above uses.

## Collisions to settle

- **Boss loot pools are in two places.** The Deep chat's `shared/uniques.ts` has a pool for the Haulier;
  docs/design/instances.md has Rakehead's pools (the Drover, the Brakesman, the Raker and the Sluicer, the
  Haulier). One source: `shared/uniques.ts`. Rakehead's pieces go in there when instances are built, and
  the Haulier's two lists are merged by whoever builds Rakehead.

## Finished

(none yet)
