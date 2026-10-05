import { shortest, wrap } from '@Hooks/useCarousel';
import { describe, expect, it } from 'vitest';

// The ring is placed from one continuous position (trap 21); these two are
// what every cover, the readout and keyboard focus are derived from.
describe('the ring maths', () => {
  it('wrap keeps any position inside one revolution', () => {
    expect(wrap(9, 8)).toBe(1);
    expect(wrap(-1, 8)).toBe(7);
    expect(wrap(16, 8)).toBe(0);
  });

  it('shortest takes the nearer way round', () => {
    expect(shortest(7, 8)).toBe(-1);
    expect(shortest(1, 8)).toBe(1);
    expect(shortest(-7, 8)).toBe(1);
  });

  it('a whole revolution is no move at all — trap 35', () => {
    expect(shortest(8, 8)).toBe(0);
    expect(shortest(-8, 8)).toBe(0);
  });
});
