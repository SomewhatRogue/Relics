/**
 * THE LISTENER's cave once a tick, before the goblins move (docs/design/deep-layer-bosses.md section 1; numbers
 * shared/listentune.ts): what every hero's noise is now (sim/listennoise.ts); the fight begins when it hears you;
 * the rest it takes between blows (LISTENER.pauseBetween, quicker in phase 2, a rise straight into its sweep);
 * the DROP: a drop whose pose is out takes it under the floor (`boss.under`, held like a carried goblin so
 * nothing in the room touches it); LISTENER.under s on it comes up through the hole nearest the loudest hero,
 * the RISE a striped circle there that the book counts down itself (it can't be hit, so it can't be late), and as
 * it ends it is out and the blow lands as any round one does; and below LISTENER.phase2 of its health, phase 2:
 * a roar (nothing landing either way), the torches out (`boss.dark`), and LISTENER.adds.n small ones out of the
 * holes every LISTENER.adds.every s.
 */
import { BOSS, LISTENER as L, SCRAPPER, TICK, VARIANTS } from '../shared/tuning';
import { currentMap } from '../shared/arena';
import { isDead } from './damage';
import { forget, type BossBook } from './bosskit';
import { hear, listenState, loudest, nearestHole, type ListenState } from './listennoise';
import { stepColumns } from './columns';
import { listenBegin } from './listener';
import type { World } from './elements';
import type { Enemy } from './types';

export function stepListenBook(bk: BossBook, w: World, spawn: (x: number, y: number) => Enemy): void {
  const now = w.now, e = w.enemies.find((x) => x.boss?.who === 'listener'), st = listenState(bk);
  hear(st, w.heroes);
  if (!e || isDead(e)) return;
  const b = e.boss!;
  forget(bk, now);
  if (bk.started < 0 && e.alert) {
    bk.started = now;
    st.nextAdds = now + L.adds.first;
    b.rotAt = now;
    // (Its first blow when it has heard you, not a goblin's slow start.)
    e.cooldown = Math.min(e.cooldown, 0.6);
  }
  stepColumns(e, w);
  // (Shield goblins out of the holes, under the floor or not: LISTENER.adds.)
  if (now >= st.nextAdds && bk.started >= 0) adds(st, w, spawn, now, b.phase === 2);
  if (b.under) return void underground(e, st, w);
  // Its rest between blows is its own: straight on after a rise (the sweep), else LISTENER.pauseBetween.
  if (e.attack) st.was = true;
  else if (st.was) (st.was = false), (e.cooldown = b.lmove && L.chain.includes(b.lmove) ? L.chainPause : L.pauseBetween / (b.phase === 2 ? L.faster : 1));
  // Below the line: phase 2 (not through a stagger, a knock down, nor as a blow lands).
  if (b.phase === 1 && e.hp <= e.maxHp * L.phase2 && b.stagUntil <= now && b.downUntil <= now && !(e.attack && e.attack.t >= e.attack.windup)) {
    bk.phase = 2;
    Object.assign(e, { attack: null, act: 'chase', actT: 0, kvx: 0, kvy: 0 });
    Object.assign(b, { phase: 2, rot: 0, rotAt: now + BOSS.roar, roarUntil: now + BOSS.roar, dark: true, lmove: undefined });
    w.ev.push({ k: 'roar', x: e.x, y: e.y });
    adds(st, w, spawn, now, true);
  }
  dropPose(e, st, w);
}

/** A drop whose pose is about to end: it goes under (the blow itself does nothing), to come up LISTENER.under s on. */
function dropPose(e: Enemy, st: ListenState, w: World): void {
  const a = e.attack;
  if (!a || (a.boss as string | undefined) !== 'drop' || a.t + TICK * 1.5 < a.windup) return;
  Object.assign(e, { under: true, act: 'carried', z: -1, attack: null, kvx: 0, kvy: 0 });
  e.boss!.under = true;
  st.riseAt = w.now + L.under / (e.boss!.phase === 2 ? L.faster : 1);
  w.ev.push({ k: 'dig', x: e.x, y: e.y });
}

/** Under the floor: wait out LISTENER.under, come to the hole nearest the loudest hero and show the rise, then be out as it ends. */
function underground(e: Enemy, st: ListenState, w: World): void {
  const a = e.attack, b = e.boss!;
  if (!a) {
    if (w.now < st.riseAt) return;
    const t = loudest(w.heroes, st.noise, e), hole = t && nearestHole(currentMap().holes ?? [], t);
    if (!t || !hole) return;
    // (Still under, now at the hole: its circle shows there; the pose of rising is the kit's BOSS.tell.)
    Object.assign(e, { x: hole.x, y: hole.y });
    if (listenBegin(e, 'rise', t, w.ev, w.heroes, hole)) e.act = 'carried';
    return;
  }
  a.t += TICK;
  if (a.t + TICK * 1.5 < a.windup) return;
  Object.assign(e, { under: false, act: 'attack', z: 0 });
  b.under = false;
  b.rotAt = w.now;
  w.ev.push({ k: 'surface', x: e.x, y: e.y });
}

/** Shield goblins out of the holes: one every LISTENER.adds.early s, LISTENER.adds.n every adds.every s in phase 2, never more than adds.most about. */
function adds(st: ListenState, w: World, spawn: (x: number, y: number) => Enemy, now: number, two: boolean): void {
  st.nextAdds = now + (two ? L.adds.every : L.adds.early);
  const holes = currentMap().holes ?? [], about = w.enemies.filter((x) => !x.boss && !isDead(x)).length;
  if (!holes.length) return;
  for (let i = 0; i < Math.min(two ? L.adds.n : 1, L.adds.most[two ? 1 : 0] - about); i++) {
    const h = holes[(Math.floor(now) + i * 2) % holes.length], s = spawn(h.x, h.y + 0.6);
    // (Its health as a shield goblin's, at the room's level: sim/packs.ts levelOn already scaled the small one's.)
    Object.assign(s, { variant: 'shield', alert: true }), (s.hp = s.maxHp = Math.round(VARIANTS.shield.hp * (s.maxHp / SCRAPPER.hp)));
  }
}
