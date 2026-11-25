/** The wilds' map marks (client/landmarks.ts): what is placed for a given profile and room. */
import { describe, expect, it } from 'vitest';
import { landMarks } from '../src/client/landmarks';
import { SeenGrid } from '../src/client/landseen';

const base = {
  land: 'gatefields' as const,
  zones: [{ name: 'THE GATE ROAD', kind: 'zone', x: 0, y: 100, w: 80, h: 40 }, { name: 'THE FIELD BARN', kind: 'scape', x: 10, y: 60, w: 20, h: 10 }, { name: 'THE WOOD', kind: 'zone', x: 0, y: 0, w: 80, h: 30 }],
  stations: [{ name: 'THE FIELD BARN', x: 20, y: 65 }, { name: 'THE CHARCOAL HUT', x: 60, y: 30 }],
  foes: [{ x: 10, y: 40, pack: 405, kind: 'scrapper', hp: 5 }, { x: 14, y: 44, pack: 405, kind: 'scrapper', hp: 5 }, { x: 14, y: 44, pack: 405, kind: 'scrapper', hp: 0 }, { x: 70, y: 20, pack: 406, kind: 'pouncer', hp: 5 }],
  gate: { x: 40, y: 142 },
};

describe('landMarks', () => {
  it('shows nothing of unseen ground but the ways, and shelters and zones once seen', () => {
    const none = landMarks({ ...base, profile: {}, seen: () => false });
    expect(none.zones).toEqual([]), expect(none.shelters).toEqual([]), expect(none.ways.map((w) => w.name)).toEqual(['THE NORTH GATE', 'ON INTO THE FEN']);
    const g = new SeenGrid(80, 144);
    g.look([{ x: 20, y: 65 }, { x: 40, y: 120 }]);
    const m = landMarks({ ...base, profile: { shelters: ['THE FIELD BARN'] }, seen: (x, y) => g.at(x, y) });
    expect(m.zones.map((z) => z.name)).toEqual(['THE GATE ROAD']);
    expect(m.shelters).toEqual([{ name: 'THE FIELD BARN', x: 20, y: 65, found: true }]);
  });
  it('marks a held bounty by its living pack, and not once done or not held', () => {
    const seen = () => true;
    const m = landMarks({ ...base, profile: { bounties: [{ id: 'wolves', day: 1, got: 2 }] }, seen });
    expect(m.bounties).toEqual([{ name: 'THE WOLVES', x: 12, y: 42 }]);
    expect(landMarks({ ...base, profile: { bounties: [{ id: 'wolves', day: 1, got: 5 }] }, seen }).bounties).toEqual([]);
    expect(landMarks({ ...base, profile: {}, seen }).bounties).toEqual([]);
  });
  it('the fen has its way back, not a gate', () => {
    const m = landMarks({ ...base, land: 'fenroam', profile: {}, seen: () => false });
    expect(m.ways.map((w) => w.name)).toEqual(['BACK TO THE NORTH FIELDS']);
  });
});
