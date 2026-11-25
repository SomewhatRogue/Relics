# Armor that breaks (plates for good)

Kyle, 2026-11-24, after the longbow talk: "Should be more shielded enemies where you have to break the armor... higher
health and/or an armor mechanic that can break, or crits just go through, could be fun and useful in general... I like
bleed going through too and some other stuff as well." Written by Claude Opus 5.5 (General chat). Waiting on Kyle's
picks below before building.

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

**Straight through the plate, in full** (Kyle's two marked, the rest proposed):
- crits (Kyle)
- bleed (Kyle)
- poison (in the blood like bleed)
- lightning: the storm wand and the sky's strikes, which also strip plate double (iron draws it)
- backstabs (the plates are on the front)
- the Mage's frost shatter (it breaks the ice and the iron with it)

Not through: burns (they still burn half as long on iron), ordinary arrows and taps.

**More of them as you level.**
- From level 3 a share of the big goblins (brutes, hulks, the big named ones) come in plate, rising with level (the way
  LEVEL_CROWD grows the room: shared/threat.ts).
- Plated elites roll more often.
- A plated goblin costs a little more of the room's budget, so rooms don't just get harder.
- Bosses: partial plate that comes off in pieces as you fight them (the Haulier's already does in phase 2).

## Building it (in slices)

1. **Rules:** shared/plate.ts for the numbers; the plate bar in sim/ironhide.ts; sim/damage.ts lets the through list
   past. Tests. No drawing yet: the clank and the old crack look carry it.
2. **Who wears it:** level share, elites, budget cost, boss plate. Tests and re-pinned layouts.
3. **Drawing:** the grey bar, plates falling off, a PLATES OFF word, in both views. Asked of the Art and Graphics chats
   on the board, or drawn here if they're idle.
