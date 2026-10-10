import { createRouter, createWebHistory } from "vue-router";

import ProjectFormPage from "../pages/projects/form/ProjectFormPage.vue";
import ProjectListPage from "../pages/projects/list/ProjectListPage.vue";

export function createAppRouter(
  history = createWebHistory(import.meta.env.BASE_URL),
) {
  return createRouter({
    history,

    routes: [
      {
        path: "/",
        redirect: { name: "projects" },
      },
      {
        path: "/projects",
        name: "projects",
        component: ProjectListPage,
      },
      {
        path: "/projects/new",
        name: "project-new",
        component: ProjectFormPage,
      },
      {
        path: "/projects/:id/edit",
        name: "project-edit",
        component: ProjectFormPage,
      },
      {
        path: "/:pathMatch(.*)*",
        redirect: "/projects",
      },
    ],

    scrollBehavior() {
      return { top: 0 };
    },
  });
}

export default createAppRouter();
