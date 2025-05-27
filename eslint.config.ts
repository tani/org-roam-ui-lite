import pluginVue from "eslint-plugin-vue";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import prettier from "@vue/eslint-config-prettier";

export default defineConfigWithVueTs(
  {
    ignores: ["out/**", "**/dist/**", "node_modules/**", "openapi.ts"],
  },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  prettier,
);
