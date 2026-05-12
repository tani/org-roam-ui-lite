# org-roam-ui-lite Development Report

## Project Overview
org-roam-ui-lite is a TypeScript monorepo for visualizing Org-roam knowledge graphs. It provides:
- **Backend** (`packages/backend/`): Hono-based Node.js server serving a SQLite database
- **Frontend** (`packages/frontend/`): React SPA with Vite, Cytoscape/Force-Graph renderers
- **Emacs** (`packages/emacs/`): Direct Emacs integration

---

## Development Setup

### Generated Test Data
Created a script to generate a test database with 10 org-roam nodes about plants:

**File**: `examples/org-roam-example.ts`
- Generates 10 org files in `examples/org/` with cross-references
- Creates SQLite database with `nodes`, `links`, `files`, and `refs` tables
- Uses SHA-1 deterministic UUIDs for reproducibility
- **Command**: `npm run example:generate` or `npm run example:server`

**Generated Database**: `examples/org-roam-example.db`
- 10 nodes: photosynthesis, chlorophyll, plant reproduction, cellular respiration, pollination, plant anatomy, nitrogen fixation, ecological succession, mycorrhizal networks, plant defense mechanisms
- 62 bidirectional edges (average 12.4 connections per node)
- All nodes have proper org file content in `examples/org/`

### NPM Scripts Added (root `package.json`)
```json
"scripts": {
  "example:generate": "tsx examples/org-roam-example.ts",
  "example:server": "tsx --node-options='--experimental-sqlite' examples/org-roam-example.ts && npm --workspace=packages/backend run example -d ./examples/org-roam-example.db"
}
```

---

## Race Condition Fix

### Problem
When running `npm run dev` (which starts both frontend and backend via `npm-run-all -p`), the frontend attempts to fetch `/api/graph.json` before the backend is ready. Vite's proxy returns the HTML error page, and `openapi-fetch` throws a `SyntaxError` when trying to parse it as JSON.

### Solution
Implemented exponential backoff retry logic in two files:

**File**: `packages/frontend/src/graph/graph.ts` - `fetchGraphData()`
```typescript
async function fetchGraphData(): Promise<GraphData> {
  const MAX_RETRIES = 15;
  let attempt = 0;
  while (true) {
    try {
      const { data, error } = await api.GET("api/graph.json");
      if (error || !data)
        throw new Error(`API error: ${error || "No data received"}`);
      // ... transform data
    } catch (err) {
      attempt++;
      if (attempt >= MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, attempt * 200));
    }
  }
}
```

**File**: `packages/frontend/src/graph/node.ts` - `openNode()`
- Same retry pattern applied when clicking nodes to view details
- Backoff interval: `attempt * 200ms` (200ms, 400ms, 600ms, etc.)
- Maximum 15 retries before failing

### Additional Fix
Added `tsx` as a root dev dependency for running TypeScript files directly:
- **File**: `package.json` (devDependencies section)

---

## Architecture: Graph Rendering Pipeline

### Data Flow
```
App.tsx (render)
  ├── useUiState() reads current config (renderer, layout, theme, etc.)
  ├── useGraphManager() creates the hook with refs and callbacks
  │     ├── graphElementRef: DOM element reference
  │     ├── graphInstanceRef: current graph renderer instance
  │     ├── configRef: persisted config between renders
  │     └── graphRef (callback ref):
  │         └── when node mounts → graphElementRef.current = node
  │         └── when node mounts → refreshGraph() [async]
  │             └── fetchGraphData() → GET /api/graph.json [15 retries]
  │             └── rendererMap[renderer]() → dynamic import
  │             └── rendererMod.default(...) → create/update graph
  │                 └── bindGraphEvents() → click/tap handlers
  └── <GraphContainer graphRef={graphRef} />
      └── <div className="h-100 w-100" />
```

### Frontend Renderer Options (Select in Settings)
| Renderer | Library | Algorithm Types |
|---|---|---|
| Force Graph | force-graph | 2D canvas force simulation |
| 3D Force Graph | 3d-force-graph | WebGL 3D force simulation |

### Layout Options (Available in Force Graph)
| Layout | Type |
|---|---|
| Random | Random node positioning |
| Breadthfirst | Hierarchical tree-like layout |

### API Endpoints Used by Frontend
| Endpoint | Description | Frontend Function |
|---|---|---|
| `GET /api/graph.json` | Complete graph data (nodes + edges) | `fetchGraphData()` |
| `GET /api/node/{id}` | Specific node with backlinks + raw org content | `openNode()` |

