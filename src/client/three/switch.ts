/**
 * The VIEW switch in the options box (options.ts): FLAT (the pixel scene) or 2.5D (the 3D view),
 * changed live (mid-fight too; both views draw the same room, so it's only which canvas shows),
 * remembered on this device. ?look=3d (or ?look=2.5d) in the address starts in 2.5D. Under it, while
 * 2.5D is on, QUALITY: LOW / MID / HIGH, changed live and remembered too (?q= in the address wins).
 */
import { quality, saveLook, saveQuality, startLook, type Look, type Quality } from './look';

const ORDER: Quality[] = ['low', 'mid', 'high'];

export class ViewSwitch {
  look: Look = startLook();
  quality: Quality = quality();
  /** Set by views.ts: the 3D view takes the new quality. */
  qualityChanged: (q: Quality) => void = () => undefined;
  private btn = document.createElement('button');
  private qbtn = document.createElement('button');

  constructor(private changed: () => void) {
    this.btn.id = 'viewbtn';
    this.btn.setAttribute('aria-label', 'Switch between the flat view and the 2.5D view');
    this.btn.addEventListener('click', () => this.set(this.look === '3d' ? 'pixel' : '3d'));
    this.qbtn.id = 'qualitybtn';
    this.qbtn.setAttribute('aria-label', 'How detailed the 2.5D view is drawn');
    this.qbtn.addEventListener('click', () => this.setQuality(ORDER[(ORDER.indexOf(this.quality) + 1) % ORDER.length]));
    document.getElementById('options')?.prepend(this.btn, this.qbtn);
    this.label();
  }

  /** LOW, MID or HIGH, live (the 3D view rebuilds its lights and resizes; views.ts listens). */
  setQuality(q: Quality): void {
    this.quality = q;
    saveQuality(q);
    this.label();
    this.qualityChanged(q);
  }

  set(l: Look): void {
    this.look = l;
    saveLook(l);
    this.label();
    this.changed();
  }

  private label(): void {
    this.btn.textContent = this.look === '3d' ? 'VIEW: 2.5D' : 'VIEW: FLAT';
    this.btn.classList.toggle('on', this.look === '3d');
    this.qbtn.textContent = 'QUALITY: ' + this.quality.toUpperCase();
    this.qbtn.hidden = this.look !== '3d';
  }
}
