/**
 * What you hear: each event's sound (by the kit that made it and what it landed on), goblins talking
 * as they come, fires crackling, doors, and the music for where you are and how bad it's getting.
 */
import { chestSound } from './sfx';
import { isDead } from '../sim/damage';
import { asleep } from './foes';
import type { ArenaRoom } from '../sim/room';
import type { FightEvent, Hero } from '../sim/types';
import type { Game } from './game';
import type { Music } from './music';
import { SCORES, type Area } from './scores';
import { sfx } from './sfx';
import { butcher, goblin } from './voices';
import { blockSound, chargedSound, hitSound, shotSound, swingSound, woodSounds } from './weaponsfx';

type AnyFx = Record<string, ((...a: unknown[]) => void) | undefined>;

export class Soundscape {
  private yelpAt = 0;
  private chatterAt = 3;
  private gnawAt = 0;
  private crackleAt = 0;
  private wasInside: unknown = null;

  /** A tune asked of the bard (played while you're out in the square). */
  private tune: { area: Area; name: string } | null = null;

  constructor(private music: Music) {
    addEventListener('relic:tune', (e) => (this.tune = (e as CustomEvent).detail));
  }

  /** The hero nearest a spot (who swung, shot or blocked). */
  private heroAt(room: ArenaRoom, x: number, y: number): Hero | undefined {
    let best: Hero | undefined, bd = 1.5;
    for (const h of room.heroes) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < bd) (bd = d), (best = h);
    }
    return best;
  }

  event(ev: FightEvent, room: ArenaRoom, now: number): void {
    if (ev.k === 'swing') return swingSound(ev.src, ev.heavy);
    if (ev.k === 'chest') return chestSound(ev.state, ev.tier);
    if (ev.k === 'shoot') return shotSound(ev.kind, this.heroAt(room, ev.x, ev.y)?.weapon);
    if (ev.k === 'charged') return chargedSound(this.heroAt(room, ev.x, ev.y)?.weapon ?? '');
    if (ev.k === 'block') return blockSound(this.heroAt(room, ev.x, ev.y)?.weapon ?? '');
    // Someone you freed, hurt by the party, cries out (a burn's tick doesn't).
    if (ev.k === 'survivorhit') return ev.tick ? undefined : sfx.hurt();
    if (ev.k === 'hit') {
      if (ev.tick) return;
      if (ev.on === 'hero') return sfx.hurt();
      if (ev.backstab) sfx.backstab();
      else hitSound(ev.src, ev.heavy, !!ev.big);
      // The one hit cries out (not every scratch).
      if (now - this.yelpAt > 0.22) {
        this.yelpAt = now;
        const e = room.enemies.find((x) => Math.abs(x.x - ev.x) < 0.01 && Math.abs(x.y - ev.y) < 0.01);
        if (e && !isDead(e)) e.kind === 'butcher' ? butcher.grunt() : e.kind === 'scrapper' && goblin.yelp(e.id);
      }
      return;
    }
    if (ev.k === 'death') {
      sfx.death(ev.how);
      if (ev.kind === 'butcher') return butcher.groan();
      if (ev.kind === 'scrapper') {
        const e = room.enemies.find((x) => Math.abs(x.x - ev.x) < 0.01 && Math.abs(x.y - ev.y) < 0.01);
        if (ev.how !== 'burst' && ev.how !== 'shatter') goblin.shriek(e?.id ?? 1);
      }
      return;
    }
    if (ev.k === 'windup') {
      if (ev.kind === 'stab') return goblin.hiss();
      if (ev.kind === 'shot') return goblin.draw();
      if (ev.kind === 'cleave' || ev.kind === 'slam' || ev.kind === 'charge') return butcher.roar(ev.kind !== 'cleave');
      return;
    }
    if (ev.k === 'impact') return ev.kind === 'slam' ? sfx.boom() : undefined;
    if (ev.k === 'chop' || ev.k === 'blaze' || ev.k === 'collapse') return woodSounds[ev.k]();
    if (ev.k === 'denspawn') return goblin.screech();
    if (ev.k === 'bellow') return butcher.roar(true), butcher.roar(true), sfx.boom();
    if (ev.k === 'spotted') {
      const e = room.enemies.find((x) => Math.abs(x.x - ev.x) < 0.01 && Math.abs(x.y - ev.y) < 0.01);
      return e?.kind === 'butcher' ? butcher.roar(false) : goblin.cackle(e?.id ?? 1);
    }
    (sfx as unknown as AnyFx)[ev.k]?.();
  }

  /** Every frame: doors, goblin chatter, fire, and the music. */
  frame(g: Game, now: number): void {
    const room = g.room, me = g.hero;
    if (g.outside !== this.wasInside) {
      if (g.outside || this.wasInside) woodSounds.door();
      this.wasInside = g.outside;
    }
    // Goblins at the dead, close by: wet chewing, tearing.
    const eating = room.enemies.find((e) => !isDead(e) && e.feeding && e.alert === false && !asleep(room.map, e) && Math.hypot(e.x - me.x, e.y - me.y) < 8);
    if (eating && now > this.gnawAt) (sfx.gnaw(1 - Math.hypot(eating.x - me.x, eating.y - me.y) / 8), (this.gnawAt = now + 0.9 + Math.random() * 1.1));
    // Goblins coming for you talk among themselves now and then.
    const coming = room.enemies.filter((e) => !isDead(e) && e.alert !== false && e.kind === 'scrapper' && (e.act === 'chase' || e.act === 'attack') && Math.hypot(e.x - me.x, e.y - me.y) < 9);
    if (coming.length && now > this.chatterAt) {
      const e = coming[Math.floor(Math.random() * coming.length)];
      Math.random() < 0.25 ? goblin.cackle(e.id) : goblin.chatter(e.id);
      this.chatterAt = now + 2 + Math.random() * 4 / Math.min(3, coming.length);
    }
    // A building on fire crackles, louder the closer you are.
    let near = 0;
    for (const b of room.map.blocks) if ((b.burning ?? -1) >= 0 && !b.ruined) near = Math.max(near, 1 - Math.hypot(b.x + b.w / 2 - me.x, b.y + b.h / 2 - me.y) / 12);
    if (near > 0 && now > this.crackleAt) (woodSounds.crackle(near), (this.crackleAt = now + 0.25 + Math.random() * 0.35));
    // The music: where you are, how bad it is.
    const [area, version] = this.area(g);
    this.music.set(area, version);
    const hunting = room.enemies.filter((e) => !isDead(e) && e.kind !== 'dummy' && e.kind !== 'swingDummy' && (e.act === 'chase' || e.act === 'attack') && Math.hypot(e.x - me.x, e.y - me.y) < 8).length;
    this.music.setDanger(g.mode === 'run' || g.mode === 'wood' ? Math.min(1, hunting / 3) : 0);
    this.music.tick();
  }

  private area(g: Game): [Area, number] {
    const w = g.world;
    if (g.mode !== 'town') this.tune = null;
    if (g.mode === 'yard') return ['yard', w.day];
    if (g.mode === 'wood') {
      // The Stoker's own music from the moment it comes up out of the ground (The Butcher Comes).
      const s = g.room.enemies.find((e) => e.name && !isDead(e));
      return s ? ['boss', 0] : ['forest', 3];
    }
    if (g.mode === 'town') {
      if (!g.outside && this.tune) return [this.tune.area, SCORES[this.tune.area].findIndex((sc) => sc.name === this.tune!.name)];
      if (!g.outside) return ['town', w.day];
      return [g.outside.door.door === 'church' ? 'church' : 'inside', w.day + (g.outside.door.door?.length ?? 0)];
    }
    const run = g.run!, boss = g.fightRoom.enemies.find((e) => e.name && !isDead(e));
    // The boss's music once it's close or the fight with it has begun.
    if (boss && !g.outside && (boss.hp < boss.maxHp || Math.hypot(boss.x - g.hero.x, boss.y - g.hero.y) < 6)) return ['boss', run.job.seed];
    // New kinds of place borrow a tune till they have their own: the river and marsh the wood's, ruins the village's.
    const k = run.job.place.kind, area = (k === 'river' || k === 'marsh' ? 'forest' : k === 'ruins' ? 'village' : k) as Area;
    return [area, run.job.seed + run.index];
  }
}
