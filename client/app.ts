import Alpine from "alpinejs";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";

cytoscape.use(coseBilkent);

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
			...nodes.map((n: any) => ({ data: { id: n.id, label: n.title } })),
			...edges.map((e: any) => ({
				data: { source: e.source, target: e.dest },
			})),
		];
		if (!this.graph) {
			this.graph = cytoscape({
				container: this.$refs.graph as HTMLElement,
				elements,
				layout: { name: "cose-bilkent" },
			});
			this.graph.on("tap", "node", (ev) => this.open(ev.target.id()));
		} else {
			this.graph.json({ elements: [] });
			this.graph.add(elements);
			this.graph.layout({ name: "cose-bilkent" }).run();
		}
	},

	async open(id: string) {
		this.selected = await fetch(`/node/${id}`).then((r) => r.json());
		this.showDetails = true;
	},
}));

Alpine.start();
