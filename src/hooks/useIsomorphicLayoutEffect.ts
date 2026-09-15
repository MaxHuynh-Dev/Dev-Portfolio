import { useEffect, useLayoutEffect } from 'react';

/**
 * A hook that resolves to useLayoutEffect on the client and useEffect on the server.
 * This prevents React hydration mismatches while still allowing for layout effects
 * to run as soon as possible on the client.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
