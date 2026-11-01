# DECISIONS

Newest first. Each entry says what was decided and why, signed with the model.

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
