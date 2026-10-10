import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

import type { CardProject } from "../../../../api/types";
import ProjectListItem from "./ProjectListItem.vue";

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

async function mountItem(
  overrides: Partial<{
    project: CardProject;
    isConfirmingDelete: boolean;
    isDeleting: boolean;
  }> = {},
) {
  const router = await createTestRouter();

  const wrapper = mount(ProjectListItem, {
    props: {
      project: project(),
      isConfirmingDelete: false,
      isDeleting: false,
      ...overrides,
    },
    global: {
      plugins: [router],
    },
  });

  return { wrapper, router };
}

function buttonByText(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper
    .findAll("button")
    .find((candidate) => candidate.text() === label);

  if (!button) {
    throw new Error(`Expected button "${label}".`);
  }

  return button;
}

describe("ProjectListItem", () => {
  it("renders project details and an edit link", async () => {
    const { wrapper } = await mountItem();

    expect(wrapper.get(".project-name").text()).toBe("Studio cards");
    expect(wrapper.get(".project-created").text()).toContain("Created");

    expect(wrapper.get('a[href="/projects/p1/edit"]').text()).toBe("Edit");
    expect(buttonByText(wrapper, "Delete").exists()).toBe(true);
  });

  it("handles an invalid creation date without throwing", async () => {
    const { wrapper } = await mountItem({
      project: project({ createdAt: "invalid-date" }),
    });

    expect(wrapper.get(".project-created").text()).toBe("Created");
  });

  it("emits the project when deletion is requested", async () => {
    const item = project();
    const { wrapper } = await mountItem({ project: item });

    await buttonByText(wrapper, "Delete").trigger("click");

    expect(wrapper.emitted("request-delete")).toEqual([[item]]);
  });

  it("shows confirmation and emits confirm or cancel actions", async () => {
    const { wrapper } = await mountItem({
      isConfirmingDelete: true,
    });

    expect(wrapper.text()).toContain("Confirm delete");

    await buttonByText(wrapper, "Confirm delete").trigger("click");
    await buttonByText(wrapper, "Cancel").trigger("click");

    expect(wrapper.emitted("confirm-delete")).toHaveLength(1);
    expect(wrapper.emitted("cancel-delete")).toHaveLength(1);
  });

  it("disables both confirmation actions while deletion is in progress", async () => {
    const { wrapper } = await mountItem({
      isConfirmingDelete: true,
      isDeleting: true,
    });

    expect(buttonByText(wrapper, "Deleting…").element.disabled).toBe(true);
    expect(buttonByText(wrapper, "Cancel").element.disabled).toBe(true);
  });
});
