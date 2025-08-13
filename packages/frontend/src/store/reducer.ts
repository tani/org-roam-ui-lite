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
export type Action =
	| { type: "TOGGLE_SETTINGS" }
	| { type: "OPEN_DETAILS" }
	| { type: "CLOSE_DETAILS" }
	| { type: "TOGGLE_DETAILS" }
	| { type: "SET_STATE"; payload: Partial<UiState> };

export const initialState: UiState = {
	theme: window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light",
	renderer: "force-graph",
	layout: "cose",
	nodeSize: 10,
	labelScale: 0.5,
	showLabels: true,
	settingsOpen: false,
	detailsOpen: false,
	selected: {} as components["schemas"]["Node"] & { body?: ReactNode },
};

export const persistedKeys: (keyof UiState)[] = [
	"theme",
	"renderer",
	"layout",
	"nodeSize",
	"labelScale",
	"showLabels",
];

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
