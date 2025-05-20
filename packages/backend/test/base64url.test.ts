import { describe, expect, it } from "vitest";
import { decodeBase64url, encodeBase64url } from "../src/base64url.ts";

describe("encodeBase64url/decodeBase64url", () => {
	it("round trip", () => {
		const text = "example.png";
		const encoded = encodeBase64url(text);
		const decoded = decodeBase64url(encoded);
		expect(decoded).toBe(text);
	});

	it("handles non-alphanumeric", () => {
		const text = "foo/bar";
		const encoded = encodeBase64url(text);
		expect(decodeBase64url(encoded)).toBe(text);
	});
});
