// How long a single-target kit and an area kit take to clear the same seeded job rooms alone (tests/clearbot.ts):
// a Rogue's twin daggers against a Mage's focus staff. Usage: npx tsx scripts/encounters/clear.ts [days, default 6]
import { clearTimes, sampleRooms } from '../../tests/clearbot';

const DAYS = Number(process.argv[2]) || 6, rooms = sampleRooms(DAYS);
const r = clearTimes(rooms, ['daggers', 'staff']);
console.log(`${rooms.length} rooms over ${DAYS} days`);
for (const [k, v] of Object.entries(r)) console.log(`${k}: mean ${v.mean} s, worst ${v.worst} s, not cleared in 180 s ${v.unclear}, goblins it could not get at ${v.skipped}, health lost a room ${v.taken}`);
console.log(`daggers / staff: time ${(r.daggers.mean / r.staff.mean).toFixed(2)}, health lost ${(r.daggers.taken / Math.max(1, r.staff.taken)).toFixed(2)}`);
