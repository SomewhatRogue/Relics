# DECISIONS

Newest first. Each entry says what was decided and why, signed with the model.

## 2026-11-02: the 2.5D view (low-res 3D) on jobs, and options under a gear (Kyle; Claude Opus 5.5)

Kyle saw the 2.5D look test (low-res 3D that reads as pixel art) and wants that style. Step 1: a second
renderer for the same room, opt-in, on jobs only. Then: "can we have a button someone can get to from
options to toggle between?", the ? panel had "WAY too much info", and he calls the views FLAT and 2.5D.

- **Same room, second drawer.** `client/three/` (about 30 small files) draws the `ArenaRoom` the pixel
  scene draws, nothing else: no sim change, no relay or coop change. Telegraphs are shaped from the
  enemy's `attack` (circle, sector by `arc`, lane, an arrow's line), so the red you see is the one
  judged; the white edge is the same parry window the 2D scene uses (`parryWindow + lenience`).
  Positions ease between ticks with `room.prev` and `alpha`, as scene.ts does. Online guests draw the
  room they're sent; buildings are keyed by their place in the list, since a guest's blocks are new
  objects on every update.
- **The look** (copied from the look test, three.js r128 there, 0.160.0 bundled here, never a CDN):
  painted at a low resolution and scaled by a whole number with CSS `pixelated`; Lambert light banded
  into five steps with a 4x4 Bayer dither (the 2D pass's bands) and point lights falling off as the 2D
  pass's do (`post.ts` patches three's attenuation); a post pass outlines silhouettes one pixel dark from
  depth and lets glowing things (alpha below 1) bleed; 36 degree orthographic three-quarter camera
  following the hero, snapped to the pixel grid. Colours are hex as painted (colour management off).
- **What's reused rather than redrawn.** The floor and the back wall's face are the 2D painting itself
  (`paintMap`), laid on the ground and the wall, so floors, soil, marks, water and the way out match;
  blood decals are painted into that floor as they're spilled. The effects are Fx's own (sparks,
  rings, lightning, gore, words), each re-projected from where the room put it onto a low-res overlay
  canvas with the 3x5 pixel font, so every event the 2D view shows has a 3D place without new code.
- **Seeing your hero.** Heroes draw last, on their own layer: first as a dithered pale silhouette
  where something nearer hides them, then as themselves, so only hidden parts stay a silhouette. Behind
  a building its roof comes off and its walls drop low.
- **Lazy and live.** three.js and the view are a separate chunk loaded the first time 2.5D is wanted
  (the flat game's bundle grows about 2 KB). Switching is live mid-fight: only which canvas shows
  changes. `?look=3d` (or `2.5d`) starts in 2.5D; the switch is remembered in localStorage. Town and the
  wood stay flat for now, even with 2.5D on.
- **Quality knob** (`three/look.ts`): `?q=low|mid|high`, mid on touch devices, high otherwise. Pixel
  count (40k, 62k, 90k), point lights at once (4, 8, 12, a fixed pool so shaders never rebuild), the
  moon's shadow map (none, 1024, 2048). `?perf=1` shows draw ms, frame ms, size, draw calls.
- **Measured headless (software GL, SwiftShader; real GPUs will be far quicker).** Phone 390x844@3:
  flat 31 ms a frame; 2.5D low 36, mid 106, high 131. Laptop 1280x800@2: flat 17; 2.5D low 37, mid 87,
  high 132. The JavaScript side of a 2.5D frame is 3 to 5 ms; the rest is SwiftShader rasterising
  (shadows and lights dominate). The look test ran at 4.2 ms on Kyle's laptop; phones unknown, so the
  phone default is mid and low is there if it stutters.
- **Options under a gear.** The ? button and its long help panel are gone (removed cleanly; nothing
  read them). A pixel gear (inline SVG) in the corner row opens a small box: VIEW: FLAT / 2.5D, HEROES,
  SOUND, MUSIC, TIPS (moved out of the corner row, same ids and handlers). A tap outside closes it.
  Mouse aim in 2.5D divides the vertical by the floor's foreshortening (`heroScreen` gives a fourth
  number; the flat scene's is unchanged).
- New words (for the lore keeper and line editor): VIEW: FLAT, VIEW: 2.5D, "2.5D shows on jobs for
  now", SOUND, MUSIC.

## 2026-11-02: knacks per class, a free reset, a pick you can't miss (Kyle; Claude Opus 5.5)

Kyle: "Knacks is also sort of hard to see / tell that it's there. It's hard to know that I have a
choice currently." "We should let people reset their knacks whenever, for free." "Knacks should be
different per class. Movement speed, dodge distance, throwing dagger damage, or the window for a
'perfect' attack, etc."

- **Each class its own four chains of three** (`shared/chains.ts`, `shared/perks.ts`); the shared BODY
  and BREATH rows are gone (no one row fit every class). Ids carry the class's letter (w_, r_, g_, m_,
  h_). Warrior: GUARD (parry +0.04 s, block -25% breath, counter +25%), PLATE (+20 health, 8% less
  hurt, +6% speed), HEAVY BLOW (charge 15% faster, full charge +15%, knock +25%), SKILL (skill and
  relic 20% sooner, shield charge and war cry +20% further, +40% longer). Ranger: BOW (draw 15% faster,
  a shot loosed on the white flash +20%, the flash +0.15 s), JUMP (20% sooner, 20% further, +6%
  speed), SNARE (25% sooner, holds 25% longer, three down), HOUND (25% sooner, bite 7 to 9, one more
  bite). Rogue: DASH (20% less breath, 15% further, the last-moment window +0.08 s), BACKSTAB (behind
  from further round, backstab +15%, ambush +25%), KNIVES (6% quicker, held blow +20% at full: the
  thrown dagger, lunge or bolt, held 15% sooner), SHADOW (+6% speed, shadowstep and relic 20% sooner,
  seen creeping 20% later). Mage: BLINK (20% sooner, 20% further, image +1.5 s), CHANNEL (primed
  1.5x to 1.75x, 15 breath back a turn, two primed spells), SPELLS (charge 12% faster, bursts 20%
  wider, +6% damage), BREATH (breath back 25% faster, blink 20% less breath, casts 6% quicker).
  Healer: GUARD (parry +0.04 s, block -25% breath, counter window +0.6 s), MERCY (heals +12%, heal
  reach +20%, the blow before the healing blow heals for half), SMITE (charge 12% faster, smite stun
  +0.4 s, full charge +15%), SANCTUARY (sanctuary and relic 20% sooner, blessing +25%, blessed ground
  and ward +1.5 s). Modest by test: no whole tree moves a share past a third.
- **One source.** Every knack number is read through `sim/knacks.ts` (parry window, counter window,
  release window, dodge reach and breath, last-moment window, behind angle, creeping sight, snare,
  hound, shield charge, war cry, blessing, ward, heal reach and size, burst, smite stun) or the gear
  stats (`sim/gearstats.ts`, which now caches the knack sum). The telegraph's white parry flash
  (`client/scene.ts`) now uses the same `parryWindow` the room judges (it left out gear's PARRY
  before), and a bow's white at full draw (`client/actors.ts`) shows exactly the clean-release window.
  `tests/knackfx.test.ts` runs each of the 60 steps through what the room does and checks it moves.
- **Reset, free, any time out of a fight**: RESET on the knacks screen (with a confirm), wherever it
  was opened from, while in town (`Game.knacksOpen`: mode town; the job's end is shown in town). Every
  knack comes back as a pick. Because of that, picks are taken on the knacks screen itself too, not
  only at the trainer (the trainer's pick rows stay). On a job the screen is a look only and says to
  take it back in Wickhold.
- **A pick you can't miss.** A pulsing gold dot with the count on PACK (any element with
  `data-picks`, set by `client/knackcues.ts`, so it moves with the button) and on KNACKS in the pack;
  "A knack to pick." and a PICK A KNACK button at the job's end; LEVEL N: A KNACK TO PICK once at the
  hero's feet back in town (under them, so the town banner can't cover it); the town banner says
  (A KNACK TO PICK). With picks waiting, the knacks screen opens with the two offers at the top, in
  full, each with TAKE.
- **Old heroes** (`fitPerks`): each old knack lands on the class step that moves the same number
  (a Warrior's guard, ironhide, counter, tough, scarred, fleet, heft, heavy hands, relic-wise; a
  Ranger's steady hand, footwork, fleet; a Rogue's shadowed, quick hands, fleet, relic-wise; a Mage's
  focus or footwork, deep charge, potent, endurance; a Healer's guard, ironhide, devotion, mender,
  relic-wise); anything else, or a second old knack on one step, comes back as a pick; and taken plus
  waiting is never less than the levels gained.
- **New words for the lore keeper and line editor**: every chain and knack name and line in
  `shared/perks.ts` and `shared/chains.ts`; the screen's words in `client/treewords.ts`.

## 2026-11-02: chat, world and near in town, the party on a job (Kyle; Claude Opus 5.5)

Kyle: "in-game chat, local and world (world logs down below for when you're in the world area, local
is just near you), but it needs to work on mobile and desktop."

- **Where it's heard.** WORLD: everyone in Wickhold, in the log. NEAR: only those within 8 tiles in
  the same place (`NEAR` in `client/chat.ts`), as a bubble over the speaker and in the log tagged
  NEAR. On a job with friends: the party, bubbles and log, tagged PARTY. Alone on a job, in the wood
  or the yard, and offline (the one-file build): no chat, and no CHAT button.
- **Carried on what's open.** Town lines ride the town's peer room (WICKHOLD1, `townfolk.ts`; its
  `onWord` is wrapped, so parties still get their words). Every listener decides for itself whether a
  NEAR line is close enough, from where the town says the speaker stands. The party talks in a peer
  room of its own, the job's room code plus CH (`partyRoom`, `client/chatnet.ts`), so coop.ts and the
  job's socket are untouched. Payloads are `{k:'chat', c, n, t}` or a quick line as its number `q`;
  well under the relay's 64 KB MAX_MSG. The relay is unchanged.
- **Safety** (`shared/chatrules.ts`, `shared/chatfilter.ts`): 120 characters of plain text, control,
  zero-width and direction characters stripped; one line per 1.5 s and five per 15 s, held by the
  sender (it says "Slow down a moment.") and dropped by listeners past a slightly looser pace (lines
  bunch in transit); a short filter that stars slurs and the very worst words in their common
  spellings, and leaves Wickhold's own swearing alone (voice.md); MUTE by tapping a name in the log,
  per device, by player id (`relic.mute`). Everything heard is cleaned again on arrival and only ever
  set as textContent.
- **Laptop.** Enter opens a box at the bottom left over the log; Enter says it, Esc shuts, Tab
  switches WORLD and NEAR, 1 to 8 in an empty box say a quick line. The log shows its last six lines,
  fading after 14 s, and all of it while the box is open. CHAT in the corner does the same.
- **Phone.** CHAT sits just under the corner row. In town it opens a panel at the top: the box first
  (so the keyboard doesn't cover it), the quick lines, then the log. Shut, the town shows the last two
  lines faint under the banner; tap them to open the panel. On a job it opens a strip of the eight
  quick lines and TYPE, at the top, away from the thumbs. A dot on CHAT says something new was said.
- The hero stands still while the box or panel is open (`chat.typing` joins the `still` intent in
  main.ts); the world goes on. The quick strip doesn't stop you.
- **Bubbles** (`client/bubbles.ts`) are page elements just after the canvas, so the HUD, banner and
  buttons stay over them, and each one moves aside or under the speaker's feet rather than sit under
  the banner, the HUD or a button.
- LEAVE in the corner now sizes to its word (it spilled into SND on phones and laptops).
- Tests: `tests/chat.test.ts` (filter, pace, cleaning, escaping, the wire). `scripts/chat-online.cjs`
  (two browsers, port 8795): world line heard; typing w, a, s, d never moves the hero; NEAR not heard
  from 14 tiles and heard as a bubble from 2.5; the phone's panel sends; mute holds; on a job the
  phone's quick line and the laptop's number key and typed line reach the other, as bubbles.
- New words, for the lore keeper and line editor: CHAT, WORLD, NEAR, PARTY, SAY, TYPE, X; "Say
  something"; "Slow down a moment."; "... is muted on this device. Tap the name to hear them again.";
  "... can be heard again."; quick lines Help me up! Follow me. Wait. Ready. Thanks. Over here!
  Going in. Behind you!
- Not yet: a typed line isn't spoken aloud or blipped; no chat history across reloads; the filter
  doesn't catch letters spaced out with spaces.

## 2026-11-02: the pack as a paper doll, the vault, Tobin's stall, the forge reworked (Claude Opus 5.5)

Kyle: "redesign how you can access your pack", "spend money to make your pack bigger in town", "clear
what items are on what body part", "easily see and compare items, sort of Castle of the Winds or
Diablo", "a somewhat ruined bank in town", "the forge is for upgrading existing weapons or melting
things down", augments "unavailable or blocked out", "a generic merchant who you can sell things to
and buy things back from for a limited time".

- **The PACK** (`client/pack.ts`, `cells.ts`, `itemicons.ts`): your hero's sprite with a square on
  each part: RELIC and SKILL over HAND and BODY, two RINGs, the three-potion BELT under; the pack
  beside it, one piece a square, its tier's colour on the border, a small pixel picture for what it
  is (blade, bow, staff, mail, ring) drawn in code. Tap a piece (or point at it with a mouse) and its
  card sits beside the card of what you wear in that slot, then every number the room uses, now and
  with it, and the change in green or red. WEAR / DROP (on a job; in town nothing drops, the card
  says where to sell or store it). The SKILL square is shown, not changed. Dragging still works.
  With the pack open the hero stands still (the world doesn't); gear changes still go through as
  intents. Relics found but not carried: CARRY buttons on the RELIC square's card.
- **Pack size** (`shared/bags.ts`): 8 to start, then 12, 16, 20, 24 for 100, 250, 500, 900 gold,
  sold by Tobin. The room checks the hero's own `bagSize`: a full pack can't take loot or a piece
  taken off, and the loot card says "Your pack is full. Drop something to make room." Treasure at a
  job's end that won't fit still sells for 20 as before.
- **The vault** (Keeper Edda, the counting house, west of the square above the infirmary): roof
  fallen in at one end since the siege, the vault under the floor. 16 shelves, then 24, 32, 40 for
  150, 400, 800 gold. Per hero, in the save (and so in the recovery code's copy). Hungry gear can't
  go in (it can't be dropped either).
- **Tobin the pawnbroker** (the far stall on Market Row, always there; Dessa's stall still waits on the
  council): buys any packed piece for `sellValue` (hungry gear never), and holds it for you to buy
  back at what he paid until you come home from your next job (`runs` moves on), the newest eight.
  Halvard no longer buys gear.
- **The forge**: Halvard's anvil is a panel of your worn and packed gear; tap one for UPGRADE (the
  existing `UPGRADE` gold and steel, tier caps) or MELT DOWN (packed only, `STEEL` by tier). His rack
  of Fine gear stays behind a button. Hungry gear: neither. Ivo isn't setting elements for now (one
  greyed button a relic, a line from him); what's already set keeps working; carrying a relic,
  rerolls and frost flasks stay.
- **Old saves** (`fitStores` in `client/save.ts`): an 8-cell pack (what it always held), an empty
  vault, nothing pawned. More than 8 pieces would size the pack up to fit, as far as 24, and the rest
  goes in the vault, however full. Nothing is deleted.
- New words are all in `client/storewords.ts` for the lore keeper and line editor; Edda, Tobin and the
  counting house are new and want lore review.

## 2026-11-02: going indoors on your own (Kyle; Claude Opus 5.5)

Kyle, after a job with friends: going into a house dragged everyone in with you. Now each player is
in whichever room they walked into, the street or a house off it, and goes in and out on their own.

- **Who's where** (`src/client/jobrooms.ts`): on a job the leader's game keeps the street (the job's
  room) and every house anyone's been in. Each hero lives in exactly one of them and is carried
  through a door as it is (health, potions, cooldowns, its clock moved on by `rebase`); a goblin or
  crate held overhead is put down first. The leader's own going in and out is the same move, so the
  old kept-aside outside hero is gone on a job (town buildings still work the old way).
- **Every occupied room runs.** Each tick the leader's game runs the street (always: fires burn,
  dens breed) and every house with a player in it, then its own. Kills in any of them pay. Friends'
  intents go to the room they're in. Friendly fire, HELP UP and the arrival grace need no change:
  each room only has the heroes in it. The grace on a fresh house goes to whoever goes in first.
- **Friends' doors are the leader's to decide**, the way all of the fight is: a friend walking up
  into a door goes in, out the bottom of a house comes out (`Game.friendDoors`, `doorPushed` uses
  the leader's own reach). Phones walk up into doors on a job, as the leader does (there's no ENTER
  button out on a job), so no new intent was needed.
- **Followers:** the goblins after whoever went through follow them, as before. "Big ones can't"
  is now a rule, not luck: only plain goblins (not brutes) and spiders fit through a door
  (`followers.ts small`). Before, an unnamed butcher close behind you could have come in.
- **Ambush:** it was never about the whole party; it comes when someone freed is brought out of a
  door (sim/survivors.ts, the room's door Rng). It still does, per door and per player: whoever
  walks out brings the freed within reach of them, and the street's next tick may bring goblins.
- **The way on** (`together`) waits for everyone: a player indoors on their feet (not gone quiet,
  not down) holds the party. A friend down in a house is carried along, as one down in the street is.
- **Bandwidth** (`coop.ts`): friends are grouped by the room they're in; each room has its own
  encoder and its own "last whole copy", and each group is sent only its room (to `*` when everyone's
  in one room, else to each id). A friend going through a door has a different room number
  (`Game.keyOf`) and gets the whole of the new one. Events are kept per room.
- **Over the door:** the street's patch carries `dm`, who's in each house (name and class). Anyone
  outside sees each name just above that door in the class's colour, under the quest mark's diamond
  (`doormarks.ts`), the leader too (drawn from `Game.doorMarks`). Indoors, nothing extra.
- **Handing the job on:** the whole-job save is now the street plus every house anyone has been in
  (`houses: [blockIndex, saveRoom][]`), not the leader's current room (which, if the leader was
  indoors, used to hand on the house as if it were the street). A friend who takes over stays where
  their hero was, indoors or out; the old leader's hero is let go from whichever room it's in. I
  chose every visited house rather than only occupied ones so dead goblins stay dead after a
  takeover; houses are small.
- **Tests:** `tests/split.test.ts` (7). Stress scenarios 15 to 21 (`scripts/stress/split.cjs`): a
  friend in alone (the leader sees the name over that door, the goblins in there hurt the friend on
  both screens), the leader in alone (the friend keeps walking about outside), leader and friend in
  two houses with a third outside seeing both names, a small goblin follows and a butcher doesn't, a
  friend frees someone and brings them out (counted on both screens), the leader leaves while a
  friend is indoors (the friend takes over, still inside, walks out and finishes), and the way on
  waits for the friend indoors. They set out on a village street through a test hook
  (`window.__villageJob`). The stress, town-online and party-online scripts take a port from
  `STRESS_PORT` / `ONLINE_PORT` so parallel worktrees don't collide.

## 2026-11-02: the friend who froze when a Florida friend led (Claude Opus 5.5)

Kyle played with two friends in Florida. When he led, every job worked; when a Florida friend led,
Kyle loaded in and froze (LEAVE still worked), his hero stood still on the leader's screen, and the
other two played on. Twice. The relay logs and the meter lines say why:

- **Two instances had the same name.** The relay named each instance with `Math.random()`, and
  Vercel starts instances from a snapshot whose Math.random runs the same numbers: the meter line
  (one per instance every 5 minutes) for "evqgzyea" came at 20:45:03 and again at 20:45:49, two
  instances with one name (n0eunt05 too). The "sfo1"/"iad1" in the logs is where a request came in,
  not a separate machine. Kyle's socket landed on one "evqgzyea", the leader's and the other
  friend's on the other; each took the other's messages for its own echo and dropped them. Kyle
  never heard "hosted" or a single patch; the leader never heard Kyle (the still hero was his town
  figure, brought along when the job started). When Kyle led, the instances happened to differ.
  Joining before the leader's claim wasn't the cause: the stress scenario passes that way once the
  names differ.
- **Fix:** each instance is named by Redis `INCR rl:inst` (a crypto suffix on top; crypto and the
  clock if Redis is down), and a connection's nonce is the instance's name and a count, so nothing
  hangs on Math.random (`api/_relay.ts`).
- **The count that kept messages home is gone as a judge.** Publishing only while another instance
  listened leaned on PUBLISH's count; a count that left someone out would keep messages from a friend
  who only listens (only a probe every 2 s got through). Now instances say so themselves
  (`api/_presence.ts`): `here` on a room's channel when one gets its first player there (sending
  everything for half a second meanwhile), an answer to any newcomer, `here` again after 15 s of
  saying nothing else, and `away` when its last player goes. Messages go out while another instance
  was heard in the last 40 s. A count above one can still open a room, never close it. On one
  instance that's one `here` per room every 15 s, fewer commands than the old probe every 2 s.
