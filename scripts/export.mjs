import { resolve } from "node:path";

function usage(exitCode = 0) {
	console.log(
		`Usage: export.ts -d DB -o OUTPUT\n\n` +
			`Options (short / long):\n` +
			`  -d, --database  SQLite DB to export (required)\n` +
			`  -o, --output    Destination folder     (required)\n` +
			`  -h, --help      Show this help\n`,
	);
	process.exit(exitCode);
}

const args = minimist(process.argv.slice(2), {
	string: ["d", "database", "o", "output"],
	boolean: ["h", "help"],
	alias: {
		d: "database",
		o: "output",
		h: "help",
	},
});

if (args.help) usage(0);

const db = args.database ?? "";
const out = args.output ?? "";

if (!db || !out) usage(1);

const ROOT_DIR = resolve(process.env.ROOT_DIR ?? "dist");
const OUTPUT_DIR = resolve(out);

if (!(await fs.exists(ROOT_DIR)))
	throw new Error(`ROOT_DIR not found: ${ROOT_DIR}`);

console.log(chalk.blueBright("Exporting Org-roam DB:"), db);
console.log(chalk.blueBright("Destination:"), OUTPUT_DIR);
console.log(chalk.green("Copying frontend bundle…"));
await fs.remove(OUTPUT_DIR);
await fs.copy(`${ROOT_DIR}/frontend/dist`, OUTPUT_DIR);
await fs.chmod(OUTPUT_DIR, 0o777);
console.log(chalk.green("Generating JSON API…"));
await $`node ${ROOT_DIR}/backend/dist/backend.js -m dump -d ${db} -o ${OUTPUT_DIR}/api`;
console.log(chalk.greenBright("Export finished."));
await fs.chmod(`${OUTPUT_DIR}/assets`, 0o777);
