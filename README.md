# Org-Roam UI Lite


https://github.com/user-attachments/assets/20ba9c71-6de0-452d-988b-cea4b0ebcc45


(thanks @takeokunn)

A **self-contained, zero-config graph viewer** for your
[Org-roam](https://www.orgroam.com) notes. Run it either as a tiny Node
server or straight from Emacs, then open a browser and explore your
knowledge graph with a snappy Cytoscape-powered UI.

# Features

- **Dual back-ends**
  - **Node (Hono)** – fast, serves JSON + static assets.
  - **Emacs (simple-httpd)** – one-file drop-in; perfect for local use.
- **Themeable** – Nord Dark, Gruvbox Dark, Dracula Dark, plus
  light/dark.
- **Deterministic node colours** based on UUID for easy visual grouping.
- **Interactive layout switching** (fcose, concentric, grid, …).
- **Backlink panel** with Org-styled rendering (MathJax, Mermaid, syntax
  highlighting with copy button).
- **Offline export** – dump the JSON once, host on any static server.

# Repository layout

    org-roam-ui-lite/
    ├── packages/
    │   ├── backend/    ← Node + Hono JSON API
    │   ├── frontend/   ← Vite + Alpine.js + Cytoscape SPA
    │   └── emacs/      ← org-roam-ui-lite.el (single-file server)
    ├── scripts/        ← build & export helpers (zx)
    ├── flake.nix       ← reproducible dev env (Nix ≥2.18)
    └── openapi.yaml    ← shared API contract (typed via openapi-typescript)

# Stable

# Quick start (pre-built)

``` bash
$ curl -fsSLO https://github.com/tani/org-roam-ui-lite/releases/latest/download/org-roam-ui-lite.zip
$ unzip ./org-roam-ui-lite.zip
$ cd org-roam-ui-lite
$ node ./backend/dist/backend.js -d /path/to/database.db
```

Open [<http://localhost:5173>](http://localhost:5173) and start clicking
nodes!

# Building a static-site (pre-built)

``` bash
$ curl -fsSLO https://github.com/tani/org-roam-ui-lite/releases/latest/download/org-roam-ui-lite.zip
$ unzip ./org-roam-ui-lite.zip
$ cd org-roam-ui-lite
$ node scripts/export.ts -r . -d /path/to/database.db -o /path/to/output
$ python3 -m http.server -d /path/to/output
```

# HEAD

# Quick start (npm)

``` bash
$ git clone https://github.com/tani/org-roam-ui-lite.git
$ cd org-roam-ui-lite
$ npm install
$ npm run dev -- -d /path/to/database.db
```

Open [<http://localhost:5173>](http://localhost:5173) and start clicking
nodes!

# Building a static-site (npm)

``` bash
$ git clone github.com/tani/org-roam-ui-lite.git
$ cd org-roam-ui-lite
$ npm install
$ npm run export -- -d /path/to/database.db -o /path/to/output
$ python3 -m http.server -d /path/to/output
```

# Nix

## Quick start (Nix)

``` bash
$ nix run github:tani/org-roam-ui-lite#serve -- -d /path/to/database.db
$ # nix run .#serve -- -d /path/to/database.db
```

Open [<http://localhost:5173>](http://localhost:5173) and start clicking
nodes!

## Building a static-site (Nix)

``` bash
$ nix run github:tani/org-roam-ui-lite#export -- -d /path/to/database.db -o /path/to/output
$ # nix run .#export -- -d /path/to/database.db -o /path/to/output
$ python3 -m http.server -d /path/to/output
```

# Emacs

## Build project (Emacs)

``` bash
$ curl -fsSLO https://github.com/tani/org-roam-ui-lite/releases/latest/download/org-roam-ui-lite.zip
$ unzip ./org-roam-ui-lite.zip
```

## Launch Emacs

Add this to your `init.el` (requires Emacs 29.1 + Org-roam ≥2.2.2 +
simple-httpd ≥ 1.5.1):

``` commonlisp
(add-to-list 'load-path "/path/to/org-roam-ui-lite/emacs")
(require 'org-roam-ui-lite)
(org-roam-ui-lite-mode)
```

Visit <http://localhost:5174/index.html> – that’s all.

# API overview

| Endpoint                | Description                 | Response          |
|-------------------------|-----------------------------|-------------------|
| GET /api/graph.json     | Whole graph (nodes + edges) | Graph object      |
| GET /api/node/{id}.json | One node + backlinks        | Node or 404 error |

The full contract is defined in `openapi.yaml` and kept in sync with
TypeScript types via **openapi-typescript**.

# Contributing

1.  Fork & create a feature branch.
2.  `npm run lint && npm run check` must pass.
3.  Open a PR – make sure to explain **why**.

All code is formatted/linted by **Biome**; commits that fail CI will be
rejected automatically.

# Licence

© 2025 Masaya Taniguchi Released under the **GNU GPL v3 or later** – see
[LICENSE.org](LICENSE.org).

# Acknowledgements

- [Org-roam](https://github.com/org-roam/org-roam) for the database &
  inspiration.
- [Hono](https://hono.dev), [Cytoscape.js](https://js.cytoscape.org),
  [Alpine.js](https://alpinejs.dev).
- Colour palettes from **Nord**, **Gruvbox** and **Dracula** themes.

Happy note-exploring! 🎈
