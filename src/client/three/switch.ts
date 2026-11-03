/**
 * The VIEW switch in the options box (options.ts): FLAT (the pixel scene) or 2.5D (the 3D view),
 * changed live (mid-fight too; both views draw the same room, so it's only which canvas shows),
 * remembered on this device. ?look=3d (or ?look=2.5d) in the address starts in 2.5D.
 */
import { saveLook, startLook, type Look } from './look';

export class ViewSwitch {
  look: Look = startLook();
  private btn = document.createElement('button');

  constructor(private changed: () => void) {
    this.btn.id = 'viewbtn';
    this.btn.setAttribute('aria-label', 'Switch between the flat view and the 2.5D view');
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = '2.5D shows on jobs for now';
    this.btn.addEventListener('click', () => this.set(this.look === '3d' ? 'pixel' : '3d'));
    document.getElementById('options')?.prepend(this.btn, note);
    this.label();
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
  }
}
