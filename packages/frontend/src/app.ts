import persist from "@alpinejs/persist";
import Alpine from "alpinejs";
import type { Core } from "cytoscape";
import type { components } from "./api.d.ts";
import {
	dimOthers,
	type GraphInstance,
	type Layout,
	Layouts,
	type Renderer,
	Renderers,
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
	renderers: Renderers,
	renderer: Alpine.$persist<Renderer>("cytoscape"),
	graph: undefined as GraphInstance | undefined,
	selected: {} as components["schemas"]["Node"] & { html?: string },
	settingsOpen: false,
	detailsOpen: false,

	/** Initialize the application and render the graph */
	async init() {
		// Initial graph render
		this.graph = await renderGraph(
			this.renderer,
			this.layout,
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
		);

		// Event bindings
		if (this.renderer === "cytoscape") {
			(this.graph as Core).on("tap", "node", ({ target }) => {
				void this.openNode(target.id());
			});
		} else {
			(
				this.graph as unknown as {
					onNodeClick: (cb: (node: { id: string }) => void) => void;
				}
			).onNodeClick((node: { id: string }) => {
				void this.openNode(node.id);
			});
		}

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
			this.renderer,
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

	/** Change renderer and refresh */
	setRenderer(newRenderer: Renderer) {
		this.renderer = newRenderer;
		void this.refresh();
	},

	/** Switch between themes and refresh */
	setTheme(newTheme: Theme) {
		this.theme = newTheme;
		void this.refresh();
	},

	/** Adjust node size in the graph */
	onSizeChange() {
		if (this.renderer === "cytoscape")
			setNodeStyle(this.graph as Core, {
				width: this.nodeSize,
				height: this.nodeSize,
			});
		else void this.refresh();
	},

	/** Adjust label scale in the graph */
	onScaleChange() {
		if (this.renderer === "cytoscape")
			setNodeStyle(this.graph as Core, { "font-size": `${this.labelScale}em` });
		else void this.refresh();
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
		if (this.renderer === "cytoscape")
			dimOthers(this.graph as Core, this.selected.id);
	},

	/** Hide the details pane and restore styles */
	closeDetails() {
		this.detailsOpen = false;
		if (this.renderer === "cytoscape")
			setElementsStyle(this.graph as Core, { opacity: 1 });
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
