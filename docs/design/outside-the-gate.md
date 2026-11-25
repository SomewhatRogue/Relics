# Outside the gate: the land you walk into

Kyle, 2026-11-24: "One long map might work for SOME of them. Maybe we have a different type between missions and
then we slowly begin working out a long map and maps that you can access by just going out of the gate, and we start
adding in some missions around killing things and acquiring materials and doing quests out there."

With docs/design/biome-sets.md (the look of it: a landmark a biome, echoes, drawn seams, views off the map's edge)
and docs/design/territories.md (the kit it stands on, and the people out on the land with jobs of their own).

## Three kinds of ground

1. **Town.** Wickhold, as now.
2. **Missions off the board.** As now, and of several types on purpose: a short job of rooms, a boss's arena, an
   instance, a territory, and for some of them one long map with no gates. A mission's type is part of what makes
   it that mission; none is being replaced.
3. **The land.** You walk out of the North Gate and you are in it. No board, no posting, no shut gate between its
   parts. It is grown a map at a time and the maps are stitched: you walk off the end of one into the next.

## The land's first map: the Gate Fields

- **In:** through the North Gate (shared/town.ts, the spot `gate`). **Out:** walk back in at the gate.
- **The ground:** about 56 by 96. The road north from the gate through the town's common fields and the first
  hedged strips, rougher pasture, then the seam into the wood's edge at the far end with the great oak in sight
  over the trees. A view off the east side, out over the river plain.
- **On the kit there is:** a territory's room (sim/landroom.ts): zones that wake as you come near and doze behind
  you, real heights, the road as the spine. Nothing new in the fight.
- **By stretch:** each stretch has its own enemy kinds, and one holds something that comes out at you (a pack from
  a den in the hedge) where a gate would have stood.

## What you do out there

- **Kill things.** Packs that keep to their stretch; a named one now and then. Bounties posted at the gate: bring
  back proof, be paid.
- **Gather.** Materials from the land itself (herbs, timber, stone) and off what you kill (hide, bone). What they
  are for is the Economy and Gear chats' to say; out here they are things to find, with places they are found.
- **Quests.** People on the land with a job of their own (territories.md, "Mini quests"), and errands from town
  that send you out (docs/design/town-quests.md).

## Falling, and way stations (Kyle, 2026-11-24)

"When you're out on the map you only get 1 self revive (unlimited friend pick ups) but there's some way stations
around that you can teleport back to base and/or to them, like a safe zone with maybe a merchant or someone who
sells healing potions or a relic recharge."

- **One self revive a trip out.** Down once and you get yourself up; down again and only a friend can lift you.
  Friends may lift you as often as they reach you. It comes back when you rest at a way station or in town.
- **Way stations.** A few on each map of the land, a walk apart: a fire, a palisade, somebody keeping it. Inside
  is safe ground: nothing follows you in. Found by walking to it; once found it is yours to travel to.
- **Travel.** From a way station: back to Wickhold, or to any other you have found. From Wickhold's gate: out to
  any you have found. So a long walk is walked once.
- **Who is there.** One keeper a station, not a town: healing potions at most, a plain relic's recharge at some
  (the church's rule and price, shared/church.ts), a bounty to hand in at a few. Each station has its own person.
- **Drawn as the biome's.** A station is one of its set's echoes grown up (biome-sets.md): a charcoal burner's
  hut in the wood, an eel catcher's staithe in the fen, a field barn.

## Built so far (2026-11-24)

Kyle: "build it here but use subagents to accomplish it and be the ultimate reviewer making sure we're using
appropriate art, scenes, and enemy types to keep it varied and fun and interesting but on theme."

- **The name.** The lore keeper: this ground is already "the north fields" in the story (Bram's line, the vote).
  The map is THE NORTH FIELDS; its parts keep their names (the Gate Road, the Common Strips, the Field Barn, the
  Rough Pasture, the Wood's Edge). The files keep `gatefields`.
- **On screen a way station is a "shelter"**, never a "way station" (the lore keeper: a road word, and nothing comes
  into Wickhold by road). Why nothing follows you in stays unsaid.
- **The map** (shared/gatefields*.ts, 56 by 96, no gates): the refugees' camp under their carts outside the wall
  (people, tents, fires, no goblins); the strips gone back, thin barley coming up on its own; the Field Barn; the
  pasture; the wood's edge. Nothing hostile till the far end of the strips. Enemy kinds by stretch: goblins with
  farm tools, a thief and an archer in the crop; a wolf-keeper and wolves, and a den four break out of; a spider
  nest, a snarer and a netter. Each stretch draws its own country (`map.grounds`; biome-sets.md).
- **Out and back** (client/townui.ts, gatewalk.ts): GO OUT at the North Gate, alone or with a party gathered as the
  board does it; the banner shows the place and the part you stand in, no objective; GO IN or STAY OUT when you walk
  back to the gate; in is a plain return, nothing lost, standing at the gate.
- **Falling and resting** (sim/landrules.ts): one self revive a trip; friends lift without limit; with nobody left
  the party wakes at the last shelter rested at, or the gate; two seconds in a shelter is a rest; no goblin enters
  one, and one pressing at you there gives up and walks home.

- **The camp's watch** (Kyle, 2026-11-24: "maybe the camp has some guards that can wreck any goblins that have
  followed you in"; sim/campguard.ts, `map.guards`): three of the town's guard stand at posts, two at the gate and
  one where the road leaves the camp, and shoot any goblin that comes within nine tiles: a bolt every 1.4 seconds a
  post, about a third of its health each, so a pack that follows you in is dead in a few seconds. Never a boss or a
  nest. What the watch fells pays nothing (no experience, coin, drop or kill), even if you had hurt it first, so the
  camp is a refuge and not a way to farm.

- **Friends on one map** (Kyle, 2026-11-24: "map never being sent might cause issues with seeing your friend morph
  through trees ... let's make sure we avoid those bugs"). A big map is built on each screen from the seed and
  never sent. Now the leader says its map's fingerprint (shared/mapsum.ts: everything that decides where a body can
  stand) with each whole room; a friend whose own differs asks, the leader sends its map once, and the friend
  rebuilds on it (client/coop.ts). An honest pair sends nothing more than the one number.
- **The loading page** (Kyle: "fine having a bit longer on initial load and we have a 'lore' page that says people
  are still loading in"; client/loadpage.ts): the place's name and one thing heard in Wickhold (the approved
  rumours), up before the map is built, the fight held still under it, lifted when the map is drawn and a second
  and a half has gone; in a party it names who is still coming and everyone's lifts together (or after 15 seconds).
  At a job's start, and whenever a run moves on to a big map.

- **The guard, and the trainer's word** (Kyle, 2026-11-24: "marked that you CAN go out there, don't let people out
  until level 3 maybe (guard at the gate stops you) and you get a quest at 3 from your main trainer to go out and
  get a thing or go to a spot"). Under level 3 the gate's panel has no GO OUT: the guard will not let you out
  without a job (`GATE_LEVEL`, `canGoOut`, shared/gatefieldsquest.ts). From 3 your own trainer has a quest waiting
  (their door is marked): go out the North Gate and rest at the Field Barn. The gate carries the gold mark while it
  is in hand, resting at the barn pays 40 copper on the spot, and the trainer hears of it after (the errand
  `fields` in shared/errands.ts, on the yard's pattern). After that the gate's prompt reads NORTH GATE: GO OUT;
  there is no standing gold mark, since gold in town means someone has something for you and the edge arrow would
  point at the gate for good. A friend under 3 gathered into a party may still go. The lore keeper: nobody says
  this is a first time outside the walls, since jobs went out the north gate before it.

- **The shelter's keeper** (Kyle, 2026-11-24: "a merchant or someone who sells healing potions or a relic recharge").
  At the Field Barn's fire: TALK: KEEPER, and her panel sells Sister's Bitter at the town's price, recharges the relic
  you carry at the church's (not an element's: those are Ivo's, as at the church), and HOME TO WICKHOLD takes you
  straight in. The room does the buying (sim/pack.ts `GEAR.buy`, `GEAR.refill`, only inside a station's ring on a
  roaming land; the `bought` event takes the coin off the save, a guest's too). On the HUD a lone hero on the land
  now has one heart, not three, and RESTED floats over you when you rest. For the lore keeper's bible: she is a
  second place to recharge a relic (the bible has the church only) and a second seller of the Bitter (Agne only);
  what she does stays unsaid, as for Isolde.

- **The second shelter, and travel** (Kyle, 2026-11-24: "teleport back to base and/or to them"). THE CHARCOAL HUT
  at the wood's edge (33, 22.5, east of the road): a burner's hut, a fire, woodpiles, and the charcoal clamp, a
  turf dome drawn the tile way (client/tileclamp.ts, block kind `clamp`), and its own keeper with her own line.
  The lore keeper: this wood is not Greyhollow, and the hut is not Hew's. A shelter is found by resting in it
  (`Profile.shelters`); a keeper offers TO each other found shelter on the map (sim/travel.ts, `GEAR.travel`: the room
  moves you and snaps you, so you are not seen sliding), and the North Gate offers OUT TO each found one, alone
  (`Job.at`: the run starts in its ring and a fall wakes you there). The way back in is still watched at the gate.

Not yet: the view off the east side; bounties, materials, quests; the wood beyond the far end.

**The second map, THE FEN** (2026-11-25): walked on into off the north fields' far end, back out its south edge to
that far end; its own shelter, THE EEL STAITHE, its own bounties from level 6. See docs/design/the-fen.md.

## Bounties: the first slice (2026-11-24)

- **Posted at the North Gate**, from level 3: two a day out of a short list for the north fields, picked by the day
  (shared/bounties.ts). Each names something that lives out there by its pack: the wolves of the Rough Pasture
  (405), the den's pouncers (406), the spiders' nest (407, the nest itself), the raiders in the Common Strips (402 to
  404), the snarers at the wood's edge (408). TAKE puts it in hand; two at most.
- **Counted on the land**: a death in a roaming room whose body was of a pack (and kind, where it says) in a bounty
  you hold adds one, whoever struck, so a party hunts together. Across trips: what you killed stays counted. The
  goal line shows it (3 of 4).
- **Handed in at the gate or at any shelter's keeper** once the count is made: paid in copper and experience, then
  gone from your hand; a new one can be taken the next day. Who posts them and what proof is asked for is the lore
  keeper's to word.
- **Built** (2026-11-24): shared/bounties.ts (five: the wolves 5, the den 4, the nest 1, the raiders 8, the snarers 4;
  40 to 70 copper, 60 to 120 experience), client/bountyui.ts and bountywords.ts, `Profile.bounties`. The lore keeper:
  the watch posts them and pays by the head, on your word (the old head wages, story-bible.md "The Night Watch");
  never "keeper" for the one that runs the wolves. The count shows in the land's banner beside the place name. Coin
  paid at a keeper goes to the save at once; the room's purse is taken when you set out, so it is spendable from the
  next trip.
- **Not yet**: named ones; materials (what they are for is Kyle's call, with Economy and Gear); bounties for other
  maps.

## Order

1. The Gate Fields, walkable from the gate and back, enemies by stretch, the set and the seam drawn; one way
   station, with the self revive and the travel.
2. Bounties and the first materials.
3. A second map stitched to its far end: the wood.
4. Quests out there. Then a map at a time.

## Who

A new chat, "The land" (a big new topic: CLAUDE.md section 4). It builds on Territories' kit and asks that chat
first; materials go through Economy and Gear, quests through Town quests; the Graphics sweep draws it (looks, sets,
seams, views).

## Open, for Kyle

- What happens when the self revive is spent and you fall with nobody to lift you. Proposed: you wake at the last
  way station you rested at (the gate if none), with what you carried, and what you had gathered since that rest is
  left where you fell to walk back for.
- Whether other players are seen out there as they are in town, or it is your party only. Proposed: your party
  only at first, as on a job.
- Whether fallen enemies are back when you next walk out, or stay down for the day.
