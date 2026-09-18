/**
 * The switch between the two views, in one place.
 *
 * Both halves of the gesture are written here because they are one
 * movement: the covers leave the ring and gather into the list's preview
 * slot while the list's own lines rise out of their masks behind them. Split
 * across two files these drift, and the seam shows as a gap in the middle
 * of the switch.
 *
 * The shape is taken from the reference the owner asked for, measured
 * rather than eyeballed: its rows began rising 557ms after the click, 39ms
 * apart, each taking 587ms — starting while the covers were still
 * gathering, not after. The numbers below are that, tightened, because it
 * has eight rows to fill and the reference had twenty.
 */

/** The covers' flight between the ring and the stack. */
export const GATHER_MS = 520;

/**
 * How long after the click the first row starts to rise.
 *
 * Deliberately inside `GATHER_MS`. Waiting for the covers to land first
 * reads as two things happening in turn; overlapping reads as one.
 */
export const ROW_LEAD_MS = 310;

/** Between one row and the next, on the way in. */
export const ROW_STAGGER_MS = 42;

/** And how long each row takes to clear its mask. */
export const ROW_RISE_MS = 560;

/**
 * Leaving is quicker than arriving, and that asymmetry is deliberate: the
 * reader has already decided, so the list gets out of the way rather than
 * performing its exit.
 */
export const ROW_FALL_MS = 280;
export const ROW_FALL_STAGGER_MS = 18;

/** Everything, end to end, for the longest of the two directions. */
export const switchMs = (rows: number): number =>
  Math.max(GATHER_MS, ROW_LEAD_MS + Math.max(0, rows - 1) * ROW_STAGGER_MS + ROW_RISE_MS);
