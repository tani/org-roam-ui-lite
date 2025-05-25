import type { Core } from "cytoscape";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Form, Offcanvas } from "react-bootstrap";
import { createRoot } from "react-dom/client";
import {
	BrowserRouter,
	Route,
	Routes,
	useNavigate,
	useParams,
} from "react-router";
import type { components } from "./api.d.ts";
import {
	dimOthers,
	type Layout,
	Layouts,
	openNode,
	renderGraph,
	setElementsStyle,
	type Theme,
	Themes,
} from "./util.ts";

const defaultTheme: Theme = matchMedia("(prefers-color-scheme: dark)").matches
	? "dark"
	: "light";

if (typeof document !== "undefined") {
	document.documentElement.setAttribute("data-theme", defaultTheme);
	document.documentElement.setAttribute(
		"data-bs-theme",
		defaultTheme.replace(/.*-/, ""),
	);
}

type NodeData = components["schemas"]["Node"] & { html?: string };

function GraphView({
	layout,
	nodeSize,
	labelScale,
	onOpenNode,
	onGraphReady,
}: {
	layout: Layout;
	nodeSize: number;
	labelScale: number;
	onOpenNode: (id: string) => void;
	onGraphReady: (g: Core) => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const graphRef = useRef<Core | undefined>(undefined);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let mounted = true;
		void renderGraph(
			layout,
			container,
			graphRef.current,
			nodeSize,
			labelScale,
		).then((g) => {
			if (!mounted) return;
			graphRef.current = g;
			g.off("tap");
			g.on("tap", "node", ({ target }) => onOpenNode(target.id()));
			onGraphReady(g);
		});
		return () => {
			mounted = false;
		};
	}, [layout, nodeSize, labelScale, onGraphReady, onOpenNode]);

	return <div ref={containerRef} id="graph" className="h-100 w-100"></div>;
}

function NodeDetails({
	node,
	show,
	onClose,
	onOpenNode,
}: {
	node: NodeData | null;
	show: boolean;
	onClose: () => void;
	onOpenNode: (id: string) => void;
}) {
	return (
		<Offcanvas
			show={show}
			onHide={onClose}
			placement="end"
			className="responsive-wide"
		>
			<Offcanvas.Header closeButton>
				<Offcanvas.Title>
					<i className="bi bi-file-earmark-text"></i> {node?.title ?? ""}
				</Offcanvas.Title>
			</Offcanvas.Header>
			<Offcanvas.Body>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: html is sanitized on the server */}
				<div dangerouslySetInnerHTML={{ __html: node?.html ?? "" }} />
				{node?.backlinks?.length ? (
					<div className="mt-3">
						<h5>
							<i className="bi bi-link-45deg"></i>Backlinks
						</h5>
						<ul className="list-unstyled">
							{node.backlinks.map((b) => (
								<li key={b.source}>
									<Button
										variant="link"
										className="btn-sm p-0"
										onClick={() => onOpenNode(b.source)}
									>
										<i className="bi bi-chevron-right"></i> {b.title}
									</Button>
								</li>
							))}
						</ul>
					</div>
				) : null}
			</Offcanvas.Body>
		</Offcanvas>
	);
}

