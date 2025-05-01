import reorgParse from "@orgajs/reorg-parse";
import reorgRehype from "@orgajs/reorg-rehype";
import rehypeShiki from "@shikijs/rehype";
import Alpine from "alpinejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import rehypeStringfy from "rehype-stringify";
import { unified } from "unified";

const processor = unified()
	.use(reorgParse)
	.use(reorgRehype)
	.use(rehypeShiki, { theme: "vitesse-dark" })
	.use(rehypeStringfy);

cytoscape.use(coseBilkent);

function pickColor(key: string): string {
	// simple hash: 各文字コードを足して 360 で割った余りを色相に
	let hash = 0;
	for (let i = 0; i < key?.length; i++) {
		hash = (hash + key?.charCodeAt(i)) % 360;
	}
	// 彩度 65%、明度 50% の HSL 表現を返す
	return `hsl(${hash}, 65%, 50%)`;
}

Alpine.data("app", () => ({
	graph: null as cytoscape.Core | null,
	selected: {} as any,

	// ← 追加する部分
	showFilter: true,
	showDetails: true,
	toggleFilter() {
		this.showFilter = !this.showFilter;
	},
	toggleDetails() {
		this.showDetails = !this.showDetails;
	},

	async init() {
		await this.refreshGraph();
	},

	async refreshGraph() {
		const { nodes, edges } = await fetch("/graph").then((r) => r.json());
		const elements = [
			...nodes.map((n: any) => ({
				data: {
					id: n.id,
					label: n.title,
					color: pickColor(n.file),
				},
			})),
			...edges.map((e: any) => ({
				data: {
					source: e.source,
					target: e.dest,
				},
			})),
		];
		if (!this.graph) {
			this.graph = cytoscape({
				container: this.$refs.graph as HTMLElement,
				elements,
				layout: { name: "cose-bilkent" },
				style: [
					{
						selector: "node",
						style: {
							color: "#eeeeee",
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
		const json = await fetch(`/node/${id}`).then((r) => r.json());
		this.selected = { ...json, html: await processor.process(json.raw) };
		this.showDetails = true;
	},
}));

Alpine.start();
