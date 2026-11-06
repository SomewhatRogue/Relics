/**
 * The fight room. Owns every hero and enemy and advances them in fixed ticks; it never knows about
 * sockets or screens. Solo, it runs in this browser; online, it runs in the party leader's browser
 * (the Come Bye host model) and friends send it Intents.
 */
import { fireSign } from './signature';
import { stepSmoke } from './smokebomb';
import { ARENA, useMap, type GameMap } from '../shared/arena';
import type { Foe } from '../shared/terrain';
import type { PropKind } from '../shared/props';
import { Rng } from '../shared/rng';
import { BLESSING, GUARD, SLEEP, HEAL_RADIUS, HEIGHT, HERO, EXPED_COINS, LODESTONE, MACE, TICK, TRAIT, WEAPONS, type Swing, VARIANTS } from '../shared/tuning';
import { separate } from './bodies';
import { lobLodestone, shoot, smite, stepBolt, throwNet } from './bolts';
import { afflict, stepElements, type World } from './elements';
import { skewer, stepVenom } from './venom';
import { stepBuildings, sweepBlocks } from './buildings';
import { rouse } from './backline';
import { newEnemy, stepEnemy } from './enemies';
import { currentSwing, newHero, stepHero, type HeroActs } from './hero';
import { damage, isDead } from './damage';
import { HUNGRY_FX, onKill, stepHungry, wears } from './hungry';
import { newChest, startChest, stepChests, type Chest } from './chests';
import { stepFlask, stepPotions, usePotion, type Smoke } from './flasks';
import { dropPickups, dropRelic, stepPickups, type Pickup } from './pickups';
import { dropCoal, stepCoals, type Coal } from './lantern';
import { censerSwing, stepEmbers } from './censer';
import { mend, shieldNear } from './holy';
import { impacts } from './impacts';
import { stepSleds } from './iceslide';
import { release, stepCarry, tryGrab } from './grab';
import { startBash, stepBash } from './bash';
import { dropProp, newProp, propImpacts, roomProps, stepLift, stepProps, sweepProps, tryLift } from './props';
import { startRaise, stepParty, sweepAllies } from './party';
import { stepSurvivors } from './survivors';
import { stepFalse } from './falsecage';
import { ambush } from './ambush';
import { packOnto } from './packs';
import { afterFoes, beforeFoes, beforeHeroes, shapeFoe } from './ownfoes';
import { newRushes, stepRushes, type Rushes } from './packrush';
import { slipIntent, type Slick } from './oil';
import { newFlocks, type Flock } from './crows';
import { OWN_KIT } from './enemies';
import { stepBlaze, type BlazeState } from './blaze';
import { sweepSurvivors } from './survivorhits';
import { dropFrom, stepDrops, takeLoot } from './loot';
import { hallow, rally, shadowstep, stepZones, ward } from './relics';
import { castElement, spendPrimed, turnElement } from './channel';
import { castTap } from './spellbook';
import { stepStreams, streams } from './stream';
import { stepSkyStrikes } from './skystrike';
import { castHold } from './holds';
import { statsOf } from './gearstats';
import { stepRings } from './staffrings';
import { stepWalls } from './firewall';
import { stepRush } from './rush';
import { grasp } from './grasp';
import { bladeStruck, looseBlade } from './spellblade';
import { fireSkill, stepSkills } from './skills';
import { forgedElement, has, traitsOf } from './traits';
import { fireHook, stepHook } from './hook';
import { stepJavelin, throwJavelin } from './javelin';
import { laySnare, stepHound, stepSnare } from './ranger';
import { burstMult, healOf, healReach, perfectMult, smiteStun } from './knacks';
import { stepNests } from './spiders';
import { startTorch, stepTorch } from './torch';
import { startKindle, stepKindle } from './kindle';
import { initScenes, stepScenes } from './scenes';
import { stepHouseFires, type HouseFire, type Indoors } from './houseburn';
import { stepPoison } from './poison';
import { stepPuddles } from './puddles';
import { brandyDmg } from './brandy';
import { litMult } from './charge';
import { fireFound, stepSentries } from './foundrelics';
import { grow } from './grow';
import { awake, merge } from './sleep';
import { NO_INTENT, type Ice, type Puddle, type Strike, type Zone, type Bolt, type Drop, type Enemy, type Prop, type FightEvent, type Hero, type Hook, type Intent, type Javelin, type Snare, type Survivor } from './types';
import { stun } from './stuns';
import { stepDread, type DreadRule } from './dread';
import { stepExped, type ExpedState } from './exped';
import { rogueStruck } from './techrogue';
import { aimed } from './techranger';
import { followGround, stepGround } from './techcleric';
import { stepStorm } from './storm';
import { stepLadder } from './ladder';
import { useBoard, type Board } from './score';
import { stepIce } from './ice';
import { mealWatch } from './meal';
import { stepSteam } from './steam';
import { stepWorldFire } from './worldfire';

