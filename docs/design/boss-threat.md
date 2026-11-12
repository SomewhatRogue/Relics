# Bosses that threaten

Kyle, 2026-11-11, after a Deep run: "it feels punishing. I'm fine with bosses being strong and having
phases, but let my numbers be big but its health is bigger. Also different abilities that are actually
threatening. More mobility, immunity to freeze or mass stun more than once per x seconds."

Today a hero's hit is 8 to 12 against a Haulier's 700 health, so a boss fight is about seventy small numbers.
Its blows are slow and readable, so you roll away from everything. Freeze lands on a boss like any
goblin (sim/elements.ts), and a relic's stun always lands in full (sim/stuns.ts relicStun), so a party can
lock it down. Hard should mean it hits you; long and safe isn't hard.

Applies to every boss: the Deep's (the Haulier, the Doorkeepers), the instances' (Rakehead's Open Cut), the
butchers and the BIG ONEs.

## 1. Big numbers (one scale, the whole game)

Every damage number and every health bar times **10**: heroes, goblins, bosses, potions, armor, the lot.
Fights last as long as they did; a hit reads 80 to 120, a crit 250, a boss bar 7000. One constant
(`SCALE` in shared/tuning.ts) applied where numbers are defined, so a drawn number and a decided one stay
one source. Old saves: gear rolls are stored as percents and tiers, so nothing to migrate (to check).

Open: also make boss fights **shorter**, keeping the ×10? (Suggested: no. Speed comes from 3 and 4.)

## 2. Control resistance (bosses and BIG ONEs)

- **Freeze:** a boss can be chilled (slowed) but freezes for at most 1 s, then can't be frozen again for 10 s.
- **Stuns:** a relic's stun on a boss lasts half as long, then the boss can't be stunned by anyone for 8 s.
  POISE staggers (the boss's own stagger bar) stay as they are: that's the skill reward.
- An immune boss shows it: a pale ring at its feet while it can't be held, and SHRUG over it when it shrugs off a hold.

## 3. Mobility

Each boss gets a way to close or open distance, so standing at range or behind it isn't safe:
- a **leap** onto the hero furthest away (red circle where it lands, about 0.9 s);
- a **charge** across the arena (striped lane, about 1 s), turning once if it phases;
- after a POISE stagger it **backs off** and starts its next move from range.

## 4. Abilities that actually threaten

Two kinds each boss needs, beyond a swing you roll away from:
- **Area denial:** something that takes floor away for a while (oil set alight, falling rock, a cart run
  down the rail), so you have to move and dodging into the wrong place hurts.
- **A punish:** a quick follow-up after its big blow (a second swing 0.4 s later), so a roll at the
  last moment isn't free; and a grab or pin on a hero who stays in close too long.
- **Phases** sharpen this: past half health, moves chain two at a time.

First pass per boss (each with its art and animation, Kyle 2026-11-08):
- **The Haulier:** charge down the rail with its cart; the gear's turn throws sparks that burn the floor.
- **The Doorkeepers:** one leaps while the other holds the door; enraged, they swap ends of the arena.
- **The instances' bosses:** the instances chat's call, to these rules.

## Build order

1. The ×10 scale (one change, every test's numbers with it).
2. Control resistance.
3. The Deep's two bosses: mobility and threat, with art.
4. The instances' bosses, by that chat.

## Already in (2026-11-11)

The Deep's goblins, not its bosses: wind-ups 10 to 30% quicker by band, shorter rests between blows,
and 25 to 70% harder hits (shared/deepbands.ts `edge`, sim/deepedge.ts). Boss health is unchanged.