### Graph Node Structure (Frontend)
Each graph node contains:
- `id`: Unique identifier (SHA-1 hash of file path)
- `label`: Human-readable title from the node definition
- `color`: Color assigned by `pickColor()` function (deterministic per node)
- `val`: Size property for force simulation (set to node's connection count)

### Graph Event Handlers
- **Click on node**: Opens node details panel (side drawer) showing full org content, backlinks to related nodes, and allows clicking backlinks to navigate
- **Settings panel**: Controls for theme, renderer, layout type, node size, font size, and show/hide labels
- **Refresh button**: Re-fetches graph data and rebuilds the graph

---

## Debug Target Resolution

### Bug Report
**Issue**: Graph does not render despite:
- API returning correct data (10 nodes, 62 edges)
- Frontend successfully fetching graph data (console logs: "10 nodes, 62 links in graph data")
- Container showing correct dimensions (Width: 300, Height: 741 px)

### Root Causes Found
1. `packages/frontend/src/index.css` still contained the default Vite root/body styles. These centered the app, constrained the root, and left `#root` without a full viewport sizing contract. The graph container inherited that bad sizing, which matched the observed 300px width.
2. `packages/frontend/src/graph/renderers/force-graph.ts` used the installed `force-graph` type as a callable factory. The current package exposes a class constructor, so TypeScript rejected the renderer and the production build could fail.
3. `packages/frontend/src/hooks/useGraphManager.ts` reused the existing graph instance when switching renderer types. That could pass a Cytoscape instance into Force Graph or 3D Force Graph and break renderer initialization.
4. `openapi.yaml` declared API paths without a leading slash, and the frontend clients used `baseUrl: "./"`. `openapi-fetch` concatenated those into `/.api/graph.json`, which Vite served with a `200` fallback response that was not graph JSON. The graph fetch retried until failure and no renderer canvas was created.
5. The `example:server` script passed `-d ./examples/org-roam-example.db` through npm workspaces, where the backend process resolved it relative to `packages/backend`. SQLite could not open the database, so the API returned `Internal Server Error`.

### Fixes Applied
- Replaced the default Vite CSS in `packages/frontend/src/index.css` with full-viewport `html`, `body`, and `#root` sizing and hidden overflow.
- Updated `packages/frontend/src/graph/renderers/force-graph.ts` to instantiate Force Graph with `new ForceGraph(...)`, matching the installed type definitions.
- Updated `packages/frontend/src/hooks/useGraphManager.ts` to destroy the current graph and clear the instance ref before drawing with a different renderer.
- Updated `examples/org-roam-example.ts` to use `Buffer.readUInt8`/`writeUInt8` for UUID version/variant bits so strict TypeScript and Biome both accept the generator.
- Corrected OpenAPI paths to `/api/...`, regenerated frontend/backend API types, and updated frontend `openapi-fetch` calls to request `/api/graph.json` and `/api/node/{id}.json`.
- Updated Org image resource rewriting to use `/api/node/...` instead of `./api/node/...`.
- Updated `example:server` to pass an absolute database path using `$PWD/examples/org-roam-example.db`.

### Verification
- `npm run check` passed
- `npm run lint` passed with existing warnings only:
  - Biome schema version info (`2.3.8` schema with `2.4.15` CLI)
  - `DetailsPanel.tsx` optional-chain suggestions
  - unused `ReactNode` import in `Button.tsx`
  - explicit `any` in `useGraphManager.test.tsx`
- `npm run example:generate` passed after escalation; sandboxed run failed because `tsx` could not create its IPC pipe
- Focused tests passed:
  - `packages/frontend/test/hooks/useGraphManager.test.tsx`
  - `packages/frontend/test/graph/graph.test.ts`
  - `packages/frontend/test/components/GraphContainer.test.tsx`
- `npm run build` passed
- Browser verification with `pnpx agent-browser` passed:
  - `GET /api/graph.json` returned graph JSON through the Vite proxy
  - A Force Graph canvas was created at `1280x633`
  - Screenshot showed the 10 example nodes and labels rendered in the graph view

---

## Files Referenced in This Session
- `examples/org-roam-example.ts`: DB/org file generation script
- `examples/org-roam-example.db`: Generated SQLite database (10 nodes, 62 edges)
- `examples/org/`: 10 generated `.org` files with org-roam properties
- `package.json`: Root scripts (`example:generate`, `example:server`)
- `packages/backend/package.json`: Scripts (`dev`, `build`, `example`)
- `packages/backend/src/serve.ts`: Hono API server entry point
- `packages/backend/src/query.ts`: API route handlers (`fetchGraph`, `fetchNode`)
- `packages/frontend/src/graph/graph.ts`: `fetchGraphData()` with retry, `drawGraph()` renderer dispatcher
- `packages/frontend/src/graph/node.ts`: `openNode()` with retry
- `packages/frontend/src/hooks/useGraphManager.ts`: React hook wiring graph ref, config, and events
- `packages/frontend/vite.config.ts`: Dev proxy `"/api" → "http://localhost:5174"`
- `packages/frontend/src/App.tsx`: Main component rendering App with graph
- `packages/frontend/src/components/GraphControls.tsx`: Settings/details toggle buttons
- `packages/frontend/src/components/SettingsPanel.tsx`: UI settings controls
- `packages/frontend/src/components/GraphContainer.tsx`: Graph container div
