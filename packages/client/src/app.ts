import reorgParse from "@orgajs/reorg-parse";
import reorgRehype from "@orgajs/reorg-rehype";
import Alpine from "alpinejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import { all } from "lowlight";
import rehypeHighlight from "rehype-highlight";
import rehypeStringfy from "rehype-stringify";
import { unified } from "unified";
import "bootswatch/dist/darkly/bootstrap.min.css";
import "bootstrap-icons//font/bootstrap-icons.css";
import "highlight.js/styles/github-dark.min.css";
import "./app.css";

const processor = unified()
	.use(reorgParse)
	.use(reorgRehype)
	.use(rehypeHighlight, { languages: all, detect: true })
	.use(rehypeStringfy);

cytoscape.use(coseBilkent);

function pickColor(key: string) {
	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = (hash + key.charCodeAt(i)) % 360;
	}
	return `hsl(${hash}, 65%, 50%)`;
}

Alpine.data("app", () => ({
	graph: null,
	selected: {},
	showFilter: true,
	showDetails: true,
	// ドラッグ用ステート
	dragging: false,
	dragPanel: null,
	offsetX: 0,
	offsetY: 0,

	toggleFilter() {
		this.showFilter = !this.showFilter;
	},
	toggleDetails() {
		this.showDetails = !this.showDetails;
	},
	startDrag(e) {
		this.dragging = true;
		this.dragPanel = e.target.closest(".floating-panel");
		const rect = this.dragPanel.getBoundingClientRect();
		this.offsetX = e.clientX - rect.left;
		this.offsetY = e.clientY - rect.top;
	},
	onDrag(e) {
		if (!this.dragging || !this.dragPanel) return;
		this.dragPanel.style.left = e.clientX - this.offsetX + "px";
		this.dragPanel.style.top = e.clientY - this.offsetY + "px";
	},
	endDrag() {
		this.dragging = false;
		this.dragPanel = null;
	},

	async init() {
		await this.refreshGraph();
	},

	async refreshGraph() {
		const { nodes, edges } = await fetch("/api/graph").then((r) => r.json());
		const elements = [
			...nodes.map((n) => ({
				data: { id: n.id, label: n.title, color: pickColor(n.file) },
			})),
			...edges.map((e) => ({ data: { source: e.source, target: e.dest } })),
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

	async open(id) {
		const json = await fetch(`/api/node/${id}`).then((r) => r.json());
		const processed = await processor.process(json.raw);
		this.selected = { ...json, html: processed };
		this.showDetails = true;
	},
}));

Alpine.start();
