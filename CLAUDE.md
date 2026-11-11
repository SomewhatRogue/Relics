# Relic: agent instructions

**Relic** (repo `SomewhatRogue/Relics`): a browser and phone co-op action RPG. A shared town hub,
dungeon raids, Warrior, Ranger, Rogue, Healer (Cleric) and Mage, a goblin-war story told a chapter at a
time. Design: the kickoff doc https://claude.ai/artifact/F2Vno1DrcbxvSa3zSecmMS. Built on Come Bye's
Vercel relay (`SomewhatRogue/Comearound`). Separate from Kyle's other games: copy from them, never edit
them from here.

## 1. Pick the path before doing anything (most important)

Kyle pays for every step. A week of budget went in two days because big helper agents ran 100+ steps
with 700k tokens of context (95% of spend; the main chat was about 2%). So before any tool call, say
which path this is, then take it:

| The ask | Path |
| --- | --- |
| A question, design talk, "what does X do" | Answer in the reply. Look things up with a few targeted reads, no agents. |
| A tweak: tuning, a word, a sound, a bug whose cause you can find fast | Do it in the main chat. Usually under 15 tool calls. |
| A medium change: one system, a handful of files, clear design | Main chat, in stages. Still no builder agent. |
| A big new system (a zone, a boss, a new mechanic) or an unclear one | Write a short spec first (docs/design/), get Kyle's yes if scope is unclear, then build in slices (below). |
| An investigation (lag, logs, "why does X happen") | Main chat first, targeted: logs, the one or two suspect files. An agent only if it truly needs dozens of reads. |

**When a builder agent is right**, keep it small and cheap:
- One narrow slice per agent, with the files named and "done when" stated. Aim for 30 to 40 steps.
- `model: "sonnet"` by default; Opus only for design or a hard bug.
- Never send more work to an agent that has run long; start a fresh one with a short brief.
- It runs only the tests for what it touched; no screenshots unless the slice is visual; no online
  scripts unless it's netcode. It reports in ten lines.
- At most two builders at once, never on overlapping files.

## 2. Checking and landing

- **Verify in this order, and stop when it's enough:** the touched test files, `npm run check` (tsc),
  the full suite once before pushing, screenshots only for visual changes, online scripts only for
  netcode.
- Kyle plays on his phone and laptop and reports: land the change rather than over-verify it.
- **Writing checks, batched:** all new player-facing lines from one change go to ONE `lore-keeper` call,
  then ONE `line-editor` call. Short labels that reuse approved words (a button, a stat name) can skip
  them. See `docs/lore/prose-notes.md`.
- **Record:** a few lines in `docs/DECISIONS.md` per change, signed with the model name. `PLAN.md` for
  slice status.
- Commit as `git -c user.name=SomewhatRogue -c user.email=minerley.kyle@gmail.com`; push `main` deploys
  to relic-lake.vercel.app. Don't stop for approval on each commit.

## 3. Session habits

- A new chat for each big new topic; a running chat for tweaks and playtest feedback.
- Connectors not in use (ElevenLabs, Gmail, Google Drive, Vercel) make every step heavier for every
  agent. Kyle can switch them off in coding sessions and on when needed.
- In a cloud container memory is tight: run heavy jobs (vite, vitest, browsers) one at a time, in the
  foreground. Kill processes by exact PID, never by pattern.

## The loop

- `npm test`: the fight rules and the relay in Node, in seconds. `npx vitest run tests/<file>` for one.
- `npm run check`: TypeScript.
- `npm run build && npx vite preview --port 4173` then `node scripts/look.cjs`: phone (390x844 at 3x,
  touch) and laptop screenshots into `shots/`, with the fight state and page errors printed.
- Solo build: `scripts/solo.sh <scratchpad>/relic-play.html`, then publish that file to
  https://claude.ai/artifact/AStuC1F92Q1JTRLhSPcJte (Kyle plays it there too).
- Test hooks: `window.render_game_to_text()`, `window.__GAME_STATE__()`, `window.__room`,
  `window.__game`, `window.__openSpot(id, 0)`.

## Hard rules

- **The room decides everything** (`src/sim/`). Clients send an Intent (stick, aim, block held, and
  press counters so a tap is never lost). Drawing never changes the fight.
- **What is drawn and what is decided share one source.** Timings and sizes live in
  `src/shared/tuning.ts` (and the files it re-exports), the room in `src/shared/arena.ts`.
- **Never `Math.random` for outcomes.** Use the room's seeded `Rng`. Cosmetic effects may use it.
- **Every system is multiplayer from day one.** Solo is a party of one; online, the room runs in the
  best-connected player's browser.
- **Online rules from Come Bye** (`api/room.ts`, `api/_relay.ts`): heartbeat every 4 s, sockets swapped
  every 4 minutes, only the newest connection may say goodbye, tokens in localStorage, joiners never
  claim a room.
- **No external hosts at runtime.** Everything is bundled; online play talks only to `/api/*`.
- **No em dashes** anywhere: docs, UI copy, comments.
- Player-facing text: short, plain, says what things do; Kyle's edits are guidance for the whole game.

## The look (approved 2026-10-31)

Three-quarter view; pixel sprites (placeholders in `src/client/sprites.ts`); cool grey stone lit only by
torches, braziers, moonlight and spells, in stepped bands with a little ordered dither
(`src/client/light.ts`); goblins in sickly greens with glowing eyes; red floor telegraphs, striped edge
for unblockable ones. A 2.5D three.js view shares the same art.

## Code conventions

- One job per file; aim for under 200 lines.
- `src/shared/` pure and isomorphic; `src/sim/` the fight; `src/client/` draws and sends intent.
- The scene is painted at low resolution and scaled by a whole number (`Scene.resize`).
- Two layers: `lit` (shaded by the lighting pass) and `glow` (drawn unlit on top). A sprite erases the
  glow under itself so telegraphs never show through bodies.
