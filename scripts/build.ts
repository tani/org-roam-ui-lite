#!/usr/bin/env node
import process from "node:process";
import fs from "node:fs/promises"; // fs/promises をインポート
import path from "node:path";
import checker, { InitOpts } from "license-checker"; // license-checker とその型をインポート

// license-checker のための基本的な型定義
interface LicenseDetail {
  licenses?: string | string[];
  licenseFile?: string;
  repository?: string;
  publisher?: string;
  email?: string;
  currentPath?: string; // license-checker が返すパスのキー名を path から変更 (path モジュールと区別)
  // license-checker が返す可能性のある他のプロパティ
}

type PackagesInfo = Record<string, LicenseDetail>;

/**
 * エラーが NodeJS.ErrnoException であり、特定のコードを持つかを確認する型ガード
 * @param errorToCheck チェックするエラーオブジェクト
 * @param code 期待されるエラーコード (例: 'ENOENT')
 * @returns エラーが指定されたコードを持つ NodeJS.ErrnoException であれば true
 */
function isErrnoExceptionWithCode(errorToCheck: unknown, code: string): errorToCheck is NodeJS.ErrnoException {
  return errorToCheck instanceof Error && 'code' in errorToCheck && (errorToCheck as NodeJS.ErrnoException).code === code;
}


/**
 * パッケージ名からファイル名用のスラグを生成します。
 * @param s - 元の文字列（パッケージ名など）
 * @returns スラグ化された文字列
 */
function slugify(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_");
}

/**
 * license-checker.init を Promise でラップする関数です。
 * @param options - license-checker の init 関数に渡すオプション
 * @returns 解決されるとパッケージ情報オブジェクトを返します。
 */
function checkLicensesPromise(options: InitOpts): Promise<PackagesInfo> {
  return new Promise((resolve, reject) => {
    checker.init(options, (err, pkgs) => {
      if (err) {
        reject(err);
      } else if (pkgs) {
        // 'path' プロパティを 'currentPath' にリネームして path モジュールとの衝突を避ける
        const renamedPkgs: PackagesInfo = {};
        for (const [key, value] of Object.entries(pkgs)) {
          const { path: packagePath, ...rest } = value;
          renamedPkgs[key] = { ...rest, currentPath: packagePath };
        }
        resolve(renamedPkgs);
      } else {
        reject(new Error("license-checker returned undefined packages without an error."));
      }
    });
  });
}

/**
 * 指定されたパスのファイルまたはディレクトリのパーミッションを再帰的に設定します。
 * @param targetPath パーミッションを設定する対象のパス
 * @param mode 設定するパーミッション (例: 0o777)
 */
async function recursiveChmod(targetPath: string, mode: number): Promise<void> {
  try {
    await fs.chmod(targetPath, mode);
    const stat = await fs.stat(targetPath);
    if (stat.isDirectory()) {
      const files = await fs.readdir(targetPath);
      for (const file of files) {
        await recursiveChmod(path.join(targetPath, file), mode);
      }
    }
  } catch (error: unknown) {
    // 特定のファイルやディレクトリでchmodに失敗しても、処理を続行する場合がある
    // ここではエラーをログに出力するが、必要に応じてエラーハンドリングを調整
    let errorMessage = `Failed to chmod ${targetPath}.`;
    if (error instanceof Error) {
      errorMessage += ` Error: ${error.message}`;
    }
    console.warn(errorMessage);
  }
}


async function main() {
  try {
    // distディレクトリをクリーンアップして再作成
    console.log("Cleaning up and recreating dist directory...");
    try {
      await fs.rm("dist", { recursive: true, force: true });
      console.log("dist directory removed.");
    } catch (error: unknown) {
      if (!isErrnoExceptionWithCode(error, 'ENOENT')) {
        throw error;
      }
      console.log("dist directory did not exist, no removal needed.");
    }

    // 必要なディレクトリ構造を作成
    await fs.mkdir("dist/frontend", { recursive: true });
    await fs.mkdir("dist/backend", { recursive: true });
    await fs.mkdir("dist/scripts", { recursive: true });
    await fs.mkdir("dist/licenses", { recursive: true });
    console.log("dist directory structure created.");

    const copies: Array<[string, string]> = [
      ["README.md", "dist/README.md"],
      ["LICENSE.md", "dist/LICENSE.md"],
      ["packages/emacs", "dist/emacs"],
      ["packages/frontend/dist", "dist/frontend/dist"],
      ["packages/backend/dist", "dist/backend/dist"],
      ["scripts/export.js", "dist/scripts/export.js"],
    ];

    console.log("Copying files and directories...");
    for (const [src, dst] of copies) {
      try {
        await fs.access(src);
      } catch (accessError: unknown) {
        if (isErrnoExceptionWithCode(accessError, 'ENOENT')) {
            console.warn(`Source path ${src} does not exist. Skipping.`);
        } else {
            console.warn(`Could not access source path ${src}. Skipping. Error:`, (accessError instanceof Error ? accessError.message : accessError));
        }
        continue;
      }

      const stat = await fs.stat(src);
      if (stat.isFile()) {
        console.log(`Copying file ${src} to ${dst}`);
        const dstDir = path.dirname(dst);
        try {
          await fs.access(dstDir);
        } catch (dirAccessError: unknown) {
          if (isErrnoExceptionWithCode(dirAccessError, 'ENOENT')) {
            await fs.mkdir(dstDir, { recursive: true });
          } else {
            throw dirAccessError;
          }
        }
        await fs.copyFile(src, dst);
      } else if (stat.isDirectory()) {
        console.log(`Copying directory ${src} to ${dst}`);
        await fs.cp(src, dst, { recursive: true });
      } else {
        console.warn(`Skipping ${src} as it is neither a file nor a directory.`);
      }
    }
    console.log("File and directory copying complete.");

    console.log("Collecting license files...");
    const licensePackages: PackagesInfo = await checkLicensesPromise({ start: process.cwd() } as InitOpts);

    let licensesFound = 0;
    for (const [packageName, licenseInfo] of Object.entries(licensePackages)) {
      if (licenseInfo.licenseFile) {
        const licensesDir = "dist/licenses";
        const licenseDestination = path.join(licensesDir, slugify(packageName));
        try {
          console.log(`Copying license for ${packageName} to ${licenseDestination}`);
          await fs.copyFile(licenseInfo.licenseFile, licenseDestination);
          licensesFound++;
        } catch (copyError: unknown) {
          let errorMessage = "Unknown error";
          if (copyError instanceof Error) {
            errorMessage = copyError.message;
          }
          console.error(`Error copying license file ${licenseInfo.licenseFile} for ${packageName}:`, errorMessage);
        }
      }
    }

    if (licensesFound > 0) {
      console.log(`${licensesFound} license files collected.`);
    } else {
      console.log("No license files found to collect.");
    }

    // fs.chmod を使ってパーミッションを再帰的に設定
    console.log("Setting permissions for dist directory using fs.chmod...");
    await recursiveChmod("dist", 0o777); // 8進数リテラルでパーミッションを指定
    console.log("Permissions set successfully.");

  } catch (mainError: unknown) {
    let errorMessage = "An unknown error occurred during the build process.";
    if (mainError instanceof Error) {
      errorMessage = `An error occurred during the build process: ${mainError.message}`;
    } else if (typeof mainError === 'string') {
      errorMessage = `An error occurred during the build process: ${mainError}`;
    }
    console.error(errorMessage);
    if (mainError instanceof Error && mainError.stack) {
        console.error(mainError.stack);
    }
    process.exit(1);
  }
}

main();

