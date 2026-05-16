import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { populate } from "../src/populate.ts";
import { fetchGraph, fetchNode } from "../src/query.ts";

const NODE_A = "11111111-1111-4111-8111-111111111111";
const NODE_B = "22222222-2222-4222-8222-222222222222";
const NODE_C = "33333333-3333-4333-8333-333333333333";

describe("populate", () => {
	it("creates a graph database from org-roam files", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "org-roam-ui-lite-"));
		const dbPath = path.join(dir, "org-roam.db");
		const orgDir = path.join(dir, "org");
		await mkdir(orgDir);
		const aPath = path.join(orgDir, "a.org");
		const bPath = path.join(orgDir, "b.org");

		await writeFile(
			aPath,
			`#+title: Alpha
:PROPERTIES:
:ID: ${NODE_A}
:END:

Alpha links to [[id:${NODE_B}][Beta]].
`,
		);
		await writeFile(
			bPath,
			`#+title: Beta
* Beta Heading
:PROPERTIES:
:ID: ${NODE_B}
:END:

Back to [[id:${NODE_A}][Alpha]].
`,
		);

		const result = await populate(orgDir, dbPath);
		expect(result).toEqual({ files: 2, nodes: 2, links: 2 });

		const graph = await fetchGraph(dbPath);
		expect(graph[1].content["application/json"].nodes).toHaveLength(2);
		expect(graph[1].content["application/json"].edges).toHaveLength(2);

		const node = await fetchNode(dbPath, NODE_A);
		const body = node[1].content["application/json"];
		expect(body).toMatchObject({
			id: NODE_A,
			title: "Alpha",
		});
		expect("raw" in body ? body.raw : "").toContain("Alpha links");
	});

	it("stores JSON text compatible with the existing query layer", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "org-roam-ui-lite-"));
		const dbPath = path.join(dir, "org-roam.db");
		const orgDir = path.join(dir, "org");
		await mkdir(orgDir);

		await writeFile(
			path.join(orgDir, "note.org"),
			`#+title: Note
:PROPERTIES:
:ID: ${NODE_A}
:END:
`,
		);

		await populate(orgDir, dbPath);

		const database = new DatabaseSync(dbPath);
		try {
			const row = database.prepare("SELECT file, title FROM files").get() as {
				file: string;
				title: string;
			};
			expect(JSON.parse(row.title)).toBe("Note");
			expect(await readFile(JSON.parse(row.file), "utf8")).toContain(NODE_A);
		} finally {
			database.close();
		}
	});

	it("only imports drawer IDs and ignores source block links", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "org-roam-ui-lite-"));
		const dbPath = path.join(dir, "org-roam.db");
		const orgDir = path.join(dir, "org");
		await mkdir(orgDir);

		await writeFile(
			path.join(orgDir, "a.org"),
			`#+title: Alpha
:PROPERTIES:
:ID: ${NODE_A}
:END:

Plain link id:${NODE_B}

#+begin_src org
:ID: ${NODE_C}
[[id:${NODE_C}][Ignored]]
#+end_src
`,
		);
		await writeFile(
			path.join(orgDir, "b.org"),
			`#+title: Beta
:PROPERTIES:
:ID: ${NODE_B}
:END:
`,
		);

		const result = await populate(orgDir, dbPath);
		expect(result).toEqual({ files: 2, nodes: 2, links: 1 });

		const graph = await fetchGraph(dbPath);
		expect(graph[1].content["application/json"]).toEqual({
			nodes: [
				{ id: NODE_A, title: "Alpha" },
				{ id: NODE_B, title: "Beta" },
			],
			edges: [{ source: NODE_A, dest: NODE_B }],
		});
	});

	it("rolls back existing data when repopulation fails", async () => {
		const dir = await mkdtemp(path.join(tmpdir(), "org-roam-ui-lite-"));
		const dbPath = path.join(dir, "org-roam.db");
		const validOrgDir = path.join(dir, "valid");
		const invalidOrgDir = path.join(dir, "invalid");
		await mkdir(validOrgDir);
		await mkdir(invalidOrgDir);

		await writeFile(
			path.join(validOrgDir, "a.org"),
			`#+title: Alpha
:PROPERTIES:
:ID: ${NODE_A}
:END:
`,
		);

		await populate(validOrgDir, dbPath);

		await writeFile(
			path.join(invalidOrgDir, "a.org"),
			`#+title: Alpha
:PROPERTIES:
:ID: ${NODE_A}
:END:
`,
		);
		await writeFile(
			path.join(invalidOrgDir, "duplicate.org"),
			`#+title: Duplicate
:PROPERTIES:
:ID: ${NODE_A}
:END:
`,
		);

		await expect(populate(invalidOrgDir, dbPath)).rejects.toThrow();

		const graph = await fetchGraph(dbPath);
		expect(graph[1].content["application/json"]).toEqual({
			nodes: [{ id: NODE_A, title: "Alpha" }],
			edges: [],
		});
	});
});
