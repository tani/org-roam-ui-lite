# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

org-roam-ui-lite is a TypeScript monorepo for visualizing Org-roam knowledge graphs. It provides both Node.js and Emacs backends with a React frontend for interactive graph exploration.

## Common Development Commands

### Essential Commands
- `npm install` - Install all dependencies for the monorepo
- `npm run dev` - Start both frontend (port 5173) and backend development servers
- `npm run build` - Build all packages for production
- `npm run export` - Create a static site export
- `npm run lint` - Check code with Biome linter
- `npm run lint:fix` - Auto-fix linting issues
- `npm run check` - Run TypeScript type checking
- `npm run test` - Run all tests with Vitest
- `npm run test:ui` - Run tests with interactive UI

### Running a Single Test
```bash
npm run test -- path/to/test-file.test.ts
```

## Architecture Overview

### Monorepo Structure
The project uses npm workspaces with three main packages:

1. **packages/backend/** - Hono-based Node.js server
   - Serves JSON API endpoints defined in openapi.yaml
   - Reads from Org-roam SQLite database
   - Entry point: src/serve.ts

2. **packages/frontend/** - React SPA with Vite
   - Graph visualization using Cytoscape.js and Force Graph
   - Multiple themes and layout options
   - Backlinks panel with Org content rendering
   - Entry point: src/main.tsx

3. **packages/emacs/** - Emacs Lisp integration
   - Single-file server using simple-httpd
   - Direct Emacs integration for local use

### Key Technologies
- **TypeScript** with strict mode enabled
- **API Contract**: openapi.yaml with openapi-typescript for type safety
- **Testing**: Vitest with separate configurations for frontend (jsdom) and backend (node)
- **Build Tools**: Vite for frontend, tsdown for backend
- **Code Quality**: Biome for linting/formatting, Lefthook for git hooks

### API Endpoints
- `GET /api/graph.json` - Returns complete graph data (nodes and edges)
- `GET /api/node/{id}.json` - Returns specific node with backlinks

### Development Workflow
1. The frontend proxies API requests to the backend during development (see vite.config.ts)
2. Types are generated from openapi.yaml and shared between packages
3. Git hooks run type checking and linting before commits
4. Tests are located in `test/` directories within each package

### Code Style
- Tabs for indentation (configured in biome.json)
- Double quotes for strings in JavaScript/TypeScript
- Imports are automatically organized by Biome