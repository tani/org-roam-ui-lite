import createClient from "openapi-fetch";
import type { ReactNode } from "react";
import type { components, paths } from "../api/api.d.ts";
import { createOrgHtmlProcessor } from "../utils/processor.ts";
import type { Theme } from "./graph-types.ts"; // Corrected import path

const api = createClient<paths>({ baseUrl: "./" });

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
): Promise<components["schemas"]["Node"] & { body: ReactNode }> {
	const { data, error } = await api.GET("api/node/{id}.json", {
		params: { path: { id: nodeId } },
	});

	if (error) {
		throw error;
	}

	const process = createOrgHtmlProcessor(theme, nodeId);
	const body = await process(data.raw);
	return { ...data, body };
}
