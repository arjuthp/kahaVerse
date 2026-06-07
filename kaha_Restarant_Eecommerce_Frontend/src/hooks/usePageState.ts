import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * usePageState
 *
 * Persists and restores arbitrary page-level state (filters, tabs, etc.)
 * in sessionStorage, keyed by the current route pathname + an optional suffix.
 *
 * Usage:
 *   const [state, setState] = usePageState('menu-filters', {
 *     searchQuery: '',
 *     selectedCategory: 'all',
 *     sortBy: 'default',
 *     serviceType: 'DELIVERY',
 *   });
 *
 * @param stateKey - Unique string identifying this state slice (scoped per pathname)
 * @param defaultValue - The initial/default value when no saved state exists
 */
export function usePageState<T>(stateKey: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const { pathname } = useLocation();
  const storageKey = `page_state::${pathname}::${stateKey}`;

  const [state, setStateInternal] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved !== null) {
        return JSON.parse(saved) as T;
      }
    } catch {
      // ignore parse errors
    }
    return defaultValue;
  });

  // Persist to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state, storageKey]);

  const setState = useCallback((val: T | ((prev: T) => T)) => {
    setStateInternal(prev =>
      typeof val === 'function' ? (val as (p: T) => T)(prev) : val
    );
  }, []);

  return [state, setState];
}

/**
 * clearPageState
 *
 * Clears all saved page states from sessionStorage.
 * Call this on logout or when you want a fresh start.
 */
export function clearAllPageStates() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith('page_state::') || key.startsWith('scroll_pos::'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => sessionStorage.removeItem(k));
}
