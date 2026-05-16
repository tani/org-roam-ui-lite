# Org-Roam UI Lite

https://github.com/user-attachments/assets/20ba9c71-6de0-452d-988b-cea4b0ebcc45

(thanks @takeokunn)

A self-contained graph viewer for
[Org-roam](https://www.orgroam.com) notes. It can import a directory of Org-roam
files into SQLite, serve a local API and frontend, or export a static website
that can be hosted anywhere.

# Features

- **Org-roam import** from a directory of `.org` files
- **Node backend** with Hono and Drizzle-powered SQLite access
- **React frontend** with Cytoscape, Force Graph, and 3D Force Graph renderers
- **Backlink panel** with Org rendering, MathJax, Mermaid, and syntax highlighting
- **Static export** that copies the frontend bundle and dumps JSON API files
- **Emacs integration** through a single-file `simple-httpd` server

# Repository Layout

```text
org-roam-ui-lite/
├── packages/
│   ├── backend/    Node CLI, Hono API, SQLite/Drizzle access
│   ├── frontend/   Vite + React graph UI
│   ├── emacs/      org-roam-ui-lite.el
│   └── example/    sample Org-roam files and example scripts
├── scripts/        build and export helpers
├── openapi.yaml    shared API contract
└── flake.nix       Nix development and package definitions
```

# Quick Start

```bash
$ git clone https://github.com/tani/org-roam-ui-lite.git
$ cd org-roam-ui-lite
$ npm install
$ npm run populate -- -i /path/to/org-roam-directory -d /path/to/org-roam.db
$ npm run dev -- -d /path/to/org-roam.db
```

Open <http://localhost:5173>.

# CLI Commands

The root scripts delegate to `packages/backend`.

```bash
$ npm run populate -- -i /path/to/org-roam-directory -d /path/to/org-roam.db
$ npm run serve -- -d /path/to/org-roam.db -p 5174
$ npm run dump -- -d /path/to/org-roam.db -o /path/to/output/api
```

Available backend subcommands:

| Command    | Purpose                                             |
| ---------- | --------------------------------------------------- |
| `populate` | Create a SQLite database from a directory of Org files |
| `serve`    | Serve the backend API and frontend bundle           |
| `dump`     | Dump static JSON API files                          |

# Static Export

Use `export` when you want a self-contained static site.

```bash
$ npm run populate -- -i /path/to/org-roam-directory -d /path/to/org-roam.db
$ npm run export -- -d /path/to/org-roam.db -o /path/to/output
$ npx serve /path/to/output
```

The export command builds the frontend, copies it into the output directory, and
writes JSON API files under `/api`.

# Example Site

Sample Org-roam notes live in `packages/example/org`.

```bash
$ npm run example:populate
$ npm run dev -- -d packages/example/org-roam-example.db
```

Generate a static example site:

```bash
$ npm run example:export
```

Generate and serve the static example site at <http://127.0.0.1:3000>:

```bash
$ npm run example:serve
```

Generated example outputs are ignored by Git:

- `packages/example/org-roam-example.db`
- `packages/example/static/`

# Development Scripts

| Script                 | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run typegen`      | Generate TypeScript types from `openapi.yaml` |
| `npm run dev`          | Start frontend and backend dev servers       |
| `npm run build`        | Generate types, build workspaces, and assemble `dist/` |
| `npm run export`       | Build and export a static site               |
| `npm run check`        | Run TypeScript type checking                 |
| `npm run lint`         | Run Biome checks                             |
| `npm run lint:fix`     | Apply Biome fixes                            |
| `npm run test`         | Run Vitest tests                             |
| `npm run test:ui`      | Run Vitest UI                                |

# Nix

Replace `v0.0.48` with the version you want to use.

```bash
$ nix run 'github:tani/org-roam-ui-lite?tag=v0.0.48#serve' -- -d /path/to/org-roam.db
$ nix run 'github:tani/org-roam-ui-lite?tag=v0.0.48#export' -- -d /path/to/org-roam.db -o /path/to/output
```

# Emacs

Build or download the project, then add this to your `init.el`:

```commonlisp
(add-to-list 'load-path "/path/to/org-roam-ui-lite/emacs")
(require 'org-roam-ui-lite)
(org-roam-ui-lite-mode)
```

Requires Emacs 29.1, Org-roam 2.2.2 or later, and simple-httpd 1.5.1 or later.

Visit <http://localhost:5174/index.html>.

# API Overview

| Endpoint                | Description                 |
| ----------------------- | --------------------------- |
| `GET /api/graph.json`   | Whole graph with nodes and edges |
| `GET /api/node/{id}.json` | One node with backlinks       |

The full contract is defined in `openapi.yaml` and kept in sync with generated
TypeScript types.

# Contributing

1. Fork and create a feature branch.
2. Run `npm run lint && npm run check`.
3. Open a PR and explain why the change is needed.

Code is formatted and linted by Biome.

# Licence

Copyright 2025 Masaya Taniguchi.

Released under the GNU GPL v3 or later. See [LICENSE.org](LICENSE.org).
