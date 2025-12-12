import type { ReactNode } from "react";
import { useReducer } from "react";
import { UiDispatchContext, UiStateContext } from "./context.ts";
import type { Action, UiState } from "./reducer.ts";
import { initialState, persistedKeys, uiReducer } from "./reducer.ts";

function persistUiState(state: UiState) {
	const persistedState = Object.fromEntries(
		Object.entries(state).filter(([key]) =>
			persistedKeys.includes(key as keyof UiState),
		),
	);
	localStorage.setItem("uiState", JSON.stringify(persistedState));
}

function applyThemeAttributes(theme: UiState["theme"]) {
	const doc = document.documentElement;
	doc.setAttribute("data-bs-theme", theme.replace(/.*-/, ""));
	doc.setAttribute("data-theme", theme);
}

function uiReducerWithSync(state: UiState, action: Action): UiState {
	const next = uiReducer(state, action);
	try {
		persistUiState(next);
	} catch (e) {
		console.error("Failed to persist uiState", e);
	}
	if (state.theme !== next.theme) {
		applyThemeAttributes(next.theme);
	}
	return next;
}

function initializeState(initial: UiState): UiState {
	try {
		const persistedState = localStorage.getItem("uiState");
		if (persistedState) {
			const stored = JSON.parse(persistedState);
			const merged = { ...initial, ...stored } satisfies UiState;
			applyThemeAttributes(merged.theme);
			return merged;
		}
	} catch (e) {
		console.error("Failed to parse persisted state", e);
	}
	applyThemeAttributes(initial.theme);
	return initial;
}

export function UiProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(
		uiReducerWithSync,
		initialState,
		initializeState,
	);

	return (
		<UiStateContext.Provider value={state}>
			<UiDispatchContext.Provider value={dispatch}>
				{children}
			</UiDispatchContext.Provider>
		</UiStateContext.Provider>
	);
}
