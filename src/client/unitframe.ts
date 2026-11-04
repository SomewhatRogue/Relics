/**
 * The unit frame at the top left: your hero's face in an iron socket with the level on its corner, a
 * chunky health bar with a darker trail that drains a moment after a hit, stamina under it (a laptop's;
 * a phone's is the pips round ATTACK), and a row of small marks for what's on you now (blessed, warded,
 * poisoned, brandy, smoke, the church's light). A tap on the face shows the weapon and kit lines. On a
 * job, small hearts under the health bar: the times you can still get back up (alone, a heart each; in a
 * party, your one get-up). Tapped or hovered, they say what they are.
 */
import { heroLook } from './sprites';
import { icon, type IconId } from './icons';
import type { Game } from './game';
import { MAX_DOWNS } from '../sim/run';

/** What the hearts are, on a tap or a hover (Kyle: keep the words plain). */
const UPS_SAY = 'How many more times you can get back up on this job';

const $ = (s: string) => document.querySelector(s) as HTMLElement;

export class UnitFrame {
  private face = $('#hud .face canvas') as HTMLCanvasElement;
  private faceKey = '';
  private trail = 1;
  private trailAt = 0;
  private hpWas = 1;
  private buffKey = '';
  private upsKey = '';
  private upsSaidAt = -9;

  constructor() {
    $('#hud .face').addEventListener('click', (e) => (e.stopPropagation(), document.body.classList.toggle('sheet-open')));
    const ups = $('#hud .ups');
    ups.title = UPS_SAY;
    ups.dataset.say = UPS_SAY;
    ups.addEventListener('click', (e) => (e.stopPropagation(), (this.upsSaidAt = performance.now() / 1000)));
  }

  update(game: Game, now: number): void {
    const me = game.hero, pr = game.profile, t = game.room.time;
    if (!me) return;
    const look = `${pr.cls}${pr.look ?? 0}`;
    if (look !== this.faceKey) this.paintFace(pr.cls, pr.look ?? 0), (this.faceKey = look);
    const lv = $('#hud .lv');
    if (lv.textContent !== String(pr.level)) lv.textContent = String(pr.level);
    // The trail holds where health was for 0.4 s, then drains to it.
    const hp = Math.max(0, me.hp / me.maxHp);
    if (hp < this.hpWas) this.trailAt = now + 0.4;
    if (hp > this.trail) this.trail = hp;
    else if (now > this.trailAt) this.trail = Math.max(hp, this.trail - 0.9 * (1 / 60));
    this.hpWas = hp;
    ($('#hud .hp .trail') as HTMLElement).style.width = this.trail * 100 + '%';
    const low = hp < 0.3 && hp > 0 && game.mode !== 'town';
    $('#hud .hp').classList.toggle('low', low);
    // (The screen's edge darkens red in steps while you're low: hud.css.)
    document.body.classList.toggle('hp-low', low);
    this.hearts(game, now);
    // What's on you now.
    const marks: IconId[] = [];
    if (me.poison) marks.push('poison');
    if (me.blessedUntil > t) marks.push('blessed');
    if (me.wardUntil > t) marks.push('ward');
    if (me.mendLeft > 0) marks.push('mend');
    if (me.brandyUntil > t) marks.push('brandy');
    if (me.hiddenUntil > t || (me.vanishUntil ?? 0) > t) marks.push('smoke');
    if (me.tempoUntil > t) marks.push('tempo');
    const key = marks.join();
    if (key !== this.buffKey) {
      this.buffKey = key;
      const row = $('#hud .buffs');
      row.querySelectorAll('canvas').forEach((c) => c.remove());
      for (const m of marks) {
        const c = document.createElement('canvas'), src = icon(m);
        c.width = src.width;
        c.height = src.height;
        c.getContext('2d')!.drawImage(src, 0, 0);
        c.title = m;
        row.prepend(c);
      }
    }
  }

  /** The get-ups left as hearts, full then hollow; their meaning shown for 2.5 s after a tap. */
  private hearts(game: Game, now: number): void {
    const run = game.mode === 'run' ? game.run : null, me = game.hero, el = $('#hud .ups');
    let full = 0, spent = 0;
    if (run) {
      const solo = game.room.heroes.filter((x) => x.id !== 'squire').length < 2;
      [full, spent] = solo ? [Math.max(0, MAX_DOWNS - run.downs), Math.min(MAX_DOWNS, run.downs)] : me.selfUp ? [0, 1] : [1, 0];
    }
    const key = run ? `${full}/${spent}` : '';
    if (key !== this.upsKey) {
      this.upsKey = key;
      el.hidden = !run;
      el.innerHTML = '<i class="ht"></i>'.repeat(full) + '<i class="ht no"></i>'.repeat(spent);
    }
    el.classList.toggle('say', now - this.upsSaidAt < 2.5);
  }

  /** The head and shoulders of the hero's own sprite, upscaled by whole pixels into the socket. */
  private paintFace(cls: Parameters<typeof heroLook>[0], look: number): void {
    const s = heroLook(cls, look).down.c, g = this.face.getContext('2d')!;
    const w = 14, h = 12;
    this.face.width = w;
    this.face.height = h;
    g.clearRect(0, 0, w, h);
    g.imageSmoothingEnabled = false;
    g.drawImage(s, Math.round((s.width - w) / 2), 0, w, h, 0, 1, w, h);
  }
}
