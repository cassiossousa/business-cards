import { createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";

import ProjectFormPage from "../pages/projects/ProjectFormPage.vue";
import ProjectListPage from "../pages/projects/ProjectListPage.vue";
import { createAppRouter } from "./index";

describe("router", () => {
  it("redirects / to /projects", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/");

    expect(router.currentRoute.value.path).toBe("/projects");
    expect(router.currentRoute.value.name).toBe("projects");
  });

  it("renders ProjectListPage at the named /projects route", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/projects");

    expect(router.currentRoute.value.name).toBe("projects");
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(
      ProjectListPage,
    );
  });

  it("renders ProjectFormPage for the new-project route", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/projects/new");

    expect(router.currentRoute.value.name).toBe("project-new");
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(
      ProjectFormPage,
    );
  });

  it("renders ProjectFormPage and captures the project ID for editing", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/projects/p1/edit");

    expect(router.currentRoute.value.name).toBe("project-edit");
    expect(router.currentRoute.value.params.id).toBe("p1");
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(
      ProjectFormPage,
    );
  });

  it("redirects unknown paths to /projects", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/unknown/path");

    expect(router.currentRoute.value.path).toBe("/projects");
    expect(router.currentRoute.value.name).toBe("projects");
  });
});
