import * as path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { exportSite } from "./export.ts";
import { populate } from "./populate.ts";
import { serve } from "./serve.ts";

const environmentKey = "env";
const environment = globalThis.process?.[environmentKey] ?? {};

function writeOutput(message: string): void {
	process.stdout.write(message);
}

function writeError(message: string): void {
	process.stderr.write(`${message}\n`);
}

function usage(exitCode = 0): never {
	writeOutput(`Usage: org-roam-ui-lite <command> [options]

Commands:
  populate   Create a SQLite database from a directory of Org-roam files
  serve      Serve the backend server and frontend bundle
  export     Export a static site with HTML and JSON API

Options:
  -h, --help  Show help

Command options:
  populate -i DIR -d DB
  serve    -d DB  -p PORT
  export   -d DB  -o OUT
`);
	process.exit(exitCode);
}

function databaseDefault(): string {
	return environment.DATABASE ?? `${environment.HOME}/.emacs.d/org-roam.db`;
}

function cliPath(value: string): string {
	if (path.isAbsolute(value)) {
		return value;
	}
	return path.resolve(environment.INIT_CWD ?? process.cwd(), value);
}

const [command, ...commandArgs] = process.argv.slice(2);

if (!command || command === "-h" || command === "--help") {
	usage(0);
}

switch (command) {
	case "populate": {
		const { values } = parseArgs({
			args: commandArgs,
			options: {
				input: {
					type: "string",
					short: "i",
					default: environment.ORG_ROAM_DIRECTORY ?? process.cwd(),
				},
				database: {
					type: "string",
					short: "d",
					default: environment.DATABASE ?? `${process.cwd()}/org-roam.db`,
				},
				help: { type: "boolean", short: "h" },
			},
		});
		if (values.help) {
			usage(0);
		}
		await populate(cliPath(values.input), cliPath(values.database));
		break;
	}
	case "serve": {
		const { values } = parseArgs({
			args: commandArgs,
			options: {
				database: {
					type: "string",
					short: "d",
					default: databaseDefault(),
				},
				port: {
					type: "string",
					short: "p",
					default: environment.PORT ?? "5174",
				},
				help: { type: "boolean", short: "h" },
			},
		});
		if (values.help) {
			usage(0);
		}
		await serve(cliPath(values.database), Number(values.port));
		break;
	}
	case "export": {
		const { values } = parseArgs({
			args: commandArgs,
			options: {
				database: {
					type: "string",
					short: "d",
					default: databaseDefault(),
				},
				output: {
					type: "string",
					short: "o",
					default: environment.OUTPUT ?? `${process.cwd()}/out`,
				},
				help: { type: "boolean", short: "h" },
			},
		});
		if (values.help) {
			usage(0);
		}
		await exportSite(cliPath(values.database), cliPath(values.output));
		break;
	}
	default:
		writeError(`Unknown command: ${command}`);
		usage(1);
}
