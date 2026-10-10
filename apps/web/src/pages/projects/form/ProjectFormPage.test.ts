import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CardProject } from "../../../api/types";
import {
  ApiError,
  createProject,
  getProject,
  updateProject,
} from "../../../api/projectsApi";
import ProjectFormPage from "./ProjectFormPage.vue";

const ProjectsStub = defineComponent({
  render: () => h("div", "Projects"),
});

vi.mock("../../../api/projectsApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../api/projectsApi")>();

  return {
    ...actual,
    listProjects: vi.fn(),
    createProject: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  };
});

const createProjectMock = vi.mocked(createProject);
const getProjectMock = vi.mocked(getProject);
const updateProjectMock = vi.mocked(updateProject);

function project(overrides: Partial<CardProject> = {}): CardProject {
  return {
    id: "p1",
    name: "Studio cards",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

async function mountForm(initialPath = "/projects/new") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/projects",
        name: "projects",
        component: ProjectsStub,
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

  const wrapper = mount(ProjectFormPage, {
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
    throw new Error(`Expected to find a button labeled "${label}".`);
  }

  return button;
}

beforeEach(() => {
  createProjectMock.mockReset();
  getProjectMock.mockReset();
  updateProjectMock.mockReset();
});

describe("ProjectFormPage", () => {
  it("shows the new-project form and creates a project with a trimmed name", async () => {
    createProjectMock.mockResolvedValue(project({ name: "Rounded corners" }));

    const { wrapper, router } = await mountForm();

    expect(wrapper.text()).toContain("New project");

    await wrapper.get("#project-name").setValue("  Rounded corners  ");

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(createProjectMock).toHaveBeenCalledExactlyOnceWith(
      "Rounded corners",
    );

    expect(router.currentRoute.value.name).toBe("projects");
  });

  it("rejects an empty project name without calling the API", async () => {
    const { wrapper } = await mountForm();

    await wrapper.get("#project-name").setValue("   ");
    await wrapper.get("form").trigger("submit");

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Enter a project name.",
    );
  });

  it("rejects names longer than 80 characters", async () => {
    const { wrapper } = await mountForm();

    await wrapper.get("#project-name").setValue("x".repeat(81));

    await wrapper.get("form").trigger("submit");

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(wrapper.get('[role="alert"]').text()).toContain(
      "80 characters or fewer",
    );
  });

  it("shows a create API error in the form", async () => {
    createProjectMock.mockRejectedValueOnce(
      new ApiError("INVALID_PROJECT_NAME", "Name is already in use.", 400),
    );

    const { wrapper } = await mountForm();

    await wrapper.get("#project-name").setValue("Existing name");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain(
      "Name is already in use.",
    );
  });

  it("loads an existing project for editing", async () => {
    getProjectMock.mockResolvedValue(project());

    const { wrapper } = await mountForm("/projects/p1/edit");

    expect(getProjectMock).toHaveBeenCalledExactlyOnceWith("p1");
    expect(wrapper.text()).toContain("Edit project");

    expect(
      (wrapper.get("#project-name").element as HTMLInputElement).value,
    ).toBe("Studio cards");

    expect(buttonByText(wrapper, "Save changes").exists()).toBe(true);
  });

  it("updates the existing project with a trimmed name", async () => {
    getProjectMock.mockResolvedValue(project());
    updateProjectMock.mockResolvedValue(project({ name: "Studio redesign" }));

    const { wrapper, router } = await mountForm("/projects/p1/edit");

    await wrapper.get("#project-name").setValue("  Studio redesign  ");

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(updateProjectMock).toHaveBeenCalledExactlyOnceWith(
      "p1",
      "Studio redesign",
    );

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe("projects");
  });

  it("shows an update API error in the form", async () => {
    getProjectMock.mockResolvedValue(project());

    updateProjectMock.mockRejectedValueOnce(
      new ApiError("INVALID_PROJECT_NAME", "Name is too long.", 400),
    );

    const { wrapper } = await mountForm("/projects/p1/edit");

    await wrapper.get("#project-name").setValue("New name");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toContain("Name is too long.");
  });

  it("shows an error when an existing project cannot be loaded", async () => {
    getProjectMock.mockRejectedValueOnce(
      new ApiError("NOT_FOUND", "Project not found.", 404),
    );

    const { wrapper } = await mountForm("/projects/missing/edit");

    expect(wrapper.text()).toContain("Project not found.");
    expect(wrapper.text()).toContain("Back to projects");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("cancel navigates back to the projects list", async () => {
    const { wrapper, router } = await mountForm();

    await buttonByText(wrapper, "Cancel").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("projects");
    expect(createProjectMock).not.toHaveBeenCalled();
  });
});
