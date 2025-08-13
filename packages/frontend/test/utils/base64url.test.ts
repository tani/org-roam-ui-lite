import { describe, expect, test } from "vitest";
import { decodeBase64url, encodeBase64url } from "../../src/utils/base64url.ts";

describe("encodeBase64url", () => {
	test("encodes simple ASCII string", () => {
		const result = encodeBase64url("hello");
		expect(result).toBe("aGVsbG8");
	});

	test("encodes string with special characters", () => {
		const result = encodeBase64url("hello+world/test=");
		expect(result).toBe("aGVsbG8rd29ybGQvdGVzdD0");
	});

	test("encodes UTF-8 characters", () => {
		const result = encodeBase64url("héllo");
		expect(result).toBe("aMOpbGxv");
	});

	test("encodes empty string", () => {
		const result = encodeBase64url("");
		expect(result).toBe("");
	});

	test("removes padding characters", () => {
		const result = encodeBase64url("any carnal pleasure.");
		expect(result).not.toContain("=");
	});

	test("replaces URL-unsafe characters", () => {
		const result = encodeBase64url("??>>");
		expect(result).not.toContain("+");
		expect(result).not.toContain("/");
	});
});

describe("decodeBase64url", () => {
	test("decodes simple string", () => {
		const result = decodeBase64url("aGVsbG8");
		expect(result).toBe("hello");
	});

	test("decodes string with URL-safe characters", () => {
		const encoded = encodeBase64url("hello+world/test=");
		const result = decodeBase64url(encoded);
		expect(result).toBe("hello+world/test=");
	});

	test("decodes UTF-8 characters", () => {
		const result = decodeBase64url("aMOpbGxv");
		expect(result).toBe("héllo");
	});

	test("decodes empty string", () => {
		const result = decodeBase64url("");
		expect(result).toBe("");
	});

	test("handles strings requiring padding", () => {
		const result = decodeBase64url("YW55IGNhcm5hbCBwbGVhc3VyZS4");
		expect(result).toBe("any carnal pleasure.");
	});
});

describe("encode/decode roundtrip", () => {
	const testCases = [
		"hello world",
		"",
		"a",
		"ab",
		"abc",
		"abcd",
		"test with spaces",
		"special chars: !@#$%^&*()",
		"unicode: 🚀🌟✨",
		"mixed: hello 世界 🌍",
		"base64 chars: +/=",
	];

	test.each(testCases)("roundtrip: %s", (input) => {
		const encoded = encodeBase64url(input);
		const decoded = decodeBase64url(encoded);
		expect(decoded).toBe(input);
	});
});
