import slugify from "slugify";
import { $ } from "zx";

await $`rm -rf dist`;
await $`mkdir -p dist/{backend,frontend,emacs,licenses}`;
await $`cp README.org LICENSE.org dist/`;
await $`cp -vR packages/emacs/* dist/emacs`;
await $`cp -vR packages/frontend/dist dist/frontend/dist`;
await $`cp -vR packages/backend/dist dist/backend/dist`;
const output = await $`license-checker --json`;
await $`mkdir -p dist/licenses`;
interface Licenses {
	licenseFile?: string;
}
for (const [key, value] of Object.entries(output.json<Licenses>())) {
	if (value.licenseFile)
		await $`cp ${value.licenseFile} dist/licenses/${slugify.default(key, { strict: true })}`;
}
