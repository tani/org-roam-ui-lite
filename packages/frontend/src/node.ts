import createClient from "openapi-fetch";
import type { components, paths } from "./api.d.ts";
import type { Theme } from "./graph.ts";
import { createOrgHtmlProcessor } from "./processor.ts";

const api = createClient<paths>();

/**
 * Fetch a single node and convert its Org content to HTML.
 *
 * @param theme - Color theme
 * @param nodeId - Node identifier
 * @returns Node information with rendered HTML
 */
export async function openNode(
	theme: Theme,
	nodeId: string,
): Promise<components["schemas"]["Node"] & { html: string }> {
	const { data, error } = await api.GET("/api/node/{id}.json", {
		params: { path: { id: nodeId } },
	});

	if (error) {
		throw error;
	}

	const process = createOrgHtmlProcessor(theme, nodeId);
	const html = String(await process(data.raw));
	return { ...data, html };
}
