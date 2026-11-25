# Armor that breaks (plates for good)

Kyle, 2026-11-24, after the longbow talk: "Should be more shielded enemies where you have to break the armor... higher
health and/or an armor mechanic that can break, or crits just go through, could be fun and useful in general... I like
bleed going through too and some other stuff as well." Written by Claude Opus 5.5 (General chat). Kyle's picks (2026-11-24):
plates off for good; through: crits, bleed, poison, lightning, then "crossbow punches through plate too" and "holy
ignores it" (not backstabs or frost shatter); who wears it: all four below.

## Today

Plated: every ironhide and any Plated elite (sim/ironhide.ts). Until cracked, anything that lands does a fifth
(at least 1), bleed and poison ticks too. A charged blow, a perfect or any heavy hit (a burst, a crit) cracks it for
3 s of full damage, then the plates close again. A storm strike (the wand, the sky) cracks it too.

## Proposed

**A plate bar that runs out.** A plated goblin carries plate as well as health, drawn as a grey bar over the red.
- Ordinary blows: a fifth to health, the whole blow off the plate.
- Heavy blows (charged, perfect, a burst): land in full and take twice the blow off the plate.
- At no plate, the plates fall off for the rest of the fight (PLATES OFF, pieces on the floor). No more 3 s window.
- Plate: about half the goblin's health. A brute in plate is roughly a brute and a half to kill with quick hits, about a
  brute with heavy ones.

**Straight through the plate, in full** (Kyle's picks; shared/plate.ts THROUGH_SRC):
- crits, bleed, poison
- crossbow bolts
- anything holy (a smite: the Cleric's light, blessing, censer flare, the mace's smite)
- lightning (the storm wand, a storm blade, the sky's strikes), which strips the plate double too; a rod's strike,
  a column or a cart takes 40% of it off at once

Not through: backstabs, frost shatter, burns, ordinary arrows and taps.

**More of them as you level.**
- From level 3 a share of the big goblins (brutes, hulks, the big named ones) come in plate, rising with level (the way
  LEVEL_CROWD grows the room: shared/threat.ts).
- Plated elites roll more often.
- A plated goblin costs a little more of the room's budget, so rooms don't just get harder.
- Bosses: partial plate that comes off in pieces as you fight them (the Haulier's already does in phase 2).

## Building it (in slices)

1. **Rules** (done 2026-11-24): shared/plate.ts for the numbers; the plate bar in sim/ironhide.ts; sim/damage.ts lets the through list
   past. Tests. No drawing yet: the clank and the old crack look carry it.
2. **Who wears it** (done 2026-11-24; shared/plate.ts PLATE_WEAR): from level 3, 15% of the brutes and unnamed
   butchers come plated (5% more a level, at most half), each taking a small one from its pack (sim/run.ts); a rolled
   elite leads with Plated 40% of the time; plated goblins a quarter tougher; a hunt's named boss in a fury wears a
   third of its health in plate. A brute plated by level is a Plated elite, so it drops as one.
3. **Drawing** (done 2026-11-24, General, no art chat took it): a grey plate ring just outside the red health ring in
   the flat view (client/foes.ts), a grey bar over the red on the 2.5D box figures (client/three/overlay3d.ts), both
   emptying as the plate wears and gone once it's off (sim/ironhide.ts plateShare). Off for good: the old ARMOR
   BROKEN word, burst and clank (client/fxrush.ts, foesounds.ts), and the cracked look.
