import js from "@eslint/js";
import tseslint from "typescript-eslint";
import gitignore from "eslint-config-flat-gitignore";

export default tseslint.config(
  gitignore(),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/dist/", "**/node_modules/", "packages/frontend/"],
  },
  {
    files: ["scripts/**/*.js", "scripts/**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  }
);