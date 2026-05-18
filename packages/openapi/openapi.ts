import openapiTS, {
	astToString,
	type SchemaObject,
	type TransformObject,
} from "openapi-typescript";
import { factory } from "typescript";

/**
 * Map OpenAPI binary schema fields to Uint8Array types.
 */
const customTransform = (
	schemaObject: SchemaObject,
): import("typescript").TypeNode | TransformObject | undefined => {
	if (schemaObject.format === "binary") {
		return factory.createTypeReferenceNode("Uint8Array");
	}
	return undefined;
};

/**
 * Generate TypeScript types from the OpenAPI spec.
 */
async function generate(): Promise<void> {
	const schemaUrl = new URL("./openapi.yaml", import.meta.url);
	const ast = await openapiTS(schemaUrl, {
		transform: customTransform,
	});

	const generated = astToString(ast);

	console.log(generated);
}

generate().catch(console.error);
