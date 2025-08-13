import type { Layout, Renderer, Theme } from "../graph/graph-types.ts";

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
      aria-labelledby="offcanvasSettingsLabel"
    >
      <div className="offcanvas-header">
        <h4 id="offcanvasSettingsLabel" className="offcanvas-title">
          <i className="bi bi-gear-fill"></i> Settings
        </h4>
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        >
        </button>
      </div>
      <div className="offcanvas-body">
        <div className="mb-4">
          <h5>Theme</h5>
          <select
            className="form-select"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as Theme)}
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <h5>Renderer</h5>
          <select
            className="form-select"
            value={renderer}
            onChange={(e) => onRendererChange(e.target.value as Renderer)}
          >
            {renderers.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {renderer === "cytoscape" && (
          <div className="mb-4">
            <h5>Layout</h5>
            <select
              className="form-select"
              value={layout}
              onChange={(e) => onLayoutChange(e.target.value as Layout)}
            >
              {layouts.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mb-4">
          <h5>Node size</h5>
          <input
            type="range"
            min="5"
            max="30"
            value={nodeSize}
            onChange={(e) => onNodeSizeChange(Number(e.target.value))}
          />
          <div>
            Current: <span>{nodeSize}</span>px
          </div>
        </div>
        {renderer !== "3d-force-graph" && (
          <div className="mb-4">
            <h5>Font size</h5>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.1"
              value={labelScale}
              onChange={(e) => onLabelScaleChange(Number(e.target.value))}
            />
            <div>
              Current: <span>{labelScale.toFixed(1)}</span>em
            </div>
          </div>
        )}
        {renderer !== "3d-force-graph" && (
          <div className="mb-4">
            <h5>Show labels</h5>
            <div className="form-check form-switch">
              <input
                id="toggleLabels"
                className="form-check-input"
                type="checkbox"
                checked={showLabels}
                onChange={(e) => onShowLabelsChange(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="toggleLabels">
                Display labels
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
