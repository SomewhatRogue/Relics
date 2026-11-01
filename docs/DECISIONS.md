# DECISIONS

Newest first. Each entry says what was decided and why, signed with the model.

## 2026-10-31: slices 1 and 2, the training room (Claude Opus 5.5)

- **Kyle's calls carried in from the kickoff doc:** Relic; three-quarter view; click or tap to
  attack; one button to block (hold) or parry (tap on time); parries open a counter; dodge roll;
  big enemies telegraph on the floor, some unblockable; the lit pixel look from the style mock.
- **No Phaser for now.** The approved look is per-pixel stepped lighting with dither. A small custom
  renderer does it directly: paint the scene flat at low resolution with Canvas 2D, then one WebGL2
  pass lights it and lays the glowing layer on top. About 40 KB of script, nothing to fight. Phaser
  (or Tiled tooling) can come back when maps need it.
- **Timings (first pass, `src/shared/tuning.ts`):** parry window 0.18 s before the hit (re-presses
  within 0.35 s don't reopen it), counter window 1.1 s at 2.5x, roll 3 tiles in 0.32 s untouchable
  from 0.04 to 0.26 s, block chip 15% at 1.4 stamina per point, butcher cleave wind-up 1.0 s, slam
  1.3 s (unblockable, striped edge, "!" over his head). Each hero has a `lenience` for online ping.
- **Phones aim for you:** with no mouse, an attack or a block turns the hero to the nearest enemy
  in reach, so a parry faces the right way.
- **Relay copied from Come Bye** with its keys renamed (`rl:`); its 16 tests pass here. Not wired to
  the client until slice 3.
