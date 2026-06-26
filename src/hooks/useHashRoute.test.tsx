// src/hooks/useHashRoute.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHashRoute } from './useHashRoute';

describe('useHashRoute', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('initial state reflects window.location.hash', () => {
    window.location.hash = '#/cheatsheet?q=compact';
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toEqual({
      mode: 'cheatsheet',
      params: { q: 'compact' },
    });
  });

  it('defaults to start when hash is empty', () => {
    const { result } = renderHook(() => useHashRoute());
    expect(result.current[0]).toEqual({ mode: 'start', params: {} });
  });

  it('updates state when a hashchange event fires', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      window.location.hash = '#/quiz?domain=hooks';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current[0]).toEqual({
      mode: 'quiz',
      params: { domain: 'hooks' },
    });
  });

  it('setter updates window.location.hash', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      result.current[1]({ mode: 'playground', params: {} });
    });
    expect(window.location.hash).toBe('#/playground');
  });

  it('setter then hashchange flows back into state', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      result.current[1]({ mode: 'cheatsheet', params: { q: 'compact' } });
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current[0]).toEqual({
      mode: 'cheatsheet',
      params: { q: 'compact' },
    });
  });

  it('setter updates state synchronously without a hashchange event', () => {
    const { result } = renderHook(() => useHashRoute());
    act(() => {
      result.current[1]({ mode: 'keyboard', params: {} });
    });
    expect(result.current[0]).toEqual({ mode: 'keyboard', params: {} });
  });
});
