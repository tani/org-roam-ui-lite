import { $ } from "zx";

// Dump json
await $`node dist/backend/dist/backend.js -m dump -o dist/frontend/dist/api/`;

// Copy artifact to public
await $`rm -rf public/`;
await $`mkdir -p public/`;
await $`cp -vR dist/frontend/dist/* public/`;
await $`cp -vR dist/licenses public/licenses`;
