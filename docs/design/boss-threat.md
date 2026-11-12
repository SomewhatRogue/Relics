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

Every damage and health number on screen times **10**: hits, heals, crits, gear, drills, perks, potions, the
recap. A hit reads 80 to 120, a crit 250, a boss 7000. **Built 2026-11-11 as a display scale** (`shared/shown.ts`
`SHOWN`, `shown(n)`): the room still decides in its small numbers and only what's shown is scaled. Scaling the
305 numbers where they're defined, with every chat adding more, was the riskier way to the same feel. One cost:
every shown number ends in 0; if that reads fake, the sim can carry finer damage later.
Any new line that shows health or damage goes through `shown`.

Fights stay the same length (Kyle approved the spec as suggested): speed comes from 3 and 4.

## 2. Control resistance (bosses and BIG ONEs)

- **Freeze:** a boss can be chilled (slowed) but freezes for at most 1 s, then can't be frozen again for 10 s.
- **Stuns:** a relic's stun on a boss lasts half as long, then the boss can't be stunned by anyone for 8 s.
  POISE staggers (the boss's own stagger bar) stay as they are: that's the skill reward. So do a fight's own
  forced knockdowns (the Brakesman's) and a last-second dodge's stagger. A BIG ONE's ordinary stuns follow
  the same rule, and one it shrugs off doesn't spend the hero's turn.
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

1. ~~The ×10 scale.~~ In (display scale).
2. ~~Control resistance.~~ In (shared/holdtune.ts BOSS_HOLD, sim/bosshold.ts; the ring in client/status.ts).
3. The Deep's two bosses: mobility and threat, with art. **The Haulier in (2026-11-11):** the LEAP at the hero
   furthest off (3.5 tiles or more; a striped circle where it lands, crouch, flight, dust), the CRANK (it hauls
   the gear's chain; striped circles under each hero, two more either side of one alone or two, sparks streaming
   off the wheel, then each spot burns 4 s), and in phase 2 the WRENCH straight after the overhead (a quick red
   wedge) plus a near-instant follow-up after a leap or an overhead. Rotations: phase 1 pick, overhead, pick,
   leap, shove, crank; phase 2 leap, pick, overhead, wrench, crank, drag, shove, pick (shared/haultune.ts,
   sim/haulier.ts, haulbook.ts, sparkshape.ts; client/haulpose.ts, hauldraw.ts, sparkdraw.ts, fxhaul.ts). Not
   built: backing off after a stagger. **The Doorkeepers in (2026-11-11), the Deep's and the Great Barn's alike:**
   the mover's VAULT at the hero furthest off (3.5 tiles or more; a striped circle, it flies door and all, its
   door open 0.8 s after it lands), the BASH straight after every sweep (0.45 s, red; the sweep's opening moved
   to after the bash), and ENRAGED the QUAKE (both doors driven down; three striped circles 1.7 tiles apart
   running at its hero, landing 0.22 s apart, a crack drawn out to them). Phase 2 lost its charge to keep Door
   Spin over half its big blows (Kyle, 2026-11-06). Not built: the pair swapping ends of the arena.
   (shared/bosstune.ts, sim/doorkeepers.ts, doorpair.ts, bossleap.ts, quakeshape.ts; client/doordraw.ts,
   quakedraw.ts, fxhaul.ts.)
4. The instances' bosses, by that chat.

## Already in (2026-11-11)

The Deep's goblins, not its bosses: wind-ups 10 to 30% quicker by band, shorter rests between blows,
and 25 to 70% harder hits (shared/deepbands.ts `edge`, sim/deepedge.ts). Boss health is unchanged.
