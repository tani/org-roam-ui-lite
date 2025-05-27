import pluginVue from "eslint-plugin-vue";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";
import prettier from "@vue/eslint-config-prettier";
import gitignore from "eslint-config-flat-gitignore";

export default defineConfigWithVueTs(
  gitignore(),
  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  prettier,
);
