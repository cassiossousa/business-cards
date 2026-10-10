import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CardProject } from "../../../api/types";
import {
  ApiError,
  deleteProject,
  listProjects,
} from "../../../api/projectsApi";
import ProjectListPage from "./ProjectListPage.vue";

const RouteStub = defineComponent({
  render: () => h("div"),
});

vi.mock("../../../api/projectsApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../api/projectsApi")>();

  return {
    ...actual,
    listProjects: vi.fn(),
    deleteProject: vi.fn(),
  };
});

const listProjectsMock = vi.mocked(listProjects);
const deleteProjectMock = vi.mocked(deleteProject);

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

async function mountPage() {
  const router = await createTestRouter();

  const wrapper = mount(ProjectListPage, {
    global: {
      plugins: [router],
    },
  });

  await flushPromises();

  return { wrapper, router };
}

function buttonByText(wrapper: VueWrapper, label: string) {
  const button = wrapper
    .findAll("button")
    .find((candidate) => candidate.text() === label);

  if (!button) {
    throw new Error(`Expected button "${label}".`);
  }

  return button;
}

beforeEach(() => {
  listProjectsMock.mockReset();
  deleteProjectMock.mockReset();

  listProjectsMock.mockResolvedValue({
    projects: [],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ProjectListPage", () => {
  it("does not show the skeleton when the list loads quickly", async () => {
    const { wrapper } = await mountPage();

    expect(wrapper.find(".skeleton-list").exists()).toBe(false);
    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("renders projects and their edit links", async () => {
    listProjectsMock.mockResolvedValue({
      projects: [project(), project({ id: "p2", name: "Photo studio" })],
    });

    const { wrapper } = await mountPage();

    expect(wrapper.findAll(".project-item")).toHaveLength(2);
    expect(wrapper.text()).toContain("Studio cards");
    expect(wrapper.text()).toContain("Photo studio");

    expect(wrapper.get('a[href="/projects/p1/edit"]').text()).toBe("Edit");
  });

  it("navigates to the new-project route", async () => {
    const { wrapper, router } = await mountPage();

    await wrapper.get('a[href="/projects/new"]').trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("project-new");
  });

  it("shows the skeleton after the loading delay", async () => {
    const router = await createTestRouter();

    vi.useFakeTimers();

    let resolveList: (value: { projects: CardProject[] }) => void = () => {};

    listProjectsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    const wrapper = mount(ProjectListPage, {
      global: {
        plugins: [router],
      },
    });

    try {
      await vi.advanceTimersByTimeAsync(0);
      await nextTick();

      expect(wrapper.text()).not.toContain("Loading projects…");

      await vi.advanceTimersByTimeAsync(150);
      await nextTick();

      expect(wrapper.text()).toContain("Loading projects…");

      resolveList({
        projects: [project()],
      });

      await vi.advanceTimersByTimeAsync(0);
      await flushPromises();

      expect(wrapper.text()).toContain("Studio cards");
      expect(wrapper.text()).not.toContain("Loading projects…");
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it("retries the list after a loading error", async () => {
    listProjectsMock.mockRejectedValueOnce(
      new ApiError("NETWORK", "Could not reach the server.", 0),
    );

    const { wrapper } = await mountPage();

    expect(wrapper.text()).toContain("Could not load your projects.");

    listProjectsMock.mockResolvedValueOnce({
      projects: [project()],
    });

    await buttonByText(wrapper, "Try again").trigger("click");
    await flushPromises();

    expect(listProjectsMock).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("Studio cards");
  });

  it("deletes a project after confirmation", async () => {
    listProjectsMock.mockResolvedValue({
      projects: [project()],
    });

    const { wrapper } = await mountPage();

    await buttonByText(wrapper, "Delete").trigger("click");

    expect(wrapper.text()).toContain("Confirm delete");

    deleteProjectMock.mockResolvedValueOnce(undefined);

    await buttonByText(wrapper, "Confirm delete").trigger("click");
    await flushPromises();

    expect(deleteProjectMock).toHaveBeenCalledExactlyOnceWith("p1");
    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("keeps a project when deletion is cancelled", async () => {
    listProjectsMock.mockResolvedValue({
      projects: [project()],
    });

    const { wrapper } = await mountPage();

    await buttonByText(wrapper, "Delete").trigger("click");
    await buttonByText(wrapper, "Cancel").trigger("click");

    expect(deleteProjectMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Studio cards");
    expect(wrapper.text()).not.toContain("Confirm delete");
  });

  it("shows deletion errors without removing the project", async () => {
    listProjectsMock.mockResolvedValue({
      projects: [project()],
    });

    const { wrapper } = await mountPage();

    deleteProjectMock.mockRejectedValueOnce(
      new ApiError("NOT_FOUND", "Project not found.", 404),
    );

    await buttonByText(wrapper, "Delete").trigger("click");
    await buttonByText(wrapper, "Confirm delete").trigger("click");
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe("Project not found.");
    expect(wrapper.text()).toContain("Studio cards");
  });
});
