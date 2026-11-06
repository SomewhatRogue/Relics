/**
 * The trainer's shop and the knacks as one place (Kyle, 2026-11-05: "we should have it be screens and
 * more visual"): one screen with your level, gold and knack picks always at the top, and four tabs of
 * tiles (upgrades.ts, drawn by upgradeview.ts). Tap a tile to open it: the whole effect, now and after,
 * every rank, and its one button (BUY, TAKE or CARRY, or why not). Opened at your trainer (buying), or
 * from the pack (KNACKS: picks taken in Wickhold; the rest a look, with where your trainer is). Which tab
 * was last open is remembered on this device (a per-viewer convenience only).
 */
import type { DrillId } from '../shared/drills';
import { TRAINERS } from '../shared/town';
import type { RelicId } from '../shared/magic';
import type { PerkId } from '../shared/perks';
import type { Game } from './game';
import type { Button, Panel } from './panels';
import { line } from './speech';
import { tileDetail, upgradeTabs, type TabId, type UpOpts } from './upgrades';
import { upDetail, upHead, upTabBody } from './upgradeview';
import { UPW } from './upgradewords';
import { KNW } from './treewords';

const KEY = 'relic.upgrades.tab';
const lastTab = (): TabId => {
  try {
    const t = localStorage.getItem(KEY) as TabId | null;
    return t && ['skills', 'moves', 'ranks', 'knacks'].includes(t) ? t : 'skills';
  } catch {
    return 'skills';
  }
};
const keepTab = (t: TabId) => {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    // Private window or blocked storage: it just won't be remembered.
  }
};

export interface UpScreen {
  /** The panel's heading. */
  title: string;
  /** At your trainer: buying is open. */
  atTrainer: boolean;
  /** Who's talking, and one spoken line (shown once, as the screen opens). */
  who?: string;
  greet?: string;
  /** Extra buttons (Maeve's YOUR HOUND), and what BACK goes to (none: CLOSE only). */
  extra?: Button[];
  back?: () => void;
  /** Ask before giving every knack back (treeui.ts). */
  reset?: (again: () => void) => void;
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/** The screen on tab `tab` (none: the one last open). */
export function openUpgrades(g: Game, panel: Panel, s: UpScreen, tab: TabId = lastTab(), greet = true): void {
  const p = g.profile, o: UpOpts = { atTrainer: s.atTrainer, knacksOpen: g.knacksOpen }, tabs = upgradeTabs(p, o), on = tabs.find((t) => t.id === tab)!;
  keepTab(tab);
  const again = (t: TabId = tab) => openUpgrades(g, panel, s, t, false);
  const say = greet && s.greet && s.who ? `<p class="up-greet"><b>${s.who}:</b> ${line(`"${s.greet}"`, s.who)}</p>` : '';
  const buttons: Button[] = [...(s.extra ?? [])];
  if (tab === 'knacks' && g.knacksOpen && p.perks.length && s.reset) buttons.push({ label: KNW.reset, act: () => s.reset!(() => again()) });
  if (s.back) buttons.push({ label: UPW.back, act: s.back });
  panel.show(s.title, upHead(p, tabs, tab) + say + `<div class="up-tab" data-on="${on.id}">${upTabBody(on)}</div>`, buttons);
  const root = document.getElementById('panel')!;
  root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.addEventListener('click', () => again(b.dataset.tab as TabId)));
  root.querySelectorAll<HTMLElement>('[data-tile]').forEach((b) => b.addEventListener('click', () => openTile(g, panel, s, tab, b.dataset.tile!)));
}

/** What a tile's button does: pay the trainer, carry a skill, take a knack. */
function act(g: Game, key: string, what: string): void {
  const [kind, id] = key.split(':');
  if (what === 'pick') return g.pickPerk(id as PerkId);
  if (what === 'carry') return g.chooseSkill(id as RelicId);
  if (kind === 'learn') return id === 'skill' || id === 'leave' ? g.learn(id) : g.learnSkill(id as RelicId);
  if (kind === 'tech') return g.buyDrill('technique');
  if (kind === 'rung') return g.buyDrill('ladder');
  if (kind === 'drill') g.buyDrill(id as DrillId);
}

/** One tile opened, with BACK to its tab. */
export function openTile(g: Game, panel: Panel, s: UpScreen, tab: TabId, key: string): void {
  const p = g.profile, o: UpOpts = { atTrainer: s.atTrainer, knacksOpen: g.knacksOpen }, t = TRAINERS[p.cls];
  const d = tileDetail(p, key, o, { who: titleCase(t.name), where: t.where });
  const back = () => openUpgrades(g, panel, s, tab, false);
  if (!d) return back();
  const buttons: Button[] = [];
  // Bought, it stays open on the next rank; carried or taken, back to the tab.
  if (d.button) buttons.push({ label: d.button.label, primary: d.button.on, disabled: !d.button.on, act: () => (act(g, key, d.button!.act), d.button!.act === 'buy' ? openTile(g, panel, s, tab, key) : back()) });
  buttons.push({ label: UPW.back, act: back });
  panel.show(s.title, upHead(p, upgradeTabs(p, o), tab) + upDetail(d), buttons);
  document.querySelectorAll<HTMLElement>('#panel [data-tab]').forEach((b) => b.addEventListener('click', () => openUpgrades(g, panel, s, b.dataset.tab as TabId, false)));
}
