// How long a single-target kit and an area kit take to clear the same seeded job rooms alone (tests/clearbot.ts):
// a Rogue's twin daggers against a Mage's focus staff.
// Usage: npx tsx scripts/encounters/clear.ts [days, default 6] [first day, default 1] [off: elites and the new meaty sorts switched off;
// off2: only the second wave off (Oil-soaked, Hornblower, Smouldering; the Kegman, Pouncer, Gorger)]
import { clearTimes, sampleRooms } from '../../tests/clearbot';
import { AFFIX2_ON, ELITE, MEATY2_ON, MEATY_ON } from '../../src/shared/tuning';

const DAYS = Number(process.argv[2]) || 6, FROM = Number(process.argv[3]) || 1;
if (process.argv[4] === 'off') (ELITE.on = false), (MEATY_ON.on = false), (AFFIX2_ON.on = false), (MEATY2_ON.on = false);
if (process.argv[4] === 'off2') (AFFIX2_ON.on = false), (MEATY2_ON.on = false);
const rooms = sampleRooms(DAYS, 2, FROM);
const r = clearTimes(rooms, ['daggers', 'staff']);
console.log(`${rooms.length} rooms over ${DAYS} days from day ${FROM}${process.argv[4] === 'off' ? ' (elites and new sorts off)' : process.argv[4] === 'off2' ? ' (the second wave off)' : ''}`);
for (const [k, v] of Object.entries(r)) console.log(`${k}: mean ${v.mean} s, worst ${v.worst} s, not cleared in 180 s ${v.unclear}, goblins it could not get at ${v.skipped}, health lost a room ${v.taken}`);
console.log(`daggers / staff: time ${(r.daggers.mean / r.staff.mean).toFixed(2)}, health lost ${(r.daggers.taken / Math.max(1, r.staff.taken)).toFixed(2)}`);
