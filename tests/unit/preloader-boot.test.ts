import {
  PRELOADER_BOOT_SCRIPT,
  PRELOADER_GAVE_UP,
  PRELOADER_GIVE_UP_MS,
  PRELOADER_MOUNTED,
  PRELOADING_ATTR
} from '@Components/Preloader/boot';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The curtain is raised by this script before any bundle loads, and only
// React takes it down. If React never arrives, the script must — or the
// reader is left on blank paper with scrolling locked.
const page = () => {
  const attrs = new Set<string>();
  const html = {
    setAttribute: (name: string) => attrs.add(name),
    removeAttribute: (name: string) => attrs.delete(name)
  };
  const win: Record<string, unknown> = {};
  const run = () =>
    new Function('window', 'document', PRELOADER_BOOT_SCRIPT)(win, { documentElement: html });
  return { attrs, win, run };
};

describe('the preloader boot script', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('raises the curtain at once', () => {
    const { attrs, run } = page();
    run();
    expect(attrs.has(PRELOADING_ATTR)).toBe(true);
  });

  it('lets go by itself when React never mounts', () => {
    const { attrs, win, run } = page();
    run();
    vi.advanceTimersByTime(PRELOADER_GIVE_UP_MS - 1);
    expect(attrs.has(PRELOADING_ATTR)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(attrs.has(PRELOADING_ATTR)).toBe(false);
    expect(win[PRELOADER_GAVE_UP]).toBe(true);
  });

  it('leaves a mounted curtain to React', () => {
    const { attrs, win, run } = page();
    run();
    win[PRELOADER_MOUNTED] = true;
    vi.advanceTimersByTime(PRELOADER_GIVE_UP_MS * 2);
    expect(attrs.has(PRELOADING_ATTR)).toBe(true);
    expect(win[PRELOADER_GAVE_UP]).toBeUndefined();
  });
});
