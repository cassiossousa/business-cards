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

const simpleFields = {
  fullName: "Alex Morgan",
  role: "Creative Developer",
  email: "alex@example.com",
  phone: "+55 11 99999-0000",
  website: "example.com",
};

function project(overrides: Partial<CardProject> = {}): CardProject {
  return {
    id: "p1",
    name: "Studio cards",
    createdAt: "2026-01-01T00:00:00.000Z",
    templateId: "simple",
    fields: { ...simpleFields },
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
    global: { plugins: [router] },
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
  it("creates a Simple project with a trimmed name and its card fields", async () => {
    createProjectMock.mockResolvedValue(project());
    const { wrapper, router } = await mountForm();

    expect(wrapper.text()).toContain("New project");
    expect(
      (wrapper.get("#template-simple").element as HTMLInputElement).checked,
    ).toBe(true);

    await wrapper.get("#project-name").setValue("  Rounded corners  ");
    await wrapper.get("#card-field-fullName").setValue("Jordan Lee");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(createProjectMock).toHaveBeenCalledExactlyOnceWith({
      name: "Rounded corners",
      templateId: "simple",
      fields: {
        ...simpleFields,
        fullName: "Jordan Lee",
      },
    });
    expect(router.currentRoute.value.name).toBe("projects");
  });

  it("lets a new project choose the QR Code template", async () => {
    createProjectMock.mockResolvedValue(
      project({
        templateId: "qr-code",
        fields: {
          ...simpleFields,
          qrUrl: "https://portfolio.example",
        },
      }),
    );

    const { wrapper } = await mountForm();

    await wrapper.get("#template-qr-code").setValue();

    expect(
      (wrapper.get("#template-qr-code").element as HTMLInputElement).checked,
    ).toBe(true);
    expect(wrapper.get("#card-field-qrUrl").exists()).toBe(true);

    await wrapper.get("#project-name").setValue("QR portfolio");
    await wrapper
      .get("#card-field-qrUrl")
      .setValue("https://portfolio.example");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(createProjectMock).toHaveBeenCalledExactlyOnceWith({
      name: "QR portfolio",
      templateId: "qr-code",
      fields: {
        ...simpleFields,
        qrUrl: "https://portfolio.example",
      },
    });
  });

  it("rejects an empty project name without calling the API", async () => {
    const { wrapper } = await mountForm();

    await wrapper.get("#project-name").setValue("   ");
    await wrapper.get("form").trigger("submit");

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      "Enter a project name.",
    );
  });

  it("rejects names longer than 80 characters", async () => {
    const { wrapper } = await mountForm();

    await wrapper.get("#project-name").setValue("x".repeat(81));
    await wrapper.get("form").trigger("submit");

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      "80 characters or fewer",
    );
  });

  it("requires a valid HTTP or HTTPS QR destination", async () => {
    const { wrapper } = await mountForm();

    await wrapper.get("#project-name").setValue("QR portfolio");
    await wrapper.get("#template-qr-code").setValue();
    await wrapper.get("#card-field-qrUrl").setValue("not a URL");
    await wrapper.get("form").trigger("submit");

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      "valid HTTP or HTTPS QR code destination",
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

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "Name is already in use.",
    );
  });

  it("loads an existing project's name, template, and fields", async () => {
    getProjectMock.mockResolvedValue(
      project({
        templateId: "qr-code",
        fields: {
          ...simpleFields,
          fullName: "Jordan Lee",
          qrUrl: "https://portfolio.example",
        },
      }),
    );

    const { wrapper } = await mountForm("/projects/p1/edit");

    expect(getProjectMock).toHaveBeenCalledExactlyOnceWith("p1");
    expect(wrapper.text()).toContain("Edit project");
    expect(wrapper.text()).toContain("QR Code");
    expect(wrapper.text()).toContain("template is fixed");
    expect(wrapper.find("#template-qr-code").exists()).toBe(false);
    expect(
      (wrapper.get("#project-name").element as HTMLInputElement).value,
    ).toBe("Studio cards");
    expect(
      (wrapper.get("#card-field-fullName").element as HTMLInputElement).value,
    ).toBe("Jordan Lee");
    expect(
      (wrapper.get("#card-field-qrUrl").element as HTMLInputElement).value,
    ).toBe("https://portfolio.example");
  });

  it("updates card fields without including a template ID in the request", async () => {
    getProjectMock.mockResolvedValue(
      project({
        templateId: "qr-code",
        fields: {
          ...simpleFields,
          qrUrl: "https://example.com",
        },
      }),
    );
    updateProjectMock.mockResolvedValue(
      project({
        name: "Updated portfolio",
        templateId: "qr-code",
        fields: {
          ...simpleFields,
          fullName: "Jordan Lee",
          qrUrl: "https://example.com",
        },
      }),
    );

    const { wrapper, router } = await mountForm("/projects/p1/edit");

    await wrapper.get("#project-name").setValue("  Updated portfolio  ");
    await wrapper.get("#card-field-fullName").setValue("Jordan Lee");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(updateProjectMock).toHaveBeenCalledExactlyOnceWith("p1", {
      name: "Updated portfolio",
      fields: {
        ...simpleFields,
        fullName: "Jordan Lee",
        qrUrl: "https://example.com",
      },
    });

    const updateInput = updateProjectMock.mock.calls[0][1];
    expect("templateId" in updateInput).toBe(false);
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

    expect(wrapper.find('[role="alert"]').text()).toContain(
      "Name is too long.",
    );
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

  it("cancels back to the projects list", async () => {
    const { wrapper, router } = await mountForm();

    await buttonByText(wrapper, "Cancel").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("projects");
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("shows a fallback message when project creation fails unexpectedly", async () => {
    createProjectMock.mockRejectedValueOnce(new Error("Database unavailable"));

    const { wrapper } = await mountForm();

    await wrapper.get("#project-name").setValue("QR portfolio");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(createProjectMock).toHaveBeenCalled();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      "Could not create the project. Try again.",
    );
  });
});