export class ArenaRoom {
  time = 0;
  tick = 0;
  heroes: Hero[] = [];
  enemies: Enemy[] = [];
  javelins: Javelin[] = [];
  /** Rangers' snares on the ground. */
  snares: Snare[] = [];
  hooks: Hook[] = [];
  bolts: Bolt[] = [];
  drops: Drop[] = [];
  /** Slivers left by dead butchers, for a Healer's censer. */
  coals: Coal[] = [];
  /** Blessed ground. */
  zones: Zone[] = [];
  /** Gold and potions on the floor. */
  pickups: Pickup[] = [];
  /** Smoke from thrown flasks. */
  smokes: Smoke[] = [];
  /** Shallows iced over by frost (sim/ice.ts), and the last one's number. */
  ices: Ice[] = [];
  iceSeq = 0;
  /** Poison where the brood mother's globs landed (sim/puddles.ts). */
  puddles: Puddle[] = [];
  /** Lamp oil spilled by the oil throwers, lit or not (sim/oil.ts); crows on the dead (sim/crows.ts). */
  slicks: Slick[] = [];
  crows: Flock[] = [];
  /** A storm's lightning coming down or just down (sim/storm.ts), and when the next comes (-1 not set). */
  strikes: Strike[] = [];
  nextStrike = -1;
  /** Chests, and how far up the danger shifts what's in them (sim/chests.ts). */
  chests: Chest[] = [];
  danger = 0;
  props: Prop[] = roomProps();
  /** Whoever was freed from a cage (sim/survivors.ts), the dead where they fell. */
  survivors: Survivor[] = [];
  /** Inside a cottage or barn (the freed are home only once out of its door). */
  indoors = false;
  /** A house on fire inside: who's burning, the beams down, whether the roof has come in (sim/blaze.ts). */
  blaze?: BlazeState;
  /** Houses on a job set alight from outside (sim/houseburn.ts), and what the leader's game knows is inside them. */
  houseFires: HouseFire[] = [];
  houseIn?: Indoors;
  intents = new Map<string, Intent>();
  /** Events from the latest tick (drawn as hits, sparks and sounds). */
  events: FightEvent[] = [];
  /** Positions before the latest tick, keyed 'h:<id>' or 'e:<id>', for drawing between ticks. */
  prev = new Map<string, [number, number]>();
  private rng: Rng;
  /** Loot rolls on their own stream, so a drop never shifts what the goblins do. */
  private lootRng: Rng;
  /** Ambushes by the door (sim/ambush.ts) on their own stream too. */
  private doorRng: Rng;
  /** Whether a house catches, and when its goblins come out (sim/catching.ts, houseburn.ts), on a stream of their own. */
  private fireRng: Rng;
  /** Relics off named butchers on their own stream too. */
  private relicRng: Rng;
  /** Whether what's in a broken cage is false (sim/falsecage.ts), on its own stream as well. */
  private cageRng: Rng;
  /** What a technique knocks loose (CUTPURSE: sim/techrogue.ts), on its own stream too. */
  private purseRng: Rng;
  /** Where a storm's lightning goes, and when (sim/storm.ts), on a stream of its own too. */
  private skyRng: Rng;
  /** Pack rushes (sim/packrush.ts): when each pack calls its next, and the ones under way; on a stream of their own. */
  rushes: Rushes = newRushes();
  private rushRng: Rng;
  /** An outdoor job room: a cage here can hold a false prisoner (never in a house: run.ts sets this). */
  falseCages = false;
  private acc = 0;

  /** The map this room is played on. */
  map: GameMap;
  /** What happens to a hero out of bounds here (sim/dread.ts); none, nothing does. */
  dread: DreadRule | null = null;
  /** The way out is open (a run room once its goal is met; the training yard always). */
  exitOpen = false;
  private squire: boolean;
  /** A big map: goblins far from every hero doze and aren't stepped (sim/sleep.ts). */
  sleepFar = false;
  /** Every goblin, dozers too, while a big map's tick runs on the awake ones (null between ticks). */
  private whole: Enemy[] | null = null;
  /** An expedition's rules and how it stands (sim/exped.ts): the jobs, the way out, the pressure. */
  exped?: ExpedState;
  /** A job's room: each hero's counts since the run last took them (sim/score.ts, run.ts tally); null, none kept. */
  board: Board | null = null;

