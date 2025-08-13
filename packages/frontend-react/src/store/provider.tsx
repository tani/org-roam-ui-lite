import { useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import { uiReducer, initialState, persistedKeys } from "./reducer.ts";
import { UiStateContext, UiDispatchContext } from "./context.ts";
import type { UiState } from "./reducer.ts";

export function UiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState, (initial) => {
    try {
      const persistedState = localStorage.getItem("uiState");
      if (persistedState) {
        const stored = JSON.parse(persistedState);
        return { ...initial, ...stored };
      }
    } catch (e) {
      console.error("Failed to parse persisted state", e);
    }
    return initial;
  });

  useEffect(() => {
    const persistedState = Object.fromEntries(
      Object.entries(state).filter(([key]) =>
        persistedKeys.includes(key as keyof UiState)
      )
    );
    localStorage.setItem("uiState", JSON.stringify(persistedState));
  }, [state]);

  useEffect(() => {
    const doc = document.documentElement;
    doc.setAttribute("data-bs-theme", state.theme.replace(/.*-/, ""));
    doc.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  return (
    <UiStateContext.Provider value={state}>
      <UiDispatchContext.Provider value={dispatch}>
        {children}
      </UiDispatchContext.Provider>
    </UiStateContext.Provider>
  );
}
