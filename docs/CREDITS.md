# Credits

Everything Relic shows is bundled with it; nothing is fetched from another site at runtime.

## Fonts

Both are under the SIL Open Font License 1.1, which lets them be bundled, used and shipped with the
game (free or sold) as long as the licence goes with them and the fonts aren't sold on their own. The
licence texts sit next to the files in `src/client/fonts/`. Taken from the `@fontsource` packages on npm
(version 5.3.0, latin subset, woff2), not installed as dependencies.

| Face | Used for | By | Licence |
|---|---|---|---|
| **Jacquard 12** | titles and name plates (the display face) | The Soft Type Project Authors, https://github.com/scfried/soft-type-jacquard | OFL 1.1 (`fonts/OFL-jacquard-12.txt`) |
| **Tiny5** | everything else in the UI (the body face) | The Tiny5 Project Authors, https://github.com/Gissio/font_tiny5 | OFL 1.1 (`fonts/OFL-tiny5.txt`) |

Alagard (Hewett Tsoi), the research brief's first pick, isn't published on npm (the only registry
reachable from the build sessions), so it wasn't used. It could replace Jacquard 12 later once its
readme's terms are checked by hand.

The floating combat numbers keep Relic's own 3x5 pixel font (`src/client/pixfont.ts`).
