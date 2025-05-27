import { describe, expect, it } from "vitest";
import { decodeBase64url, encodeBase64url } from "../src/utils/base64url.ts";

describe("encodeBase64url/decodeBase64url", () => {
  it("round trip", () => {
    const text = "Hello, world.txt";
    const encoded = encodeBase64url(text);
    const decoded = decodeBase64url(encoded);
    expect(decoded).toBe(text);
  });

  it("does not include padding", () => {
    const text = "foo?";
    const encoded = encodeBase64url(text);
    expect(encoded.includes("=")).toBe(false);
    expect(decodeBase64url(encoded)).toBe(text);
  });
});
