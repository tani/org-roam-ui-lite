import { createPinia } from "pinia";
import { createApp, type App as VueApp } from "vue";
import App from "./App.vue";

/**
 * Create and mount the root Vue application.
 *
 * @returns The created Vue app instance.
 */
export function startApp(): VueApp {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.mount("#app");
  return app;
}

startApp();
