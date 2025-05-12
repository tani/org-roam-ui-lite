#!/usr/bin/env bun
import { $, file, write } from "bun";

// パッケージ名からファイル名用のスラグを生成
function slugify(s: string): string {
	return s.replace(/[^a-zA-Z0-9]+/g, "_");
}

async function main() {
	// distディレクトリをクリーンアップして再作成
	await $`rm -rf dist`; // rm, mkdir は Bun Shell の組み込みコマンド[1]
	await $`mkdir -p dist dist/frontend dist/backend dist/scripts dist/licenses`;

	// コピー元→コピー先のペアを定義
	const copies = [
		["README.md", "dist/README.md"],
		["LICENSE.md", "dist/LICENSE.md"],
		["packages/emacs", "dist/emacs"],
		["packages/frontend/dist", "dist/frontend/dist"],
		["packages/backend/dist", "dist/backend/dist"],
		["scripts/export.ts", "dist/scripts/export.ts"],
	] as const;

	// ファイル／ディレクトリをコピー
	for (const [src, dst] of copies) {
		// ディレクトリなら再帰的コピー、ファイルなら直接書き込み
		if ((await file(src).exists()) && file(src).type.startsWith("text")) {
			// ファイルのコピー
			await write(dst, file(src)); // Bun.write ＋ Bun.file を使った高速コピー[2]
		} else {
			// ディレクトリはシェルの cp -r で再帰コピー
			await $`cp -r ${src} ${dst}`;
		}
	}

	// ライセンスファイルをまとめて収集
	const licenses = await $`bun run license-checker --json`.json(); // .json() で stdout をパース[1]
	for (const [pkg, info] of Object.entries<{ licenseFile?: string }>(
		licenses,
	)) {
		if (info.licenseFile) {
			const dest = `dist/licenses/${slugify(pkg)}`;
			await write(dest, file(info.licenseFile));
		}
	}
}

await main();
