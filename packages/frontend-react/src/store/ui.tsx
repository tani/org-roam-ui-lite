import { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type { components } from "../api/api.d.ts";
import type { Layout, Renderer, Theme } from "../graph/graph-types.ts";

/** UI state interface */
export interface UiState {
  theme: Theme;
  renderer: Renderer;
  layout: Layout;
  nodeSize: number;
  labelScale: number;
  showLabels: boolean;
  settingsOpen: boolean;
  detailsOpen: boolean;
  selected: components["schemas"]["Node"] & { body?: ReactNode };
}

// Define actions for the reducer
type Action =
  | { type: "TOGGLE_SETTINGS" }
  | { type: "OPEN_DETAILS" }
  | { type: "CLOSE_DETAILS" }
  | { type: "TOGGLE_DETAILS" }
  | { type: "SET_STATE"; payload: Partial<UiState> };

const initialState: UiState = {
  theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  renderer: "force-graph",
  layout: "cose",
  nodeSize: 10,
  labelScale: 0.5,
  showLabels: true,
  settingsOpen: false,
  detailsOpen: false,
  selected: {} as components["schemas"]["Node"] & { body?: ReactNode },
};

const persistedKeys: (keyof UiState)[] = [
  "theme",
  "renderer",
  "layout",
  "nodeSize",
  "labelScale",
  "showLabels",
];

const UiStateContext = createContext<UiState | undefined>(undefined);
const UiDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

export function uiReducer(state: UiState, action: Action): UiState {
  switch (action.type) {
    case "TOGGLE_SETTINGS":
      return { ...state, settingsOpen: !state.settingsOpen };
    case "OPEN_DETAILS":
      return { ...state, detailsOpen: true };
    case "CLOSE_DETAILS":
      return { ...state, detailsOpen: false };
    case "TOGGLE_DETAILS":
      return { ...state, detailsOpen: !state.detailsOpen };
    case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

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

export function useUiState() {
  const context = useContext(UiStateContext);
  if (context === undefined) {
    throw new Error("useUiState must be used within a UiProvider");
  }
  return context;
}

export function useUiDispatch() {
  const context = useContext(UiDispatchContext);
  if (context === undefined) {
    throw new Error("useUiDispatch must be used within a UiProvider");
  }
  return context;
}
