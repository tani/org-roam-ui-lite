import process from "node:process";
import { parseArgs } from "node:util";
import { dump } from "./dump.ts";
import { serve } from "./serve.ts";

export const args = parseArgs({
	options: {
		mode: {
			type: "string",
			short: "m",
			default: process.env.MODE ?? "serve",
		},
		output: {
			type: "string",
			short: "o",
			default: process.env.OUTPUT ?? `${process.cwd()}/dist`,
		},
		database: {
			type: "string",
			short: "d",
			default: process.env.DATABASE ?? `${process.cwd()}/database.db`,
		},
		port: {
			type: "string",
			short: "p",
			default: process.env.PORT ?? "5174",
		},
	},
	allowPositionals: true,
});

switch (args.values.mode) {
	case "dump":
		await dump(args.values.database, args.values.output);
		break;
	case "serve":
		serve(args.values.database, Number(args.values.port));
		break;
}
