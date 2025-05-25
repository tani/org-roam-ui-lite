import persist from "@alpinejs/persist";
import Alpine from "alpinejs";
import type { Core } from "cytoscape";
import type { components } from "./api.d.ts";
import {
	dimOthers,
	type Layout,
	Layouts,
	renderGraph,
	setElementsStyle,
	setNodeStyle,
	type Theme,
	Themes,
} from "./graph.ts";
import { openNode } from "./node.ts";

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

	/** Initialize the application and render the graph */
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

		this.$refs.rendered.addEventListener("click", (ev) => {
			const a = (ev.target as HTMLElement).closest("a");
			if (!a || !a.href.startsWith("id:")) return;
			ev.preventDefault();
			this.openNode(a.href.replace("id:", ""));
		});
	},

	/** Re-render the graph with current settings */
	async refresh() {
		this.graph = await renderGraph(
			this.layout,
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
		);
	},

	/** Change layout and refresh the graph */
	setLayout(newLayout: Layout) {
		this.layout = newLayout;
		void this.refresh();
	},

	/** Switch between themes and refresh */
	setTheme(newTheme: Theme) {
		this.theme = newTheme;
		void this.refresh();
	},

	/** Adjust node size in the graph */
	onSizeChange() {
		setNodeStyle(this.graph, { width: this.nodeSize, height: this.nodeSize });
	},

	/** Adjust label scale in the graph */
	onScaleChange() {
		setNodeStyle(this.graph, { "font-size": `${this.labelScale}em` });
	},

	/** Fetch and display details for NODE ID */
	async openNode(nodeId: string) {
		const selected = await openNode(this.theme, nodeId);
		this.selected = selected;
		this.openDetails();
	},

	/** Show the details pane and dim other nodes */
	openDetails() {
		this.detailsOpen = true;
		dimOthers(this.graph, this.selected.id);
	},

	/** Hide the details pane and restore styles */
	closeDetails() {
		this.detailsOpen = false;
		setElementsStyle(this.graph, { opacity: 1 });
	},

	/** Toggle the details pane */
	toggleDetails() {
		this.detailsOpen ? this.closeDetails() : this.openDetails();
	},

	/** Toggle the settings pane */
	toggleSettings() {
		this.settingsOpen = !this.settingsOpen;
	},
}));

Alpine.start();
