export interface paths {
	"/": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Serve index.html
		 * @description Serves the main front-end UI page (usually `index.html`), located in `org-roam-ui-lite-static-root`. This acts as the SPA entry point and loads the graph viewer client.
		 *
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path?: never;
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Static HTML page */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"text/html": string;
					};
				};
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/index.html": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Serve index.html explicitly
		 * @description Alias to `/`. Loads the same static HTML file that bootstraps the UI.
		 *
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path?: never;
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description HTML file */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"text/html": string;
					};
				};
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/assets/{file}": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Serve static asset (JS, CSS, images)
		 * @description Serves JavaScript, CSS, fonts, or other frontend assets under the static root.
		 *
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path: {
					file: string;
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Static file */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"*/*": string;
					};
				};
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/api/graph.json": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/** Get full node-edge graph */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path?: never;
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Graph data returned */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"application/json": components["schemas"]["Graph"];
					};
				};
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/api/node/{id}.json": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/** Get single node and backlinks */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path: {
					id: string;
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Node found */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"application/json": components["schemas"]["Node"];
					};
				};
				/** @description Node not found */
				404: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"application/json": {
							/** @example not_found */
							error: string;
						};
					};
				};
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
	"/api/node/{id}/{path}": {
		parameters: {
			query?: never;
			header?: never;
			path?: never;
			cookie?: never;
		};
		/**
		 * Serve node asset (e.g. images)
		 * @description Serves binary assets (images, etc.) referenced in the note with given `id`. The `path` parameter is the Base64url-encoded basename plus extension.
		 *
		 */
		get: {
			parameters: {
				query?: never;
				header?: never;
				path: {
					id: string;
					path: string;
				};
				cookie?: never;
			};
			requestBody?: never;
			responses: {
				/** @description Binary asset returned */
				200: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"image/*": Uint8Array;
					};
				};
				/** @description Asset not found */
				404: {
					headers: {
						[name: string]: unknown;
					};
					content: {
						"application/json": {
							/** @example not_found */
							error: string;
						};
					};
				};
			};
		};
		put?: never;
		post?: never;
		delete?: never;
		options?: never;
		head?: never;
		patch?: never;
		trace?: never;
	};
}
export type webhooks = Record<string, never>;
export interface components {
	schemas: {
		Graph: {
			nodes: components["schemas"]["NodeSummary"][];
			edges: components["schemas"]["Edge"][];
		};
		NodeSummary: {
			id: string;
			title: string;
		};
		Edge: {
			source: string;
			dest: string;
		};
		Backlink: {
			source: string;
			title: string;
		};
		Node: {
			id: string;
			title: string;
			raw: string;
			backlinks?: components["schemas"]["Backlink"][];
		};
	};
	responses: never;
	parameters: never;
	requestBodies: never;
	headers: never;
	pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
