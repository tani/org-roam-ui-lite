// @ts-check
import { chmod, cp, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

// ────────────────────────────────────────────────────
//  Usage        (short-flag ONLY)
// ────────────────────────────────────────────────────
function usage(exitCode = 0) {
	console.log(
		`Usage: export.ts -d DB -o OUTPUT -r DIR\n\n` +
			`Options (short only):\n` +
			`  -r   Resource folder (required)\n` +
			`  -d   SQLite DB file (required)\n` +
			`  -o   Destination folder (required)\n` +
			`  -h   Show this help\n`,
	);
	process.exit(exitCode);
}

// ────────────────────────────────────────────────────
//  Parse CLI  (short flags: -r -d -o -h)
// ────────────────────────────────────────────────────
const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		r: { type: "string" },
		d: { type: "string" },
		o: { type: "string" },
		h: { type: "boolean" },
	},
});

if (values.h) usage(0);

const res = values.r;
const db = values.d;
const out = values.o;

if (!res || !db || !out) usage(1);

// ────────────────────────────────────────────────────
//  Paths
// ────────────────────────────────────────────────────
const ROOT_DIR = resolve(res!);
const OUTPUT_DIR = resolve(out!);

// ────────────────────────────────────────────────────
//  Pre-flight checks
// ────────────────────────────────────────────────────
try {
	await stat(ROOT_DIR);
} catch {
	throw new Error(`ROOT_DIR not found: ${ROOT_DIR}`);
}

console.log("Exporting Org-roam DB:", db);
console.log("Destination:", OUTPUT_DIR);

// ────────────────────────────────────────────────────
//  Copy frontend bundle
// ────────────────────────────────────────────────────
console.log("Copying frontend bundle…");
await rm(OUTPUT_DIR, { recursive: true, force: true });
await cp(join(ROOT_DIR, "frontend", "dist"), OUTPUT_DIR, { recursive: true });
await chmod(OUTPUT_DIR, 0o777);

// ────────────────────────────────────────────────────
//  Generate JSON API
// ────────────────────────────────────────────────────
console.log("Generating JSON API…");

const { dump } = await import(join(ROOT_DIR, "backend", "dist", "dump.js"));
await dump(db, join(OUTPUT_DIR, "api"));
