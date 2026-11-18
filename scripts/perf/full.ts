import { Encoder, stateOf } from '../../src/client/snap';
import { quiet, stateFor } from '../../src/client/interest';
import { board, PLACES } from '../../src/shared/jobs';
import { newRun, runRoom } from '../../src/sim/run';
import { saveRoom, jobJson } from '../../src/client/coop';
for (const kind of ['village', 'farm', 'forest', 'mine', 'marsh']) {
  const run = newRun({ ...board(1)[0], rooms: 3, place: PLACES.find((p) => p.kind === kind)!, objective: 'rescue', seed: 77 });
  run.party = 4;
  const room = runRoom(run);
  for (const id of ['me', 'b2', 'b3', 'b4']) room.join(id);
  for (let i = 0; i < 60; i++) room.step();
  const p = new Encoder().encode(quiet(stateOf(room), room.time), true);
  const map = { ...room.map, blocks: [] };
  const per: Record<string, number> = {};
  for (const [c, q] of Object.entries(p)) per[c] = JSON.stringify(q).length;
  const mapPer: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) { const n = (JSON.stringify(v) ?? '').length; if (n > 150) mapPer[k] = n; }
  const hero = p.heroes!.u[0][1] as Record<string, unknown>;
  const heroPer = Object.entries(hero).map(([k, v]) => [k, (JSON.stringify(v) ?? "").length] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const save = jobJson({ run, room: saveRoom(room), houses: {}, members: [], key: 1 });
  console.log(kind, `${room.map.w}x${room.map.h}`, 'fullPatch', JSON.stringify(p).length, 'map', JSON.stringify(map).length, 'run', JSON.stringify(run).length, 'saveEvery2s', save.length, '\n  patch by coll', JSON.stringify(per), '\n  map by key', JSON.stringify(mapPer), '\n  hero top', JSON.stringify(heroPer));
}
