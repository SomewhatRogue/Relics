// The rooms with a shield-bearer in them, cleared alone by each kit (tests/clearbot.ts): every room of the
// board's ordinary jobs over [days, default 100] from [first day, default 1] that has one, and the yard's
// shield line (three side by side, sim/practice.ts) laid in the first such room's place.
// Usage: npx tsx scripts/encounters/shields.ts [days] [first day] [kits, default daggers,staff,longbow,sword]
import { clearTimes, shieldRooms, type Times } from '../../tests/clearbot';
import type { WeaponId } from '../../src/shared/tuning';

const DAYS = Number(process.argv[2]) || 100, FROM = Number(process.argv[3]) || 1;
const KITS = (process.argv[4] || 'daggers,staff,longbow,sword').split(',') as WeaponId[];
const rooms = shieldRooms(DAYS, FROM);
const shields: Record<string, Times> = {};
const r = clearTimes(rooms, KITS, 180, shields);
console.log(`${rooms.length} rooms with a shield-bearer over ${DAYS} days from day ${FROM}`);
for (const [k, v] of Object.entries(r)) console.log(`${k}: mean ${v.mean} s, worst ${v.worst} s, not cleared in 180 s ${v.unclear}, goblins it could not get at ${v.skipped}, health lost a room ${v.taken}, boards knocked aside ${v.knocks}`);
