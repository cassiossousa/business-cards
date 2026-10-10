import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

import ProjectActionLink from "./ProjectActionLink.vue";

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
      {
        path: "/projects/:id/edit",
        name: "project-edit",
        component: RouteStub,
      },
    ],
  });

  await router.push("/projects");
  await router.isReady();

  return router;
}

describe("ProjectActionLink", () => {
  it("renders its slot content", async () => {
    const router = await createTestRouter();

    const wrapper = mount(ProjectActionLink, {
      props: {
        to: { name: "project-new" },
        variant: "primary",
      },
      slots: {
        default: "Create project",
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toBe("Create project");
  });

  it("renders the primary variant", async () => {
    const router = await createTestRouter();

    const wrapper = mount(ProjectActionLink, {
      props: {
        to: { name: "project-new" },
        variant: "primary",
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.classes()).toContain("action-link");
    expect(wrapper.classes()).toContain("action-link--primary");
  });

  it("renders the secondary variant", async () => {
    const router = await createTestRouter();

    const wrapper = mount(ProjectActionLink, {
      props: {
        to: {
          name: "project-edit",
          params: { id: "p1" },
        },
        variant: "secondary",
      },
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.classes()).toContain("action-link--secondary");
    expect(wrapper.attributes("href")).toBe("/projects/p1/edit");
  });
});
