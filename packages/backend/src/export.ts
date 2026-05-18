import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import { dump } from "./dump.ts";

/**
 * Export a static site with frontend bundle and JSON API from an Org-roam database.
 *
 * @param databasePath - Path to the SQLite database
 * @param outputPath - Directory where the site will be written
 */
export async function exportSite(
	databasePath: string,
	outputPath: string,
): Promise<void> {
	const possiblePaths: string[] = [];
	if (process.argv[1]) {
		possiblePaths.push(path.join(path.dirname(process.argv[1]), "index.html"));
	}
	possiblePaths.push(
		path.join(import.meta.dirname ?? "", "../../frontend/dist/index.html"),
	);

	let indexHtml: string | undefined;

	for (const candidatePath of possiblePaths) {
		try {
			indexHtml = await readFile(candidatePath, "utf-8");
			break;
		} catch {
			// empty — try next candidate
		}
	}

	if (indexHtml === undefined) {
		throw new Error(
			`Could not find index.html in any of: ${possiblePaths.join(", ")}`,
		);
	}

	await mkdir(outputPath, { recursive: true });
	await writeFile(path.join(outputPath, "index.html"), indexHtml);
	await dump(databasePath, outputPath);
	console.log(`✅ Exported to ${outputPath}`);
}
