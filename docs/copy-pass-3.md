# Copy pass 3: how we write and show things (November 2026)

Kyle, after reviewing about 100 lines: "Take my copy changes as general guidance and suggestions, not
specific one-to-one approval flows. We need to work on, in general, how we write and show things." His
style is `docs/lore/prose-notes.md` section 4 ("Kyle's style"). Every row this pass touched has a few words
in the `done` column of `docs/copy-inventory.csv` (318 rows).

## How things are shown now

One helper, `labelRows` in `src/client/card.ts`, draws every "label, a few words" table, in the same
style as the weapon card's TAP / HOLD / PERFECT. The label column is as wide as its widest label.

| Thing | Rows | Where |
|---|---|---|
| Weapon | TAP / HOLD / PERFECT / ALSO | item card, shop, legend (unchanged) |
| Trait | `NAME: effect` | item card |
| Modifier | `NAME +10%: effect` (just `HEALTH +10` when the name says it) | item card |
| Hungry gear | GIFT / COST, in red | item card |
| Potion | EFFECT / LASTS / USE | shop card, pack belt |
| Skill | USE / COOLDOWN / COST (cost until it's learned) | trainer |
| Relic | USE / CHARGE, SPARES FRIENDS tag | relic card (pack, church step, Ivo) |
| Job posting | WHERE / ROOMS / PAYS | job board |
| Job result | GOLD / XP / SAVED / LOST | result panel |

## The 15 most improved lines

| Where | Before | After |
|---|---|---|
| Relic card, javelin | A hard throw. It carries small goblins to the nearest wall and pins them there, and sticks in big ones. Every use spends one charge. | USE: Throw. Pins small goblins to a wall, sticks in big ones. CHARGE: 1 per use. The church recharges it. |
| Relic card, dark with an element | Out of charge (dark), and the church won't recharge a relic with an element. You can still give it up on the step, alone, or with another relic to get one back. | CHARGE: None left, and it can't be recharged. Give it up at the church. |
| Hungry gear, Skarn's Cleaver | Heals from anyone else don't work on you, including blessed ground, the mace and the ward. | COST: Nobody else's heals work on you. |
| Hungry gear, Ransom Coat | You can't give gold at the Lantern while you wear it, and if you're driven back you lose all your gold, not half. | COST: Can't give gold at the Lantern. Driven back, you lose all your gold, not half. |
| Potion, Wall Brandy | Doubles your damage, but halves your speed and the size of your stamina bar. | EFFECT: Double damage. Half speed, half stamina. LASTS: 6 s |
| Tutorial, grab | Grab a crate or a barrel, then grab again to throw it. You can also grab a small goblin from behind, while it reels, or while it's busy feeding or swinging. Whatever you throw hurts whatever it hits. | Grab a crate or barrel, grab again to throw. Small goblins too: from behind, or while they reel, feed or swing. What you throw hurts what it hits. |
| Knack, WIDE LAST SECOND (now LATE DASH) | A dash just as a blow lands (a LAST SECOND) leaves the goblin reeling. You get 0.08 s longer to make one | LATE DASH: Last-second dash (just as a blow lands) 0.08 s easier to time |
| Knack, PRIMED POWER | Your primed spell (the first after you change element) does 25% more damage | Primed spells do 25% more damage |
| Skill, Sanctuary | Blesses the ground at your feet, which heals friends and burns goblins, and puts a ward on whoever is most hurt. | USE: Bless the ground around you: heals friends, burns goblins. Wards whoever is most hurt. COOLDOWN: 20 s |
| Forge, Halvard | Spares in the fire. Steel and gold for the rest. | Melt your spares for steel. Steel and gold buys an upgrade. |
| Tobin | I'll buy it, whatever it is, and if you want it back it's yours at what I paid, so long as you're not out the gate and home again first. After that it's mine, and I'm not sentimental. (and the same rule again under it) | I'll buy it, whatever it is. Want it back, come quick. I'm not sentimental. (the rule, once: Buy back anything you sold, at the price he paid, until you're home from your next job.) |
| Tutorial, the dodge lesson | A red mark with a striped edge can't be blocked. Roll out of it just before it lands. (said "roll" to a Ranger, Rogue and Mage) | Red with a striped edge can't be blocked. Dodge out before it lands. |
| Job board, deep job | Five rooms down through X, the worst of it, and SKARN at the bottom. The big ones carry relics in them. Cut it out of SKARN and it's yours. | Five rooms down through X, the worst of it, and SKARN at the bottom with a relic grown into it. Kill it and the relic is yours. |
| Church, Odric | Give what you can spare. Then a little of what you can't. That's the part it burns. | Give what you can spare to the Lantern. It keeps the light burning, and it does the giver good, more than you'd think. |
| Hew's last words | Get the count to Odric, stray, Father Odric, he'll be wanting it. | Get my tally stick to Odric, stray, Father Odric! It's every one I burned, he'll be wanting it. |

