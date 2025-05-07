import slugify from "slugify";

await $`rm -rf dist`;
await $`mkdir -p dist/{backend,frontend,emacs,licenses}`;
await $`cp README.org LICENSE.org dist/`;
await $`cp -vR packages/emacs/* dist/emacs`;
await $`cp -vR packages/frontend/dist dist/frontend/dist`;
await $`cp -vR packages/backend/dist dist/backend/dist`;
const all = JSON.parse(await $`license-checker --json`);
await $`mkdir -p dist/licenses`;
for (const [key, value] of Object.entries(all)) {
	if (value.licenseFile)
		await $`cp ${value.licenseFile} dist/licenses/${slugify(key, { strict: true })}`;
}
