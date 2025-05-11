import slugify from "slugify";
import { $, spinner } from "zx";

await $`rm -rf dist`;
await $`mkdir -p dist/{backend,frontend,emacs,licenses}`;
await $`cp README.org LICENSE.org dist/`;
await $`cp -vR packages/emacs/* dist/emacs`;
await $`cp -vR packages/frontend/dist dist/frontend/dist`;
await $`cp -vR packages/backend/dist dist/backend/dist`;

interface Licenses {
	licenseFile?: string;
}

await spinner("copying license files", async () => {
	await $`mkdir -p dist/licenses`;
	const output = await $`license-checker --json`;
	const pairs = Object.entries(output.json<Licenses>());
	await Promise.all(
		pairs
			.filter(([_, v]) => v.licenseFile)
			.map(
				([k, v]) =>
					$`cp ${v.licenseFile} dist/licenses/${slugify.default(k, { strict: true })}`,
			),
	);
});
