export function encodeBase64url(input: string): string {
	const encoded = new TextEncoder().encode(input);
	const binary = String.fromCharCode(...encoded);
	const base64 = btoa(binary);
	return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64url(input: string): string {
	let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
	const pad = base64.length % 4;
	if (pad) base64 += "=".repeat(4 - pad);
	const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}
