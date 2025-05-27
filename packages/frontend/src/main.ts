import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createApp, type App as VueApp } from "vue";
import App from "./App.vue";
import { uiStorePlugin } from "./store/ui.ts";

/**
 * Create and mount the root Vue application.
 *
 * @returns The created Vue app instance.
 */
export function startApp(): VueApp {
  const app = createApp(App);
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  pinia.use(uiStorePlugin);
  app.use(pinia);
  app.mount("#app");
  return app;
}

startApp();
