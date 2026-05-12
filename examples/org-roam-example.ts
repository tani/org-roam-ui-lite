import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const EXAMPLES_DIR = path.dirname(__filename);
const DB_PATH = path.join(EXAMPLES_DIR, "org-roam-example.db");
const ORG_DIR = path.join(EXAMPLES_DIR, "org");

// Deterministic UUID generator from a string label
function makeUuid(label: string): string {
	const hash = crypto.createHash("sha1").update(label).digest();
	// Set version 4 and variant bits
	hash.writeUInt8((hash.readUInt8(6) & 0x0f) | 0x40, 6);
	hash.writeUInt8((hash.readUInt8(8) & 0x3f) | 0x80, 8);
	return [
		hash.subarray(0, 4).toString("hex"),
		hash.subarray(4, 6).toString("hex"),
		hash.subarray(6, 8).toString("hex"),
		hash.subarray(8, 10).toString("hex"),
		hash.subarray(10, 16).toString("hex"),
	].join("-");
}

// JSON-encode a string value for drizzle-orm jsonText columns
function jsonStr(v: string): string {
	return JSON.stringify(v);
}

interface Article {
	orgFile: string;
	title: string;
	nodeTitle: string;
	links: string[]; // node titles this article links to
}

const articles: Article[] = [
	{
		orgFile: "photosynthesis.org",
		title: "Photosynthesis",
		nodeTitle: "Photosynthesis",
		links: ["Chlorophyll", "Plant Nutrition", "Plant Reproduction"],
	},
	{
		orgFile: "chlorophyll.org",
		title: "Chlorophyll",
		nodeTitle: "Chlorophyll",
		links: ["Photosynthesis", "Plant Pigments", "Leaf Senescence"],
	},
	{
		orgFile: "plant-reproduction.org",
		title: "Plant Reproduction",
		nodeTitle: "Plant Reproduction",
		links: ["Photosynthesis", "Mycorrhizae", "Plant Defense"],
	},
	{
		orgFile: "plant-nutrition.org",
		title: "Plant Nutrition",
		nodeTitle: "Plant Nutrition",
		links: ["Photosynthesis", "Mycorrhizae", "Soil Science"],
	},
	{
		orgFile: "mycorrhizae.org",
		title: "Mycorrhizae",
		nodeTitle: "Mycorrhizae",
		links: ["Plant Nutrition", "Soil Science", "Plant Defense"],
	},
	{
		orgFile: "plant-pigments.org",
		title: "Plant Pigments",
		nodeTitle: "Plant Pigments",
		links: ["Chlorophyll", "Leaf Senescence", "Plant Defense"],
	},
	{
		orgFile: "plant-defense.org",
		title: "Plant Defense Mechanisms",
		nodeTitle: "Plant Defense",
		links: ["Plant Reproduction", "Mycorrhizae", "Plant Pigments"],
	},
	{
		orgFile: "leaf-senescence.org",
		title: "Leaf Senescence",
		nodeTitle: "Leaf Senescence",
		links: ["Chlorophyll", "Plant Pigments", "Plant Nutrition"],
	},
	{
		orgFile: "soil-science.org",
		title: "Soil Science",
		nodeTitle: "Soil Science",
		links: ["Plant Nutrition", "Mycorrhizae", "Photosynthesis"],
	},
	{
		orgFile: "plant-growth.org",
		title: "Plant Growth and Development",
		nodeTitle: "Plant Growth",
		links: [
			"Photosynthesis",
			"Plant Reproduction",
			"Plant Growth",
			"Soil Science",
		],
	},
];

