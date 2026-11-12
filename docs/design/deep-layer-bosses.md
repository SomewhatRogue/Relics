# The Deep's layer bosses

Kyle, 2026-11-12: "lets think of thematic other bosses and attacks or environmental plays and loot." Each of
the Deep's layers below the drains gets its own boss, fought in a room built from that place. Names and who
they are: lore keeper, 2026-11-12. Status: Kyle's yes 2026-11-12; **THE LISTENER built** (2026-11-12), the other three to come.

## Rules for all four

- **The place's trick works for every class** with plain actions: hit, GRAB and throw, walk. (Kyle's lesson
  from the Haulier: carts are the fun; lightning at the gear only helps storm heroes.)
- **Built like the Haulier and the Doorkeepers.** Boss-threat rules: big numbers, hard hits, held only briefly
  by freezes and stuns, a leap or a charge to reach the back line, a punish after the big blow, area denial,
  phase 2 chaining. Every move has its pose first, then its floor (red, or striped when you can't block it).
- **None is a butcher.** On screen never "butcher", "named" or "hunt". Its pieces are what the town lost, gone
  down: not hungry gear.
- **Where they stand:** floor 5 stays the drains' (the Haulier or the Doorkeepers, in turn). Each layer's own
  boss holds its fifth floor: 10 THE LISTENER, 15 THE LEECHMAN, 20 THE HEDGER, 25 THE HOUSEBREAKER, then round
  again, deeper and harder (shared/deepbands.ts).
- **Loot:** a pool of three uniques each (shared/uniques.ts), one piece for the whole party, Need, Greed or
  Pass, as now.

## 1. Old caves: THE LISTENER (floor 10) (built)

Built in THE DRIPSTONE CAVE: shared/listentune.ts, cavearena.ts; sim/listener.ts, listenbook.ts, listennoise.ts,
columns.ts, columnshape.ts; client/listendraw.ts, listenpose.ts, listenlie.ts, cavedraw.ts, columndraw.ts,
fxlisten.ts; tests/listener.test.ts, listencolumn.test.ts; scripts/listen-look.cjs. A Warrior's taunt is the
loudest noise there is. Columns fade when someone stands behind them. Loot: THE HUSHED MAUL, DAMP MAIL, A
DRIPSTONE RING.

A huge goblin gone blind in the caves' dark, its eyes still shining but white and no use to it. It hunts by
the sound of feet and steel.

- **The room:** a cave with holes in its floor (three or four), dripstone columns, a few torches.
- **Hunting by sound:** it goes for whoever made the most noise lately (attacking, rolling, running; standing
  still or creeping is quiet). Its sight is nothing; the party's own noise is its aim.
- **Moves:** DROP AND RISE (into one floor hole, up out of the one nearest the loudest hero: a striped circle
  there, then it bursts out); ROCK (breaks a lump off the wall and throws it: a red circle where it lands,
  blockable); SWEEP (a wide red arc round it, quick, after it rises: the punish); CHARGE at a sound across the room.
- **The place's trick:** cracked dripstone columns. Hit one (or throw something at it) and it falls the way it
  leans: a striped lane. If it lands on THE LISTENER it's down for a while, plate-cracked like a cart hit (the
  same knockdown cooldown). Everyone can do it; timing it is the skill.
- **Phase 2:** it knocks the torches out. The room goes near-dark (lamp-lit round each hero only); the dark
  costs it nothing.
- **BLINDED:** does nothing to it (Kyle, 2026-11-12: "nope nothing"); it's already blind, and a line says so.
- **Loot:** cave-damp steel the dark kept, heavy and quiet: e.g. a hammer whose hits make no sound, boots for
  creeping, a helm that keeps goblins' notice off you.

## 2. Drowned fen: THE LEECHMAN (floor 15)

A goblin that keeps to the shallows and reed beds, hung with leeches it lets fasten on itself. It pulls heroes
in on a line.

- **The room:** reed beds, shallow water (slows you), deep channels (no one crosses, it neither), peat banks,
  and an old windlass at one side.
