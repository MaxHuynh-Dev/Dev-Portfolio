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

/**
 * The arrival, when the page is first let go.
 *
 * Every number below is measured off the page the owner asked for, not
 * chosen: nine masked lines rising exactly one mask-height on `power4.out`
 * over 1250ms, 47.65ms apart; the chrome joining 250ms later on the same
 * curve over 1000ms, 60ms apart; and under all of it a ring turning one
 * whole revolution in 2898ms, with the text starting while 476ms of that
 * turn still remains.
 *
 * The DURATIONS are tightened here and the BEATS are not. That is the same
 * trade the list's stagger already makes — the reference has twenty covers
 * to turn and twenty rows to fill, this has eight — and it is the durations
 * that scale with count while the 48ms and 60ms beats are what the cascade
 * reads AS. The ratios between the phases are kept exactly.
 *
 * They live here because this file's premise is that one gesture's numbers
 * sit together, and because the arrival has to be stated against
 * `GATHER_MS`: the reader can reach the `list` button the instant the
 * curtain lifts, so `Library` snaps the arrival to its end on a mode change
 * rather than trusting that nobody clicks inside it.
 */

/**
 * Held after the curtain lets go, before anything moves.
 *
 * The reference has no curtain at all — it is gated on load plus its first
 * cover assets — so this has no counterpart there. It exists because our
 * preloader releases MID-dissolve, at 0.45 of a 620ms handoff, leaving
 * about 340ms of paper still fading over the page. Starting at zero would
 * spend the first phase behind a translucent sheet.
 */
export const ENTRY_LEAD_MS = 340;

/** One whole revolution of the ring. The reference takes 2898ms for 20. */
export const ENTRY_TURN_MS = 1800;

/**
 * When the readout's lines begin, measured from the start of the turn.
 *
 * 0.836 of the turn, which is where the reference puts it — 2422ms into
 * 2898ms. The overlap is the point: the type arrives while the wheel is
 * still moving, so the two read as one gesture rather than two phases.
 */
export const ENTRY_LINES_AT_MS = Math.round(ENTRY_TURN_MS * 0.836);

/** One line's own travel. 1250ms at the reference's twenty. */
export const ENTRY_LINE_MS = 820;

/** And the beat between them, kept at the measured value. */
export const ENTRY_LINE_STAGGER_MS = 48;

/** The chrome joins this long after the first line, as measured. */
export const ENTRY_CHROME_AT_MS = 250;

/** Its own travel, and its own slightly slower beat — both as measured. */
export const ENTRY_CHROME_MS = 700;
export const ENTRY_CHROME_STAGGER_MS = 60;

/** How far the readout's lines start below their masks, in percent. */
export const ENTRY_ROLL_PCT = 100;

/** Everything, end to end. */
export const ENTRY_TOTAL_MS =
  ENTRY_LEAD_MS +
  ENTRY_LINES_AT_MS +
  ENTRY_CHROME_AT_MS +
  3 * ENTRY_CHROME_STAGGER_MS +
  ENTRY_CHROME_MS;

/**
 * How much of the turn the covers spend arriving into view.
 *
 * The reference does not fade its ring at all — it does not have to, because
 * it has no curtain and its wheel is already turning fifteen milliseconds
 * after load, long before anyone can see it. Ours comes out from behind a
 * panel, and a whole revolution is a no-op modulo the cover count, so
 * without this the ring sits at its finished pose through the entire uncover
 * and then jumps away to spin back into it.
 */
export const ENTRY_FADE_SHARE = 0.4;
