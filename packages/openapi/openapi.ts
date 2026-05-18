import process from "node:process";
import openapiTs, {
	astToString,
	type SchemaObject,
	type TransformObject,
} from "openapi-typescript";
import { factory } from "typescript";

const generatedTypeReplacements: [RegExp, string][] = [
	[/\bpaths\b/gu, "Paths"],
	[/\bcomponents\b/gu, "Components"],
	[/\bwebhooks\b/gu, "Webhooks"],
	[/\boperations\b/gu, "Operations"],
	[/\$defs/gu, "Defs"],
	[/"Graph"/gu, '"graph"'],
	[/"NodeSummary"/gu, '"nodeSummary"'],
	[/"Edge"/gu, '"edge"'],
	[/"Backlink"/gu, '"backlink"'],
	[/"Node"/gu, '"node"'],
	[/\bGraph:/gu, "graph:"],
	[/\bNodeSummary:/gu, "nodeSummary:"],
	[/\bEdge:/gu, "edge:"],
	[/\bBacklink:/gu, "backlink:"],
	[/\bNode:/gu, "node:"],
];

/**
 * Map OpenAPI binary schema fields to Uint8Array types.
 */
const customTransform = (
	schemaObject: SchemaObject,
): import("typescript").TypeNode | TransformObject | undefined => {
	if (schemaObject.format === "binary") {
		return factory.createTypeReferenceNode("Uint8Array");
	}
};

function lintGeneratedTypes(source: string): string {
	return generatedTypeReplacements.reduce(
		(output, [pattern, replacement]) => output.replace(pattern, replacement),
		source,
	);
}

/**
 * Generate TypeScript types from the OpenAPI spec.
 */
async function generate(): Promise<void> {
	const schemaUrl = new URL("./openapi.yaml", import.meta.url);
	const ast = await openapiTs(schemaUrl, {
		transform: customTransform,
	});

	const generated = lintGeneratedTypes(astToString(ast));

	process.stdout.write(generated);
}

generate().catch((error: unknown): void => {
	process.stderr.write(`${String(error)}\n`);
	process.exitCode = 1;
});
