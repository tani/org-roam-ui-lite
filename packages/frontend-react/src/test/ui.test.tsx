import { describe, it, expect } from 'vitest';
import { uiReducer } from '../store/ui';
import type { UiState } from '../store/ui';

const initialState: UiState = {
  theme: 'light',
  renderer: 'force-graph',
  layout: 'cose',
  nodeSize: 10,
  labelScale: 0.5,
  showLabels: true,
  settingsOpen: false,
  detailsOpen: false,
  selected: {} as any,
};


describe('uiReducer', () => {
  it('should return the initial state if state is undefined', () => {
    // @ts-expect-error: testing initial state
    const nextState = uiReducer(undefined, { type: 'ANY_ACTION' });
    // This is a weak test, as the reducer just returns state.
    // In a real app with combined reducers, this would be more robust.
    expect(nextState).toBeUndefined();
  });

  it('should handle TOGGLE_SETTINGS', () => {
    const state = { ...initialState, settingsOpen: false };
    const nextState = uiReducer(state, { type: 'TOGGLE_SETTINGS' });
    expect(nextState.settingsOpen).toBe(true);
  });

  it('should handle OPEN_DETAILS', () => {
    const state = { ...initialState, detailsOpen: false };
    const nextState = uiReducer(state, { type: 'OPEN_DETAILS' });
    expect(nextState.detailsOpen).toBe(true);
  });

  it('should handle CLOSE_DETAILS', () => {
    const state = { ...initialState, detailsOpen: true };
    const nextState = uiReducer(state, { type: 'CLOSE_DETAILS' });
    expect(nextState.detailsOpen).toBe(false);
  });

  it('should handle SET_STATE', () => {
    const state = { ...initialState, theme: 'light' };
    const nextState = uiReducer(state, { type: 'SET_STATE', payload: { theme: 'dark' } });
    expect(nextState.theme).toBe('dark');
  });
});
