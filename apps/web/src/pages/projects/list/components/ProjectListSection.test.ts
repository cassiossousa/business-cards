import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

import type { CardProject } from "../../../../api/types";
import type { ProjectFeedback, ProjectLoadState } from "../useProjectList";
import ProjectListSection from "./ProjectListSection.vue";

const RouteStub = defineComponent({
  render: () => h("div"),
});

function project(): CardProject {
  return {
    id: "p1",
    name: "Studio cards",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

async function mountSection(
  options: {
    projects?: CardProject[];
    loadState?: ProjectLoadState;
    showLoadingState?: boolean;
    deleteFeedback?: ProjectFeedback | null;
    pendingDeleteId?: string | null;
    deletingId?: string | null;
  } = {},
) {
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

  const wrapper = mount(ProjectListSection, {
    props: {
      projects: [],
      loadState: "ready",
      showLoadingState: false,
      deleteFeedback: null,
      pendingDeleteId: null,
      deletingId: null,
      ...options,
    },
    global: {
      plugins: [router],
    },
  });

  return { wrapper, router };
}

describe("ProjectListSection", () => {
  it("renders the section heading", async () => {
    const { wrapper } = await mountSection();

    expect(wrapper.get("h3").text()).toBe("All projects");
  });

  it("renders the delayed loading state", async () => {
    const { wrapper } = await mountSection({
      loadState: "loading",
      showLoadingState: true,
    });

    expect(wrapper.text()).toContain("Loading projects…");
    expect(wrapper.findAll(".skeleton-list li")).toHaveLength(3);
  });

  it("renders the error state and forwards retry", async () => {
    const { wrapper } = await mountSection({
      loadState: "error",
    });

    expect(wrapper.text()).toContain("Could not load your projects.");

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("renders the empty state", async () => {
    const { wrapper } = await mountSection();

    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("renders the project list when projects are available", async () => {
    const { wrapper } = await mountSection({
      projects: [project()],
    });

    expect(wrapper.text()).toContain("Studio cards");
    expect(wrapper.findAll(".project-item")).toHaveLength(1);
  });

  it("renders deletion feedback as an alert", async () => {
    const { wrapper } = await mountSection({
      deleteFeedback: {
        tone: "error",
        text: "Project not found.",
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toBe("Project not found.");
  });

  it("forwards delete requests from the project list", async () => {
    const { wrapper } = await mountSection({
      projects: [project()],
    });

    await wrapper.get("button").trigger("click");

    expect(wrapper.emitted("request-delete")).toEqual([[project()]]);
  });

  it("forwards cancellation and confirmation from the project list", async () => {
    const { wrapper } = await mountSection({
      projects: [project()],
      pendingDeleteId: "p1",
    });

    const buttons = wrapper.findAll("button");
    const confirmButton = buttons.find(
      (button) => button.text() === "Confirm delete",
    );
    const cancelButton = buttons.find((button) => button.text() === "Cancel");

    expect(confirmButton).toBeDefined();
    expect(cancelButton).toBeDefined();

    await confirmButton!.trigger("click");
    await cancelButton!.trigger("click");

    expect(wrapper.emitted("confirm-delete")).toHaveLength(1);
    expect(wrapper.emitted("cancel-delete")).toHaveLength(1);
  });
});
