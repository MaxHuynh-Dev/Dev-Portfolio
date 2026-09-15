import { useMediaQuery } from '@uidotdev/usehooks';

interface TypeUseIsDevice {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useIsDevice = (): TypeUseIsDevice => {
  const isMobile = useMediaQuery('only screen and (max-width : 767px)');
  const isTablet = useMediaQuery('only screen and (min-width : 768px) and (max-width : 1199px)');
  const isDesktop = useMediaQuery('only screen and (min-width : 1200px)');

  return { isMobile, isTablet, isDesktop };
};