function Settings({
	show,
	onHide,
	theme,
	setTheme,
	layout,
	setLayout,
	nodeSize,
	setNodeSize,
	labelScale,
	setLabelScale,
}: {
	show: boolean;
	onHide: () => void;
	theme: Theme;
	setTheme: (t: Theme) => void;
	layout: Layout;
	setLayout: (l: Layout) => void;
	nodeSize: number;
	setNodeSize: (n: number) => void;
	labelScale: number;
	setLabelScale: (n: number) => void;
}) {
	return (
		<Offcanvas show={show} onHide={onHide} placement="start">
			<Offcanvas.Header closeButton>
				<Offcanvas.Title>
					<i className="bi bi-gear-fill"></i>Settings
				</Offcanvas.Title>
			</Offcanvas.Header>
			<Offcanvas.Body>
				<Form.Group className="mb-4">
					<Form.Label>Theme</Form.Label>
					<Form.Select
						value={theme}
						onChange={(e) => setTheme(e.target.value as Theme)}
					>
						{Themes.map((t) => (
							<option key={t.value} value={t.value}>
								{t.label}
							</option>
						))}
					</Form.Select>
				</Form.Group>
				<Form.Group className="mb-4">
					<Form.Label>Layout</Form.Label>
					<Form.Select
						value={layout}
						onChange={(e) => setLayout(e.target.value as Layout)}
					>
						{Layouts.map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</Form.Select>
				</Form.Group>
				<Form.Group className="mb-4">
					<Form.Label>Node size</Form.Label>
					<Form.Range
						min={5}
						max={30}
						value={nodeSize}
						onChange={(e) => setNodeSize(Number(e.target.value))}
					/>
				</Form.Group>
				<Form.Group className="mb-4">
					<Form.Label>Font size</Form.Label>
					<Form.Range
						min={0.3}
						max={1.5}
						step={0.1}
						value={labelScale}
						onChange={(e) => setLabelScale(Number(e.target.value))}
					/>
				</Form.Group>
			</Offcanvas.Body>
		</Offcanvas>
	);
}

function Main() {
	const [theme, setThemeState] = useState<Theme>(defaultTheme);
	const [layout, setLayout] = useState<Layout>("cose");
	const [nodeSize, setNodeSize] = useState(10);
	const [labelScale, setLabelScale] = useState(0.5);
	const [showSettings, setShowSettings] = useState(false);
	const [graph, setGraph] = useState<Core>();
	const navigate = useNavigate();
	const { id } = useParams<{ id?: string }>();
	const openNodes = useRef<string[]>([]);
	const [node, setNode] = useState<NodeData | null>(null);

	const setTheme = useCallback((t: Theme) => {
		setThemeState(t);
		document.documentElement.setAttribute("data-theme", t);
		document.documentElement.setAttribute(
			"data-bs-theme",
			t.replace(/.*-/, ""),
		);
	}, []);

	const handleOpenNode = useCallback(
		(nodeId: string) => {
			if (!openNodes.current.includes(nodeId)) openNodes.current.push(nodeId);
			navigate(`/node/${nodeId}`);
		},
		[navigate],
	);

	useEffect(() => {
		if (!id || !graph) {
			setNode(null);
			return;
		}
		if (!openNodes.current.includes(id)) openNodes.current.push(id);
		dimOthers(graph, id);
		let active = true;
		void openNode(theme, id).then((n) => {
			if (active) setNode(n);
		});
		return () => {
			active = false;
			setElementsStyle(graph, { opacity: 1 });
		};
	}, [id, theme, graph]);

	return (
		<>
			<GraphView
				layout={layout}
				nodeSize={nodeSize}
				labelScale={labelScale}
				onOpenNode={handleOpenNode}
				onGraphReady={setGraph}
			/>
			<Button
				variant="outline-secondary"
				style={{ position: "fixed", top: "1rem", left: "1rem", zIndex: 1 }}
				onClick={() => setShowSettings(true)}
			>
				<i className="bi bi-gear"></i>
			</Button>
			<Settings
				show={showSettings}
				onHide={() => setShowSettings(false)}
				theme={theme}
				setTheme={setTheme}
				layout={layout}
				setLayout={setLayout}
				nodeSize={nodeSize}
				setNodeSize={setNodeSize}
				labelScale={labelScale}
				setLabelScale={setLabelScale}
			/>
			<NodeDetails
				node={node}
				show={Boolean(id)}
				onClose={() => navigate("/")}
				onOpenNode={handleOpenNode}
			/>
		</>
	);
}

export function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* keep Main mounted while switching between / and /node/:id */}
				<Route path="/" element={<Main />}>
					{/* child route matches /node/:id without re-mounting Main */}
					<Route path="node/:id" />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

const container = document.getElementById("root");
if (container) createRoot(container).render(<App />);

export { Main };
