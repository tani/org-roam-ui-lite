import process from "node:process";
import { parseArgs } from "node:util";

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
