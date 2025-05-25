# Contributor Guidance

This project uses Node.js workspaces and Nix for reproducible builds.
Before submitting a PR, follow these steps:

1. Install dependencies and formatting tools
   - `npm install` (or `nix develop` to enter the dev shell)

2. Ensure formatting and type checks, tests pass
   - `npm run lint`
   - `npm run check`
   - `npm test -- --run`

3. Commit changes after formatting. Biome is configured to use tabs and
   double quotes (`biome.json`).

4. When opening a Pull Request, briefly describe the purpose of your
   changes and reference related modules or files.

## Style Guide

1. Use descriptive variable names. Keep singular and plural forms
   consistent and avoid abbreviations. Prefer full words over short
   forms.
2. Start every function name with a verb so the intent is clear and use
   a consistent casing style.
3. Add a TSDoc block to **every** function. If the documentation fully
   describes the code, remove the inline comments. Write any remaining
   comments in English only.
4. Explicitly declare the return type of every function.
5. Follow the formatting rules from `biome.json`: tabs for indentation and
   double quotes for strings.
