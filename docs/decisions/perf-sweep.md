# Performance sweep: decisions

The spec is docs/design/perf-sweep.md. Branch `perf-sweep`. One entry a change, newest last.

## 2026-11-17: the analysis, and the proofs before any change (Claude Fable 5.2)

- Measured on `1dbfcd3`: the numbers are in the spec, section 8. The scripts are kept in `scripts/perf/`
  (`wire.ts`, `full.ts`, `simprof.ts`, `browser.cjs`, and `top.mjs` and `jsonly.mjs` to read a CPU profile).
- **Sim parity** (`tests/perfparity.sim.test.ts`, scenes in `tests/perfparity.scenes.ts`, record in
  `tests/perfparity.sim.golden.json`): thirteen seeded fights (eight kinds of place, a board job, a deep dive,
  the hill territory, a swarm of 60 on an expedition, 300 goblins on the big map), four bots that walk, swing,
  dodge, block, change weapon and use their skill by the tick; the whole room hashed every 25 ticks. Checked
  that it fails on a change of one hundredth of a tile in `SWEEP_STEP`.
- **Wire parity** (`tests/perfparity.wire.test.ts`, the old code kept in `tests/perfref/`): every message of
  the same fights against the code as it stood, text for text. Checked that it fails on a third decimal place.
- **`roomsend.ts`**: an ordinary room's message cut out of `CoopHost.frame` as it was, the same lines, so it
  can be measured and tested like `bigsend.ts`. `coop.ts` calls it. No change in what is sent.
- On a branch, not `main`: the second wire format cannot be tried on real phones from here, and `main` deploys.
- Not touched: `light.ts`, `smoothlight.ts`, `three/post.ts`, `three/figmat.ts`, `three/figs3d.ts` (the Graphics
  sweep chat's, edited the same day). What I found there is in the spec for that chat.
