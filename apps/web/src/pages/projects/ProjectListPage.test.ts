import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CardProject } from "../../api/types";
import {
  ApiError,
  createProject,
  deleteProject,
  listProjects,
} from "../../api/projectsApi";
import ProjectListPage from "./ProjectListPage.vue";

vi.mock("../../api/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/projectsApi")>();
  return {
    ...actual,
    listProjects: vi.fn(),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
  };
});

const listProjectsMock = vi.mocked(listProjects);
const createProjectMock = vi.mocked(createProject);
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

async function mountPage() {
  const wrapper = mount(ProjectListPage);
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  listProjectsMock.mockResolvedValue({ projects: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ProjectListPage", () => {
  it("shows the loading state before projects arrive", async () => {
    let resolveList: (value: { projects: CardProject[] }) => void = () => {};
    listProjectsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    const wrapper = mount(ProjectListPage);

    expect(wrapper.text()).toContain("Loading projects…");

    resolveList({ projects: [project()] });
    await flushPromises();

    expect(wrapper.text()).toContain("Studio cards");
  });

  it("shows the empty state when there are no projects", async () => {
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("renders the loaded projects", async () => {
    listProjectsMock.mockResolvedValue({
      projects: [
        project({ name: "Café cards" }),
        project({ id: "p2", name: "Photo studio" }),
      ],
    });

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain("Café cards");
    expect(wrapper.text()).toContain("Photo studio");
  });

  it("shows an error with a retry that reloads the list", async () => {
    listProjectsMock.mockRejectedValueOnce(
      new ApiError(
        "NETWORK",
        "Could not reach the server. Check that the API is running.",
        0,
      ),
    );

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain("Could not load your projects.");

    listProjectsMock.mockResolvedValueOnce({ projects: [project()] });
    await buttonByText(wrapper, "Try again").trigger("click");
    await flushPromises();

    expect(listProjectsMock).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain("Studio cards");
  });

  it("creates a project with the trimmed name and prepends it to the list", async () => {
    const wrapper = await mountPage();

    createProjectMock.mockResolvedValueOnce(
      project({ id: "new-1", name: "Rounded corners" }),
    );
    await wrapper.find("#project-name").setValue("  Rounded corners  ");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createProjectMock).toHaveBeenCalledExactlyOnceWith(
      "Rounded corners",
    );
    expect(wrapper.text()).toContain("Rounded corners");
    expect(
      wrapper.findAll(".project-list li").map((item) => item.text()),
    ).toHaveLength(1);
    expect(
      (wrapper.find("#project-name").element as HTMLInputElement).value,
    ).toBe("");
    expect(wrapper.text()).toContain("Created “Rounded corners”.");
  });

  it("disables the create button while submitting", async () => {
    const wrapper = await mountPage();

    let resolveCreate: (value: CardProject) => void = () => {};
    createProjectMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    await wrapper.find("#project-name").setValue("Slow project");
    await wrapper.find("form").trigger("submit");

    const submittingButton = buttonByText(wrapper, "Creating…");
    expect(submittingButton.attributes("disabled")).toBeDefined();

    resolveCreate(project({ id: "slow", name: "Slow project" }));
    await flushPromises();

    expect(
      buttonByText(wrapper, "Create project").attributes("disabled"),
    ).toBeUndefined();
  });

  it("rejects an empty name without calling the API", async () => {
    const wrapper = await mountPage();

    await wrapper.find("#project-name").setValue("   ");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(createProjectMock).not.toHaveBeenCalled();
    expect(wrapper.find('[role="status"]').text()).toContain(
      "Enter a project name.",
    );
  });

  it("shows the server validation message on a 400 response", async () => {
    const wrapper = await mountPage();

    createProjectMock.mockRejectedValueOnce(
      new ApiError(
        "INVALID_NAME",
        "CardProject names must be 80 characters or fewer.",
        400,
      ),
    );
    await wrapper.find("#project-name").setValue("x".repeat(81));
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain(
      "CardProject names must be 80 characters or fewer.",
    );
  });

  it("deletes a project after a confirmation step", async () => {
    listProjectsMock.mockResolvedValue({ projects: [project()] });
    const wrapper = await mountPage();

    await buttonByText(wrapper, "Delete").trigger("click");
    expect(wrapper.text()).toContain("Confirm delete");

    deleteProjectMock.mockResolvedValueOnce(undefined);
    await buttonByText(wrapper, "Confirm delete").trigger("click");
    await flushPromises();

    expect(deleteProjectMock).toHaveBeenCalledExactlyOnceWith("p1");
    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("keeps the project when the delete confirmation is cancelled", async () => {
    listProjectsMock.mockResolvedValue({ projects: [project()] });
    const wrapper = await mountPage();

    await buttonByText(wrapper, "Delete").trigger("click");
    await buttonByText(wrapper, "Cancel").trigger("click");

    expect(deleteProjectMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Studio cards");
    expect(wrapper.text()).not.toContain("Confirm delete");
  });

  it("shows an alert when deletion fails", async () => {
    listProjectsMock.mockResolvedValue({ projects: [project()] });
    const wrapper = await mountPage();

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
