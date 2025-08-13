import { DetailsPanel } from "./components/DetailsPanel.tsx";
import { GraphContainer } from "./components/GraphContainer.tsx";
import { GraphControls } from "./components/GraphControls.tsx";
import { SettingsPanel } from "./components/SettingsPanel.tsx";
import { GlobalStyles } from "./components/ui/GlobalStyles.tsx";
import { Layouts, Renderers, Themes } from "./graph/graph-types.ts";
import { useDetailsPanel } from "./hooks/useDetailsPanel.ts";
import { useGraphManager } from "./hooks/useGraphManager.ts";
import { useUiDispatch, useUiState } from "./store/hooks.ts";

function App() {
	const state = useUiState();
	const dispatch = useUiDispatch();
	const {
		theme,
		renderer,
		layout,
		nodeSize,
		labelScale,
		showLabels,
		settingsOpen,
		detailsOpen,
		selected,
	} = state;

	const { graphRef, openNodeAction, highlightNode, resetNodeHighlight } =
		useGraphManager({
			theme,
			renderer,
			layout,
			nodeSize,
			labelScale,
			showLabels,
			detailsOpen,
			selectedId: selected.id,
		});

	const { closeDetails, toggleDetails } = useDetailsPanel({
		detailsOpen,
		resetNodeHighlight,
		highlightNode,
		selectedId: selected.id,
	});

	return (
		<div className="vh-100 vw-100">
			<GlobalStyles />
			<GraphContainer graphRef={graphRef} />

			<SettingsPanel
				open={settingsOpen}
				themes={Themes}
				renderers={Renderers}
				layouts={Layouts}
				theme={theme}
				renderer={renderer}
				layout={layout}
				nodeSize={nodeSize}
				labelScale={labelScale}
				showLabels={showLabels}
				onThemeChange={(t) =>
					dispatch({ type: "SET_STATE", payload: { theme: t } })
				}
				onRendererChange={(r) =>
					dispatch({ type: "SET_STATE", payload: { renderer: r } })
				}
				onLayoutChange={(l) =>
					dispatch({ type: "SET_STATE", payload: { layout: l } })
				}
				onNodeSizeChange={(s) =>
					dispatch({ type: "SET_STATE", payload: { nodeSize: s } })
				}
				onLabelScaleChange={(s) =>
					dispatch({ type: "SET_STATE", payload: { labelScale: s } })
				}
				onShowLabelsChange={(s) =>
					dispatch({ type: "SET_STATE", payload: { showLabels: s } })
				}
				onClose={() => dispatch({ type: "TOGGLE_SETTINGS" })}
			/>

			<GraphControls
				onToggleSettings={() => dispatch({ type: "TOGGLE_SETTINGS" })}
				onToggleDetails={toggleDetails}
			/>

			<DetailsPanel
				theme={theme}
				selected={selected}
				open={detailsOpen}
				onClose={closeDetails}
				onOpenNode={openNodeAction}
			/>
		</div>
	);
}

export default App;
