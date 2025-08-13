import { createContext } from "react";
import type { UiState, Action } from "./reducer.ts";

export const UiStateContext = createContext<UiState | undefined>(undefined);
export const UiDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);
