import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useUiDispatch, useUiState } from "../../src/store/hooks.ts";
import { UiProvider } from "../../src/store/provider.tsx";

function TestWrapper({ children }: { children: React.ReactNode }) {
	return <UiProvider>{children}</UiProvider>;
}

describe("useUiState", () => {
	test("returns state when used within UiProvider", () => {
		const { result } = renderHook(() => useUiState(), {
			wrapper: TestWrapper,
		});

		expect(result.current).toBeDefined();
		expect(result.current).toHaveProperty("theme");
		expect(result.current).toHaveProperty("renderer");
		expect(result.current).toHaveProperty("layout");
	});

	test("throws error when used outside UiProvider", () => {
		expect(() => {
			renderHook(() => useUiState());
		}).toThrow("useUiState must be used within a UiProvider");
	});
});

describe("useUiDispatch", () => {
	test("returns dispatch function when used within UiProvider", () => {
		const { result } = renderHook(() => useUiDispatch(), {
			wrapper: TestWrapper,
		});

		expect(result.current).toBeDefined();
		expect(typeof result.current).toBe("function");
	});

	test("throws error when used outside UiProvider", () => {
		expect(() => {
			renderHook(() => useUiDispatch());
		}).toThrow("useUiDispatch must be used within a UiProvider");
	});
});
