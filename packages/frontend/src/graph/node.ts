import createClient from "openapi-fetch";
import type { VNode } from "vue";
import type { components, paths } from "../api/api.d.ts";
import type { Theme } from "./graph.ts";
import { createOrgHtmlProcessor } from "../utils/processor.ts";

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
): Promise<components["schemas"]["Node"] & { body: VNode }> {
  const { data, error } = await api.GET("/api/node/{id}.json", {
    params: { path: { id: nodeId } },
  });

  if (error) {
    throw error;
  }

  const process = createOrgHtmlProcessor(theme, nodeId);
  const body = await process(data.raw);
  return { ...data, body };
}