- **Also:** the relay listens to a socket from its first moment (what a player said while it was
  still being set up was dropped); a room's set is only taken down if it's still that room's set;
  a friend who hasn't heard the leader in 5 s reconnects (`coop.ts`, REJOIN), so a socket stuck on a
  deaf instance gets another go before anyone takes the job on. Backends moved to `api/_backends.ts`.
- **Tests:** `tests/relaybus.test.ts` (instances with the same Math.random, a friend in before the
  claim; a count that leaves out the other instance; a lone room publishes nothing). Both fail on
  the old relay. Stress scenario 14 (`scripts/stress/order.cjs`): a friend's socket there before the
  leader's claim, on the other instance, a third player with the leader. `scripts/online-server.ts`
  now makes its two relays with the same seeded Math.random, as Vercel does, and takes `inst` and
  `hold` on a socket's URL (pick the instance, hold the connection back); scenario 14 froze exactly
  as Kyle did (`info nohost`, never `hosted`) before the fix.

## 2026-11-02: quest marks, so you can see what the job is (Kyle; Claude Opus 5.5)

Kyle, after playing with friends: on a mission it wasn't clear what the objective was, or which things
were objectives; smashing a larder was fun but nobody knew what a larder was. Now every thing the
room's goal is about has a small gold diamond bobbing over it, on the glow layer so it reads in the dark,
with a little gold light under it.

- **One list.** `src/sim/targets.ts` `targets(run, room, houses)` is the room's objective things right
  now: cages out here; the door of any house with someone caged or freed inside; where the freed are
  brought out (the way in, or a house's door from inside); a middle room's spider nests; and in the
  last room, by the job, the larder's racks, the dens, or the named butcher (hunts, the story, a deep
  dive). Chests and plain goblins never. The goal text counts racks, dens and the boss with the same
  helpers (`racksLeft`, `densLeft`, `bossOf`), so a mark never points at something that doesn't count.
- **The mark** (`src/client/questmarks.ts`): gold like the way on (`#ffd860`, dark edge), never the red
  of a telegraph; it goes the moment its thing is done. When none is on screen at all, a gold point
  at the screen's edge toward the nearest, sharing `edgeMark` with the marks for the freed left
  behind (`wayout.ts`). The cage's old yellow "!" is gone: the quest mark replaces it.
- **The banner says what it is**, in a few plain words: "Smash their food store, the larder (3 racks
  left)", "Burn out their huts, the dens (3 left)". New player-facing words: `LARDER_IS` and `DENS_ARE`
  in `sim/goal.ts`, waiting on the lore keeper and line editor.
- **Friends see the same marks.** A friend's game builds the list from what the leader already sends
  (the room, the run, the houses by door); nothing new on the wire.

## 2026-11-02: the party stress test, and what it broke (Kyle; Claude Opus 5.5)

