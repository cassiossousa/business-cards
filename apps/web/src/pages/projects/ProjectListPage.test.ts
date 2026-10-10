import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CardProject } from "../../api/types";
import { ApiError, deleteProject, listProjects } from "../../api/projectsApi";
import ProjectFormPage from "./ProjectFormPage.vue";
import ProjectListPage from "./ProjectListPage.vue";

vi.mock("../../api/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/projectsApi")>();

  return {
    ...actual,
    listProjects: vi.fn(),
    createProject: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
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

function buttonByText(wrapper: VueWrapper, label: string) {
  const match = wrapper
    .findAll("button")
    .find((button) => button.text() === label);

  if (!match) {
    throw new Error(`Expected to find a button labeled "${label}".`);
  }

  return match;
}

async function createTestRouter(initialPath = "/projects") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
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
    ],
  });

  await router.push(initialPath);
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
  it("shows the loading state only after a short delay", async () => {
    const router = await createTestRouter();

    vi.useFakeTimers();

    let wrapper: VueWrapper | undefined;

    try {
      let resolveList: (value: { projects: CardProject[] }) => void = () => {};

      listProjectsMock.mockReturnValue(
        new Promise<{ projects: CardProject[] }>((resolve) => {
          resolveList = resolve;
        }),
      );

      wrapper = mount(ProjectListPage, {
        global: {
          plugins: [router],
        },
      });

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
      wrapper?.unmount();
      vi.useRealTimers();
    }
  });

  it("never shows the loading skeleton when projects arrive quickly", async () => {
    const { wrapper } = await mountPage();

    expect(wrapper.find(".skeleton-list").exists()).toBe(false);
    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("shows the empty state when there are no projects", async () => {
    const { wrapper } = await mountPage();

    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("renders the loaded projects", async () => {
    listProjectsMock.mockResolvedValue({
      projects: [
        project({ name: "Café cards" }),
        project({
          id: "p2",
          name: "Photo studio",
        }),
      ],
    });

    const { wrapper } = await mountPage();

    expect(wrapper.text()).toContain("Café cards");
    expect(wrapper.text()).toContain("Photo studio");
  });

  it("links to the new-project form", async () => {
    const { wrapper, router } = await mountPage();

    const link = wrapper.get('a[href="/projects/new"]');

    expect(link.text()).toBe("Create project");

    await link.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("project-new");
  });

  it("links each project to its edit form", async () => {
    listProjectsMock.mockResolvedValue({
      projects: [project()],
    });

    const { wrapper, router } = await mountPage();

    const link = wrapper.get('a[href="/projects/p1/edit"]');

    expect(link.text()).toBe("Edit");

    await link.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("project-edit");
    expect(router.currentRoute.value.params.id).toBe("p1");
  });

  it("shows an error with a retry that reloads the list", async () => {
    listProjectsMock.mockRejectedValueOnce(
      new ApiError(
        "NETWORK",
        "Could not reach the server. Check that the API is running.",
        0,
      ),
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

  it("deletes a project after a confirmation step", async () => {
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

  it("keeps the project when the delete confirmation is cancelled", async () => {
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

  it("shows an alert when deletion fails", async () => {
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

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "Project not found.",
    );

    expect(wrapper.text()).toContain("Studio cards");
  });
});
