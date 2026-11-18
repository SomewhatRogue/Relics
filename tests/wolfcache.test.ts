// The wolf's sprites are kept by the picture they draw: a standing wolf's tail swings through a new
// number every frame, but only a handful of pictures come of it, and one key is always one picture.
import { describe, expect, it } from 'vitest';
import { houndMap } from '../src/client/houndbody';
import { poseOf } from '../src/client/houndposes';

const LOOK = { breed: 'wolfhound', coat: 0, mark: 'none', name: '' } as const;

describe('wolf sprite keys', () => {
  it('a few thousand tail swings make only a few pictures', () => {
    const pics = new Map<string, string>();
    const t0 = performance.now();
    for (let i = 0; i < 4000; i++) {
      const m = houndMap(LOOK, poseOf('stand', 0, Math.sin(i * 0.0317 + 3) * 6)), key = JSON.stringify(m);
      // Same key, same parts and head (the key is the whole map, so this is by construction).
      const had = pics.get(key);
      if (had) expect(had).toBe(JSON.stringify(m.parts) + JSON.stringify(m.at));
      else pics.set(key, JSON.stringify(m.parts) + JSON.stringify(m.at));
    }
    const ms = (performance.now() - t0) / 4000;
    console.log(`wolf stand: ${pics.size} pictures from 4000 poses, ${ms.toFixed(3)} ms a miss`);
    expect(pics.size).toBeLessThan(40);
  });
});
