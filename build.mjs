import slugify from "slugify";

await $`rm -rf dist`;
await $`mkdir -p dist/{server,client,licenses,emacs}`;
await $`cp -vR emacs/* dist/emacs/`;
await $`cp -vR packages/client/dist dist/client/dist`;
await $`cp -vR packages/server/dist dist/server/dist`;
const all = JSON.parse(await $`license-checker --json`);
await $`mkdir -p dist/licenses`;
for (const [key, value] of Object.entries(all)) {
	if (value.licenseFile)
		await $`cp ${value.licenseFile} dist/licenses/${slugify(key, { strict: true })}`;
}
