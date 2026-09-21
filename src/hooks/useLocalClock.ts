"use client";

import { useEffect, useState } from "react";

/** Placeholder rendered on the server and during hydration. */
const IDLE = "--:--";

/**
 * 24h wall-clock time in an IANA zone, ticking every 15s.
 *
 * Returns IDLE until after mount — the server has no business guessing the
 * time, and rendering it directly would be a hydration mismatch.
 */
export function useLocalClock(timeZone: string): string {
  const [time, setTime] = useState<string>(IDLE);

  useEffect(() => {
    let formatter: Intl.DateTimeFormat;
    try {
      formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      // Invalid IANA zone in the content file — fall back to local time
      // rather than taking the page down.
      formatter = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    const tick = (): void => {
      setTime(formatter.format(new Date()));
    };

    tick();
    const id = setInterval(tick, 15_000);
    return () => {
      clearInterval(id);
    };
  }, [timeZone]);

  return time;
}
