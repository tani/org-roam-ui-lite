import persist from "@alpinejs/persist";
import Alpine from "alpinejs";
import type { Core } from "cytoscape";
import type { components } from "./api.d.ts";
import {
	applyNodeStyle,
	drawGraph,
	type GraphInstance,
	highlightNeighborhood,
	type Layout,
	Layouts,
	type Renderer,
	Renderers,
	resetHighlight,
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
	showLabels: Alpine.$persist<boolean>(true),
	layout: Alpine.$persist<Layout>("cose"),
	layouts: Layouts,
	renderers: Renderers,
	renderer: Alpine.$persist<Renderer>("force-graph"),
	graph: undefined as GraphInstance | undefined,
	previewEl: undefined as HTMLElement | undefined,
	previewAnchor: undefined as HTMLAnchorElement | undefined,
	/** Attach node click events based on the current renderer */
	bindGraphEvents() {
		if (!this.graph) return;
		if (this.renderer === "cytoscape") {
			const cy = this.graph as Core;
			cy.off("tap", "node");
			cy.on("tap", "node", ({ target }) => {
				void this.openNode(target.id());
			});
		} else {
			const fg = this.graph as unknown as {
				onNodeClick: (cb: (node: { id: string }) => void) => void;
			};
			fg.onNodeClick((node: { id: string }) => {
				void this.openNode(node.id);
			});
		}
	},
	selected: {} as components["schemas"]["Node"] & { html?: string },
	settingsOpen: false,
	detailsOpen: false,

	/** Initialize the application and render the graph */
	async init() {
		// Initial graph render
		this.graph = await drawGraph(
			this.renderer,
			this.layout,
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
			this.showLabels,
		);

		this.bindGraphEvents();

		this.attachPreviewEvents();

		this.$watch("renderer", () => {
			this.graph = undefined;
			void this.refresh();
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
		this.graph = await drawGraph(
			this.renderer,
			this.layout,
			this.$refs.graph,
			this.graph,
			this.nodeSize,
			this.labelScale,
			this.showLabels,
		);

		this.bindGraphEvents();
	},

	/** Change layout and refresh the graph */
	setLayout(newLayout: Layout) {
		this.layout = newLayout;
		void this.refresh();
	},

	/** Change renderer and refresh */
	setRenderer(newRenderer: Renderer) {
		this.renderer = newRenderer;
		this.graph = undefined;
	},

	/** Switch between themes and refresh */
	setTheme(newTheme: Theme) {
		this.theme = newTheme;
		void this.refresh();
	},

	/** Adjust node size in the graph */
	onSizeChange() {
		if (this.renderer === "cytoscape")
			applyNodeStyle(this.graph as Core, {
				width: this.nodeSize,
				height: this.nodeSize,
			});
		else void this.refresh();
	},

	/** Adjust label scale in the graph */
	onScaleChange() {
		if (this.renderer === "cytoscape")
			applyNodeStyle(this.graph as Core, {
				"font-size": `${this.labelScale}em`,
			});
		else void this.refresh();
	},

	/** Toggle label visibility */
	onShowLabelsChange() {
		void this.refresh();
	},

	/** Fetch and display details for NODE ID */
	async openNode(nodeId: string) {
		const selected = await openNode(this.theme, nodeId);
		this.selected = selected;
		this.openDetails();
	},

	/** Show the details pane and dim other nodes */
	openDetails() {
		this.hidePreview();
		this.detailsOpen = true;
		highlightNeighborhood(this.graph, this.selected.id);
	},

	/** Hide the details pane and restore styles */
	closeDetails() {
		this.detailsOpen = false;
		this.hidePreview();
		resetHighlight(this.graph);
	},

	/** Toggle the details pane */
	toggleDetails() {
		this.detailsOpen ? this.closeDetails() : this.openDetails();
	},

	/** Toggle the settings pane */
	toggleSettings() {
		this.settingsOpen = !this.settingsOpen;
	},

	/** Attach hover events to display node previews */
	attachPreviewEvents() {
		this.$refs.rendered.addEventListener("mouseover", (ev) => {
			const anchor = (ev.target as HTMLElement).closest("a");
			if (!anchor || !anchor.href.startsWith("id:")) return;
			if (this.previewAnchor === anchor) return;
			void this.showPreview(anchor as HTMLAnchorElement, ev);
		});
		this.$refs.rendered.addEventListener("mouseout", (ev) => {
			if (!this.previewAnchor) return;
			const related = ev.relatedTarget as Node | null;
			if (
				related &&
				(this.previewAnchor.contains(related) ||
					this.previewEl?.contains(related))
			)
				return;
			this.hidePreview();
		});
	},

	/**
	 * Show preview for a linked node near the mouse cursor.
	 *
	 * @param anchor - Hovered anchor element
	 * @param ev - Mouse event
	 */
	async showPreview(anchor: HTMLAnchorElement, ev: MouseEvent): Promise<void> {
		this.previewAnchor = anchor;
		const node = await openNode(this.theme, anchor.href.replace("id:", ""));

		if (this.previewAnchor !== anchor) return;

		const div = document.createElement("div");
		div.className = "card position-fixed p-2 preview-popover responsive-wide";
		div.innerHTML = node.html;
		div.style.visibility = "hidden";
		document.body.appendChild(div);
		const offset = 20;
		div.style.left = `${ev.clientX - div.offsetWidth - offset}px`;
		div.style.top = `${ev.clientY + offset}px`;
		div.style.visibility = "visible";
		this.previewEl = div;
		div.addEventListener("mouseleave", () => {
			this.hidePreview();
		});
	},

	/** Remove the preview element if present */
	hidePreview() {
		this.previewEl?.remove();
		this.previewEl = undefined;
		this.previewAnchor = undefined;
	},
}));

Alpine.start();
