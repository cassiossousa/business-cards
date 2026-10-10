import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

import type { CardProject } from "../../../../api/types";
import ProjectList from "./ProjectList.vue";

const RouteStub = defineComponent({
  render: () => h("div"),
});

function project(overrides: Partial<CardProject> = {}): CardProject {
  return {
    id: "p1",
    name: "Studio cards",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

async function mountList() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/projects",
        name: "projects",
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

  const wrapper = mount(ProjectList, {
    props: {
      projects: [project(), project({ id: "p2", name: "Photo studio" })],
      pendingDeleteId: null,
      deletingId: null,
    },
    global: {
      plugins: [router],
    },
  });

  return { wrapper, router };
}

describe("ProjectList", () => {
  it("renders one row for each project", async () => {
    const { wrapper } = await mountList();

    expect(wrapper.findAll(".project-item")).toHaveLength(2);
    expect(wrapper.text()).toContain("Studio cards");
    expect(wrapper.text()).toContain("Photo studio");
  });

  it("forwards a row's delete request with the selected project", async () => {
    const { wrapper } = await mountList();

    const deleteButtons = wrapper
      .findAll("button")
      .filter((button) => button.text() === "Delete");

    await deleteButtons[0]!.trigger("click");

    expect(wrapper.emitted("request-delete")).toEqual([[project()]]);
  });

  it("forwards confirmation and cancellation events", async () => {
    const { wrapper } = await mountList();

    await wrapper.setProps({
      pendingDeleteId: "p1",
    });

    const confirmButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Confirm delete");

    expect(confirmButton).toBeDefined();

    await confirmButton!.trigger("click");

    const cancelButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Cancel");

    expect(cancelButton).toBeDefined();

    await cancelButton!.trigger("click");

    expect(wrapper.emitted("confirm-delete")).toHaveLength(1);
    expect(wrapper.emitted("cancel-delete")).toHaveLength(1);
  });

  it("passes the deleting state to the selected row", async () => {
    const { wrapper } = await mountList();

    await wrapper.setProps({
      pendingDeleteId: "p1",
      deletingId: "p1",
    });

    const deletingButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Deleting…");

    expect(deletingButton).toBeDefined();
    expect(deletingButton!.element.disabled).toBe(true);
  });
});
