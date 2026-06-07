import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useScrollRestoration
 *
 * Saves the current page's scroll position (of a given element or window)
 * into sessionStorage keyed by the current pathname.
 * On mount, restores the saved scroll position smoothly.
 *
 * @param elementRef - Optional ref to a scrollable container.
 *                     If omitted, falls back to window scroll.
 */
export function useScrollRestoration(elementRef?: React.RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const key = `scroll_pos::${pathname}`;
  // Track whether we've restored on this mount cycle
  const hasRestored = useRef(false);

  // Save scroll position on scroll events
  useEffect(() => {
    hasRestored.current = false;

    const target = elementRef?.current ?? window;

    const handleScroll = () => {
      const y = elementRef?.current
        ? elementRef.current.scrollTop
        : window.scrollY;
      sessionStorage.setItem(key, String(y));
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    return () => target.removeEventListener('scroll', handleScroll);
  }, [pathname, elementRef, key]);

  // Restore scroll position on mount (after data renders)
  useEffect(() => {
    if (hasRestored.current) return;

    const saved = sessionStorage.getItem(key);
    if (!saved) return;

    const y = parseInt(saved, 10);
    if (isNaN(y)) return;

    // Defer to allow DOM to render content before scrolling
    const raf = requestAnimationFrame(() => {
      if (elementRef?.current) {
        elementRef.current.scrollTop = y;
      } else {
        window.scrollTo({ top: y, behavior: 'instant' });
      }
      hasRestored.current = true;
    });

    return () => cancelAnimationFrame(raf);
  });
}
