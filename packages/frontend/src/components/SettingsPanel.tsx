import type { Layout, Renderer, Theme } from "../graph/graph-types.ts";
import { Button } from "./ui/Button.tsx";
import { FormGroup } from "./ui/FormGroup.tsx";
import { RangeSlider } from "./ui/RangeSlider.tsx";
import { Select } from "./ui/Select.tsx";
import { Switch } from "./ui/Switch.tsx";
import { When } from "./ui/When.tsx";

interface SettingsPanelProps {
	open: boolean;
	readonly themes: readonly { readonly value: Theme; readonly label: string }[];
	readonly renderers: readonly {
		readonly value: Renderer;
		readonly label: string;
	}[];
	readonly layouts: readonly Layout[];
	theme: Theme;
	renderer: Renderer;
	layout: Layout;
	nodeSize: number;
	labelScale: number;
	showLabels: boolean;
	onThemeChange: (theme: Theme) => void;
	onRendererChange: (renderer: Renderer) => void;
	onLayoutChange: (layout: Layout) => void;
	onNodeSizeChange: (size: number) => void;
	onLabelScaleChange: (scale: number) => void;
	onShowLabelsChange: (show: boolean) => void;
	onClose: () => void;
}

export function SettingsPanel({
	open,
	themes,
	renderers,
	layouts,
	theme,
	renderer,
	layout,
	nodeSize,
	labelScale,
	showLabels,
	onThemeChange,
	onRendererChange,
	onLayoutChange,
	onNodeSizeChange,
	onLabelScaleChange,
	onShowLabelsChange,
	onClose,
}: SettingsPanelProps) {
	return (
		<div
			id="offcanvasSettings"
			className={`offcanvas offcanvas-start ${open ? "show" : ""}`}
			tabIndex={-1}
			role="dialog"
			aria-labelledby="offcanvasSettingsLabel"
		>
			<div className="offcanvas-header">
				<h4 id="offcanvasSettingsLabel" className="offcanvas-title">
					<i className="bi bi-gear-fill"></i> Settings
				</h4>
				<Button variant="close" aria-label="Close" onClick={onClose} />
			</div>
			<div className="offcanvas-body">
				<FormGroup label="Theme">
					<Select
						value={theme}
						options={themes}
						onChange={(value) => onThemeChange(value as Theme)}
					/>
				</FormGroup>

				<FormGroup label="Renderer">
					<Select
						value={renderer}
						options={renderers}
						onChange={(value) => onRendererChange(value as Renderer)}
					/>
				</FormGroup>

				<When condition={renderer === "cytoscape"}>
					<FormGroup label="Layout">
						<Select
							value={layout}
							options={layouts}
							onChange={(value) => onLayoutChange(value as Layout)}
						/>
					</FormGroup>
				</When>

				<RangeSlider
					label="Node size"
					value={nodeSize}
					min={5}
					max={30}
					onChange={onNodeSizeChange}
					unit="px"
				/>

				<When condition={renderer !== "3d-force-graph"}>
					<RangeSlider
						label="Font size"
						value={labelScale}
						min={0.3}
						max={1.5}
						step={0.1}
						onChange={onLabelScaleChange}
						unit="em"
						formatter={(v) => v.toFixed(1)}
					/>
				</When>

				<When condition={renderer !== "3d-force-graph"}>
					<FormGroup label="Show labels">
						<Switch
							id="toggleLabels"
							checked={showLabels}
							onChange={onShowLabelsChange}
							label="Display labels"
						/>
					</FormGroup>
				</When>
			</div>
		</div>
	);
}
