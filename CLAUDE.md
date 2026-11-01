# Relic: agent instructions

**Relic** (repo `SomewhatRogue/Relics`): a browser and phone co-op action RPG. A shared town hub,
5 to 10 minute dungeon raids, Warrior, Ranger, Healer and Mage, a goblin-war story told one
chapter at a time. Design: the kickoff doc https://claude.ai/artifact/F2Vno1DrcbxvSa3zSecmMS.
Built on Come Bye's Vercel relay (`SomewhatRogue/Comearound`), whose joining lessons are rules here.

This project is separate from Kyle's other games (The Old Gods, Eye in the Sky, Come Bye). Copy from
them; never edit them from here.

## The cycle

```
1. SYNC    read PLAN.md + docs/DECISIONS.md
2. SPEC    confirm the slice's "done when" in PLAN.md
3. BUILD   one vertical slice, playable end to end
4. VERIFY  npm test, npm run check, node scripts/look.cjs (phone + laptop screenshots), then LOOK
5. RECORD  update PLAN.md + docs/DECISIONS.md, signed with the model name
```

Kyle plays on his phone and laptop and reports; land the change rather than over-verifying it.

## The loop

- `npm test`: the fight rules in Node (parry, block, guard break, roll, slam, combo, counter,
  determinism) plus the relay, in seconds.
- `npm run check`: TypeScript.
- `npm run build && npx vite preview --port 4173` then `node scripts/look.cjs`: phone (390x844 at 3x,
  touch) and laptop screenshots into `shots/`, with the fight state and page errors printed.
- Test hooks: `window.render_game_to_text()`, `window.__GAME_STATE__()`, `window.__room`.

## Hard rules

- **The room decides everything** (`src/sim/`). Clients send an Intent (stick, aim, block held, and
  press counters so a tap is never lost). Drawing never changes the fight.
- **What is drawn and what is decided share one source.** Timings and sizes live in
  `src/shared/tuning.ts`, the room in `src/shared/arena.ts`. A telegraph you see is the one judged.
- **Never `Math.random` for outcomes.** Use the room's seeded `Rng`. Cosmetic effects may use it.
- **Every system is multiplayer from day one.** Solo is a party of one: the room runs in this
  browser now and will run in the party leader's browser online (Come Bye's host model).
- **Online rules from Come Bye** (`api/room.ts`, `api/_relay.ts`, copied with their tests): heartbeat
  every 4 s, sockets swapped every 4 minutes before Vercel's max duration, only the newest connection
  may say goodbye, tokens in localStorage, joiners never claim a room.
- **No external hosts at runtime.** Everything is bundled; online play talks only to `/api/room`.
- **No em dashes** anywhere: docs, UI copy, comments (Kyle's standing preference).
- **Every player-facing line goes through two passes**: the `lore-keeper` agent (is it true to the
  world) and then the `line-editor` agent (does it read like talk, not lines; see
  `docs/lore/prose-notes.md`). Don't write in a clipped, aphoristic, every-sentence-a-punchline way.

## The look (approved 2026-10-31)

Three-quarter view; pixel sprites (placeholders drawn in code in `src/client/sprites.ts`, to be
replaced by Blender renders); cool grey stone lit only by torches, braziers, moonlight and spells,
in stepped bands with a little ordered dither (`src/client/light.ts`, one WebGL2 pass); goblins in
sickly greens with glowing eyes; red floor telegraphs, striped edge for unblockable ones.

## Code conventions

- One job per file; aim for under 200 lines.
- `src/shared/` pure and isomorphic; `src/sim/` the fight; `src/client/` draws and sends intent.
- The scene is painted at low resolution and scaled by a whole number (`Scene.resize`).
- Two layers: `lit` (shaded by the lighting pass) and `glow` (drawn unlit on top). A sprite erases
  the glow under itself so telegraphs never show through bodies.
