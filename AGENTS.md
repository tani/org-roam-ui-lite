# Contributor Guidance

This project uses Node.js workspaces and Nix for reproducible builds.
Before submitting a PR, follow these steps:

1. Install dependencies and formatting tools  
   - `npm install` (or `nix develop` to enter the dev shell)

2. Ensure formatting and type checks pass  
   - `npm run lint`
   - `npm run check`
   - Optional: run tests with `npm test`

3. Commit changes after formatting. Biome is configured to use tabs and
   double quotes (`biome.json`).

4. When opening a Pull Request, briefly describe the purpose of your
   changes and reference related modules or files.
