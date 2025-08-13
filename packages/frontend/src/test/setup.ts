import * as matchers from "@testing-library/jest-dom/matchers";
import { expect, vi } from "vitest";

expect.extend(matchers);

// Mock window.matchMedia for Vitest/JSDOM
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});
