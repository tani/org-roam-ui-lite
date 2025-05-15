#!/usr/bin/env node
/**
 * dist を再生成して成果物をコピーするビルドスクリプト
 * - Node.js ≥18 / ES-Module ("type":"module") 前提
 */
import { access, chmod, cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import checker from "license-checker";

/* ----------------------------- 定数と util ------------------------------- */

const DIST = "dist";
const FILES: [string, string][] = [
	["README.md", `${DIST}/README.md`],
	["LICENSE.md", `${DIST}/LICENSE.md`],
	["packages/emacs", `${DIST}/emacs`],
	["packages/frontend/dist", `${DIST}/frontend/dist`],
	["packages/backend/dist", `${DIST}/backend/dist`],
	["scripts/export.js", `${DIST}/scripts/export.js`],
];

const slugify = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "_");
const mkdirP = (dir: string) => mkdir(dir, { recursive: true });

async function chmodR(target: string, mode: number): Promise<void> {
	await chmod(target, mode);
	if ((await stat(target)).isDirectory()) {
		const kids = await readdir(target);
		await Promise.all(kids.map((k) => chmodR(path.join(target, k), mode)));
	}
}

/* ------------------------------- main ----------------------------------- */

try {
	/* 1) dist を空にする */
	await rm(DIST, { recursive: true, force: true });

	const pkgs = await promisify(checker.init)({ start: process.cwd() });
	const LICENSES = Object.entries(pkgs)
		.filter(([, v]) => v.licenseFile)
		.map(
			([n, v]) =>
				[v.licenseFile, `${DIST}/licenses/${slugify(n)}`] as [string, string],
		);

	const TARGETS: [string, string][] = [...FILES, ...LICENSES];

	/* 3) FILES + LICENSES をまとめてコピー */
	await Promise.all(
		TARGETS.map(async ([src, dst]) => {
			try {
				await access(src); // 存在しないパスはスキップ
				await mkdirP(path.dirname(dst)); // 親ディレクトリを生成
				await cp(src, dst, { recursive: true, force: true });
			} catch {
				/* ignore missing or copy errors for individual items */
			}
		}),
	);

	/* 4) dist 配下のパーミッションを 777 に */
	await chmodR(DIST, 0o777);

	console.log("✅ build finished");
} catch (e) {
	console.error("❌ build failed:", e);
	process.exit(1);
}
