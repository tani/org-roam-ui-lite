#!/usr/bin/env bun
import process from "node:process";
import { $, file, write } from "bun";
import checker from "license-checker";

// パッケージ名からファイル名用のスラグを生成
function slugify(s: string): string {
	return s.replace(/[^a-zA-Z0-9]+/g, "_");
}

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
checker.init({ start: process.cwd() }, async (err, pkgs) => {
	if (!err) {
		for (const [key, value] of Object.entries(pkgs)) {
			if (value.licenseFile) {
				const dest = `dist/licenses/${slugify(key)}`;
				await write(dest, file(value.licenseFile));
			}
		}
	}
});

await $`chmod -R 777 dist`;
