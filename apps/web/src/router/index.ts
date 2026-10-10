import {
  createRouter,
  type RouterHistory,
  type RouteRecordRaw,
} from "vue-router";

import ProjectListPage from "../pages/projects/ProjectListPage.vue";

export const routes: RouteRecordRaw[] = [
  { path: "/", redirect: { name: "projects" } },
  { path: "/projects", name: "projects", component: ProjectListPage },
];

export function createAppRouter(history: RouterHistory) {
  return createRouter({ history, routes });
}
