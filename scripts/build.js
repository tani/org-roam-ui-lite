#!/usr/bin/env node
/**
 * Build script that regenerates the dist directory and copies artifacts.
 * Requires Node.js ≥18 with ES modules enabled.
 */
import { access, chmod, cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import checker from "license-checker";
/* ----------------------------- constants and utils ------------------------------- */
const DIST = "dist";
const FILES = [
  ["README.md", `${DIST}/README.md`],
  ["LICENSE.md", `${DIST}/LICENSE.md`],
  ["packages/emacs", `${DIST}/emacs`],
  ["packages/frontend/dist", `${DIST}/frontend/dist`],
  ["packages/backend/dist", `${DIST}/backend/dist`],
  ["scripts/export.js", `${DIST}/scripts/export.js`],
];
/** Replace non-alphanumeric characters with underscores */
const slugify = (s) => s.replace(/[^a-zA-Z0-9]+/g, "_");
/** Create directory recursively */
const mkdirP = (dir) => mkdir(dir, { recursive: true });
/**
 * Recursively change permissions of a path.
 */
async function chmodR(target, mode) {
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
    .map(([n, v]) => [v.licenseFile, `${DIST}/licenses/${slugify(n)}`]);
  const TARGETS = [...FILES, ...LICENSES];
  /* 3) copy files and licenses */
  await Promise.all(TARGETS.map(async ([src, dst]) => {
    try {
      await access(src); // skip if path does not exist
      await mkdirP(path.dirname(dst)); // ensure parent directory
      await cp(src, dst, { recursive: true, force: true });
    } catch {
      /* ignore missing or copy errors for individual items */
    }
  }));
  /* 4) make everything under dist world-writable */
  await chmodR(DIST, 0o777);
  console.log("✅ build finished");
} catch (e) {
  console.error("❌ build failed:", e);
  process.exit(1);
}
