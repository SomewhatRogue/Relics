/**
 * Gear by tier per hour of play (docs/design/gear-levels.md section 2): plays the board's ordinary jobs
 * (scripts/incomebot.ts) and sums the exact odds of every tier roll they made (shared/gear.ts TIER_LOG,
 * tierOdds). An hour is six medium jobs. npx vite-node scripts/rarity.ts [days] [levels...]
 */
import { playJob, plainJobs } from './incomebot';
import { TIER_ORDER, TIERS, tierOdds, type Tier } from '../src/shared/tuning';


/** Gear of each tier found in an hour (six jobs' worth) at `lv`, alone. */
export function perHour(lv: number, js = plainJobs(3)): Record<Tier, number> {
  const out = Object.fromEntries(TIER_ORDER.map((t) => [t, 0])) as Record<Tier, number>;
  const takes = js.map((j) => playJob(j, lv));
  for (const t of takes) for (const r of t.rolls) {
    const o = tierOdds(r.from, r.shift, r.lv, r.floor);
    for (const k of TIER_ORDER) out[k] += o[k];
  }
  for (const k of TIER_ORDER) out[k] *= 6 / takes.length;
  return out;
}

if (process.argv[1]?.includes('rarity')) {
  const days = Number(process.argv[2] ?? 3), levels = process.argv.slice(3).map(Number).filter((n) => n > 0), jobs = plainJobs(days);
  console.log(`${jobs.length} jobs over ${days} days, played alone; tiers found an hour (six jobs)`);
  console.log(['level', ...TIER_ORDER.map((t) => TIERS[t].name)].join(' | '));
  for (const lv of levels.length ? levels : [1, 5, 10]) {
    const h = perHour(lv, jobs);
    console.log([lv, ...TIER_ORDER.map((t) => (h[t] >= 1 ? h[t].toFixed(1) : h[t].toFixed(3)))].join(' | '));
  }
}
