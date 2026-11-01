/**
 * The hero's progress and the world's state, kept in this browser for now. (The shared world moves to
 * the server, api/world.ts, when the group plays online; the shapes stay the same.)
 */
import { newProfile, type Profile } from '../shared/progress';
import { newWorld, type WorldState } from '../shared/story';

const KEY = 'relic.save.v1';
export interface Save { profile: Profile; world: WorldState }

export function load(): Save {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (s && s.profile && s.world) return { profile: { ...newProfile(), ...s.profile }, world: { ...newWorld(), ...s.world } };
  } catch {
    /* no storage here: a fresh start */
  }
  return { profile: newProfile(), world: newWorld() };
}

export function store(s: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private window: progress lasts this session only */
  }
}

export function wipe(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to wipe */
  }
}
