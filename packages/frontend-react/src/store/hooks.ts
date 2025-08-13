import { useContext } from "react";
import { UiStateContext, UiDispatchContext } from "./context";

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
