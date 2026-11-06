/**
 * Setting out with a party: a short beat first, for the leader and for everyone pulled in, wherever
 * they are in Wickhold (indoors, mid-purchase), so nobody's thrown into a job without a word. Any
 * panel or the pack is closed, the beat says where you're going, and then you go.
 */
import type { Job } from '../shared/jobs';
import type { Game } from './game';
import type { Panel } from './panels';
import { PW } from './partywords';

export const BEAT_MS = 1400;
/** Closes whatever else is open (the pack, chat): set by main.ts. */
let closeAll = () => {};
export const onBeat = (f: () => void) => void (closeAll = f);
let going = false;

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The leader sets out (the HUD card or the board): the party's told at once, and comes down, so nobody more joins. */
export function setOutNow(g: Game, panel: Panel): void {
  const pt = g.parties, job = pt?.myJob, cur = pt?.current();
  if (!pt || !job || !cur || going || pt.hold || !g.canTake(job, cur.members.length)) return;
  // Everyone's told now, so the whole party's beat runs together and they arrive about as the leader does.
  const go = pt.setOut();
  if (!go) return;
  beat(panel, PW.beatLead(job.place.name), () => g.setOut(go), hostLine(go.host, go.members, g.profile.id));
}

/** Pulled into the leader's job: the beat, then `go`. `host`: who runs its room (the best link: shared/hostpick.ts). */
export function followOut(panel: Panel, job: Job, lead: string, go: () => void, host?: { id: string; members: [string, string][]; me: string }): void {
  beat(panel, PW.beatFollow(lead, job.place?.name ?? job.title), go, host && hostLine(host.id, host.members, host.me));
}

/** A word on who hosts, only when it isn't the leader (the first member). */
function hostLine(host: string, members: [string, string][], me: string): string | undefined {
  if (!host || host === members[0]?.[0]) return undefined;
  return host === me ? PW.youHost : PW.hosting(members.find(([id]) => id === host)?.[1] ?? '');
}

function beat(panel: Panel, text: string, then: () => void, note?: string): void {
  closeAll();
  going = true;
  panel.show(PW.beat, `<p>${esc(text)}</p>${note ? `<p>${esc(note)}</p>` : ''}`, [], true);
  setTimeout(() => {
    going = false;
    if (panel.open && document.querySelector('#panel h2')?.textContent?.toUpperCase() === PW.beat) panel.hide();
    then();
  }, BEAT_MS);
}
