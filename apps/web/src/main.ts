import { createApp } from "vue";
import { createWebHistory } from "vue-router";

import "./style.css";
import App from "./App.vue";
import { createAppRouter } from "./router";
import { initTheme } from "./theme/theme";

initTheme();

createApp(App)
  .use(createAppRouter(createWebHistory(import.meta.env.BASE_URL)))
  .mount("#app");
