import openapiTS, {
	astToString,
	type SchemaObject,
	type TransformNodeOptions,
} from "openapi-typescript";
import { factory } from "typescript";

const customTransform = (
	schemaObject: SchemaObject,
	_options: TransformNodeOptions,
) => {
	if (schemaObject.format === "binary") {
		return factory.createTypeReferenceNode("Uint8Array");
	}
	return undefined;
};

async function generate() {
	const schemaUrl = new URL("./openapi.yaml", import.meta.url);
	const ast = await openapiTS(schemaUrl, {
		transform: customTransform,
	});

	const generated = astToString(ast);

	console.log(generated);
}

generate().catch(console.error);
