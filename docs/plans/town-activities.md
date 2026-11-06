# Town activities, the Night Watch, and herbs (plan, Kyle 2026-11-05)

Kyle: "I like everything except the wizard tower for now." All of these run in the player's own browser
(no relay traffic). A shared high-score board costs one write per finished game and one read when the
board is opened. Nothing sends every frame.

## How every mini-game sits in the shared town (Kyle 2026-11-05)

"All mini games will happen locally on their own computer, not in town too, but in town you can see their
character sitting and fishing or something, even if they're not moving beyond an idle animation, till
they rejoin the town and then it checks again."

- Starting one sends a single presence word to the town ("fishing at the millpond", "on the wall",
  "arm-wrestling at the Rat") and drops your live town traffic. Everyone else sees your hero parked at
  that spot doing an idle loop (rod out, bow on the parapet, elbow on the table).
- The game itself runs only in your browser. Nothing goes out until you finish, when you rejoin the town
  and it syncs once (your spot, any score for a board).
- So a player in a mini-game costs about two messages, however long they play.
- Fishing is just for fun: no pay, maybe a fish to show off.

## Approved, to build after the current slices

| Place | What | Ties back |
|---|---|---|
| Drowned Rat | Arm-wrestling: hold a bar in a sweet spot that drifts. Knife-throwing at the board (Rogues steadier) | Small coin bets, like the dice |
| Hunters' lodge | Archery range: moving and swinging targets, a high-score board. Bring pelts from jobs for coin. Name and train your hound | Pay, the hound |
| Smithy | Hammer timing at the forge: strike on the glow for a better roll when upgrading | Gear |
| Church | Light a candle for a name on Odric's tally. A proper small rite for giving up hungry gear | The red to gold dial (later) |
| Public works | Haul stone for Judd's crew | Coin, a town project nudged on |
| Market | One quick haggle with a stallholder to nudge a single price | Prices |
| Millpond or moat | Fishing | Relaxing; fits the Staithe later |
| Vell's tower | Nothing for now (Kyle) | |

## The Night Watch (its own feature; the reference is The Last Stand)

A skill-shooting game on Wickhold's walls, only at night. Not about saving the town: the watch below
deals with anything that reaches the wall. It's about how many you can drop in 3 minutes, and how cleanly.

- **Where and when.** At night, a watchman at the wall stair offers a shift. Three wall posts (the north
  gate, the west wall, the east tower), each a side-on view across the fields under moonlight. You run
  between posts along the wall walk (about 1.5 s), so you choose where to be as the goblins come.
- **The view.** Side-on, Last Stand style: the parapet at one edge, the field rolling away, goblins
  coming across it in silhouette with their eyes glowing. The moon goes behind cloud now and then; fog
  banks drift through.
- **The shooting.** Everyone gets the same watch bow or crossbow, so it's pure skill. Free aim: the mouse
  on a laptop; on a phone, drag anywhere to move the sight and lift to loose (or a fire button, to test).
  A short draw. Arrows drop a little over distance and stick where they hit.
- **Hit zones.** Head x2, body x1, legs slow them. Shots can miss between the legs or over a ducked head.
- **Goblins (bled in over the 3 minutes):**
  - plain ones: no helmet
  - helmeted: the first head hit knocks the helmet off, spinning, then the head counts
  - shield-bearers: the shield covers the body; shoot it to splinter it, or find the head over its rim
  - runners: fast and low
  - torch-bearers: hit the torch and it drops and burns them
  - archers: shoot back at the wall; a near miss shakes your aim for a moment
  - sappers with a ladder or ram: big points if dropped before the wall
- **At the wall.** A goblin that reaches the foot of the wall drops out of your line of sight, and the
  watch below finishes it ("the watch have it"). You lose its points and your streak. No town damage,
  and no fail state but the clock.
- **Scoring.** Points per kill, x2 for a headshot, a streak multiplier for hits in a row, and an accuracy
  bonus at the end. Results: kills, headshots, best streak, accuracy.
- **High scores.** Your own best, and a town board for tonight and for all time (one write per run).
- **Rewards.** A little pay by score, capped per night. Later, a nudge toward gold on the dial.
- **Cost.** It's local only. The one shared bit is the score board.
- **Build in slices:**
  1. one post, plain goblins and helmets, 3 minutes, score
  2. shields, runners, torches, archers, fog and moon
  3. three posts and the run between them
  4. the boards and pay

## Later: herbs and potions (plan only, not now)

Kyle: "collecting plants and herbs in the field eventually." Each biome grows its own plants:
- fen: bog myrtle and sundew
- wood: yarrow and wood sorrel
- mine spoil: copperwort
- churchyards: yew berries (poison)

Gather them on jobs, as a pick-up or by kneeling at a patch. At the infirmary, brew to a recipe:
- healing draughts
- warming (frost resist)
- wet-wick (storm resist)
- smoke-eyes (see through smoke)
- poisons for blades

Recipes are learned from townsfolk or found. A small mixing game, with the right order and heat, makes
a stronger brew. Ties in: the herbs and plants the biome plan adds, and the potion belt.
Lore keeper pass on every plant and potion name before any of it lands.