Kyle played online with a friend and things came apart when he died: the relay logs show his page
stopped (hidden while he lay there), the friend asked to take the job on, the relay refused because
his page still pinged, and they ended up in two different jobs. `npm run test:stress`
(`scripts/stress-online.cjs`, helpers in `scripts/stress/`) now plays it out in real browsers against
the local relay (two instances, 120 ms of lag), fresh players each time: a friend leaving, the leader
leaving (with one friend and with two), the leader's page hidden 30 s, suspended outright, closed and
reloaded, a friend reloading and a friend gone over a minute, every way of falling in a party, and
leaving alone. A hidden page runs its timers once a second (as Chrome does); a suspended one runs
nothing till it thaws (timers, frames and the socket's news held, then all at once). It prints a JSON
report and fails on any failed step or page error. What it found, and the fixes:

- **A frozen leader came back to a second job.** A phone that suspends the leader's page outright: the
  friend takes the job on (right), but the leader's page, thawed, kept running its own copy. The relay
  had told it someone else hosts; only a page that had itself taken a job on listened. Now every
  leader does (`Game.stepDown`): told a friend leads, it closes its room and follows them.
- **A leader's reload left the friend stuck.** The reloaded page came back as a follower of nobody
  (its session says "I lead"), while the relay, seeing the same player, gave it the room; the friend's
  takeover was refused, it followed a leader running nothing, and the job was lost 35 s later. Now
  the leader keeps the whole-job save in the browser too (`session.ts keepJob`, every 2 s with the
  one sent to friends), and a reload leads again from it (`Game.resume`, `leadFrom`); if a friend
  already took over, the relay says so and it follows them.
- **Following a new leader read their changes without their room.** With three, the friend second in
  line could hear the new leader's patches before hearing they lead, then apply changes to an empty
  copy (one goblin of nineteen, then a crash). A follower now waits for a whole room after changing
  leader, and a new leader gets their own time before anyone thinks them gone too.
- **A leader who left stood in the way.** Taking a job on from a leader who pressed LEAVE kept their
  hero standing where it was for a minute, and the way on takes the whole party. Now their hero goes
  (`CoopGuest.left`). And a friend not heard from in 5 s (a closed tab, a locked phone) no longer
  holds up the way on (`CoopHost.away`); their hero still comes along to the next room, in case
  they're back.
- **A friend away over a minute came back to nothing.** The leader lets their hero go after a minute;
  back, the friend's page had no hero to draw and stopped with an error every frame. Now it keeps
  drawing its hero where it was and says hello every 2 s till the leader brings it back.

Fine as they were: a friend's LEAVE, the hidden leader's room running on (nobody takes over), the
closed tab taken on, a friend's reload, getting each other up (G, and HELP UP on a phone), getting
yourself up once, out, the way on without the down and out, everyone out, and LEAVE alone (half the
gold). No new player-facing words.

## 2026-11-01: three kits for every class, and the belt turns on a long press (Kyle; Opus 5.5)

Kyle: other weapon types for all the classes (fun without needing many upgrades), and a long press on
the potion button to switch between them. The Rogue and the Cleric had one kit each; now three, with
the class rules kept (a Rogue dashes and never blocks; a Cleric guards, never dodges, heals on a blow,
and carries the censer's coal whatever is in hand). Numbers in `shared/kits.ts`.

- **Rapier** (Rogue): three thrusts at 1.85 to 2 tiles (9, 9, 13), each finding one goblin; 0.8 head
  on and 1.8 from behind (daggers 0.5 and 2.5), so it's the honest one. Held (0.7 s): a 2.6 tile
  lunge, 16 to 36, through at most two in a line (`Swing.hits`). Dash a little shorter (3.8).
- **Hand crossbow** (Rogue): a knife (two stabs and a slash, 8, 8, 12; 0.55 head on, 2.2 behind). Held
  (0.45 s, walk at 0.8 while aiming): a light bolt, 12 to 22, that dazes a small goblin 0.6 s (never a
  butcher), so the knife goes in at full. Keeps the long dash.
- **Sword and censer** (Cleric): two cuts (11, 11), then the censer comes round in a 170 degree arc,
  heals the party 8 and sets goblins burning (`Swing.burn`). The best Cleric guard (12% through, 0.34 s
  parry, 165 degrees). Held (1.1 s): the censer whirled all round, 16 to 36, burning, healing 8 again.
- **Flail** (Cleric): two slow sweeps (200 and 220 degrees, 16 and 20) that come over a shield-bearer's
  board (`overShield`); the second heals 9. Held (1 s): brought down overhead and a smite cracks out
  up to 1.7 tiles ahead, 1.7 wide, 26 to 60, stuns a second. Kills burst, like the mace (`blunt`).
- **Getting them**: as before. `CLASS_KITS` feeds treasure and drops (`rollGear`), Halvard's and
  Dessa's stalls list every kit of your class, traits fit (`traitsFor`). The first kit stays the
  plain one in hand. To switch: the pack, as before, and tapping the hand now shows SWAP TO for each
  kit of your class you carry.
- **The belt turns** (`client/potionpress.ts`, `sim/pack.ts turnBelt`): a tap of the potion button
  (or Q) drinks as before, now on release; held 0.4 s it turns the belt instead (the next kind comes to
  the front, its name pops up, nothing drunk) and keeps turning every 0.45 s while held. Laptop: hold Q.
  It goes to the room as its own press counter (`Intent.beltSeq`, optional so an older guest still
  reads), so two turns in one tick both count and a guest's work the same.
- **Drawn** in `client/heldkits.ts`: a thin rapier with a gilt hilt; the knife in hand and the hand
  crossbow at the off hand, up to the eye on a hold; the sword with the censer at the off hand, the
  censer on its chain throwing coals when it's swung or whirled; the flail's head hanging at rest,
  spinning overhead with light gathering on a hold. Each has its own swing and hit sounds.

## 2026-11-01: the back of the pack: hexers and drummers, and a tougher mix for a bigger party (Kyle; Opus 5.5)

Kyle: enemies harder with more people, and variety (small ones, spears, big ones, ranged, casters,
buffers). Two new small goblins, each with one counter; numbers in `shared/backline.ts`.

- **The hexer** (`sim/backline.ts`): staff with a skull fetish, bone horns. Keeps 4 to 7 tiles off
  (runs when you close, comes in when you're far) and calls the ground up under you: a red circle with
  a striped edge (nothing blocks it) put down where you stood, 1.15 tiles across the radius, that
  bursts after 1.25 s for 16. The circle is the one judged (`attackCovers`), and it stays put. Counter:
  step out or roll; any blow on the hexer breaks the spell (it flinches like any small goblin); 20
  health. Goblins standing in the burst take 0.8 of it. A roll through it doesn't stagger the hexer
  (it's far off). The fetish glows green and lights the hexer through the wind-up; the staff rises.
- **The drummer**: a drum slung at the hip, a bone stick. Hangs about two tiles behind its pack and,
  while it stands and beats, every other goblin on its level within 4.5 tiles is roused: wind-ups at
  0.8 of the time, 1.2 times the pace, 1.2 times the damage (locked into the attack when the wind-up
  starts, so the telegraph never lies). It runs from anyone within 3.5 tiles and the drum stops while
  it runs; it pokes with the stick if cornered; 24 health. Dead, stunned, frozen or netted, the drum
  stops on the next tick (`rouse`, once a tick before anyone moves). You see a faint ring at its reach,
  a ripple out to it on every beat (0.5 s) and a pulse under every roused goblin; you hear the beat,
  louder the closer you are. Counter: kill it first, or rush it so it runs.
- **In jobs** (`shared/roster.ts`, on its own seeded stream so room layouts are unchanged): each small
  goblin with a blade rolls 2% + 4% a room in + 1.5% a point of ruin (+2.5% long job, +2.5% deep) to
  be one. At most 1 in a first room, 2 in the next two, 3 after; always two blades left, and a drummer
  only with three to drum for. Over 200 days of boards: a first room has one about one time in six on
  an easy short job, about half the time on the worst long ones; nearly every fourth or fifth room of
  a long job has one, often two or three. The wood is untouched.
- **A bigger party** (`toughen`, from `scaleFoes`): the count scaling stays. A pair gets no more
  hexers or drummers than the room had (copies of them come plain). Three or more: each plain extra
  goblin has 15% a player past two to come tougher (lunger 3, shield 2, brute 2, hexer 1, drummer 1 by
  weight), with at most one more of the back of the pack than the room had. Run rooms and door
  ambushes are seeded, so a party sees the same goblins.
- **Cost**: the circle telegraphs (slam too) are now drawn in row runs instead of pixel by pixel. A
  yard fight with two hexers and a drummer runs about half a millisecond a frame over the same fight
  with plain goblins on the phone profile (4.0 to 4.6 against 3.6 to 4.0 ms, noisy).
- No new player-facing lines; the kinds are never named on screen.

## 2026-11-01: the sprites posed in parts, and a charge that reads through the weapon (Claude Opus 5.5)

Kyle on the 2x figures: doughy and soft, and the idle bob jumped. He picked the middle way: the same 1x
sprites, posed part by part. And on holding attack: it stretched the character instead of focusing on
the weapon; a charge should draw in, a release knock back a little, and neither touch the face.

- **Cut, not redrawn** (`client/joints.ts`): each sprite's own canvas (same pixels, same one-pixel
  outline and shading) is split by region into the off arm, the legs (left and right), the body, the
  head and the weapon arm. Every pixel goes to one part, so a body at rest is exactly today's sprite
  (a test holds it); a body with nothing moved is still drawn whole, in one call.
- **Posed a whole pixel at a time** (`client/figure.ts`): lean moves the head and the body half as
  much; a crouch lowers the body onto the legs (rising, the legs grow a pixel at most); the weapon arm
  reaches along the blow (`reach`) and lifts (`raise`); the whole shifts for a lunge or a recoil;
  afterimages and flashes as before, flashes part by part. Weapons are drawn at the weapon hand.
- **Heroes, charge and release** (`client/heropose.ts`, `held.ts`): no lean, crouch or stretch while
  winding up or charging, so the head never moves. The weapon arm draws back and the weapon comes up;
  a blade at full shivers in the hand; the charge's motes gather at the hand. Casters: light draws in
  to the wand, staff or rod tip, faster and whiter as it fills, and the tapped spell's half-second cast
  raises the casting arm the same way. Release: the arm snaps through and the body is knocked back one
  or two pixels against the blow or shot; the sword's edge and the shield flash; casters flash at the
  tip. The Rogue's thrown dagger is drawn back over the shoulder and the arm snaps forward on the throw.
- **Goblins and the butcher** (`client/foepose.ts`): lunges reach with the arm instead of stretching;
  the butcher's cleaver goes up as it comes back for the cleave and over his head for the slam; the
  brute lifts its club.
- **No idle breathing.** Standing still is still; walking keeps its one-pixel bob.
- **Cost**: within noise of main (yard fight, three runs each: phone 5.1 against 4.9 ms a frame,
  laptop 4.2 against 4.2; town about the same).

## 2026-11-01: anticipation and payoff in the bodies (Claude Opus 5.5)

Kyle loved the world effects on big blows (the charged magic burst, the butcher's slam) and asked for
the same in the bodies: poses before a blow, a payoff when it lands, better reactions to hits. Drawing
only; the room is untouched and every pose is read from state it already has (act, actT, the swing's
windup/active/recover, the charge, hitstop, the knockback slide, hitAt).

- **Pose data, not pictures** (`client/motion.ts`): every number in one table, by phase (windup,
  charge, release, contact, recover, hit, stagger, land, stun, tumble). A pose is lean (the top of the
  body, in pixels), crouch (negative rises tall), stretch along a direction, a whole-body shift, a
  lift off the ground, a flash and its tint, and an afterimage. Today one sprite is bent by it
  (`draw.ts` `blitPose`: whole-pixel stretch with the feet fixed, the top third shifted by the lean and
  the middle by half); the jointed 2x sprites coming next can read the same pose per part.
- **Heroes** (`client/heropose.ts`): pulled back and dipped in a wind-up (a quick one gets its share);
  crouching deeper and leaning back as a heavy charges, a shiver at full; the release snaps out (a
  step in, stretched along the blow, an afterimage where the body was) and holds through the hitstop,
  where the swing's trail turns white across the whole arc the room judges; shots kick back instead
  (the staff's orb hardest). Hit: white through the hitstop, then a fading red, snapped along the
  push. Heavy armor that doesn't stagger still flashes and flinches (a drop in health says it landed).
  A squash on landing a roll, jump, dash or slam.
- **Goblins and the butcher** (`client/foepose.ts`): wind-ups rear back and coil, scaled to how long
  they are; the lunger coils low and shivers; the butcher rises tall hauling the cleaver back then
  coils before the chop, crouches before his leap, stretches in the air, lands flattened and rises
  again; the Stoker coils and paws before his run. Hit: a white flash and a snap back along the push;
  small goblins hit hard go head over heels once with a hop; the butcher staggers back on his heels;
  the stunned sway.
- **The view** jolts along a blow that hits you and nudges along your heavy as it connects
  (`camKick`, added to the shake in `scene.ts`).
- **Dust** (`client/dust.ts`): puffs at the feet when a roll ends, a heavy steps out of its charge, a
  body turns sharply at speed, a slide from a blow stops, the butcher pushes off, the Stoker sets off.
- **A fix found on the way:** goblins' hit flash, their health ring after a hit, the dummies' wobble
  and the parry glint compared the wall clock to room time, so they almost never showed. Drawing now
  has the room's time (`Ctx.t`) for anything the room stamped.
## 2026-11-01: the music, played on recorded instruments (Opus 5.5)

Kyle: "the music can be more high def and interesting ... almost biblical or epic, with more gentle
themes for dark woods or town." He chose real recorded instruments, a small bundled set, free licence,
and new pieces for each place.

- **The instruments** (`public/music/`, 86 mono MP3s, 2.2 MB, credits in `public/music/CREDITS.txt`):
  VSCO 2 Community Edition (CC0) for the string sections soft and strong, solo double bass, pizzicato,
  short bowed cellos, horn, tuba, harp, flute, timpani, bass drum, glockenspiel and gong; the
  Versilian Community Sample Library (CC0) for the pipe organ, tubular bells and frame drums; and the
  FluidR3 soundfont's Choir Aahs and Voice Oohs (Frank Wen, CC BY 3.0, via midi-js-soundfonts) for
  the choir, the one set that asks for credit. A few notes per instrument (every 5 to 7 semitones,
  pitch-shifted between); held sounds loop. `scripts/make-samples.py` remakes them all from the three
  libraries: trimmed, levelled to one loudness, swells evened out, loops crossfaded where the wave
  matches, a tail past each loop so a browser's MP3 delay can't click; `src/client/samplemap.ts` is
  its output. MP3 because every browser decodes it (Safari and Playwright's Chromium included).
- **Playing them** (`sampler.ts`, `orchestra.ts`): fetched from our own site once sound is unlocked,
  four at a time, the most used first; nearest note, playbackRate, attack and release. An instrument
  plays recorded only when all its notes have loaded; until then (or if any fail) the old synthesized
  instrument stands in, so the music never goes silent. Strings switch to the strong recording at
  velocity 0.75 and up.
- **The pieces** (`score.ts`, `scores-home.ts`, `scores-wild.ts`, `scores-boss.ts`, played by
  `track.ts`): all 30 rewritten, keeping their names (the bard lists them). Each has a written
  8-bar theme over chords that mostly hold two bars, and parts with roles (bass, chord voiced to move
  smoothly, a picked pattern, the theme, an answer or a made-up line, drums, bells). A form of
  sections (opening, theme, theme in other voices, answer, quiet) loops with seeded chance: sections
  swap, long notes get a turn, timing breathes. Town warm (harp, strings, flute), houses small (harp,
  pizzicato, flute), church organ and voices, yard horn and frame drum, villages and farms sad, fields
  and woods a low string drone and one lonely voice, mines tuba, voices and dripping glockenspiel;
  bosses choir, horn and tuba, timpani and driving cellos.
- **The fight layer** is timpani on the strong beats, a bass drum on the one and cellos driving
  eighths on the chord; it comes in lower (0.35) over pieces that have their own timpani. The boss
  sting is a bass drum, timpani, gong, low horn and tuba. A gentle compressor (with its makeup gain
  taken back off) keeps a boss from clipping; overall loudness matches the old music, a boss about
  4 dB above town.
- **The one-file build** carries the recordings inside the page (`samplesrc.solo.ts` swapped in by
  `vite.solo.config.ts`; the page is 3.3 MB of the 16 MB cap), so it sounds the same with no server.
- **Listening**: `node scripts/listen.cjs <dir>` renders a few pieces offline in Chromium to MP3 and
  prints their loudness (`window.__renderMusic`, loaded only when called).

## 2026-11-01: recovery codes (Claude Opus 5.5)

Kyle: friends he sends the link to (no accounts, no login) should be able to get their heroes back on
another device with a short code they can remember.

- **The code** (`shared/recovery.ts`): two words and a number, KILN FERN 47. The first word from 128
  made things and places, the second from 128 things that grow, live or blow through the valley; the
  number 10 to 99 (about 1.5 million codes). Every word is two letters or more from every other (a test
  holds it), so a one-letter slip is read as the word meant and is never someone else's code. Typed in
  any case, with spaces, dashes or nothing between.
- **The keeper** (`api/save.ts`, `api/_save.ts`): one Redis hash per code, `relic:save:<code>` (save,
  token, time), one Lua command per make, pull or push, a year's keeping refreshed on each. Making
  takes an unused code (only if it doesn't exist) and gives back a random token; pushing needs the
  token, and is refused (409) if another device pushed since the copy this one last saw, so a page left
  open elsewhere can't write over newer play. Pulling gives the token too, so the new device can push.
  Over 256 KB is refused. A code gone missing (a year unused, or the store emptied) is made again by
  the next device that pushes it. No rate limit yet.
- **This browser** (`client/recovery.ts`): the code, token, last-seen server time and an unsent flag in
  localStorage. Every `store()` now stamps `savedAt` (it only goes forward) and tells recovery, which
  pushes 20 s after the last change (at most 2 minutes after the first) and at once on pagehide or
  hidden (keepalive). On start it pulls: if another device pushed since, that copy replaces this one,
  but only while the start screen is up; if both changed, the newer `savedAt` wins.
- **The way in** (`client/recoveryui.ts`): RECOVERY CODE on the start screen (heroes and class pick).
  It shows your code (made the first time, once you have a hero) and USE A CODE, which says how many
  heroes the code holds, by name, and asks before they replace this device's. Lines in `copy.ts`
  (RECOVER), waiting on the lore keeper and line editor.
- **Where it's on:** everywhere but the one-file build, which has no server: `vite.solo.config.ts`
  defines `VITE_SOLO` and the panel compiles out. Not tied to `VITE_ONLINE`, so recovery doesn't depend
  on co-op being switched on.

## 2026-11-01: the wood, slower and clearer (Claude Opus 5.5)

Kyle, after playing: goblins didn't always come at you; Hew's words were hard to read under threat. He
asked for a pause with praise when you do it right, the control shown for your device, slower and more
readable blows (even a freeze on the flash), and an opening where you lie still while the screen fades in
and Hew walks over, checks you and pulls you up.

- **The opening** (`WAKE` in `sim/wood.ts`): you lie still (no input) as the screen fades up over 2.5 s;
  Hew walks over slowly, says three lines, hauls you up at 11 s. Then a MOVE card; walking a few steps
  starts the first lesson.
- **Holds** (`WoodState.hold`, applied by `Game.holding`): the world stops for a lesson card (Hew's
  line, the move, its control for this device, what it's for; GOT IT, Enter or any action key), for a
  freeze-frame on the first two blows of each lesson just before they land ("NOW: ROLL OUT", "IT FLASHES
  WHITE: NOW", the key; it waits for that move, which then goes through as the world restarts), and for
  about a second of praise when you get it right (first three per lesson). On a phone the button to
  press pulses.
- **Pacing:** every goblin in the wood but the Stoker is drilled: wind-ups half again as long, and only
  the nearest one comes at you (the rest hang back); the one coming is kept coming.
- Laptops: a parry needs you facing the blow, so aim at the goblin with the mouse (phones turn you).

## 2026-11-01: the prologue, the wood in Greyhollow (Claude Opus 5.5)

Kyle: a tutorial before town; woken and saved by an old man after a battle, taught attack, then dodge,
then block, then parry in different areas with different goblins; he's killed in a cutscene by a mini
boss you then kill for your first relic. Plan: the Claude Doc "Relic: The Prologue"; story and lines
from the lore keeper (Hew, the Greyhollow column, the Stoker, the tally stick).

- **The wood** (`shared/wood.ts`): one hand-laid 64 by 40 map, five areas walled by trees, joined by
  ways a fallen log closes until the lesson before it is done; then the road west to Wickhold.
- **The running order** (`sim/wood.ts`, stepped after the room by the game): each area's goblins come
  out when you walk in, its count (dodges, blocks, parries) and its goblins gate the way on, Hew walks
  ahead and says his line, falls are picked up (Hew hauls you up; at the Stoker the fight restarts),
  goblins killed before the lesson took come again.
- **Locked moves:** the game passes only what's been taught (attack; then roll; then block; then
  everything but the skill; the skill at the hut). Phone buttons appear as they're taught.
- **New goblins** (`VARIANTS` in tuning.ts): looters (weak, slow, look up only when you're close),
  lungers (a striped stab from three tiles), the heavy (a blow that breaks any guard: parry it) and
  the Stoker (rake sweep, kiln drop, and the draw: a striped line; caught, you're hauled to its feet).
- **The cutscene:** about ten seconds, bars, input off, the camera eased between you and it; Hew is
  hooked, dragged, gives you the stick and dies behind the cordwood. Skippable once seen.
- **Leaving:** the javelin (first relic; deep jobs now give the hook first), Hew's tally stick for Odric,
  and for a Healer a cold censer (no heals given) until Mother Isolde relights it. Orla greets you at
  the gate. Heroes made before today skip it; a second hero can BEGIN IN WICKHOLD; WOOD on the start
  screen replays it with no rewards. Test links (`?hero=`) skip it unless `&wood=1`.

## 2026-11-01: loot slice 6, hungry gear and the Want (Claude Opus 5.5)

- **Ten hungry pieces** (`shared/hungry.ts`, wired in `sim/hungry.ts`), names and costs from the lore
  keeper: Skarn's Cleaver, the Larder Pike, Spendthrift, Mother Rust's Needles, the Jealous Rod, the
  Keeping Mace, the Butcher's Apron, the Ransom Coat, Someone's Wedding Ring, the Tooth Ring. Each has
  three very large modifiers, a gift and a cost, both shown on the card (green and red). Named butchers
  favour their own piece (Skarn, Mother Rust); no other source drops those two.
- **Where they come from:** 5% of a named butcher's drops and 3% of chest rolls (before danger shifts).
- **Rules:** can't be dropped, melted, traded or upgraded; Someone's Wedding Ring can't come off; all of
  it can only be left on the church step (Odric: "Leave it on the step. I'll see to it.").
- **Gold in a fight:** heroes carry a purse (home gold plus the job's) so Spendthrift and the Ransom
  Coat can spend it; spending takes from the job's gold first.
- **The Want** (`Profile.want`, hidden): +5 per hungry piece worn at a job's end (+15 for the Wedding
  Ring), +0.2 a kill made in hungry gear; -0.1 per gold given at the Lantern, -30 per piece given up.
  It shows sideways: from 15 the hero's eyes glint red in the dark, brighter as it grows; from 30 Agne
  remarks and Gannet pours short. Nobody turns yet; the threshold and turning are for Kyle to decide.

## 2026-11-01: loot slice 5, upgrades (Claude Opus 5.5)

- **Halvard's anvil** (THE ANVIL in his panel): melt packed gear for steel (white 1, green 3, blue 8,
  purple 20; never hungry) and raise a piece a level for gold and steel (+1 30 and 2, +2 60 and 5, +3
  120 and 10, +4 200 and 20, +5 320 and 35), capped by tier (white +2 to purple +5). A level grows its
  modifiers by a sixth and adds 3% weapon damage, 1% less taken on armor, or 2 health on a ring.
- **Ivo** rerolls one modifier on a worn green, blue or purple piece for 40 gold, into another the
  slot can roll, at the same tier.
- Upgrading replaces the piece wherever it is (profile and hero), so the stats cache stays true.

## 2026-11-01: loot slice 3, chests (Claude Opus 5.5)

- **Chests** (`sim/chests.ts`, placed by `planRoom`): 40% of rooms have one, the last room always, and a
  deep job's last room adds a chained chest by the named butcher that opens only once it's dead.
- **Opening:** USE beside it (F on a laptop; a small OPEN button on a phone, out of the way of the fight
  buttons). It takes 1.2 s; walk off, get hurt or go down and it shuts again. Every player in the room
  is rolled for at the start, so the seam light is the true colour of the opener's best piece. Hungry
  light pulses, a heartbeat plays, and goblins within 6 tiles notice.
- **What's inside:** one or two pieces per player (two in a chained chest, one tier up), weapons,
  armor or rings by chest odds, shifted a tier up in places of ruin 3 and on deep jobs; sometimes gold
  and a potion for anyone. Each player's pieces are theirs alone: only they see them, only they can
  take them (`Drop.owner`).

## 2026-11-01: loot slices 2 and 4, tiers, modifiers, armor, rings, the item card (Claude Opus 5.5)

- **Item** (`shared/loot.ts`) gains slot (weapon, armor, ring), tier (plain, fine, forged, tolmouth,
  hungry), modifiers and a level. `shared/gear.ts` has the tiers, the 14 modifiers with their bands,
  rolling by tier, tier odds by source, caps, armor weights and `gearStats`, the one sum the room and
  the card both read (`sim/gearstats.ts` caches it per hero).
- **Where modifiers act:** swing damage, wind-up and recovery, reach and knock (`currentSwing`); time to
  full charge; parry window; chip and breath through a block; damage taken; walking speed; dodge
  cooldown, distance and cost; skill and relic recharge; breath recovery; healing given; health.
  BREATH speeds recovery only (maximum breath stays 100, which half the game assumes).
- **Armor:** light (as before), medium (5% slower, 12% less taken), heavy (12% slower, 25% less taken,
  a 25% shorter dodge costing 30% more breath, no stagger from small goblins). Warriors start in
  plain plate, Healers in a mail shirt, the rest in leathers. Two rings; a third pushes out the older.
- **Drops:** goblins drop by tier (small: white or green; butchers green up, sometimes armor or a ring;
  named blue up). Weapons are any type of the nearest player's class. Halvard sells Fine weapons and
  armor; Dessa Forged weapons and rings (her line no longer says Tolmouth).
- **The card** (`client/card.ts`): tier chip, name, how a different weapon type fights, modifiers and
  traits in words, then every number that would change against what you wear, better or worse. The
  pack shows worn gear, spares with their comparisons, and AS YOU STAND, the hero sheet.
- Old saves: weapons with a trait become Tolmouth; heroes get their class's plain armor.

## 2026-11-01: loot slice 1, gold and potions (Claude Opus 5.5)

Kyle said continue on the loot plan. Defaults taken for the open questions (Kyle can overrule): the old
"no stat sheets" rule goes; any class wears any armor; the Want is built hidden and nobody turns yet;
Dessa keeps her line until the Tolmouth tier lands; a lost job keeps half its gold.

- **Gold on the floor** (`sim/pickups.ts`, `COINS` in `shared/potions.ts`): job goblins drop coins
  (small 70%, 2 to 6; archers 3 to 8; butchers always 15 to 30; named 60 to 100). Walking over it
  splits it evenly across the party, the picker keeping the odd coin. Gold no longer comes straight
  from kills; experience still does. Training-yard goblins drop nothing.
- **Potions** (`sim/flasks.ts`): a belt of three, Q or the POTION button uses the front one, a press in
  the 0.8 s cooldown waits. Sister's Bitter (40 health over 2 s), Wall Brandy (full breath, faster
  for 6 s), Lamp Oil (thrown, fire burst), Frost Flask (thrown, frost burst), Smoke (thrown; goblins
  can't see anyone in it unless within 1.2 tiles). Flasks fly where you aim, or to the nearest goblin
  in range on a phone. Goblins drop them (8% to 35%, named always); Agne sells Bitter, Gannet Brandy and
  Oil, Moll Smoke, Ivo Frost. New heroes start with one Bitter. The pack reorders and pours out.

## 2026-11-01: weapons rarer now; the loot and gear plan (Claude Opus 5.5)

Kyle: weapon drops too high; gold (shared in a party), potions, chests that open with a pause and a
colour by tier; white to purple tiers with modifiers on base stats; armor and rings; upgrades; a way
to see how gear changes attacks and stats; top-tier gear with real drawbacks, "since it's greed".

- **Landed now:** a small goblin drops a weapon 4% of the time (was 35%), a butcher 40% (was always).
- **The plan** is the Claude Doc "Relic: Loot and Gear" (https://claude.ai/artifact/BSET3vmRQ6Dn2BJqr3dVdW):
  tiers Plain (white), Fine (green), Forged (blue), Tolmouth (purple), Hungry (goblin-eye red); weapon
  type = how you attack, modifiers = how well; 13 modifiers with bands by tier; light, medium and heavy
  armor; two rings; a three-potion belt; chests held open 1.2 s with tier light leaking out; Halvard
  levels with gold and steel; ten hungry items with gifts and drawbacks; the Want as a hidden number.
- **Names from the lore keeper:** Tolmouth (pre-war steel nobody makes now), Hungry (the town's word for
  goblins), steel (not "scrap", which clashes with scrappers), Sister's Bitter, Wall Brandy, Lamp Oil.
- **Overrules** the loot code's old "no stat sheets, at most two traits" rule once Kyle agrees (open
  question in the doc). Build order in the doc: gold and potions, weapon tiers and the item card, chests,
  armor and rings, upgrades, hungry gear and the Want.

## 2026-11-01: the Healer's coals (Claude Opus 5.5)

Kyle kept the censer's Lantern coal: "the more they collect the more they heal allies but the more
goblins might seek them out in battle."

- **Coals** (`src/sim/lantern.ts`, `LANTERN` in `shared/magic.ts`): every butcher that dies leaves a
  live coal on the floor for 25 s. A Healer who walks over it feeds the censer, up to 12, kept for
  life (saved on the hero). Nobody else can take one.
- **Each coal:** every heal the Healer gives (Sanctuary's ground, every third mace blow) is 8%
  stronger, nearly double at 12. Goblins judge the Healer 0.35 tiles nearer when picking whom to go
  for (4.2 at 12, so a full censer pulls them past a nearer friend) and notice them 0.25 tiles
  further off.
- **Seen and heard:** the coal on the floor pulses and sheds sparks; the censer's light grows with
  each one; "CENSER FED" and a warm two-note chime on pickup; COALS n / 12 in the pack; a line on
  the Healer's class page; Isolde and Odric each have a line for a Healer.
- **Words from the lore keeper:** "coal", not "ember" (EMBERFORGED is a fire trait already). Code
  says coal too.

## 2026-11-01: the pack, a shorter class pick, one weapon to start (Claude Opus 5.5)

Kyle: start with a weapon type and don't say what the smith has; an inventory for each hero, open any
time without pausing, to equip items and relics; too much text on the class pick (general info first,
tap in for stats); copy through the lore keeper, simpler UI.

- **The pack** (`src/sim/pack.ts`, `src/client/pack.ts`). Each hero has what's in hand, their skill,
  the relic carried, the relics they've won, and up to 8 spare weapons. PACK in the top bar, or I
  (Tab) on a laptop. The world doesn't pause. Changes go to the room as an intent (`gearSeq`,
  `gearOp`, `gearArg`) so a friend's pack works the same online. A change pressed mid-swing waits
  for free hands rather than being lost.
- **One weapon to start.** Every class starts with its first weapon type. Other types of your class
  come as loot (half of drops are the type in hand, half another of your class) or from Halvard, who
  now sells each type into your pack. Taking a drop puts it in the pack; nothing swaps on its own. The
  smith no longer changes kits. The plain starting weapon is always there to go back to.
- **The class pick:** five rows (face, class, one line). Tap one: a one-line pitch, five ratings out
  of five (POWER, GUARD, SPEED, RANGE, SUPPORT, hand-judged from tuning.ts and kept in
  `shared/classes.ts`), weapon, skill, what it can't do, name, begin.
- **Copy** rewritten with the lore keeper (`src/client/copy.ts` and `shared/classes.ts`): "deep job"
  everywhere players see it, never "deep dive"; stamina is "breath"; goblins aren't careless or
  brave, they're patient. Old saves: the weapon in hand stays, other weapons go in the pack.

## 2026-11-01: simpler classes; relics only from deep dives (Claude Opus 5.5)

Kyle: rewrite and simplify what each class has or doesn't; nobody starts with relics, they're found at
the end of deeper dungeon dives.

- **One sheet per class** (`src/shared/classes.ts`, shown on the start screen): weapon, guard, dodge,
  one skill, what only that class does, what it can't do. That file is the source for the copy.
- **One skill each, on the SKILL button (E):** Warrior War Cry, Ranger Hunter's Net, Rogue Shadowstep,
  Mage Lodestone, Healer **Sanctuary** (the blessed ground and the ward in one cast: ground at your
  feet or where you point, and a ward on whoever is most hurt). Two Healer buttons became one, which
  keeps the Healer good alone without a menu.
- **No relics to start.** The javelin and the grappling hook come out of the named butcher at the
  bottom of a **deep dive**: one job on the board each day, five rooms, ruin 3, a hunt, 180 gold. The
  first win gives the javelin, the next the hook; a new one is carried at once. Carry one at a time
  (RELIC button, R); change which at Ivo the relic-wright. Lore fit: the bible already says relics are
  pried out of butchers who ate slivers.
- **The relic wheel is gone** (hold-and-slide, 1 2 3). Two buttons, two keys, nothing to pick
  mid-fight.
- **Elements** fit to the skill or to a found relic; a Mage's spells take the element of what's
  readied. RELIC-WISE now speeds both.
- Old saves: heroes keep their class and level; their relic list starts empty (nothing was "found").

## 2026-11-01: bigger rooms, goblins at rest, archers that run, loot that does what it says (Claude Opus 5.5)

Kyle (after playing as a Mage): each area bigger before moving on; loot that didn't do what it said;
archers he couldn't hit that didn't run when he got close; starting rooms should be more small goblins
that don't all rush you until startled, and bigger ones deeper in.

- **Loot that does what it says.** The bug: a drop rolled for any kit of your class, and taking it
  quietly swapped the kit in your hand (the wand for the staff) for that room only; next room you were
  back on your own kit and the new weapon's trait sat on a kit you weren't using. Now drops and the
  smith's wares are always for the weapon in hand, and taking one never changes your kit (the smith
  does that). The loot card says so for anything else.
- **Shots fly over ledges.** Ledges were walls to anything without a level, including arrows, spells
  and javelins, so a shot from the ground at an archer up top stopped at the ledge's face. Only bodies
  (heroes, goblins, props) are stopped by ledges now.
- **Archers run** when you get close on their own level (up on the ledge too, along it), sidestepping
  as they go so they don't back into a corner, and keep their distance at 4.5 tiles.
- **Rooms are 28 by 24** (were 18 by 16), with more furniture to match. The camera follows.
- **Goblins at rest** (`ALERT`): run goblins start in bands around their fires, milling about. One
  notices you in front of it within 6.5 tiles (2.5 from behind), when a goblin near it is hit or
  killed, or when it's hurt; it cackles, a "!" goes up, and its band (within 5.5) wakes with it. The
  rest of the room keeps resting. Sneaking up from behind is now a real choice (and a Rogue's dream).
- **Who's where:** the first room of a job is only small goblins (5 or more, more where it's worse);
  butchers start in the second room where it's Occupied or worse, and the last room adds another.

## 2026-11-01: automated tests, the shared world and the Roll of the Brave, a living Wickhold (Claude Opus 5.5)

Kyle: automated tests running on this; small groups or individuals impact the world and see a
leaderboard of quests done and people saved; a story individuals shape through action and voting
that changes the world, the quests and the town around them; a town that feels alive (guards on
patrol, more areas, some locked for now, more objects); a trainer for each class somewhere you have
to find; gambling with the rogues at a tavern with a sewer nearby; more to do in the central area;
no fighting in town but movement abilities still work.

- **CI** (`.github/workflows/ci.yml`): every push and pull request runs the type check, every test
  (the relay against a real `redis-server`), the build, and `npm run smoke`: real Chromium on a
  phone-sized and a laptop-sized page makes a hero on the start screen, goes into the forge, takes a
  job and wins its first room, failing on any page error.
- **The shared world** (`api/world.ts`, `api/_world.ts`, `shared/worldsync.ts`, `client/worldlink.ts`).
  Everything a hero does to the world is one contribution (a finished run, a gift, a vote), applied
  in the browser at once and posted to `/api/world`, whose answer is the world you then see. One
  world per code: WICKHOLD is everyone's; a group can play in a world of its own by typing a code at
  the Roll of the Brave. Redis holds each world as one JSON value changed under WATCH (a clash
  retries) plus a sorted set per stat: about a dozen commands per finished run, nothing per tick.
  The server lets through only what a real run or gift could send (capped, never negative, names
  cleaned). Offline (no server yet, or the claude.ai page, which can't reach it) the world is the
  browser's and the Roll shows your own heroes. Shared code now imports with `.js` so the server can
  run it under Node as is.
- **The Roll of the Brave** (a stone in the square): jobs done, people saved, gold given, goblins
  killed, dens burned, the top ten each. Heroes carry their own counts (`Profile.stats`) and an id.
- **The council counts heroes.** Online it decides when four heroes have voted, by majority (a tie
  goes to the choice voted first); you can change your vote until it decides. Alone and offline your
  vote decides.
- **Town works** (`shared/works.ts`), filled by everyone: Man the Walls (400 gold: two more guards on
  patrol), Clear the Old Quarter (600 gold: the rubble in the east lane goes, the Old Quarter opens
  with its barred chapel and Old Merren), Drive Them from Below (six dens burned on jobs, all told:
  the sewer grate opens and sewer jobs go on the board).
- **Wickhold, bigger and alive** (62 by 40): Lantern Square (the job board, the works board, the Roll,
  the well, Rowan the bard, benches, a cart, lamp posts), the church and its graves, the town hall,
  the forge, the mage's tower, the barred keep, the barracks, the hunters' lodge and its archery butts,
  the infirmary, the Drowned Rat, Rescue Row, and the Old Quarter past the rubble. Guards walk rounds
  (`Npc.path`, a pure function of time, so every player sees them in the same place); barrels and
  crates in the streets. Barred doors (the keep, the chapel) and the rubble say what would open them.
- **A trainer per class**, each somewhere of their own: Master Cole in the barracks (Warrior),
  Huntress Maeve at the hunters' lodge (Ranger), Whisper at the back of the Drowned Rat (Rogue),
  Magister Vell in the tower (Mage), Mother Isolde in the church (Healer). Only yours trains you; the
  others tell you where yours is. Each teaches one perk of its class besides the shared ones: Ironhide
  (blocking costs a quarter less), Steady Hand (bows draw a sixth faster), Shadowed (backstabs half as
  hard again), Focus (the blink back a quarter sooner), Devotion (blessed ground wider, the ward
  stronger).
- **The Drowned Rat**: Barkeep Gannet (rumours), Dicer Moll (knucklebones: two dice each, high roll takes
  the pot, ties to the house unless you're a Rogue; seeded per hero), Whisper, a drunk, a card sharp.
  The sewer grate is out the back.
- **In the square**: the works board, the Roll, the well (5 gold: your next job starts blessed), the
  bard (ask for any of the thirty pieces; it plays while you're in the square).
- **No fighting in town**: blows, guard, relics and grabs are held still; rolls, dashes and blinks work
  (the ROLL button shows in town on phones).

## 2026-11-01: music for every place, kits that sound like themselves, goblin voices, a Healer good alone (Claude Opus 5.5)

Kyle: music specific to towns and each kind of area and terrain, a few versions of each; typical
sounds for all weapons, impacts, goblins. Then: the Healer gets an AOE bless that heals allies slowly
and hurts enemies, and a ward that stops damage on self or others and reflects magic and projectiles,
so the Healer is good even solo. Also: tips off unless switched on.

- **Music, made live** (`client/music.ts`, `scores.ts`, `instruments.ts`; no files, nothing to
  download). Ten kinds of place, three pieces each (30 in all): Wickhold, inside a house, the church,
  the yard, villages, farms, fields, forests, mines, and a boss. Each piece is a mode, a chord
  progression and its parts (a drone or organ bass, held strings or organ, a picked lute or harp
  pattern, a flute, bell or horn tune that wanders a little differently every time, frame drums),
  through a shared hall reverb (wetter in mines and the church). Moving between places crossfades;
  the town's piece turns with the day, a run's with its seed and room. Under everything a fight layer
  (low toms and a driving low ostinato) rises with how many goblins are coming for you and falls
  away when they're dead; a named boss brings its own music once it's close or hurt. A note button
  switches the music alone (remembered on the device); SND still silences everything.
- **Every kit sounds like itself** (`client/weaponsfx.ts`). Swing and hit events now carry what made
  them (`src`) and whether it landed on the butcher (`big`). Sword: a ringing slice; greatsword: a long
  low whoosh and a cleave; spear: a thrust and a pierce; daggers: a quick double hiss and a stab; mace:
  a whump and a bone crunch. Bows creak at full draw and twang on release (deeper on the longbow), the
  crossbow thwacks and clicks, wand, staff and rod crackle, hum and zap. Blocks clang on a shield, ring
  on a blade. Wood chops, buildings whoosh alight, crackle while they burn (louder the closer you are)
  and fall in with a rumble; doors creak.
- **Goblin voices** (`client/voices.ts`): a sawtooth through two vowel filters with a rasp. Scrappers
  gibber and cackle as they come (now and then, more with more of them), yelp when cut, shriek when
  they die, hiss before a stab; archers' bows creak as they draw; dens screech when one crawls out.
  The butcher grunts, roars into its cleave and slam, and groans as it falls. Each goblin's pitch comes
  from its id, so a crowd sounds like a crowd.
- **The Healer** (relics now blessed ground, ward, war horn; `sim/relics.ts`, `BLESSING` and `WARD`).
  Blessed ground: a 2.4-tile circle of light at your feet (or where you point on a laptop) for 6 s;
  allies in it mend 3 every half second and are blessed (hit harder, take less) while they stand in
  it; goblins in it take 4 every half second, and the relic's element if one is fitted. Ward: a shell
  on the most hurt ally in reach, yourself included (or the one you point at), for 5 s: it soaks up to
  50 damage of blows, and an archer's arrow bounces straight back for 1.5x its damage and stuns the
  archer. Goblin spells will bounce the same way when there are goblin casters. Solo, the Healer
  stands in her own light behind her own ward. (This settles the open solo-Healer question.)
- Tips are off unless TIPS in the corner is on. On phones the HUD is narrower so the five corner
  buttons fit beside it.

## 2026-11-01: heights and forks (Claude Opus 5.5)

Kyle: multiple heights and paths within missions that make heroes choose how to move together or
attack threats.

- **Two levels to start: the ground and up on a ledge** (`Ledge` in `shared/arena.ts`). A ledge is a
  rock shelf (mines, forests) or a timber wall walk (villages, farms) along the back of a room. From
  the ground its edge is a wall; from on top you can step off it (a drop: you land, no harm). A ramp
  overlaps its edge: inside the ramp you take the level of where you stand, so stairs are just a place
  the wall isn't. All of it is in `collide`, so heroes, goblins and the tests share one rule. Bodies
  carry `z` (0 or 1); a prop has none and stays on the ground.
- **What height changes:** a blade only reaches your own level (up top you're out of reach of the
  ground, and they of you); grabs too. Arrows, bolts, spells, javelins, hooks and nets reach up and
  down. Shots from up on a ledge hit 1.25x (`HEIGHT.shot`). A goblin knocked off a ledge fast (thrown,
  hooked, blasted) takes the fall: 12 damage and a stun; one that steps off just lands.
- **Archers** (`ARCHER`): a scrapper with a bow. It keeps its distance on the ground and holds its
  perch up high, draws on you for a full second with a thin sightline telegraph, and looses: block it,
  parry it (the archer is stunned where it stands), or roll. Goblins with blades go round by the ramp
  to reach you up high; archers don't come down.
- **Forks:** the middle room of a three-room job has two ways out instead of one: THE HIGH ROAD (the
  next room has a ledge with three archers on it and two fewer goblins below) or THE LOW ROAD (one
  more goblin below and someone caged to free, even in the last room). The run remembers the road
  (`Run.roads`), so the same job can play two ways.
- **The way on takes the whole party.** Every exit, and each road at a fork, opens only when every
  player in the room stands in it (`Game.together`); solo that's you. Online this is how the party
  chooses a road together: walk into it as a group. Splitting at a fork (the leader running both
  rooms) is possible with the multi-room host, and saved for later.
- Not yet: more than two levels, ledges out in the middle of a room (they draw against the back wall
  for now), rooftops you climb by ladder, a lever up top that opens a gate below. Recorded in the atlas.

## 2026-11-01: heroes for life, every building enterable, buildings that burn, Come Bye's online lessons (Claude Opus 5.5)

Kyle: pick your class at the start when you first load in, with its own level, and no changing it in
a game; every building enterable with things inside and people to talk to for upgrades; mission
buildings that can be burned out and destroyed, visibly, or entered. Then: this will be online and
offline; Come Bye's team wrote up joining and moving between servers; build towards it early without
paying much.

- **The start screen** (`client/title.ts`): your heroes, up to three, each with a name, a class for
  life, its own level, gold, perks, kit and fitted elements; play one, make one, retire one (asks
  twice). The world (town, chapter, votes) is shared by all of them. Saves are v2 (`relic.save.v2`:
  heroes, current, world); a v1 save's hero comes across as HERO, its class from its weapon.
- **No class, kit or element changes in play.** The CLASS, WEAPON and AUGMENT buttons and the C, Q, T
  keys are gone, and `Game.step` holds those press counters still in every mode. Kits change at the
  smith (within the class); the relic-wright fits fire, frost or storm to a relic for 45 gold (free to
  take out), kept on the hero. HEROES in the corner opens the start screen (not mid-job).
  `?hero=MAGE` skips the start screen for the scripts.
- **Every Wickhold building has a door and people** (`shared/interiors.ts`, `client/npcs.ts`). Walk up
  into the door (or ENTER on a phone); walk out the bottom to stand back at the door. The forge
  (Halvard the smith, Ivo the relic-wright), the church (Father Odric, Marta), the training hall
  (Master Cole, and Squire Pell who takes you to the yard), the infirmary (Sister Agne and up to three
  patients), a new town hall where the council table was (Reeve Hollis and two councillors), the
  granary (Farmer Jos) and every lit house on Rescue Row (a family of two, with rumours that hint at
  places and tactics). Old Wenna and Tam stand in the square; Dessa the trader at the market once the
  traders are in. A gold mark over anyone you can talk to, their name when you're close.
- **Buildings on a job** (`sim/buildings.ts`, tuning `BLAZE` and `WOOD` in `shared/props.ts`).
  Cottages and barns, fences and goblin dens are wood with health. Blows chip them (half damage),
  blasts knock at them; oil fire, fire blasts and burning goblins set them alight; fire burns them
  down in about six seconds, spreads to wood within a tile after 2.5 s, and catches goblins standing
  close. Burned down, a building is ash and stubs you walk over (it stops colliding). Drawn charred
  under half health, with flames, smoke and window glow while burning, embers after; a fire lights
  the street. Town buildings have no health and never burn.
- **Cottages and barns can be entered** on a job: turned over inside, one to four goblins, a cage
  with someone in it on rescue jobs (a third of cottages and half of barns otherwise), a butcher in
  some barns where it's bad. The inside stays as you left it for that room; a burning or burned
  building can't be entered.
- **A new job: Burn out the dens.** The last room holds three dens, each with an oil barrel by it;
  a standing den sends out a scrapper every 9 s (up to six goblins about). The room is done when the
  dens are ash.
- **Online, from Come Bye's write-up** (`docs/ONLINE.md` here, the full one in Comearound): copied
  their newer relay and its tests (publish through Redis only while another instance has players:
  about 100 hours of play a month on the free plan instead of 3; dead hosts can't hold a room; a
  Redis hiccup can't kill an instance). What it changes for us now: the room is plain data the leader
  can save every 2 s; the room outside a building keeps running while you're in (the leader will run
  every room someone is in, so a party can split); seats come back by hero name; the shared world is
  written per run, never per tick.

## 2026-11-01: the town and the loop, terrain, the story mission and the council (Claude Opus 5.5)

Kyle: get to work on the town and the gameplay loops; other terrain types and how maps and
scenarios are made; bigger story missions and decisions the group votes on that change the world
and the town.

- **The game starts in Wickhold** (`shared/town.ts`), built from the shared world's state: Lantern
  Square (the Last Lantern, the job board, the council table), the Church, the Forge, the Training
  Yard, Market Row, the Infirmary, Rescue Row (a lit house per two people brought home), the north
  gate. Walk up to a spot and USE it (E or F on a laptop; a USE button on a phone, where the combat
  buttons hide in town). The training room is now the Training Yard; walk out the bottom to leave.
- **Maps are data** (`shared/arena.ts`): size, blocks (buildings, rock walls, fences: footprints you
  walk behind), round things (pillars, trees, pines, rocks, hay, wells, supports, the Lantern),
  braziers, torches, the way out, and a theme (floor, back wall, ambient light, moonlight). One map
  is in use at a time (the room sets it), so collision never needs it passed around.
- **Run rooms are laid out from the job's seed** (`shared/terrain.ts`): village (cottages, a well),
  farm (barn, fences, hay), fields (standing wheat, hay), forest (trees, pines), mine (rock walls,
  pit props, oil, dark: heroes carry a lantern). Objective first, then buildings, round things,
  furniture, a goblin campfire, goblins in the top half; spawn, exit and the middle lane stay clear.
  Ruin and the room's place set the goblin count; a butcher joins at ruin 2.
- **Jobs** (`shared/jobs.ts`): three a day from seven places across four regions. Objectives:
  rescue (break the cages), hunt (a named butcher), larder (smash the racks). Twist: night. Three
  rooms; clear each to open the way out at the top; the last holds the job. Run goblins stay dead.
  Three downs and you're driven back with half the gold and nobody saved.
- **Progress** (`shared/progress.ts`, saved in this browser for now): gold and experience from kills
  (scrapper 4 and 10, butcher 30 and 60, a named one 80 and 150), 25 experience per person freed, 50
  and the job's pay for finishing. Levels at 100, 300, 600... (cap 10 in chapter 1); each level is a
  pick of one of two perks at the trainer (tough, endurance, relic sworn, footwork, guard, second
  wind). The smith sells a fine weapon (60), the trader a forged one (160, once the market opens).
  Gold given at the church feeds the Lantern (the Want comes later).
- **Chapter 1** (`shared/story.ts`): bring 6 people home and finish the story mission, Barrowby's
  Bell (four rooms at night, the Gnawer in the church, three cages). Then the council table opens:
  farm the north fields (jobs pay 25% more, a granary goes up) or take in the refugees (four more on
  Rescue Row, the trader opens). A council needs 4; in this solo demo you can decide alone. The vote
  is recorded with its voters and day; chapter 2 is written at the review.

## 2026-10-31 (late): props to smash, lift and throw (Claude Opus 5.5)

Kyle: pick up and throw barrels and tables (and broken pieces) if you're a big enough character,
like the knight or a barbarian; the rogue and ranger can't.

- **Props are bodies** (`shared/props.ts`, `sim/props.ts`): barrels (2.5), an oil barrel, crates (3)
  and a table (4) stand in the training room. Blows, shots, blasts, wall slams and flying goblins
  push and break them; they break into staves and planks (lighter pieces that fade after 25 s).
  Big ones come back after 20 s in the training room. Shots stop on them.
- **Only strong classes lift** (`STRONG`: the Warrior now; a Barbarian when the Warrior forks into
  Knight or Barbarian). GRAB takes a goblin first if one is earned, else the nearest prop. Overhead
  you walk at 70% (56% for a crate or table); ATTACK slams it down (28 to goblins within 1.3 tiles,
  it breaks); GRAB throws it at 14 tiles a second. A thrown prop hits like its weight (0.8 per tile
  a second times weight, up to 45) and breaks on any goblin it hits at speed.
- **The oil barrel** bursts into flame when broken: everything within 1.8 tiles burns.
- **Goblin grabs stay for every class** (they're earned by skill, not strength); lifting furniture is
  the strong classes' extra.

## 2026-10-31 (after midnight): grab, slam, throw, and deaths by the blow (Claude Opus 5.5)

Kyle: more dynamic hits and deaths: slam a goblin into the ground and pound its head off so it
bursts, or chop it off; pick a unit up and throw it at another.

- **Grab is earned** (`sim/grab.ts`): only a small goblin (weight 1 or less) you've stunned, netted,
  frozen, staggered or got behind, within 1.3 tiles. G on a laptop; on a phone a GRAB button shows up
  only when there's something to grab. Overhead you walk at 60%; ATTACK (now SLAM) drives it into the
  ground (30, crater, stunned 1.5 s, a kill pounds its head in); GRAB again (THROW) hurls it 16 tiles a
  second, airborne 0.35 s. It wriggles free after 3 s; being hit or rolling drops it.
- **Bodies hit bodies** (`sim/impacts.ts`): anything driving into another goblin at 6 tiles a second
  or more hurts both (1.5 per tile a second, up to 25) and passes momentum on by weight. Thrown,
  blasted, smitten or greatsworded goblins bowl their friends over; the butcher barely moves. Frozen
  ones shatter. Only a body actually closing on the other counts, so a pair never re-hits.
- **Deaths by the killing blow** (`kill(e, ev, how)`): blades take the head (it flies, eyes still
  lit, a fountain from the neck); maces, slams, blasts, smites, wall splats, body hits and any kill
  20 or more past the life left burst the body into pieces; fire leaves a charred body; ice
  shatters; thrusts and arrows drop them. Pieces fly with height and land as stains that stay.
- Headless and charred bodies stay until the respawn; burst and shattered ones leave only the floor.

## 2026-10-31 (midnight): loot that rewards execution (Claude Opus 5.5)

Kyle: weapons with modifiers so each fight drops loot and unlocks things as you progress, without
drowning in stats and meta-gaming; and more skill-based execution throughout.

- **A weapon is its kit plus at most two traits, in words.** Fine: one skill trait. Forged: a skill
  trait plus an element (named for it: EMBERFORGED GREATSWORD). One weapon per kit, so no inventory:
  stand on a drop, read the card, TAKE (F) swaps it in and leaves your old one on the floor.
- **Every trait pays off only on execution** (`shared/loot.ts`): RIPOSTE (counters x1.4 on top),
  TEMPO (dodge through a blow: next hit x2), BULWARK (a parry refills stamina), DEADEYE (a perfect
  release x1.6), CRUSHING (goblins you throw into walls take x3 slam), BRUTAL (held-fast goblins take
  x1.5 more), REAPER (a backstab or counter kill heals 10). Forged elements land only on charged
  hits (70%+), counters, full draws and crossbow bolts, never on taps.
- **Draws have a sweet spot for everyone:** release within 0.25 s of the white flash for a perfect
  shot; hold more than 0.8 s past it and the bow shakes and the shot drops to 75% (no pierce).
- **Drops:** scrappers 35% (20% forged), the butcher always (60% forged), rolled for the nearest
  player's class on a separate seeded stream (`lootRng`), fading after 45 s.
- **Progression stays sideways:** loot changes how a weapon plays, not a number that climbs. Vertical
  power comes from town (new kits, relics and augments unlocked at the smith and relic-wright; levels
  that open ability choices). No gear score.

## 2026-10-31 (late night): class kits by draw time, slower classes, class relics (Claude Opus 5.5)

Kyle after trying slice 2d: no three-shot pattern on the bow; the long pullback is great; different
bows with different draw times and damage; Mage spells the same way (a quick one, a long charge one);
every class too mobile, only the Rogue should be; keep the mage's teleport but trade it off; no blast
flask; the horn only as an ally buff for Warrior and Healer; Healer smites big, keeps the third-hit
heal, targets allies to heal and buff; different relics per class.

- **Ranged and spells are one shot per press** (`combo` of one) and a hold draws or casts; each kit
  has its own `draw` time. Longbow 1.4 s to 55 that pierces the line (only at a full draw);
  shortbow 0.55 s to 22, walk at 70% while drawing; crossbow fires on the press (`noCharge`), 34 that
  hurls light goblins, 1.15 s reload. Wand 0.6 s, staff 1.6 s to a 65 orb that bursts 2.2 wide, rod
  1 s to a piercing lance. Spells take the equipped relic's element; arrows and bolts don't.
- **Mobility:** only the Rogue walks faster than base (1.15); everyone else 0.78 to 0.92, with shorter
  rolls (1.9 to 2.4 tiles) and longer recharges (0.65 to 1 s). The blink keeps its 3.4 tiles but costs
  40 stamina and recharges in 1.6 s.
- **Healer:** third mace blow heals everyone within 3 tiles for 8; the hold (1.2 s) calls a holy smite
  onto the goblin faced (up to 6 tiles; where you point on a laptop): 70, stuns 1.2 s.
- **Relics by class** (`CLASS_RELICS`; racks and the L key are gone): Warrior javelin, hook, war
  horn. Ranger hunter's net (snares small goblins flat, slows big ones), hook. Rogue shadowstep
  (behind the goblin you face), hook. Mage lodestone (lobbed; drags goblins inward 1.8 s, then
  bursts). Healer blessing (heals 20, then 1.3x damage dealt and 0.75x taken for 8 s; most hurt ally
  on a phone, nearest to where you point on a laptop), war horn. Horn: allies within 6 refill
  stamina, regenerate it twice as fast and block at half cost for 6 s.
- **A squire** stands by the swing dummy taking hits, so the Healer has someone to heal and bless.
- Gale horn (as a knockback) and blast flask removed.

## 2026-10-31 (night, last): classes, magic augments, new relics, the world atlas (Claude Opus 5.5)

Kyle: weapon types for the other classes, more relic types and magic augments, a class button for the
demo, and start mapping the town, quests, scenarios and locations (fields, farms, towns, cities,
mines, forests; some places more wrecked than others).

- **Classes for the demo:** C or CLASS cycles Warrior (sword and shield, greatsword), Ranger (longbow,
  spear), Rogue (twin daggers), Mage (focus staff), Healer (mace and censer). Q or WEAPON swaps within
  the class (`CLASS_KITS`). Each class has its own sprite colours and hood.
- **Longbow:** taps loose arrows (stop in the first body, stick in walls); a held draw pierces every
  goblin in a line and knocks them into walls. **Focus staff:** sparks, a burst on the third, a held
  orb that bursts and throws; it casts with the equipped relic's augment (the focus relic from the
  kickoff); its dodge is a blink. **Mace and censer:** every third blow heals heroes within 3 tiles
  for 6, the held blessing hits all round and heals 10 to 30. Shots live in `sim/bolts.ts`.
- **New relics:** the gale horn (a cone that throws goblins by weight) and the blast flask (lobbed to
  where you point, or the goblin you face on a phone; bursts and throws everyone outward). A hero
  carries a rack of three (`LOADOUTS`); L or RELICS takes the next rack until the town's armoury exists.
- **Magic augments** (T or AUGMENT, on the equipped relic; `sim/elements.ts`): fire burns 4 every
  0.5 s for 3 s and spreads by touch; frost chills (half speed and turn), a second frost freezes
  solid for 2.2 s; storm arcs to the 2 nearest goblins within 3.2 tiles and to any goblin with a
  javelin stuck in it within 6 (lightning rods). Together: fire and frost make steam (cancels both,
  10 damage, stuns everything near); storm, a heavy blow, a heavy shot or a wall slam shatters the
  frozen (30); storm on the burning flares (12 and a throw). Bows shoot plain arrows for now.
- **World atlas** (Docs artifact, link in PLAN): Wickhold as the proposed town name, its districts and
  gates, five regions, ruin levels 0 to 4, eleven kinds of place, twelve objectives, ten twists.
  Proposals for Kyle to cut or change.

## 2026-10-31 (night, latest): the relic wheel (Claude Opus 5.5)

Kyle: switching relics on a phone was too slow; hold the relic button and quick-select, with only a
few relics equippable.

- Heroes carry a relic **loadout** of at most 3 (`RELIC_SLOTS`; chosen in town later). Tap RELIC to
  use the equipped one; **hold** it (0.26 s) and the carried relics fan out up and to the left of the
  thumb with their recharge shown; slide onto one and let go to equip it, let go elsewhere to cancel.
  The button shows the equipped relic's name. The fight doesn't pause (it's shared online).
- Laptop: 1, 2, 3 pick a slot directly; R still cycles; E uses. The top RELIC chip is gone.

## 2026-10-31 (night, later): kits guard and dodge differently (Claude Opus 5.5)

Kyle: sword and shield should block easiest and best; greatsword and spear need more timing; classes
should differ in speed, dodge recharge, dodge range and direction. Until classes exist, each weapon
kit carries these (`Weapon` in tuning) and they move to the class later.

| Kit | Parry window | Guard arc | Block cost | Speed | Dodge |
| --- | --- | --- | --- | --- | --- |
| Sword and shield | 0.36 s | 170 deg | 1x | 1.0 | roll 3 tiles, 0.5 s recharge |
| Greatsword | 0.20 s | 110 deg | 1.5x | 0.85 | heavy roll 2.3 tiles, 0.8 s |
| Spear | 0.24 s | 120 deg | 1.3x | 0.95 | backstep 2.4 tiles away from facing, keeps facing, 0.45 s |
| Twin daggers | 0.20 s | 100 deg | 1.8x | 1.15 | dash 3.6 tiles, 0.3 s |

- The telegraph's white parry cue uses the player's own kit window, so it always tells the truth.
- Class mapping to carry over later: Warrior (sword and shield or greatsword), Ranger (spear-like
  backstep, then Rogue's dash), Mage (a blink), Healer (to decide).

## 2026-10-31 (night): corpses ride the javelin, backstabs (Claude Opus 5.5)

Kyle: the javelin should carry the body back even when the throw kills; some classes (a rogue,
maybe a Ranger upgrade) should do more from behind, so they want to roll behind an enemy and attack.

- **Corpses ride the javelin:** a light enemy killed by the throw (or by the pin) is carried to the
  wall and hangs there (`Enemy.corpse`), fading just before it respawns.
- **Backstabs:** any blow from behind does 1.25x (`GUARD.rearMult`); behind means standing where the
  target's facing points away (dot below -0.35). No extra knockback (Kyle's Old Gods flanking rule).
- **Twin daggers** (the rogue's kit, fourth weapon on Q for now): fast 4-hit combo, weak block, 2.5x
  from behind. With daggers in hand each goblin's back shows as a purple arc, bright when you're in it.
- **Enemies turn at their own pace** (butcher 2.4 rad/s, scrapper 7) and only attack once they face
  you, so rolling past the butcher (rolls pass through) leaves his back open for a moment.
- **Design:** Ranger's subclass fork becomes Sharpshooter or Rogue (backstabs), per Kyle.

## 2026-10-31 (late): parry that lands, weapons, heavies, knockback, relics (Claude Opus 5.5)

Kyle after his first play: parrying was hard to pull off and should stun; wants animation with the
telegraphs; collision with enemies and knockback by type; combos per weapon and hold for a heavy; a
rechargeable javelin relic that pins small enemies to walls; grappling hooks; physics impacts on the
world; elemental modifiers later, all as relics.

- **Parry:** window 0.18 s to 0.30 s before the hit; the telegraph turns white for exactly that
  window (the cue is the judged window); a parry **stuns** (butcher 2.2 s, scrapper 1.8 s) with
  "STUNNED", stars and a slump; stunned or pinned enemies take 1.5x; counter window 1.1 to 1.6 s.
- **Weapons** (`WEAPONS` in tuning, Q or the WEAPON chip): sword and shield (3 slashes, best block),
  greatsword (2 wide slow sweeps, big knockback, weak block), spear (4 quick thrusts, long reach).
- **Hold to charge:** a tap swings on release; holding past 0.18 s charges (slower walk, gold glow,
  white ring at full charge at 0.9 s); release for the weapon's heavy, damage and knockback scaling
  with charge. A strong heavy (70%+) flinches the butcher out of his wind-up.
- **Bodies and knockback** (`sim/bodies.ts`): nobody walks through anybody (lighter one gives way;
  rolls pass through); every blow pushes by its knock divided by weight (scrapper 0.6, hero 1,
  butcher 3.5, dummies immovable); a fast slide into a wall or pillar is a wall slam for 6 and a crack.
- **Goblin scrappers** (two): small, quick stab with a short telegraph, flinch on any hit.
- **Animation with every telegraph:** the butcher hauls the cleaver back, trembles, chops with a smear;
  for the slam he leaps, hangs, comes down squashed with a crater, debris and a shockwave. Scrappers pull
  the knife back and lunge. Swing dummy winds its club up.
- **Relics** (E or RELIC, R or the RELIC chip to swap; each recharges): the **relic javelin** carries
  anything weight 1 or lighter to the first wall or pillar and **pins** it there (2.6 s, +12), sticks
  into heavier bodies, stays in the world 9 s; the **grappling hook** yanks light enemies to you
  (arriving stunned) or pulls you to walls, pillars and heavy enemies. Phones auto-aim relics at the
  nearest goblin in the relic's range.
- **Marks on the world:** slam craters, wall cracks and blood stay on the floor and walls.
- **Next for relics (Kyle):** elemental modifiers that play off one another; keep relics data-driven.

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

## 2026-11-01: talk, not lines (Claude Opus 5.5)
Kyle: the writing read like Claude, too direct, every sentence a punchline. Read the books' excerpts and
wrote prose-notes.md (long wandering sentences, hedging, detail before name, jokes last, short lines rare).
Added .claude/agents/line-editor.md as a second pass after the lore keeper. In the wood, dialogue that
can freeze the world waits for a tap (Kyle's ask); a card goes on with a tap anywhere, because the card
covered the stick and the move card never let go on a phone. Captions now stay up a third of a second a word.

## 2026-11-01: lines that speak (Claude Opus 5.5)
Kyle asked for typing with little sounds and emphasis that moves and colours. speech.ts types every
spoken line (wood dialogue, captions, town panels' quoted lines, Orla) a letter at a time with a per-speaker
voice blip, and reads a small markup: *bold*, ~sway~, ^good^ (green-gold), _bad_ (red, trembling). A tap,
click, Enter or action key finishes a line before it goes on. A panel redrawn in the same sitting doesn't
retype. Found while testing: the first frame could step time backwards and skip Hew's waking; the loop now
never steps below zero.

## 2026-11-01: daylight, dodges, and a wood for each class (Claude Opus 5.5)
The wood is in daylight (Theme.day: no moon pool or hero lanterns). A roll out of a blow's reach during its
wind-up now counts as a dodge (judged from where the roll started); a roll through it as it lands staggers
a close attacker for 0.6 of a parry's stun (DODGE.stun; not archers) and shows LAST SECOND. The wood's
lessons are per class (lessonsFor): Warrior and Healer keep block and parry; Rogue learns blows from behind,
Ranger and Mage full draw or charge, and all three the last-second dodge in place of parry, with goblins to
suit. Hew says one line about each class while he looks you over. The light classes can still hold a block
in the game itself; the wood just doesn't teach it (Kyle to decide whether they should lose it).

## 2026-11-01: each class guards its own way (Claude Opus 5.5)
Kyle: Warrior and Healer hold a block and parry; Ranger and Rogue can parry with good timing but never hold
a block; the Mage can neither, and blinks out instead (cooldown 1.6 to 2.6 s, a little further) leaving an
image for 2.5 s that goblins near it go for (DECOY; nearest() hands them a stand-in at the image). The Rogue
is quicker (speed 1.22; dash 4.3 tiles, 0.22 s cooldown, cheaper). CLASS_GUARD in weapons.ts; the class
detail shows a GUARD line; on a phone the block button reads PARRY for Ranger and Rogue and is gone for the Mage.
Later: a Rogue relic that slides behind the goblin instead of a straight dodge (Kyle's idea).

## 2026-11-01: Hew's death staged, the Stoker's charge, the relic found, kills that vary (Claude Opus 5.5)
Kyle: the old ending was weird (Hew teleported, the Stoker spun). The cut is now beat by beat (CUT in
sim/wood.ts): Hew walks round the hut, the ground rumbles, the Stoker rises behind the cordwood, runs him
down, lifts him (Npc.lift), bites (headless pose, blood, shake), throws the body onto its cordwood pile (kept,
not wasted, so "this one I keep" still reads two ways), turns and bellows (big shake, roar). The Stoker gains a
charge: a broad striped lane, unblockable, and no blow flinches it; it stuns itself on a wall or tree. Killing it
stops everything for a relic card (FOUND / RELIC JAVELIN) with the javelin held up in a ring of light and a
rising run of notes; then a gold arrow points to the road. Blade kills now vary: cut down (most light blows),
cut in two at the waist (most heavy blows), and only now and then the head. The Rogue's knives do half head on
(front: 0.5) unless the goblin is held fast. Ranger and Rogue holding block get "CAN'T BLOCK: TAP TO PARRY";
a Mage pressing it gets "NO GUARD: ROLL"; the HUD kit line says so too. In town, a panel stops the world.

## 2026-11-01: the pack by dragging; goblins in each other's way; the Warrior's throw (Claude Opus 5.5)
The pack (I, Tab, PACK) is now slots: WORN (hand, armor, two rings, relic), SPARES (8 and a DROP square),
the relic shelf and the belt. Drag a piece onto its slot to wear it, into the pack to take it off (armor
too: GEAR.unarm), onto DROP to drop it (or pour a potion); tap one for its card and buttons. Pointer events,
so mouse and finger both (packdrag.ts); the rules live in moveOf (tested). Goblins now hurt their own: an
arrow that misses you takes the first goblin in its line (x1.5), and a butcher's sweep, slam or charge
catches small goblins under it (FRIENDLY). The Warrior's field in the wood adds a grab-and-throw beat with
the second pair of looters. Found while testing: a hero who skipped the wood got a black screen in town
(the wood's fade stayed up); fixed, and the fade only ever shows in the wood.

## 2026-11-01: the field the day after; fire (Claude Opus 5.5)
Kyle: more evidence of a battle when you wake, the looters already eating rather than appearing, and fire
that looks like fire. The field now has the column's dead lying where they fell and in heaps (FIELD_DEAD,
drawn as corpses: on their backs or sides, blood under them, now and then an arrow still in them), dead
goblins among them (GOBLIN_DEAD, cut down, in two, beheaded), and the field's looters crouched at the heaps
(Enemy.feeding: they stay put, head down, and don't look up until you come close or the lesson starts).
The three wagons burn for show (Block.smoulder) and are drawn as wagons (plank bed, hoops, spoked wheels,
charred). Fire is redrawn everywhere: tapering tongues white to red, licks tearing loose, embers, a thick
rolling smoke column.

## 2026-11-01: the hook is the first relic; in town only the one you talk to stops (Claude Opus 5.5)
Kyle: the Stoker hauls you in with a hook, so its relic is the grappling hook, not the javelin (the javelin is
the next found). The hook pulls by weight: a small goblin comes to you; anything heavier, or a wall, pulls you
to it (a second dodge for the light classes); a Warrior or Healer can haul in up to a butcher (HOOK.heavyYank),
which arrives angry rather than reeling. The town no longer pauses for a panel (the town is shared online);
instead whoever you're talking to stops their round (Npc.heldAt/lag) and picks it up after.

## 2026-11-01: the Ranger gets its own (Claude Opus 5.5)
Kyle picked the hound and snares. The Ranger taps for a short sword (RANGER_BLADE, two quick cuts) and holds
to draw the bow (all three bows, the crossbow included, now draw on a hold). Its dodge is a jump back
(RANGER_JUMP) that leaves a snare where it stood (SNARE: one every 7 s, two down at most, holds a small
goblin, slows a butcher). A hound runs at its heel (sim/ranger.ts): now and then it goes for what you've
been hitting (or the nearest small goblin), bites a few times and comes back; nothing can hurt it, but a
butcher winding up near it sends it off for 14 s. No hound in the wood. The class pick shows a HOUND line.

## 2026-11-01: the javelin again; the Stoker calls twice; goblins at the dead on jobs (Claude Opus 5.5)
Kyle: back to the javelin as the Stoker's relic (the hook is the next found; its weight rule stays). The
Stoker bellows for help twice, at two thirds and one third of its health (STOKER_CALLS; the second wave is
bigger, with a lunger). Out on jobs, most rooms (60%) have a heap of the dead (one or two bodies, dressed for
the place) with one to three goblins at it, feeding: facing the body, leaning in, tearing a piece back, red
flicking off, wet chewing you can hear within 8 tiles. They see you at half the usual distance while they eat.

## 2026-11-01: a Rogue earns it; dodges cost more; skills on 20 s (Claude Opus 5.5)
Kyle: the Rogue's knives find one goblin a blow (the nearest in reach: Weapon.single), and a head-on blow
doesn't knock anything off balance (only from behind). Every dodge costs half again its stamina for now
(DODGE.cost 1.5; the Rogue's dash 18 before that), so there's something to grow into: perks, gear and levels
will bring it down. Class skills (War Cry, Hunter's Net, Shadowstep, Lodestone, Sanctuary) are on 20 s
cooldowns while heroes are low level; shorter cooldowns and new abilities come with levels later. Relics
(javelin 6 s, hook 4 s) unchanged for now.

## 2026-11-01: relics on 10 s; the Mage channels; sound on a silenced iPhone (Claude Opus 5.5)
Relics recharge in 10 s (javelin, hook). The Mage's class skill is Elemental Channel (CHANNEL; Lodestone stays a
relic): it stands still 2 s (anything that hurts it breaks the channel), then its spells turn to the next element,
fire, frost, storm, round again, kept from room to room (profile.augments.channel). Fire: the tap is a firebolt,
the hold a fireball that bursts and sets them burning. Frost: the tap is three icicles in a fan, the hold a burst
that freezes solid. Storm: every spell jumps to the next goblin. A rod's lance keeps piercing (its element rides
the line, no burst). The HUD kit line shows the element. Kyle heard no sound on his phone: iPhones play web audio
on the ringer channel, so the silent switch mutes it; the first tap now loops a silent clip on a media element,
which moves the page to the media channel.

## 2026-11-01: hosting plan (Opus 5.5)

- `api/room.ts` maxDuration is 300 s, not 800: Vercel Hobby refuses a deploy that asks for more
  than 300, and sockets swap every 4 minutes anyway, so 300 works on Hobby and Pro alike.
- Start on Vercel Hobby plus Upstash Redis on pay as you go with a monthly budget cap (rate limited
  at the cap, never billed past it). Move to Vercel Pro ($20 a month, $20 of usage included) only
  when real players arrive; Hobby is non-commercial and pauses when over its limits.

## 2026-11-01: Ranger playtest fixes (Opus 5.5)

- The hound is with a Ranger from the waking in Greyhollow on (Kyle's call; overrides the bible's
  "joins at the north gate").
- Hew creeps in at the waking: out of the trees west of you, round behind the feeding looters,
  crouched (drawn squashed, slower bob) until he hauls you up. Hew's start moved to the west edge.
- A dodge that clears the blow (a Ranger's jump back, or any roll out of range) staggers the attacker
  when it started within the dodge's i-frame span of the blow landing, same as rolling through.
- Netted, the Stoker can't start a charge or a hook throw, and loses one it was winding up.
- Functions run in sfo1 (San Francisco), next to Kyle and his friends; the Upstash database goes in the
  matching west region so each publish is a short hop.
- Vercel project `relic` created on the SomwhatRogue team, linked to SomewhatRogue/Relics; every push
  to main deploys.
- Relic shares Come Bye's Upstash database for now (upstash-kv-amethyst-compass, sfo1, Free plan,
  which allows one database per account). Relic's keys all start `rl:`, so the two never collide;
  they do share the 500K commands a month. Moving to pay as you go (budget capped) is the step when
  either game gets regular players.

## 2026-11-01: the shared town (Opus 5.5)

- Online shape (Kyle): no join codes. Wickhold is one shared hub; parties form at the board; a job
  is a shared instance run by the party leader's browser; world quests need 3+ in town.
- The town has no host. Each browser runs Wickhold (its people walk on the clock), and each player
  only says where their own hero is, through a peer room on the relay (`want=peer`, room
  WICKHOLD1). Nobody leaving can break the town. `src/client/townfolk.ts`; `src/client/relay.ts`
  is Come Bye's reconnecting socket (heartbeat, visibility check, 4-minute swap).
- At most 4 messages a second while moving, one every 3 s standing; silent 12 s means gone.
- Online is on only in the Vercel build (`VITE_ONLINE=1`) or with `?relay=`; the one-file artifact
  build stays offline. `npm run test:online` runs three real browsers against a local two-instance
  relay (`scripts/online-server.ts`).
- relic-lake.vercel.app is public (Kyle, 2026-11-01): Vercel Authentication now guards preview
  deployments only, so anyone with the link plays without a login.

## 2026-11-01: parties and the shared run (Opus 5.5)

- Parties form over the town's peer room: the one gathering says so with where they stand (`pt`:
  the job and who's in), joiners ask by direct word, SET OUT tells each member the run's room code
  and the job. The job travels with it (each player's world, and so board, can differ).
- The leader's browser runs the job; friends' heroes are dressed from the profile they send.
  Patches of what changed (`snap.ts`) about 12 a second, a full one every 4 s, on a room change and
  for anyone new; average well under 4 KB. Friends swap ids in the text (leader `me` to `@lead`,
  theirs to `me`) so the rest of the game runs unchanged on their copy.
- The run's gold is shared: every pickup counts for the party, and everyone is paid the run.
- Labels checked by the lore keeper (plain board words: GATHER A PARTY, SET OUT, TAKE IT DOWN).
- `npm run test:online` now also runs scripts/party-online.cjs: gather, join, set out, same goblins,
  walking seen, a hurt goblin hurt for both, every room in order, the end paying the friend.

## 2026-11-01: loot and gold (Kyle; Opus 5.5)

- Gear rarely drops on the way now (a small goblin 2%, a butcher 15%); chests stay as they were.
- The treasure at the end of a job won is each player's own (shared/treasure.ts): one piece always,
  35% a second, better for worse places and deep jobs, rolled for that player's class by their own
  browser. What won't fit in the pack sells for 20 gold. Shown on the results panel.
- Gold drops often (85% of small goblins) and goes in one pot for the party: whoever picks it up,
  everyone is paid the whole pot at the end, and spends their own in town.
- A friend's pickups, potions drunk and gear changes in the leader's job come home with them (the
  pack now travels in the snapshots).

## 2026-11-01: less lag for friends (Opus 5.5)

- The leader sends 20 patches a second (was 12).
- A friend's own hero walks the moment they press. Each input carries the friend's clock and the
  leader hands back the newest one it has used, which times the trip there and back; the friend's
  hero is drawn at the leader's position plus the walking done here since then, eased in, snapped
  if more than 1.5 tiles off. Rolls, swings, hits and knockbacks stay the leader's alone.
- scripts/party-online.cjs now runs with 150 ms of lag on every message (LAG_MS on the local
  server): the friend's hero moves within 0.11 s of the press, and never jerks back while walking.

## 2026-11-01: handing the job on, and coming back (Opus 5.5)

- Every 2 s the leader sends the whole job (`saveRoom`: the run and every field of the room, its
  dice included). Leader quiet 9 s: the friend first in line by id takes the room over with
  `want=take` (the next waits 5 s more, in case the first is gone too) and leads; the others hear
  `hosted` and follow. Friends' heroes now move between rooms as they are, not re-dressed.
- A job with friends is kept in this browser (`session.ts`, 15 minutes fresh): a reload goes
  straight back in as a friend, and the old leader coming back follows whoever leads now.
- Known: module id counters (bolts, drops) restart on the new leader, so an id can repeat once.

## 2026-11-01: the board remembers, one voice per device (Opus 5.5)

- A job won is written to the shared world as a deed (title, place, the party's names) by the
  browser that ran it; the board shows the last five under DONE LATELY. The world server cleans it.
- Council votes are cast by the device (`relic-device` in this browser), not the hero, so one
  person's heroes share one voice (Kyle's worry). A second browser is still a second voice; real
  one-per-person needs sign-in, later if it's ever gamed.

## 2026-11-01: places and lengths (Kyle; Opus 5.5)

- Three new kinds of place: river (deep water across the room, two fords to wade, stepping stones
  drawn), marsh (bog pools, two too deep to cross; reeds, drowned trees, mud), ruins (broken walls,
  rubble, pillars, statues). Six new places named by the lore keeper (the Sheepwash, Brokenbridge,
  the Peat Cuts, Sallow Carr, Ketterby, Hesketh Hall). Shallow water slows everyone to 55%; deep
  water stops bodies, never shots.
- Four ordinary jobs a day, each a different kind of place: short (2 rooms, about 5 minutes), two
  medium (3), long (5, about 15), plus the deep dive. Pay = (18 + 9 per ruin, +6 at night) per room,
  x1 / 1.15 / 1.35 by length. Treasure: a piece; a piece, maybe two; two pieces a cut above.
- River and marsh borrow the wood's music, ruins the village's, till they have their own.

## 2026-11-01: drills at the trainer (Kyle; Opus 5.5)

- Your own class's trainer sells drills for gold: POWER (+5% damage a rank), HEALTH (+8), SPEED
  (+3%), CRITICAL (+4% chance a rank for a blow or shot to land 1.5x; shows CRIT), WIND (+8% stamina
  back), SKILL (class skill back 8% sooner a rank, 3 ranks) and the class TECHNIQUE (3 ranks):
  Warrior SLAM, Healer MENDING HANDS, Rogue KNIFEWORK, Ranger TRAPPER, Mage QUICK CHANNEL.
- Price = base x (rank+1)^1.6; a trainer goes one rank further every two levels. Perks on levelling
  stay free picks. Crits roll on the hero's own seeded dice, so the room's dice never shift.

## 2026-11-01: taught at the trainer; a calmer hound in training (Kyle; Opus 5.5)

- A new hero comes out of the wood with their weapon and a plain dodge only (no class skill in the
  wood: Kyle's call; the Stoker's goal no longer mentions it). Their trainer teaches the class skill
  from level 2 (60 gold), and from level 3 (80 gold) a Ranger's snare on the jump and a Mage's image
  on the blink. Heroes made before this (no `learned` list) keep everything they had.
- An untaught skill has no button and its press is spent; the relic button carries the javelin.
- In the wood and the yard the hound joins in a third as often, never goes for a goblin that's
  swinging at you, and never knocks one off its stride: those blows are yours to meet.

## 2026-11-01: playtest batch (Kyle's notes; Opus 5.5)

- Doors: the hero on the far side takes every press so far as seen, and stands still (no repeat of
  the last swing or roll). Goblins after you (awake, within 7 tiles, not named, four at most) come
  through the door a second later, in and out (`followers.ts`).
- The caged call out when you're near (a gold mark over the cage) and, freed, stand where it was and
  thank you (`captives.ts`; drawing only).
- The run banner has a readable backing and shows get-ups as hearts; going down alone says how many.
- The trainer is short: where you stand and a button for each thing; tap one for what it does.
- Sneaking: walk slowly (part-way stick, or Shift) and goblins at rest see you from 45% as far. The
  first blow on one that hasn't seen you is an AMBUSH: 2.2x, and it reels 1.2 s.
- Jobs mix in spear-lungers, brutes and shield-bearers (a plank shield: a quarter from the front
  unless heavy, held fast or unaware), more of them deeper and in worse places.
- Rogue: no parry, dodge only; dash costs more breath (30, x1.5) on a 0.35 s cooldown; feet 1.12.
  Everyone else dodges less often (roll 1.1 s, jump 1.0, heavy 1.4, Healer 1.3). The Mage's taps are
  slower and a little harder. The dodge button says ROLL, JUMP, DASH or BLINK.
- The hound joins in every 3.5 s (5 in training) and, in training, never on a goblin swinging at you.
- Hew: one word of praise a lesson, in passing (the fight doesn't stop), and "more of them" once.
  The dodge freeze-frame doesn't happen if you're already rolling or out of where the blow lands.
- Merged from helpers: panels reveal in reading order (`reveal.ts`), and the dice are thrown on a
  little pixel table (`diceanim.ts`).
## 2026-11-01: every house its own (Kyle's playtest note; Opus 5.5)

- One seed per house (job, room, house) picks its sort, its outside and its fire: the street block
  carries it as `look`, the inside uses the same one, so a lit window outside means a lit hearth in.
- Cottages: one room (hearth, beds, table), a back room behind a wall, a weaver's (looms), a smithy
  (forge, anvil, racked tools), a storehouse (sacks, crates, barrels, oil), or either of the first two
  looted (furniture smashed, the table in pieces, often a body). Barns: stalls with hay, or an open
  threshing floor with bales and a cart. Size, floor (planks, dirt, flagstone) and sides vary; any
  layout may be mirrored.
- Who's in: nobody (about a fifth), one or two asleep (still and half-sighted, like goblins at the
  dead, drawn curled up), some at a body, or a band; a butcher in a barn only at ruin 2 and up, one
  time in five. Light: the hearth lit or cold, moonlight through a stove-in roof, the goblins' fire,
  a lantern post in a barn. Collision sizes outside are unchanged.
- A hiding survivor is a cage tucked in the back (the only rescue the room knows); a free one who
  talks would need new lines and a run-side talk handler.

## 2026-11-01: no dodge for Warriors and Healers (Kyle; Opus 5.5)

- Warriors and Healers can't dodge at all; there's no button for it on a phone. They block, and walk
  out of anything striped. Pressing dodge does nothing (`CLASS_DODGES` in `weapons.ts`).
- Walking out of a striped blow aimed at you counts as a dodge (`EnemyAttack.aimed`; a charge that runs
  its line and misses its mark counts too), so traits and the wood can count it.
- The wood's second lesson for them is STEP OUT: the freeze comes earlier (0.45 s) and the stick
  answers it. Rogue, Ranger and Mage keep the dodge lesson, with their own button's name in prompts.
- The Healer's block stays a little weaker than the shield (mace guard cost 1.1). A sword-and-censer
  Healer kit could come later.
- Hew screams as the Stoker takes him ("No! No, no, n"), cut off at the bite.
- The pixel font now has punctuation, a heart, and draws lowercase as capitals, so captives' words show.

## 2026-11-01: the Warrior's two skills, blocks cost breath, an easier grab (Kyle; Opus 5.5)

- The War Cry no longer helps allies block (they might not block). It now draws every goblin in
  earshot to the Warrior, and nobody else, for 5 s; it wakes the ones at rest. Small goblins right
  beside them flinch.
- New: Shield Charge. A 5-tile run shield first along where you face; small goblins in the way are
  knocked aside and left reeling (so they can be grabbed), big ones stagger, crates and barrels burst,
  a wall stops it (`src/sim/bash.ts`, `BASH` in magic.ts).
- A class can have a choice of skills (`SKILL_CHOICES`): the trainer teaches them together and the hero
  carries one, swapping for free at the trainer (`Profile.skill`). Only the Warrior has two for now.
- A held block costs no health at all, only breath, and a lot of it (2.4 per point of damage; a butcher's
  cleave takes most of a full bar). Weapon `chip` values are unused now.
- Grabbing: a small goblin that is busy (feeding, swinging at someone else, or at the end of a swing)
  can be grabbed as well as one reeling or one you're behind. The wood's field has crates and a barrel
  off the burning carts, and the Warrior's grab lesson teaches throwing those first.
- Hew no longer says "skittles" (it read as the sweets, not the old pin game).

## 2026-11-01: the pick screen, the Cleric, new looks (Kyle; Opus 5.5)

- The pick screen says only RELIC, A NEW CHAPTER, "Choose your destiny." and the five classes by name
  and look. Tapping one shows it fighting (a live loop: blows, a heavy, a dodge or a guard,
  `src/client/preview.ts`), its ratings, a name and BEGIN. No weapon or skill text: Kyle, "less is more".
- The Healer is called the Cleric on screen (`CLASS_NAME`); the id stays HEALER.
- Every class has eyes that glow in the dark. The Mage has a tall pointed hat, a robe, sleeves and a
  beard; the Cleric wears a mail coif and a white tabard with the Lantern on it in gold; the Ranger is
  hooded. Three Warrior looks are drawn for Kyle to choose from (`WARRIOR_LOOKS`: knight, sellsword,
  blackiron). Kyle: three looks for every class, chosen on the pick screen (`LOOKS`, `Profile.look`, `Hero.look`; sent to the town so friends see it).
- Halvard buys packed gear (never hungry); gear given to a town work counts for half again.
## 2026-11-01: Wickhold starts broken, mends with gold, and gets raided (Kyle; Opus 5.5)

Kyle: start the town broken down and bloody, with an unfinished garden, so there's something to put
money towards and watch it clean up; NPCs comment as it gets nicer. Then: bad walls (sticks) that get
better with time, and world events where the town is attacked and bloodied again.

- **The breach.** Wickhold's north wall came down in a recent assault; the stretch either side of the
  gate (tiles 17 to 39) is hurdles, stakes and a cart bed lashed up with rope (`GameMap.breach`,
  painted in `client/breach.ts`). The rest of the wall is the old stone Wenna saw go up, so it is still
  "the last walled town". Blood on the square and at the gate, a drag trail, the dead on a cart by the
  church with crows, burnt carts and rubble in the lanes, scorch, lamp posts down, buildings scorched
  with boarded windows and holed roofs, and Perrin's trampled physic garden with a dead tree.
- **What's broken is data** (`shared/mend.ts`, from the world's works, so the same on every screen):
  paint-only floor marks (`GameMap.marks`, `client/marks.ts`), a `worn` flag on buildings
  (`client/wear.ts`), a laden cart (`look: 3`), and two paint-only round kinds (`crows`, `moths`,
  `client/streetlife.ts`). Wrecks sit clear of doors and patrols (the town reach test covers a fully
  mended town too).
- **New works, all gold, all seen:** Wash the Square 60 (blood, crows and the dead cart go, fresh graves
  by the church), Clear the Lanes 150, Mend the Shutters and Roofs 200, Lanterns along the Lanes 120
  (eight lit posts), the garden in three stages (Clear and Dig 80, Plant the Beds 120, Benches and a
  Lamp 160), the wall in three (Stakes for the Breach 150, A Timber Wall and a Walk 350, Stone for the
  North Wall 800). Stages are separate ids with `after`; a stage opens only when the one before is done.
  Gifts never overshoot what a work still needs. The first three works are unchanged.
- **The TOWN WORKS panel** (`client/worksui.ts`): Hollis, your gold, a dim line of what's done, then one
  button per open work with its progress (mending first; only the next stage of a line). Tap for what it
  is, GIVE 25 / GIVE n, and for the defence works (`arms`: the watch and the three wall stages) GIVE GEAR,
  the gear flow from main moved there.
- **Raids** (`shared/raids.ts`): from day 10, never within 6 days of the last, a 15% chance a day, and
  only once the town has two mended things to lose. A raid always brings the blood back (if the square
  was washed) and pulls down one more (two once five are standing): only the top stage of a line (the
  garden loses its newest stage, the wall drops back one), never the watch, the Old Quarter, the sewers,
  and never stone. Recorded in `world.raids` (newest four).
- **Who decides a raid:** it's rolled in `contribute` as days pass, seeded by the day, so it's the same
  everywhere. For a shared world only the world server rolls it (the browser passes `raids = false` while
  online, and takes the server's world back); off the server, the browser rolls it for its own world.
  Days pass per finished run, as gold does, so a busy world is raided more and mends faster in
  proportion. No server change was needed.
- **The town talks** (`shared/townsays.ts`, lines in `shared/mendlines.ts`): a fresh raid (3 days), then
  a work finished in the last 4 days (`world.mended`, kept in `contribute`), then on two days in three how
  the town stands (broken, mending, mended with the garden in flower), or after any raid, Wenna and Dunn
  remembering it. Old Wenna, Tam, the gate guard, Dunn, Hob, Pike, Orla, Rowan, and Widow Perrin (new, in
  the garden; her line follows its stage, and of an evening once there are benches). The first time you
  see a raided town Dunn tells you (`client/raidnews.ts`, once per raid per device), and the job board's
  DONE LATELY says when it was hit.
- **The garden at dusk:** once the benches are in, a soft lamplit pool over the benches and beds and
  moths round the lamp after dark.
- Not done: barks when walking past a newly finished work (there's no bubble system yet); a raid you
  fight in town.

## 2026-11-01: winded (Kyle; Opus 5.5)
- Run stamina all the way out (a dodge, a block, a guard break) and you're winded: the bar flashes red,
  nothing comes back for a second (`HERO.windedDelay`), and there's no dodge, blink, block or parry until
  the bar is full again.
## 2026-11-01: Wickhold's ground, and a town alive under siege (Kyle; Opus 5.5)

Kyle: the square is too uniform, all cobbles; add gallows and a gravedigger shifting the bodies; make
it seem more alive and under siege. Less is more for new lines.

- **The ground** (`shared/ground.ts`, painted by `client/groundpaint.ts` as more floor marks): old
  flagstones worn into the cobbles round the Lantern and the well; packed earth where carts turn inside
  the gate, by the square's cart, the tavern and the west lane; wheel ruts down the gate road and along
  the lanes; paths worn corner to corner (square to tavern, to barracks, to the forge, to Rescue Row); a
  drain down to the sewer grate and along the north lane; puddles; straw by the stalls and the tavern;
  weeds along the walls and edges. Fixed data, each mark painted from its own seed: the same on every
  screen. Washing the square takes its broken cobbles; clearing the lanes takes the churned mud, the
  lane holes and the spent arrows under the breach. The rest stays when fully mended.
- **Under siege** (`shared/siege.ts`, drawn in `client/siegedraw.ts`): a gallows at the square's east
  edge with an empty noose and a crow on the beam (empty, not a hanged goblin: the bible has Wickhold
  taking nobody and the horror in absences; the lore keeper can change it). Gravedigger Cobb walks
  Odric's cart to the churchyard with the dead over his shoulder, digs a while, goes back; once the
  square is washed he only tends the graves. The Tulls, burned out of the north lane, round a new
  brazier inside the gate till the shutters and roofs are mended (not refugees: those wait outside the
  gate for the council). Goodwife Mab drawing water at the well; Recruit Wat at the whetstone by the
  barracks. Wicker hurdles either side of the gate road till the timber wall is up. Smoke past the north
  wall; a dog nosing along the south lane.
- New NPC fields (paint only): `Npc.work` (what they're busy at) and `Npc.mute` (background people: no
  mark, nobody to talk to). Two block kinds (`gallows`, `hurdle`), two round kinds (`dog`, `smoke`).
  Nothing blocks a door, a spot or a patrol; the reach test covers it.

## 2026-11-01: the ground is mostly earth and mud now (Kyle; Opus 5.5)

The square still read as one cobble grid with a flagstone patch. The ground is now made of materials
in big soft-edged shapes (`GameMap.soil`, `shared/ground.ts` `townSoil`, painted by `client/soil.ts`):
mud everywhere first, packed earth over the square, the gate yard, the market and the lane mouths; the
cobbles survive in islands and strips over that (round the Lantern and the well, along the building
fronts, the old road down from the gate, a spine down each lane); then wear over all of it (a track
worn corner to corner across the square, mud fans where carts turn, wet round the well, straw under
the stalls, ash round the braziers). Edges are broken by seeded value noise; the material is decided
per 4x4 pixels and coloured per 2x2, written straight into the floor's pixels once per map (about
50 ms). Each material has its own colour family, dark for the stepped lighting. Washing the square
sweeps its earth and relays three more cobble islands; clearing the lanes sweeps bands of lane mud,
widens the cobble spines and takes the cart-turn mud fans. The small marks (flagstones, ruts, drains,
puddles, weeds, missing cobbles, arrows) stay on top; the earth, path, mud and straw marks are gone.

## 2026-11-01: the Roll as a leaderboard (Kyle; Opus 5.5)
- Two sides, THE BRAVE and THE UNLUCKY, each a card per tally with a podium of the top three (their
  faces), places four to ten below, and your own count if you're not on it (`src/client/rollui.ts`).
- New tallies, counted per player in a run and kept on the shared Roll online: butchers killed, gold
  earned, friends picked up; and on the unlucky side times knocked down, picked up by friends, friends
  floored. Old heroes start the new tallies at nothing.

## 2026-11-01: back to 1x sprites (Kyle; Opus 5.5)
- The 2x jointed figures were reverted (Kyle: "doughy and soft", and the idle bob jumped about; the 1x
  look was grittier). The work stays on branch `juice` (97ffc72) for reference. The anticipation and
  payoff pass from before the 2x step stays in.
## 2026-11-01: the freed can be hurt, and are only saved once you get them out (Kyle; Opus 5.5)
- Breaking a cage puts its person in the room as a body (`sim/survivors.ts`, tuning `SURVIVOR` in
  `shared/props.ts`): 24 health, they stand a moment, then follow the nearest player at a slow walk a
  gap behind, step out of a hero's way (heroes never push past them), and wait where they are with
  nobody near. Goblins ignore them for now. They're in the room's state, so guests see the same people.
- Everything of the party's that can hurt a friend hurts them, at full weight and solo too
  (`sim/survivorhits.ts`): swings, arrows and spells, blasts, a slammed barrel, the oil going up, a
  javelin, goblins and props flung into them, the shield charge, and fire caught from burning goblins
  and buildings. A holy smite, the net and the hound spare them. The blow that breaks the cage doesn't
  land on whoever's inside. Killed, they fall and stay where they fell.
- Freed is not saved (Kyle: bring them out, don't babysit the whole job): they count as brought home
  (`survivorhome`) once walked out of the house they were caged in, or, caged out in the open, back to
  where the party came into the room. Then they walk off and are gone. A rescue job's goal now waits on
  them. Stepping out of a house with someone, a third of the time 2 or 3 goblins (more for a bigger
  party, at most 5, some lungers or shields) are waiting by the door (`sim/ambush.ts`, the room's own
  seeded stream).
- The Roll: RESCUES STRUCK (blows landed on the freed) and RESCUES KILLED take the place of PICKED UP
  BY FRIENDS on the unlucky side (`carried` is still counted, off the board). Counted per hero id in the
  run so a friend's game reads its own; the job's end now swaps ids for a guest the way patches do.

## 2026-11-01: the Rogue throws a dagger (Kyle; Opus 5.5)
- The daggers' held attack is a thrown dagger instead of the power thrust: 14 damage, 30 at full,
  8 tiles, tumbling in flight and sticking where it lands (`shot: 'knife'`).

## 2026-11-01: the Mage casts (Kyle; Opus 5.5)
- The Mage's tap spell is a cast: about half a second rooted in place (wind-up 0.3 to 0.36 s across the
  three kits). Burning hits harder to make up for it: 7 every half second for 3 s (was 4).

## 2026-11-01: bigger parties, better rewards (Kyle; Opus 5.5)
- Each extra player adds a quarter to a won job's pay and its objective xp (`PARTY.reward`); kill gold
  and xp already grow with the extra goblins. Two or more players each find one more piece of
  treasure; three or more roll it a cut above.

## 2026-11-01: finding your way on a job (Kyle; Opus 5.5)
Kyle: he didn't know how many were left to rescue, the people he freed didn't follow him out of houses,
and he couldn't tell when or where he could leave.
- **The freed came out in the wrong place.** Walking out of a house moved them to the street, but they
  were pushed against the house's map (the map in use at that moment), so they turned up across the
  street, counted as home at once and walked off without being seen. They now come out by the door
  behind you (the street's own tick settles them), with SAVED over them, then walk off toward the way in.
  Tested through the real door, alone and with a friend leading them.
- **The goal counts people** (`sim/goal.ts`, moved out of run.ts): "2 to free, 1 to bring out", plus
  "3 more in the houses" for anyone caged indoors (extra, never needed: on a rescue, every house has
  someone; that would be seven in a village). Anyone freed, indoors or out, has to be brought out
  before a rescue's way home opens. A friend's screen shows the leader's words and count.
- **The way out is plain** (`client/wayout.ts`): a gap painted in the back wall where the way on is;
  stakes across it while it's shut; once open, light in it, a torch either side and gold chevrons
  running into it; a sill, light and chevrons at a house's door. The goal names it ("Way on: north",
  "The larder is ruined. Way home: north"), "WAY ON: NORTH" / "WAY HOME: NORTH" / "PICK A ROAD" rises
  over you the moment it opens, and the wood's gold arrow at your feet points the way on a job
  (`client/wayfind.ts`): the cage, out of the door once someone's freed, back to the way in with
  someone freed out in the open, then the way on. Someone freed and left out of sight gets a pale mark
  at the screen's edge. Every kind of place has its way out at the top middle (forks: two at the top);
  a test floods each from the way in and checks nothing stands in front of it.

## 2026-11-01: the job board, and story missions need a party (Kyle; Opus 5.5)
- The board lists each job on one line: its kind, the place, its length, how hard (five pips:
  ruin, length, night, deep, story) and the pay. Tap one for the rest and the buttons.
- Online, a story mission needs a party of three (`STORY_PARTY`): no GO ALONE, and the party can't set
  out short-handed. Off the shared world (and in the one-file build) it can still be taken alone.
## 2026-11-01: what the goblins do; wrecked, blocked and burning houses (Kyle; Opus 5.5)

- Big houses on long and deep jobs (now and then deeper into a medium one): a longhouse (two or three
  rooms off its hall, each through a doorway), a manor (a hall with a long table and a back wing walled
  off it: a bedroom and a store), a tithe barn (posts, grain bays, bales, a cart). The door and the
  way out stay at the bottom middle.
- What the goblins left, paint only, laid out from the house's seed (shared/grim.ts): bodies torn apart
  with pieces strewn, a body dragged across the floor, one tied up on the back wall and opened, one hung
  by the ankles from a rafter hook, a cook-pot on their fire with a hand or a foot in it, a heap of bones
  and clothes, what's left of the last one by a cage, bloody handprints, a count scratched in fives
  (the rumour about captives' marks). More of it the worse the place and the deeper the job; about a
  third of houses at ruin 1 (still some at the worst) stay quiet. Goblins still at the dead are the
  existing feeding goblins over a corpse.
- Fates on the street, more of them the worse the place: wrecked (a gable end down, the roof caved, beams
  and rubble spilled; inside, rubble heaps and the sky through the roof), blocked (fallen in across the
  door: no door, no prompt), burning (smouldering outside, never spreading). A caged person is only
  ever inside a house you can enter.
- Inside a burning house (HOUSEFIRE in tuning.ts, judged in sim/blaze.ts, drawn from the same plan):
  patches smoke for 3 s then burn whoever stands in them (14 a second, 4 at a time); beams come down
  every 5 to 7 s on a striped circle (1.6 s warning, 22 damage, a roll gets you out); between 52 and
  64 s the roof falls in after 10 s of falling dust: everyone inside is thrown out the door hurt (never
  below 1 health), the freed with them, and anyone still caged is lost (`run.lost`). Fire never touches
  the doorway or the way from the door to the cage. The house is rubble in the street once it falls.

## 2026-11-01: small fixes (Opus 5.5)
- Knock-downs, pick-ups and friends floored are counted per player in a run, so a friend following a
  job gets their own tallies, not the leader's.
- The results say how many were lost to a fire.
- On a job, the banner fades when you're near the top of a room so it doesn't hide the way on.
## 2026-11-01: places with a plan (Kyle; Opus 5.5)

- Every place on the board is one of twelve sorts (shared/sites.ts): Barrowby a village round its
  green (cottages facing the lane, yards and fences, kitchen gardens, the well and a shrine, strip
  fields and hedges at the edges); Tollan's Farm a farmstead; Lowfurrow Fields fields cut by tracks and
  hedgerows; Fennick Ford a better-off street (stone terraces, gutters, a walled garden, a courtyard,
  a fountain or market cross, stalls, a gatehouse); the Charcoal Camps and Brokenbridge shanties
  (shacks and tents along a twisting muddy path, cookfires, washing lines, a latrine ditch; charcoal
  clamps in the wood, the broken bridge by the river); Hesketh Hall a manor's grounds; Ketterby a
  village gone to ruin; Hangman's Wood a wood with its clearing and gallows; the Copperdeep Shafts a
  gallery; the Sheepwash a riverbank with sheep pens; the Peat Cuts water in rows; Sallow Carr a
  willow carr. A place not on the list gets its kind's sort.
- A place's plan is seeded by its name and the room, not the job, so it looks the same every visit;
  the job's seed still places the objective, goblins and chests. The objective is placed first and the
  plan drops whatever would land on it, the way in or out, the forks' roads, raised ground or water,
  or the clear line up the middle.
- The ground comes from soil shapes (grass, ploughed furrows, standing grain, earth, mud, gravel)
  over each place's floor. Enemy rolls, themes' light and torches are untouched.

## 2026-11-01: jobs at any hour, and spiders (Kyle; Opus 5.5)
Kyle: maps don't always have to be night, and other enemy types, like spiders that come in waves and poison.
- **A job's hour** (`shared/timeofday.ts`): dawn, day, dusk or night, rolled from the job's own seed on its
  own stream (the rest of the board is unchanged). Night is still the twist with its extra pay; a quarter
  of the rest are dawn, a quarter dusk, the rest day. The room is lit through the same pass as the town:
  the place's own tint mixed toward the hour's sky as far as the place lets the sky in (a forest less, a
  mine not at all), `torch` scales torches, braziers, posts and lanterns (day 0.35), dusk stretches every
  shadow east, dawn lays mist bands over the ground. The board shows the hour as one word on each line
  (". At night" left the detail). Old saved jobs read as night if they were night jobs, else day.
- **Darkness and stealth**: nothing judged depended on the dark before. Now a resting goblin's sight is
  0.8 of itself at night, 0.9 at dawn and dusk; a censer's glow gives a Healer away half as far by day.
- **Spiders** (`shared/spiders.ts` numbers, `shared/nests.ts` where, `sim/spiders.ts`, `sim/poison.ts`,
  `sim/puddles.ts`): in forests, marshes, mines and ruins only (never villages, farms, fields, rivers or
  under Wickhold), 25% a room plus 12% a room in, 5% a point of ruin, 15% on a deep job. A room with them
  gets a nest (two from the third room, or on a deep job) with two spiders on it, and two fewer plain
  goblins a nest. A nest wakes when a hero comes within 8.5 tiles (or it's hit), hatches 3 spiders 1.2 s
  later and every 8 s after while fewer than 7 of its own live; it counts toward clearing the room ("Clear
  the room (N left)" while spiders are about). A spider: 14 health, fast, zigzags in, circles while it
  gathers itself, pounces 2.4 tiles along a shown lane (blockable, parryable) for 5 and a stack of poison.
  The brood mother (from the third room, the second on a deep job, 40% plus 30% deep): 240 health, slow;
  a bite (14) up close and, from 2.8 to 7 tiles, a lobbed glob at where you stand: a striped circle that
  lands exactly there for 10 and leaves a poison puddle 5 s. She hangs back in spitting range.
- **Poison**: up to 3 stacks, 2 a stack a second, never the last point of health; a stack wears off 5 s
  after the last bite, then one every 1.5 s. A Bitter cures it; a Healer's heal takes a stack off. Green
  cast and drips on the hero, the health bar goes green. Synced to friends on the hero and puddles as a
  collection.
- **Weaknesses** (`WEAK` in shared/spiders.ts, read by `damage()` and melee): spider fire 2.5, storm 1.2;
  brood fire 1.8, blades 0.9; nest fire 3, blades 0.6, frost 0.5, storm 0.8. WEAK pops over a hit on one.
  Fire spreads between spiders half a tile further than between goblins, and a burn tick kills a spider.
  Spiders give xp (3; nest 20; brood 60) but no gold or loot and don't count as goblins killed.
- In a party, nests aren't copied (their waves grow by one a player past the first, and their cap with
  them); the brood mother isn't copied and gets tougher like a named one.

## 2026-11-01: trainer ranks level locked and dearer; a trainer screen you can read (Kyle; Opus 5.5)

Kyle: "trained abilities to be level locked and cost more", and the screen was "a pain to understand".
- Every rank has a level (drills.ts `levels`): power, health, speed, critical and breath at 2, 4, 6,
  8, 10; skill at 4, 7, 10; technique at 5, 8, 10. Prices doubled on the same curve (power 80, 245,
  465, 735, 1050). The whole set is about 17,800 gold, a long road past the chapter's level cap.
- The class skill lesson moves to level 3 for 150 gold; a Ranger's snare and a Mage's image to level 5
  for 250. Class sheets read the levels from drills.ts so they can't drift.
- The rules live in shared/training.ts (`drillState`, `buyDrill`, `learnLesson`); the game only calls
  them, so a buy refuses below the level, without the gold, or before the lesson it needs. Ranks a hero
  already has above the new levels are kept; they buy on once their level catches up.
- The screen (client/trainerui.ts, rows from shared/trainrows.ts): level, an experience bar and gold
  on top; picks waiting first (tap to take); then SKILLS (the lessons, and the Warrior's CARRY choice)
  and TRAINING, one row each with pips (filled, open, hatched for a level not reached), what the next
  rank adds, and a price, LEVEL n, NEEDS SKILL or MAX. Buyable rows are gold-edged; locked ones dim.
  Tap a row for NOW and NEXT, every rank with its level and price, and one buy button.
- The greeting is one line at most: the grown line when picks wait, or Isolde's coal line.


## 2026-11-01: each hall its own place, inside and out (Kyle; Opus 5.5)

Kyle: the wizard tower doesn't look very wizard-towery outside or inside; personalise each hall.

- **Inside** (`shared/townhalls.ts`; `interiors.ts` hands the town's halls to it): the tower has
  bookcases, a star chart, a stair curling up, a desk of books and jars, a chalked circle and a brazier
  of coloured fire, and Magister Vell has a tall hat; the barracks racks, shields and a banner, bunks,
  a map table and a dummy on strewn rushes; the lodge bows, antlers and pelts on the wall, a skinning
  bench, a bear hide, the hounds' bowls; the church candles, a runner up the aisle, coloured windows and
  Mother Isolde's cot; the Drowned Rat casks, the dice table, Whisper's curtained booth, its sign and
  notices, sawdust; the forge bellows, a quench tub, tools and horseshoes, soot; the town hall the
  council desk with its ledgers, the valley map, notices, a rug; the infirmary herbs drying, a basin, a
  candle stand. NPCs stand where they stood (the trainer panels are untouched).
- **New pieces:** twelve furniture kinds (`client/hallsdraw.ts`), two live rounds (`candles`,
  `witchfire`, lit by the scene: candlelight, and fire that drifts violet, green and blue), seven floor
  marks (`client/hallfloor.ts`), and `GameMap.hangs`, things on the back wall (`client/hangs.ts`).
- **Outside** (`client/exterior.ts`, by door, on labelled town buildings): the tower round and shaded,
  a crooked slate cone with a vane, slit windows lit odd colours and coloured smoke from its flue; the
  barracks shields and a banner; the lodge logs, antlers, pelts, a bow; the church a round window and an
  empty belfry (the bell went for arrowheads in the siege); the Drowned Rat casks and a lamp; the forge a
  chimney stack that smokes and sparks, horseshoes, a quench barrel; the town hall notices, its banner,
  worn steps; the infirmary herbs under the eaves and a lamp.
- `tests/halls.test.ts` floods each hall from the door and checks everyone and the way out can be
  reached, and that each is the same every time with its own pieces.

## 2026-11-01: the quick channel, and each element a job (Kyle; Opus 5.5)

Kyle: the channel isn't much fun, and there's no reason to switch element unless goblins resist some
and fall to others. His call: give each element a job.

- **The channel is a quick switch** (`CHANNEL` in `shared/magic.ts`, `sim/channel.ts`): a tap turns
  the spells to the next element at once (fire, frost, storm), a short flourish, back in 1 s. No
  standing still. The reward for committing: the first spell after a turn is **primed**, x1.5 (more
  with the Mage's technique, now **FIRST SPELL**, +20% a rank, was QUICK CHANNEL). The skill button
  reads the element now (FIRE, FROST, STORM) in its colour, and the Mage's casting light and tip glow
  take that colour; a primed Mage has motes circling and a brighter light until the spell goes.
- **Each element's job**: fire burns and jumps further between goblins (`BURN.spread` 0.3 to 0.7),
  for crowds and spiders; frost slows feet and now wind-ups too (`FROST.windup` 0.6, locked in the
  attack's own clock so the telegraph fills at the judged pace), then freezes for a shatter, for the
  big and the quick; storm chains further and to more (3 within 3.8, 0.7 a jump) and goes round a
  shield's board, but a Mage's storm spell lands 0.8 on the first goblin.
- **One table for every foe** (`shared/weakness.ts`, read by `damage()` and the melee path): rows by
  variant, bow, named butcher (boss) or kind. Looters, drummers and spiders burn; lungers, butchers,
  bosses and the Stoker take frost hard (the Stoker shrugs fire, 0.6); brutes resist blades and frost
  a little; hexers and shield goblins fall to storm. Numbers 0.6 to 1.8 (the spiders' older 2.5 and
  the nest's 3 left as they were). **WEAK** pops in the colour of what landed it, **RESIST** small and
  grey, at most one per foe each half second (`WEAK_POP`), never on a burn's tick.
- Steam, shatter and flare unchanged; the three kits keep their shapes (wand sparks, staff orb, rod
  lance); relic augments go through the same table.
- `tests/elements.test.ts`: the switch and its cooldown, the primed spell, every table entry through
  `damage()`, the brute resisting a blade, the pop limit, storm round a shield, fire jumping a gap.

## Going down in a party, and a leader out of sight (2026-11-02, Claude Opus 5.5)
Kyle and a friend's first online job: Kyle died, the Cleric's smite didn't help (it doesn't heal;
every third mace blow does), the friend didn't know how to get him up, then the friend froze.
- Getting someone up is a button now: GRAB by a friend who's down (HELP UP on a phone, G on a
  laptop) kneels you there 2.5 s (a Cleric twice as quick). A hit, a swing or walking off stops it.
  Standing over them alone no longer does it.
- Nobody comes in 20 s: you get yourself up, once a job (`Hero.selfUp`, carried room to room).
  Raised by a friend, it isn't spent. The next time nobody comes, you're out till the job ends and
  the rest carry on (everyone out: the job is lost). The banner's heart in a party is that get-up.
- The freeze: the relay log shows the friend's game trying to take the job over at 2:15 in, refused
  because the leader's page still pinged. The leader's page had stopped drawing (out of sight), and
  the room only ran on drawn frames. Now a leader's room runs on a timer when the page is hidden,
  catching up in 0.1 s steps; and a refused takeover goes back to following the leader instead of
  running a copy of the job alone.
- Laptop grab key is G: the lesson and Hew's card said F.

## 2026-11-02: slower levels and loot, the knacks tree, class-true offers (Kyle; Claude Opus 5.5)

Kyle, after playing with friends: purple loot and levels came too fast; he liked picking one of two
on a level up and wants to see it grow as its own place; a Rogue was offered "on block" and "on parry".

- **Measured first** (a seeded sim of a typical hero's first jobs through the real room plans, bounty,
  drop, chest and treasure code; 40 seeds). Before: solo level 3 after one job, 5 after three, 10 after
  eight; about 24 Tolmouth (purple) pieces in 15 jobs, the first around job 2. A party of three reached
  level 10 in five jobs with 38 purple.
- **Levels** (`shared/progress.ts`): `xpFor` is now 250, 780, 1590, 2680, 4050... (12330 for 10), and
  kill, rescue and objective xp roughly halved. Solo: level 2 after one job, 3 after about four (the
  trainer's skill), 5 after about ten (the leave-behind), 6 at 15, about 9 at 30. Trainer ranks at
  2/4/6/8/10 land every few jobs. Saved heroes keep their level.
- **Parties** (`shared/pace.ts`, `jobXp`): a party fights more goblins and every kill paid everyone in
  full. Now the room's xp is shared for the party's size, plus 15% a player past the first: a party of
  three earns about 1.15 to 1.25 times a solo job. Gold is unchanged.
- **Loot** (`shared/gear.ts`): new odds; danger lifts a roll only as far as Forged (`LIFT_TO`), so
  Tolmouth and Hungry are found, never lifted into. Purple is 2% from chests and butchers, 10% from a
  named butcher (the treasure of long and deep jobs). Solo: about 2 purple in 15 jobs, 4 in 30, the
  first around job 6 or 7; a party of three about 3 in 15. Blue (Forged) is what deep jobs now pour out.
- **The tree** (`shared/perks.ts`, `shared/chains.ts`): four chains of three steps a class, BODY and
  BREATH shared, then its guard or its feet, then its trade. Warrior: GUARD, WEIGHT. Healer: GUARD,
  MERCY. Ranger: FEET (jump, parry, speed), BOW. Rogue: FEET, KNIFE. Mage: BLINK, SPELLS. A level up
  offers the next step of two different chains; 12 steps and 9 picks to level 10, so not everything.
  Every knack is a number the fight already reads: gear-named ones fold into `statsOf` with gear and
  drills; `knack(h, k)` for down, block, rear, bless, counter and winded.
- **Old heroes**: the old perk ids are steps on the chains, so they stay lit. One the class can't use
  (a Rogue's GUARD, a Warrior's FOOTWORK) comes back as a pick (`fitPerks`, run on load).
- **The screen** (`client/treeui.ts`, `tree.css`): KNACKS, the level bar, then a row per chain: taken
  steps gold and linked, the two on offer green and glowing, each chain's next step blue, later steps
  dim and dashed. Tap a step for its words. Opened from the pack (KNACKS, with a ! while a pick waits),
  from a job's end when you've grown (SEE KNACKS), and from the trainer, still the one place a pick is
  taken (my call: the trainer's lines and "find your trainer" stay true; one flag, `take`, to change).
- **Class-true offers** (Kyle: "the Rogue can only dodge"). Filtered, not swapped, for gear: PARRY
  needs a parry, GUARD a held block, DODGE a dodge button (`modFits`, used by rolls, rerolls and hungry
  pieces); RIPOSTE and BULWARK need a parry and SIDESTEP a dodge (`traitsFor`); REAPER reads "A backstab
  that kills heals you" for a class with no parry. Swapped for knacks: FOOTWORK says the class's own
  dodge (Dash, Jump, Blink), and the chains only hold what the class does. The item card and hero sheet
  hide PARRY WINDOW, THROUGH A BLOCK and DODGE EVERY for a class without them; the sword and spear lines
  and the armor lines no longer promise a Warrior a roll. Relics and augments had nothing to fix.
- `tests/knacks.test.ts` walks every class through 40 pick paths to the end of the tree, checking each
  offer is two chains' next steps and nothing the class can't do, and rolls gear, rerolls, hungry
  pieces and treasure for every class, and reads the trainer's rows for every class.
- New words (for the lore keeper and line editor): KNACKS button and title; SEE KNACKS, SEE THE TREE;
  chain names; the new knacks SCARRED, LONG WIND, COUNTERSTROKE, FLEET, SLIPPERY, HEFT, HEAVY HANDS,
  KEEN, LONG SHOT, QUICK HANDS, DEEP CHARGE, POTENT, MENDER with their lines; the tree's notes.
