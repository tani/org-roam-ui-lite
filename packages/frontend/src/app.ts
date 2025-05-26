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
	layout: Alpine.$persist<Layout>("cose"),
	layouts: Layouts,
	renderers: Renderers,
	renderer: Alpine.$persist<Renderer>("cytoscape"),
	graph: undefined as GraphInstance | undefined,
	previewEl: undefined as HTMLElement | undefined,
	previewAnchor: undefined as HTMLAnchorElement | undefined,
	previewNodeId: undefined as string | undefined,
	mouseX: 0,
	mouseY: 0,
	/** Attach click and hover events to graph nodes */
	bindGraphEvents() {
		if (!this.graph) return;

		(this.$refs.graph as HTMLElement).onmousemove = (ev) => {
			this.mouseX = ev.clientX;
			this.mouseY = ev.clientY;
		};

		if (this.renderer === "cytoscape") {
			const cy = this.graph as Core;
			cy.off("tap", "node");
			cy.off("mouseover", "node");
			cy.off("mouseout", "node");
			cy.on("tap", "node", ({ target }) => {
				void this.openNode(target.id());
			});
			cy.on("mouseover", "node", (ev) => {
				const id = ev.target.id();
				if (this.previewNodeId === id) return;
				const me = ev.originalEvent as MouseEvent;
				void this.showNodePreview(id, me.clientX, me.clientY);
			});
			cy.on("mouseout", "node", () => {
				if (this.previewNodeId) this.hidePreview();
			});
		} else {
			const fg = this.graph as unknown as {
				onNodeClick: (cb: (node: { id: string }) => void) => void;
				onNodeHover: (cb: (node: { id: string } | null) => void) => void;
			};
			fg.onNodeClick((node: { id: string }) => {
				void this.openNode(node.id);
			});
			fg.onNodeHover((node: { id: string } | null) => {
				if (node) {
					if (this.previewNodeId === node.id) return;
					void this.showNodePreview(node.id, this.mouseX, this.mouseY);
				} else if (this.previewNodeId) {
					this.hidePreview();
				}
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
			void this.showPreview(anchor as HTMLAnchorElement);
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
	 * Show preview for a linked node.
	 *
	 * @param anchor - Anchor element for the node link
	 */
	async showPreview(anchor: HTMLAnchorElement): Promise<void> {
		const node = await openNode(this.theme, anchor.href.replace("id:", ""));
		const div = document.createElement("div");
		div.className = "card position-fixed p-2 preview-popover responsive-wide";
		div.innerHTML = node.html;
		const rect = anchor.getBoundingClientRect();
		div.style.top = `${rect.bottom + 8}px`;
		div.style.left = `${rect.left}px`;
		document.body.appendChild(div);
		this.previewEl = div;
		this.previewAnchor = anchor;
		div.addEventListener("mouseleave", () => {
			this.hidePreview();
		});
	},

	/**
	 * Show preview for a graph node at the given position.
	 *
	 * @param nodeId - Identifier of the node
	 * @param x - Horizontal viewport coordinate
	 * @param y - Vertical viewport coordinate
	 */
	async showNodePreview(nodeId: string, x: number, y: number): Promise<void> {
		const node = await openNode(this.theme, nodeId);
		const div = document.createElement("div");
		div.className = "card position-fixed p-2 preview-popover responsive-wide";
		div.innerHTML = node.html;
		div.style.top = `${y + 8}px`;
		div.style.left = `${x}px`;
		document.body.appendChild(div);
		this.previewEl = div;
		this.previewNodeId = nodeId;
		div.addEventListener("mouseleave", () => {
			this.hidePreview();
		});
	},
	/**
	 * Remove the preview element if present.
	 */
	hidePreview() {
		this.previewEl?.remove();
		this.previewEl = undefined;
		this.previewAnchor = undefined;
		this.previewNodeId = undefined;
	},
}));

Alpine.start();
