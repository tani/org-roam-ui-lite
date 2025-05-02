import { parseArgs } from "node:util";

export const args = parseArgs({
	options: {
		database: {
			type: "string",
			short: "d",
		},
		port: {
			type: "string",
			short: "p",
		},
	},
	allowPositionals: true,
});
