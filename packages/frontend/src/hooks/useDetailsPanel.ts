import { useCallback } from "react";
import { useUiDispatch } from "../store/hooks.ts";

interface UseDetailsPanelProps {
	detailsOpen: boolean;
	resetNodeHighlight: () => void;
	highlightNode: (nodeId: string) => void;
	selectedId: string;
}

export function useDetailsPanel({
	detailsOpen,
	resetNodeHighlight,
	highlightNode,
	selectedId,
}: UseDetailsPanelProps) {
	const dispatch = useUiDispatch();

	const closeDetails = useCallback(() => {
		dispatch({ type: "CLOSE_DETAILS" });
		resetNodeHighlight();
	}, [dispatch, resetNodeHighlight]);

	const toggleDetails = useCallback(() => {
		if (detailsOpen) {
			closeDetails();
		} else {
			dispatch({ type: "OPEN_DETAILS" });
			if (selectedId) {
				highlightNode(selectedId);
			}
		}
	}, [detailsOpen, closeDetails, dispatch, selectedId, highlightNode]);

	return {
		closeDetails,
		toggleDetails,
	};
}
