import { describe, it, expect } from 'vitest';
import { uiReducer, initialState, type UiState } from '../store/reducer';
import type { components } from '../api/api.d';
import type { ReactNode } from 'react';

const testInitialState: UiState = {
  ...initialState,
  selected: {} as components['schemas']['Node'] & { body?: ReactNode },
};


describe('uiReducer', () => {
  it('should return the initial state if state is undefined', () => {
    // @ts-expect-error: testing initial state
    const nextState = uiReducer(undefined, { type: 'ANY_ACTION' });
    expect(nextState).toBeUndefined();
  });

  it('should handle TOGGLE_SETTINGS', () => {
    const state = { ...testInitialState, settingsOpen: false };
    const nextState = uiReducer(state, { type: 'TOGGLE_SETTINGS' });
    expect(nextState.settingsOpen).toBe(true);
  });

  it('should handle OPEN_DETAILS', () => {
    const state = { ...testInitialState, detailsOpen: false };
    const nextState = uiReducer(state, { type: 'OPEN_DETAILS' });
    expect(nextState.detailsOpen).toBe(true);
  });

  it('should handle CLOSE_DETAILS', () => {
    const state = { ...testInitialState, detailsOpen: true };
    const nextState = uiReducer(state, { type: 'CLOSE_DETAILS' });
    expect(nextState.detailsOpen).toBe(false);
  });

  it('should handle SET_STATE', () => {
    const state = { ...testInitialState, theme: 'light' as const };
    const nextState = uiReducer(state, { type: 'SET_STATE', payload: { theme: 'dark' as const } });
    expect(nextState.theme).toBe('dark');
  });
});
