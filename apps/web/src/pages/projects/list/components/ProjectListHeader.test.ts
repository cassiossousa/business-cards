import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

import ProjectListHeader from "./ProjectListHeader.vue";

const RouteStub = defineComponent({
  render: () => h("div"),
});

async function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/projects",
        name: "projects",
        component: RouteStub,
      },
      {
        path: "/projects/new",
        name: "project-new",
        component: RouteStub,
      },
    ],
  });

  await router.push("/projects");
  await router.isReady();

  return router;
}

describe("ProjectListHeader", () => {
  it("renders the page heading", async () => {
    const router = await createTestRouter();

    const wrapper = mount(ProjectListHeader, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.get("h2").text()).toBe("Your projects");
  });

  it("links to the new-project route", async () => {
    const router = await createTestRouter();

    const wrapper = mount(ProjectListHeader, {
      global: {
        plugins: [router],
      },
    });

    const link = wrapper.get("a");

    expect(link.text()).toBe("Create project");
    expect(link.attributes("href")).toBe("/projects/new");
  });
});
