import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UiProvider } from "../../store/provider.tsx";
import { useDetailsPanel } from "../useDetailsPanel.ts";

// Create a wrapper for hooks that need UiProvider context
function createWrapper() {
	return function Wrapper({ children }: { children: ReactNode }) {
		return <UiProvider>{children}</UiProvider>;
	};
}

describe("useDetailsPanel Hook", () => {
	const mockResetNodeHighlight = vi.fn();
	const mockHighlightNode = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("provides closeDetails and toggleDetails functions", () => {
		const { result } = renderHook(
			() =>
				useDetailsPanel({
					detailsOpen: false,
					resetNodeHighlight: mockResetNodeHighlight,
					highlightNode: mockHighlightNode,
					selectedId: "",
				}),
			{ wrapper: createWrapper() },
		);

		expect(result.current.closeDetails).toBeTypeOf("function");
		expect(result.current.toggleDetails).toBeTypeOf("function");
	});

	it("closeDetails calls resetNodeHighlight", () => {
		const { result } = renderHook(
			() =>
				useDetailsPanel({
					detailsOpen: true,
					resetNodeHighlight: mockResetNodeHighlight,
					highlightNode: mockHighlightNode,
					selectedId: "test-id",
				}),
			{ wrapper: createWrapper() },
		);

		result.current.closeDetails();
		expect(mockResetNodeHighlight).toHaveBeenCalledTimes(1);
	});

	it("toggleDetails opens details when closed", () => {
		const { result } = renderHook(
			() =>
				useDetailsPanel({
					detailsOpen: false,
					resetNodeHighlight: mockResetNodeHighlight,
					highlightNode: mockHighlightNode,
					selectedId: "test-id",
				}),
			{ wrapper: createWrapper() },
		);

		result.current.toggleDetails();
		// Should call highlightNode when opening with a selected node
		expect(mockHighlightNode).toHaveBeenCalledWith("test-id");
	});

	it("toggleDetails closes details when open", () => {
		const { result } = renderHook(
			() =>
				useDetailsPanel({
					detailsOpen: true,
					resetNodeHighlight: mockResetNodeHighlight,
					highlightNode: mockHighlightNode,
					selectedId: "test-id",
				}),
			{ wrapper: createWrapper() },
		);

		result.current.toggleDetails();
		// Should call resetNodeHighlight when closing
		expect(mockResetNodeHighlight).toHaveBeenCalledTimes(1);
	});

	it("toggleDetails does not highlight when no selectedId", () => {
		const { result } = renderHook(
			() =>
				useDetailsPanel({
					detailsOpen: false,
					resetNodeHighlight: mockResetNodeHighlight,
					highlightNode: mockHighlightNode,
					selectedId: "",
				}),
			{ wrapper: createWrapper() },
		);

		result.current.toggleDetails();
		// Should not call highlightNode when no selected node
		expect(mockHighlightNode).not.toHaveBeenCalled();
	});

	it("integrates with UI context", () => {
		const { result } = renderHook(
			() =>
				useDetailsPanel({
					detailsOpen: false,
					resetNodeHighlight: vi.fn(),
					highlightNode: vi.fn(),
					selectedId: "",
				}),
			{ wrapper: createWrapper() },
		);

		// Should not throw and should return expected interface
		expect(result.current).toHaveProperty("closeDetails");
		expect(result.current).toHaveProperty("toggleDetails");
	});
});
