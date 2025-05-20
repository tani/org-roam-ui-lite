// openapi.ts
import fs from "node:fs/promises";
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
	const schemaUrl = new URL("../../openapi.yaml", import.meta.url);
	const outputFile = new URL("./src/api.d.ts", import.meta.url);

	const ast = await openapiTS(schemaUrl, {
		transform: customTransform,
	});

	// ASTを文字列に変換
	const generated = astToString(ast);

	await fs.writeFile(outputFile, generated);
	console.log(`Types generated to ${outputFile}`);
}

generate().catch(console.error);
