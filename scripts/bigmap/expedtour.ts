// A typical run of the Barrowfields, measured in Node: a hero who can't be hurt walks the map the way a
// player does (each pinned job and side job in turn, nearest first, then the camps left, then the beacon),
// fighting whatever is awake near them with real blows by Intent. Walking is ghosted (straight lines,
// through walls) so the tour never sticks; everything else is the room's own: goblins, waves, horns,
// the alarm, drops. Prints, a run and on average: goblins killed; the coins dropped on the floor (piles,
// value, by source); the pay; the sorts met (any goblin awake within 10 tiles of a hero, by its sort;
// carrion crows going up within 10); and specials awake within 10 tiles while fighting (sampled each second).
// Usage: npx tsx scripts/bigmap/expedtour.ts [days, default 6] [party, default 1] [minutes cap, default 22] [pace, tiles a second, default 2.6:
// a player stopping, looking about and weaving, not the 4.4 of a straight run]
import { expedition } from '../../src/shared/expedjob';
import { expedPlan } from '../../src/shared/expedmap';
import { Rng } from '../../src/shared/rng';
import { newRun, runRoom } from '../../src/sim/run';
import { NO_INTENT, type Enemy, type Hero, type Intent } from '../../src/sim/types';
import type { ArenaRoom } from '../../src/sim/room';

const DAYS = Number(process.argv[2]) || 6, PARTY = Number(process.argv[3]) || 1, CAP = (Number(process.argv[4]) || 22) * 60;
const TICK = 1 / 30, WALK = Number(process.argv[5]) || 2.6, IDS = ['a', 'b', 'c', 'd'].slice(0, PARTY);
type P = { x: number; y: number };
const d = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const dead = (e: Enemy) => e.act === 'dead' || e.hp <= 0;
/** A goblin's sort, as a player would name it (the small ones are 'small'). */
export const sortOf = (e: Enemy) => (e.kind === 'butcher' ? (e.name ? 'named' : 'butcher') : e.variant ?? (e.bow ? 'archer' : e.kind === 'scrapper' ? 'small' : e.kind));
const SPECIAL = (s: string) => !['small', 'looter', 'wolf', 'named', 'spider', 'blind'].includes(s);

