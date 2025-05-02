 /// <reference lib="dom" /> 

import Alpine from "alpinejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./app.css";
import * as bootstrap from "bootstrap";
import "@wooorm/starry-night/style/dimmed";

interface NodeData {
  id: string;
  title: string;
  file: string;
}
interface EdgeData {
  source: string;
  dest: string;
}
interface GraphResponse {
  nodes: NodeData[];
  edges: EdgeData[];
}
interface Backlink {
  source: string;
  title: string;
}
interface NodeResponse {
  id: string;
  title: string;
  file: string;
  raw: string;
  backlinks?: Backlink[];
}


async function createOrgHtmlProcessor() {
	// 並列で import() しておく
	const [
		unifiedModule,
		uniorgParseModule,
		uniorgRehypeModule,
		rehypeMathjaxModule,
		rehypeMermaidModule,
		rehypeStarryNightModule,
		starryNightCoreModule,
		rehypeStringifyModule,
	] = await Promise.all([
		import("unified"),
		import("uniorg-parse"),
		import("uniorg-rehype"),
		import("rehype-mathjax"),
		import("rehype-mermaid"),
		import("rehype-starry-night"),
		import("@wooorm/starry-night"),
		import("rehype-stringify"),
	]);

	const { unified } = unifiedModule;
	const uniorgParse = uniorgParseModule.default;
	const uniorgRehype = uniorgRehypeModule.default;
	const rehypeMathjax = rehypeMathjaxModule.default;
	const rehypeMermaid = rehypeMermaidModule.default;
	const rehypeStarryNight = rehypeStarryNightModule.default;
	const { all: grammars } = starryNightCoreModule;
	const rehypeStringify = rehypeStringifyModule.default;

	// パイプライン組み立て
	return unified()
		.use(uniorgParse)
		.use(uniorgRehype)
		.use(rehypeMathjax)
		.use(rehypeMermaid)
		.use(rehypeStarryNight, { grammars })
		.use(rehypeStringify);
}

cytoscape.use(coseBilkent);

function pickColor(key: string): string {
	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = (hash + key.charCodeAt(i)) % 360;
	}
	return `hsl(${hash}, 65%, 50%)`;
}

Alpine.data("app", () => ({
	graph: null as cytoscape.Core | null,
	selected: {} as (NodeResponse & { html: string }) | null,
	detailsCanvas: new bootstrap.Offcanvas(
		document.getElementById("offcanvasDetails")!,
	),

	async init() {
		await this.refreshGraph();
	},

	async refreshGraph() {
		const { nodes, edges } = await fetch("/api/graph").then((r) => r.json()) as GraphResponse;
		const elements = [
			...nodes.map((n) => ({
				data: { id: n.id, label: n.title, color: pickColor(n.file) },
			})),
			...edges.map((e) => ({
				data: { source: e.source, target: e.dest },
			})),
		];

		if (!this.graph) {
			this.graph = cytoscape({
				container: this.$refs.graph,
				elements,
				layout: { name: "cose-bilkent" },
				style: [
					{
						selector: "node",
						style: {
							color: "#666666",
							"background-color": "data(color)",
							label: "data(label)",
						},
					},
				],
			});
			this.graph.on("tap", "node", (ev) => this.open(ev.target.id()));
		} else {
			this.graph.json({ elements: [] });
			this.graph.add(elements);
			this.graph.layout({ name: "cose-bilkent" }).run();
		}
	},

	async open(id: string) {
		const [jsonBody, processor] = await Promise.all([
			fetch(`/api/node/${id}`).then((r) => r.json()),
			createOrgHtmlProcessor(),
		]);
		const html = String(await processor.process(jsonBody.raw));
		this.selected = { ...jsonBody, html };
		this.detailsCanvas?.show();
	},
}));

Alpine.start();
