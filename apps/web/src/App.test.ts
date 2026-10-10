import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory } from "vue-router";

import { listProjects } from "./api/projectsApi";
import App from "./App.vue";
import { createAppRouter } from "./router";
import { getThemePreference, setThemePreference } from "./theme/theme";

vi.mock("./api/projectsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/projectsApi")>();
  return {
    ...actual,
    listProjects: vi.fn(),
  };
});

vi.mock("./theme/theme", () => ({
  getThemePreference: vi.fn(() => "system"),
  setThemePreference: vi.fn(),
}));

const listProjectsMock = vi.mocked(listProjects);
const getThemePreferenceMock = vi.mocked(getThemePreference);
const setThemePreferenceMock = vi.mocked(setThemePreference);

beforeEach(() => {
  listProjectsMock.mockResolvedValue({ projects: [] });
  getThemePreferenceMock.mockReturnValue("system");
});

afterEach(() => {
  vi.clearAllMocks();
});

function mountApp() {
  const router = createAppRouter(createMemoryHistory());
  const wrapper = mount(App, { global: { plugins: [router] } });
  return { wrapper, router };
}

describe("App", () => {
  it("renders the navbar and hosts the projects page", async () => {
    const { wrapper } = mountApp();
    await flushPromises();

    expect(wrapper.find("h1").text()).toBe("Business Cards");
    expect(wrapper.text()).toContain("Create and manage your card projects");
    expect(wrapper.text()).toContain("No projects yet.");
  });

  it("redirects the index route to /projects", async () => {
    const { router } = mountApp();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/projects");
  });

  it("offers light, dark, and system theme choices", async () => {
    getThemePreferenceMock.mockReturnValue("dark");
    const { wrapper } = mountApp();
    await flushPromises();

    const select = wrapper.get("select");
    const options = select.findAll("option");
    expect(options.map((option) => option.element.value)).toEqual([
      "light",
      "dark",
      "system",
    ]);
    expect((select.element as HTMLSelectElement).value).toBe("dark");
  });

  it("applies a theme change through setThemePreference", async () => {
    const { wrapper } = mountApp();
    await flushPromises();

    await wrapper.get("select").setValue("dark");

    expect(setThemePreferenceMock).toHaveBeenCalledWith("dark");
    expect((wrapper.get("select").element as HTMLSelectElement).value).toBe(
      "dark",
    );
  });

  it("navigates to /projects from the navbar link", async () => {
    const { wrapper, router } = mountApp();
    await flushPromises();

    await wrapper.get('nav[aria-label="Main"] a').trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/projects");
    expect(wrapper.get("main").text()).toContain("No projects yet.");
  });

  it("marks the current page link with aria-current", async () => {
    const { wrapper } = mountApp();
    await flushPromises();

    const link = wrapper.get('nav[aria-label="Main"] a');
    expect(link.attributes("aria-current")).toBe("page");
  });
});
