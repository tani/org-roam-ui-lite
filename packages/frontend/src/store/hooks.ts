import { useContext } from "react";
import { UiDispatchContext, UiStateContext } from "./context.ts";
import type { Action, UiState } from "./reducer.ts";

export function useUiState(): UiState {
	const context = useContext(UiStateContext);
	if (context === undefined) {
		throw new Error("useUiState must be used within a UiProvider");
	}
	return context;
}

export function useUiDispatch(): React.Dispatch<Action> {
	const context = useContext(UiDispatchContext);
	if (context === undefined) {
		throw new Error("useUiDispatch must be used within a UiProvider");
	}
	return context;
}