- **Moves:** THE LINE (a thrown line along a narrow red lane: caught, you're hauled to it; block or roll it);
  LEECHES (it flings them: they latch on and drain health till you roll); PEAT BANK (heaves a bank down on a
  striped lane, leaving mud that slows); WADE (it strides through shallows fast, slow on dry ground).
- **The place's trick:** the windlass. GRAB it and keep turning (stand by it, it turns while held) to drain the
  shallows: the room's water drops to mud, and THE LEECHMAN, knee-deep, is slowed and can't use THE LINE
  for a while. It goes for whoever's on the windlass, so the party covers them.
- **Phase 2:** the water rises; it lays logs across the deep channels to reach you (as the hungry do), and
  heroes can hit a log off (it falls in the water, and so does it, if on it).
- **Loot:** fen-black leather and stitched gear, lost and somehow dry: e.g. waders (no slowing in water or mud),
  a line-and-hook sling that pulls a goblin to you, a jerkin leeches can't fasten on.

## 3. Buried wood: THE HEDGER (floor 20)

A goblin that has hung its hoard in the dead tree at the room's middle and won't stray far from it. It lays
thorn across the floor the way a hedger lays a hedge.

- **The room:** a glade round a great dead tree, the hoard hanging from it on three ropes, leaf mould, and the
  hungry's fire baskets (braziers) at the edges.
- **Moves:** THORN LINES (it hauls up roots it has run under the leaf mould: striped lines racing out at heroes);
  THORN HEDGE (lays a hedge across the floor, splitting the room for a while); SNARE (a thorn snare thrown at a
  hero: caught, you're held a moment; others hit it free); SLASH (billhook, red arc, quick).
- **The place's trick:** two of them. Tip a fire basket (hit it over, or GRAB and throw it) onto a hedge and
  the thorn burns, and so does THE HEDGER if it's in it. And cut the three ropes (hit them): the hoard comes
  down, and phase 2 begins.
- **Phase 2:** its hoard on the ground, it leaves the tree and comes after whoever cut the last rope: faster,
  thorn lines two at a time.
- **Loot:** dead-wood hafts and thorn-scored gear, light and dry: e.g. a billhook, a staff whose shots leave
  thorns where they land, a coat that scratches what hits you.

## 4. Buried street: THE HOUSEBREAKER (floor 25)

A goblin as broad as a doorway that goes through the sunk houses' walls rather than round them, and brings
the roofs down behind it. It goes for whoever stands in the open street.

- **The room:** a sunk street between broken houses (rooms you can step into through doorways), timber
  everywhere, and the hungry's oil hoard in kegs along the street.
- **Moves:** BREAK THROUGH (a charge through a house wall at a hero in the open street: a striped lane, the
  wall and the roof behind it come down as rubble); ROOF (pulls a sagging roof down onto a doorway: a striped
  box); SHOULDER (short knockback blow, red); THROW (a keg or a beam, red circle).
- **Hiding in doorways:** a hero inside a house isn't charged; the roof move is how it gets them out.
- **The place's trick:** the oil kegs. GRAB and throw one, or hit it where it stands, and it bursts in flame:
  on THE HOUSEBREAKER it burns and staggers it.
- **Phase 2:** the street's timber catches from the spilled oil: fire runs along the houses, the safe ground
  shrinks, and it breaks walls twice as often.
- **Loot:** pre-war town steel, soot-blacked and still sharp: e.g. a crowbar mace, a door-plank shield, a
  smith's apron that shrugs off fire.

## What it reuses (so each is a slice, not a rewrite)

Boss kit and books (sim/bosskit.ts, haulbook.ts); leaps and their landing (sim/bossleap.ts); shapes judged and
drawn from one source (sparkshape.ts, quakeshape.ts, cartpath.ts); burning floor (sim/oil.ts lit slicks);
GRAB and throw (sim/haulcarts.ts); knockdown cooldowns (bosshold.ts); dark rooms (the deepwood light); shallow
and deep water (the fen country); props that break (sim/props.ts). New in each: its arena, its book, its art.

## Build order (suggested)

1. THE LISTENER first: floor 10 is the first new boss players reach, and the dripstone trick is a near cousin
   of the cart.
2. THE LEECHMAN, 3. THE HEDGER, 4. THE HOUSEBREAKER, each its own slice with its art, sent to Kyle to play
   before the next.