function tour(day: number) {
  const job = expedition(day), run = newRun(job);
  run.party = PARTY;
  const r = runRoom(run), x = r.exped!;
  r.dread = null;
  const heroes = IDS.map((id, i) => Object.assign(r.join(id), { safeT: 1e9, x: r.map.hero.x + i * 0.8 }) as Hero);
  const lead = heroes[0], rng = new Rng(day * 31 + 7);
  // Stuck against the river or a wall while walking on: hop on a few tiles (the tour is ghosted anyway).
  const was = new Map<string, P & { t: number }>();
  // The stops: each job and side job, nearest first from the way in, then any camp not yet seen, then the beacon.
  const stops: { at: P; kind: string; ref?: unknown }[] = [];
  const todo: { at: P; kind: string; ref?: unknown }[] = [...x.goals.map((g) => ({ at: g, kind: g.kind, ref: g })), ...x.sides.map((g) => ({ at: g, kind: g.kind, ref: g })),
    ...x.camps.filter((c) => !x.goals.some((g) => d(g, c) < 10)).map((c) => ({ at: c, kind: 'camp', ref: c })),
    // And every stretch of the map on the way (the river, the fields, the wood's edge, the hamlet), as a player wanders.
    ...expedPlan(job).nodes.flatMap((n, j) => (n === 'in' || n === 'out' || n === 'camp' || n === 'barrows' ? [] : [{ at: { x: (j % 4) * 24 + 12, y: Math.floor(j / 4) * 24 + 12 }, kind: 'camp' }]))];
  let from: P = lead;
  while (todo.length) {
    todo.sort((a, b) => d(a.at, from) - d(b.at, from));
    const s = todo.shift()!;
    stops.push(s), (from = s.at);
  }
  const m = { kills: 0, piles: 0, coins: 0, bySource: { kill: 0, chest: 0, other: 0 } as Record<string, number>, pilesBy: { kill: 0, chest: 0, other: 0 } as Record<string, number>, pay: 0, picked: 0,
    sorts: new Set<string>(), near: [] as number[], time: 0, out: false, level: 0, chests: 0 };
  const seenPick = new Set<number>(), seq = new Map<string, number>(), swingAt = new Map<string, number>();
  let i = 0, at = 0;
  const step = (fightR = 6, hold?: { at: P; r: number }) => {
    // Each hero: the nearest goblin awake within `fightR`, else the stop; walk there (ghosted), swing when close.
    // (Not a roof archer up on its roof: no blade reaches it, and a player walks on or burns the house.)
    const awake = r.enemies.filter((e) => !dead(e) && !e.dozing && e.alert === true && (e.kind === 'scrapper' || e.kind === 'butcher') && !((e.z ?? 0) > 0));
    heroes.forEach((h, k) => {
      const foe = awake.filter((e) => d(e, h) < Math.max(2, fightR)).sort((a, b) => d(a, h) - d(b, h))[0];
      // On the way: cut at what's in reach and keep walking; at a stop, stand and fight what's about.
      const goal = (fightR > 2 ? foe : undefined) ?? (stops[i] ? ({ x: stops[i].at.x + (k % 2 ? 1 : -1) * k * 0.6, y: stops[i].at.y + k * 0.5 }) : h);
      const dx = goal.x - h.x, dy = goal.y - h.y, l = Math.hypot(dx, dy) || 1, keep = foe && fightR > 2 ? 1.1 : 0.4;
      if (l > keep && h.act !== 'down') {
        let nx = h.x + (dx / l) * Math.min(l - keep, WALK * TICK), ny = h.y + (dy / l) * Math.min(l - keep, WALK * TICK);
        if (hold && d(h, hold.at) <= hold.r - 0.5 && d({ x: nx, y: ny }, hold.at) > hold.r - 0.5) (nx = h.x), (ny = h.y);
        (nx = Math.max(1, Math.min(r.map.w - 1, nx))), (ny = Math.max(1.5, Math.min(r.map.h - 1, ny)));
        (h.x = nx), (h.y = ny);
        const w = was.get(h.id);
        if (!w || d(w, h) > 1.5) was.set(h.id, { x: h.x, y: h.y, t: r.time });
        else if (r.time - w.t > 2 && !foe) (h.x += (dx / l) * Math.min(l, 7)), (h.y += (dy / l) * Math.min(l, 7)), was.delete(h.id);
      }
      const i0: Intent = { ...NO_INTENT };
      if (foe && d(foe, h) < 2 && r.time - (swingAt.get(h.id) ?? -9) > 0.35) swingAt.set(h.id, r.time), seq.set(h.id, (seq.get(h.id) ?? 0) + 1);
      if (foe) Object.assign(i0, { ax: (foe.x - h.x) / (d(foe, h) || 1), ay: (foe.y - h.y) / (d(foe, h) || 1) });
      // A player's skills, heavies and backstabs, roughly: a goblin in the hero's face is worn down to a blow or two.
      if (foe && d(foe, h) < 2 && !foe.name) foe.hp = Math.min(foe.hp, 1);
      r.setIntent(h.id, { ...i0, attackSeq: seq.get(h.id) ?? 0 });
    });
    r.step();
    m.time = r.time;
    for (const e of r.events) if (e.k === 'death' && (e.kind === 'scrapper' || e.kind === 'butcher')) m.kills++;
    for (const e of r.events) if (e.k === 'gold' && e.id === 'a') m.picked += e.n;
    for (const e of r.events) if (e.k === 'exped' && (e.what === 'goal' || e.what === 'side')) m.pay += Math.round(job.reward * (e.what === 'goal' ? 0.15 : 0.1));
    for (const p of r.pickups) {
      if (!p.gold || seenPick.has(p.id)) continue;
      seenPick.add(p.id);
      const src = r.chests.some((c) => d(c, p) < 1.6) ? 'chest' : r.events.some((e) => e.k === 'death' && d(e, p) < 0.6) ? 'kill' : 'other';
      (m.piles += 1), (m.coins += p.gold), (m.bySource[src] += p.gold), (m.pilesBy[src] += 1);
    }
    if (r.tick % 30 === 0) {
      const near = r.enemies.filter((e) => !dead(e) && e.alert === true && heroes.some((h) => d(e, h) < 10));
      for (const e of near) m.sorts.add(sortOf(e));
      if (near.some((e) => heroes.some((h) => d(e, h) < 8))) m.near.push(near.filter((e) => SPECIAL(sortOf(e))).length);
    }
    for (const f of (r as unknown as { crows?: { x: number; y: number; up: number }[] }).crows ?? []) if (f.up >= 0 && heroes.some((h) => d(f, h) < 10)) m.sorts.add('crows');
  };
  const awakeNear = (p: P, rr: number) => r.enemies.some((e) => !dead(e) && !e.dozing && e.alert === true && !((e.z ?? 0) > 0) && d(e, p) < rr);
  while (r.time < CAP && x.phase !== 'leave') {
    const s = stops[i];
    if (!s) {
      // The beacon: walk to it, light it and hold it.
      stops[i] = { at: x.zone, kind: 'beacon' };
      continue;
    }
    step(d(lead, s.at) < 9 ? 7 : 0, s.kind === 'beacon' && x.phase !== 'shut' ? { at: x.zone, r: x.zone.r } : s.kind === 'shrine' || s.kind === 'pray' || s.kind === 'larder' ? (d(lead, s.at) < 1.2 ? { at: s.at, r: s.kind === 'shrine' ? 3 : 1.6 } : undefined) : undefined);
    if (d(lead, s.at) > 1.5) { at = r.time; continue; }
    const g = s.ref as { done?: boolean; blocks?: number[]; cages?: P[]; chest?: number } | undefined;
    if (s.kind === 'engine' || s.kind === 'dens') for (const b of g?.blocks ?? []) Object.assign(r.map.blocks[b], { hp: 0, ruined: true });
    if (s.kind === 'prisoners') for (const p of r.props) if (p.kind === 'cage' && (g?.cages ?? []).some((c) => d(c, p) < 0.6)) p.broken = true;
    if (s.kind === 'cache' && g?.chest !== undefined && r.chests[g.chest]?.state === 'shut') {
      // Opened as chests.ts opens one (gold half the time, 10 to 30), on our own roll.
      Object.assign(r.chests[g.chest], { state: 'open' }), m.chests++;
      if (rng.next() < 0.5) { const n = 10 + Math.floor(rng.next() * 21); (m.piles += 1), (m.coins += n), (m.bySource.chest += n), (m.pilesBy.chest += 1); }
    }
    if (s.kind === 'butcher') for (const e of r.enemies) if (e.name && d(e, lead) < 9) e.alert = true;
    const finished = s.kind === 'beacon' ? false : s.kind === 'camp' ? !awakeNear(s.at, 9) && r.time - at > 3 : !!g?.done;
    if (finished || (s.kind !== 'beacon' && r.time - at > 150)) (i++, (at = r.time));
  }
  if (process.env.DEBUG) console.log(day, x.phase, i, stops.map((s) => s.kind).join(","), x.goals.map((g) => g.kind + ":" + g.done + ":" + g.p.toFixed(2)).join(" "), "held", x.held.toFixed(1), "lit", x.lit.toFixed(1), "lead", lead.act, lead.hp, (lead as any).out, Math.round(lead.x), Math.round(lead.y), "zone", Math.round(x.zone.x), Math.round(x.zone.y));
  m.out = x.phase === "leave";
  m.level = x.level;
  return { day, ...m, sorts: [...m.sorts].sort(), reward: job.reward };
}

