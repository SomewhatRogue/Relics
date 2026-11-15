/**
 * The new look's chase camera in town (docs/design/new-look.md, three/camera3d.ts under `?hd&street`): how far it has
 * turned from looking north (radians, east positive). The stick turns with it (input.ts) so pushing up still walks
 * away from the camera; the figures' cards turn to face it (three/figs3d.ts). 0 everywhere else. No imports, so
 * input.ts can read it without pulling the 3D view in.
 */
export const SWING = { yaw: 0 };

/** A stick or key direction (screen: right +x, down +y) turned into the room by the camera's swing. */
export function swung(mx: number, my: number): [number, number] {
  const y = SWING.yaw;
  if (!y) return [mx, my];
  const c = Math.cos(y), s = Math.sin(y);
  return [mx * c - my * s, mx * s + my * c];
}

// Test hook (scripts/street-look.cjs): hold the swing for a screenshot.
if (typeof window !== 'undefined') (window as unknown as { __swing: typeof SWING }).__swing = SWING;
