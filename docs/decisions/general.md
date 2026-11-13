# Decisions: the general chat (playtest fixes, tuning, specs)

From 2026-11-11. Earlier decisions are in docs/DECISIONS.md (the archive). Newest at the bottom. Sign each
entry with the model name.

## 2026-11-11 (Claude Opus 5.5)

- Per-chat logs and docs/BOARD.md set up (Kyle: "a pub sub, like a bus"). This chat writes here only.
- Relics come only from great bosses' first kills, each hero once; every hero starts with the javelin;
  five uses each (docs/design/holy-and-hungry.md section 4).
- Trading spec with an item ledger against duplicates; hungry gear and relics can't be traded
  (docs/design/trading.md). Instance spec with Rakehead's bosses and pools (docs/design/instances.md).
- UI look picked: iron and ember, everywhere (Kyle: parchment "not on theme at all"). Style guide in
  docs/design/ui-look.md; waiting on the board for a UI chat. Art pass waits on the size pick. (Claude Opus 5.5)
- Body size picked: **1.5x** (Kyle: "PERFECT"). Props people stand by scale with them; the map, footprints and telegraphs don't. (Claude Opus 5.5)
- Art pass spec: bodies redrawn at 1.5x with whole pixels, props grow, buildings taller on the same footprint, telegraphs unchanged; bosses get shapes and moves (docs/design/art-pass.md). (Claude Opus 5.5)
- Camera stays as it is: 1.5x bodies at today's zoom (12 tiles across on a phone), no tilt (Kyle). (Claude Opus 5.5)
- The wood's block lesson: 3 blocks, not 5 (Healer 3, not 4) (Kyle: "just blocking 3 is absolutely fine"). A fresh hero gets no relics until the Stoker falls, checked in a fresh browser; Kyle's flood not reproduced yet. (Claude Opus 5.5)
- The wood's talk (Hew waking you, Orla on the road) and the first-blow calls are strips that stop nothing; a tap skips one; on a phone under the top bar. Only a lesson's own card, and the relic card, stop the world (Kyle: lines that stop you get in the way). (Claude Opus 5.5)
- Relic moments are cleared when you switch heroes: a brand-new Warrior was shown a LODESTONE in the wood, queued by the hero the game loaded behind the title. Root of the queueing itself not found (not reproduced in a clean browser). (Claude Opus 5.5)
- The wood teaches the Bitter: your first hit (Hew alive) stops the world on his card with one Bitter and the POTION button; drink it and he hands two more in passing. Only the Bitter drops or sells now: the Brandy is dormant, a saved one turns to Bitter, Gannet sells nothing (Kyle). Lines through the lore keeper and line editor; the bible notes Wickhold pays Hew in Bitter. (Claude Opus 5.5)
- Walking: Rangers just under Rogues (longbow 0.98, shortbow 1.04, crossbow 0.96); Mages slower (wand 0.79, staff 0.78, spellblade 0.8; 0.78 is as slow as a kit goes, the kegs are timed to it). The shortbow's dodge is SPRINT: each press runs you 1.55x for 1.6 s for 24 stamina, steered, no dodging through blows. Your own hound never puts up a PET prompt (it covered the view); USE still pets. From Kyle's friend's playtest. (Claude Opus 5.5)
- TRY THE <class> on a class's page (client/trial.ts): a scratch hero of that class in the Training Yard, never saved (store skips a trial save), with its starting skill, a javelin that never runs dry and three Bitters; a bar spawns goblins (3 at most) and a butcher (1 at most), CLEAR, DONE back to the class page. From Kyle's friend; Kyle set the caps. (Claude Opus 5.5)
- The trial starts in an empty yard with no relics, and empties the relic news on the way in. Any relic is announced at most once a session (game.ts unannounced), whatever keeps finding it new: Kyle's account still floods with them, root not found. (Claude Opus 5.5)
- The freed run for the way out on their own (2.8 a second, a goblin 3.1), round what's in the way: out in the open to where the party came in, and they count there; in a house to its door, to come out with the party. Goblins go for one nearer them than any hero (by 2 tiles), and their blows land on the freed; one within 1.6 tiles and the freed freeze, cowering, so a goblin on them gets them unless a hero steps in (Kyle: escorting was tedious). (Claude Opus 5.5)
- Nettle says nothing after each sale (the line got in the way of selling a pack's worth); the sale just goes through and his table refreshes. (Claude Opus 5.5)
- Town quests spec (docs/design/town-quests.md): first errands for a new hero (refill the relic, see your trainer) brought by a runner, quest marks only on people with something for you, the trainer's list by level and a quest when a new skill opens. Waiting on the board for its own chat. (Claude Opus 5.5)
- In the wood, any tap on the scene (or Enter) skips a line of the strip, not only a tap on the strip (Kyle: Orla's lines after the Stoker went too slowly). Town quests: the javelin reaches Wickhold partly broken and a Sister mends it (Kyle). (Claude Opus 5.5)
- Hero names are held on the server, one hero each (api/names.ts, api/_names.ts: relic:name:<NAME> SET NX; shared/names.ts; client/names.ts). The class page suggests a free name from a 72-name pool (shared/namepool.ts, the lore keeper's), NEW NAME rolls another free one, BEGIN claims it first (taken: 'Someone has that name. Try another.'), retiring gives it back, heroes made before take theirs on load where free; no server (the solo build) and any name goes (Kyle). Note for the Deep chat: d1697a6 made client/world.ts import sumpdraw.ts, which loads sprites.ts, so tests importing world.ts (raise, rats, recapboard, runux, wading) fail in Node with 'document is not defined'. (Claude Opus 5.5)
- A hero whose name another hero already holds (found on load) is flagged (Profile.rename) and asked for a new one when picked on the title: a free name suggested, NEW NAME, KEEP THIS NAME claims it (Kyle). (Claude Opus 5.5)
- Walking: Rogues and Rangers all 1.1; Warriors, Mages and Clerics all 0.8, every weapon (Kyle). Pickup ids now always run past any lying in the room (sim/pickups.ts pid), so a host who took over can't reuse one; the handover test compares rooms with sorted keys and without pickup ids (labels). (Claude Opus 5.5)
