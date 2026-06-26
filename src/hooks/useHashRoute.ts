// src/hooks/useHashRoute.ts
import { useCallback, useEffect, useState } from 'react';
import { buildHash, parseHash, type RouteState } from '../lib/router';

export function useHashRoute(): [RouteState, (next: RouteState) => void] {
  const [state, setState] = useState<RouteState>(() =>
    parseHash(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = (): void => {
      setState(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const navigate = useCallback((next: RouteState): void => {
    setState(next);
    window.location.hash = buildHash(next);
  }, []);

  return [state, navigate];
}