function createOrgContent(article: Article): string {
	const uuid = makeUuid(article.nodeTitle);
	const fileUuid = makeUuid(`file:${article.orgFile}`);
	const links = article.links
		.map((l) => `[[id:${makeUuid(l)}][${l}]]`)
		.join(", ");

	return `# Org-roam example node
# +BEGIN_PROPERTIES:
# UUID: ${uuid}
# FILE_ID: ${fileUuid}
# +END_PROPERTIES:

* ${article.title}

This article covers the fundamentals of ${article.nodeTitle.toLowerCase()}.

** Related
- ${links}

** Details

The ${article.nodeTitle.toLowerCase()} of plants is essential for
understanding how ecosystems function. Plants are the foundation of most
terrestrial food webs, and their ${article.nodeTitle.toLowerCase()}
interacts with many other biological processes.

${article.links.includes("Photosynthesis") ? `Photosynthesis is the process by which plants convert light energy into chemical energy, providing the energy basis for nearly all life on Earth.` : ""}
${article.links.includes("Chlorophyll") ? `Chlorophyll is the primary pigment involved in capturing light energy for photosynthesis. It gives plants their characteristic green color.` : ""}
${article.links.includes("Plant Reproduction") ? `Plant reproduction involves complex interactions between flowering, pollination, and seed dispersal mechanisms that ensure the continuation of plant species.` : ""}
${article.links.includes("Plant Nutrition") ? `Plant nutrition encompasses how plants absorb and utilize nutrients from soil, water, and air to support growth and metabolism.` : ""}
${article.links.includes("Mycorrhizae") ? `Mycorrhizae are symbiotic associations between fungi and plant roots that enhance nutrient uptake, particularly phosphorus and nitrogen.` : ""}
${article.links.includes("Plant Pigments") ? `Plant pigments include chlorophylls, carotenoids, anthocyanins, and flavonoids, each serving distinct roles in light absorption and protection.` : ""}
${article.links.includes("Plant Defense") ? `Plant defense mechanisms include chemical compounds, physical barriers, and indirect defenses through attraction of predatory insects.` : ""}
${article.links.includes("Leaf Senescence") ? `Leaf senescence is the programmed deterioration of leaves, involving the breakdown and recycling of nutrients before leaf abscission.` : ""}
${article.links.includes("Soil Science") ? `Soil science studies the formation, composition, and classification of soils, which are fundamental to plant growth and ecosystem health.` : ""}

** References

See also: ~org-roam-ui-lite~ for visualizing these connections.
`;
}

function main() {
	// Ensure directories exist
	fs.mkdirSync(ORG_DIR, { recursive: true });

	// Create SQLite database using raw SQL (no drizzle needed for generation)
	const db = new DatabaseSync(DB_PATH);

	db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      file TEXT PRIMARY KEY,
      title TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      file TEXT NOT NULL REFERENCES files(file),
      title TEXT NOT NULL,
      pos INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS links (
      source TEXT NOT NULL REFERENCES nodes(id),
      dest TEXT NOT NULL REFERENCES nodes(id)
    );
  `);

	// Clear existing data
	db.exec("DELETE FROM links");
	db.exec("DELETE FROM nodes");
	db.exec("DELETE FROM files");

	const insertFile = db.prepare(
		"INSERT INTO files (file, title) VALUES (?, ?)",
	);
	const insertNode = db.prepare(
		"INSERT INTO nodes (id, file, title, pos) VALUES (?, ?, ?, ?)",
	);
	const insertLink = db.prepare(
		"INSERT INTO links (source, dest) VALUES (?, ?)",
	);

	// Build lookup: node title -> UUID
	const uuidMap = new Map<string, string>();

	// Phase 1: Create all files and nodes
	articles.forEach((article, index) => {
		const nodeUuid = makeUuid(article.nodeTitle);
		const filePath = path.join(ORG_DIR, article.orgFile);
		uuidMap.set(article.nodeTitle, nodeUuid);

		// Write org file
		const orgContent = createOrgContent(article);
		fs.writeFileSync(filePath, orgContent);

		// Insert into DB (jsonText stores double-quoted strings)
		// files.file must be the actual filesystem path for fetchNode to read it
		insertFile.run(jsonStr(filePath), jsonStr(article.title));
		insertNode.run(
			jsonStr(nodeUuid),
			jsonStr(filePath),
			jsonStr(article.nodeTitle),
			index * 100,
		);
	});

	// Phase 2: Create links (bidirectional)
	articles.forEach((article) => {
		const sourceUuid = makeUuid(article.nodeTitle);
		article.links.forEach((linkTarget) => {
			const destUuid = makeUuid(linkTarget);
			// org-roam links are bidirectional
			insertLink.run(jsonStr(sourceUuid), jsonStr(destUuid));
			insertLink.run(jsonStr(destUuid), jsonStr(sourceUuid));
		});
	});

	db.close();

	console.log(`Generated ${articles.length} plant articles`);
	console.log(`Database: ${DB_PATH}`);
	console.log(`Org files: ${ORG_DIR}`);
}

main();