## Explain once

- Tips that repeated the BUTTONS legend or the weapon card are gone (parry timing, hold to charge, the
  crossbow's glint, the Cleric's Sanctuary). The tutorial's FULL SHOT lesson now says what a PERFECT is
  (let go on the white flash); the cards and knacks just say PERFECT.
- Tobin's buy-back rule is said once (his line no longer repeats it). The town works' "worth 50% more
  than Tobin pays" is one line used in both places.
- The relic card's CHARGE row says whether the church recharges it, so the church's own intro is the
  only other place that says so.

## One word for one thing (checked)

STAMINA (MAGIC for a Mage, through `barWords`); "the red flashes white" for every parry cue; "the white
flash" only for a hold's release; PERFECT; DODGE in game text (the class's own ROLL, JUMP, DASH or BLINK
on its button); KNOCKBACK for the modifier and the knack; "refills" for stamina and magic coming back;
"armor", never "armour". No shard, sliver, crown, Want or mercy on screen.

## Questions for Kyle

1. **POWER is now STRENGTH at the trainer too**, to match your class card rating. Both mean "+damage". OK,
   or should the trainer's rank say DAMAGE?
2. **Rogue line vs the dagger card.** Your Rogue line says "twice as strong from behind"; the daggers'
   card (and the sim) say 2.5x. Change your line to "2.5x from behind", or keep "twice" as a round word?
3. **Ranger guard: "Perfect parry timing required."** PERFECT is now the word for a hold let go on the
   white flash. Would "Exact parry timing required" read better, so the two don't blur?
4. **The wedding ring's cost: "Changes you faster than any other hungry gear."** The thing it changes is
   the Want, which stays off screen. Is that clear enough, or should it say something you can see (the
   eyes)?
5. **Odric and the Lantern.** Giving gold only lowers the hidden Want. His line now says it "does the
   giver good". Plain enough, or too much of a hint?
6. **LOUD relics.** The LOUD tag is gone from the card (the name still says LOUD; it only means more
   charge, 48 against 24). Rename LOUD to something that says that (GREATER?), or keep it?
7. **"Wreathe" is now "enchant"** on the spellblade's HOLD and PERFECT rows. OK?
8. **The 2 s on the Bitter.** It's a heal over 2 s, shown as LASTS 2 s. Fine, or leave LASTS off a heal?
9. **Dialogue cuts.** I took out lines a first read would miss: Odric's "That's the part it burns", Hob's
   "tallyman", the card sharp's riddle about Whisper (now: Whisper trains rogues), Alder Bram's "somebody
   with teeth", Pike's "Lamps you can buy", Vell's "the relic says so", the well's "a coin kept, not
   given", and the hunt notice's "bring back something to prove it". Any you want back?
10. **Not run:** the lore-keeper and line-editor passes (this pass had no way to call them). The new
    lines are for them to look at.
