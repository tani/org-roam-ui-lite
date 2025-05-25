import persist from "@alpinejs/persist";
import Alpine from "alpinejs";
import type { Core } from "cytoscape";
import type { components } from "./api.d.ts";
import {
	dimOthers,
	type Layout,
	Layouts,
	openNode,
	renderGraph,
	setElementsStyle,
	setNodeStyle,
	type Theme,
	Themes,
} from "./util.ts";

Alpine.plugin(persist);

// --- Alpine App ---
Alpine.data("app", () => ({
	themes: Themes,
	theme: Alpine.$persist<Theme>(
		matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
	),
	nodeSize: 10,
	labelScale: 0.5,
	layout: Alpine.$persist<Layout>("cose"),
	layouts: Layouts,
	graph: undefined as Core | undefined,
	selected: {} as components["schemas"]["Node"] & { html?: string },
	settingsOpen: false,
	detailsOpen: false,

	async init() {
		// Initial graph render
		this.graph = await renderGraph(
			this.layout,
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
		);

		// Event bindings
		this.graph.on("tap", "node", ({ target }) => {
			void this.openNode(target.id());
		});
	},

	// Refresh graph with current settings
	async refresh() {
		this.graph = await renderGraph(
			this.layout,
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
		);
	},

	setLayout(newLayout: Layout) {
		this.layout = newLayout;
		void this.refresh();
	},

	// Toggle between dark/light theme
	setTheme(newTheme: Theme) {
		this.theme = newTheme;
		void this.refresh();
	},

	// Called when node size slider changes
	onSizeChange() {
		setNodeStyle(this.graph, { width: this.nodeSize, height: this.nodeSize });
	},

	// Called when label scale slider changes
	onScaleChange() {
		setNodeStyle(this.graph, { "font-size": `${this.labelScale}em` });
	},

	async openNode(id: string) {
		const selected = await openNode(this.theme, id);
		this.selected = selected;
		this.openDetails();
	},

	openDetails() {
		this.detailsOpen = true;
		dimOthers(this.graph, this.selected.id);
	},

	closeDetails() {
		this.detailsOpen = false;
		setElementsStyle(this.graph, { opacity: 1 });
	},

	toggleDetails() {
		this.detailsOpen ? this.closeDetails() : this.openDetails();
	},

	toggleSettings() {
		this.settingsOpen = !this.settingsOpen;
	},
}));

Alpine.start();
