import { useState, useEffect } from 'react';

export interface Breakpoints {
  isMobile: boolean; // < 640px
  isTablet: boolean; // 640px - 1023px
  isDesktop: boolean; // >= 1024px
  isXLarge: boolean; // >= 1280px
  width: number;
  height: number;
}

export interface ResponsiveUtils extends Breakpoints {
  /**
   * Get dynamic container/card padding string based on current breakpoint
   * @param mobilePadding default 'p-4'
   * @param tabletPadding default 'p-6'
   * @param desktopPadding default 'p-8'
   */
  getPadding: (mobilePadding?: string, tabletPadding?: string, desktopPadding?: string) => string;

  /**
   * Get dynamic Tailwind grid columns class string
   * @param mobileCols default 1
   * @param tabletCols default 2
   * @param desktopCols default 3
   * @param xlCols default desktopCols
   */
  getGridColsClass: (mobileCols?: number, tabletCols?: number, desktopCols?: number, xlCols?: number) => string;

  /**
   * Get numeric column count for manual pagination or calculation
   */
  getColumnCount: (mobileCols?: number, tabletCols?: number, desktopCols?: number, xlCols?: number) => number;
}

const BREAKPOINT_SM = 640;
const BREAKPOINT_LG = 1024;
const BREAKPOINT_XL = 1280;

export function useResponsive(): ResponsiveUtils {
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    // Initial check
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    window.addEventListener('resize', handleResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowSize.width < BREAKPOINT_SM;
  const isTablet = windowSize.width >= BREAKPOINT_SM && windowSize.width < BREAKPOINT_LG;
  const isDesktop = windowSize.width >= BREAKPOINT_LG;
  const isXLarge = windowSize.width >= BREAKPOINT_XL;

  const getPadding = (
    mobilePadding = 'p-3.5',
    tabletPadding = 'p-5',
    desktopPadding = 'p-8'
  ): string => {
    if (isMobile) return mobilePadding;
    if (isTablet) return tabletPadding;
    return desktopPadding;
  };

  const getColumnCount = (
    mobileCols = 1,
    tabletCols = 2,
    desktopCols = 3,
    xlCols = desktopCols
  ): number => {
    if (isMobile) return mobileCols;
    if (isTablet) return tabletCols;
    if (isXLarge) return xlCols;
    return desktopCols;
  };

  const getGridColsClass = (
    mobileCols = 1,
    tabletCols = 2,
    desktopCols = 3,
    xlCols = desktopCols
  ): string => {
    const colsMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };

    const count = getColumnCount(mobileCols, tabletCols, desktopCols, xlCols);
    return colsMap[count] || `grid-cols-${count}`;
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    isXLarge,
    width: windowSize.width,
    height: windowSize.height,
    getPadding,
    getGridColsClass,
    getColumnCount,
  };
}

export default useResponsive;