const runs: ReturnType<typeof tour>[] = [];
for (let day = 1; day <= DAYS; day++) {
  const t = tour(day), sp = [...t.near].sort((a, b) => a - b);
  runs.push(t);
  console.log(`day ${day}: ${Math.round(t.time)} s, out ${t.out}, alarm ${t.level}, kills ${t.kills}, piles ${t.piles}, coins ${t.coins} (kill ${t.bySource.kill} in ${t.pilesBy.kill}, chest ${t.bySource.chest}, other ${t.bySource.other}), picked ${t.picked}, pay ${t.pay} of ${t.reward}; ` +
    `sorts ${t.sorts.length} [${t.sorts.join(' ')}], specials ${t.sorts.filter(SPECIAL).length}; specials near while fighting mean ${(sp.reduce((a, b) => a + b, 0) / Math.max(1, sp.length)).toFixed(1)} p90 ${sp[Math.floor(sp.length * 0.9)] ?? 0} max ${sp[sp.length - 1] ?? 0}`);
}
const mean = (f: (t: (typeof runs)[number]) => number) => +(runs.reduce((a, t) => a + f(t), 0) / runs.length).toFixed(1);
const all = runs.flatMap((t) => t.near).sort((a, b) => a - b);
console.log(`\nparty ${PARTY}, ${DAYS} runs | minutes ${mean((t) => t.time / 60)} | kills ${mean((t) => t.kills)} | piles ${mean((t) => t.piles)} | coins on the floor ${mean((t) => t.coins)} (kills ${mean((t) => t.bySource.kill)}, chests ${mean((t) => t.bySource.chest)}, other ${mean((t) => t.bySource.other)}) | coins a kill ${mean((t) => t.bySource.kill / Math.max(1, t.kills))} | pile size ${mean((t) => t.coins / Math.max(1, t.piles))} | pay ${mean((t) => t.pay)} of ${mean((t) => t.reward)} | ` +
  `sorts met ${mean((t) => t.sorts.length)} (specials ${mean((t) => t.sorts.filter(SPECIAL).length)}, fewest ${Math.min(...runs.map((t) => t.sorts.filter(SPECIAL).length))}) | specials awake within 10 while fighting mean ${(all.reduce((a, b) => a + b, 0) / Math.max(1, all.length)).toFixed(1)} p90 ${all[Math.floor(all.length * 0.9)]} max ${all[all.length - 1]} | out ${runs.filter((t) => t.out).length}/${runs.length}`);
