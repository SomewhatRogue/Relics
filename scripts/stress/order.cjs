// Who gets to the job's room first: a friend's socket there before the leader has claimed it (seen
// live: Kyle got 'nohost', the leader claimed 250 ms later, and Kyle froze after loading in).

/** Each party socket of this page on a set instance, optionally held back (scripts/online-server.ts). */
const route = (k, p, extra) => k.ev(p, (extra) => {
  window.__told = [];
  window.__route = (u) => (/[?&]room=P/.test(u) ? u + extra : u);
  // (What the relay tells this page on its party sockets, in order.)
  const WS = window.WebSocket;
  window.WebSocket = class extends WS {
    constructor(url, q) {
      super(url, q);
      if (/[?&]room=P/.test(String(url))) this.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.t !== 'msg' && m.t !== 'pong') window.__told.push(m.t + (m.role ? ':' + m.role : '')); });
    }
  };
}, extra);

/** The leader's room as a friend has it: is it still moving, and does the friend's walking reach the leader? */
async function together(k, lead, p) {
  const t0 = await k.ev(p, () => window.__game.room.time);
  const x0 = (await k.hero(lead, p.id)).x;
  await p.page.keyboard.down('d');
  await k.wait(1500);
  await p.page.keyboard.up('d');
  await k.wait(500);
  const t1 = await k.ev(p, () => window.__game.room.time);
  const x1 = (await k.hero(lead, p.id)).x;
  k.step(`${p.name}'s screen keeps up with the fight (${t0.toFixed(1)} to ${t1.toFixed(1)})`, t1 - t0 > 1.5);
  k.step(`${p.name}'s walking reaches the leader (${x0.toFixed(1)} to ${x1.toFixed(1)})`, x1 - x0 > 1);
}

/**
 * 14. Kyle's socket for the job gets there first, on the other instance from the leader (Sam, held
 * back 700 ms); Ana with Sam. Everyone plays the job through, and keeps playing past the first rooms.
 */
async function friendFirst(k) {
  const sam = await k.open('SAMG', 'WARRIOR'), kyle = await k.open('KYLEG', 'RANGER', true), ana = await k.open('ANAG', 'HEALER', true);
  await route(k, kyle, '&inst=0');
  await route(k, sam, '&inst=1&hold=700');
  await route(k, ana, '&inst=1&hold=900');
  const set = await k.party(sam, kyle, ana);
  const told = await k.ev(kyle, () => window.__told.join(' '));
  k.step(`Kyle got there before Sam claimed it (${told})`, /^nohost hosted/.test(told.replace(/\b(info|role:peer) /g, "")), told);
  if (!set) return;
  for (let i = 0; i < 3; i++) {
    await together(k, sam, kyle);
    await together(k, sam, ana);
    await k.wait(2000);
  }
  const g0 = await k.ev(kyle, () => window.__game.profile.gold);
  k.step('Sam takes them through the job', await k.finish(sam, [kyle, ana]));
  k.step('and Kyle is paid', await k.until(kyle, (g0) => window.__game.mode === 'town' && window.__game.profile.gold > g0, g0, 10000));
}

module.exports = { 14: friendFirst };
