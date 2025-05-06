# org‑roam‑ui‑lite

*A lightweight, self‑contained web UI and backend for visualising [Org‑roam](https://www.orgroam.com/) note graphs.*

<p align="center">
<img width="400" src="https://github.com/user-attachments/assets/199dfabd-3bbf-42c3-8591-b3d61e5ad02c" />
</p>

## 🎯 Design philosophy

* The original **org‑roam‑ui** was powerful but tightly coupled; this made it hard to keep pace with the rapid evolution of modern front‑end tooling.
* **org‑roam‑ui‑lite** deliberately scales down to **read‑only** features, keeps the dependency graph lean, and aims for "hard to break, easy to update".
* A **backend–frontend architecture** with a minimal **JSON protocol** means any backend (Rust, Go, etc.) can be swapped in as long as it fulfils the same contract.

## ✨ Features

| Area                              | Highlights                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Graph visualisation**           | ⚡️ Real‑time, interactive graph built with **Cytoscape** and the **cose‑bilkent** layout algorithm.                         |
| **Markdown & Org‑mode rendering** | Supports *Org‑mode* → HTML (uniorg‑parse → rehype) with **MathJax**, **Mermaid**, and **Starry Night** syntax highlighting. |
| **Zero‑config database**          | Ships with **SQL.js** – just point the backend at an SQLite file produced by `org‑roam`.                                     |
| **Single‑binary CLI**             | `org‑roam‑ui‑lite-cli` starts both the API and static UI – perfect for sharing or SSH port‑forwarding.                      |
| **Emacs integration**             | Optional elisp helpers so you can jump to the web UI straight from Org‑roam buffers.                                        |
| **Nix flake**                     | Reproducible build (Node, TypeScript, Emacs) in one command: `nix run .#org‑roam‑ui‑lite-cli`.                              |


## **Nix flake** exports three packages:

* `cli` – runnable binary (`node backend/dist/backend.mjs`).
* `elisp` – Emacs package embedding the CLI.
* `emacs` – A full Emacs with the package pre‑installed for quick hacking.

## 🚀 Quick start

### 1. Development

```bash
# Clone & install deps
$ git clone https://github.com/tani/org‑roam‑ui‑lite.git
$ cd org‑roam‑ui‑lite
$ npm install

# Start the backends
$ npm run dev

# Open http://localhost:5173
```

### 2. Production build

```bash
# Build once (frontend + backend)
$ npm run build  # runs vite build & tsup

# Launch
$ node dist/backend/dist/backend.mjs -d /path/to/org-roam.db -p 5174
```

### 3. Nix users

```bash
# Run the CLI with an ad‑hoc env
$ nix run .#cli -- -d /path/to/org-roam.db

# The UI is now served on 0.0.0.0:5174
```


## 🛠️ Configuration

| Flag / env                        | Default              | Purpose                             |
| --------------------------------- | -------------------- | ----------------------------------- |
| `-d`, `--database`, `ORU_DB_PATH` | `$(pwd)/database.db` | Path to the Org‑roam SQLite DB.     |
| `-p`, `--port`, `PORT`            | `5174`               | TCP port for the API/static backend. |

> [!TIP]
> In development the Vite backend (`packages/frontend`) proxies `/api` → `http://localhost:5174`. If you change the API port, update `vite.config.ts` accordingly.

## 📦 NPM scripts cheat‑sheet

| Workspace  | Command              | Description                                    |
| ---------- | -------------------- | ---------------------------------------------- |
| **frontend** | `npm run dev`        | Launch Vite dev backend with hot‑reload.        |
|            | `npm run build`      | Produce static assets in `dist/`.              |
|            | `npm run lint[:fix]` | Lint CSS/TS/HTML via **Biome**.                |
| **backend** | `npm run dev`        | Start API with automatic restarts via **tsx**. |
|            | `npm run build`      | Bundle to ESM with **tsup**.                   |
|            | `npm run lint[:fix]` | Lint TS/JSON via **Biome**.                    |

## 🖇️ Emacs package usage

### Nix and Emacs

Because the repository is a **flake**, you can consume both the CLI **and** the elisp helpers without building anything yourself.

#### 1. Quick CLI only

```bash
$ nix run github:tani/org-roam-ui-lite#cli -- -d ~/org-roam.db
```

#### 2. Ephemeral dev shell with Emacs pre‑wired

```bash
$ nix develop github:tani/org-roam-ui-lite#emacs
```

### Emacs usage guide

| Action                    | Command / Key                                          | What happens                                                                   |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Start / stop backend       | `M-x org-roam-ui-lite-mode`                            | Toggles the Node.js backend and shows or kills the `*org-roam-ui-lite*` buffer. |
| Open the UI               | Manually visit the printed URL (`browse-url` can help) | Displays the graph centred on the last visited node.                           |
| Customise variables       | `M-x customize-group RET org-roam-ui-lite`             | Change database path or port without touching init.el.                         |

The `*org-roam-ui-lite*` buffer prints backend logs—useful when hacking on the backend.

## 🤝 Contributing

1. **Fork** the repo and create a feature branch.
2. Keep commits atomic and descriptive (Conventional Commits preferred).
3. Run `npm run lint` if applicable.
4. Open a PR and fill out the template.


> [!TIP]
> Development tips:
>
> * The database lives in memory; restart the backend to pick up fresh exports.
> * Enable HMR in Vite to iterate on the UI without losing graph state.


## 📄 Licence

Released under the **GPLv3**. Third‑party licences are reproduced under `dist/licenses/` by the packaging script.
