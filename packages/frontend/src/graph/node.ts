import createClient from "openapi-fetch";
import type { ReactNode } from "react";
import type { components, paths } from "../api/api.d.ts";
import { createOrgHtmlProcessor } from "../utils/processor.ts";
import type { Theme } from "./graph-types.ts";

const NODE_API = createClient<paths>();

/**
 * Fetch a single node and convert its Org content to HTML.
 */
export async function openNode(
	theme: Theme,
	nodeId: string,
): Promise<components["schemas"]["Node"] & { body: ReactNode }> {
	const MAX_RETRIES = 15;
	let attempt = 0;
	while (true) {
		try {
			const { data, error } = await NODE_API.GET("/api/node/{id}.json", {
				params: { path: { id: nodeId } },
			});
			if (error) throw error;
			const process = createOrgHtmlProcessor(theme, nodeId);
			const body = await process(data.raw);
			return { ...data, body };
		} catch (err) {
			attempt++;
			if (attempt >= MAX_RETRIES) throw err;
			await new Promise((r) => setTimeout(r, attempt * 200));
		}
	}
}
