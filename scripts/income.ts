/**
 * Copper per job by level (docs/design/economy.md slice 2). Plays the board's ordinary jobs at each level
 * (scripts/incomebot.ts) and prints what a job brings in: the pay, the coins picked up, the gear's sale
 * value, the total, and a medium job's total. npx vite-node scripts/income.ts [days] [levels...]
 */
import { playJob, plainJobs, type Take } from './incomebot';
import { coins } from '../src/shared/coins';

const days = Number(process.argv[2] ?? 3);
const levels = process.argv.slice(3).map(Number).filter((n) => n > 0);
const LEVELS = levels.length ? levels : [1, 5, 10, 15, 20];
const jobs = plainJobs(days);
const avg = (t: Take[], k: keyof Take) => Math.round(t.reduce((s, x) => s + (x[k] as number), 0) / Math.max(1, t.length));

console.log(`${jobs.length} jobs over ${days} days, played alone`);
console.log('level | jobs | pay | coins | gear | total | medium job total | secs a job');
for (const lv of LEVELS) {
  const takes = jobs.map((j) => playJob(j, lv));
  const med = takes.filter((t) => t.size === 'medium');
  console.log([lv, takes.length, coins(avg(takes, 'pay')), coins(avg(takes, 'coins')), coins(avg(takes, 'gear')), coins(avg(takes, 'total')), med.length ? coins(avg(med, 'total')) : '-', avg(takes, 'secs')].join(' | '));
}
