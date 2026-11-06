// The daily budget check (Kyle, 2026-11-05: "at least once a day after big working days and pushes, to
// make sure there's not more ways to save budget"). Prints Redis commands an hour for the steady costs
// and for play, and the month's meter, and compares them with the last run kept in docs/budget-history.jsonl.
//
//   node scripts/budget-check.cjs                 the quick check: tests/townbudget.test.ts (seconds)
//   node scripts/budget-check.cjs --live          and real Chromium on a real redis-server (budget-online.cjs, ~10 min)
//   node scripts/budget-check.cjs --url https://relic.example.app   and the month's meter from /api/room?meter=1
//   --no-save   don't add this run to the history.   SECS=40 the live window per scenario (default 40).
//
// Wrap it in the heavy lock when other work runs on the same machine (it builds and starts browsers with --live).
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..'), HISTORY = path.join(ROOT, 'docs/budget-history.jsonl');
const args = process.argv.slice(2), has = (f) => args.includes(f), val = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const say = (s = '') => process.stdout.write(s + '\n');
const fmt = (n) => (n === null || n === undefined ? '-' : Math.round(n).toLocaleString('en-US'));
/** The live scenarios, what each is, and what Kyle can read it as. */
const LIVE = {
  townIdle: 'one tab idle in town, its first minutes',
  townDozing: 'an idle tab past its 3 minutes (it has left the room)',
  yardSwing: 'a tab in the training yard, swinging nonstop',
  townTwo: 'two players walking about the square, on two instances',
  townApart: 'two players in town, one in a hall, on two instances',
  party2: 'a 2-player job, split over two instances',
  party4: 'a 4-player Barrowfields job, split over two instances',
};

(async () => {
  const out = { at: new Date().toISOString(), commit: git('rev-parse', '--short', 'HEAD'), model: null, live: null, meter: null };

  // 1. The model: the page's real code on a counting socket, the relay's real costs (seconds).
  const tmp = path.join(os.tmpdir(), `budget-model-${process.pid}.json`);
  const t = spawnSync('npx', ['vitest', 'run', 'tests/townbudget.test.ts'], { cwd: ROOT, env: { ...process.env, BUDGET_OUT: tmp }, encoding: 'utf8' });
  if (t.status !== 0) say('The budget tests FAILED (over a limit, or broken): run npx vitest run tests/townbudget.test.ts\n');
  try {
    out.model = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    fs.unlinkSync(tmp);
  } catch { /* the tests didn't get that far */ }
  const m = out.model;
  say('Redis commands an hour, steady costs (one player alone on their instance; tests/townbudget.test.ts):');
  if (m) {
    say(`  idle town tab          ${fmt(m.idleTown?.perHour)}   (limit ${m.limit.idleTown}; ${m.idleTown?.openSecs} s in the room, then it leaves)`);
    say(`  tab in the yard        ${fmt(m.yard?.perHour)}   (limit ${m.limit.yard}; ${m.yard?.words} words to the relay in ${m.yard?.swings} swings)`);
    say(`  relay costs            open ${m.cost.open}, close ${m.cost.close}, swap ${m.cost.swap}, an open quiet socket ${m.cost.quietHour} an hour`);
  } else say('  (no numbers: the tests stopped early)');

  // 2. Live: real Chromium, a real redis-server, INFO commandstats (budget-online.cjs).
  if (has('--live')) {
    say('\nLive (real browsers, a real redis-server; this takes a while)...');
    const r = spawnSync('node', ['scripts/budget-online.cjs', ...Object.keys(LIVE)], { cwd: ROOT, env: { ...process.env, SECS: process.env.SECS || '40' }, encoding: 'utf8', maxBuffer: 1 << 26 });
    try {
      out.live = JSON.parse(r.stdout).scenarios;
    } catch {
      say('  the live run failed:\n' + (r.stderr || '').slice(-2000));
    }
    if (out.live) {
      say('Redis commands an hour, live:');
      for (const [k, what] of Object.entries(LIVE)) {
        const s = out.live[k];
        say(`  ${k.padEnd(11)} ${(s?.error ? 'ERROR' : fmt(s?.perHour)).padStart(8)}   ${what}${s?.ws ? `; page sent ${s.ws.sent} frames, opened ${s.ws.opened}` : ''}`);
      }
    }
  }

  // 3. The month's meter, from the site (one GET on Redis).
  const url = val('--url');
  if (url) {
    const r = spawnSync('curl', ['-sS', '--max-time', '15', url.replace(/\/$/, '') + '/api/room?meter=1'], { encoding: 'utf8' });
    try {
      const v = JSON.parse(r.stdout), now = new Date(), day = now.getUTCDate() + now.getUTCHours() / 24, days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
      out.meter = { month: v.month, used: v.used, limit: v.limit, full: v.full, pace: v.used ? Math.round((v.used / day) * days) : null };
      say(`\nThe month (${v.month}): ${fmt(v.used)} of ${fmt(v.limit)} commands${v.full ? ', FULL: online play is off' : ''}; at this pace, ${fmt(out.meter.pace)} by the month's end (${Math.round((100 * (out.meter.pace ?? 0)) / v.limit)}% of the cap).`);
    } catch {
      say(`\nThe meter didn't answer (${(r.stderr || r.stdout || '').trim().slice(0, 200)})`);
    }
  }

  // Against the last run kept.
  const last = lastRun();
  if (last) {
    say(`\nSince the last check (${last.at.slice(0, 16)}, ${last.commit}):`);
    const d = (a, b) => (a === undefined || b === undefined ? '-' : (b - a >= 0 ? '+' : '') + Math.round(b - a));
    say(`  idle town ${d(last.model?.idleTown?.perHour, m?.idleTown?.perHour)}, yard ${d(last.model?.yard?.perHour, m?.yard?.perHour)}`);
    if (out.live && last.live) say('  live: ' + Object.keys(LIVE).map((k) => `${k} ${d(last.live[k]?.perHour, out.live[k]?.perHour)}`).join(', '));
    if (out.meter && last.meter && last.meter.month === out.meter.month) say(`  the month's meter ${d(last.meter.used, out.meter.used)}`);
  }
  if (!has('--no-save')) fs.appendFileSync(HISTORY, JSON.stringify(out) + '\n');
  process.exit(t.status === 0 ? 0 : 1);
})();

function git(...a) {
  return spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
}
function lastRun() {
  try {
    const lines = fs.readFileSync(HISTORY, 'utf8').trim().split('\n').filter(Boolean);
    return lines.length ? JSON.parse(lines[lines.length - 1]) : null;
  } catch {
    return null;
  }
}
