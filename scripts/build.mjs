await fs.remove("./dist");
await fs.mkdirp("./dist");
await fs.copy("README.md", "./dist/README.md");
await fs.copy("LICENSE.md", "./dist/LICENSE.md");
await fs.copy("packages/emacs", "./dist/emacs");
await fs.mkdirp("./dist/frontend");
await fs.copy("packages/frontend/dist", "./dist/frontend/dist");
await fs.mkdirp("./dist/backend");
await fs.copy("packages/backend/dist", "./dist/backend/dist");
await fs.mkdirp("./dist/scripts");
await fs.copy("./scripts/export.mjs", "./dist/scripts/export.mjs");

function slugify(s) {
	return s.replace(/[^a-zA-Z0-9]+/g, "_");
}

await spinner("copying license files", async () => {
	await fs.mkdirp("./dist/licenses");
	const output = await $`license-checker --json`;
	const pairs = Object.entries(output.json());
	for (const [k, v] of pairs) {
		if (v.licenseFile) {
			const dest = `dist/licenses/${slugify(k)}`;
			await fs.copy(v.licenseFile, dest);
		}
	}
});
