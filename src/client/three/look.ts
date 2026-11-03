/**
 * Which view draws a job: the pixel scene (the default) or the low-res 3D one. Set by ?look=3d in the
 * address, or by the VIEW switch (remembered on this device). Also the 3D quality (?q=low|mid|high,
 * mid on a phone, high otherwise) and the frame-time readout (?perf=1).
 */
export type Look = 'pixel' | '3d';
export type Quality = 'low' | 'mid' | 'high';

const KEY = 'relic.look';
const url = new URLSearchParams(location.search);

/** The view to start in: the address wins, then what this device last chose. */
export function startLook(): Look {
  const u = url.get('look');
  if (u === '3d') return '3d';
  if (u === 'pixel' || u === '2d') return 'pixel';
  try {
    return localStorage.getItem(KEY) === '3d' ? '3d' : 'pixel';
  } catch {
    return 'pixel';
  }
}

export function saveLook(l: Look): void {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* this session only */
  }
}

/**
 * The quality knob. `area`: how many low-res pixels the scene is painted at (fewer is cheaper and
 * chunkier); `lights`: point lights at once; `shadow`: the moon's shadow map size (0: blob shadows only).
 */
export interface QualitySpec { area: number; lights: number; shadow: number }
export const QUALITY: Record<Quality, QualitySpec> = {
  low: { area: 40000, lights: 4, shadow: 0 },
  mid: { area: 62000, lights: 8, shadow: 1024 },
  high: { area: 90000, lights: 12, shadow: 2048 },
};

export function quality(): Quality {
  const q = url.get('q');
  if (q === 'low' || q === 'mid' || q === 'high') return q;
  return matchMedia('(pointer: coarse)').matches ? 'mid' : 'high';
}

export const perfOn = () => url.get('perf') === '1';
