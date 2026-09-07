import { useState, useEffect } from 'react';
import { breakpoints } from '../tokens/breakpoints';

export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < breakpoints.sm) return 'mobile';
    if (width < breakpoints.md) return 'tablet';
    if (width < breakpoints.lg) return 'laptop';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < breakpoints.sm) {
        setBreakpoint('mobile');
      } else if (width < breakpoints.md) {
        setBreakpoint('tablet');
      } else if (width < breakpoints.lg) {
        setBreakpoint('laptop');
      } else {
        setBreakpoint('desktop');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isLaptop: breakpoint === 'laptop',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet',
  };
};
