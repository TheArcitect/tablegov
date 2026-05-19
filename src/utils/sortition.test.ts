import { describe, it, expect } from 'vitest';
import { seededShuffle } from './crypto';

// SortitionEngine.tsx selects N stakeholders by calling
// seededShuffle(pool, seed).slice(0, N). These smoke tests
// exercise the deterministic primitive that backs that flow.

interface Candidate {
  id: string;
  name: string;
}

function makePool(size: number): Candidate[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `s${i}`,
    name: `Stakeholder ${i}`,
  }));
}

describe('sortition: determinism', () => {
  it('produces identical results across 10 runs with the same seed and pool', () => {
    const pool = makePool(50);
    const seed = 'a1b2c3d4e5f60718';

    const first = seededShuffle(pool, seed);

    for (let i = 0; i < 9; i++) {
      const next = seededShuffle(pool, seed);
      expect(next).toEqual(first);
    }
  });

  it('produces different orderings for different seeds (sanity)', () => {
    const pool = makePool(50);
    const a = seededShuffle(pool, 'aaaaaaaa00000001');
    const b = seededShuffle(pool, 'bbbbbbbb00000002');
    expect(a).not.toEqual(b);
  });
});

describe('sortition: distribution', () => {
  it('every candidate in a pool of 100 appears in the top-3 across 1000 different seeds', () => {
    const pool = makePool(100);
    const seen = new Set<string>();

    for (let i = 1; i <= 1000; i++) {
      const seed = i.toString(16).padStart(8, '0');
      const shuffled = seededShuffle(pool, seed);
      seen.add(shuffled[0].id);
      seen.add(shuffled[1].id);
      seen.add(shuffled[2].id);
    }

    expect(seen.size).toBe(100);
  });
});
