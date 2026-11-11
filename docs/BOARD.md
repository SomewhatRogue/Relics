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
| Deep | The Deep (docs/design/the-deep.md) and boss loot rolls | `src/*/deep*.ts`, `src/shared/uniques.ts`, `src/sim/uniquedrop.ts`, `src/client/rollcard.ts`, `scripts/loot-online.cjs` | docs/decisions/deep.md | Steps 1 to 4 and the loot roll in; open: one-of-each not enforced |
| Instances | Instances (docs/design/instances.md): the frame, then Rakehead's Open Cut | `src/shared/instances.ts`, `instancetune.ts`, `cut*.ts`, `opencutwords.ts`, `src/sim/instanceroom.ts`, `checkpoint.ts`, `src/client/checknotes.ts`, `src/sim/drover.ts`, `tests/instances.test.ts` | docs/decisions/instances.md | Steps 1 and 2 in; step 3: THE DROVER's fight in, next THE BRAKESMAN |
| Trading | Trading and the item ledger (docs/design/trading.md): step 1 the ledger, step 2 boss drops minted through it | `api/ledger*`, `api/_ledger.ts`, `src/shared/ledger.ts`, `src/client/ledger*.ts`, `tests/ledger*.test.ts` | docs/decisions/trading.md | Steps 1 and 2 in (ledger, boss drops minted). Touched the Deep chat's `sim/uniquedrop.ts` once (stamps the id). Open for Deep: disconnect counts as PASS (lootroll.ts). Next: step 3, trading |
| General | Playtest fixes, tuning, specs (instances, trading, holy and hungry) | `docs/design/` except the-deep.md | docs/decisions/general.md | Specs written; no code claimed |

## Waiting (specs ready, no chat yet)

- **Holy and hungry** (docs/design/holy-and-hungry.md). Last: it changes loot everything above uses.

## Collisions to settle

- **Boss loot pools are in two places.** The Deep chat's `shared/uniques.ts` has a pool for the Haulier;
  docs/design/instances.md has Rakehead's pools (the Drover, the Brakesman, the Raker and the Sluicer, the
  Haulier). One source: `shared/uniques.ts`. Rakehead's pieces go in there when instances are built, and
  the Haulier's two lists are merged by whoever builds Rakehead.

## Finished

(none yet)
