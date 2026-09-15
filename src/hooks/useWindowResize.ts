'use client';

import { useGSAP } from '@gsap/react';
import { type Signal, useComputed, useSignal, useSignalEffect } from '@preact/signals-react';
import { useEffect, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

interface IDimension {
  width: Signal<number>;
  height: Signal<number>;
  isMobile: Signal<boolean>;
  isTablet: Signal<boolean>;
  isDesktop: Signal<boolean>;
  scrollHeight: Signal<number>;
}

const useWindowResize = (): IDimension => {
  const width = useSignal(0);
  const height = useSignal(0);
  const scrollHeight = useSignal(0);

  const listener = (): void => {
    width.value = window.innerWidth || document.body.clientWidth || 0;

    height.value = window.innerHeight || document.body.clientHeight || 0;

    scrollHeight.value = document.body.scrollHeight;
  };

  useGSAP(() => {
    const resizeObserver = new ResizeObserver((): void => {
      scrollHeight.value = document.body.scrollHeight;
    });

    resizeObserver.observe(document.body);
    return (): void => {
      resizeObserver.unobserve(document.body);
      resizeObserver.disconnect();
    };
  });

  const deBounceListener = useDebounceCallback(listener, 150);

  useEffect(() => {
    deBounceListener();
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('resize', deBounceListener);
    return (): void => {
      window.removeEventListener('resize', deBounceListener);
    };
  }, [deBounceListener]);

  const isMobile = useComputed(() => {
    return width.value < 768;
  });

  const isTablet = useComputed(() => {
    return width.value >= 768 && width.value < 1199;
  });

  const isDesktop = useComputed(() => {
    return width.value >= 1200;
  });
  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    scrollHeight
  };
};

export const useIsMobile = (): boolean => {
  const [is, setIs] = useState<boolean>(false);
  const { isMobile } = useWindowResize();
  useSignalEffect((): void => {
    setIs(isMobile.value);
  });

  return is;
};

export const useIsDesktop = (): boolean => {
  const [is, setIs] = useState<boolean>(false);
  const { isDesktop } = useWindowResize();
  useSignalEffect((): void => {
    setIs(isDesktop.value);
  });
  return is;
};

export const useIsTablet = (): boolean => {
  const [is, setIs] = useState<boolean>(false);
  const { isTablet } = useWindowResize();
  useSignalEffect((): void => {
    setIs(isTablet.value);
  });

  return is;
};

export default useWindowResize;
