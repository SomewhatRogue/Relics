/**
 * Which view draws a job: the pixel scene (FLAT, the default) or the low-res 3D one (2.5D). Set by
 * ?look=3d (or 2.5d) in the address, or by the VIEW switch (remembered on this device). Also the
 * 3D quality (?q=low|mid|high, or the QUALITY switch, remembered; high on every device unless
 * someone picks less) and the frame-time readout (?perf=1).
 */
export type Look = 'pixel' | '3d';
export type Quality = 'low' | 'mid' | 'high';

const KEY = 'relic.look';
const url = new URLSearchParams(location.search);

/** The view to start in: the address wins, then what this device last chose. */
export function startLook(): Look {
  const u = url.get('look');
  if (u === '3d' || u === '2.5d') return '3d';
  if (u === 'pixel' || u === 'flat' || u === '2d') return 'pixel';
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

const QKEY = 'relic.quality';
const isQ = (q: unknown): q is Quality => q === 'low' || q === 'mid' || q === 'high';

/** The quality to draw at: the address wins, then what this device last chose, then high. */
export function quality(): Quality {
  const q = url.get('q');
  if (isQ(q)) return q;
  try {
    const s = localStorage.getItem(QKEY);
    if (isQ(s)) return s;
  } catch {
    /* nothing remembered */
  }
  return 'high';
}

export function saveQuality(q: Quality): void {
  try {
    localStorage.setItem(QKEY, q);
  } catch {
    /* this session only */
  }
}

export const perfOn = () => url.get('perf') === '1';
