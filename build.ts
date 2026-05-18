#!/usr/bin/env node
/**
 * Build script that regenerates the dist directory and copies artifacts.
 * Requires Node.js ≥18 with ES modules enabled.
 */
import {
	chmod,
	cp,
	mkdir,
	readdir,
	readFile,
	rm,
	stat,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import checker from "license-checker";

/* ----------------------------- constants and utils ------------------------------- */

const DIST = "dist";
const DIST_MODE = 0o777;
const FILES: [string, string][] = [
	["README.md", `${DIST}/README.md`],
	["LICENSE.md", `${DIST}/LICENSE.md`],
	["packages/frontend/dist/index.html", `${DIST}/index.html`],
	["packages/backend/dist/org-roam-ui-lite.mjs", `${DIST}/org-roam-ui-lite.js`],
	["packages/emacs/org-roam-ui-lite.el", `${DIST}/org-roam-ui-lite.el`],
];

/** Create directory recursively */
const mkdirP = (dir: string): Promise<string | undefined> =>
	mkdir(dir, { recursive: true });

function writeOutput(message: string): void {
	process.stdout.write(`${message}\n`);
}

function writeError(message: string): void {
	process.stderr.write(`${message}\n`);
}

/**
 * Recursively change permissions of a path.
 */
async function chmodR(target: string, mode: number): Promise<void> {
	await chmod(target, mode);
	if ((await stat(target)).isDirectory()) {
		const kids = await readdir(target);
		await Promise.all(kids.map((k) => chmodR(path.join(target, k), mode)));
	}
}

/* ------------------------------- main ----------------------------------- */

try {
	/* 1) remove any existing dist directory */
	await rm(DIST, { recursive: true, force: true });

	const pkgs = await promisify(checker.init)({ start: process.cwd() });
	const LICENSES = Object.entries(pkgs)
		.filter(([, v]) => v.licenseFile)
		.map(([n, v]) => [n, v.licenseFile] as [string, string]);

	const TARGETS: [string, string][] = FILES;

	/* 2) copy files */
	await Promise.all(
		TARGETS.map(async ([src, dst]) => {
			try {
				await mkdirP(path.dirname(dst)); // ensure parent directory
				await cp(src, dst, { recursive: true, force: true });
			} catch {
				/* ignore missing or copy errors for individual items */
			}
		}),
	);

	/* 3) combine licenses into single file with markdown separators */
	const projectLicense = await readFile("LICENSE.md", "utf-8");

	const combinedLicenses = await Promise.all(
		LICENSES.map(async ([name, licenseFile]) => {
			try {
				const content = await readFile(licenseFile, "utf-8");
				const quotedContent = content
					.split("\n")
					.map((line) => `> ${line}`)
					.join("\n");
				return `---\n\n## ${name}\n\n${quotedContent}`;
			} catch {
				return null;
			}
		}),
	);

	const dependencyLicenses = combinedLicenses
		.filter((l) => l !== null)
		.join("\n\n");

	const licenseContent = `${projectLicense}\n\n---\n\n# Dependencies\n\n${dependencyLicenses}`;

	await mkdirP(DIST);
	await writeFile(path.join(DIST, "LICENSE.md"), licenseContent);

	/* 4) make everything under dist world-writable */
	await chmodR(DIST, DIST_MODE);

	writeOutput("build finished");
} catch (e) {
	writeError(`build failed: ${String(e)}`);
	process.exit(1);
}
