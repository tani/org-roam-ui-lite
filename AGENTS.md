# AGENTS.md

This file provides guidance for coding agents working in this repository.

## Project Overview

org-roam-ui-lite is a TypeScript monorepo for visualizing Org-roam knowledge
graphs. It includes a Node backend, a React frontend, an Emacs integration, and
an example workspace with sample Org-roam files.

## Common Commands

- `npm install` - Install monorepo dependencies
- `npm run typegen` - Generate API types from `openapi.yaml`
- `npm run dev` - Start frontend and backend dev servers
- `npm run build` - Generate types, build workspaces, and assemble `dist/`
- `npm run export -- -d DB -o OUT` - Build and export a static site (HTML + JSON API)
- `npm run populate -- -i DIR -d DB` - Create a SQLite database from Org files
- `npm run serve -- -d DB -p 5174` - Serve the backend API and frontend bundle
- `npm run example:populate` - Generate the example SQLite database
- `npm run example:export` - Generate the example static site
- `npm run example:serve` - Generate and serve the example static site
- `npm run check` - Run TypeScript type checking
- `npm run lint` - Run Biome checks
- `npm run lint:fix` - Apply Biome fixes
- `npm run test` - Run Vitest tests
- `npm run test:ui` - Run Vitest UI

Run a single test with:

```bash
npm run test -- path/to/test-file.test.ts
```

## Monorepo Structure

The project uses npm workspaces under `packages/*`.

1. `packages/backend/`
   - Hono-based Node server and CLI
   - Uses Drizzle ORM to access SQLite
   - Imports Org files with `populate` subcommand
   - Serves API endpoints and frontend with `serve` subcommand
   - Exports static HTML + JSON API with `export` subcommand
   - CLI entry point: `src/org-roam-ui-lite.ts`

2. `packages/frontend/`
   - React SPA built with Vite
   - Graph visualization with Cytoscape.js, Force Graph, and 3D Force Graph
   - Backlinks panel with Org content rendering
   - Entry point: `src/main.tsx`

3. `packages/emacs/`
   - Emacs Lisp integration
   - Single-file server using simple-httpd

4. `packages/example/`
   - Sample Org-roam files in `org/`
   - Example scripts for populate, static export, and serving
   - Generated outputs are ignored: `org-roam-example.db` and `static/`

## API

- `GET /api/graph.json` - Complete graph data with nodes and edges
- `GET /api/node/{id}.json` - Specific node with backlinks

The API contract is defined in `openapi.yaml`. Generated TypeScript types are
written to:

- `packages/backend/src/api.d.ts`
- `packages/frontend/src/api/api.d.ts`

## Build Flow

Root `npm run build` runs:

1. `npm run typegen`
2. `npm run build:workspaces`
3. `npm run build:dist`

Workspace builds are run with `--if-present`, so utility workspaces such as
`packages/example` do not need no-op build scripts.

## Development Workflow

1. Frontend dev server proxies `/api` requests to the backend.
2. Backend dev server accepts CLI flags through `npm run dev -- ...`.
3. Tests live in package-local `test/` directories.
4. Keep `openapi.yaml` and generated API types in sync with `npm run typegen`.
5. Before finishing changes, run at least `npm run check` and `npm run lint`.

## Code Style

- TypeScript strict mode is enabled.
- Biome handles linting and formatting.
- Tabs are used for indentation.
- JavaScript and TypeScript strings use double quotes.
- Imports are organized by Biome.
