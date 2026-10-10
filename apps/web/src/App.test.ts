import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { listProjects } from "./api/projectsApi";
import App from "./App.vue";

vi.mock("./api/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/projectsApi")>();
  return {
    ...actual,
    listProjects: vi.fn(),
  };
});

const listProjectsMock = vi.mocked(listProjects);

beforeEach(() => {
  listProjectsMock.mockResolvedValue({ projects: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("App", () => {
  it("renders the app header and hosts the projects page", async () => {
    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.find("h1").text()).toBe("Business Cards");
    expect(wrapper.text()).toContain("Create and manage your card projects");
    expect(wrapper.text()).toContain("No projects yet.");
  });
});
