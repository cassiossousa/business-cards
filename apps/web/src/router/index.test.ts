import { describe, expect, it } from "vitest";
import { createMemoryHistory } from "vue-router";

import ProjectListPage from "../pages/projects/ProjectListPage.vue";
import { createAppRouter } from "./index";

describe("router", () => {
  it("redirects / to /projects", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/");

    expect(router.currentRoute.value.path).toBe("/projects");
  });

  it("renders ProjectListPage at the named /projects route", async () => {
    const router = createAppRouter(createMemoryHistory());

    await router.push("/projects");

    expect(router.currentRoute.value.name).toBe("projects");
    expect(router.currentRoute.value.matched[0]?.components?.default).toBe(
      ProjectListPage,
    );
  });
});