  /**
   * The training room by default. A run room passes its `map`, `foes` and `props` (its goblins stay
   * dead and its furniture doesn't come back). `squire`: a training partner to heal and bless.
   */
  constructor(seed = 1, opts: { scrappers?: boolean; squire?: boolean; props?: boolean; map?: GameMap; foes?: Foe[]; furniture?: { kind: PropKind; x: number; y: number }[]; chests?: { x: number; y: number; chained?: boolean }[]; danger?: number; sleep?: boolean } = {}) {
    this.sleepFar = !!opts.sleep;
    this.chests = (opts.chests ?? []).map((c) => newChest(c.x, c.y, c.chained));
    this.danger = opts.danger ?? 0;
    this.rng = new Rng(seed);
    this.lootRng = new Rng(seed * 7919 + 13);
    this.doorRng = new Rng(seed * 104729 + 31);
    this.fireRng = new Rng(seed * 7351 + 17);
    this.relicRng = new Rng(seed * 31337 + 7);
    this.cageRng = new Rng(seed * 2971 + 41);
    this.purseRng = new Rng(seed * 6007 + 53);
    this.skyRng = new Rng(seed * 9173 + 61);
    this.rushRng = new Rng(seed * 4241 + 59);
    this.map = opts.map ?? ARENA;
    this.crows = newFlocks(this.map.flocks);
    useMap(this.map);
    // Layout 4's scenes: prisoners on their rope, a wrecked cart's oil (sim/scenes.ts).
    if (this.map.led || this.map.oil) this.slicks = initScenes(this.map, this.survivors, this.time);
    this.squire = !!opts.squire;
    if (opts.foes) {
      opts.foes.forEach((f, i) => {
        const e = newEnemy(i + 1, f.kind, f.x, f.y);
        if (f.variant) (e.variant = f.variant), (e.hp = e.maxHp = VARIANTS[f.variant].hp);
        if (f.hp) e.hp = e.maxHp = f.hp;
        packOnto(e, f);
        shapeFoe(e);
        Object.assign(e, { respawns: false, name: f.name, bow: f.bow, z: f.z ?? 0, alert: f.awake ?? false, feeding: f.feeding });
        if (f.task) e.task = structuredClone(f.task);
        if (f.haul) e.haul = { ...f.haul };
        if (f.wave) e.wave = f.wave;
        // At the dead: facing the body it's eating.
        const body = f.feeding ? (this.map.npcs ?? []).filter((n) => n.pose === 'corpse').sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y))[0] : undefined;
        if (body) {
          const l = Math.hypot(body.x - e.x, body.y - e.y) || 1;
          (e.fx = (body.x - e.x) / l), (e.fy = (body.y - e.y) / l);
        }
        this.enemies.push(e);
      });
      this.props = (opts.furniture ?? []).map((p) => newProp(p.kind, p.x, p.y, false));
      return;
    }
    if (opts.map) {
      this.props = (opts.furniture ?? []).map((p) => newProp(p.kind, p.x, p.y, false));
      return;
    }
    const s = ARENA.spawn;
    this.enemies.push(newEnemy(1, 'butcher', s.butcher.x, s.butcher.y));
    this.enemies.push(newEnemy(2, 'dummy', s.dummy.x, s.dummy.y));
    this.enemies.push(newEnemy(3, 'swingDummy', s.swingDummy.x, s.swingDummy.y));
    if (opts.scrappers !== false) s.scrappers.forEach((p, i) => this.enemies.push(newEnemy(4 + i, 'scrapper', p.x, p.y)));
    if (opts.props === false) this.props = [];
    this.exitOpen = true;
  }

  /** Every goblin in the room, the dozing ones too (mid-tick on a big map, `enemies` is the awake ones). */
  get allEnemies(): Enemy[] {
    return this.whole ?? this.enemies;
  }

  /** A goblin come in from outside (an expedition's waves and patrols), for good. */
  addFoe(kind: 'scrapper' | 'butcher', x: number, y: number): Enemy {
    return this.spawn(kind, x, y);
  }

  /** Near enough a hero to be awake (a big map's den breeds only then, or the far dens would fill it). */
  private nearHero(x: number, y: number): boolean {
    return !this.sleepFar || this.heroes.some((h) => Math.hypot(h.x - x, h.y - y) < SLEEP.wake);
  }

  join(id: string): Hero {
    let h = this.heroes.find((x) => x.id === id);
    if (!h) {
      // Spread along the way in: across it at the bottom, down it at a side (layout 3's ways in by a side wall).
      const s = this.map.hero, k = this.heroes.length, aside = s.x < 3 || s.x > this.map.w - 3;
      h = aside ? newHero(id, s.x, s.y + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.9) : newHero(id, s.x + k * 0.9, s.y);
      this.heroes.push(h);
      // The squire turns up with the first player (after them, so the room's first hero is a player).
      if (this.squire && !this.heroes.some((x) => x.id === 'squire')) {
        const w = ARENA.spawn.swingDummy, q = newHero('squire', w.x - 1.5, w.y + 1.5);
        Object.assign(q, { fx: 0.7, fy: -0.7 });
        this.heroes.push(q);
      }
    }
    return h;
  }

  setIntent(id: string, i: Intent): void {
    this.intents.set(id, i);
  }

  /** Advance by real time; runs whole ticks and returns the events they produced. */
  advance(dt: number): FightEvent[] {
    const out: FightEvent[] = [];
    this.acc = Math.min(this.acc + dt, TICK * 8);
    while (this.acc >= TICK) {
      this.acc -= TICK;
      this.step();
      out.push(...this.events);
    }
    return out;
  }

  /** Fraction of the way to the next tick, for smooth drawing. */
  get alpha(): number {
    return this.acc / TICK;
  }

  step(): void {
    // What each hero does is counted on this room's board while it steps (sim/score.ts), on a job only.
    useBoard(this.board);
    try {
      this.stepOnce();
    } finally {
      useBoard(null);
    }
  }

  private stepOnce(): void {
    if (!this.sleepFar) return this.stepAll();
    // On a big map the tick runs on the awake goblins only; the dozers go back in their places after.
    const all = (this.whole = this.enemies);
    this.enemies = awake(all, this.heroes);
    try {
      this.stepAll();
    } finally {
      (this.enemies = merge(all, this.enemies)), (this.whole = null);
    }
  }

  private stepAll(): void {
    useMap(this.map);
    for (const h of this.heroes) this.prev.set('h:' + h.id, [h.x, h.y]);
    for (const e of this.enemies) this.prev.set('e:' + e.id, [e.x, e.y]);
    for (const s of this.survivors) this.prev.set('s:' + s.id, [s.x, s.y]);
    this.events = [];
    this.time += TICK;
    this.tick++;
    const w: World = { heroes: this.heroes, enemies: this.enemies, javelins: this.javelins, props: this.props, survivors: this.survivors, now: this.time, ev: this.events, rng: this.fireRng, floor: { pickups: this.pickups, rng: this.purseRng }, fx: this };
    if (this.falseCages && !this.indoors) w.cages = this.cageRng;
    const hit = (e: Enemy, el: Hero['augments']['javelin'], n: number) => afflict(w, e, el, n);
    const acts: HeroActs = {
      fire: (h) => this.fire(h, w),
      loose: (h, s) => this.loose(h, s, w),
      struck: (h, e, n) => this.struck(h, e, n, w),
      sweep: (h, s) => (sweepProps(h, s, w), sweepBlocks(h, s, this.events), sweepAllies(h, s, this.heroes, this.events), sweepSurvivors(h, s, w)),
      grab: (h) => startRaise(h, this.heroes, this.events) || startTorch(h, this.enemies, this.events) || startKindle(h, this.map, this.events) || tryGrab(h, this.enemies, this.time, this.events) || tryLift(h, this.props, this.events),
      carry: (h, inp, walk) => (h.lifting ? stepLift(h, inp, w, TICK, walk) : stepCarry(h, inp, this.enemies, this.time, TICK, this.events, walk)),
      drop: (h) => (release(h, this.enemies, this.events), dropProp(h, this.props)),
      bash: (h) => (h.rush ? stepRush(h, w, TICK) : stepBash(h, this.enemies, w, TICK)),
      sign: (h) => fireSign(h, w, this.intents.get(h.id), this.map.npcs ?? []),
    };
    // Houses alight: their goblins driven out into the street before anyone moves (and their loot falls here).
    stepHouseFires(this, this.fireRng);
    const alive = new Set(this.enemies.filter((e) => !isDead(e)).map((e) => e.id));
    for (const h of this.heroes) takeLoot(h, this.intents.get(h.id) ?? NO_INTENT, this.drops, this.events);
    for (const h of this.heroes) grow(h, this.intents.get(h.id) ?? NO_INTENT, this.events);
    for (const h of this.heroes) {
      const inp = this.intents.get(h.id) ?? NO_INTENT;
      // A press during the cooldown waits for it (never lost).
      if (inp.potionSeq === h.seen.potion || (this.time < h.potionReady && h.belt.length)) continue;
      h.seen.potion = inp.potionSeq;
      const flask = usePotion(h, this.time, w, inp.ax, inp.ay);
      if (flask) this.bolts.push(flask);
    }
    this.smokes = stepPotions(this.heroes, this.smokes, this.time, TICK);
    // Goblins in smoke see nobody but those close; blows across its edge are dropped (sim/smokebomb.ts).
    stepSmoke(this.enemies, this.heroes, this.smokes, this.time);
    // The world's effects before anyone moves: who's held on ice, butchers FED or taken off a meal (sim/ice.ts, meal.ts).
    stepIce(this, this.enemies, this.time);
    mealWatch(this.enemies, this.survivors, this.time, this.events);
    OWN_KIT.freed = this.survivors;
    for (const h of this.heroes) {
      const inp = this.intents.get(h.id) ?? NO_INTENT, c = this.chests.find((x) => x.id === inp.open);
      if (inp.openSeq === h.seen.open) continue;
      h.seen.open = inp.openSeq;
      if (c) startChest(c, h, this.heroes, this.enemies, this.lootRng, this.danger, this.events);
    }
    stepChests(this.chests, this.heroes, this.drops, this.pickups, this.lootRng, this.events, TICK);
    for (const h of this.heroes) if (h.safeT) h.safeT = Math.max(0, h.safeT - TICK);
    // The netted struggle (their presses go on it) and friends cut them out (sim/netter.ts).
    beforeHeroes(this.heroes, this.intents, NO_INTENT, this.time, this.events);
    // On an oil slick the stick takes hold slowly (sim/oil.ts).
    for (const h of this.heroes) stepHero(h, slipIntent(h, this.intents.get(h.id) ?? NO_INTENT, TICK), this.enemies, this.time, TICK, this.events, acts);
    // A party: bleeding, picking each other up, going out.
    stepParty(this.heroes, TICK, this.events);
    // A Ranger who has just jumped back leaves a snare where they stood.
    for (const h of this.heroes) if (h.act === 'roll' && h.actT === 0) laySnare(h, this.snares, this.time, this.events);
    this.snares = this.snares.filter((s) => stepSnare(s, this.enemies, this.time, this.events));
    // The movement ladder: what a dodge (or a Warrior's taunt) does now, and caltrops on the floor (sim/ladder.ts).
    stepLadder(this.heroes, this, w);
    this.javelins = this.javelins.filter((j) => stepJavelin(j, this.enemies, this.time, TICK, this.events, hit));
    this.hooks = this.hooks.filter((k) => stepHook(k, this.heroes, this.enemies, this.time, TICK, this.events, hit, w));
    this.bolts = this.bolts.filter((b) => (b.kind === 'flask' ? stepFlask(b, w, TICK, this.smokes) : stepBolt(b, w, TICK)));
    // Who hears a drum this tick (sim/backline.ts), before anyone moves.
    rouse(this.enemies, this.time);
    beforeFoes(this.enemies, this.time, this.events);
    stepRushes(this.rushes, this.enemies, this.heroes, this.rushRng, this.time, TICK, this.events);
    OWN_KIT.slicks = this.slicks;
    for (const e of this.enemies) stepEnemy(e, this.heroes, this.rng, this.time, TICK, this.events, this.enemies);
    stepSleds(w);
    for (const h of this.heroes) stepHound(h, this.enemies, this.time, TICK, this.events);
    impacts(this.enemies, this.time, this.events);
    this.slicks = afterFoes(w, this.pickups, this.slicks, this.crows, TICK);
    propImpacts(w);
    this.props = w.props = stepProps(w, TICK);
    stepBuildings(w, TICK, (x, y) => void this.spawn('scrapper', x, y), (x, y) => this.nearHero(x, y));
    // Nests hatch their waves; the brood mother's globs leave puddles; poison ticks (sim/spiders.ts, puddles.ts, poison.ts).
    // A nest set alight up close burns out (sim/torch.ts), and hatches nothing while it burns.
    stepTorch(this.enemies, this.heroes, this.time, TICK, this.events);
    stepKindle(this.map, this.heroes, this.time, TICK, this.events);
    stepScenes(this.map, w, TICK);
    stepNests(this.enemies, this.heroes, this.time, this.events, (x, y) => this.spawn('spider', x, y));
    this.puddles = stepPuddles(this.puddles, this.heroes, this.time, TICK, this.events);
    stepPoison(this.heroes, this.time, this.events);
    stepEmbers(this.coals, w);
    stepElements(w);
    stepVenom(this.enemies, this.time, this.events);
    // The freed: home out in the open at the way in; brought out of a house, maybe goblins waiting.
    const door = stepSurvivors(w, TICK, this.indoors ? null : this.map.hero);
    if (door) ambush(this.enemies, this.heroes, this.doorRng, door.x, door.y, this.events);
    // A false prisoner tears open: its goblins come out (sim/falsecage.ts).
    stepFalse(this.survivors, this.time, this.events, (x, y) => this.spawn('scrapper', x, y));
    stepSkills(this, w, TICK);
    stepSentries(this.zones, this.bolts, w);
    followGround(this.zones, this.heroes, this.time);
    this.zones = stepZones(this.zones, w);
    separate(this.heroes, this.enemies, this.props);
    // A staff's wall of fire rolls on and burns whoever it touches, friends too (sim/firewall.ts); its charged ring zaps what's
    // in it (sim/staffrings.ts); a wand's storm stream ticks on the goblin it holds (sim/stream.ts), and the
    // lightning it calls falls when it's due (sim/skystrike.ts).
    stepWalls(this.zones, w, this.slicks), stepRings(this.zones, w), stepStreams(w), stepSkyStrikes(this.zones, w);
    this.landings();
    // Steam scalds; fire turns bodies to ash and ice to steam (sim/steam.ts, worldfire.ts).
    stepSteam(w);
    stepWorldFire(w, this);
    // Out of bounds: the dread, and what comes for anyone who stays out (sim/dread.ts).
    stepDread(this.dread, this.map, this.heroes, this.enemies, TICK, this.events);
    for (const e of this.enemies) if (alive.has(e.id) && isDead(e) && !e.escaped) dropFrom(e, this.heroes, this.drops, this.lootRng, this.events);
    for (const e of this.enemies) if (alive.has(e.id) && isDead(e) && !e.escaped) {
      dropCoal(e, this.coals);
      dropPickups(e, this.pickups, this.lootRng, this.exped ? EXPED_COINS : undefined);
      dropRelic(e, this.pickups, this.relicRng);
      const by = this.heroes.find((x) => x.id === e.lastBy);
      if (by) onKill(by, this.time, this.events);
    }
    stepHungry(this.heroes, this.enemies, this.time, this.events);
    this.pickups = stepPickups(this.pickups, this.heroes, this.events, TICK);
    this.drops = stepDrops(this.drops, TICK);
    this.coals = stepCoals(this.coals, this.heroes, this.events, TICK);
    if (this.map.blaze) stepBlaze(this, TICK);
    // A storm's lightning: the circle a second ahead, then everyone under it hurt (sim/storm.ts).
    stepStorm(this, this.skyRng);
    if (this.exped) stepExped(this, this.events, TICK);
  }

  /** Something new in the room (a den's goblin, a nest's spider), awake and for good. */
  private spawn(kind: 'scrapper' | 'spider' | 'butcher', x: number, y: number): Enemy {
    const e = newEnemy(Math.max(0, ...(this.whole ?? this.enemies).map((o) => o.id), ...this.enemies.map((o) => o.id)) + 1, kind, x, y);
    e.respawns = false;
    this.enemies.push(e);
    return e;
  }

  /** Off a ledge: a goblin knocked off (thrown, hooked, blasted) takes the fall; anyone who steps off just lands. */
  private landings(): void {
    for (const b of [...this.heroes, ...this.enemies]) {
      if (b.dropped === undefined) continue;
      const v = b.dropped;
      b.dropped = undefined;
      this.events.push({ k: 'land', x: b.x, y: b.y, dx: 0, dy: 1 });
      if (!('kind' in b) || v < HEIGHT.fallSpeed || isDead(b)) continue;
      if (!damage(b, HEIGHT.fallDmg, this.time, this.events, { how: 'fall', dx: b.kvx, dy: b.kvy }) && b.act !== 'carried')
        stun(b, b.lastBy, this.time, HEIGHT.fallStun, this.events);
    }
  }

  /** A melee blow landed: a forged weapon's element on a charged hit or counter; REAPER on a backstab or counter kill. */
  private struck(h: Hero, e: Enemy, n: number, w: World): void {
    // A Rogue out of a vanish: seen again the moment they strike.
    h.vanishUntil = undefined;
    // A Rogue's backstab: KNIFEWORK, SLIP AWAY, CUTPURSE (sim/techrogue.ts).
    rogueStruck(h, e, w);
    // A Mage's blade builds its charge; its cuts and a staff's slash carry the element.
    bladeStruck(h, currentSwing(h), e, n, w);
    // Skarn's Cleaver: every hit heals a fifth of what it dealt.
    if (wears(h, 'cleaver') && h.hp < h.maxHp) {
      const back = Math.min(h.maxHp - h.hp, Math.round(n * HUNGRY_FX.leech));
      if (back > 0) (h.hp += back), w.ev.push({ k: 'heal', x: h.x, y: h.y, n: back });
    }
    const charged = (h.heavy && h.power >= 0.7) || h.counter;
    // A rapier's lunge loosed on the white flash: run through on the tip, staggered and bleeding.
    if (h.heavy && h.perfect && currentSwing(h).skewer) skewer(e, h.id, w.now, w.ev);
    if (isDead(e)) {
      const tx = h.x - e.x, ty = h.y - e.y, rear = (e.fx * tx + e.fy * ty) / (Math.hypot(tx, ty) || 1) < GUARD.rearCos;
      if (has(h, 'reaper') && (h.counter || rear)) {
        const heal = Math.min(h.maxHp - h.hp, TRAIT.reaper);
        if (heal > 0) (h.hp += heal), w.ev.push({ k: 'heal', x: h.x, y: h.y, n: heal });
      }
      return;
    }
    if (charged) afflict(w, e, forgedElement(h), n);
    // The censer's coals set alight what they strike.
    if (currentSwing(h).burn) afflict(w, e, 'fire', n);
  }

  private fire(h: Hero, w: World): void {
    const el = h.augments[h.relic];
    if (fireSkill(h, this, w, h.blessedUntil > w.now ? BLESSING.dmgMult : 1) || fireFound(h, this, w)) return;
    if (h.relic === 'hook') this.hooks.push(fireHook(h));
    else if (h.relic === 'javelin') this.javelins.push(throwJavelin(h));
    else if (h.relic === 'net') this.bolts.push(throwNet(h, el));
    else if (h.relic === 'lodestone') this.bolts.push({ ...lobLodestone(h, this.aimDistance(h, LODESTONE.range, LODESTONE.fallback), el), relic: true });
    else if (h.relic === 'shadow') shadowstep(h, this.enemies, w.ev, w.now);
    else if (h.relic === 'channel') turnElement(h, w.ev);
    else if (h.relic === 'grasp') grasp(h, w);
    else if (h.relic === 'horn') rally(h, this.enemies, w.now, w.ev);
    else if (h.relic === 'bash') startBash(h, w.ev);
    else if (h.relic === 'ward') ward(h, this.heroes, this.intents.get(h.id), w.now, w.ev);
    // (SANCTUARY STEP: the blessed ground follows its Cleric a while: sim/techcleric.ts.)
    else if (h.relic === 'sanctuary') (this.zones.push(stepGround(hallow(h, this.intents.get(h.id), w.now, el, w.ev), h, w.now, w.ev)), ward(h, this.heroes, this.intents.get(h.id), w.now, w.ev));
    else this.zones.push(stepGround(hallow(h, this.intents.get(h.id), w.now, el, w.ev), h, w.now, w.ev));
  }

  /** How far to throw or smite: to the mouse on a laptop, else to the goblin the hero faces, else a set distance. */
  private aimDistance(h: Hero, range: number, fallback: number): number {
    const i = this.intents.get(h.id);
    if (i && (i.ax || i.ay)) return Math.max(1.5, Math.min(range, Math.hypot(i.ax, i.ay)));
    let best = fallback, bd = -1;
    for (const e of this.enemies) {
      if (e.act === 'dead') continue;
      const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy), dot = (dx * h.fx + dy * h.fy) / (d || 1);
      if (d <= range && dot > 0.95 && dot > bd) (bd = dot), (best = d);
    }
    return best;
  }

  /** A swing's moment of release: loose its shot (spells cast with the equipped relic's augment), smite, heal. */
  private loose(h: Hero, s: Swing, w: World): void {
    // A staff's slash and a spellblade's cuts go their own way (sim/spellblade.ts).
    if (looseBlade(h, s, w)) return;
    // A censer snags on a wall, flares and bursts its coals, drops more (sim/censer.ts); a flail let go on the flash shields friends near.
    censerSwing(h, s, w, this.coals);
    if (s.dazes && h.heavy && h.perfect) shieldNear(h, this.heroes, HEAL_RADIUS, w.now, w.ev);
    s = { ...s };
    // Blessed, a DEADEYE perfect release, a TEMPO hit after a dodge through a blow.
    let mult = (h.blessedUntil > w.now ? BLESSING.dmgMult : 1) * (h.heavy && h.perfect ? perfectMult(h) * (has(h, 'deadeye') ? TRAIT.deadeye : 1) : 1) * brandyDmg(h, w.now) * litMult(h);
    if (s.shot && h.tempoUntil > w.now) (mult *= TRAIT.tempo), (h.tempoUntil = -9);
    // The high ground: shots from up on a ledge.
    if (s.shot && (h.z ?? 0) > 0) mult *= HEIGHT.shot;
    // A forged weapon's element rides a full draw (and every crossbow bolt); spells otherwise take the relic's.
    const full = (h.heavy && h.power >= 1) || !!WEAPONS[h.weapon].noCharge, forged = full ? forgedElement(h) : '';
    // Spendthrift: a gold an arrow, and a full draw lands double and pierces.
    if (s.shot === 'arrow' && wears(h, 'spendthrift')) {
      h.purse--;
      w.ev.push({ k: 'spend', id: h.id, x: h.x, y: h.y, n: 1 });
      if (full) (mult *= 2), (s = { ...s, pierce: true });
    }
    const bolts = this.bolts.length;
    if (s.shot === 'smite') s.stun = smiteStun(h, s);
    // A mace's smite mends friends in its light; let go on the flash it lands harder and shields them (sim/holy.ts).
    const holy = !!s.holy && h.heavy && h.perfect;
    // A Mage's hold is the element's spell (sim/holds.ts); the first after a turn of element is primed.
    if (s.spell) castHold(h, s, mult * spendPrimed(h) * (1 + statsOf(h).spell), { zones: this.zones, bolts: this.bolts, aim: (r, f) => this.aimDistance(h, r, f) }, w, traitsOf(h));
    else if (s.shot === 'smite') this.bolts.push({ ...smite(h, s, Math.min(s.range, this.aimDistance(h, s.range, 3.5)), mult * (holy ? MACE.perfect : 1), traitsOf(h), s.delay), heal: MACE.heal, holy });
    else if (s.shot) {
      // A Mage's spells take the element it last channelled (fire to start with); the first after a turn is primed.
      const mage = WEAPONS[h.weapon].cls === 'MAGE', primed = mage && !!h.primed;
      const el = s.shot === 'arrow' || s.shot === 'bolt' || s.shot === 'knife' || s.shot === 'dart' ? forged : forged || (mage ? castElement(h) : h.augments[h.relic]);
      // (A wand's storm tap feeds its stream: no shot, so nothing loosed to say.)
      const fed = mage && el === 'storm' && streams(h);
      if (mage) this.bolts.push(...castTap(h, s, el, mult * spendPrimed(h), traitsOf(h), w.now));
      // A Ranger's arrow or bolt loosed on the move drifts off the aim, unless STEADY (sim/techranger.ts).
      else this.bolts.push(shoot(aimed(h, s.shot, this.intents.get(h.id), w.now, w.ev), s, el, mult, traitsOf(h)));
      if (!fed) w.ev.push({ k: 'shoot', x: h.x, y: h.y, dx: h.fx, dy: h.fy, kind: s.shot, el, ...(primed ? { primed } : {}) });
    }
    // The Jealous Rod: a charged spell jumps to every goblin near what it hits.
    if (full && wears(h, 'jealous')) for (const b of this.bolts.slice(bolts)) b.chain = true;
    // WIDE BURST: a Mage's bursts reach further.
    for (const b of this.bolts.slice(bolts)) b.burst *= burstMult(h);
    const heal = healOf(h, s);
    if (!heal) return;
    w.ev.push({ k: 'bless', x: h.x, y: h.y });
    for (const o of this.heroes) if (o.act !== 'down' && Math.hypot(o.x - h.x, o.y - h.y) <= healReach(h)) mend(h, o, heal, this.events);
  }
}
